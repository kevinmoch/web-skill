/**
 * DWG 解析（0.22.0 分册 19，FR-19.4）。
 *
 * 用 `@node-projects/acad-ts` 把一份 DWG 读成 SDK 的 `DwgDocumentContent`。
 * 这里是**纯函数**，不碰 `chrome.*`、不碰 DOM——这样它既能跑在 Worker 里
 * （`dwgWorker.ts` 是唯一的调用点），也能在 node 下直接对真实图纸跑测试。
 *
 * 三条来自实测的硬要求（分册 19 §2.3）：
 * 1. **必须递归展开块**：`2D.dwg` 顶层只有 1129 个实体，展开后 6044 个。
 *    不展开就是一张近乎空白的图。标注（DIMENSION）的尺寸线、箭头、文字同样
 *    藏在匿名块 `*D16` 里，一并展开才画得出来。
 * 2. **ACIS 实体镶嵌不了**：`Solid3D` 拿得到 5.5 MB SAB 原始字节，但
 *    `wires`/`silhouettes`/`getBoundingBox()` 全是空的，JS 生态里没有 SAB 曲面镶嵌器。
 *    这类实体计数上报成 `omissions`，绝不静默丢掉。
 * 3. **实体色多为 ByLayer**：`color.getRgb()` 在 index=256 时返回 `undefined`，
 *    必须回落到图层色，否则整张图都会变成同一个颜色。
 */

import {
  Arc,
  AttributeDefinition,
  AttributeFlags,
  Circle,
  Dimension,
  DwgReader,
  Ellipse,
  Entity,
  Face3D,
  Hatch,
  HatchBoundaryPathArc,
  HatchBoundaryPathEllipse,
  HatchBoundaryPathLine,
  HatchBoundaryPathPolyline,
  Insert,
  Leader,
  Line,
  LwPolyline,
  MText,
  Point,
  Polyline2D,
  Polyline3D,
  Solid,
  Solid3D,
  Spline,
  TextEntity,
  TextHorizontalAlignment,
  TextVerticalAlignmentType,
  Vertex2D,
  Viewport,
  Wipeout
} from '@node-projects/acad-ts';
import type {
  DwgBounds,
  DwgComponent,
  DwgDocumentContent,
  DwgEntity,
  DwgFill,
  DwgFont,
  DwgGeometry,
  DwgLayer,
  DwgOmission,
  DwgPoint,
  DwgUnits,
  DwgView,
  DwgViewport
} from '@webskill/sdk/agent';

/**
 * 二维仿射变换 `[a, b, c, d, e, f]`：`x' = a·x + c·y + e`，`y' = b·x + d·y + f`。
 * 块引用可以嵌套（实测 `2D.dwg` 深度 2），变换必须逐层复合后烘焙进坐标，
 * 投放面拿到的才是一组可以直接画的世界坐标。
 */
type Matrix = readonly [number, number, number, number, number, number];

export type { Matrix as DwgMatrix };

const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

/** 嵌套块的递归深度上限。自引用的块定义在真实图纸里出现过，没有它会栈溢出 */
const MAX_BLOCK_DEPTH = 8;

/** 圆弧转折线时的最大步长（15°）。CAD 图是拿来放大看的，太粗会露出棱角 */
const ARC_STEP = Math.PI / 12;

/**
 * 单个填充展开后的线段数上限。
 *
 * 实测这份图纸最密的一个填充是 6358 段（168 个图案填充合计 27177 段、65 ms），
 * 所以上限不是为了挡住正常图纸，而是挡住「填充区域大、图案比例小」那种
 * 能生成上百万段的病态组合——那会把 Worker 卡死。触限的如实上报（FR-23.6）。
 */
const PATTERN_SEGMENT_LIMIT = 20000;

/**
 * 展开**前**的估算上限（分册 28 FR-28.1）。
 *
 * 与 `PATTERN_SEGMENT_LIMIT` 同值不是巧合：两者挡的是同一件事，
 * 只是一个在展开前按几何估，一个在展开后按实际数。前者防的是「展开过程本身
 * 就把堆吃光」——`大堂平面图.dwg` 有 40 个填充估算超限，其中最大的一个估到
 * 1.1×10¹¹ 段，真去展开会让进程 abort。
 * 实测 `2D.dwg` 的 172 个填充估算最大 2,034，无一触限，因此对既有图纸零影响。
 */
const PATTERN_ESTIMATE_LIMIT = 20000;

/** 图案太密、线型缺定义这两类不是「实体类型」，用两个不会与 `objectName` 撞名的键记账 */
const PATTERN_TOO_DENSE = 'HATCH_PATTERN';
const LINETYPE_MISSING = 'LINETYPE_MISSING';

function apply(m: Matrix, x: number, y: number): DwgPoint {
  return { x: m[0] * x + m[2] * y + m[4], y: m[1] * x + m[3] * y + m[5] };
}

/** 复合：先用 `local` 再用 `parent`，等价于矩阵乘 `parent · local` */
function compose(parent: Matrix, local: Matrix): Matrix {
  return [
    parent[0] * local[0] + parent[2] * local[1],
    parent[1] * local[0] + parent[3] * local[1],
    parent[0] * local[2] + parent[2] * local[3],
    parent[1] * local[2] + parent[3] * local[3],
    parent[0] * local[4] + parent[2] * local[5] + parent[4],
    parent[1] * local[4] + parent[3] * local[5] + parent[5]
  ];
}

/**
 * AutoCAD 任意轴算法（Arbitrary Axis Algorithm）：把实体的对象坐标系压平成二维仿射变换。
 *
 * DWG 的实体坐标写在 OCS 里，靠组码 210（法向）定向，不转就是错的。
 * 法向为 `(0,0,-1)` 时该算法给出 `x` 取反、`y` 不变——实测 `2D.dwg` 有 442 条实体
 * 因此被沿 Y 轴镜像出了图，其中 364 条本该落在 P-09 的视口取景窗口内（FR-27.1）。
 */
export function ocsMatrix(
  normal: { readonly x: number; readonly y: number; readonly z: number } | undefined
): readonly [number, number, number, number, number, number] {
  if (!normal) return IDENTITY;
  const len = Math.hypot(normal.x, normal.y, normal.z);
  if (!Number.isFinite(len) || len < 1e-12) return IDENTITY;
  const nx = normal.x / len;
  const ny = normal.y / len;
  const nz = normal.z / len;
  // 法向贴近 ±Z 时 `Wz × N` 会退化成零向量，算法规定改用 `Wy × N`
  const degenerate = Math.abs(nx) < 1 / 64 && Math.abs(ny) < 1 / 64;
  const raw = degenerate ? [nz, 0, -nx] : [-ny, nx, 0];
  const axLen = Math.hypot(raw[0]!, raw[1]!, raw[2]!);
  if (axLen < 1e-12) return IDENTITY;
  const ax = raw[0]! / axLen;
  const ay = raw[1]! / axLen;
  const az = raw[2]! / axLen;
  // Ay = N × Ax，两者都已是单位向量且正交，叉积不必再归一化
  const bx = ny * az - nz * ay;
  const by = nz * ax - nx * az;
  return [ax, ay, bx, by, 0, 0];
}

/**
 * 半径在变换下的缩放系数。取行列式的平方根：保角变换（旋转 + 等比缩放）时精确。
 * 非保角时不能用它——见 `isConformal`。
 */
function scaleOf(m: Matrix): number {
  return Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2]));
}

/** 变换把 x 轴转到哪个方向。翻手时它是「世界角 = 这个值 − 局部角」里的那个值，不是旋转量 */
function rotationOf(m: Matrix): number {
  return Math.atan2(m[1], m[0]);
}

/**
 * 变换是否保角（只含旋转与等比缩放）。
 *
 * 块的非均匀缩放在真实图纸里**并不罕见**：实测 `2D.dwg` 的窗块用的是
 * `scale=900,200` 这种拉伸。不保角时圆的像是椭圆、弧的像是椭圆弧，
 * 拿单一半径表达不了，这时改用采样折线——形状正确优先于参数式表达。
 */
function isConformal(m: Matrix): boolean {
  const sx = m[0] * m[0] + m[1] * m[1];
  const sy = m[2] * m[2] + m[3] * m[3];
  const shear = m[0] * m[2] + m[1] * m[3];
  const scale = Math.max(sx, sy, 1e-12);
  return Math.abs(sx - sy) / scale < 1e-6 && Math.abs(shear) / scale < 1e-6;
}

/**
 * 变换是否翻手（行列式为负）。
 *
 * `isConformal` 对镜像同样成立——镜像保长度、保角度**大小**，只把角度的**符号**翻过来。
 * 圆不在乎，弧和椭圆弧在乎：世界角 = `rotationOf(m) − t` 而不是 `t + rotationOf(m)`，
 * 起止角还得对调，否则弧会画到对侧去（实测 `大堂平面图.dwg` 16 859 条弧里有 3 586 条
 * 落在翻手变换下——法向 `(0,0,-1)` 的实体与 `xScale<0` 的块引用各占一部分）。
 */
function isMirrored(m: Matrix): boolean {
  return m[0] * m[3] - m[1] * m[2] < 0;
}

/** 把一段椭圆弧（包含正圆）按参数采样成世界坐标折线 */
function sampleArc(
  m: Matrix,
  cx: number,
  cy: number,
  majorX: number,
  majorY: number,
  ratio: number,
  start: number,
  end: number
): DwgPoint[] {
  let sweep = end - start;
  if (sweep <= 0) sweep += Math.PI * 2;
  const steps = Math.max(8, Math.ceil(sweep / ARC_STEP));
  const minorX = -majorY * ratio;
  const minorY = majorX * ratio;
  const points: DwgPoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = start + (sweep * i) / steps;
    const cos = Math.cos(t);
    const sin = Math.sin(t);
    points.push(apply(m, cx + majorX * cos + minorX * sin, cy + majorY * cos + minorY * sin));
  }
  return points;
}

/**
 * 把 bulge 段离散成点。bulge = tan(θ/4)，θ 是圆弧的包含角。
 * LwPolyline / Polyline2D 的圆弧段全靠它，纯用顶点连线会把所有圆角切成直角。
 */
