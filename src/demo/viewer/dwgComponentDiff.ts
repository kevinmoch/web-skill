/**
 * 按构件比差异（0.22.0 分册 37）。
 *
 * 比的是块引用，不是线条：一个块引用带着「这是什么（块名）」「在哪（插入点）」
 * 「编号规格（`ATTRIB`）」，容差因此有物理标度——「插入点相距 200 mm 以内算同一个」
 * 是工程师看得懂、能自己调的一句话，而「指纹量化到小数点后 3 位」不是。
 * 完整推导见 `docs/0.22.0/36-req-dwg-align-measure-and-difference-index.md` §5。
 *
 * 这个模块是纯函数：不碰 DOM、不碰画布，两份构件清单 + 一个框进去，一张差异表出来。
 */

import type { DwgComponent, DwgEntity, DwgUnits } from '@webskill/sdk/agent';

/** 位置容差的默认值，毫米（裁决 1）。界面上可调，改完立刻重算 */
export const DEFAULT_TOLERANCE_MM = 200;

/**
 * 配对半径 = 容差 × 这个倍数。
 *
 * 不能等于容差：容差是「多远算挪动了」，配对半径是「多远还算同一个物件」。
 * 两者相等时，一个挪了 1 m 的消防栓会配不上对，报成「甲少一个 + 乙多一个」——
 * 而那恰恰是分册 34 的死法。
 */
const PAIR_FACTOR = 8;

/**
 * 判定用的框按容差的这个倍数外扩（FR-37.14）。
 *
 * 一个构件甲图在框内、乙图挪出框外一点，本该报「挪动了」，
 * 不外扩就会报成「甲多一个、乙少一个」。外扩只影响**候选集**，
 * 报出来的行仍然只有锚点落在原框内的。
 */
const EDGE_MARGIN = 3;

/**
 * 共同块名占比低于这个数就不出表（FR-37.17，裁决 2）。
 *
 * 甲图叫 `DOOR`、乙图叫「门」时，逐项比对的产出是「甲全删、乙全增」——
 * 一张长得像结果的假表。四分之一的块名都对不上，就不是同一套命名体系。
 * 这条是硬约束，不是可降级的提示。
 */
const NAME_OVERLAP_FLOOR = 0.25;

/**
 * 同一个块名下落单的构件多到这个数以上，就改用一条「数量不同」概述，
 * 不再逐条报新增 / 缺失——满屏同一句话是噪声，不是信息。
 */
const COUNT_ROW_FLOOR = 3;

export interface DiffBox {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
}

/** 一份图纸参与比对的那一面。坐标尚未加对位偏移 */
export interface DiffSide {
  readonly components: readonly DwgComponent[];
  readonly entities: readonly DwgEntity[];
  /** 被关掉的图层名。图层显隐就是用户在说「这些别比」（§5.4） */
  readonly hidden: ReadonlySet<string>;
  /** 该层的对位偏移，世界单位。比对必须在对位之后算（§5.5 第三条） */
  readonly shift: { readonly x: number; readonly y: number };
}

export type DiffKind = 'count' | 'moved' | 'attribute' | 'added' | 'missing';

/**
 * 一条差异。说明文字**不在这里**：表格要中英双语实时切换（FR-37.25），
 * 成句的字符串一旦在这里拼好，切语言就只能重算一遍差异。
 */
export interface DiffRow {
  readonly kind: DiffKind;
  readonly block: string;
  /** 画布标记的锚点，公共世界坐标 */
  readonly at: { readonly x: number; readonly y: number };
  /** `count` 行：两侧各有几个 */
  readonly counts?: { readonly a: number; readonly b: number };
  /** `moved` 行：位移，图纸单位 */
  readonly distance?: number;
  /** `attribute` 行：变了的那个属性 */
  readonly attribute?: { readonly tag: string; readonly from: string; readonly to: string };
}

export interface DiffOutcome {
  readonly rows: readonly DiffRow[];
  /** 框内参与比对的构件数（FR-37.23：这是**框内**计数，不是全图） */
  readonly counts: { readonly a: number; readonly b: number };
  /** 框内不属于任何块、未参与比对的几何条数（FR-37.24） */
  readonly stray: { readonly a: number; readonly b: number };
  /** 共同块名占比，0~1 */
  readonly overlap: number;
  /** 命名体系不同，拒绝出表（FR-37.17） */
  readonly refused: boolean;
}

/**
 * 按类型分项的差异计数（分册 39 FR-39.4）。
 *
 * 独立成函数是因为它有**两个**消费面：面板上那句汇总与导出的工作簿。
 * 各算各的就等着两处出现不同的数字——那是本册明令禁止的（FR-39.5）。
 */
export interface DiffSummary {
  readonly total: number;
  /** 五种差异各有几条。计数为零的类别由展示方自行略去 */
  readonly byKind: Readonly<Record<DiffKind, number>>;
}

export function summariseDiff(rows: readonly DiffRow[]): DiffSummary {
  const byKind: Record<DiffKind, number> = { count: 0, moved: 0, attribute: 0, added: 0, missing: 0 };
  for (const row of rows) byKind[row.kind] += 1;
  return { total: rows.length, byKind };
}

