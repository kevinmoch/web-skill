/**
 * 结构化投放模型（0.21.0 分册 19 FR-19.1）。
 *
 * 屏幕上那一份与另存下来那一份之所以以前会长得不一样，是因为它们的输入不同：
 * 屏幕吃模型手写的 HTML+CSS，导出吃从 DOM 上刮回来的残渣。这里换成**一份模型两个消费方**——
 * 技能只交 JSON，`publish.js` 按固定规则把它渲染成 HTML 并把原样 JSON 挂回根节点，
 * 导出直接读那份 JSON。两边看到的是同一组字段，不一致就不再是「难免的」，而是缺陷。
 *
 * 本文件只定义形状与解析，不碰任何输出格式。
 */

/** 根节点上挂模型的属性；技能侧 `publish.js` 与这里必须逐字一致 */
export const AUTHORED_MODEL_ATTR = 'data-webskill-doc-model';
/** 根节点上的模型种类标记，判型直接读它 */
export const AUTHORED_KIND_ATTR = 'data-webskill-doc';

export interface AuthoredPalette {
  background: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  border: string;
}

export interface AuthoredMetaItem {
  label: string;
  value: string;
}

export interface AuthoredMetric {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export interface AuthoredChart {
  chartType: string;
  title?: string;
  labels: string[];
  series: { name: string; values: number[] }[];
  caption?: string;
}

export interface AuthoredTable {
  title?: string;
  columns: string[];
  rows: (string | number | boolean | null)[][];
  columnWidths?: number[];
  caption?: string;
}

/**
 * 图片块（0.22.0 FR-11.1 / FR-11.2）。公文与幻灯片共用同一个形状。
 *
 * 没有 `width` / `height` / `mimeType`：那些是**事实**，而技能写进来的只能是**声明**。
 * 像素数是投放预算的硬兜底维度（FR-10.7），让模型自报等于让被限制方自报限额。
 */
export interface AuthoredImage {
  /** 图片引用：`artifact:` / `upload:` / `remote:` 前缀 + 受限段 */
  ref: string;
  /** 替代文本。丢图时它是唯一留得下的线索，所以不兜默认值 */
  alt: string;
  caption?: string;
}

/**
 * 正文块。`text` 字段里 `**…**` 表示加粗——这是模型能表达的**唯一**内联样式，
 * 屏幕与 OOXML 两侧都还原得出来，所以它不是妥协，是刻意收窄的交集。
 */
export type AuthoredBlock =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered?: boolean; items: string[] }
  | ({ type: 'table' } & AuthoredTable)
  | ({ type: 'chart' } & AuthoredChart)
  | ({ type: 'image' } & AuthoredImage)
  | { type: 'metrics'; items: AuthoredMetric[] }
  | { type: 'keyValue'; title?: string; items: AuthoredMetaItem[] }
  | { type: 'callout'; tone?: 'info' | 'success' | 'warning' | 'danger'; title?: string; text: string }
  | { type: 'quote'; text: string; source?: string }
  | { type: 'divider' }
  | { type: 'pageBreak' };

export interface AuthoredOfficialHeader {
  issuer: string;
  documentNumber?: string;
  recipient?: string;
}

export interface AuthoredSignature {
  org?: string;
  date?: string;
}

export interface AuthoredDocumentModel {
  kind: 'document';
  /** `plain` 是普通 Word 文档，`official` 才是红头公文（FR-19.4） */
  docType: 'plain' | 'official';
  title: string;
  subtitle?: string;
  meta?: AuthoredMetaItem[];
  official?: AuthoredOfficialHeader;
  blocks: AuthoredBlock[];
  signature?: AuthoredSignature;
  palette: AuthoredPalette;
}

/** 幻灯片正文槽位：一页放几个由 `layout` 决定，密度校验也据此进行 */
export type AuthoredSlideItem =
  | ({ type: 'chart' } & AuthoredChart)
  | ({ type: 'table' } & AuthoredTable)
  | ({ type: 'image' } & AuthoredImage)
  | { type: 'metrics'; items: AuthoredMetric[] }
  | { type: 'keyValue'; title?: string; items: AuthoredMetaItem[] }
  | { type: 'bullets'; title?: string; items: string[] }
  | { type: 'paragraph'; title?: string; text: string };

export type AuthoredSlideLayout = 'cover' | 'section' | 'single' | 'split' | 'grid' | 'closing';

