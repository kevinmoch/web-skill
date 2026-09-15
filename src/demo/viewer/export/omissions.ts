/**
 * 未导出清单（0.21.0 分册 15 FR-15.6 / 设计分册 16 §5）。
 *
 * `kind` 是稳定的英文标识，面向用户的句子在这里现生成——文案不得暗示
 * 「换个方式就能导出」，本版没有那个能力，写了就是骗人。
 */

export type OmissionKind =
  | 'gauge-shape'
  | 'metric-shape'
  | 'key-value-shape'
  | 'chart-as-picture'
  | 'chart-downgraded-to-table'
  | 'unsupported-chart-type'
  | 'image-dropped'
  | 'inline-graphic'
  | 'css-decoration'
  | 'unparsable-component-props'
  | 'unknown-component';

/** 一张图没进产物的原因（0.22.0 FR-14.5）。稳定标识，不是给人读的句子 */
export type ImageLossReason = 'external-link' | 'unsupported-type' | 'not-loaded';

/** 哪一张、为什么。计数回答不了这两个问题，所以图片不走 `inline-graphic` */
export interface ImageLoss {
  /** 替代文本；空串意味着这张图本来就没写替代文本 */
  alt: string;
  /** 来源标识：结构化投放是 `ref`，手写 HTML 是 `src` */
  source: string;
  reason: ImageLossReason;
}

export interface ExportOmission {
  kind: OmissionKind;
  count: number;
  /** 只有 `image-dropped` 带：一条计数说不出是哪张图（AC-14.4） */
  images?: ImageLoss[];
}

/** 累计器：抽取与编码两侧都往里记，最后合并成一张清单 */
export class OmissionCounter {
  readonly #counts = new Map<OmissionKind, number>();
  readonly #images: ImageLoss[] = [];

  add(kind: OmissionKind, count = 1): void {
    if (count <= 0) return;
    this.#counts.set(kind, (this.#counts.get(kind) ?? 0) + count);
  }

  addImage(loss: ImageLoss): void {
    this.#images.push(loss);
    this.add('image-dropped');
  }

  /** 顺序按 `OmissionKind` 的声明序，保证清单文案是确定的 */
  list(): ExportOmission[] {
    return ORDER.filter((kind) => this.#counts.has(kind)).map((kind) => ({
      kind,
      count: this.#counts.get(kind) ?? 0,
      ...(kind === 'image-dropped' ? { images: [...this.#images] } : {})
    }));
  }
}

/** 合并两侧的清单（抽取的结构性缺失 + 编码器的格式性降级） */
export function mergeOmissions(...lists: readonly (readonly ExportOmission[])[]): ExportOmission[] {
  const counter = new OmissionCounter();
  for (const list of lists) {
    for (const item of list) {
      if (item.images !== undefined) for (const loss of item.images) counter.addImage(loss);
      else counter.add(item.kind, item.count);
    }
  }
  return counter.list();
}

interface Label {
  zh: (n: number) => string;
  en: (n: number) => string;
  /** 降级：内容还在，只是换了形态；与「没了」分开说 */
  downgraded?: true;
}

const LABELS: Record<OmissionKind, Label> = {
  'gauge-shape': { zh: (n) => `${n} 张仪表盘的图形形态`, en: (n) => `${n} gauge${n > 1 ? 's' : ''} as shapes` },
  'metric-shape': { zh: (n) => `${n} 张指标卡的图形形态`, en: (n) => `${n} metric card${n > 1 ? 's' : ''} as shapes` },
  'key-value-shape': {
    zh: (n) => `${n} 组键值表的图形形态`,
    en: (n) => `${n} key-value list${n > 1 ? 's' : ''} as shapes`
  },
  'chart-as-picture': {
    zh: (n) => `${n} 张图表贴的是屏幕上那张图，数字另附在下方的数据表里`,
    en: (n) =>
      `${n} chart${n > 1 ? 's' : ''} came across as the on-screen picture, with the numbers in the table below`,
    downgraded: true
  },
  'chart-downgraded-to-table': {
    zh: (n) => `${n} 张图表已降级为数据表`,
    en: (n) => `${n} chart${n > 1 ? 's' : ''} became data tables`,
    downgraded: true
  },
  'unsupported-chart-type': {
    zh: (n) => `${n} 张图表的类型不受支持，已降级为数据表`,
    en: (n) => `${n} chart${n > 1 ? 's' : ''} used an unsupported type and became data tables`,
    downgraded: true
  },
  'image-dropped': { zh: (n) => `${n} 张图片`, en: (n) => `${n} image${n > 1 ? 's' : ''}` },
  'inline-graphic': { zh: (n) => `${n} 处内联图形`, en: (n) => `${n} inline graphic${n > 1 ? 's' : ''}` },
  'css-decoration': { zh: () => '技能自带的配色与版式', en: () => 'the skill’s own colours and layout' },
  'unparsable-component-props': {
    zh: (n) => `${n} 个组件的数据无法解析`,
    en: (n) => `${n} component${n > 1 ? 's' : ''} with unreadable data`
  },
  'unknown-component': {
    zh: (n) => `${n} 个未知组件`,
    en: (n) => `${n} unrecognised component${n > 1 ? 's' : ''}`
  }
};

const ORDER = Object.keys(LABELS) as OmissionKind[];

const LOSS_REASON: Record<ImageLossReason, { zh: string; en: string }> = {
  'external-link': {
    zh: '这是一张外链图片，另存时取不到它的字节。',
    en: 'It is an external link, so the export could not fetch its bytes.'
  },
  'unsupported-type': { zh: '图片的类型不受支持。', en: 'Its image type is not supported.' },
  'not-loaded': { zh: '投放时这张图就没能加载。', en: 'It had not loaded when the document was delivered.' }
};

/**
 * 丢图时留在**产物正文里**的那一行（FR-14.6）。
 * 提示条上那句话只说「少了几张」，而打开文件的人手里没有提示条——
 * 一张图没了，不该连这里本来有什么都不知道。
 */
export function imageLossLine(loss: ImageLoss, zh: boolean): string {
  const what = loss.alt === '' ? (zh ? '未命名图片' : 'untitled image') : loss.alt;
  const why = LOSS_REASON[loss.reason][zh ? 'zh' : 'en'];
  return zh ? `［未包含的图片：${what}］${why}` : `[image not included: ${what}] ${why}`;
}

/**
 * 生成就地展示的那一行。空清单返回空串（没有丢东西就不必说话）。
 */
export function describeOmissions(omissions: readonly ExportOmission[], zh: boolean): string {
  const say = (item: ExportOmission): string => LABELS[item.kind][zh ? 'zh' : 'en'](item.count);
  const lost = omissions.filter((item) => !LABELS[item.kind].downgraded).map(say);
  const moved = omissions.filter((item) => LABELS[item.kind].downgraded).map(say);
  const sentences: string[] = [];
  if (zh) {
    if (lost.length > 0) sentences.push(`本次导出只保留文字与数据，未包含：${lost.join('、')}。`);
    if (moved.length > 0) sentences.push(`${moved.join('；')}。`);
  } else {
    if (lost.length > 0) sentences.push(`This export keeps text and data only. Not included: ${lost.join(', ')}.`);
    if (moved.length > 0) sentences.push(`${moved.join('; ')}.`);
  }
  return sentences.join(' ');
}
