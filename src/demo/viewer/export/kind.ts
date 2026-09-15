/**
 * 判型（0.21.0 分册 15 FR-15.7 / 分册 19 FR-19.6）。
 *
 * 结构化投放的根节点自己写明是哪一种（`data-webskill-doc`），判型直接读它。
 * 手写 HTML 的技能没有这个标记，退回旧判据：`authored-screen` 强制
 * `data-viewer-chrome="hidden"`，其余无标记的按公文走 DOCX。
 */

import { AUTHORED_KIND_ATTR } from '../authored/model';

export type ExportKind = 'pptx' | 'docx' | 'none';

/**
 * 内置技能的期望判型。判型函数改动时，`viewerExportKind.test.ts` 会拿这张表
 * 逐条回放；表本身的完备性（三个技能一个不少）也由那条守卫盯着。
 */
export const BUILTIN_EXPORT_KIND = {
  'authored-slides': 'pptx',
  'authored-bulletin': 'docx',
  'authored-screen': 'none',
  // 编排型技能（FR-19.13）：它自己不投任何 HTML，投放面由 `view_dwg` 出。
  // 那是一张交互式图纸，导成 DOCX/PPTX 只会得到一张死图
  'dwg-view': 'none'
} as const satisfies Record<string, ExportKind>;

/**
 * 缺省给 `docx` 是有意的：公文类技能不带任何根节点标记，若默认 `none`，
 * 新写的公文技能就得先改 SDK 才能导出。但「未知的新版式」不能顺着这个缺省
 * 走进 DOCX——所以带了 `data-viewer-mode` 却不是 `slides` 的一律 `none`。
 */
export function classifyExportKind(root: Element | null): ExportKind {
  if (!root) return 'none';
  const authored = root.getAttribute(AUTHORED_KIND_ATTR);
  if (authored === 'deck') return 'pptx';
  if (authored === 'document') return 'docx';
  if (authored !== null) return 'none';
  if (root.getAttribute('data-viewer-mode') === 'slides') return 'pptx';
  if (root.hasAttribute('data-viewer-chrome')) return 'none';
  if (root.hasAttribute('data-viewer-mode')) return 'none';
  return 'docx';
}

/** 投放面上拿到的是序列化后的 HTML；根节点 = body 的第一个元素子节点 */
export function exportRootOf(document: Document): Element | null {
  return document.body.firstElementChild;
}