export interface AuthoredSlide {
  layout: AuthoredSlideLayout;
  title?: string;
  subtitle?: string;
  meta?: AuthoredMetaItem[];
  body: AuthoredSlideItem[];
  takeaway?: string;
}

export interface AuthoredDeckModel {
  kind: 'deck';
  title: string;
  theme: 'dark' | 'light';
  slides: AuthoredSlide[];
  palette: AuthoredPalette;
}

export type AuthoredModel = AuthoredDocumentModel | AuthoredDeckModel;

/**
 * 从根节点读回模型。读不到、或读到的不是本契约的形状，一律返回 `undefined`，
 * 让调用方退回 DOM 抽取那条老路——外部技能写的手工 HTML 仍然导得出来。
 */
export function readAuthoredModel(root: Element | null): AuthoredModel | undefined {
  const raw = root?.getAttribute(AUTHORED_MODEL_ATTR);
  if (raw === null || raw === undefined || raw === '') return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return undefined;
  }
  if (typeof parsed !== 'object' || parsed === null) return undefined;
  const model = parsed as { kind?: unknown };
  if (model.kind === 'document') return documentModel(parsed as Record<string, unknown>);
  if (model.kind === 'deck') return deckModel(parsed as Record<string, unknown>);
  return undefined;
}

const DEFAULT_PALETTE: AuthoredPalette = {
  background: '#ffffff',
  surface: '#f5f7fa',
  text: '#1a1a1a',
  muted: '#5c6b7f',
  accent: '#1a6fd4',
  border: '#d8dee8'
};

function documentModel(raw: Record<string, unknown>): AuthoredDocumentModel | undefined {
  const blocks = blockList(raw['blocks']);
  if (blocks === undefined) return undefined;
  const model: AuthoredDocumentModel = {
    kind: 'document',
    docType: raw['docType'] === 'official' ? 'official' : 'plain',
    title: text(raw['title']),
    blocks,
    palette: palette(raw['palette'])
  };
  const subtitle = text(raw['subtitle']);
  if (subtitle !== '') model.subtitle = subtitle;
  const meta = metaList(raw['meta']);
  if (meta.length > 0) model.meta = meta;
  const official = officialHeader(raw['official']);
  if (official !== undefined) model.official = official;
  const signature = signatureOf(raw['signature']);
  if (signature !== undefined) model.signature = signature;
  return model;
}

function deckModel(raw: Record<string, unknown>): AuthoredDeckModel | undefined {
  const list = Array.isArray(raw['slides']) ? raw['slides'] : undefined;
  if (list === undefined) return undefined;
  const slides: AuthoredSlide[] = [];
  for (const entry of list) {
    const slide = slideOf(entry);
    if (slide !== undefined) slides.push(slide);
  }
  if (slides.length === 0) return undefined;
  return {
    kind: 'deck',
    title: text(raw['title']),
    theme: raw['theme'] === 'light' ? 'light' : 'dark',
    slides,
    palette: palette(raw['palette'])
  };
}

const SLIDE_LAYOUTS = new Set<string>(['cover', 'section', 'single', 'split', 'grid', 'closing']);

function slideOf(raw: unknown): AuthoredSlide | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const entry = raw as Record<string, unknown>;
  const layout = typeof entry['layout'] === 'string' && SLIDE_LAYOUTS.has(entry['layout']) ? entry['layout'] : 'single';
  const body: AuthoredSlideItem[] = [];
  for (const item of Array.isArray(entry['body']) ? entry['body'] : []) {
    const one = slideItem(item);
    if (one !== undefined) body.push(one);
  }
  const slide: AuthoredSlide = { layout: layout as AuthoredSlideLayout, body };
  const title = text(entry['title']);
  if (title !== '') slide.title = title;
  const subtitle = text(entry['subtitle']);
  if (subtitle !== '') slide.subtitle = subtitle;
  const meta = metaList(entry['meta']);
  if (meta.length > 0) slide.meta = meta;
  const takeaway = text(entry['takeaway']);
  if (takeaway !== '') slide.takeaway = takeaway;
  return slide;
}

