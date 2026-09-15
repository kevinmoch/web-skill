/**
 * DWG 查看器的共享几何（0.22.0 分册 19）。
 *
 * 画布与场景预处理共用这一份「怎么把实体摊成可画的东西」，
 * 免得两边各写一套采样逻辑，然后在某一边悄悄画歪。
 */

import { dwgPickView, dwgViewsOf } from '@webskill/sdk/agent';
import type { DwgDocumentContent, DwgEntity, DwgFont, DwgGeometry, DwgViewport } from '@webskill/sdk/agent';

/** 一份图纸的投放载荷；与 `dwgHost.ts` 里那一份对应 */
export interface DwgPayload {
  readonly kind: 'dwg';
  readonly lang: 'zh' | 'en';
  readonly after: DwgDocumentContent;
}

/**
 * 查看器收到的整份载荷（0.22.0 FR-35.9）：一到两份图纸，数组顺序就是初始叠放顺序。
 *
 * 单份与双份同构，没有「单份专用」的旁路——两条路径会各自演化，
 * 而分册 24~33 的渲染保真只在其中一条上被验证过。
 */
export interface DwgViewerPayload {
  readonly kind: 'dwg';
  readonly lang: 'zh' | 'en';
  readonly drawings: readonly DwgDocumentContent[];
}

/**
 * 叠加时每层的染色（FR-35.12）。
 *
 * 取色按**叠放位置**，不按图纸：换序之后两色跟着对调，
 * 于是「谁在上面」在画布上直接可读，不必回头看图层栈。
 * 两色相加溢出成白，所以重叠处是中性的白，不偏向任何一层。
 */
export const STACK_TINTS = ['#ff3d9a', '#12d6ff'] as const;

export interface Drawn {
  readonly entity: DwgEntity;
  readonly color: string;
}

export function isViewerPayload(value: unknown): value is DwgViewerPayload {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as { kind?: unknown; drawings?: unknown };
  return candidate.kind === 'dwg' && Array.isArray(candidate.drawings) && candidate.drawings.length > 0;
}

/**
 * 这条实体是不是填充（FR-29.1）。
 *
 * 填充的边界环照常入库为 `polyline` 几何（分册 28 的降级路径靠它），
 * 但**不能描边**：AutoCAD 从不画填充的边界，图上看见的轮廓一律来自另一条独立的多段线。
 */
export function isHatch(entity: DwgEntity): boolean {
  return entity.kind.toUpperCase() === 'HATCH';
}

/**
 * 视图取用直接复用 agent 包里的实现（FR-23.5）。
 *
 * 「哪些视图、按什么配对」写两份，迟早会出现查看器与摘要各说各话。
 */
export const viewsOf = dwgViewsOf;
export const pickView = dwgPickView;

/**
 * AutoCAD 给标注定义点建的特殊图层，**从不打印**，官方查看器也不显示。
 * 实测 `2D.dwg` 的 782 条 POINT 里 762 条在这层，画出来就是满屏白点（FR-27.4）。
 *
 * 只在绘制侧挡掉：它们是图纸里客观存在的数据，对比与明细照样要算得到。
 */
const DEFPOINTS_LAYER = 'defpoints';

export function isPaintable(entity: DwgEntity): boolean {
  return entity.layer.toLowerCase() !== DEFPOINTS_LAYER;
}

/**
 * 通用回落族（FR-28.6）。
 *
 * 落到宋体/衬线而不是 `system-ui`：图纸里承担中文的大多是 SHX 笔画字体
 * （实测 `2D.dwg` 的 129 条中文走 `th-rmc` / `th-chnc`），它们没有对应的 web 字体，
 * 只能替代。官方查看器替下来的观感是衬线的，用户把它读作「宋体」。
 */
const FONT_FALLBACK = "'Songti SC', SimSun, 'Noto Serif CJK SC', serif";

/**
 * 字体文件名 → CSS 字体族。键是去掉扩展名、转小写后的**前缀**匹配，
 * 因为图纸里同一族常带后缀（`simhei`、`simheib`、`simhei_0`）。
 */
