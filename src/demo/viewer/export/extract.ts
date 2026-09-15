/**
 * 语义抽取（0.21.0 分册 15 FR-15.3 / 设计分册 16 §2）。
 *
 * 输入是**投放时那份序列化 HTML**（`main.ts` 里的 `pristine`），不是活的 DOM：
 * reveal 的打印版式会不可逆地改写 DOM，从活节点上抽取会把版式噪声一起抽走。
 *
 * 这一层只认结构，不碰任何输出格式；能不能画成图、要不要降级成表，是编码器的事。
 */

import { WebSkillError } from '@webskill/sdk';
import { DOCUMENT_COMPONENTS, VIEWER_COMPONENT_ATTR, VIEWER_PROPS_ATTR, uiCatalog } from '@webskill/sdk/ui';
import type {
  AuthoredMetaItem,
  AuthoredMetric,
  AuthoredOfficialHeader,
  AuthoredPalette,
  AuthoredSignature,
  AuthoredSlideLayout
} from '../authored/model';
import { readAuthoredModel } from '../authored/model';
import { fromAuthoredModel } from './fromModel';
import { imageBlocksOf, type DocImage } from './image';
import { classifyExportKind, exportRootOf } from './kind';
import { OmissionCounter, type ExportOmission } from './omissions';

export type { DocImage } from './image';

export interface ExportRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

export interface ChartProps {
  type: string;
  title?: string;
  labels: string[];
  series: { name: string; values: number[] }[];
  caption?: string;
  /** 屏幕上那张画布的快照；有它 DOCX 才贴得出与屏幕同一张图 */
  image?: ChartImage;
}

/** 画布快照。宽高一起带，否则贴进 OOXML 时只能猜一个比例，图会被拉扁 */
export interface ChartImage {
  url: string;
  width: number;
  height: number;
}

export interface TableProps {
  title?: string;
  columns: string[];
  rows: (string | number | boolean | null)[][];
  caption?: string;
  columnWidths?: number[];
}

export type ExportBlock =
  | { kind: 'heading'; level: 1 | 2 | 3; runs: ExportRun[] }
  | { kind: 'paragraph'; runs: ExportRun[] }
  | { kind: 'list'; ordered: boolean; items: ExportRun[][] }
  | { kind: 'chart'; props: ChartProps }
  | { kind: 'image'; image: DocImage; caption?: string }
  | { kind: 'table'; props: TableProps }
  | { kind: 'metrics'; items: AuthoredMetric[] }
  | { kind: 'keyValue'; title?: string; items: AuthoredMetaItem[] }
  | { kind: 'callout'; tone: 'info' | 'success' | 'warning' | 'danger'; title?: string; runs: ExportRun[] }
  | { kind: 'quote'; runs: ExportRun[]; source?: string }
  | { kind: 'divider' }
  | { kind: 'pageBreak' }
  | { kind: 'textCard'; label: string; lines: string[] };

export interface ExportPage {
  title?: string;
  subtitle?: string;
  meta?: AuthoredMetaItem[];
  /** 结构化投放才有：这一页按哪种版式摆，PPTX 侧照着同一个版式重建 */
  layout?: AuthoredSlideLayout;
  takeaway?: string;
  blocks: ExportBlock[];
  /**
   * 按模型里的槽位分好组的同一批块。`blocks` 是它拍平后的样子——
   * 只有保住分组，PPTX 才知道「两栏」的哪一栏放什么，而不是把整页摊成一列。
   */
  regions?: ExportBlock[][];
}

/** 公文 / 普通文档的抬头与落款；只有结构化投放带得出来 */
export interface ExportDocHeader {
  docType: 'plain' | 'official';
  subtitle?: string;
  meta?: AuthoredMetaItem[];
  official?: AuthoredOfficialHeader;
  signature?: AuthoredSignature;
}

export interface ExportDoc {
  kind: 'slides' | 'bulletin';
  title: string;
  pages: ExportPage[];
  omissions: ExportOmission[];
  /** 屏幕上用的那一组取色。编码器照抄它，另存件才不会换一套颜色（分册 19 FR-19.6） */
  theme?: AuthoredPalette;
  header?: ExportDocHeader;
}

/** 编码器的产出：字节，加上**这一种格式**才知道的降级（抽取层无从判断） */
export interface EncodedDocument {
  blob: Blob;
  omissions: ExportOmission[];
}

