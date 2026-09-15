/**
 * 公文 / 普通文档 → DOCX（0.21.0 分册 15 FR-15.5 · 分册 19 FR-19.6）。
 *
 * 输入是投放时那份**结构化模型**（手写 HTML 的技能仍走 DOM 抽取那条路）。
 * 因为屏幕上那份 HTML 与这里读到的是同一个 JSON，抬头、取色、块序在两侧就是同一份，
 * 「另存下来跟看到的不一样」不再是版式重建的必然代价——只剩 OOXML 真的表达不了的那几样。
 */

import {
  chartToTable,
  type ChartProps,
  type EncodedDocument,
  type ExportBlock,
  type ExportDoc,
  type ExportDocHeader,
  type ExportRun,
  type TableProps
} from './extract';
import type { DocImage } from './image';
import { OmissionCounter, mergeOmissions } from './omissions';

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const ORDERED_LIST = 'webskill-export-ordered';

/** 版心宽度（磅）：A4 210mm 去掉两侧 16mm 边距，按 72dpi 折算 */
const CONTENT_WIDTH_PT = 504;

const TONE_FILL = { info: 'EEF4FD', success: 'ECFAF1', warning: 'FEF6E7', danger: 'FDEDED' } as const;
const TONE_LINE = { info: '1A6FD4', success: '1E9E5A', warning: 'C77700', danger: 'C0202A' } as const;

/** 红头公文的红，与技能渲染出来的那条红线取同一个值 */
const OFFICIAL_RED = 'C0202A';

