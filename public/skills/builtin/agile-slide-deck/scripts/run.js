/**
 * agile-slide-deck（档 3：reveal.js 幻灯片 + 独立文档面）。
 * 对三个演示项目做一次横向综合分析，一次调用产出八页幻灯片：
 * 取数 → 计算 → 填模板 → 写产物（隐藏自动下载卡）→ 返回打开按钮。
 * 数据只经 fetchData 进出，模型不碰版式与统计值。
 */

export const inputSchema = { type: 'object', properties: {} };

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

const SEVERITIES = [
  ['Critical', '致命'],
  ['Major', '严重'],
  ['Minor', '轻微']
];

const pct = (part, whole) => (whole ? Math.round((part / whole) * 100) : 0);
const avg = (list, pick) => (list.length ? Math.round(list.reduce((sum, x) => sum + pick(x), 0) / list.length) : 0);

/** 与 cross-project-health 同一套公式：同一份演示数据不该给出两个互相打架的健康分 */
const healthOf = ({ criticalOpen, majorOpen, avgCoverage, avgPass, completion }) =>
  Math.max(
    0,
    Math.min(
      100,
      Math.round(0.35 * completion + 0.25 * avgPass + 0.25 * avgCoverage - 15 * criticalOpen - 5 * majorOpen + 20)
    )
  );

/**
 * 一句可执行的建议。先看横向对比（这页的主题就是三个项目放一起看），
 * 再落到绝对红线；最多两条——列全等于没说。
 */
function adviceOf(p, all) {
  const worst = (pick) => all.every((o) => pick(p) >= pick(o));
  const lowest = (pick) => all.every((o) => pick(p) <= pick(o));
  const issues = [];
  if (p.criticalOpen > 0 && worst((x) => x.criticalOpen)) {
    issues.push(`致命缺陷 ${p.criticalOpen} 个、三项目最多，先清空再谈新需求排期`);
  }
  if (lowest((x) => x.completion)) issues.push(`需求完成率 ${p.completion}% 垫底，把未开工需求退回待办池`);
  if (lowest((x) => x.avgCoverage)) issues.push(`平均覆盖率 ${p.avgCoverage}% 垫底，补齐核心链路自动化用例`);
  if (p.criticalOpen > 0) issues.push(`${p.criticalOpen} 个未关闭致命缺陷待清空`);
  if (p.failedSuites > 0) issues.push(`${p.failedSuites} 个测试套件未通过，先修红再合并`);
  if (issues.length === 0) return `交付节奏健康，保持 ${p.velocity} 点/迭代的速率并把经验沉淀为模板。`;
  return `${issues.slice(0, 2).join('；')}。`;
}

