/**
 * quality-bulletin（档 2：完整公文 + A4 打印 + 文档投放面）。
 * 两轮调用：第一轮回数据摘要；第二轮模型给 conclusion，脚本填模板、写 artifact。
 * 数据只经 fetchData / assets 进出，模型不碰布局与统计值。
 */

export const inputSchema = {
  type: 'object',
  properties: {
    projectId: { type: 'string', description: 'Project id; defaults to the currently selected project.' },
    conclusion: { type: 'string', description: 'Release-readiness conclusion paragraph written by the model.' }
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

const toBase64 = (bytes) => {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
};

/** 套件状态展示映射：数据值保持英文枚举，只在落模板前转中文 */
const SUITE_STATUS_ZH = { Passed: '通过', Failed: '未通过' };

export async function run(input, context) {
  if (typeof context.fetchData !== 'function') {
    return [
      { type: 'text', text: 'DATA_SOURCE_UNAVAILABLE: fetchData is not wired by the host; cannot build the bulletin.' }
    ];
  }
  const params = typeof input.projectId === 'string' && input.projectId ? { projectId: input.projectId } : {};
  const bugs = await context.fetchData('bugs', params);
  const suites = await context.fetchData('testSuites', params);
  const metrics = await context.fetchData('metrics', params);

  const open = bugs.filter((b) => b.status === 'Open');
  const bySeverity = (sev) => open.filter((b) => b.severity === sev).length;
  const avgCoverage = suites.length ? Math.round(suites.reduce((s, t) => s + t.coverage, 0) / suites.length) : 0;
  const avgPass = suites.length ? Math.round(suites.reduce((s, t) => s + t.passRate, 0) / suites.length) : 0;

  // 第一轮：只回摘要，布局这一步模型碰不到
  if (typeof input.conclusion !== 'string' || input.conclusion.trim() === '') {
    return [
      {
        type: 'text',
        text: [
          `Bulletin digest: ${open.length} open defects (Critical ${bySeverity('Critical')}, Major ${bySeverity('Major')}, Minor ${bySeverity('Minor')});`,
          `${suites.length} suites, average coverage ${avgCoverage}%, average pass rate ${avgPass}%;`,
          `DORA: lead time ${metrics.leadTime}d, cycle time ${metrics.cycleTime}d, deployment frequency ${metrics.deploymentFrequency}/wk, failure rate ${metrics.failureRate}%.`,
          'Now write a release-readiness conclusion (3-5 sentences) and call this skill again with it as the "conclusion" argument.',
          'Do not send the digest back — it is re-fetched inside the script.'
        ].join(' ')
      }
    ];
  }

  const sealBytes = await context.readAssetBinary('seal.png');
  const sealDataUrl = `data:image/png;base64,${toBase64(sealBytes)}`;

  const today = new Date().toISOString().slice(0, 10);
  const readinessScore = Math.max(
    0,
    Math.min(100, 100 - bySeverity('Critical') * 25 - bySeverity('Major') * 8 - Math.max(0, 70 - avgCoverage))
  );

  const values = {
    issuer: '工程质量委员会',
    title: '项目质量通报',
    issueLine: `第 ${today.replace(/-/g, '')} 期 · 由 Agile Studio 生成`,
    defectNarrative: `当前项目共跟踪 ${open.length} 个未关闭缺陷：致命 ${bySeverity('Critical')} 个、严重 ${bySeverity('Major')} 个、轻微 ${bySeverity('Minor')} 个。`,
    defectTable: {
      title: '未关闭缺陷（按严重程度）',
      columns: ['严重程度', '数量'],
      rows: [
        ['致命', bySeverity('Critical')],
        ['严重', bySeverity('Major')],
        ['轻微', bySeverity('Minor')]
      ]
    },
    coverageNarrative: `${suites.length} 个测试套件的平均覆盖率为 ${avgCoverage}%，平均通过率为 ${avgPass}%。`,
    suiteTable: {
      title: '测试套件',
      columns: ['套件', '覆盖率 %', '通过率 %', '状态'],
      rows: suites.map((t) => [t.suite ?? t.suite_en, t.coverage, t.passRate, SUITE_STATUS_ZH[t.status] ?? t.status])
    },
    dora: {
      items: [
        { label: '交付前置时间', value: `${metrics.leadTime} 天` },
        { label: '周期时间', value: `${metrics.cycleTime} 天` },
        { label: '部署频率', value: `${metrics.deploymentFrequency} 次/周` },
        { label: '变更失败率', value: `${metrics.failureRate}%` }
      ]
    },
    readinessScore: String(readinessScore),
    conclusion: input.conclusion,
    dateLine: today,
    sealDataUrl
  };

  const html = fill(await context.readReference('bulletin.html'), values);
  const css = await context.readReference('bulletin.css');

  // resultCard: false —— 公文只在隔离文档面查看/打印，会话里不出自动下载卡（SDK 分册 18）
  await context.writeArtifact('bulletin.html', html, { mimeType: 'text/html', metadata: { resultCard: false } });
  await context.writeArtifact('bulletin.css', css, { mimeType: 'text/css', metadata: { resultCard: false } });

  // 宿主没接文档面时按钮根本不会渲染（SDK 分册 13 FR-13.3），
  // 发了就是「模型以为有、用户看不到」——改回一句实话。
  if (context.documentSurface !== true) {
    return [
      {
        type: 'text',
        text: 'Quality bulletin artifacts were written, but this host has no document surface, so there is no way to open them here. Tell the user the bulletin is available in the managed skill storage and summarize the key numbers inline instead.'
      }
    ];
  }

  return [
    // 会话内直接给「打开文档面」按钮（SDK 内置 OpenDocument；点击即真实用户手势）。
    // 不写 label：缺省文案跟随宿主界面语言，写死就把技能钉死在一种语言上。
    {
      type: 'json',
      data: {
        $surface: [
          {
            type: 'open',
            id: 'bulletin-open',
            node: {
              component: 'OpenDocument',
              props: {
                artifact: 'bulletin.html',
                style: 'bulletin.css',
                dataSource: 'fetchData: requirements / bugs / testSuites / metrics'
              }
            }
          }
        ]
      }
    },
    // 不再回 file 块：公文只在隔离文档面查看/打印，会话里不给下载卡。
    // 同时明确约束模型：按钮已由本结果渲染，禁止再用 render_ui 重复造一个。
    {
      type: 'text',
      text: 'Quality bulletin is ready. The open-bulletin button in this result is already rendered and is the ONLY UI entry point — do NOT call render_ui or emit any other UI, button or link for it, and do not mention downloads or attachments. Summarize briefly in your final answer and point the user to that button; the document surface prints to A4 directly.'
    }
  ];
}
