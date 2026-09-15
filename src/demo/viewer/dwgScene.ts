/**
 * 二维场景的一次性预处理（0.22.0 分册 32，FR-32.5 ~ FR-32.14）。
 *
 * 查看器原本每帧都对每个实体调一次 `tessellate()`：`大堂平面图.dwg` 的模型空间
 * 一帧要新分配 774 262 个坐标元组，而且屏幕外的十几万个实体一个不落地走一遍。
 * 这里把「离散化」与「在哪儿」都提前算好一次，逐帧只剩查询。
 *
 * 吸附共用同一份数据：候选点本来就是这些折线的顶点、中点和圆心，
 * 另建一套索引等于把同一批几何再走一遍。
 */

import { tessellate } from './dwgGeometry';
import type { Drawn } from './dwgGeometry';

/** 一个实体预处理后的样子。坐标是世界坐标，与相机无关 */
export interface SceneItem {
  readonly item: Drawn;
  /** 摊平的折线：`[x0, y0, x1, y1, …]`。圆与弧也在这里，但只用于包围盒与吸附 */
  readonly lines: readonly Float64Array[];
  /** 圆 / 弧 / 椭圆的中心，用于圆心吸附 */
  readonly center: readonly [number, number] | undefined;
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
}

export interface Scene {
  readonly items: readonly SceneItem[];
  /** 与给定世界矩形相交的条目。包围盒塌不出点的实体一律返回 */
  query(minX: number, minY: number, maxX: number, maxY: number): readonly SceneItem[];
}

/** 一个格子里平均装几个实体。太小则格子本身的开销盖过收益，太大则剔除不干净 */
const TARGET_PER_CELL = 4;
/** 网格每边的格数上限。再密下去收益趋平，内存却按平方涨 */
const MAX_SIDE = 256;
/** 跨了这么多格子的实体不进网格，每次查询都返回：它多半是图框那种横贯全图的线 */
const OVERSIZED_CELLS = 64;

function boundsOfText(geometry: Drawn['entity']['geometry']): [number, number, number, number] | undefined {
  if (geometry?.kind !== 'text') return undefined;
  // 拿不到字形就估一个宽松的盒子：宁可多画，不可剔错
  const pad = geometry.height * Math.max(2, geometry.text.length);
  return [
    geometry.at.x - pad,
    geometry.at.y - geometry.height * 2,
    geometry.at.x + pad,
    geometry.at.y + geometry.height * 2
  ];
}

function centerOf(geometry: Drawn['entity']['geometry']): [number, number] | undefined {
  if (!geometry) return undefined;
  if (geometry.kind === 'circle' || geometry.kind === 'arc' || geometry.kind === 'ellipse') {
    return [geometry.center.x, geometry.center.y];
  }
  return undefined;
}

function prepare(item: Drawn): SceneItem {
  const geometry = item.entity.geometry;
  const lines: Float64Array[] = [];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const line of tessellate(geometry)) {
    if (line.length === 0) continue;
    const flat = new Float64Array(line.length * 2);
    for (let i = 0; i < line.length; i += 1) {
      const [x, y] = line[i]!;
      flat[i * 2] = x;
      flat[i * 2 + 1] = y;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    lines.push(flat);
  }
  const text = boundsOfText(geometry);
  if (text) {
    minX = Math.min(minX, text[0]);
    minY = Math.min(minY, text[1]);
    maxX = Math.max(maxX, text[2]);
    maxY = Math.max(maxY, text[3]);
  }
  return { item, lines, center: centerOf(geometry), minX, minY, maxX, maxY };
}

export function buildScene(items: readonly Drawn[]): Scene {
  return subScene(items.map(prepare));
}

/**
 * 拿已经预处理过的条目再建一层索引。
 *
 * 视口里的模型内容是模型空间全集的一个子集，重新 `tessellate` 一遍纯属浪费；
 * 直接把筛出来的 `SceneItem` 交给这里就行。
 */
