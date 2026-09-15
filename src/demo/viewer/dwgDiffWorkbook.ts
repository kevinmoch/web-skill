/**
 * 差异导出的工作簿（分册 39 FR-39.11 ~ FR-39.14）。
 *
 * xlsx 的字节交给 `@webskill/sdk` 的 `encodeSpreadsheet`——仓内为「唯一汇聚点」立过守卫，
 * 这里只负责把差异摆成两张表（FR-39.13）。
 * 本模块由调用方**动态 import**，编码器因此不进查看器首屏（FR-39.14）。
 *
 * 差异说明由调用方传进来，不在这里拼：屏幕上那句和文件里这句必须是同一句，
 * 而成句的文案只有界面那一侧知道当前语言（FR-37.25）。
 */

import { SPREADSHEET_MIME_TYPE, encodeSpreadsheet } from '@webskill/sdk';
import type { DiffKind, DiffSummary } from './dwgComponentDiff';
import { sanitizeExportFilename } from './export/filename';

export interface DiffExportRow {
  /** 与屏幕表格、画布圆圈同一个编号（FR-39.9） */
  readonly no: number;
  readonly kind: DiffKind;
  readonly block: string;
  /** 与屏幕上逐字相同的那句说明 */
  readonly detail: string;
  /** 标记锚点，图纸单位 */
  readonly x: number;
  readonly y: number;
}

export interface DiffExportInput {
  readonly zh: boolean;
  readonly nameA: string;
  readonly nameB: string;
  readonly toleranceMm: number;
  /** 选框在图纸坐标下的边界 */
  readonly box: { readonly minX: number; readonly minY: number; readonly maxX: number; readonly maxY: number };
  /** 两侧各自参与比对的构件数 */
  readonly counts: { readonly a: number; readonly b: number };
  /** 两侧各自不属于任何块、未参与比对的几何条数 */
  readonly stray: { readonly a: number; readonly b: number };
  readonly summary: DiffSummary;
  /** 五种差异的显示名，与面板同源 */
  readonly kindLabel: Readonly<Record<DiffKind, string>>;
  /** 选框内**全部**差异，不受屏幕展示上限约束（FR-39.9） */
  readonly rows: readonly DiffExportRow[];
  readonly at: Date;
}

const TEXT = {
  zh: {
    summarySheet: '汇总',
    detailSheet: '差异明细',
    item: '项',
    value: '值',
    drawingA: '图纸甲',
    drawingB: '图纸乙',
    at: '导出时间',
    tolerance: '容差（毫米）',
    scope: '比对范围（图纸坐标）',
    scopeValue: (minX: number, maxX: number, minY: number, maxY: number) =>
      `X ${fixed(minX)} ~ ${fixed(maxX)}，Y ${fixed(minY)} ~ ${fixed(maxY)}`,
    comparedA: '甲参与比对的构件数',
    comparedB: '乙参与比对的构件数',
    strayA: '甲未参与比对的几何条数',
    strayB: '乙未参与比对的几何条数',
    total: '差异总数',
    none: '选框内没有差异。',
    columns: ['序号', '类型', '块名', '差异说明', 'X', 'Y'],
    file: (a: string, b: string, stamp: string) => `差异 ${a} vs ${b} ${stamp}`
  },
  en: {
    summarySheet: 'Summary',
    detailSheet: 'Differences',
    item: 'Item',
    value: 'Value',
    drawingA: 'Drawing A',
    drawingB: 'Drawing B',
    at: 'Exported at',
    tolerance: 'Tolerance (mm)',
    scope: 'Compared range (drawing coordinates)',
    scopeValue: (minX: number, maxX: number, minY: number, maxY: number) =>
      `X ${fixed(minX)} ~ ${fixed(maxX)}, Y ${fixed(minY)} ~ ${fixed(maxY)}`,
    comparedA: 'Components compared in A',
    comparedB: 'Components compared in B',
    strayA: 'Uncompared geometry in A',
    strayB: 'Uncompared geometry in B',
    total: 'Total differences',
    none: 'No differences inside the box.',
    columns: ['No.', 'Kind', 'Block', 'Difference', 'X', 'Y'],
    file: (a: string, b: string, stamp: string) => `Diff ${a} vs ${b} ${stamp}`
  }
} as const;

function fixed(value: number): string {
  return value.toFixed(2);
}

/** 图纸坐标进单元格前收到两位小数：原值动辄十几位，铺开来没人读得下去 */
function round(value: number): number {
  return Number(value.toFixed(2));
}

function stampOf(at: Date): string {
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${at.getFullYear()}${pad(at.getMonth() + 1)}${pad(at.getDate())}-${pad(at.getHours())}${pad(at.getMinutes())}`;
}

function readableAt(at: Date): string {
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())} ${pad(at.getHours())}:${pad(
    at.getMinutes()
  )}`;
}

/** 同一份清洗、同一个时刻：提示里说的文件名与真正落盘的必须是同一个（FR-39.12） */
export function diffWorkbookFilename(input: DiffExportInput): string {
  const t = TEXT[input.zh ? 'zh' : 'en'];
  return sanitizeExportFilename(t.file(input.nameA, input.nameB, stampOf(input.at)), 'xlsx');
}

export async function buildDiffWorkbook(input: DiffExportInput): Promise<Blob> {
  const t = TEXT[input.zh ? 'zh' : 'en'];
  const { summary } = input;
  const order: readonly DiffKind[] = ['missing', 'added', 'count', 'moved', 'attribute'];
  const rows: (string | number)[][] = [
    [t.drawingA, input.nameA],
    [t.drawingB, input.nameB],
    [t.at, readableAt(input.at)],
    [t.tolerance, input.toleranceMm],
    [t.scope, t.scopeValue(input.box.minX, input.box.maxX, input.box.minY, input.box.maxY)],
    [t.comparedA, input.counts.a],
    [t.comparedB, input.counts.b],
    [t.strayA, input.stray.a],
    [t.strayB, input.stray.b],
    [t.total, summary.total],
    // 计数为零的类别在这里**保留**：表格是拿来查的，固定的行位比省掉几行更好用。
    // 面板上那句话相反，零项略去（FR-39.4）——两处的读法本来就不同
    ...order.map((kind) => [input.kindLabel[kind], summary.byKind[kind]])
  ];
  if (summary.total === 0) rows.push([t.none, '']);

  const bytes = await encodeSpreadsheet({
    sheets: [
      { name: t.summarySheet, columns: [t.item, t.value], rows },
      {
        name: t.detailSheet,
        columns: [...t.columns],
        rows: input.rows.map((row) => [
          row.no,
          input.kindLabel[row.kind],
          row.block,
          row.detail,
          round(row.x),
          round(row.y)
        ])
      }
    ]
  });
  // TS 6 把 `Uint8Array` 的缓冲算作 `ArrayBufferLike`（可能是 SharedArrayBuffer），
  // 那一支不是 `BlobPart`。拷进一个确定的 ArrayBuffer 比一路断言省心
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return new Blob([buffer], { type: SPREADSHEET_MIME_TYPE });
}