function slideItem(raw: unknown): AuthoredSlideItem | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const entry = raw as Record<string, unknown>;
  switch (entry['type']) {
    case 'chart':
      return chartOf(entry);
    case 'table':
      return tableOf(entry);
    case 'image':
      return imageOf(entry);
    case 'metrics':
      return { type: 'metrics', items: metricList(entry['items']) };
    case 'keyValue': {
      const item: AuthoredSlideItem = { type: 'keyValue', items: metaList(entry['items']) };
      const title = text(entry['title']);
      if (title !== '') item.title = title;
      return item;
    }
    case 'bullets': {
      const item: AuthoredSlideItem = { type: 'bullets', items: stringList(entry['items']) };
      const title = text(entry['title']);
      if (title !== '') item.title = title;
      return item;
    }
    case 'paragraph': {
      const item: AuthoredSlideItem = { type: 'paragraph', text: text(entry['text']) };
      const title = text(entry['title']);
      if (title !== '') item.title = title;
      return item;
    }
    default:
      return undefined;
  }
}

function blockList(raw: unknown): AuthoredBlock[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: AuthoredBlock[] = [];
  for (const entry of raw) {
    const block = blockOf(entry);
    if (block !== undefined) out.push(block);
  }
  return out;
}

function blockOf(raw: unknown): AuthoredBlock | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const entry = raw as Record<string, unknown>;
  switch (entry['type']) {
    case 'heading': {
      const level = Number(entry['level']);
      return { type: 'heading', level: level === 1 ? 1 : level === 3 ? 3 : 2, text: text(entry['text']) };
    }
    case 'paragraph':
      return { type: 'paragraph', text: text(entry['text']) };
    case 'list':
      return { type: 'list', ordered: entry['ordered'] === true, items: stringList(entry['items']) };
    case 'table':
      return tableOf(entry);
    case 'chart':
      return chartOf(entry);
    case 'image':
      return imageOf(entry);
    case 'metrics':
      return { type: 'metrics', items: metricList(entry['items']) };
    case 'keyValue': {
      const block: AuthoredBlock = { type: 'keyValue', items: metaList(entry['items']) };
      const title = text(entry['title']);
      if (title !== '') block.title = title;
      return block;
    }
    case 'callout': {
      const tone = entry['tone'];
      const block: AuthoredBlock = {
        type: 'callout',
        text: text(entry['text']),
        ...(tone === 'success' || tone === 'warning' || tone === 'danger' ? { tone } : { tone: 'info' as const })
      };
      const title = text(entry['title']);
      if (title !== '') block.title = title;
      return block;
    }
    case 'quote': {
      const block: AuthoredBlock = { type: 'quote', text: text(entry['text']) };
      const source = text(entry['source']);
      if (source !== '') block.source = source;
      return block;
    }
    case 'divider':
      return { type: 'divider' };
    case 'pageBreak':
      return { type: 'pageBreak' };
    default:
      return undefined;
  }
}

function tableOf(entry: Record<string, unknown>): { type: 'table' } & AuthoredTable {
  const block: { type: 'table' } & AuthoredTable = {
    type: 'table',
    columns: stringList(entry['columns']),
    rows: Array.isArray(entry['rows']) ? entry['rows'].map(cellRow) : []
  };
  const title = text(entry['title']);
  if (title !== '') block.title = title;
  const caption = text(entry['caption']);
  if (caption !== '') block.caption = caption;
  const widths = Array.isArray(entry['columnWidths'])
    ? entry['columnWidths'].map(Number).filter((value) => Number.isFinite(value) && value > 0)
    : [];
  if (widths.length > 0) block.columnWidths = widths;
  return block;
}

/**
 * `ref` 与 `alt` 缺一即整块判畸形（FR-11.4），不兜默认值。
 * 空 `alt` 与没有 `alt` 是同一件事：丢图时什么都不剩，而那正是本版要消灭的形态。
 */
function imageOf(entry: Record<string, unknown>): ({ type: 'image' } & AuthoredImage) | undefined {
  const ref = entry['ref'];
  const alt = entry['alt'];
  if (typeof ref !== 'string' || ref === '') return undefined;
  if (typeof alt !== 'string' || alt === '') return undefined;
  const block: { type: 'image' } & AuthoredImage = { type: 'image', ref, alt };
  const caption = text(entry['caption']);
  if (caption !== '') block.caption = caption;
  return block;
}

