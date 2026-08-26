/**
 * sprint-progress-report：取数 → 计算 → 渲染主干。
 * 数据只经 fetchData 进出；布局是固定骨架，模型不改排版。
 */
export const inputSchema = {
  type: 'object',
  properties: {
    projectId: { type: 'string', description: 'Project id; defaults to the currently selected project.' }
  }
};

/** 需求状态展示映射：数据值保持英文枚举，只在渲染前转中文 */
const REQ_STATUS_ZH = { Todo: '待开发', 'In Progress': '进行中', Done: '已完成' };

export async function run(input, context) {
  if (typeof context.fetchData !== 'function') {
    return [
      {
        type: 'text',
        text: 'DATA_SOURCE_UNAVAILABLE: fetchData is not wired by the host; cannot read sprint data.'
      }
    ];
  }
  const params = typeof input.projectId === 'string' && input.projectId ? { projectId: input.projectId } : {};
  const sprints = await context.fetchData('sprints', params);
  const requirements = await context.fetchData('requirements', params);

  const active = sprints.find((s) => s.status === 'Active') ?? sprints[0];
  if (!active) {
    return [{ type: 'text', text: 'No sprint found for this project.' }];
  }

  const spOf = (list) => list.reduce((sum, r) => sum + (r.storyPoints || 0), 0);
  const doneList = requirements.filter((r) => r.status === 'Done');
  const doingList = requirements.filter((r) => r.status === 'In Progress');
  const todoList = requirements.filter((r) => r.status === 'Todo');
  const done = spOf(doneList);
  const doing = spOf(doingList);
  const todo = spOf(todoList);
  const total = done + doing + todo;
  const completion = total > 0 ? Math.round((done / total) * 100) : 0;
  const remaining = doing + todo;
  const atRisk = remaining > active.velocity;

  const node = {
    component: 'Card',
    props: { title: `${active.name} — 迭代进展` },
    children: [
      {
        component: 'Grid',
        props: { columns: 'auto', minColumnWidth: 'md' },
        children: [
          // Grid 的格子必须自成容器（Card/Stack）——这是 catalog 的硬约束
          {
            component: 'Stack',
            children: [
              {
                component: 'Gauge',
                props: {
                  label: '完成率',
                  value: completion,
                  tone: completion >= 80 ? 'success' : completion >= 50 ? 'warning' : 'neutral'
                }
              }
            ]
          },
          {
            component: 'Stack',
            children: [
              {
                component: 'KeyValue',
                props: {
                  items: [
                    { label: '已燃尽', value: `${done} SP` },
                    { label: '剩余', value: `${remaining} SP` },
                    { label: '速率目标', value: `${active.velocity} SP` },
                    { label: '时间窗', value: `${active.startDate} → ${active.endDate}` }
                  ]
                }
              }
            ]
          }
        ]
      },
      {
        component: 'Chart',
        props: {
          // 堆叠柱：状态构成之外还能看出优先级占比（viewer 已支持 stacked-bar）
          type: 'stacked-bar',
          title: '故事点分布（状态 × 优先级）',
          labels: ['已完成', '进行中', '待开发'],
          series: [
            { name: '高优先级', values: [doneList, doingList, todoList].map((l) => spOf(l.filter((r) => r.priority === 'High'))) },
            { name: '中优先级', values: [doneList, doingList, todoList].map((l) => spOf(l.filter((r) => r.priority === 'Medium'))) },
            { name: '低优先级', values: [doneList, doingList, todoList].map((l) => spOf(l.filter((r) => r.priority === 'Low'))) }
          ]
        }
      },
      {
        component: 'Table',
        props: {
          title: '未完成事项',
          columns: ['编号', '标题', '状态', '故事点'],
          rows: [...doingList, ...todoList].map((r) => [r.id, r.title ?? r.title_en, REQ_STATUS_ZH[r.status] ?? r.status, r.storyPoints ?? 0])
        }
      },
      ...(atRisk
        ? [
            {
              component: 'Callout',
              props: {
                title: '收尾风险',
                text: `剩余 ${remaining} SP 超出 ${active.velocity} SP 的速率目标，建议缩减范围或移入下一迭代。`,
                palette: 'amber'
              }
            }
          ]
        : [])
    ]
  };

  return [{ type: 'json', data: { $surface: [{ type: 'open', id: 'sprint-progress', node }] } }];
}