function bulgeArcPoints(from: DwgPoint, to: DwgPoint, bulge: number): DwgPoint[] {
  const factor = (1 - bulge * bulge) / (2 * bulge);
  const cx = (from.x + to.x) / 2 + ((from.y - to.y) / 2) * factor;
  const cy = (from.y + to.y) / 2 + ((to.x - from.x) / 2) * factor;
  const radius = Math.hypot(from.x - cx, from.y - cy);
  if (!Number.isFinite(radius) || radius === 0) return [to];

  const start = Math.atan2(from.y - cy, from.x - cx);
  const end = Math.atan2(to.y - cy, to.x - cx);
  let sweep = end - start;
  // bulge 为正表示逆时针；把扫过角规整到与它同号，否则会画出补弧
  if (bulge > 0 && sweep < 0) sweep += Math.PI * 2;
  if (bulge < 0 && sweep > 0) sweep -= Math.PI * 2;

  const steps = Math.max(2, Math.ceil(Math.abs(sweep) / ARC_STEP));
  const points: DwgPoint[] = [];
  for (let i = 1; i <= steps; i++) {
    const angle = start + (sweep * i) / steps;
    points.push({ x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) });
  }
  return points;
}

interface RawVertex {
  readonly point: DwgPoint;
  readonly bulge: number;
}

/** 顶点 + bulge 序列 → 世界坐标折线 */
function flattenVertices(vertices: readonly RawVertex[], closed: boolean, m: Matrix): DwgPoint[] {
  if (vertices.length === 0) return [];
  const points: DwgPoint[] = [apply(m, vertices[0]!.point.x, vertices[0]!.point.y)];
  const last = closed ? vertices.length : vertices.length - 1;
  for (let i = 0; i < last; i++) {
    const from = vertices[i]!;
    const to = vertices[(i + 1) % vertices.length]!;
    if (from.bulge !== 0) {
      for (const p of bulgeArcPoints(from.point, to.point, from.bulge)) points.push(apply(m, p.x, p.y));
    } else {
      points.push(apply(m, to.point.x, to.point.y));
    }
  }
  return points;
}

function readLwPolylineVertices(entity: LwPolyline): RawVertex[] {
  return [...entity.vertices].map((v) => ({
    point: { x: v.location.x, y: v.location.y },
    bulge: v.bulge ?? 0
  }));
}

/** `Polyline2D.vertices` 的静态类型是 `Entity`，运行时装的是 `Vertex2D`；非顶点成员直接跳过 */
function readPolyline2DVertices(entity: Polyline2D): RawVertex[] {
  const out: RawVertex[] = [];
  for (const vertex of entity.vertices) {
    if (!(vertex instanceof Vertex2D)) continue;
    out.push({ point: { x: vertex.location.x, y: vertex.location.y }, bulge: vertex.bulge ?? 0 });
  }
  return out;
}

/**
 * 属性文字的字高（0.22.0 分册 30 FR-30.1）。
 *
 * 实测 `大堂平面图.dwg` / `2D.dwg` / `cad.dwg` 里 1764 个能按 `tag` 配上 `ATTDEF`
 * 的属性，凡是宿主缩放不为 1 的，`ATTRIB.height` 一律等于 `ATTDEF.height × scale²`
 * ——宿主缩放被乘了两遍，于是 `No.数据插座` 里一个 `D` 的字高成了 53760，
 * 而全图文字高度的中位数只有 300，一个字就糊住了整栋楼。
 *
 * 取块定义的字高乘**一次**缩放，而不是拿 `ATTRIB.height` 除一次：两种上游都对。
 * 上游若只乘了一次，`ATTDEF.height × scale` 与它相等；除法只在乘了两次时才对。
 */
export function attributeTextHeight(
  attribute: { readonly tag: string; readonly height: number },
  definitionHeights: ReadonlyMap<string, number>,
  scale: number
): number {
  const base = definitionHeights.get(attribute.tag);
  // 缩放为 0 会把整条文字压成零高，等于悄悄删掉它
  const factor = Number.isFinite(scale) && Math.abs(scale) > 0 ? Math.abs(scale) : 1;
  return base !== undefined && Number.isFinite(base) && base > 0 ? base * factor : attribute.height;
}

/** Hatch 只取边界：填充图案本身不参与对比，边界才是几何 */
function hatchBoundaryPoints(entity: Hatch, m: Matrix): DwgPoint[][] {
  const loops: DwgPoint[][] = [];
  for (const path of entity.paths) {
    const points: DwgPoint[] = [];
    for (const edge of path.edges) {
      if (edge instanceof HatchBoundaryPathLine) {
        points.push(apply(m, edge.start.x, edge.start.y), apply(m, edge.end.x, edge.end.y));
      } else if (edge instanceof HatchBoundaryPathPolyline) {
        const vertices: RawVertex[] = edge.vertices.map((v, i) => ({
          point: { x: v.x, y: v.y },
          bulge: edge.bulges?.[i] ?? 0
        }));
        points.push(...flattenVertices(vertices, edge.isClosed === true, m));
      } else if (edge instanceof HatchBoundaryPathArc) {
        const sweepEnd = edge.counterClockWise ? edge.endAngle : edge.startAngle;
        const sweepStart = edge.counterClockWise ? edge.startAngle : edge.endAngle;
        const steps = Math.max(2, Math.ceil(Math.abs(sweepEnd - sweepStart) / ARC_STEP));
        for (let i = 0; i <= steps; i++) {
          const angle = sweepStart + ((sweepEnd - sweepStart) * i) / steps;
          points.push(
            apply(m, edge.center.x + edge.radius * Math.cos(angle), edge.center.y + edge.radius * Math.sin(angle))
          );
        }
      } else if (edge instanceof HatchBoundaryPathEllipse) {
        const steps = 32;
        for (let i = 0; i <= steps; i++) {
          const angle = (Math.PI * 2 * i) / steps;
          const mx = edge.majorAxisEndPoint.x;
          const my = edge.majorAxisEndPoint.y;
          const minor = edge.minorToMajorRatio;
          points.push(
            apply(
              m,
              edge.center.x + mx * Math.cos(angle) - my * minor * Math.sin(angle),
              edge.center.y + my * Math.cos(angle) + mx * minor * Math.sin(angle)
            )
          );
        }
      }
    }
    if (points.length >= 2) loops.push(points);
  }
  return loops;
}

/** 样条按控制点/拟合点近似成折线。精确求值需要 de Boor，对「看图找差异」而言不划算 */
function splinePoints(entity: Spline, m: Matrix): DwgPoint[] {
  const source = entity.fitPoints.length >= 2 ? entity.fitPoints : entity.controlPoints;
  return source.map((p) => apply(m, p.x, p.y));
}

const HEX = '0123456789abcdef';

/** ACI 索引色 → RGB 由 acad-ts 的 `getRgb()` 负责；这里只做十六进制串 */
function hexOf(rgb: readonly number[] | undefined, fallback: string): string {
  if (!rgb || rgb.length < 3) return fallback;
  let out = '#';
  for (let i = 0; i < 3; i++) {
    const v = Math.max(0, Math.min(255, Math.round(rgb[i]!)));
    out += HEX[(v >> 4) & 0xf]! + HEX[v & 0xf]!;
  }
  return out;
}

/**
 * 实体色。`index === 256` 是 ByLayer，`getRgb()` 这时返回 undefined——
 * 返回 undefined 让渲染层回落到图层色，而不是在这里就把图层色烘进去：
 * 图层色会随图层表变，烘进实体就再也改不回来了。
 */
function entityColor(entity: Entity): string | undefined {
  const color = entity.color;
  if (!color || color.isByLayer || color.isByBlock) return undefined;
  const rgb = color.getRgb();
  if (!rgb) return undefined;
  return hexOf(rgb, '#d4d4d4');
}

/**
 * 是不是「随块」颜色。ByLayer 与 ByBlock 在 `entityColor()` 里都返回 undefined，
 * 但两者的回落对象不同：ByLayer 回落图层色，ByBlock 回落**宿主块引用**的颜色。
 * 实测 `2D.dwg` 有 2119 条 ByBlock 实体，一律按图层色画会把块里的红虚线框画成白的。
 */
function isByBlockColor(entity: Entity): boolean {
  return entity.color?.isByBlock === true;
}

/**
 * 实体最终的颜色。自己写死的优先；ByBlock 取宿主块引用的；
 * ByLayer（以及宿主那里也没解出来的 ByBlock）返回 undefined，留给渲染端回落图层色。
 */
export function resolvedColor(entity: Entity, inheritedColor: string | undefined): string | undefined {
  return entityColor(entity) ?? (isByBlockColor(entity) ? inheritedColor : undefined);
}

/**
 * 线型 → canvas 的 dash 数组（世界单位）。
 *
 * DWG 的 segment 长度：正 = 实线段，负 = 空白，0 = 点。canvas 的 `setLineDash`
 * 要的正好是 `[on, off, on, off…]` 的绝对值序列，两者一一对应。
 * 点段取 0 会被 canvas 当成「不画」，用图案总长的 1% 代替，肉眼就是个点。
 */
export function dashFromLineType(
  lineType: { name: string; patternLength?: number; segments?: readonly { length: number }[] } | null | undefined
): readonly number[] | undefined {
  const segments = lineType?.segments;
  if (!segments || segments.length === 0) return undefined;
  const dot = Math.max((lineType?.patternLength ?? 0) * 0.01, 1e-3);
  const out = segments.map((s) => (s.length === 0 ? dot : Math.abs(s.length)));
  return out.some((v) => v > 0) ? out : undefined;
}

/** 已解析的图层线型表，供 ByLayer 的实体回落 */
type LayerDashes = ReadonlyMap<string, readonly number[]>;

/** 已解析的图层线宽表（0.01 mm），供 ByLayer 的实体回落 */
type LayerWeights = ReadonlyMap<string, number>;

/**
 * DWG 里线宽的三个间接值（`LineWeightType`）。
 * 还有个 `ByDIPs = -4`，那是给屏幕像素用的，不出现在图纸实体上。
 */
const WEIGHT_BY_LAYER = -1;
const WEIGHT_BY_BLOCK = -2;
const WEIGHT_DEFAULT = -3;

/**
 * AutoCAD 的 LWDEFAULT 出厂值，0.25 mm。
 * 图头里没有承载它的字段（只有 `currentEntityLineWeight`，那是「下一个新建实体用什么」，
 * 不是 `Default` 该解成什么），所以取这个众所周知的默认值。
 */
const DEFAULT_LINE_WEIGHT = 25;

/**
 * 实体最终该用的线宽，单位 0.01 mm（FR-25.3）。
 *
 * 实测 `大堂立面图.dwg` 的 4346 条实体里 3636 条是 ByLayer、192 条是 ByBlock，
 * 也就是说**九成实体的线宽根本不在自己身上**——不把这三个间接值解开，
 * 等于什么都没读到。图层侧的线宽从 `5`(0.05 mm) 到 `50`(0.50 mm) 跨十倍，
 * 正是官方图上图框、云线与细标注线能一眼分出层次的原因。
 *
 * `inherited` 是块引用自己解出来的线宽，供块内 ByBlock 的实体回落。
 */
