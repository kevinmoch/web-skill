/**
 * sprint-weekly-brief（档 1：模板报告）。
 * 模板是 references/brief.json 的固定骨架；模型只写 highlights 文字，
 * 数据与排版全由脚本决定——同一问题问三次，结构完全一致，只有数据变。
 */

export const inputSchema = {
  type: 'object',
  properties: {
    projectId: { type: 'string', description: 'Project id; defaults to the currently selected project.' },
    highlights: { type: 'string', description: '2-3 highlight sentences written by the model.' }
  },
  required: []
};

/** 深度填充：整串占位符按原值替换保形（数组/对象直接落位）；禁止拼字符串后 JSON.parse */
function fill(node, values) {
  if (typeof node === 'string') {
    const whole = /^\{\{(\w+)\}\}$/.exec(node);
    if (whole) return values[whole[1]] !== undefined ? values[whole[1]] : '';
    return node.replace(/\{\{(\w+)\}\}/g, (_, key) => (values[key] === undefined ? '' : String(values[key])));
  }
  if (Array.isArray(node)) return node.map((child) => fill(child, values));
  if (node !== null && typeof node === 'object') {
    return Object.fromEntries(Object.entries(node).map(([key, value]) => [key, fill(value, values)]));
  }
  return node;
}

export async function run(input, context) {
  if (typeof context.fetchData !== 'function') {
    return [{ type: 'text', text: 'DATA_SOURCE_UNAVAILABLE: fetchData is not wired by the host.' }];
  }
  const params = typeof input.projectId === 'string' && input.projectId ? { projectId: input.projectId } : {};
  const sprints = await context.fetchData('sprints', params);
  const requirements = await context.fetchData('requirements', params);

  const active = sprints.find((s) => s.status === 'Active') ?? sprints[0];
  if (!active) return [{ type: 'text', text: 'No sprint found for this project.' }];

  const spOf = (list) => list.reduce((sum, r) => sum + (r.storyPoints || 0), 0);
  const doneList = requirements.filter((r) => r.status === 'Done');
  const doingList = requirements.filter((r) => r.status === 'In Progress');
  const todoList = requirements.filter((r) => r.status === 'Todo');
  const done = spOf(doneList);
  const doing = spOf(doingList);
  const todo = spOf(todoList);
  const total = done + doing + todo;
  const completion = total > 0 ? Math.round((done / total) * 100) : 0;

  if (typeof input.highlights !== 'string' || input.highlights.trim() === '') {
    return [
      {
        type: 'text',
        text: [
          `Brief digest for ${active.name}: ${completion}% complete — ${done} SP done, ${doing} SP in progress, ${todo} SP todo (velocity target ${active.velocity} SP).`,
          `Open items: ${doingList.length + todoList.length}.`,
          'Now write 2-3 highlight sentences and call this skill again with them as the "highlights" argument.',
          'Do not send the digest back — it is re-fetched inside the script.'
        ].join(' ')
      }
    ];
  }

  const risks = [];
  if (doing + todo > active.velocity) {
    risks.push({
      component: 'Callout',
      props: {
        title: '范围风险',
        text: `剩余 ${doing + todo} SP 超出 ${active.velocity} SP 的速率目标。`,
        palette: 'amber'
      }
    });
  }
  const staleTodo = todoList.filter((r) => r.priority === 'High');
  if (staleTodo.length > 0) {
    risks.push({
      component: 'Callout',
      props: {
        title: '高优先级事项未启动',
        text: staleTodo.map((r) => r.id).join(', '),
        palette: 'rose'
      }
    });
  }
  if (risks.length === 0) {
    risks.push({
      component: 'Callout',
      props: { title: '无阻塞风险', text: '当前迭代进展在速率目标以内。', palette: 'emerald' }
    });
  }

  const template = JSON.parse(await context.readReference('brief.json'));
  const node = fill(template, {
    sprintName: active.name ?? active.name_en,
    kpis: [
      { label: '完成率', value: `${completion}%` },
      { label: '已燃尽', value: `${done} SP` },
      { label: '剩余', value: `${doing + todo} SP` }
    ],
    burn: {
      // 堆叠柱：燃尽构成按优先级分层（viewer 已支持 stacked-bar）
      type: 'stacked-bar',
      title: '故事点分布（状态 × 优先级）',
      labels: ['已完成', '进行中', '待开发'],
      series: [
        { name: '高优先级', values: [doneList, doingList, todoList].map((l) => spOf(l.filter((r) => r.priority === 'High'))) },
        { name: '中优先级', values: [doneList, doingList, todoList].map((l) => spOf(l.filter((r) => r.priority === 'Medium'))) },
        { name: '低优先级', values: [doneList, doingList, todoList].map((l) => spOf(l.filter((r) => r.priority === 'Low'))) }
      ]
    },
    highlights: input.highlights,
    risks,
    generatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
  });

  return [{ type: 'json', data: { $surface: [{ type: 'open', id: 'sprint-weekly-brief', node }] } }];
}
