/**
 * 导出按钮的装配（0.21.0 分册 15 FR-15.7 ~ FR-15.9 / 设计分册 16 §6）。
 *
 * 判定与编码都在别的文件里，这里只做三件事：决定按钮出不出现、把字节递给浏览器、
 * 把结果如实说给用户听。
 */

import { WebSkillError } from '@webskill/sdk';
import { VIEWER_COMPONENT_ATTR } from '@webskill/sdk/ui';
import type { ViewerNotice } from '../toast';
import { encodeDocx } from './docx';
import { downloadBlob } from './download';
import { extractExportDoc, type ChartImage } from './extract';
import { sanitizeExportFilename, sanitizeExportName } from './filename';
import type { DocImage } from './image';
import { classifyExportKind, exportRootOf, type ExportKind } from './kind';
import { describeOmissions } from './omissions';

export interface ExportUi {
  button: HTMLButtonElement;
  label: HTMLElement;
  /** 结果说给谁听。这里只管说什么，收不收起是提示条自己的事 */
  notice: ViewerNotice;
  /** 活 DOM 的根。导出读的是投放时那份 HTML，只有图表画布与图片尺寸必须从活节点上取 */
  live?: ParentNode;
}

const TEXT = {
  idle: { pptx: { zh: '导出 PPTX', en: 'Export PPTX' }, docx: { zh: '导出 DOCX', en: 'Export DOCX' } },
  busy: { zh: '导出中…', en: 'Exporting…' }
} as const;

/** 每次投放新文档都重装一次；旧的监听随 controller 一起断掉 */
let active: AbortController | undefined;

export function setupViewerExport(pristineHtml: string, ui: ExportUi, zh: boolean): void {
  active?.abort();
  ui.notice.show('');
  ui.button.disabled = false;

  const kind = classifyExportKind(exportRootOf(new DOMParser().parseFromString(pristineHtml, 'text/html')));
  if (kind === 'none') {
    ui.button.hidden = true;
    return;
  }

  const idle = TEXT.idle[kind][zh ? 'zh' : 'en'];
  ui.button.hidden = false;
  ui.label.textContent = idle;
  ui.button.title = idle;
  ui.button.setAttribute('aria-label', idle);
  applyDocumentTitle(pristineHtml, kind);

  const controller = new AbortController();
  active = controller;
  ui.button.addEventListener('click', () => void run(pristineHtml, kind, ui, zh, idle), { signal: controller.signal });
}

/**
 * 把文档标题落成页面标题（FR-15.8）。
 *
 * 打印另存为 PDF 时浏览器拿 `document.title` 当默认文件名，所以这里用的必须是
 * 与导出同一份清洗后的名字，否则同一份文档存成 PDF 和存成 DOCX 会得到两个名字。
 * 标题同样只能从 `extractExportDoc` 里拿——另写一份「轻量取标题」就是等它与导出那份漂移。
 * 此刻图表画布还没渲染，拿不到快照，但标题不依赖它们。
 */
function applyDocumentTitle(html: string, kind: Exclude<ExportKind, 'none'>): void {
  let title: string;
  try {
    title = extractExportDoc(html).title;
  } catch {
    // 抽不出内容的文档照样能打印，只是没有可用的标题；留着 view.html 里那个缺省
    return;
  }
  if (title.trim() === '') return;
  document.title = sanitizeExportName(title, kind);
}

async function run(
  html: string,
  kind: Exclude<ExportKind, 'none'>,
  ui: ExportUi,
  zh: boolean,
  idle: string
): Promise<void> {
  ui.button.disabled = true;
  ui.label.textContent = TEXT.busy[zh ? 'zh' : 'en'];
  ui.notice.show('');
  try {
    const doc = extractExportDoc(html, { chartImages: chartImagesOf(ui.live), docImages: docImagesOf(ui.live), zh });
    // 编码器按需加载：不点导出的人不该为 1.5 MB 的 OOXML 库付一次下载
    const encoded = kind === 'pptx' ? await (await import('./pptx')).encodePptx(doc) : await encodeDocx(doc);
    const filename = sanitizeExportFilename(doc.title, kind);
    downloadBlob(encoded.blob, filename);
    const lines = [
      zh ? `已生成 ${filename}。` : `Generated ${filename}.`,
      describeOmissions(encoded.omissions, zh)
    ].filter((line) => line !== '');
    ui.notice.show(lines.join(' '));
  } catch (error) {
    ui.notice.show(failureLine(error, zh));
  } finally {
    ui.button.disabled = false;
    ui.label.textContent = idle;
  }
}

/**
 * 屏幕上每张图表画布的快照，按文档顺序。
 *
 * 这与 `docImagesOf` 是整条导出链路里仅有的两处读活 DOM 的地方，因为图只存在于画布里，
 * 投放时那份 HTML 上只有一个空占位。取不到就返回空位，编码器自会降级成数据表。
 */
function chartImagesOf(live: ParentNode | undefined): ChartImage[] {
  if (!live) return [];
  const out: ChartImage[] = [];
  for (const node of Array.from(live.querySelectorAll(`[${VIEWER_COMPONENT_ATTR}="Chart"]`))) {
    const canvas = node.querySelector('canvas');
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      out.push({ url: '', width: 0, height: 0 });
      continue;
    }
    try {
      out.push({ url: canvas.toDataURL('image/png'), width: canvas.width, height: canvas.height });
    } catch {
      // 画布被污染就取不出像素；这不是错误，降级成数据表即可
      out.push({ url: '', width: 0, height: 0 });
    }
  }
  return out;
}

/**
 * 屏幕上每张文档图的字节与实测尺寸，按文档顺序（FR-14.3 / FR-14.4）。
 *
 * 尺寸只有活 DOM 上才有：投放时那份 HTML 的 `<img>` 不带宽高，而 `naturalWidth`
 * 要等图解码完才成立。失败占位（`.wsdoc__image-missing`）也要占一个位——
 * 结构化投放按顺序把这份清单配回图片块，少一个就整条错位。
 */
function docImagesOf(live: ParentNode | undefined): DocImage[] {
  if (!live) return [];
  const out: DocImage[] = [];
  for (const node of Array.from(live.querySelectorAll('img, .wsdoc__image-missing'))) {
    if (!(node instanceof HTMLImageElement)) {
      out.push({ url: '', width: 0, height: 0, alt: '' });
      continue;
    }
    out.push({
      url: node.currentSrc === '' ? node.src : node.currentSrc,
      width: node.naturalWidth,
      height: node.naturalHeight,
      alt: node.alt
    });
  }
  return out;
}

function failureLine(error: unknown, zh: boolean): string {
  const code = error instanceof WebSkillError ? error.code : 'EXPORT_FAILED';
  const message = error instanceof Error ? error.message : String(error);
  return zh ? `导出失败（${code}）：${message}` : `Export failed (${code}): ${message}`;
}