export function lineWeightOf(
  entity: { lineWeight?: number },
  layer: string,
  layerWeights: LayerWeights,
  inherited: number | undefined
): number | undefined {
  const own = entity.lineWeight;
  if (own === undefined || !Number.isFinite(own)) return undefined;
  if (own >= 0) return own;
  if (own === WEIGHT_BY_LAYER) {
    const fromLayer = layerWeights.get(layer);
    // 图层自己也可能写着 Default
    return fromLayer === undefined ? undefined : fromLayer === WEIGHT_DEFAULT ? DEFAULT_LINE_WEIGHT : fromLayer;
  }
  if (own === WEIGHT_BY_BLOCK) return inherited;
  if (own === WEIGHT_DEFAULT) return DEFAULT_LINE_WEIGHT;
  // ByDIPs 之类：解不出来就不报，让渲染端按缺省线宽画
  return undefined;
}

/**
 * 不需要自己的图案定义的线型名。
 * 前两个是「看别人的」，Continuous 本来就是实线，都不算「取不到定义」。
 */
const IMPLICIT_LINETYPES = new Set(['', 'bylayer', 'byblock', 'continuous']);

/**
 * 实体最终该用的 dash（世界单位）。
 *
 * 段长要乘两道比例（FR-24.2）：图纸级的 `globalScale`（图头 LTSCALE）
 * 乘实体自己的 `lineTypeScale`（CELTSCALE）。`大堂立面图.dwg` 的 LTSCALE 是 10，
 * 不乘的话一条 11.9 周期的虚线会密一个数量级，跟原厂完全对不上。
 *
 * 返回 `'unavailable'` 表示实体指名要一个线型、可那个线型没有图案定义：
 * 画成实线是退让，得当成降级说出来，而不是默默地把虚线画成实线（AC-23.5）。
 */
export function dashOf(
  entity: {
    lineType?: { name: string; patternLength?: number; segments?: readonly { length: number }[] };
    lineTypeScale?: number;
  },
  layer: string,
  layerDashes: LayerDashes,
  globalScale = 1
): readonly number[] | 'unavailable' | undefined {
  const own = entity.lineType;
  // 0 与 NaN 都该当「没设」：乘上去会把整条虚线压成零长，canvas 直接不画
  const scale = (entity.lineTypeScale || 1) * (Number.isFinite(globalScale) && globalScale > 0 ? globalScale : 1);
  // ByLayer / ByBlock 在 acad-ts 里是两个没有 segments 的伪线型，落到图层表上
  const base = dashFromLineType(own) ?? layerDashes.get(layer);
  if (base) return scale === 1 ? base : base.map((v) => v * scale);
  return IMPLICIT_LINETYPES.has((own?.name ?? '').toLowerCase()) ? undefined : 'unavailable';
}

/**
 * 展开前先估算图案线段数（FR-28.1）。
 *
 * 存在的理由是一次 P0：`大堂平面图.dwg` 里有个 `CROSS` 填充，边界包围盒
 * 492,782 × 4,195,671 图纸单位，而图案线偏移只有 2245.3 单位——`explodePattern()`
 * 会一路分配到 V8 抛 `Ineffective mark-compacts near heap limit`。
 * 那是**进程级 abort，不是可捕获的异常**，所以扩展表现为「直接消失」。
 *
 * 因此判断必须发生在展开**之前**：等展开完再数长度，堆已经没了。
 * 估算是保守上界（实测 `2D.dwg` 估 19,736 对实际 7,240，高估约 2.7 倍），
 * 宁可高估也不能漏放。
 */
export function patternSegmentEstimate(
  lines: readonly {
    readonly offset?: { readonly x: number; readonly y: number };
    readonly dashLengths?: Iterable<number>;
  }[],
  span: number
): number {
  if (lines.length === 0) return 0;
  if (!Number.isFinite(span) || span <= 0) return 0;
  let total = 0;
  for (const line of lines) {
    const offset = Math.hypot(line.offset?.x ?? 0, line.offset?.y ?? 0);
    // 偏移为 0 意味着同一条线无限重复，展开行为不可预测——当作超预算挡掉
    if (!(offset > 0) || !Number.isFinite(offset)) return Infinity;
    let cycle = 0;
    for (const dash of line.dashLengths ?? []) cycle += Math.abs(dash);
    total += (span / offset) * (cycle > 0 ? Math.max(1, span / cycle) : 1);
  }
  return total;
}

/** 一组环的包围盒对角线长度，即图案线要横跨的最大距离 */
function loopsSpan(loops: readonly (readonly DwgPoint[])[]): number {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const loop of loops) {
    for (const p of loop) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
  }
  if (!Number.isFinite(minX) || !Number.isFinite(minY)) return 0;
  return Math.hypot(maxX - minX, maxY - minY);
}

/**
 * 图案填充展开成线段（FR-23.3）。
 *
 * `explodePattern()` 给的是 `Line` 实体，坐标在填充自身所在的坐标系里，
 * 还得再过一遍块变换 `m` 才是世界坐标。
 *
 * 展开结果还要按边界环裁一遍（FR-30.2）：实测 `大堂平面图.dwg` 模型空间
 * 2984 个图案填充里有 56 个的线段跑出了自己的全部边界环，最狠的一个边界
 * 6.839e3 × 2.042e5，线段却铺满 4.082e5 见方（59.7 倍），6271 段裁完只剩 467 段。
 */
function patternSegments(
  entity: Hatch,
  m: Matrix,
  loops: readonly (readonly DwgPoint[])[]
): readonly number[] | 'too-dense' | undefined {
  // 先验预算：挡在展开之前（FR-28.1）
  if (patternSegmentEstimate([...(entity.pattern?.lines ?? [])], loopsSpan(loops)) > PATTERN_ESTIMATE_LIMIT)
    return 'too-dense';
  let lines: Entity[];
  try {
    lines = entity.explodePattern();
  } catch {
    return undefined;
  }
  if (lines.length === 0) return undefined;
  // 后验限额兜住估算偏乐观的漏网之鱼
  if (lines.length > PATTERN_SEGMENT_LIMIT) return 'too-dense';
  const raw: number[] = [];
  for (const line of lines) {
    if (!(line instanceof Line)) continue;
    raw.push(line.startPoint.x, line.startPoint.y, line.endPoint.x, line.endPoint.y);
  }
  // 裁剪与边界在同一个坐标系里做，裁完再过块变换
  const out: number[] = [];
  const clipped = clipSegmentsToLoops(raw, loops);
  for (let i = 0; i + 3 < clipped.length; i += 4) {
    const a = apply(m, clipped[i]!, clipped[i + 1]!);
    const b = apply(m, clipped[i + 2]!, clipped[i + 3]!);
    out.push(a.x, a.y, b.x, b.y);
  }
  return out.length > 0 ? out : undefined;
}

/** 点是否落在这组环里（奇偶规则，射线法）。带岛的填充靠奇偶才不会把天井填实 */
function insideLoops(loops: readonly (readonly DwgPoint[])[], x: number, y: number): boolean {
  let inside = false;
  for (const loop of loops) {
    for (let i = 0, j = loop.length - 1; i < loop.length; j = i++) {
      const a = loop[j]!;
      const b = loop[i]!;
      if (a.y > y !== b.y > y && x < a.x + ((y - a.y) / (b.y - a.y)) * (b.x - a.x)) inside = !inside;
    }
  }
  return inside;
}

/**
 * 把线段裁到这组环围出的区域里（0.22.0 分册 30 FR-30.2）。
 *
 * `segments` 与返回值都是四个一组的 `x1,y1,x2,y2`。环取不到时原样返回——
 * 没有边界就没有「内外」，这时丢弃等于把整个填充删掉，比不裁更糟。
 *
 * 内外不用端点判定，而是取**最长的一截**测一次再按交点奇偶向两边推：
 * 上游已经裁好的填充，端点正好躺在边界线上，拿端点测会把整段误判成外面。
 */
export function clipSegmentsToLoops(segments: readonly number[], loops: readonly (readonly DwgPoint[])[]): number[] {
  if (loops.length === 0) return [...segments];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const loop of loops)
    for (const p of loop) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
  if (!Number.isFinite(minX) || !Number.isFinite(minY)) return [...segments];

  const out: number[] = [];
  const cuts: number[] = [];
  for (let i = 0; i + 3 < segments.length; i += 4) {
    const x1 = segments[i]!;
    const y1 = segments[i + 1]!;
    const dx = segments[i + 2]! - x1;
    const dy = segments[i + 3]! - y1;
    if (Math.max(x1, x1 + dx) < minX || Math.min(x1, x1 + dx) > maxX) continue;
    if (Math.max(y1, y1 + dy) < minY || Math.min(y1, y1 + dy) > maxY) continue;

    cuts.length = 0;
    for (const loop of loops)
      for (let k = 0, j = loop.length - 1; k < loop.length; j = k++) {
        const a = loop[j]!;
        const b = loop[k]!;
        const ex = b.x - a.x;
        const ey = b.y - a.y;
        const den = dx * ey - dy * ex;
        if (den === 0) continue;
        const t = ((a.x - x1) * ey - (a.y - y1) * ex) / den;
        const u = ((a.x - x1) * dy - (a.y - y1) * dx) / den;
        if (t > 0 && t < 1 && u >= 0 && u <= 1) cuts.push(t);
      }
    cuts.sort((p, q) => p - q);
    const stops = [0, ...cuts, 1];

    // 最长的一截离边界最远，拿它定内外最不容易被浮点噪声翻掉
    let widest = 0;
    for (let k = 1; k < stops.length; k++)
      if (stops[k]! - stops[k - 1]! > stops[widest + 1]! - stops[widest]!) widest = k - 1;
    const mid = (stops[widest]! + stops[widest + 1]!) / 2;
    let state = insideLoops(loops, x1 + dx * mid, y1 + dy * mid);
    // 从那一截向前推出第一截的内外：每越过一个交点翻一次
    if (widest % 2 === 1) state = !state;

    let runStart: number | undefined;
    for (let k = 0; k + 1 < stops.length; k++) {
      const inside = k % 2 === 0 ? state : !state;
      if (inside) runStart ??= stops[k]!;
      else if (runStart !== undefined) {
        out.push(x1 + dx * runStart, y1 + dy * runStart, x1 + dx * stops[k]!, y1 + dy * stops[k]!);
        runStart = undefined;
      }
    }
    if (runStart !== undefined && runStart < 1) out.push(x1 + dx * runStart, y1 + dy * runStart, x1 + dx, y1 + dy);
  }
  return out;
}

