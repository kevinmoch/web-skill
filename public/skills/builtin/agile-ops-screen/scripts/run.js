/**
 * agile-ops-screen（档 2：深蓝监控大屏 + 独立文档面）。
 * 一次调用完成：取数 → 计算 → 填模板 → 写产物（隐藏自动下载卡）→ 返回打开按钮。
 * 数据只经 fetchData 进出，模型不碰布局与统计值。
 */

export const inputSchema = {
  type: 'object',
  properties: {
    projectId: { type: 'string', description: 'Project id; defaults to the currently selected project.' }
  },
  required: []
};

const escapeText = (value) =>
  String(value).replace(/[&<>]/g, (char) => (char === '&' ? '&amp;' : char === '<' ? '&lt;' : '&gt;'));

/** 属性位：先 JSON 序列化再转义引号——值因此关不掉属性、更关不掉标签 */
const escapeAttr = (value) => escapeText(JSON.stringify(value)).replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function fill(template, values) {
  return template.replace(/\{\{(json|text):(\w+)\}\}/g, (_, mode, key) => {
    const value = values[key];
    if (value === undefined) return '';
    return mode === 'json' ? escapeAttr(value) : escapeText(value);
  });
}

/** 严重程度的展示顺序与中文映射（数据值保持英文枚举） */
const SEVERITIES = [
  ['Critical', '致命'],
  ['Major', '严重'],
  ['Minor', '轻微']
];
const SUITE_STATUS_ZH = { Passed: '通过', Failed: '未通过' };
const REQ_STATUS_ZH = { Todo: '待开发', 'In Progress': '进行中', Done: '已完成' };
const PRIORITIES = [
  ['High', '高'],
  ['Medium', '中'],
  ['Low', '低']
];