const FONT_FAMILIES: readonly (readonly [string, string])[] = [
  ['simsun', "'Songti SC', SimSun, serif"],
  ['simhei', "'Heiti SC', SimHei, sans-serif"],
  ['simkai', "'Kaiti SC', KaiTi, serif"],
  ['simyou', "'Yuanti SC', YouYuan, sans-serif"],
  ['simfang', "'Fangsong SC', FangSong, serif"],
  ['msyh', "'Microsoft YaHei', 'PingFang SC', sans-serif"],
  ['arial', 'Arial, Helvetica, sans-serif'],
  ['times', "'Times New Roman', Times, serif"],
  ['courier', "'Courier New', Courier, monospace"],
  ['verdana', 'Verdana, Geneva, sans-serif'],
  ['tahoma', 'Tahoma, Geneva, sans-serif'],
  ['calibri', 'Calibri, Candara, sans-serif']
];

function familyFor(file: string | undefined): string | undefined {
  const name = (file ?? '')
    .trim()
    .toLowerCase()
    .replace(/\.(ttf|ttc|otf|shx)$/, '');
  if (name.length === 0) return undefined;
  return FONT_FAMILIES.find(([prefix]) => name.startsWith(prefix))?.[1];
}

/**
 * 图纸指定的字体映射成 CSS 字体族（FR-28.6）。
 *
 * 大字体排在主字体前面：拉丁槽与 CJK 槽是分开的，中文由大字体承担
 * （`TH-STYLE2` 是 `th-rmc` + `th-chnc`），排后面就轮不到它。
 * 认不出来的一律交给 `FONT_FALLBACK`——SHX 笔画字体都会走到这里，这是预期行为。
 */
export function fontFamilyOf(font: DwgFont | undefined): string {
  const families = [familyFor(font?.bigFile), familyFor(font?.file)].filter(
    (f, i, all): f is string => f !== undefined && all.indexOf(f) === i
  );
  return [...families, FONT_FALLBACK].join(', ');
}

/**
 * 组装要画的东西：当前视图的全部，按图层上色。
 */
export function collectDrawn(payload: DwgPayload, viewId?: string): Drawn[] {
  const layerColor = new Map(payload.after.layers.map((l) => [l.name, l.color] as const));
  const view = pickView(payload.after, viewId);
  // 实体自己写死的颜色优先于图层色（FR-26.1）。修订云就是这么红的：
  // 它躺在一个绿色图层上，只看图层色会把整片批注画成绿的
  return view.entities
    .filter(isPaintable)
    .map((entity) => ({ entity, color: entity.color ?? layerColor.get(entity.layer) ?? '#d4d4d4' }));
}

/** 曲线采样步长（弧度）。三维里一条曲线就是一串线段，密一点才不至于看出多边形 */
const STEP = Math.PI / 24;

/**
 * 把一个几何摊成若干条折线。参数式曲线在这里才离散——
 * 二维画布可以直接画 `arc()`，三维不行，那边只有线段。
 */
export function tessellate(geometry: DwgGeometry | undefined): Array<Array<readonly [number, number]>> {
  if (!geometry) return [];
  switch (geometry.kind) {
    case 'polyline': {
      const pts = geometry.points.map((p) => [p.x, p.y] as const);
      if (pts.length < 2) return [];
      return [geometry.closed && pts.length > 2 ? [...pts, pts[0]!] : pts];
    }
    case 'circle':
      return [sample(geometry.center.x, geometry.center.y, geometry.radius, 0, geometry.radius, 0, Math.PI * 2, true)];
    case 'arc':
      return [
        sample(
          geometry.center.x,
          geometry.center.y,
          geometry.radius,
          0,
          geometry.radius,
          geometry.startAngle,
          geometry.endAngle,
          false
        )
      ];
    case 'ellipse': {
      const minorLength = Math.hypot(geometry.majorAxis.x, geometry.majorAxis.y) * geometry.ratio;
      return [
        sample(
          geometry.center.x,
          geometry.center.y,
          geometry.majorAxis.x,
          geometry.majorAxis.y,
          minorLength,
          geometry.startAngle,
          geometry.endAngle,
          false
        )
      ];
    }
    // 点与文字在三维里用一个很小的十字代替：拿不到字形，硬画方框反而更误导
    case 'point':
      return cross(geometry.at.x, geometry.at.y, 1);
    case 'text':
      return cross(geometry.at.x, geometry.at.y, Math.max(geometry.height, 1) * 0.5);
  }
}