/**
 * 遮罩（WIPEOUT）的世界坐标边界。
 *
 * 顶点是相对 `[-0.5, 0.5]` 的归一化坐标，要经 `insertPoint + u·(x+0.5) + v·(y+0.5)` 还原。
 * 两个顶点表示的是矩形对角，展开成四角——否则填出来是一条线。
 */
export function wipeoutLoop(entity: {
  insertPoint: DwgPoint;
  uVector: DwgPoint;
  vVector: DwgPoint;
  clipBoundaryVertices?: readonly DwgPoint[];
}): DwgPoint[] {
  const origin = entity.insertPoint;
  const u = entity.uVector;
  const v = entity.vVector;
  const raw = [...(entity.clipBoundaryVertices ?? [])].map((p) => ({ x: p.x, y: p.y }));
  const corners =
    raw.length === 2 ? [raw[0]!, { x: raw[1]!.x, y: raw[0]!.y }, raw[1]!, { x: raw[0]!.x, y: raw[1]!.y }] : raw;
  return corners.map((p) => ({
    x: origin.x + u.x * (p.x + 0.5) + v.x * (p.y + 0.5),
    y: origin.y + u.y * (p.x + 0.5) + v.y * (p.y + 0.5)
  }));
}

/**
 * 判断一个视口是不是「整页视口」——即 1:1 显示图纸自身、不该当成窗口画的那一个。
 *
 * **不能用 acad-ts 的 `representsPaper`**：实测 `大堂立面图.dwg` 里它把 id=1 标成了
 * true，而那个视口恰恰带着一个 50:1 的立面窗口，照它排会丢掉一个立面（分册 23 §2.2）。
 * 可靠的判据是几何：视图中心与视口中心重合，且视图高度等于视口高度。
 */
export function isPaperViewport(viewport: {
  center: DwgPoint;
  width: number;
  height: number;
  viewCenter: DwgPoint;
  viewHeight: number;
}): boolean {
  const w = Math.max(Math.abs(viewport.width), 1e-9);
  const h = Math.max(Math.abs(viewport.height), 1e-9);
  return (
    Math.abs(viewport.viewHeight - viewport.height) < h * 1e-3 &&
    Math.abs(viewport.viewCenter.x - viewport.center.x) < w * 1e-3 &&
    Math.abs(viewport.viewCenter.y - viewport.center.y) < h * 1e-3
  );
}

interface Collector {
  readonly entities: DwgEntity[];
  /** 展开块的同时另收的一份「物件」清单（分册 37 FR-37.1），不参与渲染 */
  readonly components: DwgComponent[];
  /** kind → severity → 计数。同一类实体可能既有丢弃也有降级，两者不能互相覆盖 */
  readonly omissions: Map<string, Map<DwgOmission['severity'], number>>;
  readonly layerColors: Map<string, string>;
  readonly layerDashes: LayerDashes;
  readonly layerWeights: LayerWeights;
  /** 图头的 LTSCALE：全图的线型段长都要乘它 */
  readonly lineTypeScale: number;
  readonly viewports: DwgViewport[];
}

function report(collector: Collector, kind: string, severity: DwgOmission['severity']): void {
  let bucket = collector.omissions.get(kind);
  if (!bucket) {
    bucket = new Map();
    collector.omissions.set(kind, bucket);
  }
  bucket.set(severity, (bucket.get(severity) ?? 0) + 1);
}

function omit(collector: Collector, kind: string): void {
  report(collector, kind, 'dropped');
}

/**
 * 文字的真实定位点。
 *
 * DXF 语义：对齐方式一旦不是「左对齐 + 基线」，组码 10（`insertPoint`）就作废，
 * 真实位置在组码 11（`alignmentPoint`）。实测 `2D.dwg` 里有 17 个 ATTRIB 的
 * `insertPoint` 是量级 1e7 的垃圾值，按它定位会把整张图的包围盒撑大 400 倍。
 */
function textAnchor(entity: TextEntity): { readonly x: number; readonly y: number } {
  const aligned =
    entity.horizontalAlignment !== TextHorizontalAlignment.Left ||
    entity.verticalAlignment !== TextVerticalAlignmentType.Baseline;
  return aligned ? entity.alignmentPoint : entity.insertPoint;
}

/** 文字锚点的语义：`at` 这个点落在文字的哪个位置（FR-25.1） */
export interface TextAnchorKind {
  readonly anchorX: 'left' | 'center' | 'right';
  readonly anchorY: 'top' | 'middle' | 'baseline' | 'bottom';
}

/**
 * MTEXT 的 `attachmentPoint`（DXF 组码 71，取值 1..9）→ 锚点语义。
 *
 * 下标即组码值，`0` 位空出来占位。实测 `大堂立面图.dwg` 的 178 个 MTEXT 里
 * 96 个是 `5`（正中）、82 个是 `1`（左上）——**没有一个是左基线**，
 * 所以按默认值画等于 96 个文字整体偏出半个字高加半个字宽。
 */
const MTEXT_ANCHORS: readonly (TextAnchorKind | undefined)[] = [
  undefined,
  { anchorX: 'left', anchorY: 'top' },
  { anchorX: 'center', anchorY: 'top' },
  { anchorX: 'right', anchorY: 'top' },
  { anchorX: 'left', anchorY: 'middle' },
  { anchorX: 'center', anchorY: 'middle' },
  { anchorX: 'right', anchorY: 'middle' },
  { anchorX: 'left', anchorY: 'bottom' },
  { anchorX: 'center', anchorY: 'bottom' },
  { anchorX: 'right', anchorY: 'bottom' }
];

/** 取不到有效对齐信息时的退让：与分册 24 的既有行为一致 */
const DEFAULT_ANCHOR: TextAnchorKind = { anchorX: 'left', anchorY: 'baseline' };

export function mtextAnchor(attachmentPoint: number | undefined): TextAnchorKind {
  return (attachmentPoint === undefined ? undefined : MTEXT_ANCHORS[attachmentPoint]) ?? DEFAULT_ANCHOR;
}

/**
 * 单行 TEXT / ATTRIB 的对齐（组码 72 / 73）→ 锚点语义。
 *
 * `Middle`(4) 是「正中」：它既定横向居中，也定纵向居中，此时组码 73 不起作用。
 * `Aligned`(3) 与 `Fit`(5) 是两点定宽，横向按居中处理最接近，纵向留给组码 73。
 */
export function singleLineAnchor(horizontal: number | undefined, vertical: number | undefined): TextAnchorKind {
  if (horizontal === TextHorizontalAlignment.Middle) return { anchorX: 'center', anchorY: 'middle' };
  const anchorX =
    horizontal === TextHorizontalAlignment.Center ||
    horizontal === TextHorizontalAlignment.Aligned ||
    horizontal === TextHorizontalAlignment.Fit
      ? 'center'
      : horizontal === TextHorizontalAlignment.Right
        ? 'right'
        : 'left';
  const anchorY =
    vertical === TextVerticalAlignmentType.Top
      ? 'top'
      : vertical === TextVerticalAlignmentType.Middle
        ? 'middle'
        : vertical === TextVerticalAlignmentType.Bottom
          ? 'bottom'
          : 'baseline';
  return { anchorX, anchorY };
}

/**
 * 属性标志位里 `Hidden` 置位的 ATTRIB，AutoCAD 和官方 Viewer 都不画（FR-26.3）。
 *
 * 注意别和实体级的 `isInvisible`（组码 60）混为一谈：`2D.dwg` 里那 5 条字高
 * 4000~6250、内容为 `"1"` 的属性，`isInvisible` 全是 `false`，靠的就是这个标志位。
 */
export function isHiddenAttribute(attribute: { readonly flags: number }): boolean {
  return (attribute.flags & AttributeFlags.Hidden) !== 0;
}

/**
 * 这条属性该不该画。属性有**两套互不相干**的隐藏机制：
 * 组码 70 的 bit0（分册 26）与组码 60 的 `isInvisible`（FR-27.3），任一成立都不画。
 *
 * 实测 `2D.dwg` 的图框标题栏每张图纸有 7 条同位置属性（全部 `@(1136.3, 22.1)`），
 * 其中 6 条 `isInvisible=true`、`flags=0`——只查 bit0 的话七种图名会叠在一个点上。
 * 全库这样的属性有 30 条。
 */
export function isPaintedAttribute(attribute: { readonly flags: number; readonly isInvisible?: boolean }): boolean {
  return !isHiddenAttribute(attribute) && attribute.isInvisible !== true;
}

/**
 * 视口在模型空间里真正看到的中心（FR-26.2）。
 *
 * 组码 12 的 `viewCenter` 量在 DCS 里，组码 17 的 `viewTarget` 才把 DCS 原点
 * 钉到 WCS 上，只取前者会把取景框甩到空无一物的坐标去。实测 `2D.dwg` 五张图纸
 * 里有四张的 `viewTarget` 非零，它们的视口因此全是空的；唯一画得出来的 P-11
 * 恰好 `viewTarget` 为零，是蒙对的。
 */
export function viewportViewCenter(viewport: {
  readonly viewCenter: { readonly x: number; readonly y: number };
  readonly viewTarget?: { readonly x: number; readonly y: number } | null;
}): DwgPoint {
  return {
    x: viewport.viewCenter.x + (viewport.viewTarget?.x ?? 0),
    y: viewport.viewCenter.y + (viewport.viewTarget?.y ?? 0)
  };
}

/**
 * `plainText` 漏下的 MTEXT 格式码残留（FR-25.5）。
 *
 * acad-ts 处理 `\W0.8;`（宽度因子）、`\T0.8;`（字间距）这类码时把反斜杠吃掉了，
 * **参数却留在正文里**。实测 `大堂立面图.dwg` 残留 4 处，其中
 * `生产项目（\W.8;G组团）` 被读成 `W.8;G`，工程编号「G组团」在界面上被拆散。
 *
 * 只剥**前缀**，是刻意的保守：一旦反斜杠没了，正文中间的
 * 「字母 + 数字 + 分号」就与格式码残留完全同形，无从分辨。实测 4 处全在开头，
 * 剥前缀足以收敛，且对正文零误伤。反例护栏见 test/dwgText.test.ts。
 */
const FORMAT_CODE_PREFIX = /^[ACFHQTWacfhqtw][\d.]*[xX]?;/;

export function stripFormatCodes(text: string): string {
  let out = text;
  // 实测 `W0.8;T0.8;深圳市…` 连着两个，要反复剥
  while (FORMAT_CODE_PREFIX.test(out)) out = out.replace(FORMAT_CODE_PREFIX, '');
  // 全是格式码时不能剥成空串——那会让这条文字整个消失
  return out.length > 0 ? out : text;
}

