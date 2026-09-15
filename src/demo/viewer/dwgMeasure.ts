/**
 * 量测内核（0.22.0 分册 31，FR-31.7 ~ FR-31.14）。
 *
 * 这里只有**纯计算与格式化**：屏幕像素、DOM 与画布都不碰。分出来是为了能拿图纸自己的
 * 标注当标尺去验它（AC-31.9）——1216 条真实标注跑一遍，比在浏览器里目测靠谱得多。
 */

import type { DwgUnits, DwgViewport } from '@webskill/sdk/agent';

export type MeasureKind = 'distance' | 'area' | 'point' | 'angle';

/**
 * 量测叠层的取色。与 `dwgGeometry` 同因：这一页跑在 opaque origin，读不到应用主题；
 * 而量测线必须在图纸自己的图层色（那是文件里的索引色，什么色都可能）里一眼认得出来。
 */
export const MEASURE_COLORS = {
  stroke: '#38bdf8',
  pending: '#fbbf24',
  fill: 'rgba(56, 189, 248, 0.16)',
  label: '#0b1220',
  labelBackground: '#e0f2fe',
  /** 吸附标记：与量测线、待定线都要分得开，否则看不出「这是候选点」（FR-32.14） */
  snap: '#4ade80'
} as const;

export interface Measurement {
  readonly kind: MeasureKind;
  /** 图纸坐标系下的采样点，未经任何换算 */
  readonly points: readonly (readonly [number, number])[];
}

/** 量出来的数属于哪个空间。`paper` 是纸面尺寸，和建筑尺寸差着出图比例（FR-31.14） */
export type MeasureSpace = 'model' | 'paper';

export interface MeasureScale {
  readonly space: MeasureSpace;
  /** 图纸坐标 → 读数的长度系数。模型空间恒为 1，透过 1:200 的视口看时是 200 */
  readonly factor: number;
  /** 出图比例的分母，仅 `space === 'model'` 且经过视口换算时有值 */
  readonly ratio?: number;
}

const IDENTITY_SCALE: MeasureScale = { space: 'model', factor: 1 };

/** 一个纸面坐标落在哪个视口里；不在任何视口里时 `undefined` */
export function viewportAt(viewports: readonly DwgViewport[], x: number, y: number): DwgViewport | undefined {
  for (const vp of viewports) {
    const halfW = Math.abs(vp.width) / 2;
    const halfH = Math.abs(vp.height) / 2;
    if (halfW <= 0 || halfH <= 0) continue;
    if (Math.abs(x - vp.center.x) <= halfW && Math.abs(y - vp.center.y) <= halfH) return vp;
  }
  return undefined;
}

/**
 * 这一组点该按什么换算读数（FR-31.14）。
 *
 * 模型空间直接是图纸单位。图纸空间上量到的是**纸面**尺寸：只有当所有点都落在
 * 同一个视口里时才能按该视口的比例换回模型尺寸；跨视口或落在视口外时不换算，
 * 读数如实标成纸面尺寸——给一个错 200 倍却看起来合理的数字，比不给更糟。
 */
export function measureScale(
  viewKind: 'model' | 'layout',
  viewports: readonly DwgViewport[],
  points: readonly (readonly [number, number])[]
): MeasureScale {
  if (viewKind !== 'layout') return IDENTITY_SCALE;
  if (points.length === 0) return { space: 'paper', factor: 1 };
  const first = viewportAt(viewports, points[0]![0], points[0]![1]);
  if (!first) return { space: 'paper', factor: 1 };
  for (const [x, y] of points.slice(1)) {
    if (viewportAt(viewports, x, y) !== first) return { space: 'paper', factor: 1 };
  }
  const paperHeight = Math.abs(first.height);
  const modelHeight = Math.abs(first.viewHeight);
  if (!(paperHeight > 0) || !(modelHeight > 0)) return { space: 'paper', factor: 1 };
  const factor = modelHeight / paperHeight;
  if (!Number.isFinite(factor) || factor <= 0) return { space: 'paper', factor: 1 };
  return { space: 'model', factor, ratio: factor };
}

