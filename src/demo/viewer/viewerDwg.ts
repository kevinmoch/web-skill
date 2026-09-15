/**
 * DWG 查看器（0.22.0 分册 19、35，FR-19.5 / FR-19.6 / FR-35.9）。
 *
 * 这个模块是**懒加载**的：`main.ts` 只在文档声明 `data-viewer-mode="dwg"` 时才 import 它。
 *
 * 结构分两级：`createLayer()` 管一份图纸（视图、图层显隐、底图、它自己的量测），
 * `mountDwgViewer()` 管所有层共用的东西（画布、相机、指针事件、工具栏、叠放顺序）。
 * 一份图纸时就是一个层，路径与两份完全相同——不留「单份专用」的旁路。
 *
 * 配色写死是刻意的，与 `view.html` 里那条注释同因：这一页跑在 sandbox 的 opaque origin，
 * 既读不到扩展的主题配置，也没有 ui-kit 的 token。文案则按投放时带进来的语言出双份。
 */

import {
  PATTERN_SPACING_FLOOR_PX,
  STACK_TINTS,
  collectDrawn,
  dashForGeometry,
  fontFamilyOf,
  isHatch,
  isViewerPayload,
  itemsWithinBox,
  patternSpacingPx,
  pickView,
  projectThroughViewport,
  strokeWidthPx,
  usedLayers,
  viewViewport,
  viewportTransform,
  viewsOf,
  wrapText
} from './dwgGeometry';
import type { DwgPayload, DwgViewerPayload, Drawn } from './dwgGeometry';
import { buildScene, snapAt, snapRank, subScene } from './dwgScene';
import type { Scene, SceneItem, SnapKind } from './dwgScene';
import {
  IDLE_MEASURE_STATE,
  MEASURE_COLORS,
  formatLength,
  hitMeasurement,
  labelAnchor,
  livePreview,
  measureAbort,
  measureClear,
  measureClick,
  measureCommit,
  measureDropTail,
  measureScale,
  measureSelect,
  measurementLabel,
  polylineLength
} from './dwgMeasure';
import type { MeasureKind, MeasureScale, MeasureState, MeasureText } from './dwgMeasure';
import {
  DEFAULT_TOLERANCE_MM,
  compareComponents,
  componentsInBox,
  summariseDiff,
  toleranceInDrawingUnits
} from './dwgComponentDiff';
import type { DiffBox, DiffKind, DiffOutcome, DiffRow, DiffSide } from './dwgComponentDiff';
import type { DwgComponent, DwgEntity, DwgUnits, DwgView } from '@webskill/sdk/agent';

export interface DwgViewerHandle {
  dispose(): void;
}

interface Camera {
  /** 世界单位 → 像素 */
  scale: number;
  /** 视口中心的世界坐标 */
  x: number;
  y: number;
}

/** 这一层相对世界原点的对位平移（FR-35.11）。两份图纸原点不一致时由用户拖出来 */
interface Offset {
  dx: number;
  dy: number;
}

const TEXT = {
  zh: {
    entities: (n: number) => `${n} 个实体`,
    hiddenAll: '没有可显示的图形。',
    layers: '图层',
    views: '视图',
    sheets: '图纸空间',
    model: '模型空间',
    modelView: '二维视图',
    emptyView: (name: string) => `${name} 是一张空布局，图纸里没有给它放任何内容。`,
    dense: (n: number) => `当前比例下 ${n} 处填充图案密得看不出线，未绘制；放大即可看到。`,
    measure: '量测',
    drawing: '图纸',
    allHidden: '两层都隐藏了。在「叠放」面板里勾回任意一层即可继续看图。',
    selected: (name: string) => `当前层：${name}`,
    alignHint:
      '对位已开：拖动画布平移的是当前层，不是视图；量测已暂时收起，点任一量测工具即退出对位。对歪了点「归零」。',
    unitsMixed: '两份图纸的单位不一致，跨层量出来的数没有可比性；读数按标注所属层的单位给。',
    toolHint: {
      distance: '点两个点量距离；Esc 放弃当前这一条。',
      area: '逐点围出一个区域，至少三个点；Enter 或双击结束，Esc 放弃。',
      point: '点一下取该点的图纸坐标。',
      angle: '依次点三个点，第二个是顶点。',
      erase: '点中一条已有的量测即删掉它。'
    },
    snap: {
      endpoint: '端点',
      midpoint: '中点',
      center: '圆心',
      intersection: '交点',
      edge: '线上'
    },
    calibrated: (length: string) => `已校准：基准段 = ${length}。`,
    calibratePrompt: '先点两个点作为基准段，再填它的实际长度。',
    calibrateAsk: '这段的实际长度是多少？（只填数字）',
    unitsKnown: (unit: string) => `图纸自带单位：${unit}。不需要校准。`,
    unitsUnknown: '图纸没写单位，读数只能给图纸单位。需要真实长度请先校准。',
    diff: {
      compare: '对比差异',
      clear: '清除对比',
      scope: (a: string, na: number, b: string, nb: number) => `选框内：${a} ${na} 个构件，${b} ${nb} 个。`,
      coverage: (paired: number, stray: number) =>
        `已比对 ${paired} 个构件；框内另有 ${stray} 条几何不属于任何块，未参与比对。`,
      refused: '两份图纸的块命名体系不同，逐项比对会是噪声，因此不出表。',
      same: (paired: number, stray: number) =>
        stray > 0
          ? `框内 ${paired} 个构件逐一对上，没有差异；另有 ${stray} 条几何不属于任何块，没有参与比对。`
          : `框内 ${paired} 个构件逐一对上，没有差异。`,
      oneVisible: '只剩一层可见时无从比起，先在「叠放」里勾回另一层。',
      noComponents: '这两份图纸里读不出构件清单，无法逐个构件比。',
      hint: '对比已开：拖动选框或它的边角即改比对范围，量测与对位已暂时收起。',
      count: (block: string, a: string, na: number, b: string, nb: number) => `${block}：${a} ${na} 个，${b} ${nb} 个`,
      moved: (block: string, distance: string) => `${block} 挪了 ${distance}`,
      attribute: (block: string, tag: string, from: string, to: string) => `${block} 的 ${tag}：${from} → ${to}`,
      added: (block: string, b: string) => `${b} 多了一个 ${block}`,
      missing: (block: string, b: string) => `${b} 少了一个 ${block}`,
      summary: (total: number, parts: readonly string[]) => `共 ${total} 处差异：${parts.join('、')}。`,
      kindLabel: { count: '数量', moved: '位置', attribute: '属性', added: '新增', missing: '缺失' },
      kindPart: (label: string, n: number) => `${label} ${n}`,
      howto: '悬停图上的编号看这一条的说明，导出可看全部。',
      exportLabel: '导出差异',
      exporting: '导出中…',
      exported: (file: string) => `已生成 ${file}。`,
      exportFailed: (why: string) => `导出没成功：${why}`
    }
  },
  en: {
    entities: (n: number) => `${n} entities`,
    hiddenAll: 'Nothing to draw.',
    layers: 'Layers',
    views: 'Views',
    sheets: 'Sheets',
    model: 'Model',
    modelView: '2D View',
    emptyView: (name: string) => `${name} is an empty layout: the drawing puts nothing on it.`,
    dense: (n: number) =>
      `${n} fill pattern(s) are too dense to resolve at this zoom and were skipped; zoom in to see them.`,
    measure: 'Measure',
    drawing: 'Drawing',
    allHidden: 'Both layers are hidden. Tick one back on in the Stack panel to keep looking.',
    selected: (name: string) => `Active layer: ${name}`,
    alignHint:
      'Align is on: dragging the canvas moves this layer instead of panning, and measure tools are off for now. ' +
      'Pick any measure tool to leave align. Press Reset to undo it.',
    unitsMixed:
      'The two drawings declare different units, so a measurement spanning both is not comparable; ' +
      'readings use the units of the layer the measurement belongs to.',
    toolHint: {
      distance: 'Click two points to measure the distance; Esc discards the one in progress.',
      area: 'Click around an area, at least three points; Enter or double-click finishes, Esc discards.',
      point: 'Click once to read that point in drawing coordinates.',
      angle: 'Click three points; the second one is the vertex.',
      erase: 'Click an existing measurement to delete it.'
    },
    snap: {
      endpoint: 'Endpoint',
      midpoint: 'Midpoint',
      center: 'Center',
      intersection: 'Intersection',
      edge: 'Nearest'
    },
    calibrated: (length: string) => `Calibrated: reference segment = ${length}.`,
    calibratePrompt: 'Click two points as the reference segment, then type its real length.',
    calibrateAsk: 'How long is this segment in reality? (numbers only)',
    unitsKnown: (unit: string) => `The drawing declares its units: ${unit}. No calibration needed.`,
    unitsUnknown: 'The drawing declares no units, so readings are in drawing units. Calibrate to get real lengths.',
    diff: {
      compare: 'Compare',
      clear: 'Clear comparison',
      scope: (a: string, na: number, b: string, nb: number) =>
        `Inside the box: ${na} component(s) in ${a}, ${nb} in ${b}.`,
      coverage: (paired: number, stray: number) =>
        `${paired} component(s) compared; ${stray} more piece(s) of geometry inside the box belong to no block and were not compared.`,
      refused:
        'The two drawings use different block naming systems, so an item-by-item comparison would be noise. No table is produced.',
      same: (paired: number, stray: number) =>
        stray > 0
          ? `All ${paired} component(s) inside the box match; ${stray} more piece(s) of geometry belong to no block and were not compared.`
          : `All ${paired} component(s) inside the box match.`,
      oneVisible: 'Nothing to compare while only one layer is visible; tick the other one back on in Stack.',
      noComponents: 'Neither drawing yields a component list, so there is nothing to compare component by component.',
      hint: 'Comparison is on: drag the box or its edges to change the range. Measure and align are off for now.',
      count: (block: string, a: string, na: number, b: string, nb: number) => `${block}: ${na} in ${a}, ${nb} in ${b}`,
      moved: (block: string, distance: string) => `${block} moved by ${distance}`,
      attribute: (block: string, tag: string, from: string, to: string) => `${block} ${tag}: ${from} → ${to}`,
      added: (block: string, b: string) => `${b} has one extra ${block}`,
      missing: (block: string, b: string) => `${b} is missing one ${block}`,
      summary: (total: number, parts: readonly string[]) => `${total} difference(s): ${parts.join(', ')}.`,
      kindLabel: { count: 'count', moved: 'moved', attribute: 'attribute', added: 'added', missing: 'missing' },
      kindPart: (label: string, n: number) => `${n} ${label}`,
      howto: ' Hover a number on the drawing for its detail, or export the full list.',
      exportLabel: 'Export',
      exporting: 'Exporting…',
      exported: (file: string) => `Generated ${file}.`,
      exportFailed: (why: string) => `Export failed: ${why}`
    }
  }
} as const;

type Text = (typeof TEXT)[keyof typeof TEXT];

/** 与 `dwgHost.ts` 里 `#dwg-root` 的底色一致。遮罩填的就是它，两边对不上就会出现一块色块 */
const BACKGROUND = '#12161c';

/**
 * 差异标记的配色（分册 37）。与量测叠层同因：viewer 是 opaque origin 的独立文档，
 * 取不到应用主题；而且标记要在图纸自己的图层色里一眼认出来，必须是固定的高对比色。
 */
const DIFF_COLORS = {
  mark: '#f472b6',
  lit: '#fde68a',
  ink: '#12161c'
} as const;

/**
 * 打开时该停在哪个视图。
 *
 * 默认落在模型空间（分册 38 FR-38.5，修订 FR-23.5 / FR-35.3）：这个查看器的主用法是
 * 叠两份图比构件，比的是模型空间里的实际几何，不是某张排好版的出图纸。
 * 模型空间空了才退回第一张有内容的图纸。
 */
function defaultViewId(views: readonly DwgView[]): string {
  const model = views.find((v) => v.kind === 'model' && v.entities.length > 0);
  return (model ?? views.find((v) => v.entities.length > 0) ?? views[0]!).id;
}

/** 面板内元素的 id；与 `dwgHost.ts` 里那一份必须同规则 */
function pid(base: string, index: number): string {
  return index === 0 ? base : `${base}-${index}`;
}