/** 图表降级成数据表：第一列是分类，其余每列一条系列 */
export function chartToTable(props: ChartProps): TableProps {
  const table: TableProps = {
    columns: ['', ...props.series.map((series) => series.name)],
    rows: props.labels.map((label, index) => [label, ...props.series.map((series) => series.values[index] ?? null)])
  };
  if (props.title !== undefined && props.title !== '') table.title = props.title;
  return table;
}

/** 抽不出东西就抛，绝不落一个 0 字节的文件下来（FR-15.9 第 1 条） */
export function extractExportDoc(html: string, options?: ExtractOptions): ExportDoc {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const root = exportRootOf(parsed);
  const format = classifyExportKind(root);
  if (!root || format === 'none') {
    throw new WebSkillError('EXPORT_FAILED', 'The document has no exportable root element.');
  }

  const docImages = options?.docImages ?? [];
  const zh = options?.zh === true;
  // 结构化投放优先：模型就挂在根节点上，读它比从 DOM 上刮回来精确得多（分册 19 FR-19.6）
  const model = readAuthoredModel(root);
  if (model !== undefined) return fromAuthoredModel(model, { chartImages: options?.chartImages ?? [], docImages, zh });

  const ctx: ExtractCtx = { counter: new OmissionCounter(), sizes: sizeIndex(docImages), zh };
  // 技能自带的 CSS 从来不进 OOXML：这是版式重建的固有代价，不是偶发缺失
  ctx.counter.add('css-decoration');

  const kind = format === 'pptx' ? 'slides' : 'bulletin';
  const pages = kind === 'slides' ? slidePages(root, ctx) : [{ blocks: blocksOf(root, ctx) }];
  if (pages.every((page) => page.blocks.length === 0 && (page.title ?? '') === '')) {
    throw new WebSkillError('EXPORT_FAILED', 'The document has no text, table or chart to export.');
  }

  return { kind, title: docTitle(pages), pages, omissions: ctx.counter.list() };
}

export interface ExtractOptions {
  /** 活 DOM 里每张图表画布的快照，按文档顺序排；结构化投放时按同一顺序配回图表块 */
  chartImages?: readonly ChartImage[];
  /**
   * 活 DOM 里每张文档图的字节与实测尺寸，按文档顺序排。
   * 结构化投放按顺序配回图片块，手写 HTML 按 `src` 查——两条路共用同一份采集。
   */
  docImages?: readonly DocImage[];
  /** 丢图时留在产物正文里那句话用哪种语言（FR-14.6） */
  zh?: boolean;
}

/** 遍历期要随身带的三样东西；单传 counter 的时候图片拿不到尺寸也说不出语言 */
interface ExtractCtx {
  counter: OmissionCounter;
  sizes: Map<string, DocImage>;
  zh: boolean;
}

function sizeIndex(images: readonly DocImage[]): Map<string, DocImage> {
  const out = new Map<string, DocImage>();
  for (const image of images) if (image.url !== '' && !out.has(image.url)) out.set(image.url, image);
  return out;
}

function docTitle(pages: readonly ExportPage[]): string {
  const first = pages[0];
  if (!first) return '';
  if (first.title !== undefined && first.title !== '') return first.title;
  for (const block of first.blocks) {
    if (block.kind === 'heading') return plain(block.runs);
  }
  return '';
}

function slidePages(root: Element, ctx: ExtractCtx): ExportPage[] {
  const stage = root.querySelector('.slides') ?? root;
  const sections = flattenSections(stage);
  if (sections.length === 0) {
    throw new WebSkillError('EXPORT_FAILED', 'Slides document has no <section> elements to export.');
  }
  return sections.map((section) => {
    const blocks = blocksOf(section, ctx);
    // 首个标题升为页标题：PPTX 的标题占位本来就是独立的一块，留在正文里会重复
    const lead = blocks[0];
    if (lead?.kind === 'heading') return { title: plain(lead.runs), blocks: blocks.slice(1) };
    return { blocks };
  });
}

/** reveal 的纵向幻灯片是 `section > section`；父节点本身不是一页 */
function flattenSections(stage: Element): Element[] {
  const out: Element[] = [];
  for (const child of Array.from(stage.children)) {
    if (child.tagName.toUpperCase() !== 'SECTION') continue;
    const nested = Array.from(child.children).filter((n) => n.tagName.toUpperCase() === 'SECTION');
    if (nested.length > 0) out.push(...nested);
    else out.push(child);
  }
  return out;
}

