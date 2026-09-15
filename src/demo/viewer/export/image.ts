/**
 * 「这张图嵌得进去吗」的唯一判据（0.22.0 分册 14 FR-14.7 / 设计 15 §3.3）。
 *
 * 结构化投放与 DOM 抽取两条路都走这里，DOCX 与 PPTX 两个编码器因此不可能得出不同结论——
 * 保证它的不是运行时检查，而是两侧根本没有各自的类型清单可看。
 */

import { DOCUMENT_IMAGE_MIME_TYPES } from '@webskill/sdk/browser';
import type { ExportBlock } from './extract';
import { imageLossLine, type ImageLoss, type ImageLossReason, type OmissionCounter } from './omissions';

/**
 * 一张文档图。字节在 `url` 里（`data:` 形态），宽高是活 DOM 上量到的实测值——
 * 投放时那份序列化 HTML 上没有这两个数，而没有它们就只能猜比例，图会被拉扁。
 */
export interface DocImage {
  /** `data:` 开头才嵌得进产物；外链形态留原 URL，于是必然产出一条归因 */
  url: string;
  width: number;
  height: number;
  alt: string;
}

/** 嵌不进去就说清是哪一张、为什么；嵌得进去返回 `undefined` */
export function imageLossReasonOf(image: DocImage): ImageLossReason | undefined {
  if (image.url === '') return 'not-loaded';
  if (!image.url.startsWith('data:')) return 'external-link';
  if (![...DOCUMENT_IMAGE_MIME_TYPES].some((mime) => image.url.startsWith(`data:${mime};`))) return 'unsupported-type';
  if (image.width <= 0 || image.height <= 0) return 'not-loaded';
  return undefined;
}

/**
 * 图片块，或者它丢掉之后留下的那一段话。
 *
 * 占位段落在**转换期**生成而不是留给两个编码器各写一遍：FR-14.7 要的
 * 「两侧结论一致」因此不需要任何运行时机制来保证。
 */
export function imageBlocksOf(
  image: DocImage,
  source: string,
  caption: string | undefined,
  counter: OmissionCounter,
  zh: boolean
): ExportBlock[] {
  const reason = imageLossReasonOf(image);
  if (reason === undefined) {
    return [{ kind: 'image', image, ...(caption === undefined ? {} : { caption }) }];
  }
  const loss: ImageLoss = { alt: image.alt, source, reason };
  counter.addImage(loss);
  return [{ kind: 'paragraph', runs: [{ text: imageLossLine(loss, zh) }] }];
}