export function subScene(prepared: readonly SceneItem[]): Scene {
  let worldMinX = Infinity;
  let worldMinY = Infinity;
  let worldMaxX = -Infinity;
  let worldMaxY = -Infinity;
  const placeable: SceneItem[] = [];
  // 位置不明的实体（几何被省略的记录）没有可判的位置，永远返回，与 `itemsWithinBox` 同口径
  const always: SceneItem[] = [];
  for (const entry of prepared) {
    if (entry.minX > entry.maxX) {
      always.push(entry);
      continue;
    }
    placeable.push(entry);
    if (entry.minX < worldMinX) worldMinX = entry.minX;
    if (entry.minY < worldMinY) worldMinY = entry.minY;
    if (entry.maxX > worldMaxX) worldMaxX = entry.maxX;
    if (entry.maxY > worldMaxY) worldMaxY = entry.maxY;
  }

  if (placeable.length === 0) {
    return { items: prepared, query: () => always };
  }

  const side = Math.max(1, Math.min(MAX_SIDE, Math.ceil(Math.sqrt(placeable.length / TARGET_PER_CELL))));
  const spanX = Math.max(1e-9, worldMaxX - worldMinX);
  const spanY = Math.max(1e-9, worldMaxY - worldMinY);
  const cellX = spanX / side;
  const cellY = spanY / side;
  const cells: SceneItem[][] = Array.from({ length: side * side }, () => []);

  const columnOf = (x: number): number => Math.max(0, Math.min(side - 1, Math.floor((x - worldMinX) / cellX)));
  const rowOf = (y: number): number => Math.max(0, Math.min(side - 1, Math.floor((y - worldMinY) / cellY)));

  for (const entry of placeable) {
    const c0 = columnOf(entry.minX);
    const c1 = columnOf(entry.maxX);
    const r0 = rowOf(entry.minY);
    const r1 = rowOf(entry.maxY);
    if ((c1 - c0 + 1) * (r1 - r0 + 1) > OVERSIZED_CELLS) {
      always.push(entry);
      continue;
    }
    for (let r = r0; r <= r1; r += 1) for (let c = c0; c <= c1; c += 1) cells[r * side + c]!.push(entry);
  }

  // 同一个实体会落在多个格子里，查询时靠这枚印章去重，免得每次新建 Set
  const stamp = new Int32Array(placeable.length);
  const indexOf = new Map<SceneItem, number>(placeable.map((entry, i) => [entry, i]));
  let generation = 0;

  return {
    items: prepared,
    query: (minX, minY, maxX, maxY) => {
      generation += 1;
      const out: SceneItem[] = [...always];
      if (maxX < worldMinX || minX > worldMaxX || maxY < worldMinY || minY > worldMaxY) return out;
      const c0 = columnOf(minX);
      const c1 = columnOf(maxX);
      const r0 = rowOf(minY);
      const r1 = rowOf(maxY);
      for (let r = r0; r <= r1; r += 1) {
        for (let c = c0; c <= c1; c += 1) {
          for (const entry of cells[r * side + c]!) {
            const id = indexOf.get(entry)!;
            if (stamp[id] === generation) continue;
            stamp[id] = generation;
            // 格子是包围盒的粗筛，还要再精确判一次，否则斜着横跨的实体会漏进来
            if (entry.maxX < minX || entry.minX > maxX || entry.maxY < minY || entry.minY > maxY) continue;
            out.push(entry);
          }
        }
      }
      return out;
    }
  };
}

/* ────────────────────────────────────────────────────────────────────────────
 * 吸附（FR-32.10 ~ FR-32.14）
 * ──────────────────────────────────────────────────────────────────────────── */

export type SnapKind = 'endpoint' | 'midpoint' | 'center' | 'intersection' | 'edge';

export interface SnapResult {
  readonly x: number;
  readonly y: number;
  /** 没吸到任何几何时为 `undefined`：指针原地落点，不该标成某一类 */
  readonly kind: SnapKind | undefined;
}

/** 越靠前越优先。端点压中点是原厂的口径：画图的人心里的「那个点」首先是端点 */
const PRIORITY: readonly SnapKind[] = ['endpoint', 'midpoint', 'center', 'intersection', 'edge'];

/** 吸附类型的优先级序号，越小越优先。跨空间比较（纸面 vs 视口里的模型）时要用 */
export function snapRank(kind: SnapKind | undefined): number {
  const at = kind === undefined ? -1 : PRIORITY.indexOf(kind);
  return at < 0 ? PRIORITY.length : at;
}

/** 参与两两求交的线段上限。密集区里不设限就是 O(n²) 当场炸开 */
const INTERSECTION_BUDGET = 80;