function blocksOf(container: Element, ctx: ExtractCtx): ExportBlock[] {
  const out: ExportBlock[] = [];
  visitChildren(container, out, ctx);
  return out;
}

const HEADING_LEVEL: Record<string, 1 | 2 | 3> = { H1: 1, H2: 2, H3: 3, H4: 3, H5: 3, H6: 3 };
const INLINE_TAGS = new Set([
  'A',
  'ABBR',
  'B',
  'BDI',
  'BDO',
  'CITE',
  'CODE',
  'DEL',
  'DFN',
  'EM',
  'I',
  'INS',
  'KBD',
  'MARK',
  'Q',
  'S',
  'SAMP',
  'SMALL',
  'SPAN',
  'STRONG',
  'SUB',
  'SUP',
  'TIME',
  'U',
  'VAR',
  'WBR'
]);
const SKIPPED_TAGS = new Set(['SCRIPT', 'STYLE', 'TEMPLATE', 'LINK', 'NOSCRIPT']);
const GRAPHIC_TAGS = new Set(['SVG', 'CANVAS', 'VIDEO', 'IFRAME', 'PICTURE']);

/**
 * 逐个子节点走：连续的文字与内联标签攒成一段，遇到块级元素就把攒的段落吐出去。
 * 这样 `<div>直接文字<div>子块</div></div>` 里的「直接文字」不会被吃掉。
 */
function visitChildren(element: Element, out: ExportBlock[], ctx: ExtractCtx): void {
  let buffer: ExportRun[] = [];
  const flush = (): void => {
    const runs = trimRuns(buffer);
    if (runs.length > 0) out.push({ kind: 'paragraph', runs });
    buffer = [];
  };
  for (const node of Array.from(element.childNodes)) {
    if (node.nodeType === 3) {
      buffer.push({ text: collapse(node.nodeValue ?? '') });
      continue;
    }
    if (node.nodeType !== 1) continue;
    const child = node as Element;
    const tag = child.tagName.toUpperCase();
    if (SKIPPED_TAGS.has(tag)) continue;
    if (tag === 'BR') {
      buffer.push({ text: '\n' });
      continue;
    }
    if (INLINE_TAGS.has(tag) && !child.hasAttribute(VIEWER_COMPONENT_ATTR)) {
      buffer.push(...runsOf(child, {}));
      continue;
    }
    flush();
    visit(child, out, ctx);
  }
  flush();
}

function visit(element: Element, out: ExportBlock[], ctx: ExtractCtx): void {
  if (element.hasAttribute(VIEWER_COMPONENT_ATTR)) {
    visitComponent(element, out, ctx);
    return;
  }
  const tag = element.tagName.toUpperCase();
  // 手写 HTML 自己塞进来的字节没有理由在导出时被丢掉（FR-14.2）；其余五种图形标签一字不动
  if (tag === 'IMG') {
    const src = element.getAttribute('src') ?? '';
    const alt = element.getAttribute('alt') ?? '';
    const measured = ctx.sizes.get(src);
    out.push(...imageBlocksOf(measured ?? { url: src, width: 0, height: 0, alt }, src, undefined, ctx.counter, ctx.zh));
    return;
  }
  if (GRAPHIC_TAGS.has(tag)) {
    ctx.counter.add('inline-graphic');
    return;
  }
  const level = HEADING_LEVEL[tag];
  if (level !== undefined) {
    const runs = trimRuns(runsOf(element, {}));
    if (runs.length > 0) out.push({ kind: 'heading', level, runs });
    return;
  }
  if (tag === 'UL' || tag === 'OL') {
    const items = Array.from(element.children)
      .filter((li) => li.tagName.toUpperCase() === 'LI')
      .map((li) => trimRuns(runsOf(li, {})))
      .filter((runs) => runs.length > 0);
    if (items.length > 0) out.push({ kind: 'list', ordered: tag === 'OL', items });
    return;
  }
  if (tag === 'TABLE') {
    visitTable(element, out);
    return;
  }
  visitChildren(element, out, ctx);
}

function visitTable(element: Element, out: ExportBlock[]): void {
  const rows = Array.from(element.querySelectorAll('tr'));
  const head = element.querySelector('thead tr') ?? rows[0];
  if (!head) return;
  const columns = cellsOf(head);
  const body = rows.filter((row) => row !== head).map(cellsOf);
  const caption = collapse(element.querySelector('caption')?.textContent ?? '').trim();
  const props: TableProps = { columns, rows: body };
  if (caption !== '') props.title = caption;
  out.push({ kind: 'table', props });
}

