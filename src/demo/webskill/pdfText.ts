import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import type { PdfDocumentHandle, PdfDocumentReader, PdfPageImage, RenderedImage } from '@webskill/sdk/agent';
import { imageAreaRatios } from './pdfImageArea';

/**
 * PDF → 纯文本。**只用于直传被端点拒后的回退**（SDK 0.13.0 分册 22）：
 * PDF 仍然默认原件直传，Gemini 这类真能读 PDF 的端点拿到的还是原件；
 * 只有端点以 4xx 拒收时，运行时才回头调这里把文本抽出来重发一次。
 *
 * pdfjs 而非自写解析：取文本层要处理 xref / 对象流 / FlateDecode / ToUnicode CMap，
 * 手写必错在少数字体上，而且错法是「悄悄给出乱码」。
 */

// worker 必须显式指路：Vite 下 pdfjs 默认的相对路径推断在打包后会指偏
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

/** 同一页内 y 落差超过这个值就当换行，避免整页被拼成一行 */
const LINE_BREAK_TOLERANCE = 2;

const isTextItem = (item: unknown): item is TextItem =>
  typeof item === 'object' && item !== null && 'str' in item && typeof (item as TextItem).str === 'string';

/** 按 transform 的 y 分行重建段落；只靠 `hasEOL` 会漏掉不写 EOL 的生成器 */
function itemsToText(items: unknown[]): string {
  let text = '';
  let lastY: number | undefined;
  // y 分行与 hasEOL 会对同一处断行各判一次，不去重就每行之间多一个空行
  const newline = (): void => {
    if (text !== '' && !text.endsWith('\n')) text += '\n';
  };
  for (const item of items) {
    if (!isTextItem(item)) continue;
    const y = item.transform[5];
    if (lastY !== undefined && typeof y === 'number' && Math.abs(y - lastY) > LINE_BREAK_TOLERANCE) newline();
    text += item.str;
    if (item.hasEOL) newline();
    if (typeof y === 'number') lastY = y;
  }
  return text;
}

/**
 * 抽取全部页的文本层。扫描件没有文本层，返回空串——
 * 调用方（运行时的回退分支）会把空串翻译成「这份 PDF 没有文本层」而不是当成空文档。
 */
export async function extractPdfText(bytes: Uint8Array): Promise<string> {
  // pdfjs 会 detach 传入的 buffer；复制一份，免得调用方手里的字节被清空
  const task = pdfjs.getDocument({ data: new Uint8Array(bytes) });
  const doc = await task.promise;
  try {
    const pages: string[] = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n);
      try {
        const content = await page.getTextContent();
        const text = itemsToText(content.items).trim();
        if (text !== '') pages.push(`--- Page ${n} ---\n${text}`);
      } finally {
        page.cleanup();
      }
    }
    return pages.join('\n\n');
  } finally {
    // v6 的销毁入口在 loadingTask 上：不调就漏一个 worker
    await task.destroy();
  }
}

/**
 * 整页渲成图时的缩放。1.0 是 72dpi，扫描件上的小字会糊成一团；
 * 2.0 约合 144dpi，是「多模态模型认得出」与「别把一张 A4 渲成 8MB」之间的折中。
 */
const RENDER_SCALE = 2;

/** 渲染用 PNG：扫描件与图表都是大色块与细线条，JPEG 的振铃会把小字毁掉 */
const RENDER_MIME = 'image/png';

function base64Of(bytes: Uint8Array): string {
  let binary = '';
  // 分片拼接：一次性 apply 几 MB 会撞 call stack 上限
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

async function renderPage(page: pdfjs.PDFPageProxy): Promise<RenderedImage> {
  const viewport = page.getViewport({ scale: RENDER_SCALE });
  const canvas = new OffscreenCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const context = canvas.getContext('2d');
  if (context === null) throw new Error('This browser could not create a 2D canvas to render the page.');
  // pdfjs 的类型只写了 HTMLCanvasElement，运行时对 OffscreenCanvas 一视同仁
  const target = { canvas, canvasContext: context, viewport } as unknown as Parameters<pdfjs.PDFPageProxy['render']>[0];
  await page.render(target).promise;
  const blob = await canvas.convertToBlob({ type: RENDER_MIME });
  return { mimeType: RENDER_MIME, data: base64Of(new Uint8Array(await blob.arrayBuffer())) };
}

/**
 * 页面上的图像对象有多大——只量面积占比，**不抠图**。
 *
 * 抠出来要处理裁剪、蒙版、色彩空间、CMYK 分色，做错了就是给模型一张废图；
 * 而真正要回答的问题只有一个：这一页值不值得多烧一次多模态请求（SDK FR-22.7）。
 */
async function pageImages(page: pdfjs.PDFPageProxy): Promise<readonly PdfPageImage[]> {
  const viewport = page.getViewport({ scale: 1 });
  const operators = await page.getOperatorList();
  return imageAreaRatios(operators, pdfjs.OPS, viewport.width * viewport.height).map((areaRatio) => ({ areaRatio }));
}

/**
 * 逐页读 PDF（SDK 0.21.0 分册 22）。与上面那个抽取器回答的是两个问题：
 * 那个问「整份的文本是什么」，这个问「第 N 页是什么」。
 *
 * 句柄式而不是一次性读完：几十 MB 的 PDF 全渲成图是几百兆内存，
 * 而模型通常读几页就够了。`close()` 由工具侧在 `finally` 里保证调用。
 */
export const pdfDocumentReader: PdfDocumentReader = {
  async open(bytes: Uint8Array): Promise<PdfDocumentHandle> {
    const task = pdfjs.getDocument({ data: new Uint8Array(bytes) });
    const doc = await task.promise;
    const page = (index: number) => doc.getPage(index + 1);
    return {
      pageCount: doc.numPages,
      text: async (index: number) => itemsToText((await (await page(index)).getTextContent()).items),
      images: async (index: number) => pageImages(await page(index)),
      render: async (index: number) => renderPage(await page(index)),
      close: async () => {
        await task.destroy();
      }
    };
  }
};