/** 单字母控制码到字符的映射（小写键） */
const CONTROL_CODE_CHARS: Readonly<Record<string, string>> = {
  c: '\u2300', // ⌀ 直径
  d: '\u00b0', // ° 度
  p: '\u00b1' // ± 正负
};

/**
 * AutoCAD 的传统控制码（FR-29.3）。
 *
 * `stripFormatCodes` 只管 MTEXT 的花括号格式码，`%%` 这一家从来没人管，
 * 于是原样画上画布。实测 `大堂平面图.dwg`：`%%C` 34 处、`%%P` 8 处、`%%%` 1 处，
 * 原厂显示 `穿梁套管⌀110`，我们显示 `穿梁套管%%C110`。
 *
 * `%%nnn` 的三位十进制优先于单字母，与 AutoCAD 一致；`%%U` / `%%O` 是下划线 /
 * 上划线开关，本版不画划线，只把开关剥掉。认不出来的码原样保留——
 * 宁可显示得难看，不能把正文吃掉。
 */
export function decodeControlCodes(text: string): string {
  if (!text.includes('%%')) return text;
  const out = text.replace(/%%(\d{3}|[\s\S])/g, (whole: string, code: string) => {
    if (/^\d{3}$/.test(code)) {
      const point = Number(code);
      return point > 0 && point <= 0xffff ? String.fromCharCode(point) : whole;
    }
    const lower = code.toLowerCase();
    if (lower === 'u' || lower === 'o') return '';
    if (lower === '%') return '%';
    return CONTROL_CODE_CHARS[lower] ?? whole;
  });
  // 与 `stripFormatCodes` 同一约定：剥成空串就不剥
  return out.length > 0 ? out : text;
}

interface WidthVertex {
  readonly point: DwgPoint;
  readonly bulge: number;
  readonly startWidth: number;
  readonly endWidth: number;
}

/**
 * 带宽度的顶点序列 → 铺满宽度的四边形环 + 转角接头。
 *
 * 每一小段各出一个四边形，转角处相邻两个四边形会互相重叠。
 * 这些环是一个并集，不是带岛的区域，因此要按非零环绕填（见 `wideFill`）。
 * 分册 27 曾判定这块重叠「不到一个像素」，实测是错的：穿梁套管红框在常规
 * 缩放下一行被奇偶规则切成 `5 / 9 / 5` 三截，缺口 3~4 px。
 *
 * 分册 28 的非零环绕只解决了转角**内侧**的异或洞，**外侧**还缺一块
 * `w/2 × w/2` 的正方形没人覆盖——实测穿梁套管红框左上角 5×4 px 全空，四角同形。
 * 因此每个接缝再补一个斜接楔形（FR-29.2）。
 *
 * 宽度跟着变换走：四个角点都是先在本地坐标里偏移再变换，
 * 非均匀缩放下得到的不是原宽度的等比平移。
 */
export function widePolylineLoops(vertices: readonly WidthVertex[], closed: boolean, m: Matrix): DwgPoint[][] {
  if (vertices.length < 2) return [];
  // 宽度为 0 的段会把带面打断，接头只能补在**连续**的两段之间
  const runs: WideSegment[][] = [];
  let run: WideSegment[] = [];
  const last = closed ? vertices.length : vertices.length - 1;
  for (let i = 0; i < last; i++) {
    const from = vertices[i]!;
    const to = vertices[(i + 1) % vertices.length]!;
    if (from.startWidth <= 0 && from.endWidth <= 0) {
      if (run.length > 0) runs.push(run);
      run = [];
      continue;
    }
    const path =
      from.bulge !== 0 ? [from.point, ...bulgeArcPoints(from.point, to.point, from.bulge)] : [from.point, to.point];
    const total = path.length - 1;
    for (let k = 0; k < total; k++) {
      const a = path[k]!;
      const b = path[k + 1]!;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      if (len < 1e-9) continue;
      run.push({
        a,
        b,
        nx: -dy / len,
        ny: dx / len,
        wa: (from.startWidth + ((from.endWidth - from.startWidth) * k) / total) / 2,
        wb: (from.startWidth + ((from.endWidth - from.startWidth) * (k + 1)) / total) / 2
      });
    }
  }
  if (run.length > 0) runs.push(run);
  // 闭合多段线的第一段若被宽度 0 打断过，首尾会落进两个 run，闭合处的接头就补不上了
  if (closed && runs.length > 1) {
    const head = runs[0]!;
    const tail = runs[runs.length - 1]!;
    if (samePoint(tail[tail.length - 1]!.b, head[0]!.a)) {
      runs[0] = [...tail, ...head];
      runs.pop();
    }
  }

  const loops: DwgPoint[][] = [];
  for (const chain of runs) {
    for (const s of chain) {
      loops.push([
        { x: s.a.x + s.nx * s.wa, y: s.a.y + s.ny * s.wa },
        { x: s.b.x + s.nx * s.wb, y: s.b.y + s.ny * s.wb },
        { x: s.b.x - s.nx * s.wb, y: s.b.y - s.ny * s.wb },
        { x: s.a.x - s.nx * s.wa, y: s.a.y - s.ny * s.wa }
      ]);
    }
    // 成环时最后一段与第一段之间也有一个接缝——红框的第四个角就在这里
    const ring = chain.length > 2 && samePoint(chain[chain.length - 1]!.b, chain[0]!.a);
    const seams = chain.length - 1 + (ring ? 1 : 0);
    for (let j = 0; j < seams; j++) {
      const joint = mitreJoint(chain[j]!, chain[(j + 1) % chain.length]!);
      if (joint) loops.push(joint);
    }
  }
  // 非零环绕下绕向必须统一，否则反向的环会把重叠区减掉（FR-29.2 / FR-28.4）
  return loops.map((loop) => counterClockwise(loop.map((p) => apply(m, p.x, p.y))));
}

interface WideSegment {
  readonly a: DwgPoint;
  readonly b: DwgPoint;
  /** 左法向（把方向逆时针转 90°），单位长度 */
  readonly nx: number;
  readonly ny: number;
  /** 两端的半宽 */
  readonly wa: number;
  readonly wb: number;
}

/** 斜接上限：超过它就退化成斜切，与 SVG `stroke-miterlimit` 的默认值同量级 */
const MITRE_LIMIT = 4;

function samePoint(a: DwgPoint, b: DwgPoint): boolean {
  return Math.abs(a.x - b.x) < 1e-9 && Math.abs(a.y - b.y) < 1e-9;
}

/**
 * 两段带面之间的接头楔形（FR-29.2）。
 *
 * 缺口只在**外侧**：左转时右侧是凸的、右侧留空，反之亦然。内侧本来就重叠，
 * 再补一块只会多画。楔形的顶点是两条偏移线的交点，也就是斜接点
 * `M = P + (w/2)(n₁+n₂)/(1+n₁·n₂)` 的等价写法——用交点算是为了两端半宽不等时也成立。
 */
function mitreJoint(prev: WideSegment, next: WideSegment): DwgPoint[] | undefined {
  const w1 = prev.wb;
  const w2 = next.wa;
  if (!(w1 > 0) && !(w2 > 0)) return undefined;
  const d1 = { x: prev.b.x - prev.a.x, y: prev.b.y - prev.a.y };
  const d2 = { x: next.b.x - next.a.x, y: next.b.y - next.a.y };
  const cross = d1.x * d2.y - d1.y * d2.x;
  const scale = Math.hypot(d1.x, d1.y) * Math.hypot(d2.x, d2.y);
  // 共线就没有缺口
  if (!(scale > 0) || Math.abs(cross / scale) < 1e-9) return undefined;
  const p = prev.b;
  const side = cross > 0 ? -1 : 1;
  const o1 = { x: p.x + side * prev.nx * w1, y: p.y + side * prev.ny * w1 };
  const o2 = { x: p.x + side * next.nx * w2, y: p.y + side * next.ny * w2 };
  const t = ((o2.x - o1.x) * d2.y - (o2.y - o1.y) * d2.x) / cross;
  const tip = { x: o1.x + t * d1.x, y: o1.y + t * d1.y };
  const reach = Math.hypot(tip.x - p.x, tip.y - p.y);
  // 近 180° 折返时斜接点跑向无穷，退化成斜切
  return Number.isFinite(reach) && reach <= MITRE_LIMIT * Math.max(w1, w2) ? [p, o1, tip, o2] : [p, o1, o2];
}

/** 统一成逆时针；镜像变换会翻转绕向，所以要在变换**之后**判 */
function counterClockwise(loop: DwgPoint[]): DwgPoint[] {
  let twice = 0;
  for (let i = 0; i < loop.length; i++) {
    const a = loop[i]!;
    const b = loop[(i + 1) % loop.length]!;
    twice += a.x * b.y - b.x * a.y;
  }
  return twice < 0 ? [...loop].reverse() : loop;
}

function widthVerticesOf(entity: Entity): { vertices: WidthVertex[]; closed: boolean } | undefined {
  // LwPolyline 的顶点是结构体，Polyline2D 的是 SeqendCollection<Entity>，
  // 两边没有共同的静态类型，所以统一按 unknown 收，逐条窄化
  const read = (raw: Iterable<unknown>, fallback: number, only2d: boolean): WidthVertex[] => {
    const out: WidthVertex[] = [];
    for (const item of raw) {
      if (only2d && !(item instanceof Vertex2D)) continue;
      const v = item as { location?: DwgPoint; bulge?: number; startWidth?: number; endWidth?: number };
      const location = v.location;
      if (!location) continue;
      out.push({
        point: { x: location.x, y: location.y },
        bulge: v.bulge ?? 0,
        // 顶点宽度为 0 时用实体级的固定宽度：DXF 里 0 就是「没写」
        startWidth: v.startWidth || fallback,
        endWidth: v.endWidth || fallback
      });
    }
    return out;
  };
  if (entity instanceof LwPolyline) {
    return { vertices: read(entity.vertices, entity.constantWidth ?? 0, false), closed: entity.isClosed };
  }
  if (entity instanceof Polyline2D) {
    const wide = entity as unknown as { defaultStartWidth?: number; defaultEndWidth?: number };
    const fallback = wide.defaultStartWidth || wide.defaultEndWidth || 0;
    return { vertices: read(entity.vertices, fallback, true), closed: entity.isClosed };
  }
  return undefined;
}