function cross(x: number, y: number, r: number): Array<Array<readonly [number, number]>> {
  return [
    [
      [x - r, y],
      [x + r, y]
    ],
    [
      [x, y - r],
      [x, y + r]
    ]
  ];
}

function sample(
  cx: number,
  cy: number,
  majorX: number,
  majorY: number,
  minorLength: number,
  start: number,
  end: number,
  full: boolean
): Array<readonly [number, number]> {
  let sweep = full ? Math.PI * 2 : end - start;
  if (!full && sweep <= 0) sweep += Math.PI * 2;
  const steps = Math.max(8, Math.ceil(Math.abs(sweep) / STEP));
  const majorLength = Math.hypot(majorX, majorY) || 1;
  const ux = majorX / majorLength;
  const uy = majorY / majorLength;
  const out: Array<readonly [number, number]> = [];
  for (let i = 0; i <= steps; i++) {
    const t = start + (sweep * i) / steps;
    const a = majorLength * Math.cos(t);
    const b = minorLength * Math.sin(t);
    out.push([cx + ux * a - uy * b, cy + uy * a + ux * b]);
  }
  return out;
}

export interface Viewport {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
}

/** 一个视口的「模型 → 纸面」相似变换（FR-23.2） */
export interface ViewportTransform {
  readonly scale: number;
  readonly cos: number;
  readonly sin: number;
  /** 纸面窗口中心 */
  readonly cx: number;
  readonly cy: number;
  /** 模型空间里被看着的那个点 */
  readonly vx: number;
  readonly vy: number;
}

/**
 * 视口的出图变换。
 *
 * 比例由「纸面窗口高 ÷ 模型视图高」定，实测这张图的五个立面窗口都落在 1:50 附近。
 * `twistAngle` 是视图相对纸面的扭转，纸面要按它的**反向**转回去；
 * 这份图纸里六个视口的扭转角全是 0，所以这个方向没有真实数据可验，
 * 只在这里记一笔，不假装它被验证过。
 */
export function viewportTransform(viewport: DwgViewport): ViewportTransform {
  const scale = viewport.viewHeight > 1e-9 ? viewport.height / viewport.viewHeight : 1;
  const angle = -(viewport.twistAngle || 0);
  return {
    scale,
    cos: Math.cos(angle),
    sin: Math.sin(angle),
    cx: viewport.center.x,
    cy: viewport.center.y,
    vx: viewport.viewCenter.x,
    vy: viewport.viewCenter.y
  };
}

/** 模型空间的一点落在纸面的什么位置 */
export function projectThroughViewport(t: ViewportTransform, x: number, y: number): readonly [number, number] {
  const dx = (x - t.vx) * t.scale;
  const dy = (y - t.vy) * t.scale;
  return [t.cx + dx * t.cos - dy * t.sin, t.cy + dx * t.sin + dy * t.cos];
}

/**
 * 一个线型周期在屏幕上短到画不出来的长度（像素）。
 *
 * 低于它时虚线和实线在像素上分不出来，继续设 dash 只是让 canvas 空转。
 */
export const DASH_FLOOR_PX = 1;

/**
 * 线型的世界单位段长 → 屏幕像素段长；返回空数组表示按实线画（FR-24.2）。
 *
 * 疏密**只由图纸决定**：解析层已经把 LTSCALE 与 CELTSCALE 乘进 `dash` 了，
 * 这里不再拿像素长度去二次裁决谁该是实线——那等于用屏幕比例冒充线型比例。
 * 判据也不区分视口内外：`px` 已经把视口的缩放算进去了，同样的屏幕周期
 * 在纸面上和在视口里必然得到同样的结果。
 */
export function screenDash(dash: readonly number[] | undefined, px: number): number[] {
  if (!dash || dash.length === 0 || !Number.isFinite(px) || px <= 0) return [];
  const scaled = dash.map((v) => v * px);
  let total = 0;
  for (const v of scaled) {
    if (!Number.isFinite(v) || v < 0) return [];
    total += v;
  }
  return total < DASH_FLOOR_PX ? [] : scaled;
}

