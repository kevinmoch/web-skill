/**
 * 幻灯片 → PPTX（0.21.0 分册 15 FR-15.4 · 分册 19 FR-19.6）。
 *
 * 结构化投放之后，版式不再是「重建」而是**照抄**：屏幕上的版式由模型里的
 * `layout` 决定，这里认同一个 `layout`，取色也取模型里那一份。
 * 手写 HTML 的幻灯片没有 `regions`，退回旧的纵向等分——不丢块，但会挤。
 */

import {
  chartToTable,
  type ChartProps,
  type EncodedDocument,
  type ExportBlock,
  type ExportDoc,
  type ExportPage,
  type ExportRun,
  type TableProps
} from './extract';
import type { DocImage } from './image';
import { OmissionCounter, mergeOmissions } from './omissions';

const PPTX_MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

const STAGE = { name: 'WS169', width: 13.333, height: 7.5 };
const MARGIN = 0.6;
const TITLE_BOX = { x: MARGIN, y: 0.42, w: STAGE.width - MARGIN * 2, h: 0.85 };
const CONTENT_TOP = 1.5;
const CONTENT_BOTTOM = 6.9;
const TAKEAWAY_H = 0.62;
const GAP = 0.28;

const DEFAULTS = { background: '0F1B2E', text: 'F2F7FF', muted: 'A8BCD9', accent: '4DA3FF', surface: '17253C' };