function chartOf(entry: Record<string, unknown>): { type: 'chart' } & AuthoredChart {
  const block: { type: 'chart' } & AuthoredChart = {
    type: 'chart',
    chartType: text(entry['chartType']) === '' ? 'bar' : text(entry['chartType']),
    labels: stringList(entry['labels']),
    series: Array.isArray(entry['series'])
      ? entry['series'].map((one) => {
          const series = (one ?? {}) as Record<string, unknown>;
          return {
            name: text(series['name']),
            values: Array.isArray(series['values']) ? series['values'].map((value) => Number(value) || 0) : []
          };
        })
      : []
  };
  const title = text(entry['title']);
  if (title !== '') block.title = title;
  const caption = text(entry['caption']);
  if (caption !== '') block.caption = caption;
  return block;
}

function cellRow(raw: unknown): (string | number | boolean | null)[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((cell) => {
    if (cell === null || typeof cell === 'string' || typeof cell === 'number' || typeof cell === 'boolean') return cell;
    // 对象/数组落到这儿只能是模型给错了形状。`String(它)` 会在正文里印出
    // `[object Object]`——一份版式完好、读不成句的文档比空格难查得多
    return '';
  });
}

function metricList(raw: unknown): AuthoredMetric[] {
  if (!Array.isArray(raw)) return [];
  const out: AuthoredMetric[] = [];
  for (const entry of raw) {
    if (typeof entry !== 'object' || entry === null) continue;
    const one = entry as Record<string, unknown>;
    const value = one['value'];
    const metric: AuthoredMetric = {
      label: text(one['label']),
      value: typeof value === 'number' ? value : text(value)
    };
    const change = text(one['change']);
    if (change !== '') metric.change = change;
    const trend = one['trend'];
    if (trend === 'up' || trend === 'down' || trend === 'neutral') metric.trend = trend;
    out.push(metric);
  }
  return out;
}

function metaList(raw: unknown): AuthoredMetaItem[] {
  if (!Array.isArray(raw)) return [];
  const out: AuthoredMetaItem[] = [];
  for (const entry of raw) {
    if (typeof entry !== 'object' || entry === null) continue;
    const one = entry as Record<string, unknown>;
    out.push({ label: text(one['label']), value: text(one['value']) });
  }
  return out;
}

function officialHeader(raw: unknown): AuthoredOfficialHeader | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const entry = raw as Record<string, unknown>;
  const issuer = text(entry['issuer']);
  if (issuer === '') return undefined;
  const header: AuthoredOfficialHeader = { issuer };
  const documentNumber = text(entry['documentNumber']);
  if (documentNumber !== '') header.documentNumber = documentNumber;
  const recipient = text(entry['recipient']);
  if (recipient !== '') header.recipient = recipient;
  return header;
}

function signatureOf(raw: unknown): AuthoredSignature | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const entry = raw as Record<string, unknown>;
  const org = text(entry['org']);
  const date = text(entry['date']);
  if (org === '' && date === '') return undefined;
  return { ...(org === '' ? {} : { org }), ...(date === '' ? {} : { date }) };
}

function palette(raw: unknown): AuthoredPalette {
  if (typeof raw !== 'object' || raw === null) return DEFAULT_PALETTE;
  const entry = raw as Record<string, unknown>;
  const pick = (key: keyof AuthoredPalette): string => {
    const value = text(entry[key]);
    return /^#[0-9a-fA-F]{6}$/.test(value) ? value : DEFAULT_PALETTE[key];
  };
  return {
    background: pick('background'),
    surface: pick('surface'),
    text: pick('text'),
    muted: pick('muted'),
    accent: pick('accent'),
    border: pick('border')
  };
}

function stringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(text).filter((value) => value !== '');
}

function text(raw: unknown): string {
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'number' || typeof raw === 'boolean') return String(raw);
  return '';
}

/** `**粗体**` → 片段序列。屏幕与 OOXML 两侧共用这一份解析，粗到哪儿为止不会两边不同 */
export function inlineRuns(source: string): { text: string; bold?: boolean }[] {
  const out: { text: string; bold?: boolean }[] = [];
  let rest = source;
  while (rest !== '') {
    const open = rest.indexOf('**');
    if (open < 0) break;
    const close = rest.indexOf('**', open + 2);
    if (close < 0) break;
    if (open > 0) out.push({ text: rest.slice(0, open) });
    const bold = rest.slice(open + 2, close);
    if (bold !== '') out.push({ text: bold, bold: true });
    rest = rest.slice(close + 2);
  }
  if (rest !== '') out.push({ text: rest });
  return out.length > 0 ? out : [{ text: source }];
}