/**
 * 图案填充线之间还剩几个屏幕像素（FR-24.3）。
 *
 * 判「看不看得清」要量**图案线的间距**，不是量比例尺。一张以毫米为单位的图
 * 比例尺天然就小，却完全不妨碍 200 mm 间距的斜纹看得一清二楚——
 * 早先拿 `camera.scale` 当判据，把间距 111 px 的斜纹当成「太小不值得画」全剔了。
 *
 * 平行线族的间距约等于「覆盖面积 ÷ 总线长」。面积或线长退化（单条线、零面积）时
 * 返回 `Infinity`，也就是按「画」处理：宁可多画一条，也不能静默吞掉。
 */
export function patternSpacingPx(segments: readonly number[], px: number): number {
  if (!Number.isFinite(px) || px <= 0) return Infinity;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let length = 0;
  for (let i = 0; i + 3 < segments.length; i += 4) {
    const [ax, ay, bx, by] = [segments[i]!, segments[i + 1]!, segments[i + 2]!, segments[i + 3]!];
    if (!Number.isFinite(ax) || !Number.isFinite(ay) || !Number.isFinite(bx) || !Number.isFinite(by)) continue;
    length += Math.hypot(bx - ax, by - ay);
    minX = Math.min(minX, ax, bx);
    maxX = Math.max(maxX, ax, bx);
    minY = Math.min(minY, ay, by);
    maxY = Math.max(maxY, ay, by);
  }
  const area = (maxX - minX) * (maxY - minY);
  if (!(length > 0) || !(area > 0)) return Infinity;
  return (area / length) * px;
}

/** 图案密到这个间距以下就是一团糊，画了也看不出是斜线，还白费一帧 */
export const PATTERN_SPACING_FLOOR_PX = 0.75;

/**
 * 几何在**世界单位**下的长度；量不出长度的形状（文字、点）返回 0。
 *
 * 椭圆按 Ramanujan 近似的周长再乘参数跨度取比例——实虚判定只要量级对就够了，
 * 为它去做椭圆积分是杀鸡用牛刀。
 */
export function geometryLength(geometry: DwgGeometry | undefined): number {
  if (!geometry) return 0;
  if (geometry.kind === 'polyline') {
    const pts = geometry.points;
    let sum = 0;
    for (let i = 1; i < pts.length; i += 1) sum += Math.hypot(pts[i]!.x - pts[i - 1]!.x, pts[i]!.y - pts[i - 1]!.y);
    if (geometry.closed && pts.length > 2) {
      const first = pts[0]!;
      const last = pts[pts.length - 1]!;
      sum += Math.hypot(first.x - last.x, first.y - last.y);
    }
    return sum;
  }
  if (geometry.kind === 'circle') return 2 * Math.PI * geometry.radius;
  if (geometry.kind === 'arc') {
    let span = geometry.endAngle - geometry.startAngle;
    while (span < 0) span += Math.PI * 2;
    return geometry.radius * span;
  }
  if (geometry.kind === 'ellipse') {
    const a = Math.hypot(geometry.majorAxis.x, geometry.majorAxis.y);
    const b = a * geometry.ratio;
    const h = (a - b) ** 2 / (a + b) ** 2;
    const full = Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
    let span = geometry.endAngle - geometry.startAngle;
    while (span < 0) span += Math.PI * 2;
    return (full * span) / (Math.PI * 2);
  }
  return 0;
}

/**
 * 整条线装不下一个完整线型周期时，AutoCAD 按**实线**画（FR-25.4）。
 *
 * 实测 `大堂立面图.dwg` 的 Layout1 里 17 条带 dash 的折线有 9 条属于这种，
 * 典型是 `A-DETL-____-OTLN` 上的 `线长 117 / 周期 119 = 0.98`。
 * 不认这条规则，它们就会画成「一个短划加一段空白」——既虚又断，
 * 官方图上那些红色方框和括弧看着不连续就是这么来的。
 *
 * 判据落在**世界单位**上，与镜头缩放无关：一条线在图纸上有多长是它的固有属性，
 * 拿屏幕长度去判会让同一条线在放大时是实线、缩小时变虚线。
 */
