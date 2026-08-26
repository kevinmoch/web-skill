/**
 * cross-project-health：fetchData 多次调用与聚合的演示。
 * 对每个项目各取一遍数据，计算健康分并排名。
 */

export const inputSchema = { type: 'object', properties: {} };

const scoreOf = ({ criticalOpen, majorOpen, avgCoverage, avgPass, completion }) =>
  Math.max(
    0,
    Math.min(
      100,
      Math.round(0.35 * completion + 0.25 * avgPass + 0.25 * avgCoverage - 15 * criticalOpen - 5 * majorOpen + 20)
    )
  );

export async function run(_input, context) {
  if (typeof context.fetchData !== 'function') {
    return [{ type: 'text', text: 'DATA_SOURCE_UNAVAILABLE: fetchData is not wired by the host.' }];
  }
  const projects = await context.fetchData('projects', {});

  const rows = [];
  for (const p of projects) {
    const [requirements, bugs, suites] = await Promise.all([
      context.fetchData('requirements', { projectId: p.id }),
      context.fetchData('bugs', { projectId: p.id }),
      context.fetchData('testSuites', { projectId: p.id })
    ]);
    const done = requirements.filter((r) => r.status === 'Done').length;
    const completion = requirements.length ? Math.round((done / requirements.length) * 100) : 0;
    const open = bugs.filter((b) => b.status === 'Open');
    const criticalOpen = open.filter((b) => b.severity === 'Critical').length;
    const majorOpen = open.filter((b) => b.severity === 'Major').length;
    const avgCoverage = suites.length ? Math.round(suites.reduce((s, t) => s + t.coverage, 0) / suites.length) : 0;
    const avgPass = suites.length ? Math.round(suites.reduce((s, t) => s + t.passRate, 0) / suites.length) : 0;
    rows.push({
      name: p.name ?? p.name_en,
      key: p.key,
      completion,
      criticalOpen,
      majorOpen,
      avgCoverage,
      avgPass,
      health: scoreOf({ criticalOpen, majorOpen, avgCoverage, avgPass, completion })
    });
  }

  rows.sort((a, b) => b.health - a.health);
  const laggards = rows.filter((r) => r.health < 60);

  const node = {
    component: 'Stack',
    props: { gap: 'md' },
    children: [
      {
        component: 'Chart',
        props: {
          // 双轴折线：健康分（左轴）与平均通过率（右轴）同图对照（viewer 已支持 dual-axis）
          type: 'dual-axis',
          title: '各项目交付健康度 × 平均通过率',
          labels: rows.map((r) => r.key),
          series: [
            { name: '健康分', values: rows.map((r) => r.health) },
            { name: '平均通过率 %', values: rows.map((r) => r.avgPass) }
          ]
        }
      },
      {
        component: 'Table',
        props: {
          title: '排名',
          columns: ['#', '项目', '健康分', '完成率 %', '未关闭致命缺陷', '覆盖率 %', '通过率 %'],
          rows: rows.map((r, i) => [i + 1, r.name, r.health, r.completion, r.criticalOpen, r.avgCoverage, r.avgPass])
        }
      },
      ...(laggards.length > 0
        ? laggards.map((r) => ({
            component: 'Callout',
            props: {
              title: `${r.name} 掉队`,
              text: `健康分 ${r.health}。主因：${r.criticalOpen} 个致命缺陷未关闭、覆盖率 ${r.avgCoverage}%、通过率 ${r.avgPass}%。`,
              palette: 'rose'
            }
          }))
        : [
            {
              component: 'Callout',
              props: { title: '无掉队项目', text: '所有项目的交付健康分均在 60 分以上。', palette: 'emerald' }
            }
          ])
    ]
  };

  return [{ type: 'json', data: { $surface: [{ type: 'open', id: 'cross-project-health', node }] } }];
}
