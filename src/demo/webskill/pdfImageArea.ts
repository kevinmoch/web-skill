/**
 * 「这一页上有多大的图」——只量面积占比，**不抠图**（0.21.0 分册 22 FR-22.7）。
 *
 * 单独成模块是为了能被直接测：pdfjs 的运行时要 DOM，而这里要验的是矩阵的账，
 * 一行 pdfjs 代码都不需要。调用方把 `pdfjs.OPS` 传进来，操作码不写死。
 */

/** 用到的 pdfjs 操作码。只列真正参与 CTM 计算的那几个，多一个都不认。 */
export interface PdfOperatorCodes {
  readonly save: number;
  readonly restore: number;
  readonly transform: number;
  readonly paintFormXObjectBegin: number;
  readonly paintFormXObjectEnd: number;
  readonly paintImageXObject: number;
  readonly paintInlineImageXObject: number;
}

/** `page.getOperatorList()` 里本模块要读的两个字段 */
export interface PdfOperatorList {
  readonly fnArray: readonly number[];
  readonly argsArray: readonly unknown[];
}

type Matrix = readonly [number, number, number, number, number, number];

const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

/** PDF 的 `cm` 语义：新 CTM = m × 当前 CTM（m 先作用） */
function multiply(m: Matrix, base: Matrix): Matrix {
  return [
    m[0] * base[0] + m[1] * base[2],
    m[0] * base[1] + m[1] * base[3],
    m[2] * base[0] + m[3] * base[2],
    m[2] * base[1] + m[3] * base[3],
    m[4] * base[0] + m[5] * base[2] + base[4],
    m[4] * base[1] + m[5] * base[3] + base[5]
  ];
}

function asMatrix(value: unknown): Matrix | undefined {
  if (!Array.isArray(value) || value.length < 6) return undefined;
  const [a, b, c, d, e, f] = value as unknown[];
  if (
    typeof a !== 'number' ||
    typeof b !== 'number' ||
    typeof c !== 'number' ||
    typeof d !== 'number' ||
    typeof e !== 'number' ||
    typeof f !== 'number'
  ) {
    return undefined;
  }
  return [a, b, c, d, e, f];
}

/**
 * 每个图像对象在页面上占的面积比。
 *
 * 图像 XObject 画的永远是**单位正方形**，所以画它那一刻的 CTM 的 `|ad − bc|`
 * 就是它在用户空间里的面积。关键在于 CTM 是**一路累乘**下来的：
 * 只回头找最近一条 `transform` 会漏掉外层的缩放与 Form XObject 的自身矩阵，
 * 算出来的占比可以比整页还大（实测某份 11 页的 PDF 得到 4.9 / 7.5 / 11.1 倍页面），
 * 于是「≥15% 才投」这道闸门等于没有——页眉里的小 logo 一样会把整页渲成图。
 *
 * @param pageArea 页面在用户空间里的面积（`getViewport({ scale: 1 })` 的宽 × 高）
 */
export function imageAreaRatios(operators: PdfOperatorList, ops: PdfOperatorCodes, pageArea: number): number[] {
  if (!Number.isFinite(pageArea) || pageArea <= 0) return [];
  const ratios: number[] = [];
  const stack: Matrix[] = [];
  let ctm: Matrix = IDENTITY;
  for (const [index, fn] of operators.fnArray.entries()) {
    const args = operators.argsArray[index];
    if (fn === ops.save) {
      stack.push(ctm);
    } else if (fn === ops.restore) {
      ctm = stack.pop() ?? IDENTITY;
    } else if (fn === ops.transform) {
      const m = asMatrix(args);
      if (m) ctm = multiply(m, ctm);
    } else if (fn === ops.paintFormXObjectBegin) {
      // pdfjs 的画布实现在这里先 save 再乘上 Form 自己的矩阵，两步都要跟上
      stack.push(ctm);
      const m = asMatrix(Array.isArray(args) ? args[0] : undefined);
      if (m) ctm = multiply(m, ctm);
    } else if (fn === ops.paintFormXObjectEnd) {
      ctm = stack.pop() ?? IDENTITY;
    } else if (fn === ops.paintImageXObject || fn === ops.paintInlineImageXObject) {
      const drawn = Math.abs(ctm[0] * ctm[3] - ctm[1] * ctm[2]);
      if (drawn > 0) ratios.push(drawn / pageArea);
    }
  }
  return ratios;
}