export function fitsOneDashPeriod(dash: readonly number[] | undefined, length: number): boolean {
  if (!dash || dash.length === 0) return false;
  let period = 0;
  for (const v of dash) {
    if (!Number.isFinite(v) || v < 0) return false;
    period += v;
  }
  // 周期退化（全零）时谈不上「装得下」，按实线处理
  if (!(period > 0)) return false;
  return Number.isFinite(length) && length >= period;
}

/**
 * 实体最终该用的屏幕 dash：先过世界单位的「装不装得下一个周期」，
 * 再过屏幕像素的「看不看得出虚实」。两道判据管的是两回事，都要过。
 */
export function dashForGeometry(
  dash: readonly number[] | undefined,
  geometry: DwgGeometry | undefined,
  px: number
): number[] {
  if (!fitsOneDashPeriod(dash, geometryLength(geometry))) return [];
  return screenDash(dash, px);
}

/**
 * 线宽（0.01 mm）→ 屏幕描边宽度（像素）。
 *
 * 钳在一个可读区间里：细到亚像素的线在 canvas 上会被抗锯齿摊成一片灰，
 * 看着像没画；粗到十几像素又会把图糊死。上下界是**显示决策**，
 * 与图纸里的毫米值无关，所以写死在渲染侧而不是解析侧。
 */
export const MIN_STROKE_PX = 0.75;
export const MAX_STROKE_PX = 6;

/** 0.01 mm 折算成像素的系数：0.25 mm 的默认线宽对应 1 px 左右 */
const WEIGHT_TO_PX = 1 / 25;

export function strokeWidthPx(lineWeight: number | undefined): number {
  if (lineWeight === undefined || !Number.isFinite(lineWeight) || lineWeight <= 0) return 1;
  return Math.min(MAX_STROKE_PX, Math.max(MIN_STROKE_PX, lineWeight * WEIGHT_TO_PX));
}

/**
 * 按给定宽度折行（FR-25.5）。
 *
 * 实测 `大堂立面图.dwg` 的 178 个 MTEXT 里有 82 个带 `rectangleWidth`，
 * 而它们的 `plainText` **一个换行符都没有**——换行本来就该由这个宽度算出来。
 * 不算的话，标题栏表格里「修改 / 次数 / 时间 / 修改内容」会横着捅出格子。
 *
 * `measure` 由调用方给（canvas 的 `measureText`），这样这个函数本身不碰 DOM、可以直接测。
 * 中文没有词边界，所以断点是「优先在空格处断，断不了就逐字断」：
 * 只按空格断会让一整句中文永远断不开，只按字断又会把英文单词劈两半。
 */
export function wrapText(measure: (s: string) => number, text: string, maxWidth: number): string[] {
  if (!(maxWidth > 0) || text.length === 0) return [text];
  const out: string[] = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const ch of paragraph) {
      const next = line + ch;
      if (line.length > 0 && measure(next) > maxWidth) {
        const cut = line.lastIndexOf(' ');
        // 空格在行首时按它断会留下空行，那还不如逐字断
        if (cut > 0 && ch !== ' ') {
          out.push(line.slice(0, cut));
          line = line.slice(cut + 1) + ch;
        } else {
          out.push(line);
          line = ch === ' ' ? '' : ch;
        }
      } else {
        line = next;
      }
    }
    out.push(line);
  }
  return out.length > 0 ? out : [text];
}

/**
 * 稳健视口：按分位数裁掉极端点，而不是用真实包围盒。
 *
 * 实测 `2D.dwg` 有 9 个实体（0.1%）离主图几十万个单位远，按真实包围盒自适应，
 * 整张图会缩成屏幕中央的一个小点。包围盒作为数据事实保留在 `DwgDocumentContent.bounds` 里，
 * 「怎么看」是另一回事。
 */
export function robustViewport(drawn: readonly Drawn[]): Viewport {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const item of drawn) {
    for (const line of tessellate(item.entity.geometry)) {
      for (const [x, y] of line) {
        xs.push(x);
        ys.push(y);
      }
    }
  }
  return percentileBox(xs, ys);
}