/**
 * 多段线的宽度（组码 43 / 40 / 41）铺成面。
 *
 * 这个宽度是**图形尺寸**，随缩放变化，和分册 25 的打印线宽 `lineWeight`
 * （0.01 mm，与缩放无关）不是一回事，两者都要有。实测 `2D.dwg` 的 2243 条
 * LwPolyline 里 808 条带宽度；AutoCAD 画箭头用的正是「起点宽、终点 0」的一段，
 * 全文档只有 6 条二维 `Solid`，撑不起图例里的那些箭头（FR-27.5）。
 *
 * 每一小段各出一个四边形，转角处两个四边形会互相重叠。这些环是一个**并集**，
 * 因此标成 `nonzero`（FR-28.4）——分册 27 曾按奇偶规则填，重叠被异或成洞：
 * 实测穿梁套管红框的转角一行被切成 `5 / 9 / 5` 三截，看上去像三个方框嵌套。
 * 用环绕规则表达并集，比去求偏移线的交点便宜得多，效果也一样。
 */
function wideFill(entity: Entity, m: Matrix): DwgFill | undefined {
  const read = widthVerticesOf(entity);
  if (!read || read.vertices.length < 2) return undefined;
  if (!read.vertices.some((v) => v.startWidth > 0 || v.endWidth > 0)) return undefined;
  const loops = widePolylineLoops(read.vertices, read.closed, m);
  return loops.length > 0 ? { kind: 'solid', loops, rule: 'nonzero' } : undefined;
}

/**
 * 文字样式里指定的字体（FR-28.5）。
 *
 * 拉丁字体与 CJK 大字体是**两个独立的槽**，可以指向不同的字体
 * （实测 `2D.dwg` 的 `TH-STYLE2` 是 `th-rmc` + `th-chnc`），因此不能合并成一个字段。
 * 样式表里有相当一部分条目的 `filename` 是空串（如样式名叫「宋体」的那个），
 * 空串不产出字段，交给渲染端回落。
 */
export function fontOf(entity: {
  readonly style?: {
    readonly filename?: string | null;
    readonly bigFontFilename?: string | null;
    readonly width?: number | null;
  } | null;
}): { font?: DwgFont } {
  const style = entity.style;
  if (!style) return {};
  const file = style.filename?.trim();
  const bigFile = style.bigFontFilename?.trim();
  const widthFactor = style.width;
  const font: DwgFont = {
    ...(file ? { file } : {}),
    ...(bigFile ? { bigFile } : {}),
    ...(typeof widthFactor === 'number' && Number.isFinite(widthFactor) && widthFactor > 0 && widthFactor !== 1
      ? { widthFactor }
      : {})
  };
  return Object.keys(font).length > 0 ? { font } : {};
}

/** 把一个实体变成几何；返回 `undefined` 表示这个实体不产出可绘制几何 */
export function geometryOf(entity: Entity, m: Matrix, heightOverride?: number): DwgGeometry | undefined {
  if (entity instanceof Line) {
    return {
      kind: 'polyline',
      points: [apply(m, entity.startPoint.x, entity.startPoint.y), apply(m, entity.endPoint.x, entity.endPoint.y)],
      closed: false
    };
  }
  // Arc 必须判在 Circle 前面：acad-ts 里 `Arc extends Circle`，
  // 反过来写的话 Arc 分支永远执行不到，每一条圆弧都会画成整圆（起止角被丢掉）。
  // 这类错误 TypeScript 查不出来——两个分支的返回值都合法。护栏见 test/dwgFidelity.test.ts
  if (entity instanceof Arc) {
    if (!isConformal(m)) {
      const r = entity.radius;
      return {
        kind: 'polyline',
        points: sampleArc(m, entity.center.x, entity.center.y, r, 0, 1, entity.startAngle, entity.endAngle),
        closed: false
      };
    }
    const turn = rotationOf(m);
    const mirrored = isMirrored(m);
    return {
      kind: 'arc',
      center: apply(m, entity.center.x, entity.center.y),
      radius: entity.radius * scaleOf(m),
      startAngle: mirrored ? turn - entity.endAngle : entity.startAngle + turn,
      endAngle: mirrored ? turn - entity.startAngle : entity.endAngle + turn
    };
  }
  if (entity instanceof Circle) {
    if (!isConformal(m)) {
      const r = entity.radius;
      return {
        kind: 'polyline',
        points: sampleArc(m, entity.center.x, entity.center.y, r, 0, 1, 0, Math.PI * 2),
        closed: true
      };
    }
    return { kind: 'circle', center: apply(m, entity.center.x, entity.center.y), radius: entity.radius * scaleOf(m) };
  }
  if (entity instanceof Ellipse) {
    const major = entity.majorAxisEndPoint;
    if (!isConformal(m)) {
      return {
        kind: 'polyline',
        points: sampleArc(
          m,
          entity.center.x,
          entity.center.y,
          major.x,
          major.y,
          entity.radiusRatio,
          entity.startParameter,
          entity.endParameter
        ),
        closed: entity.isFullEllipse
      };
    }
    const centre = apply(m, entity.center.x, entity.center.y);
    // 长轴是**向量**，只受线性部分影响，不能带上平移
    const tip = apply(m, entity.center.x + major.x, entity.center.y + major.y);
    // 短轴按「长轴逆时针转 90°」约定，翻手变换下它落到另一侧 ⇒ 参数取反、起止对调
    const mirrored = isMirrored(m);
    return {
      kind: 'ellipse',
      center: centre,
      majorAxis: { x: tip.x - centre.x, y: tip.y - centre.y },
      ratio: entity.radiusRatio,
      startAngle: mirrored ? -entity.endParameter : entity.startParameter,
      endAngle: mirrored ? -entity.startParameter : entity.endParameter
    };
  }
  if (entity instanceof LwPolyline) {
    return {
      kind: 'polyline',
      points: flattenVertices(readLwPolylineVertices(entity), entity.isClosed, m),
      closed: entity.isClosed
    };
  }
  if (entity instanceof Polyline2D) {
    return {
      kind: 'polyline',
      points: flattenVertices(readPolyline2DVertices(entity), entity.isClosed, m),
      closed: entity.isClosed
    };
  }
  if (entity instanceof Solid) {
    // 二维填充四边形。DWG 的顶点顺序是 Z 字形，画之前要换成环绕序
    const pts = [entity.firstCorner, entity.secondCorner, entity.fourthCorner, entity.thirdCorner];
    return { kind: 'polyline', points: pts.map((p) => apply(m, p.x, p.y)), closed: true };
  }
  if (entity instanceof Spline) {
    return { kind: 'polyline', points: splinePoints(entity, m), closed: entity.isClosed === true };
  }
  if (entity instanceof Point) {
    return { kind: 'point', at: apply(m, entity.location.x, entity.location.y) };
  }
  if (entity instanceof Leader) {
    return { kind: 'polyline', points: entity.vertices.map((v) => apply(m, v.x, v.y)), closed: false };
  }
  if (entity instanceof MText) {
    // `plainText` 已经剥掉了 `{\fSimSun|b0|i0|c134|p2;餐厅}` 这类格式码（FR-19.4），
    // 但 `\W0.8;` 一类的参数会漏下来，要再过一道（FR-25.5），
    // 最后再解 `%%C` 这类传统控制码（FR-29.3）
    const text = decodeControlCodes(stripFormatCodes(entity.plainText));
    if (text.length === 0) return undefined;
    const wrap = entity.rectangleWidth * scaleOf(m);
    return {
      kind: 'text',
      at: apply(m, entity.insertPoint.x, entity.insertPoint.y),
      text,
      height: entity.height * scaleOf(m),
      rotation: entity.rotation + rotationOf(m),
      ...mtextAnchor(entity.attachmentPoint),
      ...fontOf(entity),
      ...(Number.isFinite(wrap) && wrap > 0 ? { wrapWidth: wrap } : {})
    };
  }
  if (entity instanceof TextEntity) {
    // 注：`AttributeEntity` 也是 `TextEntity`，走的就是这一支。
    // 空文本不产出几何：实测 `2D.dwg` 有 7 个空属性（`value=""`、`height=59500`）
    // 占着 1e7 量级的坐标，画不出东西，却把包围盒撑大了两个数量级
    const text = decodeControlCodes(entity.value);
    if (text.length === 0) return undefined;
    const anchor = textAnchor(entity);
    return {
      kind: 'text',
      at: apply(m, anchor.x, anchor.y),
      text,
      // 属性的字高另有来源（FR-30.1），其余文字仍用自己的
      height: (heightOverride ?? entity.height) * scaleOf(m),
      rotation: entity.rotation + rotationOf(m),
      // `textAnchor()` 算的是锚点在哪，这里补的是锚点是什么意思（FR-25.1）
      ...singleLineAnchor(entity.horizontalAlignment, entity.verticalAlignment),
      ...fontOf(entity)
    };
  }
  return undefined;
}

/**
 * AutoCAD 的「随块」图层：块定义里画在 `0` 层的实体，插入后显示在**块引用所在的图层**上。
 * 块能一次定义、按图层复用，靠的就是这条规则。
 *
 * 照字面取 `entity.layer.name` 会把它们全归到 `0`——实测 `2D.dwg` 的 8043 条实体里
 * 有 4354 条因此落进 `0`，超过一半。后果不止是报表难看：图层开关关不掉插座、
 * 三维分册把所有块内容压进同一层平面、按图层的差异汇总全部记在 `0` 名下。
 */
const DEFAULT_LAYER = '0';

function layerNameOf(entity: Entity, inherited: string): string {
  const own = entity.layer.name;
  return own === DEFAULT_LAYER ? inherited : own;
}

/**
 * 这个实体的坐标是不是写在对象坐标系里。
 *
 * DXF 规范逐类型规定：`CIRCLE` / `ARC` / `LWPOLYLINE` / `POLYLINE`(2D) / `SOLID` /
 * `TEXT` / `ATTRIB` / `MTEXT` / `INSERT` / `HATCH` 用 OCS，而 `LINE` / `POINT` /
 * `ELLIPSE` / `SPLINE` / `LEADER` 的坐标本来就是 WCS。对后者套 OCS 变换会把它们镜像错。
 *
 * 块内容跟着宿主 `INSERT` 走：块定义里的坐标是局部 WCS，整块由 `INSERT` 的法向定向。
 */
function usesObjectCoordinates(entity: Entity): boolean {
  return (
    entity instanceof Circle ||
    entity instanceof LwPolyline ||
    entity instanceof Polyline2D ||
    entity instanceof Solid ||
    entity instanceof TextEntity ||
    entity instanceof MText ||
    entity instanceof Insert ||
    entity instanceof Hatch
  );
}