/** 已投影到公共世界坐标的一个构件 */
interface Placed {
  readonly block: string;
  readonly x: number;
  readonly y: number;
  readonly attributes: Readonly<Record<string, string>>;
}

/** 每毫米折合多少图纸单位 */
const PER_MM: Readonly<Record<DwgUnits, number>> = {
  mm: 1,
  cm: 0.1,
  m: 0.001,
  km: 1e-6,
  in: 1 / 25.4,
  ft: 1 / 304.8,
  yd: 1 / 914.4,
  mi: 1 / 1_609_344,
  unitless: 1
};

/**
 * 把毫米写的容差换成图纸单位（FR-37.16）。
 *
 * 图纸说不出量纲（`unitless`）时按 1:1，**不猜**：猜错一次就是 1000 倍。
 */
export function toleranceInDrawingUnits(millimetres: number, units: DwgUnits | undefined): number {
  return millimetres * PER_MM[units ?? 'unitless'];
}

function grow(box: DiffBox, margin: number): DiffBox {
  return {
    minX: box.minX - margin,
    minY: box.minY - margin,
    maxX: box.maxX + margin,
    maxY: box.maxY + margin
  };
}

function inside(box: DiffBox, x: number, y: number): boolean {
  return x >= box.minX && x <= box.maxX && y >= box.minY && y <= box.maxY;
}

/**
 * 框内、图层可见的构件，坐标已加对位偏移（FR-37.12 / FR-37.13）。
 *
 * 导出是因为选框上要实时显示两侧各有几个（FR-37.11），那个数必须与真正参与比对的
 * 是同一批——各算各的迟早对不上。
 */
export function componentsInBox(side: DiffSide, box: DiffBox): Placed[] {
  const placed: Placed[] = [];
  for (const component of side.components) {
    if (side.hidden.has(component.layer)) continue;
    const x = component.at.x + side.shift.x;
    const y = component.at.y + side.shift.y;
    if (!inside(box, x, y)) continue;
    placed.push({ block: component.block, x, y, attributes: component.attributes ?? {} });
  }
  return placed;
}

/** 实体几何的中心点；没有几何就没有位置 */
function centreOf(entity: DwgEntity): { x: number; y: number } | undefined {
  const geometry = entity.geometry;
  if (!geometry) return undefined;
  switch (geometry.kind) {
    case 'polyline': {
      const points = geometry.points;
      if (points.length === 0) return undefined;
      let sx = 0;
      let sy = 0;
      for (const point of points) {
        sx += point.x;
        sy += point.y;
      }
      return { x: sx / points.length, y: sy / points.length };
    }
    case 'circle':
    case 'arc':
      return { x: geometry.center.x, y: geometry.center.y };
    case 'text':
      return { x: geometry.at.x, y: geometry.at.y };
  }
}

/**
 * 框内不属于任何块的几何条数（FR-37.24）。
 *
 * 块展开出来的实体句柄带实例路径（`5A0/...`），顶层直接画的线没有——
 * 后者就是用线和弧直接画、不做成块的那些门窗，它们比不出来。
 * 不如实报这个数，用户会以为「表里没有就是没差异」，那比不做还糟。
 */
export function strayGeometry(side: DiffSide, box: DiffBox): number {
  let count = 0;
  for (const entity of side.entities) {
    if (entity.handle.includes('/')) continue;
    if (side.hidden.has(entity.layer)) continue;
    const centre = centreOf(entity);
    if (!centre) continue;
    if (inside(box, centre.x + side.shift.x, centre.y + side.shift.y)) count += 1;
  }
  return count;
}

function group(placed: readonly Placed[]): Map<string, Placed[]> {
  const groups = new Map<string, Placed[]>();
  for (const item of placed) {
    const bucket = groups.get(item.block);
    if (bucket) bucket.push(item);
    else groups.set(item.block, [item]);
  }
  return groups;
}

/**
 * 同名块按插入点最近邻配对：所有可能的配对按距离升序贪心取，两边各用一次。
 *
 * 贪心在这里是对的——距离最近的那一对必然是彼此的最佳选择，
 * 先把它定下来不会让后面变差。构件数是几十到几百，平方级的候选表无所谓。
 */
function pair(a: readonly Placed[], b: readonly Placed[], radius: number): { a: Placed; b: Placed }[] {
  const candidates: { a: number; b: number; d: number }[] = [];
  for (let i = 0; i < a.length; i += 1) {
    for (let j = 0; j < b.length; j += 1) {
      const d = Math.hypot(a[i]!.x - b[j]!.x, a[i]!.y - b[j]!.y);
      if (d <= radius) candidates.push({ a: i, b: j, d });
    }
  }
  candidates.sort((left, right) => left.d - right.d);
  const usedA = new Set<number>();
  const usedB = new Set<number>();
  const pairs: { a: Placed; b: Placed }[] = [];
  for (const candidate of candidates) {
    if (usedA.has(candidate.a) || usedB.has(candidate.b)) continue;
    usedA.add(candidate.a);
    usedB.add(candidate.b);
    pairs.push({ a: a[candidate.a]!, b: b[candidate.b]! });
  }
  return pairs;
}