/** 0.2% / 99.8% 分位框；点太少或退化时给个最小尺寸，否则后面除以 0 */
function percentileBox(xs: number[], ys: number[]): Viewport {
  if (xs.length === 0) return { minX: -1, minY: -1, maxX: 1, maxY: 1 };
  xs.sort((a, b) => a - b);
  ys.sort((a, b) => a - b);
  const at = (arr: number[], f: number): number =>
    arr[Math.min(arr.length - 1, Math.max(0, Math.round((arr.length - 1) * f)))]!;
  const box = { minX: at(xs, 0.002), maxX: at(xs, 0.998), minY: at(ys, 0.002), maxY: at(ys, 0.998) };
  if (box.maxX - box.minX < 1e-9) {
    box.minX -= 1;
    box.maxX += 1;
  }
  if (box.maxY - box.minY < 1e-9) {
    box.minY -= 1;
    box.maxY += 1;
  }
  return box;
}

/** 密集簇网格的边长。64×64 是「分得开离群簇、又不会把一张图切碎」的折中 */
const CLUSTER_GRID = 64;

/**
 * 最大密集簇（FR-29.5）。
 *
 * 分位裁剪挡不住 `大堂平面图.dwg`：离群的不是 0.2%，是 **47%**——142,302 条实体里
 * 66,554 条住在 (7.9e8, −1.085e9) 附近的一组绑定外部参照里，原厂的默认视角根本没显示它。
 * 把点铺进 64×64 的网格，按 8 邻接连成连通分量，取点数最多的那一个。
 *
 * 连通判据试过放宽到跨 2 / 3 / 4 格，对两份真实文件**一个数字都没变**
 * （`2D.dwg` 四种取法都是 42208 点、簇盒 1.642e4×1.363e4），所以不放宽。
 *
 * 判据必须是确定性的：同一组点两次算出来必须一样，只有一个分量时必须等于不聚类。
 */
export function densestCluster(xs: readonly number[], ys: readonly number[]): number[] {
  const n = xs.length;
  if (n === 0) return [];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < n; i++) {
    const x = xs[i]!;
    const y = ys[i]!;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const spanX = maxX - minX;
  const spanY = maxY - minY;
  if (!(spanX > 0) && !(spanY > 0)) return range(n);
  // 格号：跨度为 0 的那一维全落在第 0 列
  const cellOf = (i: number): number => {
    const cx = spanX > 0 ? Math.min(CLUSTER_GRID - 1, Math.floor(((xs[i]! - minX) / spanX) * CLUSTER_GRID)) : 0;
    const cy = spanY > 0 ? Math.min(CLUSTER_GRID - 1, Math.floor(((ys[i]! - minY) / spanY) * CLUSTER_GRID)) : 0;
    return cy * CLUSTER_GRID + cx;
  };
  const counts = new Map<number, number>();
  const cells = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    const cell = cellOf(i);
    cells[i] = cell;
    counts.set(cell, (counts.get(cell) ?? 0) + 1);
  }
  // 8 邻接洪水填充。格子最多 4096 个，扫一遍比并查集还便宜
  const label = new Map<number, number>();
  const weight: number[] = [];
  for (const cell of counts.keys()) {
    if (label.has(cell)) continue;
    const id = weight.length;
    let total = 0;
    const stack = [cell];
    label.set(cell, id);
    while (stack.length > 0) {
      const at = stack.pop()!;
      total += counts.get(at) ?? 0;
      const cx = at % CLUSTER_GRID;
      const cy = (at - cx) / CLUSTER_GRID;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nxCell = cx + dx;
          const nyCell = cy + dy;
          if (nxCell < 0 || nyCell < 0 || nxCell >= CLUSTER_GRID || nyCell >= CLUSTER_GRID) continue;
          const next = nyCell * CLUSTER_GRID + nxCell;
          if (!counts.has(next) || label.has(next)) continue;
          label.set(next, id);
          stack.push(next);
        }
      }
    }
    weight.push(total);
  }
  if (weight.length <= 1) return range(n);
  let best = 0;
  for (let id = 1; id < weight.length; id++) if (weight[id]! > weight[best]!) best = id;
  const picked: number[] = [];
  for (let i = 0; i < n; i++) if (label.get(cells[i]!) === best) picked.push(i);
  return picked;
}