export async function encodeDocx(doc: ExportDoc): Promise<EncodedDocument> {
  const {
    AlignmentType,
    BorderStyle,
    Document,
    HeadingLevel,
    ImageRun,
    LevelFormat,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
    convertMillimetersToTwip
  } = await import('docx');

  const counter = new OmissionCounter();
  const mm = convertMillimetersToTwip;
  const theme = doc.theme;
  const official = doc.header?.docType === 'official';
  // 屏幕上公文用仿宋、普通文档用雅黑；这里取同名字族，Word 里才落在同一种字上
  const bodyFont = official ? 'FangSong' : 'Microsoft YaHei';
  const titleFont = official ? 'SimHei' : 'Microsoft YaHei';
  const muted = hex(theme?.muted, '5C6B7F');
  const accent = hex(theme?.accent, '1A6FD4');
  const border = hex(theme?.border, 'D8DEE8');
  const surface = hex(theme?.surface, 'F5F7FA');

  type Child = InstanceType<typeof Paragraph> | InstanceType<typeof Table>;
  const HEADINGS = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3] as const;
  const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } as const;

  const children: Child[] = [];
  if (doc.header !== undefined) children.push(...docHeader(doc.header, doc.title));
  doc.pages.forEach((page, index) => {
    if (index > 0) children.push(new Paragraph({ children: [], pageBreakBefore: true }));
    if ((page.title ?? '') !== '') {
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(page.title ?? '')] }));
    }
    for (const block of page.blocks) children.push(...render(block));
  });
  if (doc.header?.signature !== undefined) children.push(...signature(doc.header.signature));

  const file = new Document({
    styles: {
      default: { document: { run: { font: bodyFont, size: 32 }, paragraph: { spacing: { line: 380, after: 120 } } } }
    },
    numbering: {
      config: [
        {
          reference: ORDERED_LIST,
          levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.START }]
        }
      ]
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: mm(210), height: mm(297) },
            margin: { top: mm(16), right: mm(16), bottom: mm(16), left: mm(16) }
          }
        },
        children
      }
    ]
  });

  const raw = await Packer.toBlob(file);
  const blob = new Blob([await raw.arrayBuffer()], { type: DOCX_MIME });
  return { blob, omissions: mergeOmissions(doc.omissions, counter.list()) };

  function docHeader(header: ExportDocHeader, title: string): Child[] {
    const out: Child[] = [];
    if (header.official !== undefined) {
      out.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [
            new TextRun({ text: header.official.issuer, bold: true, size: 56, color: OFFICIAL_RED, font: titleFont })
          ]
        })
      );
      // 红线是这份文件之所以叫「红头」的全部，而它在 OOXML 里有对应物，所以必须跟过来
      out.push(
        new Paragraph({
          spacing: { after: 200 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: OFFICIAL_RED, space: 1 } },
          children: []
        })
      );
      if (header.official.documentNumber !== undefined) {
        out.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [new TextRun({ text: header.official.documentNumber, size: 24, color: muted })]
          })
        );
      }
    }
    if (title !== '') {
      out.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 120 },
          children: [new TextRun({ text: title, bold: true, size: official ? 44 : 40, font: titleFont })]
        })
      );
    }
    if (header.subtitle !== undefined) {
      out.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [new TextRun({ text: header.subtitle, size: 26, color: muted })]
        })
      );
    }
    if (header.meta !== undefined && header.meta.length > 0) {
      out.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 160 },
          children: [
            new TextRun({
              text: header.meta.map((item) => `${item.label}：${item.value}`).join('    '),
              size: 22,
              color: muted
            })
          ]
        })
      );
    }
    if (header.official?.recipient !== undefined) {
      out.push(new Paragraph({ children: [new TextRun({ text: header.official.recipient })] }));
    } else if (header.official === undefined) {
      out.push(rule());
    }
    return out;
  }

  function signature(sign: NonNullable<ExportDocHeader['signature']>): Child[] {
    const out: Child[] = [];
    for (const line of [sign.org, sign.date]) {
      if (line === undefined || line === '') continue;
      out.push(
        new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 120 }, children: [new TextRun(line)] })
      );
    }
    return out;
  }

  function rule(): InstanceType<typeof Paragraph> {
    return new Paragraph({
      spacing: { after: 160 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: border, space: 1 } },
      children: []
    });
  }

  function render(block: ExportBlock): Child[] {
    switch (block.kind) {
      case 'heading':
        return [
          new Paragraph({
            heading: HEADINGS[block.level - 1],
            spacing: { before: 240, after: 120 },
            children: runs(block.runs, { font: titleFont })
          })
        ];
      case 'paragraph':
        return [new Paragraph({ indent: { firstLine: 480 }, children: runs(block.runs, {}) })];
      case 'list':
        return block.items.map(
          (item) =>
            new Paragraph({
              children: runs(item, {}),
              ...(block.ordered ? { numbering: { reference: ORDERED_LIST, level: 0 } } : { bullet: { level: 0 } })
            })
        );
      case 'table':
        return table(block.props);
      case 'image':
        return image(block.image, block.caption);
      case 'chart':
        return chart(block.props);
      case 'metrics':
        return [
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: NO_BORDER,
              bottom: NO_BORDER,
              left: NO_BORDER,
              right: NO_BORDER,
              insideHorizontal: NO_BORDER,
              insideVertical: NO_BORDER
            },
            rows: [
              new TableRow({
                children: block.items.map(
                  (item) =>
                    new TableCell({
                      borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
                      shading: { fill: surface },
                      margins: { top: 120, bottom: 120, left: 120, right: 120 },
                      children: [
                        new Paragraph({
                          spacing: { after: 40 },
                          children: [new TextRun({ text: item.label, size: 20, color: muted })]
                        }),
                        new Paragraph({
                          spacing: { after: 0 },
                          children: [new TextRun({ text: String(item.value), bold: true, size: 36, color: accent })]
                        }),
                        ...(item.change === undefined
                          ? []
                          : [new Paragraph({ children: [new TextRun({ text: item.change, size: 20, color: muted })] })])
                      ]
                    })
                )
              })
            ]
          })
        ];
      case 'keyValue': {
        const out: Child[] = [];
        if (block.title !== undefined) out.push(caption(block.title, true));
        out.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: block.items.map(
              (item) =>
                new TableRow({
                  children: [
                    new TableCell({
                      shading: { fill: surface },
                      width: { size: 30, type: WidthType.PERCENTAGE },
                      children: [new Paragraph({ children: [new TextRun({ text: item.label, color: muted })] })]
                    }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun(item.value)] })] })
                  ]
                })
            )
          })
        );
        return out;
      }
      case 'callout': {
        const out: Child[] = [];
        const shading = { fill: TONE_FILL[block.tone] };
        const left = { style: BorderStyle.SINGLE, size: 18, color: TONE_LINE[block.tone], space: 8 } as const;
        if (block.title !== undefined) {
          out.push(
            new Paragraph({
              shading,
              border: { left },
              spacing: { after: 0 },
              children: [new TextRun({ text: block.title, bold: true, color: TONE_LINE[block.tone] })]
            })
          );
        }
        out.push(new Paragraph({ shading, border: { left }, children: runs(block.runs, {}) }));
        return out;
      }
      case 'quote': {
        const out: Child[] = [
          new Paragraph({
            indent: { left: 480 },
            border: { left: { style: BorderStyle.SINGLE, size: 12, color: border, space: 8 } },
            spacing: { after: block.source === undefined ? 120 : 0 },
            children: runs(block.runs, { italics: true, color: muted })
          })
        ];
        if (block.source !== undefined) {
          out.push(
            new Paragraph({
              indent: { left: 480 },
              children: [new TextRun({ text: `—— ${block.source}`, size: 20, color: muted })]
            })
          );
        }
        return out;
      }
      case 'divider':
        return [rule()];
      case 'pageBreak':
        return [new Paragraph({ children: [], pageBreakBefore: true })];
      case 'textCard': {
        const out: Child[] = [];
        if (block.label !== '') out.push(new Paragraph({ children: [new TextRun({ text: block.label, bold: true })] }));
        for (const line of block.lines) out.push(new Paragraph({ children: [new TextRun(line)] }));
        return out;
      }
      default:
        return [];
    }
  }

  /**
   * 图表：先贴屏幕上那张画布，再把数据表跟在后面。
   * 只贴图会把数字锁死在像素里，只出表则跟屏幕上完全不是一个东西——两个都给，
   * 「看着一样」与「改得动」才同时成立。
   */
  function chart(props: ChartProps): Child[] {
    const out: Child[] = [];
    const snapshot = props.image;
    const data = snapshot === undefined ? undefined : imageDataOf(snapshot.url);
    if (snapshot !== undefined && data !== undefined && snapshot.width > 0 && snapshot.height > 0) {
      out.push(picture(data, snapshot.width, snapshot.height, ''));
      counter.add('chart-as-picture');
    } else {
      // 没拿到画布快照就只剩数据；下面那张数据表至少让内容不丢
      counter.add('chart-downgraded-to-table');
    }
    if (props.caption !== undefined) out.push(caption(props.caption, false));
    out.push(...table(chartToTable(props)));
    return out;
  }

  /** 文档图（FR-14.3）。到了这里一定嵌得进去：嵌不进的在转换期就已经换成了一段话 */
  function image(doc: DocImage, text: string | undefined): Child[] {
    const data = imageDataOf(doc.url);
    if (data === undefined) return [];
    const out: Child[] = [picture(data, doc.width, doc.height, doc.alt)];
    if (text !== undefined) out.push(caption(text, false));
    return out;
  }

  /** 等比缩进版心：版式不要求与屏幕一致，但不能溢出页面 */
  function picture(
    data: { base64: string; type: 'png' | 'jpg' },
    width: number,
    height: number,
    alt: string
  ): InstanceType<typeof Paragraph> {
    const fitted = Math.min(CONTENT_WIDTH_PT, width);
    return new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 60 },
      children: [
        new ImageRun({
          type: data.type,
          data: data.base64,
          transformation: { width: fitted, height: Math.round((fitted * height) / width) },
          ...(alt === '' ? {} : { altText: { name: alt, description: alt, title: alt } })
        })
      ]
    });
  }

  function caption(text: string, bold: boolean): InstanceType<typeof Paragraph> {
    return new Paragraph({
      spacing: { before: 60, after: 60 },
      children: [new TextRun({ text, bold, size: bold ? 24 : 20, color: muted })]
    });
  }

  function table(props: TableProps): Child[] {
    const out: Child[] = [];
    if ((props.title ?? '') !== '') out.push(caption(props.title ?? '', true));
    const rows: InstanceType<typeof TableRow>[] = [];
    if (props.columns.length > 0) rows.push(row(props.columns, true));
    for (const cells of props.rows)
      rows.push(
        row(
          cells.map((cell) => (cell === null ? '' : String(cell))),
          false
        )
      );
    if (rows.length > 0) {
      const line = { style: BorderStyle.SINGLE, size: 4, color: border } as const;
      out.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: line,
            bottom: line,
            left: line,
            right: line,
            insideHorizontal: line,
            insideVertical: line
          },
          rows
        })
      );
    }
    if (props.caption !== undefined && (props.title ?? '') !== props.caption) out.push(caption(props.caption, false));
    return out;
  }

  function row(cells: readonly string[], header: boolean): InstanceType<typeof TableRow> {
    return new TableRow({
      children: cells.map(
        (cell) =>
          new TableCell({
            ...(header ? { shading: { fill: surface } } : {}),
            children: [
              new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: cell, bold: header, size: 22 })] })
            ]
          })
      ),
      tableHeader: header
    });
  }

  function runs(
    list: readonly ExportRun[],
    style: { font?: string; italics?: boolean; color?: string }
  ): InstanceType<typeof TextRun>[] {
    return list.map(
      (run) =>
        new TextRun({
          text: run.text === '\n' ? '' : run.text,
          break: run.text === '\n' ? 1 : undefined,
          bold: run.bold === true,
          italics: run.italic === true || style.italics === true,
          ...(style.font === undefined ? {} : { font: style.font }),
          ...(style.color === undefined ? {} : { color: style.color })
        })
    );
  }
}

/** OOXML 的颜色不带 `#` */
function hex(value: string | undefined, fallback: string): string {
  return value === undefined ? fallback : value.replace('#', '');
}

/**
 * data URL → 裸 base64 与 docx 认的类型名。
 * 受支持的类型清单只有一份（`DOCUMENT_IMAGE_MIME_TYPES`，在 `image.ts` 里消费），
 * 这里只负责把 mime 映成 `docx` 的枚举名。
 */
function imageDataOf(url: string): { base64: string; type: 'png' | 'jpg' } | undefined {
  const marker = ';base64,';
  const at = url.indexOf(marker);
  if (at < 0) return undefined;
  const mime = url.slice('data:'.length, at);
  const type = mime === 'image/jpeg' ? 'jpg' : mime === 'image/png' ? 'png' : undefined;
  const payload = url.slice(at + marker.length);
  if (type === undefined || payload === '') return undefined;
  return { base64: payload, type };
}

export const DOCX_CONTENT_TYPE = DOCX_MIME;