export async function run(input, context) {
  if (typeof context.fetchData !== 'function') {
    return [
      { type: 'text', text: 'DATA_SOURCE_UNAVAILABLE: fetchData is not wired by the host; cannot build the screen.' }
    ];
  }
  const params = typeof input.projectId === 'string' && input.projectId ? { projectId: input.projectId } : {};
  const [projects, sprints, requirements, bugs, suites, metrics] = await Promise.all([
    context.fetchData('projects', {}),
    context.fetchData('sprints', params),
    context.fetchData('requirements', params),
    context.fetchData('bugs', params),
    context.fetchData('testSuites', params),
    context.fetchData('metrics', params)
  ]);

  const project =
    projects.find((p) => p.id === input.projectId) ?? projects.find((p) => p.id === params.projectId) ?? projects[0];
  const active = sprints.find((s) => s.status === 'Active') ?? sprints[0];

  const spOf = (list) => list.reduce((sum, r) => sum + (r.storyPoints || 0), 0);
  const done = spOf(requirements.filter((r) => r.status === 'Done'));
  const doing = spOf(requirements.filter((r) => r.status === 'In Progress'));
  const todo = spOf(requirements.filter((r) => r.status === 'Todo'));

  const open = bugs.filter((b) => b.status === 'Open');
  const sevCount = (sev) => open.filter((b) => b.severity === sev).length;
  const avgCoverage = suites.length ? Math.round(suites.reduce((s, t) => s + t.coverage, 0) / suites.length) : 0;
  const avgPass = suites.length ? Math.round(suites.reduce((s, t) => s + t.passRate, 0) / suites.length) : 0;

  const sevRank = { Critical: 0, Major: 1, Minor: 2 };
  const defectRows = [...open]
    .sort((a, b) => (sevRank[a.severity] ?? 3) - (sevRank[b.severity] ?? 3))
    .slice(0, 8)
    .map((b) => [
      b.id,
      b.title,
      SEVERITIES.find(([en]) => en === b.severity)?.[1] ?? b.severity,
      b.module ?? b.module_en,
      b.assignee ?? '—'
    ]);

  const statusRank = { 'In Progress': 0, Todo: 1, Done: 2 };
  const reqRows = [...requirements]
    .sort((a, b) => (statusRank[a.status] ?? 3) - (statusRank[b.status] ?? 3))
    .slice(0, 10)
    .map((r) => [
      r.id,
      r.title ?? r.title_en,
      PRIORITIES.find(([en]) => en === r.priority)?.[1] ?? r.priority,
      REQ_STATUS_ZH[r.status] ?? r.status,
      r.storyPoints ?? 0
    ]);

  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const values = {
    title: '敏捷运营监控大屏',
    subtitle: project ? `${project.name}（${project.key}）` : '',
    timestamp: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`,
    kpiRequirements: { label: '需求总数', value: `${requirements.length} 项`, change: `${done + doing + todo} SP` },
    kpiSprintProgress: {
      label: '当前迭代进度',
      value: `${active ? active.progress : 0}%`,
      change: active ? active.name : '无进行中迭代'
    },
    kpiOpenDefects: {
      label: '未关闭缺陷',
      value: String(open.length),
      change: `致命 ${sevCount('Critical')} · 严重 ${sevCount('Major')}`
    },
    kpiPassRate: {
      label: '平均通过率',
      value: `${avgPass}%`,
      change: `覆盖率 ${avgCoverage}% · ${suites.length} 个套件`
    },
    kpiLeadTime: { label: '交付前置时间', value: `${metrics.leadTime} 天`, change: `周期时间 ${metrics.cycleTime} 天` },
    kpiDeploy: {
      label: '部署频率',
      value: `${metrics.deploymentFrequency} 次/周`,
      change: `变更失败率 ${metrics.failureRate}%`
    },
    bugSeverityPie: {
      type: 'pie',
      title: '',
      labels: SEVERITIES.map(([, zh]) => zh),
      series: [{ name: '未关闭缺陷', values: SEVERITIES.map(([en]) => sevCount(en)) }]
    },
    sprintProgressLine: {
      type: 'area',
      title: '',
      labels: sprints.map((s) => s.name),
      series: [{ name: '进度 %', values: sprints.map((s) => s.progress) }]
    },
    reqStatusStacked: {
      type: 'stacked-bar',
      title: '',
      labels: ['已完成', '进行中', '待开发'],
      series: PRIORITIES.map(([en, zh]) => ({
        name: `${zh}优先级`,
        values: ['Done', 'In Progress', 'Todo'].map((st) =>
          spOf(requirements.filter((r) => r.status === st && r.priority === en))
        )
      }))
    },
    reqListTable: {
      title: '',
      columns: ['ID', '标题', '优先级', '状态', '故事点'],
      rows: reqRows
    },
    suiteTrendLine: {
      type: 'dual-axis',
      title: '',
      labels: suites.map((t) => t.suite ?? t.suite_en),
      series: [
        { name: '通过率 %', values: suites.map((t) => t.passRate) },
        { name: '覆盖率 %', values: suites.map((t) => t.coverage) }
      ]
    },
    defectTable: {
      title: '',
      columns: ['ID', '标题', '严重程度', '模块', '经办人'],
      rows: defectRows
    },
    suiteTable: {
      title: '',
      columns: ['套件', '覆盖率 %', '通过率 %', '状态'],
      rows: suites.map((t) => [t.suite ?? t.suite_en, t.coverage, t.passRate, SUITE_STATUS_ZH[t.status] ?? t.status])
    },
    footer: '由 Agile Studio 生成 · 数据来自当前项目的需求 / 迭代 / 缺陷 / 测试套件'
  };

  const html = fill(await context.readReference('screen.html'), values);
  const css = await context.readReference('screen.css');

  // resultCard: false —— 大屏只在独立文档面展示，会话里不出自动下载卡（SDK 分册 18）
  await context.writeArtifact('screen.html', html, { mimeType: 'text/html', metadata: { resultCard: false } });
  await context.writeArtifact('screen.css', css, { mimeType: 'text/css', metadata: { resultCard: false } });

  // 宿主没接文档面时按钮根本不会渲染（SDK 分册 13 FR-13.3），
  // 发了就是「模型以为有、用户看不到」——改回一句实话。
  if (context.documentSurface !== true) {
    return [
      {
        type: 'text',
        text: 'The monitoring screen artifacts were written, but this host has no document surface, so there is no way to open them here. Tell the user the screen is available in the managed skill storage and summarize the key metrics inline instead.'
      }
    ];
  }

  return [
    // 会话内直接给「查看监控大屏」按钮（SDK 内置 OpenDocument；点击即真实用户手势）。
    // 不写 label：缺省文案跟随宿主界面语言，写死就把技能钉死在一种语言上。
    {
      type: 'json',
      data: {
        $surface: [
          {
            type: 'open',
            id: 'ops-screen-open',
            node: {
              component: 'OpenDocument',
              props: {
                artifact: 'screen.html',
                style: 'screen.css',
                dataSource: 'fetchData: projects / sprints / requirements / bugs / testSuites / metrics'
              }
            }
          }
        ]
      }
    },
    {
      type: 'text',
      text: 'Monitoring screen is ready. The open-screen button in this result is already rendered and is the ONLY UI entry point — do NOT call render_ui or emit any other UI, chart, button or link for it, and do not mention downloads or attachments. Reply with one or two sentences pointing the user to that button; do not restate the numbers shown on the screen.'
    }
  ];
}
