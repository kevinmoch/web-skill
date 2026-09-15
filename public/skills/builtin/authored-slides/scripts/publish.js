/**
 * authored-slides 投放：收**结构化演示模型**，渲染成 reveal 能放映的 HTML/CSS，
 * 并把原样模型挂回根节点供另存 PPTX 使用。
 *
 * 两件事在这里被一起解决：
 * 1. 屏幕上那份和另存的 PPTX 以前是两条独立通路，必然漂开；现在两边读同一个 JSON。
 * 2. 版面空。字号与版式由本文件独占——模型给不出「小字」，也给不出「一页三行字」：
 *    每种 layout 的槽位数、每个槽位的最低内容量都在这里当场校验。
 */

const CHART_TYPES = ['bar', 'line', 'area', 'pie', 'scatter', 'stacked-bar', 'dual-axis'];
const ITEM_TYPES = ['chart', 'table', 'metrics', 'keyValue', 'bullets', 'paragraph'];
const DATA_ITEMS = ['chart', 'table', 'metrics', 'keyValue'];
const LAYOUTS = ['cover', 'section', 'single', 'split', 'grid', 'closing'];
/** 需要正文槽位的版式；封面与过渡页不吃这套密度规则 */
const CONTENT_LAYOUTS = ['single', 'split', 'grid', 'closing'];

/** 每种版式的槽位数下限 / 上限。改这里就等于改「一页最少要有多少东西」 */
const SLOTS = {
  cover: [0, 1],
  section: [0, 1],
  single: [1, 1],
  split: [2, 2],
  grid: [3, 4],
  closing: [1, 2]
};

const PALETTES = {
  dark: {
    background: '#0f1b2e',
    surface: '#17253c',
    text: '#f2f7ff',
    muted: '#a8bcd9',
    accent: '#4da3ff',
    border: '#2a3d5c'
  },
  light: {
    background: '#ffffff',
    surface: '#f2f6fb',
    text: '#16202e',
    muted: '#5c6b7f',
    accent: '#1a6fd4',
    border: '#dbe3ee'
  }
};

// ---------------------------------------------------------------- 校验

function validate(deck, dataSource) {
  const issues = [];
  if (typeof dataSource !== 'string' || dataSource.trim() === '') {
    issues.push('dataSource is empty; state where the numbers came from');
  }
  if (typeof deck !== 'object' || deck === null || Array.isArray(deck)) {
    issues.push('deck must be an object shaped like references/authoring.md');
    return issues;
  }
  if (!isText(deck.title)) issues.push('deck.title is required');
  if (deck.theme !== undefined && deck.theme !== 'dark' && deck.theme !== 'light') {
    issues.push('deck.theme must be "dark" or "light"');
  }
  if (!Array.isArray(deck.slides) || deck.slides.length < 3) {
    issues.push(
      `deck.slides needs at least 3 slides (a cover, at least one content slide and a closing); found ${Array.isArray(deck.slides) ? deck.slides.length : 0}`
    );
    return issues;
  }

  let dataSlides = 0;
  deck.slides.forEach((slide, index) => {
    const at = `deck.slides[${index}]`;
    const found = slideIssues(slide, at);
    for (const issue of found) issues.push(issue);
    if (found.length === 0 && Array.isArray(slide.body) && slide.body.some((item) => DATA_ITEMS.includes(item.type))) {
      dataSlides += 1;
    }
  });
  if (issues.length === 0 && dataSlides === 0) {
    issues.push(
      'not one slide carries a chart, table, metrics or keyValue; a deck made only of bullet points is exactly the sparse deck this skill exists to avoid — put the numbers you gathered on the slides'
    );
  }
  return issues;
}