export async function encodePptx(doc: ExportDoc): Promise<EncodedDocument> {
  const { default: PptxGenJS } = await import('pptxgenjs');
  const pptx = new PptxGenJS();
  pptx.defineLayout(STAGE);
  pptx.layout = STAGE.name;
  if (doc.title !== '') pptx.title = doc.title;

  const counter = new OmissionCounter();
  const theme = {
    background: hex(doc.theme?.background, DEFAULTS.background),
    text: hex(doc.theme?.text, DEFAULTS.text),
    muted: hex(doc.theme?.muted, DEFAULTS.muted),
    accent: hex(doc.theme?.accent, DEFAULTS.accent),
    surface: hex(doc.theme?.surface, DEFAULTS.surface)
  };
  for (const page of doc.pages) renderPage(page);

  const raw = (await pptx.write({ outputType: 'blob' })) as Blob;
  // pptxgenjs 交回来的 Blob 是 `application/zip`（实测）——原样下发，
  // 系统就按压缩包处理，双击不进 PowerPoint。必须重包一层正确的 MIME。
  const blob = new Blob([await raw.arrayBuffer()], { type: PPTX_MIME });
  return { blob, omissions: mergeOmissions(doc.omissions, counter.list()) };

  function renderPage(page: ExportPage): void {
    const slide = pptx.addSlide();
    slide.background = { color: theme.background };
    const layout = page.layout ?? 'single';
    if (layout === 'cover' || layout === 'section') {
      renderTitleSlide(slide, page, layout);
      return;
    }
    if ((page.title ?? '') !== '') {
      slide.addText(page.title ?? '', {
        ...TITLE_BOX,
        fontSize: 28,
        bold: true,
        color: theme.text,
        valign: 'middle'
      } as never);
      slide.addShape(
        'rect' as never,
        {
          x: MARGIN,
          y: CONTENT_TOP - 0.22,
          w: 1.4,
          h: 0.05,
          fill: { color: theme.accent }
        } as never
      );
    }
    const bottom = (page.takeaway ?? '') === '' ? CONTENT_BOTTOM : CONTENT_BOTTOM - TAKEAWAY_H - GAP;
    const area = { x: MARGIN, y: CONTENT_TOP, w: STAGE.width - MARGIN * 2, h: bottom - CONTENT_TOP };
    const regions = page.regions ?? fallbackRegions(page.blocks);
    for (const [index, box] of placement(layout, regions.length, area).entries()) {
      const region = regions[index];
      if (region !== undefined) renderRegion(slide, region, box);
    }
    if ((page.takeaway ?? '') !== '') {
      slide.addShape(
        'rect' as never,
        {
          x: MARGIN,
          y: CONTENT_BOTTOM - TAKEAWAY_H,
          w: STAGE.width - MARGIN * 2,
          h: TAKEAWAY_H,
          fill: { color: theme.surface }
        } as never
      );
      slide.addText(page.takeaway ?? '', {
        x: MARGIN + 0.2,
        y: CONTENT_BOTTOM - TAKEAWAY_H,
        w: STAGE.width - MARGIN * 2 - 0.4,
        h: TAKEAWAY_H,
        fontSize: 18,
        bold: true,
        color: theme.accent,
        valign: 'middle'
      } as never);
    }
  }

  function renderTitleSlide(slide: Slide, page: ExportPage, layout: 'cover' | 'section'): void {
    const y = layout === 'cover' ? 2.4 : 3.0;
    slide.addText(page.title ?? '', {
      x: MARGIN,
      y,
      w: STAGE.width - MARGIN * 2,
      h: 1.3,
      fontSize: layout === 'cover' ? 44 : 36,
      bold: true,
      color: theme.text,
      valign: 'middle'
    } as never);
    slide.addShape(
      'rect' as never,
      {
        x: MARGIN,
        y: y + 1.35,
        w: 2.2,
        h: 0.06,
        fill: { color: theme.accent }
      } as never
    );
    if ((page.subtitle ?? '') !== '') {
      slide.addText(page.subtitle ?? '', {
        x: MARGIN,
        y: y + 1.55,
        w: STAGE.width - MARGIN * 2,
        h: 0.6,
        fontSize: 20,
        color: theme.muted
      } as never);
    }
    if (page.meta !== undefined && page.meta.length > 0) {
      slide.addText(page.meta.map((item) => `${item.label}：${item.value}`).join('    '), {
        x: MARGIN,
        y: STAGE.height - 1.1,
        w: STAGE.width - MARGIN * 2,
        h: 0.5,
        fontSize: 14,
        color: theme.muted
      } as never);
    }
  }

  /** 版式 → 每个槽位的矩形。槽位比版式能摆的多时，多出来的往下续，不丢块 */
  function placement(layout: string, count: number, area: Box): Box[] {
    if (count <= 0) return [];
    if (layout === 'split' || (layout === 'grid' && count === 2)) return columns(area, Math.min(count, 2), count);
    if (layout === 'grid') {
      // 与屏幕上的 CSS 同一套：三格并排一行，四格才 2×2
      const cols = count === 4 ? 2 : count;
      const rows = Math.ceil(count / cols);
      const out: Box[] = [];
      const h = (area.h - GAP * (rows - 1)) / rows;
      const w = (area.w - GAP * (cols - 1)) / cols;
      for (let index = 0; index < count; index += 1) {
        out.push({
          x: area.x + (index % cols) * (w + GAP),
          y: area.y + Math.floor(index / cols) * (h + GAP),
          w,
          h
        });
      }
      return out;
    }
    return columns(area, 1, count);
  }

  function columns(area: Box, cols: number, count: number): Box[] {
    const rows = Math.ceil(count / cols);
    const w = (area.w - GAP * (cols - 1)) / cols;
    const h = (area.h - GAP * (rows - 1)) / rows;
    const out: Box[] = [];
    for (let index = 0; index < count; index += 1) {
      out.push({ x: area.x + (index % cols) * (w + GAP), y: area.y + Math.floor(index / cols) * (h + GAP), w, h });
    }
    return out;
  }

  /** 手写 HTML 那条路没有槽位；图表、表格与图片各占一块，其余文字合成一块 */
  function fallbackRegions(blocks: readonly ExportBlock[]): ExportBlock[][] {
    const text = blocks.filter((block) => !SOLO_KINDS.has(block.kind));
    const regions: ExportBlock[][] = [];
    if (text.length > 0) regions.push(text);
    for (const block of blocks) {
      if (SOLO_KINDS.has(block.kind)) regions.push([block]);
    }
    return regions.length > 0 ? regions : [[]];
  }

  function renderRegion(slide: Slide, blocks: readonly ExportBlock[], box: Box): void {
    const solo = blocks.find((block) => SOLO_KINDS.has(block.kind));
    const metrics = blocks.find((block) => block.kind === 'metrics');
    const text = blocks.filter((block) => !SOLO_KINDS.has(block.kind) && block.kind !== 'metrics');
    if (solo !== undefined) {
      const lead = text.filter((block) => block.kind === 'heading');
      const head = lead.length > 0 ? 0.5 : 0;
      if (head > 0) addTextBand(slide, lead, { ...box, h: head }, theme);
      const rest = { x: box.x, y: box.y + head, w: box.w, h: box.h - head };
      if (solo.kind === 'table') addTable(slide, solo.props, rest, theme);
      else if (solo.kind === 'image') addDocImage(slide, solo.image, solo.caption, rest, theme);
      else if (solo.kind === 'chart') addChartBlock(slide, solo.props, rest);
      return;
    }
    if (metrics !== undefined && metrics.kind === 'metrics') {
      addMetrics(slide, metrics.items, box, theme);
      return;
    }
    addTextBand(slide, text, box, theme);
  }

  function addChartBlock(slide: Slide, props: ChartProps, box: Box): void {
    if (!CHART_TYPES.has(props.type) || props.series.length === 0 || props.labels.length === 0) {
      counter.add('unsupported-chart-type');
      addTable(slide, chartToTable(props), box, theme);
      return;
    }
    const opts: Record<string, unknown> = {
      ...box,
      showLegend: props.series.length > 1,
      legendPos: 'b',
      legendColor: theme.muted,
      catAxisLabelColor: theme.muted,
      valAxisLabelColor: theme.muted,
      showTitle: (props.title ?? '') !== '',
      title: props.title ?? '',
      titleColor: theme.text
    };
    const series = props.series.map((one) => ({ name: one.name, labels: props.labels, values: one.values }));

    if (props.type === 'dual-axis' && series.length >= 2) {
      const [primary, ...rest] = series;
      slide.addChart(
        [
          { type: 'bar', data: [primary], options: {} },
          { type: 'line', data: rest, options: { secondaryValAxis: true, secondaryCatAxis: true } }
        ] as never,
        { ...opts, valAxes: [{}, {}], catAxes: [{}, {}] } as never
      );
      return;
    }
    if (props.type === 'stacked-bar') {
      slide.addChart('bar' as never, series as never, { ...opts, barGrouping: 'stacked' } as never);
      return;
    }
    if (props.type === 'scatter') {
      // scatter 的第一条数据是 X 轴取值；分类标签能当数字用就用，不能就退成序号
      const x = props.labels.map((label, index) => (Number.isFinite(Number(label)) ? Number(label) : index + 1));
      slide.addChart('scatter' as never, [{ name: 'X', labels: [], values: x }, ...series] as never, opts as never);
      return;
    }
    slide.addChart(props.type as never, series as never, opts as never);
  }
}