interface Candidate {
  x: number;
  y: number;
  d2: number;
}

function consider(best: Map<SnapKind, Candidate>, kind: SnapKind, x: number, y: number, d2: number): void {
  const current = best.get(kind);
  if (current === undefined || d2 < current.d2) best.set(kind, { x, y, d2 });
}

/** 点到线段的最近点 */
function nearestOnSegment(ax: number, ay: number, bx: number, by: number, px: number, py: number): [number, number] {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 <= 0) return [ax, ay];
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return [ax + dx * t, ay + dy * t];
}

/** 两条线段的交点；平行或不在段内时没有 */
function segmentIntersection(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  dx: number,
  dy: number
): [number, number] | undefined {
  const rx = bx - ax;
  const ry = by - ay;
  const sx = dx - cx;
  const sy = dy - cy;
  const denominator = rx * sy - ry * sx;
  if (Math.abs(denominator) < 1e-12) return undefined;
  const t = ((cx - ax) * sy - (cy - ay) * sx) / denominator;
  const u = ((cx - ax) * ry - (cy - ay) * rx) / denominator;
  if (t < 0 || t > 1 || u < 0 || u > 1) return undefined;
  return [ax + rx * t, ay + ry * t];
}

/**
 * 找指针附近该吸到哪儿。
 *
 * `radius` 是**世界单位**下的捕捉半径，由调用方拿屏幕像素折算——
 * 捕捉手感必须跟着缩放走，否则放大十倍之后半个屏幕的东西都在半径内。
 */
export function snapAt(scene: Scene, px: number, py: number, radius: number): SnapResult {
  const radius2 = radius * radius;
  const best = new Map<SnapKind, Candidate>();
  const segments: number[] = [];

  for (const entry of scene.query(px - radius, py - radius, px + radius, py + radius)) {
    if (entry.center) {
      const d2 = (entry.center[0] - px) ** 2 + (entry.center[1] - py) ** 2;
      if (d2 <= radius2) consider(best, 'center', entry.center[0], entry.center[1], d2);
    }
    for (const line of entry.lines) {
      for (let i = 0; i + 1 < line.length; i += 2) {
        const x = line[i]!;
        const y = line[i + 1]!;
        const d2 = (x - px) ** 2 + (y - py) ** 2;
        if (d2 <= radius2) consider(best, 'endpoint', x, y, d2);
      }
      for (let i = 0; i + 3 < line.length; i += 2) {
        const ax = line[i]!;
        const ay = line[i + 1]!;
        const bx = line[i + 2]!;
        const by = line[i + 3]!;
        // 整条线段离指针都远的话，中点、垂足、交点都不可能命中
        if (Math.min(ax, bx) - radius > px || Math.max(ax, bx) + radius < px) continue;
        if (Math.min(ay, by) - radius > py || Math.max(ay, by) + radius < py) continue;
        const mx = (ax + bx) / 2;
        const my = (ay + by) / 2;
        const md2 = (mx - px) ** 2 + (my - py) ** 2;
        if (md2 <= radius2) consider(best, 'midpoint', mx, my, md2);
        const [nx, ny] = nearestOnSegment(ax, ay, bx, by, px, py);
        const nd2 = (nx - px) ** 2 + (ny - py) ** 2;
        if (nd2 <= radius2) {
          consider(best, 'edge', nx, ny, nd2);
          if (segments.length < INTERSECTION_BUDGET * 4) segments.push(ax, ay, bx, by);
        }
      }
    }
  }

  for (let i = 0; i < segments.length; i += 4) {
    for (let j = i + 4; j < segments.length; j += 4) {
      const hit = segmentIntersection(
        segments[i]!,
        segments[i + 1]!,
        segments[i + 2]!,
        segments[i + 3]!,
        segments[j]!,
        segments[j + 1]!,
        segments[j + 2]!,
        segments[j + 3]!
      );
      if (!hit) continue;
      const d2 = (hit[0] - px) ** 2 + (hit[1] - py) ** 2;
      if (d2 <= radius2) consider(best, 'intersection', hit[0], hit[1], d2);
    }
  }

  for (const kind of PRIORITY) {
    const hit = best.get(kind);
    if (hit) return { x: hit.x, y: hit.y, kind };
  }
  return { x: px, y: py, kind: undefined };
}