/** 折线总长（图纸坐标）。少于两个点时为 0 */
export function polylineLength(points: readonly (readonly [number, number])[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += Math.hypot(points[i]![0] - points[i - 1]![0], points[i]![1] - points[i - 1]![1]);
  }
  return total;
}

/** 多边形面积（鞋带公式）。取绝对值，与点的绕向无关（AC-31.11） */
export function polygonArea(points: readonly (readonly [number, number])[]): number {
  if (points.length < 3) return 0;
  let twice = 0;
  for (let i = 0; i < points.length; i += 1) {
    const [x1, y1] = points[i]!;
    const [x2, y2] = points[(i + 1) % points.length]!;
    twice += x1 * y2 - x2 * y1;
  }
  return Math.abs(twice) / 2;
}

/** 闭合周长：折线长 + 收尾那一段 */
export function polygonPerimeter(points: readonly (readonly [number, number])[]): number {
  if (points.length < 3) return polylineLength(points);
  const last = points[points.length - 1]!;
  return polylineLength(points) + Math.hypot(points[0]![0] - last[0], points[0]![1] - last[1]);
}

/** 三点夹角，顶点是中间那个。重合点没有夹角，返回 `undefined`（AC-31.18） */
export function angleBetween(
  a: readonly [number, number],
  vertex: readonly [number, number],
  b: readonly [number, number]
): number | undefined {
  const ux = a[0] - vertex[0];
  const uy = a[1] - vertex[1];
  const vx = b[0] - vertex[0];
  const vy = b[1] - vertex[1];
  const lu = Math.hypot(ux, uy);
  const lv = Math.hypot(vx, vy);
  if (lu === 0 || lv === 0) return undefined;
  const cos = Math.min(1, Math.max(-1, (ux * vx + uy * vy) / (lu * lv)));
  return (Math.acos(cos) * 180) / Math.PI;
}

const UNIT_SUFFIX: Record<Exclude<DwgUnits, 'unitless'>, string> = {
  mm: 'mm',
  cm: 'cm',
  m: 'm',
  km: 'km',
  in: 'in',
  ft: 'ft',
  yd: 'yd',
  mi: 'mi'
};

export interface MeasureText {
  readonly lang: 'zh' | 'en';
  readonly units: DwgUnits | undefined;
  readonly decimals: number;
}

/** 千分位分组。图纸尺度动辄五六位数，不分组根本读不出是几万还是几十万 */
function groupDigits(value: number, decimals: number): string {
  const fixed = value.toFixed(decimals);
  const [whole = '', fraction] = fixed.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return fraction === undefined ? grouped : `${grouped}.${fraction}`;
}

/**
 * 单位后缀。读不出量纲时说「单位 / units」，**不默认按毫米显示**（FR-31.13）：
 * 猜错一次就是 1000 倍，而且屏幕上不会有任何提示。
 */
function suffixOf(text: MeasureText, space: MeasureSpace): string {
  if (space === 'paper') return text.lang === 'zh' ? '纸面单位' : 'paper units';
  const units = text.units;
  if (units === undefined || units === 'unitless') return text.lang === 'zh' ? '单位' : 'units';
  return UNIT_SUFFIX[units];
}

export function formatLength(raw: number, scale: MeasureScale, text: MeasureText): string {
  return `${groupDigits(raw * scale.factor, text.decimals)} ${suffixOf(text, scale.space)}`;
}

export function formatArea(raw: number, scale: MeasureScale, text: MeasureText): string {
  return `${groupDigits(raw * scale.factor * scale.factor, text.decimals)} ${suffixOf(text, scale.space)}²`;
}

export function formatPoint(x: number, y: number, text: MeasureText): string {
  return `X ${groupDigits(x, text.decimals)} · Y ${groupDigits(y, text.decimals)}`;
}

export function formatAngle(degrees: number, text: MeasureText): string {
  return `${degrees.toFixed(Math.max(1, text.decimals))}°`;
}