function slideIssues(slide, at) {
  if (typeof slide !== 'object' || slide === null || Array.isArray(slide)) return [`${at} must be an object`];
  const issues = [];
  if (!LAYOUTS.includes(slide.layout)) {
    return [`${at}.layout "${String(slide.layout)}" is unknown; allowed: ${LAYOUTS.join(', ')}`];
  }
  if (!isText(slide.title)) issues.push(`${at}.title is required on every slide`);

  const body = Array.isArray(slide.body) ? slide.body : [];
  if (!Array.isArray(slide.body)) issues.push(`${at}.body must be an array (use [] on a cover or section divider)`);
  const [min, max] = SLOTS[slide.layout];
  if (body.length < min || body.length > max) {
    issues.push(
      `${at}.layout "${slide.layout}" holds ${min === max ? min : `${min}-${max}`} body item${max > 1 ? 's' : ''} but got ${body.length}; pick the layout that matches how much you have`
    );
  }
  body.forEach((item, index) => {
    for (const issue of itemIssues(item, `${at}.body[${index}]`)) issues.push(issue);
  });

  if (CONTENT_LAYOUTS.includes(slide.layout)) {
    if (!isText(slide.takeaway)) {
      issues.push(
        `${at}.takeaway is required on a "${slide.layout}" slide; one sentence saying what the audience should conclude — it also fills the bottom band the layout reserves`
      );
    } else if (slide.takeaway.trim().length < 8) {
      issues.push(`${at}.takeaway is too short to be a conclusion; write a full sentence`);
    }
  }
  if (slide.layout === 'single' && body.length === 1 && body[0] && body[0].type === 'paragraph') {
    issues.push(
      `${at} is a "single" slide holding nothing but one paragraph, which leaves the stage almost empty; either add the chart or table it describes and use "split", or move the prose into takeaway plus a "bullets" item`
    );
  }
  return issues;
}

function itemIssues(item, at) {
  if (typeof item !== 'object' || item === null || Array.isArray(item)) return [`${at} must be an object`];
  if (!ITEM_TYPES.includes(item.type)) {
    return [`${at}.type "${String(item.type)}" is unknown; allowed: ${ITEM_TYPES.join(', ')}`];
  }
  const issues = [];
  switch (item.type) {
    case 'chart':
      for (const issue of chartIssues(item, at)) issues.push(issue);
      break;
    case 'table':
      for (const issue of tableIssues(item, at)) issues.push(issue);
      break;
    case 'metrics':
      if (!Array.isArray(item.items) || item.items.length < 2) {
        issues.push(`${at}.items needs at least 2 metrics; a lone number belongs in the slide title or takeaway`);
      } else if (item.items.length > 4) {
        issues.push(
          `${at}.items has ${item.items.length} metrics; keep it to 4 so each one stays readable on a projector`
        );
      } else {
        item.items.forEach((one, i) => {
          if (!one || !isText(one.label)) issues.push(`${at}.items[${i}].label is required`);
          if (!one || one.value === undefined || one.value === null) issues.push(`${at}.items[${i}].value is required`);
        });
      }
      break;
    case 'keyValue':
      if (!Array.isArray(item.items) || item.items.length < 3) {
        issues.push(`${at}.items needs at least 3 rows, otherwise the slot looks empty`);
      }
      break;
    case 'bullets':
      if (!Array.isArray(item.items) || item.items.length < 3) {
        issues.push(
          `${at}.items has ${Array.isArray(item.items) ? item.items.length : 0} bullets; a slot of bullets needs at least 3 or the slide reads as empty`
        );
      } else if (item.items.length > 6) {
        issues.push(
          `${at}.items has ${item.items.length} bullets; split them across two slides rather than shrinking the text`
        );
      } else {
        item.items.forEach((one, i) => {
          if (!isText(one)) issues.push(`${at}.items[${i}] is empty`);
        });
      }
      break;
    case 'paragraph':
      if (!isText(item.text)) issues.push(`${at}.text is required`);
      else if (item.text.trim().length < 24) {
        issues.push(`${at}.text is a fragment, not a paragraph; say the whole thought or make it a bullets item`);
      }
      break;
    default:
      break;
  }
  return issues;
}

function tableIssues(block, at) {
  const issues = [];
  if (!Array.isArray(block.columns) || block.columns.length === 0) {
    issues.push(`${at}.columns must be a non-empty array of column headers`);
    return issues;
  }
  if (!Array.isArray(block.rows) || block.rows.length === 0) {
    issues.push(`${at}.rows must be a non-empty array`);
    return issues;
  }
  if (block.rows.length > 8) {
    issues.push(`${at}.rows has ${block.rows.length} rows; a slide holds about 8 — summarise or split the table`);
  }
  block.rows.forEach((row, i) => {
    if (!Array.isArray(row)) {
      issues.push(`${at}.rows[${i}] must be an array of cells`);
      return;
    }
    if (row.length !== block.columns.length) {
      issues.push(`${at}.rows[${i}] has ${row.length} cells but there are ${block.columns.length} columns`);
    }
  });
  return issues;
}