/** 配对成功的两个构件之间变了的第一个属性（FR-37.15 第四类） */
function attributeChange(a: Placed, b: Placed): { tag: string; from: string; to: string } | undefined {
  for (const tag of new Set([...Object.keys(a.attributes), ...Object.keys(b.attributes)])) {
    const from = a.attributes[tag] ?? '';
    const to = b.attributes[tag] ?? '';
    if (from !== to) return { tag, from, to };
  }
  return undefined;
}

const KIND_ORDER: Readonly<Record<DiffKind, number>> = {
  count: 0,
  missing: 1,
  added: 2,
  moved: 3,
  attribute: 4
};

/**
 * 比一次。`box` 是公共世界坐标下的矩形，`tolerance` 是图纸单位下的位置容差。
 *
 * 两侧的对位偏移各自加在自己的插入点上，加完就在同一个坐标系里了——
 * 对位的语义就是把两层挪到对齐，对齐后的公共空间才是共同参照。
 */
export function compareComponents(a: DiffSide, b: DiffSide, box: DiffBox, tolerance: number): DiffOutcome {
  const wide = grow(box, tolerance * EDGE_MARGIN);
  const insideA = componentsInBox(a, box);
  const insideB = componentsInBox(b, box);
  const wideA = componentsInBox(a, wide);
  const wideB = componentsInBox(b, wide);

  // 占比按**外扩框**内的块名算：框边缘的构件两侧各差一点点时，
  // 只看框内会把一边数成空集，于是 0% 的共同块名——把正常的一比误判成命名体系不同
  const namesA = new Set(wideA.map((item) => item.block));
  const namesB = new Set(wideB.map((item) => item.block));
  const union = new Set([...namesA, ...namesB]);
  let shared = 0;
  for (const name of namesA) if (namesB.has(name)) shared += 1;
  const overlap = union.size === 0 ? 1 : shared / union.size;
  const counts = { a: insideA.length, b: insideB.length };
  const stray = { a: strayGeometry(a, box), b: strayGeometry(b, box) };

  if (overlap < NAME_OVERLAP_FLOOR) {
    return { rows: [], counts, stray, overlap, refused: true };
  }

  const rows: DiffRow[] = [];
  const groupsA = group(wideA);
  const groupsB = group(wideB);
  const tallyA = group(insideA);
  const tallyB = group(insideB);

  for (const block of union) {
    const listA = groupsA.get(block) ?? [];
    const listB = groupsB.get(block) ?? [];
    const pairs = pair(listA, listB, tolerance * PAIR_FACTOR);
    const pairedA = new Set(pairs.map((item) => item.a));
    const pairedB = new Set(pairs.map((item) => item.b));

    for (const { a: left, b: right } of pairs) {
      // 报的位置一律取乙（后一份）的，画布上的标记才落在现状上
      if (!inside(box, right.x, right.y) && !inside(box, left.x, left.y)) continue;
      const distance = Math.hypot(left.x - right.x, left.y - right.y);
      if (distance > tolerance) {
        rows.push({ kind: 'moved', block, at: { x: right.x, y: right.y }, distance });
        continue;
      }
      const change = attributeChange(left, right);
      if (change) rows.push({ kind: 'attribute', block, at: { x: right.x, y: right.y }, attribute: change });
    }

    const lonelyA = listA.filter((item) => !pairedA.has(item) && inside(box, item.x, item.y));
    const lonelyB = listB.filter((item) => !pairedB.has(item) && inside(box, item.x, item.y));
    const countA = (tallyA.get(block) ?? []).length;
    const countB = (tallyB.get(block) ?? []).length;

    /*
     * 「数量不同」与「新增 / 缺失」说的是同一件事的两种粒度，同时出就是同一处差异讲两遍。
     *
     * 落单的少到能一个个指出来时，逐条报——用户要的是「哪儿少了一个」，
     * 不是「这个块甲 4 个乙 3 个」。多到指不过来时反过来：
     * 十几条「少了一个 COL」刷满整张表，不如一句「甲 18 个、乙 4 个」。
     */
    const lonely = lonelyA.length + lonelyB.length;
    if (lonely > COUNT_ROW_FLOOR && countA !== countB) {
      const anchor = [...lonelyA, ...lonelyB][0]!;
      rows.push({ kind: 'count', block, at: { x: anchor.x, y: anchor.y }, counts: { a: countA, b: countB } });
      continue;
    }
    for (const item of lonelyA) rows.push({ kind: 'missing', block, at: { x: item.x, y: item.y } });
    for (const item of lonelyB) rows.push({ kind: 'added', block, at: { x: item.x, y: item.y } });
  }

  rows.sort(
    (left, right) =>
      KIND_ORDER[left.kind] - KIND_ORDER[right.kind] ||
      left.block.localeCompare(right.block) ||
      left.at.x - right.at.x ||
      left.at.y - right.at.y
  );
  return { rows, counts, stray, overlap, refused: false };
}