/** 一条量测在画布上显示的读数；点不够时返回 `undefined`，界面据此不画标签 */
export function measurementLabel(measurement: Measurement, scale: MeasureScale, text: MeasureText): string | undefined {
  const points = measurement.points;
  switch (measurement.kind) {
    case 'distance':
      return points.length < 2 ? undefined : formatLength(polylineLength(points), scale, text);
    case 'area': {
      if (points.length < 3) return undefined;
      const area = formatArea(polygonArea(points), scale, text);
      const perimeter = formatLength(polygonPerimeter(points), scale, text);
      return text.lang === 'zh' ? `${area} · 周长 ${perimeter}` : `${area} · perimeter ${perimeter}`;
    }
    case 'point':
      return points.length < 1 ? undefined : formatPoint(points[0]![0], points[0]![1], text);
    case 'angle': {
      if (points.length < 3) return undefined;
      const degrees = angleBetween(points[0]!, points[1]!, points[2]!);
      return degrees === undefined ? undefined : formatAngle(degrees, text);
    }
  }
}

/** 一条量测的标签挂在哪儿（图纸坐标）。距离挂中点，其余挂重心 */
export function labelAnchor(measurement: Measurement): readonly [number, number] | undefined {
  const points = measurement.points;
  if (points.length === 0) return undefined;
  if (measurement.kind === 'point') return points[0]!;
  if (measurement.kind === 'angle') return points[1] ?? points[0]!;
  if (measurement.kind === 'distance' && points.length >= 2) {
    const a = points[0]!;
    const b = points[points.length - 1]!;
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  }
  let x = 0;
  let y = 0;
  for (const [px, py] of points) {
    x += px;
    y += py;
  }
  return [x / points.length, y / points.length];
}

/**
 * 点中了哪一条量测（FR-31.10）。
 *
 * 判据是**屏幕距离**而不是图纸距离：图纸尺度跨越五个数量级，用世界坐标定阈值的话
 * 同一个阈值在建筑总图上抓不住任何东西，在节点详图上一点就选中五条。
 */
export function hitMeasurement(
  measurements: readonly Measurement[],
  toScreen: (x: number, y: number) => readonly [number, number],
  px: number,
  py: number,
  tolerance: number
): number {
  let best = -1;
  let bestDistance = tolerance;
  for (const [index, measurement] of measurements.entries()) {
    const screen = measurement.points.map(([x, y]) => toScreen(x, y));
    const closed = measurement.kind === 'area' && screen.length >= 3;
    const distance =
      screen.length === 1
        ? Math.hypot(screen[0]![0] - px, screen[0]![1] - py)
        : segmentsDistance(screen, closed, px, py);
    if (distance <= bestDistance) {
      bestDistance = distance;
      best = index;
    }
  }
  return best;
}

function segmentsDistance(
  screen: readonly (readonly [number, number])[],
  closed: boolean,
  px: number,
  py: number
): number {
  let best = Infinity;
  const count = closed ? screen.length : screen.length - 1;
  for (let i = 0; i < count; i += 1) {
    const a = screen[i]!;
    const b = screen[(i + 1) % screen.length]!;
    best = Math.min(best, pointToSegment(a, b, px, py));
  }
  return best;
}

function pointToSegment(a: readonly [number, number], b: readonly [number, number], px: number, py: number): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(px - a[0], py - a[1]);
  const t = Math.min(1, Math.max(0, ((px - a[0]) * dx + (py - a[1]) * dy) / lengthSquared));
  return Math.hypot(px - (a[0] + dx * t), py - (a[1] + dy * t));
}

// ---- 状态机 ----
//
// 工具态单独拎出来做成纯函数，是为了「工具没激活时画布行为一个字节都不变」这条
// 能被**证伪地**验（AC-31.14）：下面每个转移在无事发生时返回**同一个对象**，
// 测试直接断引用相等。塞在 viewerDwg 的闭包里就只能靠读源码猜了。

export interface MeasureState {
  readonly tool: MeasureKind | 'erase' | undefined;
  readonly measurements: readonly Measurement[];
  /** 正在点、还没收尾的那一条 */
  readonly pending: readonly (readonly [number, number])[];
}

export const IDLE_MEASURE_STATE: MeasureState = { tool: undefined, measurements: [], pending: [] };