function range(n: number): number[] {
  const out = new Array<number>(n);
  for (let i = 0; i < n; i++) out[i] = i;
  return out;
}

/**
 * 密集簇要被采纳，至少得把跨度压掉这么多倍。
 *
 * 聚类是给**病态文件**兜底的，不是一个通用的放大启发式。实测两份文件分得很开：
 * `大堂平面图.dwg` 夹完仍有 7.925e8 跨度，最大簇只有 1.707e6——**464 倍**；
 * `2D.dwg` 夹完 3.41e4、最大簇 1.64e4——**3.9 倍**，而那 4.4% 被丢掉的点是图签与详图，
 * 本来就该在画面里。差一个数量级才动手，两者才不会互相误伤。
 */
const CLUSTER_SHRINK = 10;

/**
 * 模型空间的取景框（FR-29.5）：声明范围夹一刀 → 最大密集簇（够显著才采纳）。
 *
 * 两层各挡一种离群：`extent`（图头的 `$EXTMIN`/`$EXTMAX`）挡掉原始坐标就在
 * −3.6e10 的 1311 个属性；密集簇挡掉那 47% 住在绑定外参里的实体。
 *
 * 夹完之后**不再做分位裁剪**：分位是按点数算的，而点数与「该看多大」没有因果关系。
 * 实测 `2D.dwg` 夹完是 x[−76924, −42919] y[11678, 64150]，再走一道 0.2%/99.8%
 * 会把框砍成 1.6e4×1.25e4——主平面图点密、图签与详图点稀，分位把后者整段扔了。
 *
 * 图头没写范围的文件仍走分册 27 的分位裁剪，行为不变。
 */
export function modelViewport(view: { extent?: Bounds }, drawn: readonly Drawn[]): Viewport {
  const extent = view.extent;
  if (!extent) return robustViewport(drawn);
  const xs: number[] = [];
  const ys: number[] = [];
  for (const item of drawn) {
    for (const line of tessellate(item.entity.geometry)) {
      for (const [x, y] of line) {
        if (x < extent.minX || x > extent.maxX || y < extent.minY || y > extent.maxY) continue;
        xs.push(x);
        ys.push(y);
      }
    }
  }
  // 夹完一个不剩：声明范围与实际内容对不上，别拿一个空框去画
  if (xs.length === 0) return robustViewport(drawn);
  const clamped = boxOf(xs, ys, undefined);
  const cluster = boxOf(xs, ys, densestCluster(xs, ys));
  const shrink = Math.max(
    (clamped.maxX - clamped.minX) / Math.max(cluster.maxX - cluster.minX, Number.MIN_VALUE),
    (clamped.maxY - clamped.minY) / Math.max(cluster.maxY - cluster.minY, Number.MIN_VALUE)
  );
  return pad(shrink >= CLUSTER_SHRINK ? cluster : clamped);
}

function boxOf(xs: readonly number[], ys: readonly number[], picked: readonly number[] | undefined): Viewport {
  const box = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  const n = picked ? picked.length : xs.length;
  for (let k = 0; k < n; k++) {
    const i = picked ? picked[k]! : k;
    const x = xs[i]!;
    const y = ys[i]!;
    if (x < box.minX) box.minX = x;
    if (x > box.maxX) box.maxX = x;
    if (y < box.minY) box.minY = y;
    if (y > box.maxY) box.maxY = y;
  }
  return box;
}

/** 退化成一条线或一个点时给个最小尺寸，否则后面除以 0 */
function pad(box: Viewport): Viewport {
  const out = { ...box };
  if (out.maxX - out.minX < 1e-9) {
    out.minX -= 1;
    out.maxX += 1;
  }
  if (out.maxY - out.minY < 1e-9) {
    out.minY -= 1;
    out.maxY += 1;
  }
  return out;
}

interface Bounds {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
}