function chartIssues(block, at) {
  const issues = [];
  if (!CHART_TYPES.includes(block.chartType)) {
    issues.push(`${at}.chartType "${String(block.chartType)}" is unknown; allowed: ${CHART_TYPES.join(', ')}`);
  }
  if (!Array.isArray(block.labels) || block.labels.length === 0) {
    issues.push(`${at}.labels must be a non-empty array`);
  }
  if (!Array.isArray(block.series) || block.series.length === 0) {
    issues.push(`${at}.series must be a non-empty array`);
    return issues;
  }
  block.series.forEach((series, i) => {
    if (!series || !isText(series.name)) issues.push(`${at}.series[${i}].name is required`);
    if (!series || !Array.isArray(series.values)) {
      issues.push(`${at}.series[${i}].values must be an array of numbers`);
      return;
    }
    if (Array.isArray(block.labels) && series.values.length !== block.labels.length) {
      issues.push(
        `${at}.series[${i}].values has ${series.values.length} numbers but there are ${block.labels.length} labels`
      );
    }
    series.values.forEach((value, j) => {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        issues.push(`${at}.series[${i}].values[${j}] must be a number, not a string`);
      }
    });
  });
  return issues;
}

const isText = (value) => typeof value === 'string' && value.trim() !== '';

// ---------------------------------------------------------------- 渲染

