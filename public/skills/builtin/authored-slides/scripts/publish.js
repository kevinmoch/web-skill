/**
 * authored-slides 投放：把模型自己写的 HTML / CSS 写成产物，返回文档面的打开按钮。
 *
 * 校验放在这里而不是交给 viewer 兜底：viewer 对坏占位只会降级成一行英文提示，
 * 幻灯片更糟——结构写错只会静静退化成一张长网页，用户开了窗口才发现。
 */

const COMPONENTS = ['Chart', 'Table', 'Metric', 'Gauge', 'KeyValue'];

// viewer 用 innerHTML 落地，<script> 本就不执行；但内联事件属性在开发态 CSP 下会执行，
// 而且这些标签一旦混进来文档就不再是「纯数据」。一律拒收。
const FORBIDDEN_TAG = /<\s*(script|style|link|meta|base|iframe|object|embed)\b/i;
const DOCUMENT_TAG = /<\s*(!doctype|html|head|body)\b/i;
const INLINE_HANDLER = /\son[a-z]+\s*=\s*["']/i;
const JS_URL = /(?:href|src)\s*=\s*["']\s*javascript:/i;
const REMOTE_IMG = /<img[^>]+src\s*=\s*["']\s*https?:/i;

/** 外壳靠这个属性决定挂不挂放映引擎；漏了整份就退化成一张长网页 */
const SLIDES_MODE = /data-viewer-mode\s*=\s*["']slides["']/i;
const SLIDES_WRAPPER = /class\s*=\s*["'][^"']*\bslides\b[^"']*["']/i;
const SECTION = /<\s*section\b/gi;

const COMPONENT_ATTR = /data-webskill-component\s*=\s*(?:'([^']*)'|"([^"]*)")/g;
const PROPS_ATTR = /data-webskill-props\s*=\s*(?:'([^']*)'|"([^"]*)")/g;

/** 属性值里的实体还原后才是 JSON；`&amp;` 必须最后换，否则 `&amp;quot;` 会被二次解码 */
const decodeEntities = (value) =>
  value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

function collectAttr(pattern, html) {
  const found = [];
  pattern.lastIndex = 0;
  let match;
  while ((match = pattern.exec(html)) !== null) found.push(match[1] ?? match[2] ?? '');
  return found;
}

function validate(html, css, dataSource) {
  if (typeof html !== 'string' || html.trim() === '') return ['html is empty'];
  if (typeof css !== 'string' || css.trim() === '') return ['css is empty'];
  if (typeof dataSource !== 'string' || dataSource.trim() === '') {
    return ['dataSource is empty; state where the numbers came from'];
  }

  const issues = [];
  if (DOCUMENT_TAG.test(html)) {
    issues.push('html must be a fragment with a single root <div>; drop <!doctype>, <html>, <head> and <body>');
  }
  const tag = FORBIDDEN_TAG.exec(html);
  if (tag) issues.push(`forbidden tag <${tag[1].toLowerCase()}>; the stylesheet belongs in the css argument`);
  if (INLINE_HANDLER.test(html)) issues.push('inline event handler attributes are not allowed; the document is static');
  if (JS_URL.test(html)) issues.push('javascript: URLs are not allowed');
  if (REMOTE_IMG.test(html)) {
    issues.push(
      'remote <img> sources are blocked by the viewer CSP; draw with inline <svg> or CSS, or use a data: URI'
    );
  }
  if (!SLIDES_MODE.test(html)) {
    issues.push(
      'the root element must carry data-viewer-mode="slides", otherwise the document renders as one long page'
    );
  }
  if (!SLIDES_WRAPPER.test(html)) {
    issues.push('the root element must contain one <div class="slides"> whose direct children are the <section> pages');
  }
  const sections = html.match(SECTION)?.length ?? 0;
  if (sections < 2) issues.push(`a deck needs at least two <section> pages; found ${sections}`);

  const names = collectAttr(COMPONENT_ATTR, html);
  const props = collectAttr(PROPS_ATTR, html);
  for (const name of names) {
    if (!COMPONENTS.includes(name)) issues.push(`unknown component "${name}"; allowed: ${COMPONENTS.join(', ')}`);
  }
  if (names.length !== props.length) {
    issues.push(
      `found ${names.length} component placeholders but ${props.length} data-webskill-props attributes; each placeholder needs exactly one`
    );
  }
  props.forEach((raw, index) => {
    try {
      JSON.parse(decodeEntities(raw));
    } catch {
      issues.push(
        `placeholder #${index + 1} (${names[index] ?? 'unknown'}) has invalid props JSON; put the JSON inside single quotes so its double quotes survive`
      );
    }
  });

  // 打印时每个 section 会被包进 .pdf-page，`.slides > section` 当场失配——
  // 屏幕上好好的版式一导 PDF 就散，而且只在打印时复现，最难查。
  if (/\.slides\s*>\s*section/i.test(css)) {
    issues.push(
      'css uses ".slides > section"; use the descendant form ".slides section" or the layout breaks in the PDF export, where every section is wrapped in .pdf-page'
    );
  }
  // 技能样式先于 reveal.css 注入，同分即输：不带 .reveal 前缀的 color 压不过引擎默认字色，
  // 深色封面上的标题会保持引擎的深灰，看起来就是「字和背景一个色」。
  if (!/\.reveal\b/i.test(css)) {
    issues.push(
      'css never uses the ".reveal" prefix; the deck stylesheet is injected before the presentation engine\'s own stylesheet, so unprefixed rules lose to its defaults — headings keep the engine\'s dark default colour and become unreadable on a dark cover. Prefix your selectors like ".deck.reveal .slides section h1"'
    );
  }
  return issues;
}

export const inputSchema = {
  type: 'object',
  properties: {
    html: {
      type: 'string',
      description:
        'Deck markup: a single root <div data-viewer-mode="slides"> containing one <div class="slides"> with one <section> per page. No <html>/<head>/<body>, no <script>/<style>, no inline event handlers. Component placeholders follow references/authoring.md.'
    },
    css: {
      type: 'string',
      description:
        'Stylesheet for that markup. Prefix selectors with your root class plus .reveal, and never use ".slides > section".'
    },
    dataSource: {
      type: 'string',
      description:
        'Where the numbers actually came from, shown to the user in the document window. Name the real origins you read, e.g. "page: 付款管理 / 合同台账" or "tools: list_bugs, get_dora_metrics". Never claim a source you did not read.'
    }
  },
  required: ['html', 'css', 'dataSource']
};

export async function run(input, context) {
  const issues = validate(input?.html, input?.css, input?.dataSource);
  if (issues.length > 0) {
    return [
      {
        type: 'text',
        text: `PUBLISH_REJECTED: ${issues.join(' | ')}. Nothing was published — fix the markup and call authored-slides__publish again.`
      }
    ];
  }

  await context.writeArtifact('deck.html', input.html, { mimeType: 'text/html', metadata: { resultCard: false } });
  await context.writeArtifact('deck.css', input.css, { mimeType: 'text/css', metadata: { resultCard: false } });

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
              props: {
                artifact: 'deck.html',
                style: 'deck.css',
                dataSource: input.dataSource
              }
            }
          }
        ]
      }
    },
    {
      type: 'text',
      text: 'The deck is published. The open button in this result is already rendered and is the ONLY UI entry point — do NOT call render_ui or emit any other button, link or chart for it, and do not mention downloads or attachments. Reply with one or two sentences on the narrative arc, tell the user they can navigate with the arrow keys and export a PDF from the print button, and invite them to say in plain language which slide they want changed; do not restate the numbers on the slides, and keep the html and css you just sent so you can revise them.'
    }
  ];
}