type Box = { x: number; y: number; w: number; h: number };
type Theme = { background: string; text: string; muted: string; accent: string; surface: string };
type Slide = ReturnType<InstanceType<typeof import('pptxgenjs').default>['addSlide']>;

/** 各自独占一个槽位的块：它们都是矩形占位，塞不进一个文本框 */
const SOLO_KINDS = new Set<ExportBlock['kind']>(['chart', 'table', 'image']);

/** 抽取层不知道 pptxgenjs 支持什么，所以受支持的类型清单只能长在这里 */
const CHART_TYPES = new Set(['bar', 'line', 'area', 'pie', 'scatter', 'stacked-bar', 'dual-axis']);

/**
 * 文档图（FR-14.4）。按区域框**等比**适配：拉伸变形的图比小一点的图更难看，
 * 而版式本来就不要求与屏幕一致（0.21.0 分册 15 §2.1a）。
 */
function addDocImage(slide: Slide, image: DocImage, caption: string | undefined, box: Box, theme: Theme): void {
  const foot = caption === undefined ? 0 : 0.34;
  const area = { ...box, h: box.h - foot };
  const scale = Math.min(area.w / image.width, area.h / image.height);
  const w = image.width * scale;
  const h = image.height * scale;
  slide.addImage({
    data: image.url,
    ...(image.alt === '' ? {} : { altText: image.alt }),
    x: area.x + (area.w - w) / 2,
    y: area.y + (area.h - h) / 2,
    w,
    h
  });
  if (caption !== undefined) {
    slide.addText(caption, {
      x: box.x,
      y: box.y + box.h - foot,
      w: box.w,
      h: foot,
      fontSize: 12,
      color: theme.muted,
      align: 'center'
    } as never);
  }
}