/**
 * 一张图纸的取景框。
 *
 * 图纸空间里常留着不属于本张图框的东西：实测 `2D.dwg` 五张图纸的实体盒都是
 * `x[~940, 2671]`（宽高比 6.1），而图框连同视口只占 `x[934, 1312]`（宽高比 1.3）。
 * 按实体盒取景，图框被压在左下角，要放大约 4.7 倍才等于原厂效果；
 * 而 `robustViewport` 的分位裁剪是按点数算的，实体密的图纸（P-09 / P-10）
 * 恰好把远处那批裁掉了，实体稀的（P-07 / P-08 / P-11）裁不掉——
 * 同一份图纸上五张纸表现不一致，根子就在这里（FR-27.8）。
 *
 * 分册 27 拿**视口并集**当图框，实测证明那个代理也不成立：`2D.dwg` 五张纸的并集
 * 宽高比是 1.157 / 2.762 / 1.500 / 0.824 / 2.327，因为纸外还停着视口
 * （P-08 的并集横到 x=2391，纸只到 1352）。打印窗口才是「这张纸要印出来的范围」，
 * 五张全是 421.05×298.05（FR-29.5）。
 *
 * 声明不出打印窗口时退回视口并集，再退回分位裁剪。
 * 模型空间走另一套（`modelViewport`）：那里 `extent` 只是第一道筛子，不是答案。
 */
export function viewViewport(
  view: { kind?: string; viewports: readonly DwgViewport[]; extent?: Bounds },
  drawn: readonly Drawn[]
): Viewport {
  if (view.kind === 'model') return modelViewport(view, drawn);
  const extent = view.extent;
  if (extent) return { minX: extent.minX, minY: extent.minY, maxX: extent.maxX, maxY: extent.maxY };
  const box = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  for (const vp of view.viewports) {
    const hw = Math.abs(vp.width) / 2;
    const hh = Math.abs(vp.height) / 2;
    if (!(hw > 0) || !(hh > 0)) continue;
    box.minX = Math.min(box.minX, vp.center.x - hw);
    box.maxX = Math.max(box.maxX, vp.center.x + hw);
    box.minY = Math.min(box.minY, vp.center.y - hh);
    box.maxY = Math.max(box.maxY, vp.center.y + hh);
  }
  return box.minX < box.maxX && box.minY < box.maxY ? box : robustViewport(drawn);
}

/**
 * 只留下打印窗口里的实体（0.22.0 分册 30 FR-30.3）。
 *
 * 分册 29 把打印窗口解析进了 `DwgView.extent`，但只拿它定相机——绘制循环照旧
 * 遍历该视图的全部实体，于是窗口外的邻图照画不误，只是被推到了画面边缘。
 * 实测 `大堂平面图.dwg` 的 `Layout1` 有 16149 个实体，落在 841×594 那张纸上的
 * 只有 390 个（2.4%）；原厂那张图纸外面是纯黑的。
 *
 * 只按包围盒粗筛，跨纸边的实体留下来交给画布裁剪——这里把它切断意味着重算几何，
 * 而画布本来就要裁一次。
 */
export function itemsWithinBox(items: readonly Drawn[], box: Bounds): Drawn[] {
  const out: Drawn[] = [];
  for (const item of items) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const line of tessellate(item.entity.geometry))
      for (const [x, y] of line) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    // 塌不出任何点的实体（如被省略几何的记录）没有位置可判，一律留下
    if (minX > maxX) {
      out.push(item);
      continue;
    }
    if (maxX < box.minX || minX > box.maxX || maxY < box.minY || minY > box.maxY) continue;
    out.push(item);
  }
  return out;
}

/** 出现在图上的图层，按实体数排序——图层表里常有大量一条实体都没有的空图层 */
export function usedLayers(
  drawn: readonly Drawn[],
  document: DwgDocumentContent
): Array<{ name: string; color: string; count: number }> {
  const counts = new Map<string, number>();
  for (const item of drawn) counts.set(item.entity.layer, (counts.get(item.entity.layer) ?? 0) + 1);
  const colors = new Map(document.layers.map((l) => [l.name, l.color] as const));
  return [...counts]
    .map(([name, count]) => ({ name, color: colors.get(name) ?? '#d4d4d4', count }))
    .sort((a, b) => b.count - a.count);
}