/** 把实体的 OCS 压平后接到父变换上；非 OCS 实体原样返回父变换 */
function objectMatrix(entity: Entity, m: Matrix): Matrix {
  if (!usesObjectCoordinates(entity)) return m;
  const normal = (entity as { normal?: { x: number; y: number; z: number } }).normal;
  const ocs = ocsMatrix(normal);
  return ocs === IDENTITY ? m : compose(m, ocs);
}

/**
 * 记一条实体。
 *
 * `prefix` 是块实例路径（`1F2A/` 或嵌套的 `1F2A/3B01/`）。**块定义里的实体共用同一个句柄**，
 * 一个块被插入 N 次就会出现 N 个同句柄实体——实测 `2D.dwg` 有 874 个句柄重复，
 * 最多的一个重复 488 次。句柄是 diff 的主键，重复会让匹配彻底错乱，
 * 所以块内实体一律带实例路径前缀。顶层实体前缀为空，句柄保持原样。
 */
function push(
  collector: Collector,
  entity: Entity,
  prefix: string,
  geometry: DwgGeometry | undefined,
  inherited: string,
  extra?: Record<string, string>,
  fill?: DwgFill,
  inheritedWeight?: number,
  inheritedColor?: string
): void {
  const kind = entity.objectName;
  const layer = layerNameOf(entity, inherited);
  const handle = prefix + entity.handle.toString(16).toUpperCase();
  // ByBlock 取宿主块引用的颜色；那里也没有才轮到渲染端回落图层色（FR-27.6）
  const color = resolvedColor(entity, inheritedColor);
  // dash 只对线状几何有意义；给文字和点也带上只会白白撑大投放载荷
  const resolved =
    geometry && geometry.kind !== 'text' && geometry.kind !== 'point'
      ? dashOf(entity, layer, collector.layerDashes, collector.lineTypeScale)
      : undefined;
  if (resolved === 'unavailable') report(collector, LINETYPE_MISSING, 'degraded');
  const dash = resolved === 'unavailable' ? undefined : resolved;
  const lineWeight = lineWeightOf(entity, layer, collector.layerWeights, inheritedWeight);
  collector.entities.push({
    handle,
    kind,
    layer,
    geometry,
    ...(extra && Object.keys(extra).length > 0 ? { attributes: extra } : {}),
    ...(color ? { color } : {}),
    ...(dash ? { dash } : {}),
    ...(lineWeight !== undefined ? { lineWeight } : {}),
    ...(fill ? { fill } : {})
  });
}

/**
 * 块引用在构件清单里的名字；不算构件时给 `undefined`（FR-41.1 / FR-37.3）。
 *
 * 动态块的每个变体各存一份匿名定义（`*U12`、`*U13`），不回查源块
 * 同一扇门的两个开启角度就会散成两个「块名」，比出来全是假差异。
 * 回查之后剩下的 `*` 开头者是标注的 `*D`、模型/图纸空间本体这类机器造的块，
 * 它们不是图纸作者声明的物件。
 *
 * 判定**只看名字**，不问 `isAnonymous`：AutoCAD 给「插入/炸开外部块」造的
 * `A$C3F01247D` 也带着这个标志，可它在同源的两份图纸里连插入点都一样，
 * 正是要比的那种东西。该标志说的是「不是人取的名」，不是「名字不稳定」（FR-41.1）。
 */
function componentBlockName(record: Insert['block']): string | undefined {
  const origin = record?.source ?? record;
  const name = origin?.name;
  if (!name || name.startsWith('*')) return undefined;
  return name;
}

export { componentBlockName as dwgComponentBlockName };

/**
 * 展开块的同时另记一条构件（FR-37.1）。
 *
 * 坐标跟几何一样烘焙成世界坐标：嵌套块里的插入点要先过完外层变换，
 * 否则两份图纸拿的是各自块内坐标系的数，根本无法比。
 */
function collectComponent(
  collector: Collector,
  entity: Insert,
  m: Matrix,
  layer: string,
  attributes: Readonly<Record<string, string>>
): void {
  const block = componentBlockName(entity.block);
  if (block === undefined) return;
  const outer = scaleOf(m);
  collector.components.push({
    block,
    at: apply(m, entity.insertPoint.x, entity.insertPoint.y),
    rotation: entity.rotation + rotationOf(m),
    scaleX: entity.xScale * outer,
    scaleY: entity.yScale * outer,
    layer,
    ...(Object.keys(attributes).length > 0 ? { attributes } : {})
  });
}

/**
 * 递归走一层实体。`m` 是已经复合好的父变换，`prefix` 是块实例路径。
 *
 * 块引用与标注都在这里展开：它们自己**不**产出可绘制实体，产出的是块里的内容，
 * 坐标已经烘焙成世界坐标。这样 diff 与投放面都只面对扁平的一维实体表。
 */
function walk(
  collector: Collector,
  entities: Iterable<Entity>,
  m: Matrix,
  depth: number,
  prefix: string,
  inherited: string,
  /** 外层块引用解出的线宽，供块内 ByBlock 的实体回落（FR-25.3） */
  inheritedWeight?: number,
  /** 外层块引用解出的颜色，供块内 ByBlock 的实体回落（FR-27.6） */
  inheritedColor?: string
): void {
  for (const entity of entities) {
    if (entity.isInvisible) continue;

    // ATTDEF 是块**定义**里的属性模板（占位文字），不是图上的内容；
    // 它继承自 TextEntity，不显式排除就会被当成文字画出来（实测 cad.dwg 44 个）
    if (entity instanceof AttributeDefinition) continue;

    // 实体坐标系先压平成世界坐标，再套父变换（FR-27.1）
    const em = objectMatrix(entity, m);

    if (entity instanceof Insert) {
      const self = `${prefix}${entity.handle.toString(16).toUpperCase()}/`;
      // ATTRIB 是可见文字（如标高 `±0.000`），既要画出来也要进指纹
      const attributes: Record<string, string> = {};
      for (const attribute of entity.attributes) attributes[attribute.tag] = decodeControlCodes(attribute.value);

      const block = entity.block;
      const hostLayer = layerNameOf(entity, inherited);
      collectComponent(collector, entity, em, hostLayer, attributes);
      // 属性的字高要回块定义里查（FR-30.1）
      const definitionHeights = new Map<string, number>();
      for (const member of block?.entities ?? [])
        if (member instanceof AttributeDefinition) definitionHeights.set(member.tag, member.height);
      // 块引用自己先解一次，块里写着 ByBlock 的实体回落到这个值
      const ownWeight = lineWeightOf(entity, hostLayer, collector.layerWeights, inheritedWeight);
      const ownColor = entityColor(entity) ?? inheritedColor;
      if (depth < MAX_BLOCK_DEPTH && block) {
        const cos = Math.cos(entity.rotation);
        const sin = Math.sin(entity.rotation);
        const sx = entity.xScale;
        const sy = entity.yScale;
        const local: Matrix = [sx * cos, sx * sin, -sy * sin, sy * cos, entity.insertPoint.x, entity.insertPoint.y];
        walk(collector, block.entities, compose(em, local), depth + 1, self, hostLayer, ownWeight, ownColor);
      } else {
        omit(collector, 'INSERT');
      }
      for (const attribute of entity.attributes) {
        if (!isPaintedAttribute(attribute)) continue;
        // 图层跟定宿主 INSERT，不是宿主的外层（FR-27.2）
        push(
          collector,
          attribute,
          self,
          geometryOf(
            attribute,
            objectMatrix(attribute, m),
            attributeTextHeight(attribute, definitionHeights, entity.xScale)
          ),
          hostLayer,
          attributes,
          undefined,
          ownWeight,
          ownColor
        );
      }
      continue;
    }

    if (entity instanceof Dimension) {
      // 尺寸线、箭头、文字都在匿名块 `*D16` 里（实测 9 个实体）。
      // 标注本体不画，画它的块——否则图上只有空白
      const self = `${prefix}${entity.handle.toString(16).toUpperCase()}/`;
      const block = entity.block;
      if (depth < MAX_BLOCK_DEPTH && block) {
        walk(
          collector,
          block.entities,
          m,
          depth + 1,
          self,
          layerNameOf(entity, inherited),
          inheritedWeight,
          inheritedColor
        );
      }
      // 标注本体仍记一条：测量值改了但图形没动，也算一处差异
      push(
        collector,
        entity,
        prefix,
        undefined,
        inherited,
        { measurement: String(entity.measurement) },
        undefined,
        inheritedWeight,
        inheritedColor
      );
      continue;
    }

    if (entity instanceof Hatch) {
      const loops = hatchBoundaryPoints(entity, em);
      if (loops.length === 0) {
        omit(collector, entity.objectName);
        continue;
      }
      // 填充只挂在第一条记录上，且带着**全部**环：奇偶规则要一次拿到所有环，
      // 分散到各条记录上画，带岛的图案就会把洞填死
      let fill: DwgFill | undefined;
      if (entity.isSolid) {
        fill = { kind: 'solid', loops };
      } else {
        // 估算的尺子与裁剪的边界都必须和图案偏移同一个坐标系：偏移取自实体自身空间，
        // 所以这里用未变换的边界，而不是上面那份已经乘过块变换的 `loops`
        const segments = patternSegments(entity, m, hatchBoundaryPoints(entity, IDENTITY));
        if (segments === 'too-dense') {
          report(collector, entity.objectName, 'degraded');
          report(collector, PATTERN_TOO_DENSE, 'dropped');
        } else if (segments) {
          fill = { kind: 'pattern', segments };
          // 图案是按线段近似的，不是 CAD 的图案定义本身——如实说
          report(collector, entity.objectName, 'degraded');
        }
      }
      // 一个填充可能有多个边界环（带岛的图案）。每个环一条记录，
      // 句柄得加环序号才不会重复
      loops.forEach((loop, index) => {
        const suffix = loops.length > 1 ? `${prefix}#${index}@` : prefix;
        push(
          collector,
          entity,
          suffix,
          { kind: 'polyline', points: loop, closed: true },
          inherited,
          undefined,
          index === 0 ? fill : undefined,
          inheritedWeight,
          inheritedColor
        );
      });
      continue;
    }

    if (entity instanceof Wipeout) {
      // 遮罩的语义就是「用背景色盖住下面的东西」，它不是「不受支持的图元」
      const loop = wipeoutLoop(entity);
      if (loop.length < 3) {
        omit(collector, entity.objectName);
        continue;
      }
      const world = loop.map((p) => apply(m, p.x, p.y));
      push(
        collector,
        entity,
        prefix,
        { kind: 'polyline', points: world, closed: true },
        inherited,
        undefined,
        { kind: 'mask', loops: [world] },
        inheritedWeight,
        inheritedColor
      );
      continue;
    }

    if (entity instanceof Viewport) {
      if (!isPaperViewport(entity)) {
        collector.viewports.push({
          center: { x: entity.center.x, y: entity.center.y },
          width: entity.width,
          height: entity.height,
          viewCenter: viewportViewCenter(entity),
          viewHeight: entity.viewHeight,
          twistAngle: entity.twistAngle ?? 0,
          frozenLayers: [...(entity.frozenLayers ?? [])].map((layer) =>
            typeof layer === 'string' ? layer : (layer as { name: string }).name
          )
        });
      }
      continue;
    }

    if (entity instanceof Solid3D || entity instanceof Face3D || entity instanceof Polyline3D) {
      // 分册 19 §2.3 边界一：ACIS 实体在浏览器里镶嵌不了；三维图元也不在本版范围内
      omit(collector, entity.objectName);
      continue;
    }

    const geometry = geometryOf(entity, em);
    if (!geometry) {
      omit(collector, entity.objectName);
      continue;
    }
    push(
      collector,
      entity,
      prefix,
      geometry,
      inherited,
      undefined,
      wideFill(entity, em),
      inheritedWeight,
      inheritedColor
    );
  }
}