function cellsOf(row: Element): string[] {
  return Array.from(row.children).map((cell) => collapse(cell.textContent ?? '').trim());
}

/**
 * props 用 catalog 自己的 zod schema 解析，与 viewer 挂载时**同一份**——
 * 手抄一遍形状就等着两边慢慢漂开。
 */
function visitComponent(element: Element, out: ExportBlock[], ctx: ExtractCtx): void {
  const name = element.getAttribute(VIEWER_COMPONENT_ATTR) ?? '';
  if (!(DOCUMENT_COMPONENTS as readonly string[]).includes(name)) {
    ctx.counter.add('unknown-component');
    return;
  }
  const raw = element.getAttribute(VIEWER_PROPS_ATTR);
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw ?? '');
  } catch {
    ctx.counter.add('unparsable-component-props');
    return;
  }
  const result = uiCatalog.component(name)?.props.safeParse(parsed);
  if (!result?.success) {
    ctx.counter.add('unparsable-component-props');
    return;
  }
  const props = result.data as Record<string, unknown>;
  switch (name) {
    case 'Chart':
      out.push({ kind: 'chart', props: props as unknown as ChartProps });
      return;
    case 'Table':
      out.push({ kind: 'table', props: props as unknown as TableProps });
      return;
    case 'Metric': {
      ctx.counter.add('metric-shape');
      const lines = [String(props['value'])];
      const change = props['change'];
      if (typeof change === 'string' && change !== '') lines.push(change);
      out.push({ kind: 'textCard', label: String(props['label'] ?? ''), lines });
      return;
    }
    case 'Gauge': {
      ctx.counter.add('gauge-shape');
      out.push({
        kind: 'textCard',
        label: String(props['label'] ?? ''),
        lines: [`${String(props['value'])} / ${String(props['max'] ?? 100)}`]
      });
      return;
    }
    case 'KeyValue': {
      ctx.counter.add('key-value-shape');
      const items = (props['items'] ?? []) as { label?: unknown; value?: unknown }[];
      out.push({
        kind: 'textCard',
        label: '',
        lines: items.map((item) => `${String(item.label ?? '')}: ${String(item.value ?? '')}`)
      });
      return;
    }
    default:
      ctx.counter.add('unknown-component');
  }
}

function runsOf(element: Element, style: { bold?: boolean; italic?: boolean }): ExportRun[] {
  const tag = element.tagName.toUpperCase();
  const inherited = {
    bold: style.bold === true || tag === 'STRONG' || tag === 'B',
    italic: style.italic === true || tag === 'EM' || tag === 'I'
  };
  const out: ExportRun[] = [];
  for (const node of Array.from(element.childNodes)) {
    if (node.nodeType === 3) {
      out.push(styled(collapse(node.nodeValue ?? ''), inherited));
      continue;
    }
    if (node.nodeType !== 1) continue;
    const child = node as Element;
    const childTag = child.tagName.toUpperCase();
    if (SKIPPED_TAGS.has(childTag)) continue;
    if (childTag === 'BR') {
      out.push({ text: '\n' });
      continue;
    }
    out.push(...runsOf(child, inherited));
  }
  return out;
}

function styled(text: string, style: { bold: boolean; italic: boolean }): ExportRun {
  const run: ExportRun = { text };
  if (style.bold) run.bold = true;
  if (style.italic) run.italic = true;
  return run;
}

/** HTML 里的换行与缩进都是空白；不折叠的话每段都会拖着一串源码缩进进 OOXML */
function collapse(text: string): string {
  return text.replace(/\s+/g, ' ');
}

function trimRuns(runs: readonly ExportRun[]): ExportRun[] {
  const kept = runs.filter((run) => run.text !== '');
  while (kept.length > 0 && kept[0]?.text.trim() === '') kept.shift();
  while (kept.length > 0 && kept[kept.length - 1]?.text.trim() === '') kept.pop();
  const first = kept[0];
  if (first) kept[0] = { ...first, text: first.text.replace(/^ +/, '') };
  const last = kept[kept.length - 1];
  if (last) kept[kept.length - 1] = { ...last, text: last.text.replace(/ +$/, '') };
  return plain(kept).trim() === '' ? [] : kept;
}

export function plain(runs: readonly ExportRun[]): string {
  return runs.map((run) => run.text).join('');
}