export async function run(_input, context) {
  if (typeof context.fetchData !== 'function') {
    return [
      {
        type: 'text',
        text: 'DATA_SOURCE_UNAVAILABLE: fetchData is not wired by the host; cannot build the slide deck.'
      }
    ];
  }

  const [projects, metrics] = await Promise.all([context.fetchData('projects', {}), context.fetchData('metrics', {})]);

  const stats = [];
  const openBugs = [];
  for (const p of projects) {
    const [requirements, sprints, bugs, suites] = await Promise.all([
      context.fetchData('requirements', { projectId: p.id }),
      context.fetchData('sprints', { projectId: p.id }),
      context.fetchData('bugs', { projectId: p.id }),
      context.fetchData('testSuites', { projectId: p.id })
    ]);

    const sp = (list) => list.reduce((sum, r) => sum + (r.storyPoints || 0), 0);
    const open = bugs.filter((b) => b.status === 'Open');
    for (const b of open) openBugs.push({ ...b, projectKey: p.key });

    stats.push({
      id: p.id,
      key: p.key,
      name: p.name ?? p.name_en,
      status: p.status ?? p.status_en,
      reqTotal: requirements.length,
      completion: pct(requirements.filter((r) => r.status === 'Done').length, requirements.length),
      spTotal: sp(requirements),
      spCompletion: pct(sp(requirements.filter((r) => r.status === 'Done')), sp(requirements)),
      sprintCount: sprints.length,
      sprintProgress: sprints.map((s) => s.progress),
      velocity: avg(sprints, (s) => s.velocity),
      openCount: open.length,
      criticalOpen: open.filter((b) => b.severity === 'Critical').length,
      majorOpen: open.filter((b) => b.severity === 'Major').length,
      minorOpen: open.filter((b) => b.severity === 'Minor').length,
      suiteCount: suites.length,
      failedSuites: suites.filter((t) => t.status === 'Failed').length,
      totalCases: suites.reduce((sum, t) => sum + (t.totalCases || 0), 0),
      avgCoverage: avg(suites, (t) => t.coverage),
      avgPass: avg(suites, (t) => t.passRate)
    });
  }
  for (const s of stats) s.health = healthOf(s);

  const ranked = [...stats].sort((a, b) => b.health - a.health);
  const leader = ranked[0];
  const laggard = ranked[ranked.length - 1];
  const maxSprints = Math.max(...stats.map((s) => s.sprintCount), 0);
  const sevRank = { Critical: 0, Major: 1, Minor: 2 };

  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const gaugeTone = (v) => (v >= 90 ? 'success' : v >= 80 ? 'neutral' : 'warning');

  const values = {
    coverEyebrow: 'Agile Studio · 综合分析',
    coverTitle: '三项目交付质量综合分析',
    coverSubtitle: stats.map((s) => s.name).join(' · '),
    timestamp: `数据截止 ${stamp} · 共 ${stats.length} 个项目 / ${stats.reduce((n, s) => n + s.reqTotal, 0)} 项需求`,

    // 2 全景
    s2Note: `三个项目分别处于「${stats.map((s) => s.status).join('」「')}」阶段，横向对比时需要一并考虑所处阶段。`,
    kpiProjects: {
      label: '在管项目',
      value: stats.length,
      change: `${stats.reduce((n, s) => n + s.sprintCount, 0)} 个迭代`
    },
    kpiRequirements: {
      label: '需求总数',
      value: stats.reduce((n, s) => n + s.reqTotal, 0),
      change: `${stats.reduce((n, s) => n + s.spTotal, 0)} 故事点`
    },
    kpiOpenBugs: {
      label: '未关闭缺陷',
      value: stats.reduce((n, s) => n + s.openCount, 0),
      change: `致命 ${stats.reduce((n, s) => n + s.criticalOpen, 0)} · 严重 ${stats.reduce((n, s) => n + s.majorOpen, 0)}`
    },
    kpiCases: {
      label: '测试用例',
      value: stats.reduce((n, s) => n + s.totalCases, 0),
      change: `${stats.reduce((n, s) => n + s.suiteCount, 0)} 个套件`
    },
    overviewTable: {
      columns: ['项目', '阶段', '需求', '故事点', '迭代', '未关闭缺陷', '测试套件'],
      rows: stats.map((s) => [s.name, s.status, s.reqTotal, s.spTotal, s.sprintCount, s.openCount, s.suiteCount])
    },

    // 3 交付进度
    deliveryChart: {
      type: 'bar',
      labels: stats.map((s) => s.key),
      series: [
        { name: '需求完成率 %', values: stats.map((s) => s.completion) },
        { name: '故事点完成率 %', values: stats.map((s) => s.spCompletion) }
      ]
    },
    deliveryNote: (() => {
      const best = [...stats].sort((a, b) => b.spCompletion - a.spCompletion)[0];
      const worst = [...stats].sort((a, b) => a.spCompletion - b.spCompletion)[0];
      return `${best.name}的故事点完成率最高（${best.spCompletion}%），${worst.name}最低（${worst.spCompletion}%）；两者相差 ${best.spCompletion - worst.spCompletion} 个百分点。`;
    })(),

    // 4 迭代节奏
    sprintChart: {
      type: 'line',
      labels: Array.from({ length: maxSprints }, (_, i) => `第 ${i + 1} 迭代`),
      series: stats.map((s) => ({ name: s.key, values: s.sprintProgress }))
    },
    sprintNote: `平均速率：${stats.map((s) => `${s.key} ${s.velocity} 点/迭代`).join('，')}。迭代数不等的项目在图上自然止于各自最后一个迭代。`,

    // 5 缺陷
    defectChart: {
      type: 'stacked-bar',
      labels: stats.map((s) => s.key),
      series: SEVERITIES.map(([en, zh]) => ({
        name: zh,
        values: stats.map((s) => (en === 'Critical' ? s.criticalOpen : en === 'Major' ? s.majorOpen : s.minorOpen))
      }))
    },
    defectTable: {
      columns: ['项目', 'ID', '标题', '严重程度', '模块'],
      rows: [...openBugs]
        .sort((a, b) => (sevRank[a.severity] ?? 3) - (sevRank[b.severity] ?? 3))
        .slice(0, 6)
        .map((b) => [
          b.projectKey,
          b.id,
          b.title ?? b.title_en,
          SEVERITIES.find(([en]) => en === b.severity)?.[1] ?? b.severity,
          b.module ?? b.module_en
        ])
    },

    // 6 测试质量（两条都是百分比，共用一根坐标轴才能直接比）
    qualityChart: {
      type: 'line',
      labels: stats.map((s) => s.key),
      series: [
        { name: '平均覆盖率 %', values: stats.map((s) => s.avgCoverage) },
        { name: '平均通过率 %', values: stats.map((s) => s.avgPass) }
      ]
    },
    gaugeA: {
      label: `${stats[0]?.key ?? ''} 覆盖率`,
      value: stats[0]?.avgCoverage ?? 0,
      tone: gaugeTone(stats[0]?.avgCoverage ?? 0)
    },
    gaugeB: {
      label: `${stats[1]?.key ?? ''} 覆盖率`,
      value: stats[1]?.avgCoverage ?? 0,
      tone: gaugeTone(stats[1]?.avgCoverage ?? 0)
    },
    gaugeC: {
      label: `${stats[2]?.key ?? ''} 覆盖率`,
      value: stats[2]?.avgCoverage ?? 0,
      tone: gaugeTone(stats[2]?.avgCoverage ?? 0)
    },
    qualityNote: `共 ${stats.reduce((n, s) => n + s.failedSuites, 0)} 个测试套件未通过，分布在 ${
      stats
        .filter((s) => s.failedSuites > 0)
        .map((s) => s.key)
        .join('、') || '无'
    }。`,

    // 7 健康分与 DORA
    healthTable: {
      columns: ['#', '项目', '健康分', '需求完成率 %', '故事点完成率 %', '覆盖率 %', '通过率 %', '致命缺陷'],
      rows: ranked.map((s, i) => [
        i + 1,
        s.name,
        s.health,
        s.completion,
        s.spCompletion,
        s.avgCoverage,
        s.avgPass,
        s.criticalOpen
      ])
    },
    doraLeadTime: {
      label: '交付前置时间',
      value: `${metrics.leadTime} 天`,
      change: `周期时间 ${metrics.cycleTime} 天`
    },
    doraCycleTime: { label: '周期时间', value: `${metrics.cycleTime} 天` },
    doraDeploy: { label: '部署频率', value: `${metrics.deploymentFrequency} 次/周` },
    doraFailure: { label: '变更失败率', value: `${metrics.failureRate}%` },
    doraNote: 'DORA 四项是工作区级度量，数据源不按项目切分，因此这一组数字对三个项目是共同的。',

    // 8 结论与建议
    conclusions: {
      items: [
        { label: '领先', value: `${leader.name}（健康分 ${leader.health}）` },
        { label: '掉队', value: `${laggard.name}（健康分 ${laggard.health}）` },
        {
          label: '最大质量风险',
          value: `${stats.reduce((a, b) => (b.criticalOpen > a.criticalOpen ? b : a)).name}的致命缺陷`
        },
        {
          label: '覆盖率洼地',
          value: (() => {
            const low = stats.reduce((a, b) => (b.avgCoverage < a.avgCoverage ? b : a));
            return `${low.name}（${low.avgCoverage}%）`;
          })()
        }
      ]
    },
    advices: { items: stats.map((s) => ({ label: s.key, value: adviceOf(s, stats) })) },
    footer: '由 Agile Studio 生成 · 数据来自各项目的需求 / 迭代 / 缺陷 / 测试套件与工作区 DORA 指标'
  };

  const html = fill(await context.readReference('deck.html'), values);
  const css = await context.readReference('deck.css');

  // resultCard: false —— 幻灯片只在独立文档面演示，会话里不出自动下载卡（SDK 分册 18）
  await context.writeArtifact('deck.html', html, { mimeType: 'text/html', metadata: { resultCard: false } });
  await context.writeArtifact('deck.css', css, { mimeType: 'text/css', metadata: { resultCard: false } });

  // 宿主没接文档面时按钮根本不会渲染（SDK 分册 13 FR-13.3），
  // 发了就是「模型以为有、用户看不到」——改回一句实话。
  if (context.documentSurface !== true) {
    return [
      {
        type: 'text',
        text: 'The slide deck artifacts were written, but this host has no document surface, so there is no way to present them here. Tell the user the deck is available in the managed skill storage and summarize the cross-project findings inline instead.'
      }
    ];
  }

  return [
    // 会话内直接给「打开幻灯片」按钮（SDK 内置 OpenDocument；点击即真实用户手势）。
    // 不写 label：缺省文案跟随宿主界面语言，写死就把技能钉死在一种语言上。
    {
      type: 'json',
      data: {
        $surface: [
          {
            type: 'open',
            id: 'slide-deck-open',
            node: {
              component: 'OpenDocument',
              props: {
                artifact: 'deck.html',
                style: 'deck.css',
                dataSource: 'fetchData: projects / sprints / requirements / bugs / testSuites / metrics'
              }
            }
          }
        ]
      }
    },
    {
      type: 'text',
      text: 'The eight-slide deck is ready. The open-deck button in this result is already rendered and is the ONLY UI entry point — do NOT call render_ui or emit any other UI, chart, button or link for it, and do not mention downloads or attachments. Reply with one or two sentences pointing the user to that button and telling them they can navigate with the arrow keys and export a PDF from the print button; do not restate the numbers shown on the slides.'
    }
  ];
}