const escapeText = (value) =>
  String(value === undefined || value === null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const escapeAttr = (value) => JSON.stringify(value).replace(/&/g, '&amp;').replace(/'/g, '&#39;').replace(/</g, '&lt;');

function inline(text) {
  const parts = String(text).split('**');
  return parts
    .map((part, index) => (index % 2 === 1 ? `<strong>${escapeText(part)}</strong>` : escapeText(part)))
    .join('');
}

function normalise(deck) {
  const theme = deck.theme === 'light' ? 'light' : 'dark';
  return {
    kind: 'deck',
    title: String(deck.title).trim(),
    theme,
    palette: PALETTES[theme],
    slides: deck.slides.map((slide) => {
      const out = { layout: slide.layout, body: Array.isArray(slide.body) ? slide.body : [] };
      if (isText(slide.title)) out.title = slide.title.trim();
      if (isText(slide.subtitle)) out.subtitle = slide.subtitle.trim();
      if (Array.isArray(slide.meta) && slide.meta.length > 0) {
        out.meta = slide.meta
          .filter((item) => item && isText(item.label))
          .map((item) => ({ label: String(item.label), value: String(item.value === undefined ? '' : item.value) }));
      }
      if (isText(slide.takeaway)) out.takeaway = slide.takeaway.trim();
      return out;
    })
  };
}

function renderHtml(model) {
  const sections = model.slides.map(renderSlide).join('');
  const attrs = [
    `class="deck deck--${model.theme}"`,
    'data-viewer-mode="slides"',
    'data-viewer-chart-font="lg"',
    'data-webskill-doc="deck"',
    `data-webskill-doc-model='${escapeAttr(model)}'`
  ].join(' ');
  return `<div ${attrs}><div class="slides">${sections}</div></div>`;
}

function renderSlide(slide) {
  const parts = [];
  if (slide.layout === 'cover' || slide.layout === 'section') {
    parts.push('<div class="deck__hero">');
    parts.push(`<h1 class="deck__herotitle">${escapeText(slide.title)}</h1>`);
    parts.push('<span class="deck__accent"></span>');
    if (slide.subtitle) parts.push(`<p class="deck__herosub">${escapeText(slide.subtitle)}</p>`);
    parts.push('</div>');
    if (slide.meta && slide.meta.length > 0) {
      const items = slide.meta
        .map((item) => `<span class="deck__metaitem">${escapeText(item.label)}：${escapeText(item.value)}</span>`)
        .join('');
      parts.push(`<p class="deck__meta">${items}</p>`);
    }
    for (const item of slide.body) parts.push(renderItem(item));
    return `<section class="deck__slide" data-layout="${slide.layout}">${parts.join('')}</section>`;
  }

  parts.push(`<header class="deck__head"><h2 class="deck__title">${escapeText(slide.title)}</h2>`);
  if (slide.subtitle) parts.push(`<p class="deck__sub">${escapeText(slide.subtitle)}</p>`);
  parts.push('</header>');
  const slots = slide.body.map((item) => `<div class="deck__slot">${renderItem(item)}</div>`).join('');
  parts.push(`<div class="deck__body" data-slots="${slide.body.length}">${slots}</div>`);
  if (slide.takeaway) parts.push(`<footer class="deck__takeaway">${inline(slide.takeaway)}</footer>`);
  return `<section class="deck__slide" data-layout="${slide.layout}">${parts.join('')}</section>`;
}

function renderItem(item) {
  const heading = isText(item.title) ? `<h3 class="deck__slottitle">${escapeText(item.title)}</h3>` : '';
  switch (item.type) {
    case 'chart': {
      const props = { type: item.chartType, labels: item.labels.map(String), series: item.series };
      if (isText(item.title)) props.title = item.title;
      const caption = isText(item.caption) ? `<p class="deck__caption">${escapeText(item.caption)}</p>` : '';
      return `<div class="deck__chart" data-webskill-component="Chart" data-webskill-props='${escapeAttr(props)}'></div>${caption}`;
    }
    case 'table': {
      const props = { columns: item.columns.map(String), rows: item.rows };
      if (Array.isArray(item.columnWidths)) props.columnWidths = item.columnWidths;
      const caption = isText(item.caption) ? `<p class="deck__caption">${escapeText(item.caption)}</p>` : '';
      return `${heading}<div class="deck__table" data-webskill-component="Table" data-webskill-props='${escapeAttr(props)}'></div>${caption}`;
    }
    case 'metrics': {
      const cells = item.items
        .map((one) => {
          const props = { label: String(one.label), value: one.value };
          if (isText(one.change)) props.change = one.change;
          if (one.trend) props.trend = one.trend;
          return `<div class="deck__metric" data-webskill-component="Metric" data-webskill-props='${escapeAttr(props)}'></div>`;
        })
        .join('');
      return `${heading}<div class="deck__metrics">${cells}</div>`;
    }
    case 'keyValue': {
      const props = {
        items: item.items.map((one) => ({
          label: String(one && one.label !== undefined ? one.label : ''),
          value: String(one && one.value !== undefined ? one.value : '')
        }))
      };
      return `${heading}<div class="deck__kv" data-webskill-component="KeyValue" data-webskill-props='${escapeAttr(props)}'></div>`;
    }
    case 'bullets': {
      const items = item.items.map((one) => `<li>${inline(one)}</li>`).join('');
      return `${heading}<ul class="deck__bullets">${items}</ul>`;
    }
    case 'paragraph':
      return `${heading}<p class="deck__para">${inline(item.text)}</p>`;
    default:
      return '';
  }
}

/**
 * 样式表是**固定**的，模型不写 CSS。字号全部在这里，且都按 1600×900 的舞台给足——
 * 「有的页字很小」不再可能，因为没人有机会把它调小。
 *
 * 所有选择器都带 `.reveal` 前缀：技能样式先于放映引擎的样式注入，同分即输，
 * 不带前缀的 color 压不过引擎默认字色。也一律用后代选择器 `.slides section`，
 * 因为打印时每个 section 会被包进 `.pdf-page`，子选择器当场失配。
 */
const CSS = [
  '.deck.reveal { background: var(--deck-bg); color: var(--deck-text); }',
  ".deck.reveal { font-family: 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif; }",
  '.deck--dark { --deck-bg: #0f1b2e; --deck-surface: #17253c; --deck-text: #f2f7ff; --deck-muted: #a8bcd9; --deck-accent: #4da3ff; --deck-border: #2a3d5c; }',
  '.deck--light { --deck-bg: #ffffff; --deck-surface: #f2f6fb; --deck-text: #16202e; --deck-muted: #5c6b7f; --deck-accent: #1a6fd4; --deck-border: #dbe3ee; }',
  '.deck.reveal .slides section { flex-direction: column; gap: 28px; padding: 64px 72px; text-align: left; background: var(--deck-bg); color: var(--deck-text); height: 100%; box-sizing: border-box; }',
  '.deck.reveal .slides section[data-layout="cover"], .deck.reveal .slides section[data-layout="section"] { justify-content: center; }',
  '.deck.reveal .slides section[data-layout="cover"] { background: linear-gradient(135deg, var(--deck-bg) 0%, var(--deck-surface) 100%); }',
  '.deck.reveal .deck__hero { display: flex; flex-direction: column; gap: 20px; }',
  '.deck.reveal .deck__herotitle { margin: 0; font-size: 76px; line-height: 1.25; font-weight: 700; color: var(--deck-text); }',
  '.deck.reveal .deck__accent { display: block; width: 160px; height: 8px; background: var(--deck-accent); }',
  '.deck.reveal .deck__herosub { margin: 0; font-size: 34px; color: var(--deck-muted); }',
  '.deck.reveal .deck__meta { margin: 40px 0 0; font-size: 24px; color: var(--deck-muted); }',
  '.deck.reveal .deck__metaitem + .deck__metaitem { margin-left: 36px; }',
  '.deck.reveal .deck__head { display: flex; flex-direction: column; gap: 10px; border-bottom: 4px solid var(--deck-accent); padding-bottom: 18px; }',
  '.deck.reveal .deck__title { margin: 0; font-size: 52px; line-height: 1.25; font-weight: 700; color: var(--deck-text); }',
  '.deck.reveal .deck__sub { margin: 0; font-size: 28px; color: var(--deck-muted); }',
  '.deck.reveal .deck__body { flex: 1 1 auto; display: grid; gap: 28px; min-height: 0; grid-auto-rows: minmax(0, 1fr); }',
  '.deck.reveal .deck__body[data-slots="2"] { grid-template-columns: 1fr 1fr; }',
  '.deck.reveal .deck__body[data-slots="3"] { grid-template-columns: repeat(3, 1fr); }',
  '.deck.reveal .deck__body[data-slots="4"] { grid-template-columns: repeat(2, 1fr); }',
  '.deck.reveal .deck__slot { display: flex; flex-direction: column; gap: 16px; min-height: 0; min-width: 0; background: var(--deck-surface); border: 1px solid var(--deck-border); border-radius: 14px; padding: 28px 32px; }',
  '.deck.reveal .deck__slottitle { margin: 0; font-size: 32px; font-weight: 700; color: var(--deck-accent); }',
  '.deck.reveal .deck__chart { flex: 1 1 auto; min-height: 0; }',
  '.deck.reveal .deck__caption { margin: 0; font-size: 22px; color: var(--deck-muted); }',
  '.deck.reveal .deck__para { margin: 0; font-size: 30px; line-height: 1.7; color: var(--deck-text); }',
  '.deck.reveal .deck__bullets { margin: 0; padding-left: 1.2em; font-size: 32px; line-height: 1.75; color: var(--deck-text); }',
  '.deck.reveal .deck__bullets li { margin-bottom: 14px; }',
  '.deck.reveal .deck__bullets li::marker { color: var(--deck-accent); }',
  '.deck.reveal .deck__metrics { flex: 1 1 auto; display: flex; gap: 20px; align-items: stretch; }',
  '.deck.reveal .deck__metric { flex: 1 1 0; display: flex; flex-direction: column; justify-content: center; gap: 8px; }',
  '.deck.reveal .deck__metric [data-webskill-metric="label"] { font-size: 26px; color: var(--deck-muted); }',
  '.deck.reveal .deck__metric [data-webskill-metric="value"] { font-size: 66px; font-weight: 700; color: var(--deck-accent); line-height: 1.1; }',
  '.deck.reveal .deck__metric [data-webskill-metric="change"] { font-size: 24px; color: var(--deck-muted); }',
  '.deck.reveal .deck__table { flex: 1 1 auto; min-height: 0; overflow: hidden; }',
  '.deck.reveal .deck__table table { width: 100%; border-collapse: collapse; font-size: 26px; }',
  '.deck.reveal .deck__table th, .deck.reveal .deck__table td { border-bottom: 1px solid var(--deck-border); padding: 12px 14px; text-align: left; color: var(--deck-text); }',
  '.deck.reveal .deck__table th { color: var(--deck-muted); font-weight: 700; }',
  '.deck.reveal .deck__kv dl { display: grid; grid-template-columns: auto 1fr; gap: 12px 24px; margin: 0; font-size: 28px; }',
  '.deck.reveal .deck__kv dt { color: var(--deck-muted); }',
  '.deck.reveal .deck__kv dd { margin: 0; color: var(--deck-text); font-weight: 700; }',
  '.deck.reveal .deck__takeaway { flex: 0 0 auto; background: var(--deck-surface); border-left: 8px solid var(--deck-accent); padding: 22px 28px; font-size: 30px; line-height: 1.5; color: var(--deck-text); }',
  '.deck.reveal [data-webskill-fallback] { color: var(--deck-muted); font-size: 24px; }'
].join('\n');

// ---------------------------------------------------------------- 工具

export const inputSchema = {
  type: 'object',
  properties: {
    deck: {
      type: 'object',
      description:
        'The deck as structured data, not markup. Shape: { title, theme?: "dark" | "light", slides: [{ layout, title, subtitle?, meta?, body: [...], takeaway? }] }. Layouts: cover, section, single, split, grid, closing — each one accepts a fixed number of body items and the renderer owns every font size. Body item types: chart, table, metrics, keyValue, bullets, paragraph. See references/authoring.md for every field and for how full each slide has to be.',
      properties: {
        title: { type: 'string' },
        theme: { type: 'string', enum: ['dark', 'light'] },
        slides: { type: 'array', items: { type: 'object' } }
      },
      required: ['title', 'slides']
    },
    dataSource: {
      type: 'string',
      description:
        'Where the numbers actually came from, shown to the user in the document window. Name the real origins you read, e.g. "page: 付款管理 / 合同台账" or "tools: list_bugs, get_dora_metrics". Never claim a source you did not read.'
    }
  },
  required: ['deck', 'dataSource']
};

export async function run(input, context) {
  const issues = validate(input && input.deck, input && input.dataSource);
  if (issues.length > 0) {
    return [
      {
        type: 'text',
        text: `PUBLISH_REJECTED: ${issues.join(' | ')}. Nothing was published — fix the deck object and call authored-slides__publish again.`
      }
    ];
  }

  const model = normalise(input.deck);
  await context.writeArtifact('deck.html', renderHtml(model), {
    mimeType: 'text/html',
    metadata: { resultCard: false }
  });
  await context.writeArtifact('deck.css', CSS, { mimeType: 'text/css', metadata: { resultCard: false } });

  // 宿主没接文档面时按钮根本不会渲染（SDK 分册 13 FR-13.3），发了就是「模型以为有、用户看不到」。
  if (context.documentSurface !== true) {
    return [
      {
        type: 'text',
        text: 'The deck artifacts were written, but this host has no document surface, so there is no way to present them here. Tell the user the deck is in the managed skill storage and summarize the narrative inline instead.'
      }
    ];
  }

  return [
    // 不写 label：缺省文案跟随宿主界面语言，写死就把技能钉死在一种语言上。
    {
      type: 'json',
      data: {
        $surface: [
          {
            type: 'open',
            id: 'authored-slides-open',
            node: {
              component: 'OpenDocument',
              props: { artifact: 'deck.html', style: 'deck.css', dataSource: input.dataSource }
            }
          }
        ]
      }
    },
    {
      type: 'text',
      text: 'The deck is published. The open button in this result is already rendered and is the ONLY UI entry point — do NOT call render_ui or emit any other button, link or chart for it, and do not mention downloads or attachments. Reply with one or two sentences on the narrative arc, tell the user they can navigate with the arrow keys, print a PDF and export a PPTX that matches what is on screen, and invite them to say in plain language which slide they want changed; do not restate the numbers on the slides, and keep the deck object you just sent so you can revise it.'
    }
  ];
}