/**
 * 指针停在 `cursor` 时应该实时显示的那一条量测（FR-32.15 ~ FR-32.19）。
 *
 * 返回的是一条**货真价实的** `Measurement`，于是实时读数与松手之后的读数
 * 走的是同一个 `measurementLabel`，不可能出现「松手瞬间数字跳一下」——
 * 这条由 AC-32.12 ~ AC-32.14 逐字节比对守着。
 */
export function livePreview(state: MeasureState, cursor: readonly [number, number]): Measurement | undefined {
  const tool = state.tool;
  if (tool === undefined || tool === 'erase') return undefined;
  // 坐标工具一次都不用点：悬停就得有读数（FR-32.17）
  if (tool === 'point') return { kind: 'point', points: [cursor] };
  if (tool === 'distance')
    return state.pending.length === 1 ? { kind: 'distance', points: [state.pending[0]!, cursor] } : undefined;
  if (tool === 'angle')
    return state.pending.length === 2 ? { kind: 'angle', points: [...state.pending, cursor] } : undefined;
  // 区域：已经点了两个点就把指针当临时的第三点闭合，不必等 Enter（FR-32.16）
  return state.pending.length >= 2 ? { kind: 'area', points: [...state.pending, cursor] } : undefined;
}

/** 选工具：再点一次同一个是关掉它。换工具会丢掉没量完的那一条 */
export function measureSelect(state: MeasureState, next: MeasureKind | 'erase'): MeasureState {
  const tool = state.tool === next ? undefined : next;
  if (tool === state.tool && state.pending.length === 0) return state;
  return { ...state, tool, pending: [] };
}

/**
 * 画布上点了一下。
 *
 * `pick` 只在删除模式下会被调用——命中判定要屏幕坐标，纯函数这边拿不到。
 */
export function measureClick(state: MeasureState, point: readonly [number, number], pick: () => number): MeasureState {
  if (state.tool === undefined) return state;
  if (state.tool === 'erase') {
    const index = pick();
    if (index < 0 || index >= state.measurements.length) return state;
    return { ...state, measurements: state.measurements.filter((_, i) => i !== index) };
  }
  const pending = [...state.pending, point];
  const full =
    state.tool === 'point' ||
    (state.tool === 'distance' && pending.length >= 2) ||
    (state.tool === 'angle' && pending.length >= 3);
  return full ? measureCommit({ ...state, pending }) : { ...state, pending };
}

/** 收尾当前这一条（区域靠 Enter 或双击走到这里）。点不够时按兵不动 */
export function measureCommit(state: MeasureState): MeasureState {
  const tool = state.tool;
  if (tool === undefined || tool === 'erase' || state.pending.length === 0) return state;
  if (tool === 'area' && state.pending.length < 3) return state;
  return {
    ...state,
    measurements: [...state.measurements, { kind: tool, points: state.pending }],
    pending: []
  };
}

/** Esc：放弃正在点的这一条，已量完的不动（FR-31.7 / FR-31.8） */
export function measureAbort(state: MeasureState): MeasureState {
  return state.pending.length === 0 ? state : { ...state, pending: [] };
}

/** 清除全部；切换视图时走的也是它（FR-31.11） */
export function measureClear(state: MeasureState): MeasureState {
  if (state.measurements.length === 0 && state.pending.length === 0) return state;
  return { ...state, measurements: [], pending: [] };
}

/**
 * 双击收尾前把重复点去掉。
 *
 * 一次双击会先走完两次 `pointerup`，同一个位置因此进了两遍；
 * 不去掉的话区域的最后一条边长度为零，周长没错但顶点数是假的。
 */
export function measureDropTail(state: MeasureState, epsilon: number): MeasureState {
  let pending = state.pending;
  while (pending.length > 3) {
    const last = pending[pending.length - 1]!;
    const prev = pending[pending.length - 2]!;
    if (Math.hypot(last[0] - prev[0], last[1] - prev[1]) > epsilon) break;
    pending = pending.slice(0, -1);
  }
  return pending === state.pending ? state : { ...state, pending };
}
