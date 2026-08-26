/**
 * agile-ops-dashboard：一页式敏捷运营监控大屏。
 * 在一次渲染里把组件目录用广：KeyValue / Gauge / Progress / Chart / Table /
 * Callout / Quote / Carousel / Image / Icon / Badge。
 * 配色只走 palette / tone 语义——深浅色由组件层自动跟随。
 */

export const inputSchema = {
  type: 'object',
  properties: {
    projectId: { type: 'string', description: 'Project id; defaults to the currently selected project.' }
  }
};

/** 状态展示映射：数据值保持英文枚举，只在渲染前转中文 */
const SUITE_STATUS_ZH = { Passed: '通过', Failed: '未通过' };

export async function run(input, context) {
  if (typeof context.fetchData !== 'function') {
    return [{ type: 'text', text: 'DATA_SOURCE_UNAVAILABLE: fetchData is not wired by the host.' }];
  }
  const params = typeof input.projectId === 'string' && input.projectId ? { projectId: input.projectId } : {};
  const [sprints, requirements, bugs, suites, metrics, projects] = await Promise.all([
    context.fetchData('sprints', params),
    context.fetchData('requirements', params),
    context.fetchData('bugs', params),
    context.fetchData('testSuites', params),
    context.fetchData('metrics', params),
    context.fetchData('projects', {})
  ]);

  const active = sprints.find((s) => s.status === 'Active') ?? sprints[0];
  const spOf = (list) => list.reduce((sum, r) => sum + (r.storyPoints || 0), 0);
  const doneList = requirements.filter((r) => r.status === 'Done');
  const doingList = requirements.filter((r) => r.status === 'In Progress');
  const todoList = requirements.filter((r) => r.status === 'Todo');
  const done = spOf(doneList);
  const remaining = spOf(doingList) + spOf(todoList);
  const total = done + remaining;
  const completion = total > 0 ? Math.round((done / total) * 100) : 0;

  const open = bugs.filter((b) => b.status === 'Open');
  const sevCount = (sev) => open.filter((b) => b.severity === sev).length;
  const moduleHotspots = Object.entries(
    open.reduce((acc, b) => {
      const key = b.module ?? b.module_en;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // 风险提示规则
  const risks = [];
  if (sevCount('Critical') > 0) {
    risks.push({
      component: 'Callout',
      props: { title: '存在未关闭致命缺陷', text: `迭代中期仍有 ${sevCount('Critical')} 个致命缺陷未关闭。`, palette: 'rose' }
    });
  }
  if (active && remaining > active.velocity) {
    risks.push({
      component: 'Callout',
      props: { title: '迭代收尾风险', text: `剩余 ${remaining} SP 超出速率目标 ${active.velocity} SP。`, palette: 'amber' }
    });
  }
  const weakSuites = suites.filter((t) => t.coverage < 70);
  if (weakSuites.length > 0) {
    risks.push({
      component: 'Callout',
      props: { title: '覆盖率缺口', text: `${weakSuites.map((t) => t.suite ?? t.suite_en).join('、')} 覆盖率低于 70%。`, palette: 'amber' }
    });
  }
  if (risks.length === 0) {
    risks.push({ component: 'Callout', props: { title: '一切正常', text: '未触发任何风险规则。', palette: 'emerald' } });
  }

  const node = {
    component: 'Stack',
    props: { gap: 'md' },
    children: [
      // 顶部 KPI 带：DORA 四项
      {
        component: 'KeyValue',
        props: {
          items: [
            { label: '交付前置时间', value: `${metrics.leadTime} 天` },
            { label: '周期时间', value: `${metrics.cycleTime} 天` },
            { label: '部署频率', value: `${metrics.deploymentFrequency} 次/周` },
            { label: '变更失败率', value: `${metrics.failureRate}%` }
          ]
        }
      },
      // 迭代健康
      {
        component: 'Grid',
        props: { columns: 'auto', minColumnWidth: 'md' },
        children: [
          // Grid 的格子必须自成容器（Card/Stack）——catalog 硬约束
          {
            component: 'Stack',
            children: [
              { component: 'Gauge', props: { label: '迭代完成率', value: completion, tone: completion >= 80 ? 'success' : 'warning' } }
            ]
          },
          {
            component: 'Card',
            props: { title: active ? active.name : '迭代' },
            children: [
              {
                component: 'Progress',
                props: {
                  label: `已燃尽 ${done} SP / 速率目标 ${active ? active.velocity : 0} SP`,
                  value: active && active.velocity > 0 ? Math.min(100, Math.round((done / active.velocity) * 100)) : 0,
                  // tone 枚举只有 neutral/success/warning（与 Gauge 相同）；写别的会被降级剔除
                  tone: 'success'
                }
              },
              ...(active?.goal || active?.goal_en
                ? [{ component: 'Quote', props: { text: active.goal ?? active.goal_en, by: '迭代目标' } }]
                : [])
            ]
          }
        ]
      },
      // 需求分布 + 缺陷热点
      {
        component: 'Grid',
        props: { columns: 'auto', minColumnWidth: 'md' },
        children: [
          {
            component: 'Stack',
            children: [
              {
                component: 'Chart',
                props: {
                  type: 'stacked-bar',
                  title: '需求分布（优先级 × 状态）',
                  labels: ['高', '中', '低'],
                  series: [
                    { name: '待开发', values: ['High', 'Medium', 'Low'].map((p) => todoList.filter((r) => r.priority === p).length) },
                    { name: '进行中', values: ['High', 'Medium', 'Low'].map((p) => doingList.filter((r) => r.priority === p).length) },
                    { name: '已完成', values: ['High', 'Medium', 'Low'].map((p) => doneList.filter((r) => r.priority === p).length) }
                  ]
                }
              }
            ]
          },
          {
            component: 'Stack',
            children: [
              {
                component: 'Chart',
                props: {
                  type: 'pie',
                  title: '未关闭缺陷（按严重程度）',
                  labels: ['致命', '严重', '轻微'],
                  series: [{ name: '未关闭缺陷', values: [sevCount('Critical'), sevCount('Major'), sevCount('Minor')] }]
                }
              }
            ]
          }
        ]
      },
      {
        component: 'Table',
        props: {
          title: '缺陷模块热点',
          columns: ['模块', '未关闭缺陷'],
          rows: moduleHotspots.map(([m, c]) => [m, c])
        }
      },
      // 测试质量
      {
        component: 'Table',
        props: {
          title: '测试质量',
          columns: ['套件', '覆盖率 %', '通过率 %', '状态'],
          rows: suites.map((t) => [t.suite ?? t.suite_en, t.coverage, t.passRate, SUITE_STATUS_ZH[t.status] ?? t.status])
        }
      },
      // 风险提示
      ...risks,
      // 缺陷截图墙（同源图片，Image 有同源硬校验）
      {
        component: 'Card',
        props: { title: '缺陷截图墙' },
        children: [
          {
            component: 'Grid',
            props: { columns: 'auto', minColumnWidth: 'sm' },
            children: [1, 2, 3, 4].map((n) => ({
              component: 'Stack',
              children: [
                {
                  component: 'Image',
                  props: { src: `/demo/attachment/AGENT-BUG-0${n}.jpg`, alt: `缺陷截图 AGENT-BUG-0${n}`, ratio: '16:9' }
                }
              ]
            }))
          }
        ]
      },
      // 项目速览（多项目分页）
      {
        component: 'Carousel',
        props: {
          items: projects.map((p) => ({ title: p.name ?? p.name_en, text: `${p.key} · ${p.status ?? p.status_en}` }))
        }
      },
      // 图例
      {
        component: 'Stack',
        props: { gap: 'sm' },
        children: [
          {
            component: 'Badge',
            props: { text: '实时工作区数据', tone: 'info', palette: 'sky' }
          }
        ]
      }
    ]
  };

  return [{ type: 'json', data: { $surface: [{ type: 'open', id: 'agile-ops-dashboard', node }] } }];
}