/** 把 `#rrggbb` 配上透明度，给区域量测的填充用 */
function withAlpha(hex: string, alpha: number): string {
  const value = Number.parseInt(hex.slice(1), 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}

interface LayerDeps {
  readonly index: number;
  readonly payload: DwgPayload;
  readonly camera: Camera;
  readonly canvas: HTMLCanvasElement;
  readonly t: Text;
  /** 这一层该染成什么色；`undefined` = 用图纸原色（FR-35.12） */
  readonly tint: () => string | undefined;
  readonly decimals: () => number;
  readonly render: () => void;
  /** 视图换了要重新取景：换的是「看哪张纸」，画面得跟着走 */
  readonly refit: () => void;
  /**
   * 「该比什么」变了。两种口径，差在还能不能沿用同一个选框：
   *
   * - `layers`：只是少看几层，图纸、选框、容差都没动 → 当场重算（FR-40.1）。
   * - `view`：换掉了整份实体与坐标范围，选框在新视图里指向别处 → 作废（FR-40.2）。
   */
  readonly scopeChanged: (reason: 'layers' | 'view') => void;
}

interface Layer {
  readonly index: number;
  readonly offset: Offset;
  hidden: boolean;
  readonly isEmpty: () => boolean;
  /** 这一层为什么是空的（空布局的说明）；不空就是空串 */
  readonly emptyNote: () => string;
  readonly units: () => DwgUnits | undefined;
  /** 当前视图里的构件清单（FR-37.12）；解析器没产出就是 `undefined` */
  readonly components: () => readonly DwgComponent[] | undefined;
  /** 被关掉的图层名。图层显隐就是用户在说「这些别比」 */
  readonly hiddenLayers: () => ReadonlySet<string>;
  /** 当前视图里画出来的实体，覆盖率靠它数（FR-37.24） */
  readonly drawnEntities: () => readonly DwgEntity[];
  readonly worldBox: () => { minX: number; minY: number; maxX: number; maxY: number };
  readonly resize: (ratio: number) => void;
  readonly invalidate: () => void;
  readonly baseStale: () => boolean;
  readonly renderBase: () => void;
  readonly baseCost: () => number;
  readonly composite: (target: CanvasRenderingContext2D) => void;
  readonly paintOverlay: (
    target: CanvasRenderingContext2D,
    hover: { x: number; y: number; kind: SnapKind | undefined } | undefined
  ) => void;
  readonly snap: (wx: number, wy: number) => { x: number; y: number; kind: SnapKind | undefined };
  readonly click: (wx: number, wy: number, px: number, py: number) => boolean;
  readonly setTool: (next: MeasureKind | 'erase' | undefined) => void;
  readonly transition: (run: (state: MeasureState) => MeasureState) => boolean;
  readonly dropTail: (epsilon: number) => boolean;
  readonly calibrate: (typed: number) => boolean;
  readonly beginCalibration: () => void;
  readonly awaitingReference: () => boolean;
  readonly dispose: () => void;
}

/** 一份图纸（FR-35.2）：视图、图层显隐、底图、量测都归自己，两层之间互不串台 */
function createLayer(deps: LayerDeps): Layer {
  const { index, payload, camera, canvas, t } = deps;
  const listeners: Array<() => void> = [];
  const on = <K extends keyof HTMLElementEventMap>(
    target: EventTarget,
    type: K,
    handler: (event: HTMLElementEventMap[K]) => void,
    options?: AddEventListenerOptions
  ): void => {
    target.addEventListener(type, handler as EventListener, options);
    listeners.push(() => target.removeEventListener(type, handler as EventListener, options));
  };

  const views = viewsOf(payload.after);
  let activeViewId = defaultViewId(views);
  let active = pickView(payload.after, activeViewId);
  let drawn = collectDrawn(payload, activeViewId);
  let view = viewViewport(active, drawn);

  /** 对位偏移（FR-35.11）。量测点存的是图纸自己的坐标，所以偏移只作用在投屏这一步 */
  const offset: Offset = { dx: 0, dy: 0 };

  // 图层可见性是唯一的过滤器（AC-19.8）
  const hidden = new Set<string>();
  // 本帧因为太密而跳过的填充图案条数，画完一帧就报给用户（FR-24.3）
  let dense = 0;
  const panel = document.getElementById(pid('dwg-panel', index));
  const denseNote = document.getElementById(pid('dwg-dense', index));
  // 空布局的说明归编排层统一写：`#dwg-empty` 只有一个，两层各写各的会互相盖掉
  let emptyText = '';
  const visible = (item: Drawn): boolean => !hidden.has(item.entity.layer);

  /**
   * 实体画进本层自己的离屏底图，叠层（量测 / 橡皮筋 / 吸附标记）由上层合成时画（FR-32.1 / FR-32.4）。
   *
   * 所有实体绘制函数都闭包着下面这个 `ctx`；画底图时它指向离屏上下文，
   * 画叠层时临时指到主画布，比把上下文当参数一路穿下去改动小得多。
   */
  const baseCanvas = document.createElement('canvas');
  const baseCtx = baseCanvas.getContext('2d');
  if (!baseCtx) throw new Error('DWG viewer needs a 2d canvas context.');
  let ctx: CanvasRenderingContext2D = baseCtx;
  /** 底图是用哪个相机、哪个对位偏移画的；`undefined` = 底图作废 */
  let baseState: (Camera & Offset) | undefined;
  /** 上一次底图重绘的耗时，决定下一次是当场重绘还是停手后补画（FR-32.2） */
  let lastBaseMs = 0;
  let disposed = false;

  const resize = (ratio: number): void => {
    baseCanvas.width = canvas.width;
    baseCanvas.height = canvas.height;
    baseCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
    // 画布尺寸变了，旧底图的尺寸就对不上了
    baseState = undefined;
  };

  /** 世界 → 屏幕。DWG 的 Y 朝上，画布的 Y 朝下，所以这里翻一次；对位偏移在这一步叠上 */
  const toScreen = (x: number, y: number): [number, number] => [
    (x + offset.dx - camera.x) * camera.scale + (canvas.clientWidth || 1) / 2,
    (canvas.clientHeight || 1) / 2 - (y + offset.dy - camera.y) * camera.scale
  ];

  /** 屏幕 → 本层图纸坐标，`toScreen` 的逆 */
  const fromScreen = (px: number, py: number): [number, number] => [
    (px - (canvas.clientWidth || 1) / 2) / camera.scale + camera.x - offset.dx,
    camera.y - (py - (canvas.clientHeight || 1) / 2) / camera.scale - offset.dy
  ];

  /** 共享世界坐标 → 本层图纸坐标 */
  const toLocal = (wx: number, wy: number): [number, number] => [wx - offset.dx, wy - offset.dy];

  /**
   * 视口里要画的模型空间内容（FR-23.2）。
   *
   * 图纸空间上只有图框和标注，图形本体全在模型空间里、透过视口看进去。
   * 不画它，出图的那张纸就是个空框。按视口的模型窗口先做一次包围盒剔除，
   * 否则每个视口都要遍历模型空间的全部实体，平移一下就卡住了。
   */
  const modelView = views.find((v) => v.kind === 'model');
  const modelDrawn = modelView ? collectDrawn(payload, modelView.id) : [];
  /**
   * 模型空间的几何只离散化这一次（FR-32.5）。
   *
   * 建它要遍历十几万个实体，而它在整个查看器生命周期里不变——图纸是只读的。
   * 懒建是因为模型空间可能根本不被看：打开的是一张没有视口的图纸时，这笔钱不该花。
   */
  let modelScene: Scene | undefined;
  const modelSceneOf = (): Scene => (modelScene ??= buildScene(modelDrawn));
  let viewportScenes: Scene[] = [];

  const indexViewports = (): void => {
    if (active.kind !== 'layout' || active.viewports.length === 0 || modelDrawn.length === 0) {
      viewportScenes = [];
      return;
    }
    const all = modelSceneOf();
    viewportScenes = active.viewports.map((vp) => {
      const halfH = Math.abs(vp.viewHeight) / 2;
      const aspect = Math.abs(vp.height) > 1e-9 ? Math.abs(vp.width / vp.height) : 1;
      const halfW = halfH * aspect;
      const frozen = new Set(vp.frozenLayers);
      const window = all.query(
        vp.viewCenter.x - halfW,
        vp.viewCenter.y - halfH,
        vp.viewCenter.x + halfW,
        vp.viewCenter.y + halfH
      );
      // 位置不明的实体在这里要滤掉：视口看的是一块明确的模型窗口，落不进去就不属于它
      return subScene(window.filter((e) => e.minX <= e.maxX && !frozen.has(e.item.entity.layer)));
    });
  };

  /**
   * 这张纸要画的实体（FR-30.3）。
   *
   * 打印窗口是图纸**自己声明**的出图范围，窗口外的内容属于同一个图纸空间里的邻图，
   * 不属于这张纸。逐帧算 16149 个包围盒是不必要的开销，所以和视口索引一样只在切视图时算一次。
   * 模型空间不参与：那里的 `extent` 来自 `$EXTMIN`/`$EXTMAX`，是个常年失准的包围盒记录，
   * 不是出图范围，拿它去裁会裁掉真内容。
   */
  const plotWindow = (): { minX: number; minY: number; maxX: number; maxY: number } | undefined =>
    active.kind === 'layout' ? active.extent : undefined;
  let plotItems: readonly Drawn[] = drawn;
  // 真正的索引由紧跟着的 `indexPlotWindow()` 建；这里只是给个不为空的初值
  let plotScene: Scene = buildScene([]);
  const indexPlotWindow = (): void => {
    const box = plotWindow();
    plotItems = box ? itemsWithinBox(drawn, box) : drawn;
    plotScene = buildScene(plotItems);
  };
  indexPlotWindow();

  // ---- 量测（分册 31，FR-31.5 ~ FR-31.17；归属见 FR-35.15）----

  let measure: MeasureState = IDLE_MEASURE_STATE;
  /** 校准系数：图纸单位 → 用户报出的实际单位。只在图纸自己不写单位时可用（FR-31.16） */
  let calibration: number | undefined;
  let awaiting = false;

  const measureText = (): MeasureText => ({
    lang: payload.lang,
    units: payload.after.units,
    decimals: deps.decimals()
  });

  /** 这一组点的换算：出图比例（FR-31.14）之上再叠用户校准 */
  const scaleFor = (points: readonly (readonly [number, number])[]): MeasureScale => {
    const base = measureScale(active.kind, active.viewports, points);
    return calibration === undefined ? base : { ...base, factor: base.factor * calibration };
  };

  // ---- 吸附（分册 32，FR-32.10 ~ FR-32.14）----

  /** 捕捉半径按**屏幕像素**算：手感必须跟着缩放走（AC-32.10） */
  const SNAP_RADIUS_PX = 12;

  /** 纸面 → 视口里的模型空间，`projectThroughViewport` 的逆（AC-32.7） */
  const unproject = (transform: ReturnType<typeof viewportTransform>, x: number, y: number): [number, number] => {
    const ux = x - transform.cx;
    const uy = y - transform.cy;
    // 旋转矩阵的逆就是它的转置，`cos² + sin² = 1` 所以不必再除行列式
    const dx = ux * transform.cos + uy * transform.sin;
    const dy = -ux * transform.sin + uy * transform.cos;
    return [transform.vx + dx / transform.scale, transform.vy + dy / transform.scale];
  };

  /**
   * 指针落在世界点 `(worldX, worldY)` 时，本层该吸到哪儿（入出参都是共享世界坐标）。
   *
   * 图纸空间上只有图框，图形本体在视口里；所以除了纸面自己的场景，
   * 还要把指针反解进每个视口的模型空间各查一次，再把命中投回纸面。
   * 把模型几何整体投到纸面建索引也能做，但那等于把十几万个实体再离散化一遍。
   */
  const snap = (worldX: number, worldY: number): { x: number; y: number; kind: SnapKind | undefined } => {
    const [wx, wy] = toLocal(worldX, worldY);
    const radius = SNAP_RADIUS_PX / camera.scale;
    let best = snapAt(plotScene, wx, wy, radius);
    let bestRank = snapRank(best.kind);
    let bestDistance = Math.hypot(best.x - wx, best.y - wy);
    for (const [i, vp] of active.viewports.entries()) {
      const scene = viewportScenes[i];
      if (!scene) continue;
      if (Math.abs(wx - vp.center.x) > Math.abs(vp.width) / 2) continue;
      if (Math.abs(wy - vp.center.y) > Math.abs(vp.height) / 2) continue;
      const transform = viewportTransform(vp);
      if (Math.abs(transform.scale) < 1e-12) continue;
      const [mx, my] = unproject(transform, wx, wy);
      const hit = snapAt(scene, mx, my, radius / Math.abs(transform.scale));
      if (hit.kind === undefined) continue;
      const [bx, by] = projectThroughViewport(transform, hit.x, hit.y);
      const rank = snapRank(hit.kind);
      const distance = Math.hypot(bx - wx, by - wy);
      if (rank > bestRank || (rank === bestRank && distance >= bestDistance)) continue;
      best = { x: bx, y: by, kind: hit.kind };
      bestRank = rank;
      bestDistance = distance;
    }
    return { x: best.x + offset.dx, y: best.y + offset.dy, kind: best.kind };
  };

  /** 量测叠层的取色：单层时沿用分册 31 的配色，叠加时跟着本层的染色走（FR-35.15） */
  const strokeColor = (): string => deps.tint() ?? MEASURE_COLORS.stroke;
  const fillColor = (): string => {
    const tint = deps.tint();
    return tint === undefined ? MEASURE_COLORS.fill : withAlpha(tint, 0.16);
  };

  const paintMeasurement = (points: readonly (readonly [number, number])[], kind: MeasureKind, live: boolean): void => {
    if (points.length === 0) return;
    const screen = points.map(([x, y]) => toScreen(x, y));
    ctx.save();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = live ? MEASURE_COLORS.pending : strokeColor();
    if (screen.length > 1) {
      ctx.beginPath();
      ctx.moveTo(screen[0]![0], screen[0]![1]);
      for (const [x, y] of screen.slice(1)) ctx.lineTo(x, y);
      if (kind === 'area' && screen.length >= 3) {
        ctx.closePath();
        ctx.fillStyle = fillColor();
        ctx.fill();
      }
      ctx.stroke();
    }
    // 顶点也画出来：量完只剩一条线的话，看不出当初点在了哪儿
    ctx.fillStyle = live ? MEASURE_COLORS.pending : strokeColor();
    for (const [x, y] of screen) {
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  const paintLabel = (label: string, at: readonly [number, number]): void => {
    const [x, y] = toScreen(at[0], at[1]);
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const width = ctx.measureText(label).width;
    ctx.fillStyle = MEASURE_COLORS.labelBackground;
    ctx.fillRect(x - width / 2 - 6, y - 22, width + 12, 18);
    ctx.fillStyle = MEASURE_COLORS.label;
    ctx.fillText(label, x, y - 13);
    ctx.restore();
  };

  /** 吸附标记：形状分类型，旁边标出类型名（FR-32.14） */
  const paintSnap = (at: { x: number; y: number; kind: SnapKind }): void => {
    const [x, y] = toScreen(at.x, at.y);
    const r = 6;
    ctx.save();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = MEASURE_COLORS.snap;
    ctx.beginPath();
    if (at.kind === 'endpoint') {
      ctx.rect(x - r, y - r, r * 2, r * 2);
    } else if (at.kind === 'midpoint') {
      ctx.moveTo(x, y - r);
      ctx.lineTo(x + r, y + r);
      ctx.lineTo(x - r, y + r);
      ctx.closePath();
    } else if (at.kind === 'center') {
      ctx.arc(x, y, r, 0, Math.PI * 2);
    } else if (at.kind === 'intersection') {
      ctx.moveTo(x - r, y - r);
      ctx.lineTo(x + r, y + r);
      ctx.moveTo(x + r, y - r);
      ctx.lineTo(x - r, y + r);
    } else {
      ctx.moveTo(x, y - r);
      ctx.lineTo(x + r, y);
      ctx.lineTo(x, y + r);
      ctx.lineTo(x - r, y);
      ctx.closePath();
    }
    ctx.stroke();
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = MEASURE_COLORS.snap;
    ctx.fillText(t.snap[at.kind], x + r + 4, y + r + 6);
    ctx.restore();
  };

  /** 本层的量测叠层。`hover` 只有选中层收得到：橡皮筋跟的是正在量的那一层 */
  const paintOverlay = (
    target: CanvasRenderingContext2D,
    hover: { x: number; y: number; kind: SnapKind | undefined } | undefined
  ): void => {
    ctx = target;
    try {
      const text = measureText();
      for (const measurement of measure.measurements) {
        paintMeasurement(measurement.points, measurement.kind, false);
        const anchor = labelAnchor(measurement);
        const label = measurementLabel(measurement, scaleFor(measurement.points), text);
        if (anchor && label !== undefined) paintLabel(label, anchor);
      }
      const tool = measure.tool;
      if (tool === undefined || tool === 'erase') return;
      // 橡皮筋：已点的点后面接上指针，于是第二个点没落下之前也能看见线和读数（FR-32.15）
      const cursor = hover ? toLocal(hover.x, hover.y) : undefined;
      const trail = cursor ? [...measure.pending, cursor] : measure.pending;
      if (trail.length > 0) paintMeasurement(trail, tool, true);
      const live = cursor ? livePreview(measure, cursor) : undefined;
      if (live) {
        const anchor = labelAnchor(live);
        const label = measurementLabel(live, scaleFor(live.points), text);
        if (anchor && label !== undefined) paintLabel(label, anchor);
      }
      if (hover?.kind) {
        const [lx, ly] = toLocal(hover.x, hover.y);
        paintSnap({ x: lx, y: ly, kind: hover.kind });
      }
    } finally {
      ctx = baseCtx;
    }
  };

  const drawViewports = (): void => {
    for (const [i, vp] of active.viewports.entries()) {
      const scene = viewportScenes[i];
      if (!scene) continue;
      const transform = viewportTransform(vp);
      const [x0, y0] = toScreen(vp.center.x - vp.width / 2, vp.center.y + vp.height / 2);
      const [x1, y1] = toScreen(vp.center.x + vp.width / 2, vp.center.y - vp.height / 2);
      // 视口整体比几个像素还小就别钻进去了，画出来只是一坨噪点
      if (Math.abs(x1 - x0) < 8 || Math.abs(y1 - y0) < 8) continue;
      const clipX = Math.min(x0, x1);
      const clipY = Math.min(y0, y1);
      const clipW = Math.abs(x1 - x0);
      const clipH = Math.abs(y1 - y0);
      // 视口被裁掉的那部分屏幕不用查：剔除范围取「视口 ∩ 画面」（FR-32.7）
      const sx0 = Math.max(0, clipX);
      const sy0 = Math.max(0, clipY);
      const sx1 = Math.min(canvas.clientWidth || 1, clipX + clipW);
      const sy1 = Math.min(canvas.clientHeight || 1, clipY + clipH);
      if (sx1 <= sx0 || sy1 <= sy0) continue;
      if (Math.abs(transform.scale) < 1e-12) continue;
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      // 视口变换是「旋转 + 等比缩放 + 平移」，四个角的包围盒就是那块旋转矩形的包围盒
      for (const [cx, cy] of [
        [sx0, sy0],
        [sx1, sy0],
        [sx0, sy1],
        [sx1, sy1]
      ] as const) {
        const [px, py] = fromScreen(cx, cy);
        const [mx, my] = unproject(transform, px, py);
        if (mx < minX) minX = mx;
        if (mx > maxX) maxX = mx;
        if (my < minY) minY = my;
        if (my > maxY) maxY = my;
      }
      // 线宽与端点会越出包围盒一点，留出几个像素的余量，免得边上的线突然消失
      const margin = 8 / (camera.scale * Math.abs(transform.scale));
      const items = scene.query(minX - margin, minY - margin, maxX + margin, maxY + margin);
      if (items.length === 0) continue;
      ctx.save();
      ctx.beginPath();
      ctx.rect(clipX, clipY, clipW, clipH);
      ctx.clip();
      const project = (x: number, y: number): [number, number] => {
        const [px, py] = projectThroughViewport(transform, x, y);
        return toScreen(px, py);
      };
      // 视口里的内容按模型比例缩小了，线宽跟着细一点才不会糊成一片
      ctx.lineWidth = 1;
      for (const entry of items) {
        if (!visible(entry.item)) continue;
        ctx.globalAlpha = 0.85;
        paintEntity(entry, project, transform.scale);
      }
      drawTexts(items, project, transform.scale);
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  };

  /** 当前画面对应的世界矩形，外加一圈余量（线宽、端点会越出包围盒） */
  const visibleWorldBox = (): [number, number, number, number] => {
    const [x0, y1] = fromScreen(0, 0);
    const [x1, y0] = fromScreen(canvas.clientWidth || 1, canvas.clientHeight || 1);
    const margin = 8 / camera.scale;
    return [x0 - margin, y0 - margin, x1 + margin, y1 + margin];
  };

  const drawEntities = (): void => {
    if (disposed) return;
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    ctx.clearRect(0, 0, w, h);
    dense = 0;

    // 纸边就是画面的边：跨边界的实体在这里被切断，纸外一片黑（FR-30.3）
    const sheet = plotWindow();
    if (sheet) {
      const [wx0, wy0] = toScreen(sheet.minX, sheet.maxY);
      const [wx1, wy1] = toScreen(sheet.maxX, sheet.minY);
      ctx.save();
      ctx.beginPath();
      ctx.rect(Math.min(wx0, wx1), Math.min(wy0, wy1), Math.abs(wx1 - wx0), Math.abs(wy1 - wy0));
      ctx.clip();
    }

    if (active.kind === 'layout') drawViewports();

    const box = visibleWorldBox();
    const items = plotScene.query(box[0], box[1], box[2], box[3]);
    for (const entry of items) {
      if (!visible(entry.item)) continue;
      // 图纸自己的线宽打底（FR-25.3）
      ctx.lineWidth = strokeWidthPx(entry.item.entity.lineWeight);
      paintEntity(entry, toScreen, 1);
    }
    ctx.globalAlpha = 1;
    ctx.setLineDash([]);

    drawTexts(items, toScreen, 1);
    if (sheet) ctx.restore();
    // 因为太密而没画的填充要说出来：悄悄少画一块，用户以为看到的就是全貌（FR-24.3）
    if (denseNote) denseNote.textContent = dense > 0 ? t.dense(dense) : '';
  };

  /**
   * 画一条实体：先填充再描边。
   *
   * `project` 把世界坐标送到屏幕，`unit` 是这一层相对图纸的缩放
   * （视口里的内容比纸面小 `1/50`，虚线间距要跟着缩，否则看上去全是实线）。
   */
  const paintEntity = (entry: SceneItem, project: (x: number, y: number) => [number, number], unit: number): void => {
    const item = entry.item;
    fillEntity(item, project, unit);
    // 遮罩（WIPEOUT）不描边（FR-28.3）。AutoCAD 的 `WIPEOUTFRAME` 默认为 0，
    // 框是不显示的；照旧描出来会在图上多出几条图层色的边线
    if (item.entity.fill?.kind === 'mask') return;
    // 填充（HATCH）的边界环同样不描边（FR-29.1）。AutoCAD 从不画填充的边界，
    // 图上看见的轮廓一律来自另一条独立的多段线实体。实测 `2D.dwg` 的
    // `S-WC_HATCH` 上 6 条 HATCH 因此在 TR1 上多出 347 个橙色像素，原厂只有 26 个
    if (isHatch(item.entity)) return;
    ctx.strokeStyle = item.color;
    ctx.setLineDash(dashPattern(item, unit));
    strokeEntity(entry, project, unit);
    ctx.setLineDash([]);
  };

  /** 实体自己的线型换算到屏幕像素；装不下一个周期的线按实线画（FR-25.4） */
  const dashPattern = (item: Drawn, unit: number): number[] =>
    dashForGeometry(item.entity.dash, item.entity.geometry, camera.scale * unit);

  const fillEntity = (item: Drawn, project: (x: number, y: number) => [number, number], unit: number): void => {
    const fill = item.entity.fill;
    if (!fill) return;
    if (fill.kind === 'pattern') {
      // 图案是一堆独立线段，不是闭合面。
      // 剔除看的是图案线之间还剩几个像素，不是看比例尺——后者跟看不看得清没有因果关系
      if (patternSpacingPx(fill.segments, camera.scale * unit) < PATTERN_SPACING_FLOOR_PX) {
        dense += 1;
        return;
      }
      ctx.save();
      ctx.strokeStyle = item.color;
      ctx.globalAlpha *= 0.7;
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      ctx.beginPath();
      for (let i = 0; i + 3 < fill.segments.length; i += 4) {
        const [ax, ay] = project(fill.segments[i]!, fill.segments[i + 1]!);
        const [bx, by] = project(fill.segments[i + 2]!, fill.segments[i + 3]!);
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
      }
      ctx.stroke();
      ctx.restore();
      return;
    }
    ctx.save();
    ctx.beginPath();
    for (const loop of fill.loops) {
      loop.forEach((p, i) => {
        const [x, y] = project(p.x, p.y);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
    }
    if (fill.kind === 'mask') {
      // 遮罩的本意就是「把底下的东西盖掉」。原色下填底色即可。
      // 染色时不能填底色：那块底色会被一并染上再叠加，遮罩就从「挖掉一块」
      // 变成「多出一块发亮的实心」——所以直接把像素擦掉（FR-35.12）
      if (deps.tint() === undefined) {
        ctx.fillStyle = BACKGROUND;
        ctx.fill('evenodd');
      } else {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fill('evenodd');
      }
    } else {
      // AutoCAD 的实心填充是不透明的。叠一层 alpha 会把承重墙画成淡灰影，
      // 也会把宽多段线铺出的粗线变成半透的（FR-27.7）
      ctx.fillStyle = item.color;
      // 环的组合规则由解析端给（FR-28.4）：HATCH 是带岛的区域，需要奇偶规则
      // 才能把天井挖空；宽多段线铺出的带面是重叠四边形的并集，奇偶规则会把
      // 转角异或成洞。缺省按奇偶，与分册 23 行为一致
      ctx.fill(fill.rule === 'nonzero' ? 'nonzero' : 'evenodd');
    }
    ctx.restore();
  };

  const strokeEntity = (entry: SceneItem, project: (x: number, y: number) => [number, number], unit: number): void => {
    const geometry = entry.item.entity.geometry;
    if (!geometry) return;
    const px = camera.scale * unit;
    ctx.beginPath();
    if (geometry.kind === 'circle') {
      // 圆与弧走 canvas 原生路径：相似变换下圆还是圆，离散采样只会让它变成多边形
      const [cx, cy] = project(geometry.center.x, geometry.center.y);
      ctx.arc(cx, cy, Math.max(0.4, geometry.radius * px), 0, Math.PI * 2);
    } else if (geometry.kind === 'arc') {
      const [cx, cy] = project(geometry.center.x, geometry.center.y);
      // 屏幕 Y 翻转 ⇒ 角度反向，起止角也跟着换位
      ctx.arc(cx, cy, Math.max(0.4, geometry.radius * px), -geometry.endAngle, -geometry.startAngle);
    } else if (geometry.kind === 'point') {
      const [px0, py0] = project(geometry.at.x, geometry.at.y);
      ctx.moveTo(px0 - 2, py0);
      ctx.lineTo(px0 + 2, py0);
      ctx.moveTo(px0, py0 - 2);
      ctx.lineTo(px0, py0 + 2);
    } else if (geometry.kind === 'text') {
      return; // 文字单独一遍画，免得被线条的描边状态影响
    } else {
      // 离散化在切视图时已经算过一遍了（FR-32.5），这里只负责投到屏幕
      for (const line of entry.lines) {
        for (let i = 0; i + 1 < line.length; i += 2) {
          const [sx, sy] = project(line[i]!, line[i + 1]!);
          if (i === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
      }
    }
    ctx.stroke();
  };

  const drawTexts = (
    items: readonly SceneItem[],
    project: (x: number, y: number) => [number, number],
    unit: number
  ): void => {
    for (const entry of items) {
      const item = entry.item;
      const geometry = item.entity.geometry;
      if (geometry?.kind !== 'text' || !visible(item)) continue;
      const size = geometry.height * camera.scale * unit;
      // 小于 5 px 的字是一团糊，画出来只会把图糊住
      if (size < 5 || size > 400) continue;
      const [x, y] = project(geometry.at.x, geometry.at.y);
      ctx.save();
      ctx.translate(x, y);
      if (geometry.rotation) ctx.rotate(-geometry.rotation);
      ctx.fillStyle = item.color;
      // 字体族按图纸指定的字体文件来（FR-28.6）；字号一直就是图纸里的 `height`
      ctx.font = `${size}px ${fontFamilyOf(geometry.font)}`;
      // 宽度因子是字体样式里的横向拉伸，不是字号的一部分
      const widthFactor = geometry.font?.widthFactor;
      if (widthFactor !== undefined && widthFactor > 0 && widthFactor !== 1) ctx.scale(widthFactor, 1);
      // 锚点的语义跟着几何一起来（FR-25.2）。缺省时按左基线，也就是分册 24 的老样子
      ctx.textAlign = geometry.anchorX ?? 'left';
      ctx.textBaseline = geometry.anchorY === 'baseline' ? 'alphabetic' : (geometry.anchorY ?? 'alphabetic');
      const wrap = geometry.wrapWidth === undefined ? 0 : geometry.wrapWidth * camera.scale * unit;
      const lines = wrap > 0 ? wrapText((s) => ctx.measureText(s).width, geometry.text, wrap) : [geometry.text];
      // 多行要整体按锚点摆：`middle` 时首行要往上抬半个总高，否则整段往下坠
      const step = size * 1.2;
      const lift =
        lines.length === 1
          ? 0
          : geometry.anchorY === 'middle'
            ? -((lines.length - 1) * step) / 2
            : geometry.anchorY === 'bottom'
              ? -(lines.length - 1) * step
              : 0;
      lines.forEach((line, i) => ctx.fillText(line, 0, lift + i * step));
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  };

  // ---- 底图与合成 ----

  /** 底图是不是还能用：相机或对位一动它就过期了 */
  const baseStale = (): boolean =>
    baseState === undefined ||
    baseState.scale !== camera.scale ||
    baseState.x !== camera.x ||
    baseState.y !== camera.y ||
    baseState.dx !== offset.dx ||
    baseState.dy !== offset.dy;

  const renderBase = (): void => {
    if (disposed) return;
    const started = performance.now();
    ctx = baseCtx;
    drawEntities();
    // 染色是**显示滤镜**：把已经画出来的像素整体换色，不碰实体色与图层色（AC-35.16）
    const tint = deps.tint();
    if (tint !== undefined) {
      baseCtx.save();
      baseCtx.globalCompositeOperation = 'source-in';
      baseCtx.fillStyle = tint;
      baseCtx.fillRect(0, 0, canvas.clientWidth || 1, canvas.clientHeight || 1);
      baseCtx.restore();
    }
    baseState = { scale: camera.scale, x: camera.x, y: camera.y, dx: offset.dx, dy: offset.dy };
    lastBaseMs = performance.now() - started;
  };

  /** 把底图按「画它时的相机 / 对位」与现在的差值贴上来 */
  const composite = (target: CanvasRenderingContext2D): void => {
    if (!baseState) return;
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    // 底图正中央装的是世界点 (baseState.x, baseState.y)，现在它该出现在这儿；
    // 对位偏移的增量按屏幕像素补上，于是拖动对位时也是跟手的
    const ox = (baseState.x - camera.x) * camera.scale + w / 2 + (offset.dx - baseState.dx) * camera.scale;
    const oy = h / 2 - (baseState.y - camera.y) * camera.scale - (offset.dy - baseState.dy) * camera.scale;
    const k = camera.scale / baseState.scale;
    target.save();
    target.translate(ox, oy);
    target.scale(k, k);
    target.drawImage(baseCanvas, -w / 2, -h / 2, w, h);
    target.restore();
  };

  const invalidate = (): void => {
    baseState = undefined;
    deps.render();
  };

  // ---- 控制面板 ----

  const sel = <T extends HTMLElement>(base: string): T | null | undefined =>
    panel?.querySelector<T>(`#${CSS.escape(pid(base, index))}`);

  const list = sel<HTMLUListElement>('dwg-layers');
  list?.setAttribute('aria-label', t.layers);

  /**
   * 全选框（FR-36.5）。原先是一个「全选图层」按钮：它只能一路打开，
   * 想全关就得一个个点，而且按钮本身不显示当前是全开还是全关。
   * 复选框三种态一眼可见——全开是勾、全关是空、部分开是半选。
   */
  const allBox = sel<HTMLInputElement>('dwg-layers-all');
  const layerBoxes = (): HTMLInputElement[] => [
    ...(list?.querySelectorAll<HTMLInputElement>('input[type=checkbox]') ?? [])
  ];
  const syncAllBox = (): void => {
    if (!allBox) return;
    const boxes = layerBoxes();
    const shown = boxes.filter((box) => box.checked).length;
    allBox.checked = boxes.length > 0 && shown === boxes.length;
    allBox.indeterminate = shown > 0 && shown < boxes.length;
  };

  /** 图层表跟着当前视图走：图纸空间只有图框那几个图层，模型空间才有两百多个 */
  const renderLayers = (): void => {
    if (!list) return;
    list.textContent = '';
    const inViewports = viewportScenes.flatMap((scene) => scene.items.map((entry) => entry.item));
    for (const layer of usedLayers([...drawn, ...inViewports], payload.after)) {
      const li = document.createElement('li');
      const label = document.createElement('label');
      const box = document.createElement('input');
      box.type = 'checkbox';
      box.checked = !hidden.has(layer.name);
      box.dataset['layer'] = layer.name;
      const swatch = document.createElement('span');
      swatch.className = 'dwg-swatch';
      swatch.style.background = layer.color;
      const name = document.createElement('span');
      name.className = 'dwg-name';
      name.textContent = layer.name === '' ? '(0)' : layer.name;
      name.title = `${layer.name} · ${t.entities(layer.count)}`;
      label.append(box, swatch, name);
      li.append(label);
      list.append(li);
      on(box, 'change', () => {
        if (box.checked) hidden.delete(layer.name);
        else hidden.add(layer.name);
        syncAllBox();
        deps.scopeChanged('layers');
        invalidate();
      });
    }
    syncAllBox();
  };

  const viewButtons: HTMLButtonElement[] = [];

  const setView = (id: string): void => {
    activeViewId = id;
    active = pickView(payload.after, id);
    drawn = collectDrawn(payload, id);
    view = viewViewport(active, drawn);
    indexViewports();
    indexPlotWindow();
    renderLayers();
    for (const button of viewButtons) button.setAttribute('aria-current', String(button.dataset.viewId === id));
    // 空布局不是出错：明说它是空的，比留一张黑屏让人以为图纸读坏了强
    emptyText = drawn.length === 0 ? t.emptyView(active.name) : '';
    // 量测量的是当前这张纸上的坐标，换一张纸后同样的数字指的是别的地方（FR-31.11）
    measure = measureClear(measure);
    baseState = undefined;
    deps.scopeChanged('view');
    deps.refit();
  };

  // 视图树：图纸空间在上、模型空间在下，和制图软件里一样（FR-23.5）
  const tree = sel<HTMLElement>('dwg-views');
  if (tree && views.length > 1) {
    const groups: Array<[string, readonly DwgView[]]> = [
      [t.sheets, views.filter((v) => v.kind === 'layout')],
      [t.model, views.filter((v) => v.kind === 'model')]
    ];
    for (const [title, members] of groups) {
      if (members.length === 0) continue;
      const heading = document.createElement('p');
      heading.className = 'dwg-group';
      heading.textContent = title;
      tree.append(heading);
      for (const member of members) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset['viewId'] = member.id;
        const label = document.createElement('span');
        label.textContent = member.kind === 'model' ? t.modelView : member.name;
        const count = document.createElement('span');
        count.className = 'dwg-count';
        count.textContent = ` · ${t.entities(member.entities.length)}`;
        button.append(label, count);
        button.setAttribute('aria-current', String(member.id === activeViewId));
        tree.append(button);
        viewButtons.push(button);
        on(button, 'click', () => setView(member.id));
      }
    }
  }

  // 分页（FR-24.4）。空页不留标签：视图树在单视图图纸里本来就是空的，
  // 留一个点进去什么都没有的标签，比不放更让人以为是坏了
  interface Page {
    readonly name: string;
    readonly tab: HTMLButtonElement;
    readonly page: HTMLElement;
  }
  const pages: Page[] = [];
  for (const name of ['views', 'layers', 'props']) {
    const tab = sel<HTMLButtonElement>(`dwg-tab-${name}`);
    const page = sel<HTMLElement>(`dwg-page-${name}`);
    if (!tab || !page) continue;
    if (name === 'views' && viewButtons.length === 0) {
      tab.remove();
      page.remove();
      continue;
    }
    pages.push({ name, tab, page });
  }
  const showPage = (name: string): void => {
    for (const entry of pages) {
      const current = entry.name === name;
      entry.tab.setAttribute('aria-selected', String(current));
      // 一组标签在 Tab 键序列里只占一站，页内选择交给方向键
      entry.tab.tabIndex = current ? 0 : -1;
      entry.page.hidden = !current;
    }
  };
  if (pages.length > 0) showPage(pages[0]!.name);
  for (const [i, entry] of pages.entries()) {
    on(entry.tab, 'click', () => showPage(entry.name));
    on(entry.tab, 'keydown', (event) => {
      const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
      if (step === 0) return;
      event.preventDefault();
      const next = pages[(i + step + pages.length) % pages.length]!;
      showPage(next.name);
      next.tab.focus();
    });
  }

  const fitButton = sel<HTMLButtonElement>('dwg-fit');
  if (fitButton) on(fitButton, 'click', () => deps.refit());

  if (allBox) {
    on(allBox, 'change', () => {
      const show = allBox.checked;
      hidden.clear();
      for (const box of layerBoxes()) {
        box.checked = show;
        if (!show) hidden.add(box.dataset['layer'] ?? '');
      }
      // 点了这个框就是明确表态，半选态当场清掉
      allBox.indeterminate = false;
      deps.scopeChanged('layers');
      invalidate();
    });
  }

  const PICK_TOLERANCE_PX = 8;

  // 首次取景由上层的 `refit()` 统一做，这里只把面板与索引准备好
  indexViewports();
  renderLayers();
  emptyText = drawn.length === 0 ? t.emptyView(active.name) : '';

  return {
    index,
    offset,
    hidden: false,
    isEmpty: () => drawn.length === 0,
    emptyNote: () => emptyText,
    units: () => payload.after.units,
    components: () => active.components,
    hiddenLayers: () => hidden,
    drawnEntities: () => drawn.map((item) => item.entity),
    worldBox: () => ({
      minX: view.minX + offset.dx,
      minY: view.minY + offset.dy,
      maxX: view.maxX + offset.dx,
      maxY: view.maxY + offset.dy
    }),
    resize,
    invalidate,
    baseStale,
    renderBase,
    baseCost: () => lastBaseMs,
    composite,
    paintOverlay,
    snap,
    click: (wx, wy, px, py) => {
      const before = measure;
      const had = measure.measurements.length;
      measure = measureClick(measure, toLocal(wx, wy), () =>
        hitMeasurement(measure.measurements, toScreen, px, py, PICK_TOLERANCE_PX)
      );
      // 没选工具时状态原样返回（AC-31.14），连一次重绘都不欠
      if (measure === before) return false;
      if (awaiting && measure.measurements.length > had) awaiting = false;
      return true;
    },
    setTool: (next) => {
      measure = next === undefined ? { ...measure, tool: undefined, pending: [] } : measureSelect(measure, next);
      if (measure.tool !== 'distance') awaiting = false;
    },
    transition: (run) => {
      const next = run(measure);
      if (next === measure) return false;
      measure = next;
      return true;
    },
    dropTail: (epsilon) => {
      const next = measureCommit(measureDropTail(measure, epsilon));
      if (next === measure) return false;
      measure = next;
      return true;
    },
    calibrate: (typed) => {
      const reference = measure.measurements[measure.measurements.length - 1];
      if (!reference || !Number.isFinite(typed) || typed <= 0) return false;
      const raw =
        polylineLength(reference.points) * measureScale(active.kind, active.viewports, reference.points).factor;
      if (!(raw > 0)) return false;
      calibration = typed / raw;
      // 基准段只是把尺，留在图上会被当成一条真的量测
      measure = { ...measure, measurements: measure.measurements.slice(0, -1) };
      return true;
    },
    beginCalibration: () => {
      awaiting = true;
      measure = { ...measure, tool: 'distance', pending: [] };
    },
    awaitingReference: () => awaiting,
    dispose: () => {
      disposed = true;
      for (const off of listeners.splice(0)) off();
      if (list) list.textContent = '';
      if (tree) tree.textContent = '';
      if (denseNote) denseNote.textContent = '';
      emptyText = '';
    }
  };
}

export function mountDwgViewer(root: HTMLElement, payloadRaw: unknown): DwgViewerHandle | undefined {
  if (!isViewerPayload(payloadRaw)) return undefined;
  const payload: DwgViewerPayload = payloadRaw;
  const canvas = root.querySelector<HTMLCanvasElement>('#dwg-canvas');
  if (!canvas) return undefined;
  const viewCtx = canvas.getContext('2d');
  if (!viewCtx) return undefined;

  const t = TEXT[payload.lang];
  const camera: Camera = { scale: 1, x: 0, y: 0 };
  let decimals = 2;
  let disposed = false;

  const listeners: Array<() => void> = [];
  const on = <K extends keyof HTMLElementEventMap>(
    target: EventTarget,
    type: K,
    handler: (event: HTMLElementEventMap[K]) => void,
    options?: AddEventListenerOptions
  ): void => {
    target.addEventListener(type, handler as EventListener, options);
    listeners.push(() => target.removeEventListener(type, handler as EventListener, options));
  };

  const stacked = payload.drawings.length > 1;
  /** 叠放顺序，**自下而上**。数组第一份图纸初始在最上层（FR-35.9） */
  let order: number[] = payload.drawings.map((_, i) => payload.drawings.length - 1 - i);
  /** 选中层：初始是数组第一项，也就是初始的上层（FR-35.6） */
  let selected = 0;
  /** 染色开关（FR-35.12）。只有一层时恒为原色：没有什么要区分 */
  let tinted = stacked;
  /** 对位模式（FR-35.11）：开着的时候拖动画布挪的是选中层，不是视图 */
  let aligning = false;

  // 比差异的状态（分册 37）。声明得比它们的装配早：
  // 图层构造时就把 `scopeChanged` 交出去了，回调里碰得到这几个名字
  /** 比对范围，**公共世界坐标**（不带任何层偏移，FR-37.7） */
  let diffBox: DiffBox | undefined;
  let diffOutcome: DiffOutcome | undefined;
  /** 亮着的那一行，从 1 起数；表里的序号和图上的标记共用它 */
  let diffHighlight: number | undefined;
  let toleranceMm = DEFAULT_TOLERANCE_MM;
  let diffTimer: ReturnType<typeof setTimeout> | undefined;
  let boxDrag: { grip: Grip | 'move'; x: number; y: number; from: DiffBox } | undefined;
  /** 面板装配完了没。没装配前的作废通知一律不理 */
  let diffMounted = false;

  /** 这一层排在从上往下第几位；染色按这个取，于是换序时两色对调（FR-35.12） */
  const depthOf = (index: number): number => order.length - 1 - order.indexOf(index);
  const tintOf = (index: number): string | undefined =>
    tinted ? (STACK_TINTS[depthOf(index)] ?? STACK_TINTS[STACK_TINTS.length - 1]!) : undefined;

  let layers: Layer[] = [];
  const active = (): Layer => layers[selected]!;
  const visibleLayers = (): Layer[] => order.map((i) => layers[i]!).filter((layer) => !layer.hidden);

  const emptyLine = document.getElementById('dwg-empty');
  const syncEmpty = (): void => {
    if (!emptyLine) return;
    const shown = visibleLayers();
    // 两层都关掉不是出错，但也不能是一块无解释的黑屏（FR-35.8）
    if (shown.length === 0) {
      emptyLine.textContent = stacked ? t.allHidden : t.hiddenAll;
      return;
    }
    if (!shown.every((layer) => layer.isEmpty())) {
      emptyLine.textContent = '';
      return;
    }
    // 都没东西可画时，先说各层自己的原因（哪张纸是空的），说不出来才退回笼统那句
    const reasons = shown.map((layer) => layer.emptyNote()).filter((note) => note !== '');
    emptyLine.textContent = reasons.length > 0 ? reasons.join(' ') : t.hiddenAll;
  };

  const fit = (): void => {
    const boxes = visibleLayers()
      .filter((layer) => !layer.isEmpty())
      .map((layer) => layer.worldBox());
    if (boxes.length === 0) return;
    const minX = Math.min(...boxes.map((b) => b.minX));
    const minY = Math.min(...boxes.map((b) => b.minY));
    const maxX = Math.max(...boxes.map((b) => b.maxX));
    const maxY = Math.max(...boxes.map((b) => b.maxY));
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    const sx = w / Math.max(1e-9, maxX - minX);
    const sy = h / Math.max(1e-9, maxY - minY);
    camera.scale = Math.min(sx, sy) * 0.92;
    camera.x = (minX + maxX) / 2;
    camera.y = (minY + maxY) / 2;
  };

  const refit = (): void => {
    fit();
    for (const layer of layers) layer.invalidate();
    syncEmpty();
    restage();
  };

  layers = payload.drawings.map((content, index) =>
    createLayer({
      index,
      payload: { kind: 'dwg', lang: payload.lang, after: content },
      camera,
      canvas,
      t,
      tint: () => tintOf(index),
      decimals: () => decimals,
      render: () => render(),
      refit: () => refit(),
      scopeChanged: (reason) => (reason === 'layers' ? layersChanged() : invalidateDiff())
    })
  );

  const resize = (): void => {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(canvas.clientWidth * ratio));
    canvas.height = Math.max(1, Math.round(canvas.clientHeight * ratio));
    viewCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
    for (const layer of layers) layer.resize(ratio);
  };

  /** 屏幕 → 共享世界坐标（不带任何层偏移）。吸附与命中判定都在这套坐标里 */
  const fromScreen = (px: number, py: number): [number, number] => [
    (px - (canvas.clientWidth || 1) / 2) / camera.scale + camera.x,
    camera.y - (py - (canvas.clientHeight || 1) / 2) / camera.scale
  ];

  // ---- 量测：工具是全局的，标注归选中层（FR-35.15）----

  let tool: MeasureKind | 'erase' | undefined;
  let hover: { x: number; y: number; kind: SnapKind | undefined } | undefined;

  /**
   * 吸附候选取自**所有可见层**（FR-35.14）。
   *
   * 量一个差异点，两端常常分属两层；隐藏的层不参与——看不见的东西不该把光标吸走。
   */
  const snapPoint = (wx: number, wy: number): { x: number; y: number; kind: SnapKind | undefined } => {
    let best: { x: number; y: number; kind: SnapKind | undefined } = { x: wx, y: wy, kind: undefined };
    let bestRank = snapRank(undefined);
    let bestDistance = Infinity;
    for (const layer of visibleLayers()) {
      const hit = layer.snap(wx, wy);
      if (hit.kind === undefined) continue;
      const rank = snapRank(hit.kind);
      const distance = Math.hypot(hit.x - wx, hit.y - wy);
      if (rank > bestRank || (rank === bestRank && distance >= bestDistance)) continue;
      best = hit;
      bestRank = rank;
      bestDistance = distance;
    }
    return best;
  };

  // ---- 渲染节拍（分册 32，FR-32.1 ~ FR-32.4）----

  let settleTimer: ReturnType<typeof setTimeout> | undefined;
  /** 底图重绘超过这个耗时就不在交互中同步做了，单位毫秒 */
  const AFFORDABLE_BASE_MS = 12;
  const SETTLE_MS = 90;

  const renderBases = (): void => {
    for (const layer of visibleLayers()) if (layer.baseStale()) layer.renderBase();
  };

  const ensureBases = (): void => {
    const stale = visibleLayers().filter((layer) => layer.baseStale());
    if (stale.length === 0) return;
    // 首帧、切视图、`fit()` 之后一律当场画：这些时刻没有「上一张还能凑合看」的底图。
    // 便宜的图纸也当场画，于是行为与分册 32 之前逐帧等价（FR-32.2）
    const cost = stale.reduce((total, layer) => total + layer.baseCost(), 0);
    if (cost <= AFFORDABLE_BASE_MS) {
      if (settleTimer !== undefined) {
        clearTimeout(settleTimer);
        settleTimer = undefined;
      }
      renderBases();
      return;
    }
    // 已经排过一发就让它到点，不重排（FR-36.3）。
    //
    // 原先每来一帧就把补画推后 90 ms。静止时这没问题——最后一帧之后 90 ms 就画上了；
    // 可拖动时帧是连着来的，补画于是在**整段拖动里一次都落不了地**，
    // 画布自始至终贴着按下那一刻的底图，平移出去的边缘一路空着，
    // 松手才补齐——用户看到的就是「拖完新位置，图层才慢慢跟来」（分册 36 §2.2）。
    // 改成不重排之后，拖多久都是每 90 ms 补一次
    if (settleTimer !== undefined) return;
    settleTimer = setTimeout(() => {
      settleTimer = undefined;
      renderBases();
      composite();
    }, SETTLE_MS);
  };

  /**
   * 取景刚变过（首帧、切视图、`fit()`）：这一刻没有「上一张还能凑合看」的底图，
   * 再贵也当场画完再合成。交给 `ensureBases()` 按耗时判断的话，
   * 上一张纸画得慢就会把这一张也判成「贵」，于是切过去先是一段空白（FR-32.2）。
   */
  const restage = (): void => {
    if (settleTimer !== undefined) {
      clearTimeout(settleTimer);
      settleTimer = undefined;
    }
    renderBases();
    composite();
  };

  /**
   * 把各层底图按叠放顺序贴上来，再画叠层。
   *
   * 染色时用加法合成：两色相加溢出成白，于是重叠处自然是中性色，
   * 不必再去算「哪些像素两层都有」（FR-35.12）。
   */
  const composite = (): void => {
    if (disposed) return;
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    viewCtx.clearRect(0, 0, w, h);
    const shown = visibleLayers();
    viewCtx.save();
    if (tinted) viewCtx.globalCompositeOperation = 'lighter';
    for (const layer of shown) layer.composite(viewCtx);
    viewCtx.restore();
    // 量测叠在纸面裁剪之外：它是用户自己放上去的东西，不该被图框切掉。
    // 选中层最后画，于是正在量的那条线不会被另一层的标注压住
    for (const layer of shown) if (layer.index !== selected) layer.paintOverlay(viewCtx, undefined);
    if (!active().hidden) active().paintOverlay(viewCtx, hover);
    // 序号标记画在叠加层，不进底图（FR-37.20）：底图是图纸本身，标记不是
    paintDiff(viewCtx);
  };

  let frame: number | undefined;
  let lastFrameAt = 0;

  const paintFrame = (): void => {
    lastFrameAt = performance.now();
    ensureBases();
    composite();
    // 选框锚在图纸坐标上，平移缩放之后它在屏幕上的位置得跟着走（FR-37.7）
    syncBox();
  };

  /**
   * 同一帧里只合成一次（FR-32.3）。
   *
   * **首次调用是同步的**：单次点击、单次切换必须当场拿到像素，否则测试与截图都要跟时序赛跑。
   * 同一帧内接着来的调用才合并到 rAF——指针在 M4 上按 120 Hz 报点，
   * 逐个同步重绘会让事件队列越堆越长，松手之后画面还要再追好几秒。
   */
  function render(): void {
    if (frame !== undefined) return;
    if (performance.now() - lastFrameAt >= 8) {
      paintFrame();
      return;
    }
    frame = requestAnimationFrame(() => {
      frame = undefined;
      paintFrame();
    });
  }

  // ---- 交互 ----

  const onWheel = (event: WheelEvent): void => {
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    // 缩放要以指针为锚：不锚住的话放大几次目标就跑出屏幕了。
    // 相机是所有层共用的（FR-35.10）：两层各缩各的，屏幕上任何一处重合都不再有意义
    const beforeX = camera.x + (px - rect.width / 2) / camera.scale;
    const beforeY = camera.y - (py - rect.height / 2) / camera.scale;
    const factor = Math.exp(-event.deltaY * 0.0015);
    camera.scale = Math.min(1e7, Math.max(1e-7, camera.scale * factor));
    camera.x = beforeX - (px - rect.width / 2) / camera.scale;
    camera.y = beforeY + (py - rect.height / 2) / camera.scale;
    // 镜头一动，提示框原来指的那个圈就不在那了
    hideDiffTip();
    render();
  };

  let dragging: { x: number; y: number } | undefined;
  /**
   * 按下的位置，用来分辨「点了一下」和「拖着平移」。
   *
   * 量测正在进行时，拖拽和滚轮**照旧属于画布**（FR-31.6）：量一段墙常常要一边量一边挪视野，
   * 工具把拖拽吃掉的话，第二个点就永远点不到屏幕外的那一头。
   */
  let pressedAt: { x: number; y: number } | undefined;
  const CLICK_SLOP_PX = 4;

  const onPointerDown = (event: PointerEvent): void => {
    dragging = { x: event.clientX, y: event.clientY };
    pressedAt = { x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
  };

  /**
   * 指针停在哪儿、吸到了什么（FR-32.15 ~ FR-32.18）。
   *
   * 工具没激活时这里**一步都不走**：不查吸附、不重绘，画布行为与分册 31 完全一致（FR-32.20）。
   */
  const updateHover = (event: PointerEvent): void => {
    if (tool === undefined || tool === 'erase') {
      if (hover === undefined) return;
      hover = undefined;
      render();
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const [wx, wy] = fromScreen(event.clientX - rect.left, event.clientY - rect.top);
    hover = snapPoint(wx, wy);
    render();
  };

  const onPointerMove = (event: PointerEvent): void => {
    if (dragging) {
      const dx = (event.clientX - dragging.x) / camera.scale;
      const dy = (event.clientY - dragging.y) / camera.scale;
      if (aligning) {
        // 对位：挪的是选中层，视图不动（FR-35.11）
        active().offset.dx += dx;
        active().offset.dy -= dy;
      } else {
        camera.x -= dx;
        camera.y += dy;
      }
      dragging = { x: event.clientX, y: event.clientY };
    }
    // 拖拽时也要更新：一边挪视野一边量是常态，橡皮筋不能跟丢
    updateHover(event);
    // 拖拽中不接差异悬停：正在挪视野的人不是在问「这个圈是什么」
    if (dragging) hideDiffTip();
    else {
      const rect = canvas.getBoundingClientRect();
      syncDiffHover(event.clientX - rect.left, event.clientY - rect.top);
    }
    if (dragging) render();
  };

  const onPointerLeave = (): void => {
    hideDiffTip();
    if (hover === undefined) return;
    hover = undefined;
    render();
  };

  const onPointerUp = (event: PointerEvent): void => {
    const wasDragging = dragging !== undefined;
    dragging = undefined;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    const from = pressedAt;
    pressedAt = undefined;
    const moved = from !== undefined && Math.hypot(event.clientX - from.x, event.clientY - from.y) > CLICK_SLOP_PX;
    // 真拖过才补画：拖动期间贴的是旧底图，平移露出来的那一圈边没东西（FR-36.3）。
    // 点一下不补——`render()` 的节流是「离上一帧够久才同步、否则并进 rAF」，
    // 白补一发会把紧随其后的点击重绘挤进 rAF，点击就不再当场出像素
    if (wasDragging && moved) render();
    // 对完位再看差异表，表里的距离已经不是现在这个距离了（FR-37.18）
    if (aligning && wasDragging && moved) invalidateDiff();
    if (!from || event.type !== 'pointerup') return;
    if (moved) return;
    onCanvasClick(event);
  };

  const onCanvasClick = (event: PointerEvent): void => {
    // 对位模式下画布归对位用，点一下不该顺手落一个量测点
    if (aligning) return;
    const rect = canvas.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    const raw = fromScreen(px, py);
    // 落点用吸附后的位置：墙线端点在屏幕上只有一个像素，徒手点是点不中的（FR-32.10）
    const snapped = tool !== undefined && tool !== 'erase' ? snapPoint(raw[0], raw[1]) : undefined;
    const point = snapped ? [snapped.x, snapped.y] : raw;
    const waited = active().awaitingReference();
    if (!active().click(point[0]!, point[1]!, px, py)) return;
    if (waited && !active().awaitingReference()) askReferenceLength();
    render();
  };

  const onResize = (): void => {
    resize();
    for (const layer of layers) layer.invalidate();
    render();
  };

  // ---- 图层栈（FR-35.5 ~ FR-35.8）----

  const stackList = document.getElementById('dwg-stack-list');
  const activeBadge = document.getElementById('dwg-active');
  const stackHint = document.getElementById('dwg-stack-hint');
  /** 层名就取面板顶上那一行，两处永远是同一个字符串 */
  const nameOf = (index: number): string =>
    document.getElementById(pid('dwg-file', index))?.textContent?.trim() || t.drawing;

  const syncStack = (): void => {
    if (activeBadge) {
      activeBadge.hidden = !stacked;
      const tint = tintOf(selected);
      if (tint === undefined) activeBadge.style.removeProperty('color');
      else activeBadge.style.color = tint;
      const label = activeBadge.querySelector('.dwg-active-name');
      if (label) label.textContent = t.selected(nameOf(selected));
    }
    if (!stackList) return;
    stackList.textContent = '';
    // 列表自上而下就是叠放顺序：Photoshop 的约定，第一行压在最上面
    for (const index of [...order].reverse()) {
      const li = document.createElement('li');
      li.dataset['layer'] = String(index);
      const box = document.createElement('input');
      box.type = 'checkbox';
      box.checked = !layers[index]!.hidden;
      box.setAttribute('aria-label', nameOf(index));
      const chip = document.createElement('span');
      chip.className = 'dwg-stack-tint';
      chip.style.background = tintOf(index) ?? MEASURE_COLORS.stroke;
      const pick = document.createElement('button');
      pick.type = 'button';
      pick.className = 'dwg-stack-pick';
      pick.textContent = nameOf(index);
      pick.title = nameOf(index);
      pick.setAttribute('aria-pressed', String(index === selected));
      li.append(box, chip, pick);
      stackList.append(li);
      on(box, 'change', () => {
        // 隐藏的层不画也不吸附；选中态保留，再显示回来时不必重新选（FR-35.8）
        layers[index]!.hidden = !box.checked;
        syncStack();
        syncEmpty();
        invalidateDiff();
        render();
      });
      on(pick, 'click', () => {
        selected = index;
        for (const layer of layers) layer.setTool(layer.index === selected ? tool : undefined);
        syncStack();
        syncToolbar();
        render();
      });
    }
  };

  const swapButton = document.getElementById('dwg-stack-swap');
  if (swapButton) {
    on(swapButton, 'click', () => {
      // 换的是谁压谁，不是「我在操作谁」——选中层原样不动（FR-35.7）
      order = [...order].reverse();
      for (const layer of layers) layer.invalidate();
      syncStack();
      render();
    });
  }

  const tintButton = document.getElementById('dwg-stack-tint');
  if (tintButton) {
    on(tintButton, 'click', () => {
      tinted = !tinted;
      tintButton.setAttribute('aria-pressed', String(tinted));
      for (const layer of layers) layer.invalidate();
      syncStack();
      render();
    });
  }

  const alignButton = document.getElementById('dwg-stack-align');
  /**
   * 对位与量测共用画布左键，同时开着必然有一个是哑的——分册 35 选了让对位吞掉点击，
   * 于是距离/区域/角度整体失灵而用户毫不知情（分册 36 §2.1）。改成互相让位：
   * 谁被选中谁上台，另一边当场弹起并在提示行里说明（FR-36.1 / FR-36.2）。
   */
  const setAligning = (next: boolean): void => {
    if (aligning === next) return;
    aligning = next;
    alignButton?.setAttribute('aria-pressed', String(aligning));
    if (stackHint) stackHint.textContent = aligning ? t.alignHint : '';
    if (aligning && tool !== undefined) {
      tool = undefined;
      hover = undefined;
      for (const layer of layers) layer.setTool(undefined);
    }
    // 对位一开，已经摆在那儿的选框和表就不再算数（FR-37.9）
    if (aligning) invalidateDiff();
    syncToolbar();
  };
  if (alignButton) {
    on(alignButton, 'click', () => {
      setAligning(!aligning);
    });
  }

  const alignResetButton = document.getElementById('dwg-stack-align-reset');
  if (alignResetButton) {
    on(alignResetButton, 'click', () => {
      // 对歪了要回得去（FR-35.11）
      for (const layer of layers) {
        layer.offset.dx = 0;
        layer.offset.dy = 0;
        layer.invalidate();
      }
      invalidateDiff();
      render();
    });
  }

  // ---- 量测工具栏（FR-31.5）----

  const toolbar = document.getElementById('dwg-tools');
  const settingsPanel = document.getElementById('dwg-tools-panel');
  const hintLine = document.getElementById('dwg-tools-hint');
  const unitsLine = document.getElementById('dwg-tools-units');
  const lengthInput = document.getElementById('dwg-tools-length') as HTMLInputElement | null;
  const calibrateButton = document.getElementById('dwg-tools-calibrate') as HTMLButtonElement | null;
  const toolButtons = [...(toolbar?.querySelectorAll<HTMLButtonElement>('button[data-tool]') ?? [])];

  /** 两份图纸的单位不一致时必须说出来：跨层量出来的数没有可比性（FR-35.16） */
  const mixedUnits = (): boolean => new Set(layers.map((layer) => layer.units() ?? 'unitless')).size > 1;

  const syncToolbar = (): void => {
    for (const button of toolButtons) button.setAttribute('aria-pressed', String(button.dataset['tool'] === tool));
    if (hintLine) hintLine.textContent = tool === undefined ? '' : t.toolHint[tool];
    canvas.style.cursor = aligning ? 'move' : tool === undefined ? '' : 'crosshair';
    // 图纸自己写了单位就不该校准（FR-31.16）：那等于用手感覆盖掉文件里的事实
    const declared = active().units();
    const known = declared !== undefined && declared !== 'unitless';
    if (unitsLine) {
      const own = known ? t.unitsKnown(declared) : t.unitsUnknown;
      unitsLine.textContent = mixedUnits() ? `${own} ${t.unitsMixed}` : own;
    }
    if (calibrateButton) {
      calibrateButton.disabled = known;
      if (known) calibrateButton.title = t.unitsKnown(declared);
      else calibrateButton.removeAttribute('title');
    }
  };

  const selectTool = (next: MeasureKind | 'erase'): void => {
    setAligning(false);
    invalidateDiff();
    tool = tool === next ? undefined : next;
    for (const layer of layers) layer.setTool(layer.index === selected ? tool : undefined);
    if (tool === undefined || tool === 'erase') hover = undefined;
    syncToolbar();
    render();
  };

  const askReferenceLength = (): void => {
    if (!lengthInput) return;
    lengthInput.hidden = false;
    lengthInput.value = '';
    if (settingsPanel) settingsPanel.hidden = false;
    if (hintLine) hintLine.textContent = t.calibrateAsk;
    lengthInput.focus();
  };

  const applyCalibration = (): void => {
    if (!lengthInput) return;
    const typed = Number(lengthInput.value);
    if (!active().calibrate(typed)) return;
    lengthInput.hidden = true;
    if (hintLine) hintLine.textContent = t.calibrated(String(typed));
    render();
  };

  if (toolbar) {
    for (const button of toolButtons) {
      const id = button.dataset['tool'] as MeasureKind | 'erase';
      on(button, 'click', () => selectTool(id));
    }
    const clearButton = document.getElementById('dwg-tools-clear');
    if (clearButton) {
      // 清除只动选中层：量测工具一律作用在选中层上（FR-35.15）
      on(clearButton, 'click', () => {
        if (active().transition((state) => measureClear(state))) render();
      });
    }

    const settingsButton = document.getElementById('dwg-tools-settings');
    if (settingsButton && settingsPanel) {
      on(settingsButton, 'click', () => {
        settingsPanel.hidden = !settingsPanel.hidden;
        settingsButton.setAttribute('aria-expanded', String(!settingsPanel.hidden));
      });
    }

    const decimalsInput = document.getElementById('dwg-tools-decimals') as HTMLInputElement | null;
    if (decimalsInput) {
      on(decimalsInput, 'input', () => {
        const next = Number(decimalsInput.value);
        if (!Number.isFinite(next)) return;
        // 改完立刻对已有读数生效（FR-31.17）：让用户为一个显示设置重量一遍是没道理的
        decimals = Math.min(4, Math.max(0, Math.round(next)));
        render();
      });
    }

    if (calibrateButton) {
      on(calibrateButton, 'click', () => {
        tool = 'distance';
        active().beginCalibration();
        syncToolbar();
        if (hintLine) hintLine.textContent = t.calibratePrompt;
        render();
      });
    }
    if (lengthInput) {
      on(lengthInput, 'change', () => applyCalibration());
      on(lengthInput, 'keydown', (event) => {
        if (event.key === 'Enter') applyCalibration();
      });
    }
  }

  // ---- 按构件比差异（分册 37，FR-37.6 ~ FR-37.25）----

  const diffPanel = document.getElementById('dwg-diff');
  const diffRun = document.getElementById('dwg-diff-run') as HTMLButtonElement | null;
  const diffExport = document.getElementById('dwg-diff-export') as HTMLButtonElement | null;
  const diffSummaryLine = document.getElementById('dwg-diff-summary');
  const diffNoticeLine = document.getElementById('dwg-diff-notice');
  const diffToleranceRow = document.getElementById('dwg-diff-tolerance-row');
  const diffToleranceInput = document.getElementById('dwg-diff-tolerance') as HTMLInputElement | null;
  const diffScopeLine = document.getElementById('dwg-diff-scope');
  const diffRefusalLine = document.getElementById('dwg-diff-refusal');
  const diffCoverageLine = document.getElementById('dwg-diff-coverage');

  /** 拖停多久算「停了」再重算（FR-37.17）。拖动中每帧比一次会把界面拖垮 */
  const RECOMPUTE_MS = 150;
  /** 选框离未遮挡边界留的余量，屏幕像素 */
  const BOX_MARGIN_PX = 8;

  const GRIPS = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'] as const;
  type Grip = (typeof GRIPS)[number];
  const GRIP_AT: Record<Grip, [string, string]> = {
    nw: ['0%', '0%'],
    n: ['50%', '0%'],
    ne: ['100%', '0%'],
    w: ['0%', '50%'],
    e: ['100%', '50%'],
    sw: ['0%', '100%'],
    s: ['50%', '100%'],
    se: ['100%', '100%']
  };
  const GRIP_CURSOR: Record<Grip, string> = {
    nw: 'nwse-resize',
    n: 'ns-resize',
    ne: 'nesw-resize',
    w: 'ew-resize',
    e: 'ew-resize',
    sw: 'nesw-resize',
    s: 'ns-resize',
    se: 'nwse-resize'
  };

  /**
   * 选框是 DOM 而不是画布上画的一笔。
   *
   * 画布上画的框要自己实现命中判定，还得和平移、量测抢同一套指针事件；
   * 交给 DOM 之后框体 `pointer-events: none`，框**内**照旧能平移缩放画布，
   * 能抓的只有标签条与八个控制点——各管各的，谁也不吃掉谁的事件。
   */
  const boxEl = document.createElement('div');
  boxEl.id = 'dwg-diff-box';
  boxEl.hidden = true;
  const boxBar = document.createElement('div');
  boxBar.className = 'dwg-diff-bar';
  boxBar.id = 'dwg-diff-box-bar';
  boxEl.append(boxBar);
  const gripEls = GRIPS.map((grip) => {
    const el = document.createElement('span');
    el.className = 'dwg-diff-grip';
    el.dataset['grip'] = grip;
    const [left, top] = GRIP_AT[grip];
    el.style.left = left;
    el.style.top = top;
    el.style.cursor = GRIP_CURSOR[grip];
    boxEl.append(el);
    return [grip, el] as const;
  });
  canvas.parentElement?.append(boxEl);
  listeners.push(() => boxEl.remove());

  /** 差异说明的悬停提示（FR-39.18）。明细表撤下后，这是屏幕上问「这个圈是什么」的唯一去处 */
  const tipEl = document.createElement('div');
  tipEl.id = 'dwg-diff-tip';
  tipEl.hidden = true;
  canvas.parentElement?.append(tipEl);
  listeners.push(() => tipEl.remove());

  const toScreen = (wx: number, wy: number): [number, number] => [
    (wx - camera.x) * camera.scale + (canvas.clientWidth || 1) / 2,
    (canvas.clientHeight || 1) / 2 - (wy - camera.y) * camera.scale
  ];

  /** 参与比对的两层：按数组序取前两个可见层，于是「哪份是甲」不随叠放顺序变 */
  const diffPair = (): [Layer, Layer] | undefined => {
    const shown = [...visibleLayers()].sort((a, b) => a.index - b.index);
    const [first, second] = shown;
    return first && second ? [first, second] : undefined;
  };

  /** 对位偏移在这里交给引擎：比的是「对好位之后屏幕上还差多少」（FR-37.13） */
  const sideOf = (layer: Layer): DiffSide => ({
    components: layer.components() ?? [],
    entities: layer.drawnEntities(),
    hidden: layer.hiddenLayers(),
    shift: { x: layer.offset.dx, y: layer.offset.dy }
  });

  const initialBox = (): DiffBox => {
    const rect = canvas.getBoundingClientRect();
    let left = rect.left;
    let right = rect.right;
    let top = rect.top;
    let bottom = rect.bottom;
    // 侧栏、工具栏、当前层徽章压着的地方不算「可用画布」：
    // 控制点落到面板底下就再也抓不着了（AC-37.6）。
    // 余量只在**真有面板挡着**的那一边加——控制点是从框线向外溢出半个身子的，
    // 紧贴着面板边缘放就正好压上去；没面板的边不加，否则面积就不是那个八成了
    const rail = document.getElementById('dwg-rail')?.getBoundingClientRect();
    if (rail && rail.width > 0) left = Math.max(left, rail.right + BOX_MARGIN_PX);
    const tools = document.getElementById('dwg-tools')?.getBoundingClientRect();
    if (tools && tools.height > 0) bottom = Math.min(bottom, tools.top - BOX_MARGIN_PX);
    const badge = document.getElementById('dwg-active')?.getBoundingClientRect();
    if (badge && badge.height > 0) top = Math.max(top, badge.bottom + BOX_MARGIN_PX);
    if (right <= left || bottom <= top) {
      left = rect.left;
      right = rect.right;
      top = rect.top;
      bottom = rect.bottom;
    }
    // 八成**面积**，两个方向各收 √0.8——按边长收 0.8 会只剩六成四
    const k = Math.sqrt(0.8);
    const cx = (left + right) / 2;
    const cy = (top + bottom) / 2;
    const hw = ((right - left) / 2) * k;
    const hh = ((bottom - top) / 2) * k;
    const [x1, y1] = fromScreen(cx - hw - rect.left, cy - hh - rect.top);
    const [x2, y2] = fromScreen(cx + hw - rect.left, cy + hh - rect.top);
    return {
      minX: Math.min(x1, x2),
      minY: Math.min(y1, y2),
      maxX: Math.max(x1, x2),
      maxY: Math.max(y1, y2)
    };
  };

  const scopeText = (): string => {
    const pair = diffPair();
    if (!pair || !diffBox) return '';
    const [a, b] = pair;
    // 框内计数每次现算：拖动中也要跟手，等比对跑完再报就晚了（FR-37.11）
    const na = diffOutcome ? diffOutcome.counts.a : componentsInBox(sideOf(a), diffBox).length;
    const nb = diffOutcome ? diffOutcome.counts.b : componentsInBox(sideOf(b), diffBox).length;
    return t.diff.scope(nameOf(a.index), na, nameOf(b.index), nb);
  };

  const syncBox = (): void => {
    boxEl.hidden = diffBox === undefined;
    if (!diffBox) return;
    const [x1, y1] = toScreen(diffBox.minX, diffBox.maxY);
    const [x2, y2] = toScreen(diffBox.maxX, diffBox.minY);
    boxEl.style.left = `${Math.round(Math.min(x1, x2))}px`;
    boxEl.style.top = `${Math.round(Math.min(y1, y2))}px`;
    boxEl.style.width = `${Math.round(Math.abs(x2 - x1))}px`;
    boxEl.style.height = `${Math.round(Math.abs(y2 - y1))}px`;
    boxBar.textContent = scopeText();
  };

  const lengthText = (raw: number): string =>
    formatLength(raw, { space: 'model', factor: 1 }, { lang: payload.lang, units: active().units(), decimals });

  /**
   * 行文案在这里才拼出来。
   *
   * 引擎给的是结构化的差异（块名、距离、属性新旧值），不是句子——
   * 语言是随时能切的，存成句子就等于把当时的语言焊死在表里（FR-37.25）。
   */
  const describeRow = (row: DiffRow, nameA: string, nameB: string): string => {
    switch (row.kind) {
      case 'count':
        return t.diff.count(row.block, nameA, row.counts?.a ?? 0, nameB, row.counts?.b ?? 0);
      case 'moved':
        return t.diff.moved(row.block, lengthText(row.distance ?? 0));
      case 'attribute': {
        const change = row.attribute;
        return change ? t.diff.attribute(row.block, change.tag, change.from, change.to) : row.block;
      }
      case 'added':
        return t.diff.added(row.block, nameB);
      default:
        return t.diff.missing(row.block, nameB);
    }
  };

  /** 汇总按类型分项，计数为零的略去（FR-39.4）。明细表撤下后，这是面板上唯一的全局结论 */
  const SUMMARY_ORDER: readonly DiffKind[] = ['missing', 'added', 'count', 'moved', 'attribute'];

  const summaryText = (outcome: DiffOutcome): string => {
    const summary = summariseDiff(outcome.rows);
    // 零差异单说「没有差异」会被读成「两份图一致」，得把没参与比对的那一大块一并说了（FR-41.3）
    if (summary.total === 0) return t.diff.same(outcome.counts.a + outcome.counts.b, outcome.stray.a + outcome.stray.b);
    const parts = SUMMARY_ORDER.filter((kind) => summary.byKind[kind] > 0).map((kind) =>
      t.diff.kindPart(t.diff.kindLabel[kind], summary.byKind[kind])
    );
    // 悬停是纯鼠标交互，屏幕上没有任何东西暗示它存在，得明说一句
    return `${t.diff.summary(summary.total, parts)}${t.diff.howto}`;
  };

  const syncDiffPanel = (): void => {
    if (diffPanel) diffPanel.hidden = !stacked;
    const pair = diffPair();
    const comparable = pair !== undefined && pair.every((layer) => layer.components() !== undefined);
    if (diffRun) {
      diffRun.textContent = diffBox ? t.diff.clear : t.diff.compare;
      diffRun.disabled = diffBox === undefined && !comparable;
      const why = pair === undefined ? t.diff.oneVisible : comparable ? '' : t.diff.noComponents;
      if (why === '') diffRun.removeAttribute('title');
      else diffRun.title = why;
    }
    if (diffToleranceRow) diffToleranceRow.hidden = diffBox === undefined;
    if (diffScopeLine) diffScopeLine.textContent = scopeText();
    // 拒绝出结果时不给差异，但框内各有多少构件照报——那是用户接着自己判断的依据（FR-37.22）
    if (diffRefusalLine) diffRefusalLine.textContent = diffOutcome?.refused === true ? t.diff.refused : '';
    const shown = diffOutcome && !diffOutcome.refused ? diffOutcome : undefined;
    if (diffSummaryLine) diffSummaryLine.textContent = shown ? summaryText(shown) : '';
    if (diffCoverageLine) {
      // 零差异时这两个数已经并进汇总那句话，再单列一行就是重复（FR-41.3 / FR-41.4）
      const detailed = shown !== undefined && shown.rows.length > 0;
      diffCoverageLine.textContent = detailed
        ? t.diff.coverage(shown.counts.a + shown.counts.b, shown.stray.a + shown.stray.b)
        : '';
    }
    // 没结果可导时按钮不出现，而不是出现了点不动（FR-39.8）
    if (diffExport) diffExport.hidden = shown === undefined;
    syncBox();
  };

  const recompute = (): void => {
    const pair = diffPair();
    if (!diffBox || !pair || !pair.every((layer) => layer.components() !== undefined)) {
      diffOutcome = undefined;
      syncDiffPanel();
      render();
      return;
    }
    const box = diffBox;
    const tolerance = toleranceInDrawingUnits(toleranceMm, pair[0].units());
    diffOutcome = compareComponents(sideOf(pair[0]), sideOf(pair[1]), box, tolerance);
    diffHighlight = undefined;
    syncDiffPanel();
    render();
  };

  const scheduleRecompute = (): void => {
    if (diffTimer !== undefined) clearTimeout(diffTimer);
    diffTimer = setTimeout(() => {
      diffTimer = undefined;
      recompute();
    }, RECOMPUTE_MS);
  };

  /**
   * 「该比什么」变了：对位、换视图、换图纸层显隐（FR-37.18 / FR-40.2）。
   *
   * 已经算出来的差异当场作废——留着一份与画面对不上的结果，比没有结果更误导人。
   * 只改框、只改 CAD 图层显隐不走这里：那是**同一次比对换个口径**，重算就是了。
   */
  const invalidateDiff = (): void => {
    if (!diffMounted) return;
    if (diffBox !== undefined) clearDiff();
    // 没开着对比时也要同步：藏掉一层之后按钮该置灰，而那也是这一路通知进来的
    else syncDiffPanel();
  };

  /**
   * CAD 图层显隐变了（FR-40.1）。
   *
   * 图纸、选框、容差一样都没动，变的只是「少看几层」——和拖选框同一性质，
   * 所以重算而不是作废。用户关图层往往是为了在同一个范围里反复试，
   * 作废会连选框一起收走，那个用法就不成立了（分册 40 §2 其二）。
   */
  const layersChanged = (): void => {
    if (!diffMounted) return;
    // 按钮可用性当场跟上，不等那 150 ms
    syncDiffPanel();
    // 连点几个复选框合并成一次（FR-40.3）
    if (diffBox !== undefined) scheduleRecompute();
  };

  const clearDiff = (): void => {
    if (diffTimer !== undefined) {
      clearTimeout(diffTimer);
      diffTimer = undefined;
    }
    diffBox = undefined;
    diffOutcome = undefined;
    diffHighlight = undefined;
    boxDrag = undefined;
    if (stackHint && stackHint.textContent === t.diff.hint) stackHint.textContent = '';
    syncDiffPanel();
    render();
  };

  const startBoxDrag = (grip: Grip | 'move', event: PointerEvent, el: HTMLElement): void => {
    if (!diffBox) return;
    event.preventDefault();
    event.stopPropagation();
    boxDrag = { grip, x: event.clientX, y: event.clientY, from: { ...diffBox } };
    el.setPointerCapture(event.pointerId);
  };

  const moveBoxDrag = (event: PointerEvent): void => {
    if (!boxDrag) return;
    const dx = (event.clientX - boxDrag.x) / camera.scale;
    const dy = -(event.clientY - boxDrag.y) / camera.scale;
    const from = boxDrag.from;
    let { minX, minY, maxX, maxY } = from;
    if (boxDrag.grip === 'move') {
      minX += dx;
      maxX += dx;
      minY += dy;
      maxY += dy;
    } else {
      if (boxDrag.grip.includes('w')) minX += dx;
      if (boxDrag.grip.includes('e')) maxX += dx;
      if (boxDrag.grip.includes('n')) maxY += dy;
      if (boxDrag.grip.includes('s')) minY += dy;
    }
    // 拖过头就把框翻过来，不让它变成负尺寸
    diffBox = {
      minX: Math.min(minX, maxX),
      minY: Math.min(minY, maxY),
      maxX: Math.max(minX, maxX),
      maxY: Math.max(minY, maxY)
    };
    syncBox();
    if (diffScopeLine) diffScopeLine.textContent = scopeText();
  };

  const endBoxDrag = (event: PointerEvent): void => {
    if (!boxDrag) return;
    const el = event.currentTarget;
    if (el instanceof HTMLElement && el.hasPointerCapture(event.pointerId)) el.releasePointerCapture(event.pointerId);
    boxDrag = undefined;
    scheduleRecompute();
  };

  const armBoxHandle = (el: HTMLElement, grip: Grip | 'move'): void => {
    on(el, 'pointerdown', (event) => startBoxDrag(grip, event, el));
    on(el, 'pointermove', moveBoxDrag);
    on(el, 'pointerup', endBoxDrag);
    on(el, 'pointercancel', endBoxDrag);
  };
  armBoxHandle(boxBar, 'move');
  for (const [grip, el] of gripEls) armBoxHandle(el, grip);

  if (diffRun) {
    on(diffRun, 'click', () => {
      if (diffBox) {
        clearDiff();
        return;
      }
      // 量测与对位在选框存在期间收起（FR-37.9），和分册 36 的互让是同一条规矩
      setAligning(false);
      if (tool !== undefined) {
        tool = undefined;
        hover = undefined;
        for (const layer of layers) layer.setTool(undefined);
        syncToolbar();
      }
      diffBox = initialBox();
      if (stackHint) stackHint.textContent = t.diff.hint;
      recompute();
      // 汇总长在面板轨底下，不主动送进视野用户根本看不到它（FR-39.1）。
      // 滚的是汇总那一行而不是整个 #dwg-diff：面板轨矮的时候整块放不下，
      // `nearest` 会对齐顶部，把底下的汇总留在视野外，正好漏掉要看的那一行。
      // 只在开始比对这一下滚，拖框、改容差都不再打扰（FR-39.3）
      diffSummaryLine?.scrollIntoView({ block: 'nearest' });
    });
  }
  if (diffToleranceInput) {
    diffToleranceInput.value = String(toleranceMm);
    on(diffToleranceInput, 'input', () => {
      const next = Number(diffToleranceInput.value);
      if (!Number.isFinite(next) || next <= 0) return;
      // 改完当场重算：让用户为了换个容差再框一次是没道理的（FR-37.15）
      toleranceMm = next;
      recompute();
    });
  }
  if (diffExport) on(diffExport, 'click', () => void runDiffExport());
  diffMounted = true;
  syncDiffPanel();

  /**
   * 导出当前这次比对（分册 39 FR-39.9 ~ FR-39.15）。
   *
   * 出文件的两个模块都按需加载：不点导出的人不该为一个 OOXML 库付一次下载（FR-39.14）。
   * 说的是「已生成」不是「已下载」——沙箱页拿不到下载结果（FR-15.9 第 4 条）。
   */
  async function runDiffExport(): Promise<void> {
    const pair = diffPair();
    const outcome = diffOutcome;
    const box = diffBox;
    if (!diffExport || !pair || !box || !outcome || outcome.refused) return;
    const nameA = nameOf(pair[0].index);
    const nameB = nameOf(pair[1].index);
    diffExport.disabled = true;
    diffExport.textContent = t.diff.exporting;
    if (diffNoticeLine) diffNoticeLine.textContent = '';
    try {
      const [{ buildDiffWorkbook, diffWorkbookFilename }, { downloadBlob }] = await Promise.all([
        import('./dwgDiffWorkbook'),
        import('./export/download')
      ]);
      const input = {
        zh: payload.lang === 'zh',
        nameA,
        nameB,
        toleranceMm,
        box: { minX: box.minX, minY: box.minY, maxX: box.maxX, maxY: box.maxY },
        counts: outcome.counts,
        stray: outcome.stray,
        summary: summariseDiff(outcome.rows),
        kindLabel: t.diff.kindLabel,
        // 全量，不是屏幕上列出的那几条（FR-39.9）
        rows: outcome.rows.map((row, i) => ({
          no: i + 1,
          kind: row.kind,
          block: row.block,
          detail: describeRow(row, nameA, nameB),
          x: row.at.x,
          y: row.at.y
        })),
        at: new Date()
      };
      const filename = diffWorkbookFilename(input);
      downloadBlob(await buildDiffWorkbook(input), filename);
      if (diffNoticeLine) diffNoticeLine.textContent = t.diff.exported(filename);
    } catch (error) {
      const why = error instanceof Error ? error.message : String(error);
      if (diffNoticeLine) diffNoticeLine.textContent = t.diff.exportFailed(why);
    } finally {
      diffExport.disabled = false;
      diffExport.textContent = t.diff.exportLabel;
    }
  }

  /** 标记的半径（屏幕像素）。命中判定与绘制共用，改一处两处一起变 */
  const MARK_R = 8;
  const MARK_R_LIT = 11;

  /**
   * 序号标记（FR-37.20）。悬停命中的那一个换色并放大，
   * 让用户确认提示说的就是这一个（FR-39.19）。
   *
   * **不设上限**（FR-39.20）：实测 1000 个标记每帧约 2.7 ms，埋在底图的绘制噪声里。
   * 密集到读不清编号时用户放大画面即可，不为此在数据侧做截断。
   */
  function paintDiff(target: CanvasRenderingContext2D): void {
    if (!diffBox || !diffOutcome || diffOutcome.refused) return;
    target.save();
    target.font = '600 11px system-ui, sans-serif';
    target.textAlign = 'center';
    target.textBaseline = 'middle';
    diffOutcome.rows.forEach((row, i) => {
      const number = i + 1;
      const lit = diffHighlight === number;
      const [sx, sy] = toScreen(row.at.x, row.at.y);
      target.beginPath();
      target.arc(sx, sy, lit ? MARK_R_LIT : MARK_R, 0, Math.PI * 2);
      target.fillStyle = lit ? DIFF_COLORS.lit : DIFF_COLORS.mark;
      target.fill();
      target.lineWidth = 1.5;
      target.strokeStyle = DIFF_COLORS.ink;
      target.stroke();
      target.fillStyle = DIFF_COLORS.ink;
      target.fillText(String(number), sx, sy);
    });
    target.restore();
  }

  /**
   * 指针落在哪个标记上（FR-39.18）。从后往前找：后画的盖在上面，
   * 重叠时命中的该是用户看得见的那一个。
   */
  const markAt = (px: number, py: number): number | undefined => {
    if (!diffBox || !diffOutcome || diffOutcome.refused) return undefined;
    const rows = diffOutcome.rows;
    for (let i = rows.length - 1; i >= 0; i -= 1) {
      const row = rows[i];
      if (!row) continue;
      const [sx, sy] = toScreen(row.at.x, row.at.y);
      if (Math.hypot(px - sx, py - sy) <= MARK_R_LIT) return i + 1;
    }
    return undefined;
  };

  /**
   * 提示框贴着圆圈摆，但**不压住它**（FR-39.21）：默认在上方，
   * 顶上放不下就翻到下方；左右夹在画布内，免得贴边时被裁掉。
   */
  const placeTip = (number: number): void => {
    const pair = diffPair();
    const row = diffOutcome?.rows[number - 1];
    if (!pair || !row) return;
    tipEl.textContent = describeRow(row, nameOf(pair[0].index), nameOf(pair[1].index));
    tipEl.hidden = false;
    const [sx, sy] = toScreen(row.at.x, row.at.y);
    const w = tipEl.offsetWidth;
    const h = tipEl.offsetHeight;
    const gap = MARK_R_LIT + 6;
    const maxLeft = Math.max(0, (canvas.clientWidth || 0) - w - 4);
    tipEl.style.left = `${Math.min(Math.max(4, sx - w / 2), maxLeft)}px`;
    tipEl.style.top = sy - gap - h >= 4 ? `${sy - gap - h}px` : `${sy + gap}px`;
  };

  /** 收起提示。镜头一动、指针离开、开始拖拽时都要收——它指的那个圈已经不在原处了 */
  function hideDiffTip(): void {
    tipEl.hidden = true;
    if (diffHighlight === undefined) return;
    diffHighlight = undefined;
    render();
  }

  /** 悬停命中变了才重画：指针每动一下都重画整张图，代价比命中判定本身大得多 */
  const syncDiffHover = (px: number, py: number): void => {
    const hit = markAt(px, py);
    if (hit === diffHighlight) {
      if (hit !== undefined) placeTip(hit);
      return;
    }
    diffHighlight = hit;
    if (hit === undefined) tipEl.hidden = true;
    else placeTip(hit);
    render();
  };

  // 双击收尾区域（FR-31.8）。容差按屏幕像素折回图纸坐标，否则近景远景两套行为
  on(canvas, 'dblclick', () => {
    if (tool !== 'area') return;
    if (active().dropTail(CLICK_SLOP_PX / camera.scale)) render();
  });

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      if (active().transition((state) => measureAbort(state))) {
        hover = undefined;
        render();
      }
    } else if (event.key === 'Enter' && tool === 'area') {
      if (active().transition((state) => measureCommit(state))) render();
    }
  };
  on(window, 'keydown', onKeyDown);

  on(canvas, 'wheel', onWheel, { passive: false });
  on(canvas, 'pointerdown', onPointerDown);
  on(canvas, 'pointermove', onPointerMove);
  on(canvas, 'pointerup', onPointerUp);
  on(canvas, 'pointercancel', onPointerUp);
  on(canvas, 'pointerleave', onPointerLeave);
  window.addEventListener('resize', onResize);
  listeners.push(() => window.removeEventListener('resize', onResize));

  resize();
  syncStack();
  syncToolbar();
  refit();

  return {
    dispose: () => {
      disposed = true;
      // 排着的那一帧和补画底图的定时器都要撤掉，否则卸载后还会往已经没人看的画布上画
      if (frame !== undefined) cancelAnimationFrame(frame);
      frame = undefined;
      if (settleTimer !== undefined) clearTimeout(settleTimer);
      settleTimer = undefined;
      if (diffTimer !== undefined) clearTimeout(diffTimer);
      diffTimer = undefined;
      for (const off of listeners.splice(0)) off();
      for (const layer of layers) layer.dispose();
      if (emptyLine) emptyLine.textContent = '';
      if (stackList) stackList.textContent = '';
    }
  };
}

export type { DwgViewerPayload };