function accumulate(bounds: { minX: number; minY: number; maxX: number; maxY: number }, p: DwgPoint): void {
  if (p.x < bounds.minX) bounds.minX = p.x;
  if (p.y < bounds.minY) bounds.minY = p.y;
  if (p.x > bounds.maxX) bounds.maxX = p.x;
  if (p.y > bounds.maxY) bounds.maxY = p.y;
}

function boundsOf(entities: readonly DwgEntity[]): DwgBounds {
  const box = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  for (const entity of entities) {
    const g = entity.geometry;
    if (!g) continue;
    switch (g.kind) {
      case 'polyline':
        for (const p of g.points) accumulate(box, p);
        break;
      case 'circle':
      case 'arc':
        accumulate(box, { x: g.center.x - g.radius, y: g.center.y - g.radius });
        accumulate(box, { x: g.center.x + g.radius, y: g.center.y + g.radius });
        break;
      case 'ellipse': {
        const r = Math.hypot(g.majorAxis.x, g.majorAxis.y);
        accumulate(box, { x: g.center.x - r, y: g.center.y - r });
        accumulate(box, { x: g.center.x + r, y: g.center.y + r });
        break;
      }
      case 'point':
        accumulate(box, g.at);
        break;
      case 'text':
        accumulate(box, g.at);
        accumulate(box, { x: g.at.x + g.text.length * g.height * 0.6, y: g.at.y + g.height });
        break;
    }
  }
  if (!Number.isFinite(box.minX)) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  return box;
}

const OMISSION_REASON: Record<string, DwgOmission['reason']> = {
  '3DSOLID': 'acis-not-tessellated',
  REGION: 'acis-not-tessellated',
  BODY: 'acis-not-tessellated'
};

function reasonOf(kind: string, severity: DwgOmission['severity']): DwgOmission['reason'] {
  if (kind === PATTERN_TOO_DENSE) return 'pattern-too-dense';
  if (kind === LINETYPE_MISSING) return 'linetype-unavailable';
  if (severity === 'degraded') return 'pattern-approximated';
  return OMISSION_REASON[kind] ?? 'unsupported-entity';
}

/** 模型空间视图的固定 id。两份图纸靠它配对（FR-23.7） */
const MODEL_VIEW_ID = 'Model';

/**
 * DXF 组码 73（plot type）里「按窗口打印」的取值。
 *
 * 对数字而不对 acad-ts 的 `PlotType` 枚举名：那个枚举把 4 命名成 `Layout`，
 * 与 DXF 规范差了一位——规范的 0 是「上次屏幕显示」，枚举里没有这一项，
 * 于是整体前移。实测两份文件的图纸空间 layout 全是 4，窗口四角也确实
 * 等于纸张尺寸（`2D.dwg` 421.05×298.05 对 full bleed A3，`大堂平面图.dwg` 841×594 对 A1）。
 */
const PLOT_TYPE_WINDOW = 4;

/** 四个数凑成一个非退化的盒；凑不出来就没有（FR-29.4） */
function finiteBounds(x1: unknown, y1: unknown, x2: unknown, y2: unknown): DwgBounds | undefined {
  const values = [x1, y1, x2, y2];
  if (!values.every((v) => typeof v === 'number' && Number.isFinite(v))) return undefined;
  const [ax, ay, bx, by] = values as [number, number, number, number];
  const box = {
    minX: Math.min(ax, bx),
    minY: Math.min(ay, by),
    maxX: Math.max(ax, bx),
    maxY: Math.max(ay, by)
  };
  return box.maxX - box.minX > 0 && box.maxY - box.minY > 0 ? box : undefined;
}

/**
 * 图纸空间声明的范围：打印窗口（FR-29.4）。
 *
 * 实测 `2D.dwg` 五张图纸的**视口并集**宽高比分别是 1.157 / 2.762 / 1.500 / 0.824 / 2.327
 * ——同一份文件里五张纸各框各的，因为纸外还停着视口（P-08 的并集横到 x=2391，
 * 而纸只到 1352）。打印窗口则五张全是 421.05×298.05，正是那张 full bleed A3。
 */
function layoutExtent(layout: {
  readonly plotType?: unknown;
  readonly windowLowerLeftX?: unknown;
  readonly windowLowerLeftY?: unknown;
  readonly windowUpperLeftX?: unknown;
  readonly windowUpperLeftY?: unknown;
}): DwgBounds | undefined {
  if (layout.plotType !== PLOT_TYPE_WINDOW) return undefined;
  // 字段名叫 UpperLeft，装的其实是右上角（组码 140 / 141）
  return finiteBounds(
    layout.windowLowerLeftX,
    layout.windowLowerLeftY,
    layout.windowUpperLeftX,
    layout.windowUpperLeftY
  );
}

export { finiteBounds as dwgFiniteBounds, layoutExtent as dwgLayoutExtent };

/**
 * `INSUNITS` 到量纲的映射（FR-31.12）。键是 `UnitsType` 的枚举值。
 *
 * 枚举里还有微英寸、埃、光年这类取值，没列在这里——建筑图纸用不到，
 * 而列一个永远不会出现的单位只会多一条永远跑不到的分支。未列的一律当无量纲。
 */
const UNITS_BY_INSUNITS = new Map<number, DwgUnits>([
  [1, 'in'],
  [2, 'ft'],
  [3, 'mi'],
  [4, 'mm'],
  [5, 'cm'],
  [6, 'm'],
  [7, 'km'],
  [10, 'yd']
]);

/** 图纸坐标的量纲。读不出就是 `'unitless'`，**不默认毫米** */
export function dwgUnitsOf(insUnits: unknown): DwgUnits {
  return (typeof insUnits === 'number' ? UNITS_BY_INSUNITS.get(insUnits) : undefined) ?? 'unitless';
}

/** 解析一份 DWG。抛出的错误由调用方包成 `WebSkillError` */
export function parseDwgDocument(bytes: Uint8Array): DwgDocumentContent {
  // reader 要 `ArrayBuffer`，而我们拿到的可能是某个更大缓冲区上的视图。
  // 拷一份是唯一不会读到邻居字节的做法；相对 3.7 s 的解析耗时可以忽略
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const document = DwgReader.readFromStream(buffer);

  const layerColors = new Map<string, string>();
  const layerDashes = new Map<string, readonly number[]>();
  const layerWeights = new Map<string, number>();
  const layers: DwgLayer[] = [];
  for (const layer of document.layers ?? []) {
    const color = hexOf(layer.color.getRgb(), '#d4d4d4');
    layerColors.set(layer.name, color);
    const dash = dashFromLineType(layer.lineType);
    if (dash) layerDashes.set(layer.name, dash);
    const weight = layer.lineWeight;
    if (typeof weight === 'number' && Number.isFinite(weight)) layerWeights.set(layer.name, weight);
    layers.push({ name: layer.name, color, visible: layer.isOn });
  }

  const omissions = new Map<string, Map<DwgOmission['severity'], number>>();
  const views: DwgView[] = [];
  // 图头的全局线型比例（LTSCALE）。取不到或拿到 0 时按 1，等于不缩放
  const globalLineTypeScale = document.header?.lineTypeScale || 1;

  const readView = (
    id: string,
    name: string,
    kind: DwgView['kind'],
    entities: Iterable<Entity>,
    extent?: DwgBounds
  ): void => {
    const collector: Collector = {
      entities: [],
      components: [],
      omissions,
      layerColors,
      layerDashes,
      layerWeights,
      lineTypeScale: globalLineTypeScale,
      viewports: []
    };
    walk(collector, entities, IDENTITY, 0, '', DEFAULT_LAYER);
    views.push({
      id,
      name,
      kind,
      entities: collector.entities,
      bounds: boundsOf(collector.entities),
      ...(extent ? { extent } : {}),
      viewports: collector.viewports,
      components: collector.components
    });
  };

  // Layout 的 `associatedBlock` 就是那张纸的内容；名为 `Model` 的那一个即模型空间。
  // 走 layouts 而不是 `document.entities`，图纸空间才不会整块看不见（分册 23 §2.2）
  const layouts = [...(document.layouts ?? [])];
  const modelLayout = layouts.find((layout) => !layout.isPaperSpace);
  // 模型空间声明的范围就是图头的 `$EXTMIN` / `$EXTMAX`（FR-29.4）
  const header = document.header;
  const modelExtent = finiteBounds(
    header?.modelSpaceExtMin?.x,
    header?.modelSpaceExtMin?.y,
    header?.modelSpaceExtMax?.x,
    header?.modelSpaceExtMax?.y
  );
  readView(
    MODEL_VIEW_ID,
    modelLayout?.name ?? MODEL_VIEW_ID,
    'model',
    modelLayout?.associatedBlock?.entities ?? document.entities ?? [],
    modelExtent
  );
  for (const layout of layouts) {
    if (!layout.isPaperSpace) continue;
    readView(layout.name, layout.name, 'layout', layout.associatedBlock?.entities ?? [], layoutExtent(layout));
  }

  const model = views[0]!;
  return {
    version: document.header?.versionString ?? 'unknown',
    units: dwgUnitsOf(document.header?.insUnits),
    layers,
    entities: model.entities,
    bounds: model.bounds,
    views,
    ...(model.components ? { components: model.components } : {}),
    omissions: [...omissions].flatMap(([kind, bucket]) =>
      [...bucket].map(([severity, count]) => ({ kind, count, severity, reason: reasonOf(kind, severity) }))
    )
  };
}