function addMetrics(
  slide: Slide,
  items: readonly { label: string; value: string | number; change?: string }[],
  box: Box,
  theme: Theme
): void {
  if (items.length === 0) return;
  const gap = 0.2;
  const w = (box.w - gap * (items.length - 1)) / items.length;
  items.forEach((item, index) => {
    const cell = { x: box.x + index * (w + gap), y: box.y, w, h: box.h };
    slide.addShape('rect' as never, { ...cell, fill: { color: theme.surface } } as never);
    slide.addText(
      [
        { text: item.label, options: { fontSize: 14, color: theme.muted, breakLine: true } },
        { text: String(item.value), options: { fontSize: 32, bold: true, color: theme.accent, breakLine: true } },
        ...(item.change === undefined ? [] : [{ text: item.change, options: { fontSize: 12, color: theme.muted } }])
      ] as never,
      { ...cell, valign: 'middle', align: 'center' } as never
    );
  });
}

function addTextBand(slide: Slide, blocks: readonly ExportBlock[], box: Box, theme: Theme): void {
  const items: { text: string; options: Record<string, unknown> }[] = [];
  for (const block of blocks) {
    switch (block.kind) {
      case 'heading':
        items.push(...runItems(block.runs, { fontSize: block.level === 1 ? 22 : 20, bold: true, color: theme.text }));
        break;
      case 'paragraph':
        items.push(...runItems(block.runs, { fontSize: 18, color: theme.text }));
        break;
      case 'list':
        for (const item of block.items) {
          items.push(
            ...runItems(item, {
              fontSize: 18,
              color: theme.text,
              bullet: block.ordered ? { type: 'number' } : true,
              indentLevel: 1
            })
          );
        }
        break;
      case 'quote':
        items.push(...runItems(block.runs, { fontSize: 18, italic: true, color: theme.muted }));
        break;
      case 'callout':
        if (block.title !== undefined) {
          items.push({
            text: block.title,
            options: { fontSize: 18, bold: true, color: theme.accent, breakLine: true }
          });
        }
        items.push(...runItems(block.runs, { fontSize: 18, color: theme.text }));
        break;
      case 'keyValue':
        for (const item of block.items) {
          items.push({ text: `${item.label}：`, options: { fontSize: 18, color: theme.muted } });
          items.push({ text: item.value, options: { fontSize: 18, bold: true, color: theme.text, breakLine: true } });
        }
        break;
      case 'textCard':
        if (block.label !== '')
          items.push({ text: block.label, options: { fontSize: 18, bold: true, color: theme.text, breakLine: true } });
        for (const line of block.lines)
          items.push({ text: line, options: { fontSize: 18, color: theme.text, breakLine: true } });
        break;
      default:
        break;
    }
  }
  if (items.length === 0) return;
  slide.addText(items as never, { ...box, valign: 'top' } as never);
}

/** 一段里的粗体/斜体是分片的；只有最后一片换行，否则一段会被拆成几行 */
function runItems(
  runs: readonly ExportRun[],
  options: Record<string, unknown>
): { text: string; options: Record<string, unknown> }[] {
  if (runs.length === 0) return [];
  return runs.map((run, index) => ({
    text: run.text,
    options: {
      ...options,
      ...(run.bold === true ? { bold: true } : {}),
      ...(run.italic === true ? { italic: true } : {}),
      ...(index === runs.length - 1 ? { breakLine: true } : {})
    }
  }));
}

function addTable(slide: Slide, props: TableProps, box: Box, theme: Theme): void {
  const header = props.columns.map((column) => ({
    text: column,
    options: { bold: true, color: theme.text, fill: { color: theme.surface } }
  }));
  const body = props.rows.map((row) =>
    row.map((cell) => ({ text: cell === null ? '' : String(cell), options: { color: theme.text } }))
  );
  const rows = props.columns.length > 0 ? [header, ...body] : body;
  if (rows.length === 0) return;
  const head = (props.title ?? '') === '' ? 0 : 0.4;
  if (head > 0) {
    slide.addText(props.title ?? '', {
      x: box.x,
      y: box.y,
      w: box.w,
      h: head,
      fontSize: 16,
      bold: true,
      color: theme.text
    } as never);
  }
  slide.addTable(
    rows as never,
    {
      x: box.x,
      y: box.y + head,
      w: box.w,
      h: box.h - head,
      fontSize: 13,
      color: theme.text,
      border: { type: 'solid', pt: 0.5, color: theme.muted },
      autoPage: false
    } as never
  );
}

function hex(value: string | undefined, fallback: string): string {
  return value === undefined ? fallback : value.replace('#', '').toUpperCase();
}

export const PPTX_CONTENT_TYPE = PPTX_MIME;
