import Reveal from 'reveal.js';
import type { RevealConfig } from 'reveal.js';
import 'reveal.js/reveal.css';

/**
 * 幻灯片投放（reveal.js）。
 *
 * 技能产物只是**数据**：viewer 用 innerHTML 写入，里面的 `<script>` 本就不执行。
 * 所以 reveal 只能由这份**受信外壳**加载——CSP 的 `script-src` 也只放行宿主源。
 * 分工：技能吐 `<section>` 与主题样式，键盘、分页、缩放、PDF 版式全在这一侧。
 *
 * 本模块由 viewer.ts 动态 import：不是幻灯片的文档（通报公文 / 监控大屏）
 * 一个字节的 reveal 代码与样式都不会加载。
 */

/** 产物根节点上的模式标记；与 `data-viewer-chrome` / `data-viewer-chart-font` 同一条偏好通道 */
export const SLIDE_ROOT_SELECTOR = '[data-viewer-mode="slides"]';

export type SlideView = RevealConfig['view'];

/** reveal 的 .d.ts 漏了 `display`；运行时确有此项（默认 `'block'`），会被内联写到每一页上 */
type DeckConfig = RevealConfig & { display: string };

const DECK: DeckConfig = {
  // opaque origin 下 history.pushState 抛 SecurityError，凡是碰地址栏的都关掉
  hash: false,
  history: false,
  respondToHashChanges: false,
  // 图表是 canvas，被 reveal 的缩放放大就会糊；16:9 大画布让常见视口下的缩放系数接近 1
  width: 1600,
  height: 900,
  margin: 0.04,
  // 分析型内容是从上往下读的表和图，垂直居中会把标题顶到奇怪的位置
  center: false,
  // 每页当成 flex 列容器：短页把富余高度分给图表、脚注钉在底边，不会在 900px 舞台上留半屏空白。
  // 只能走配置——reveal 是内联写 display 的，CSS 里想盖只能用 !important，而那会把隐藏页一起显出来。
  display: 'flex',
  slideNumber: 'c/t',
  transition: 'slide'
};

export interface SlideDeckHandle {
  dispose(): void;
}

/**
 * reveal 的打印样式对每一页强制 `padding:0 !important; display:block !important`：
 * 技能写的内边距一到打印就没了（文字贴着纸边），靠 `display:flex` 分配高度的版式当场散架。
 * 分页排完后把这两项以**内联 !important** 写回——内联 important 压得过它那条选择器规则。
 *
 * 内边距必须在切版式**之前**量：那会儿页面还是技能样式说了算的样子。
 * display 则用外壳自己的 `DECK.display`，量不出来——技能被要求不写 display，reveal 才是写它的人。
 */
function keepAuthoredBox(root: HTMLElement): () => void {
  const padding = new Map<HTMLElement, string>();
  for (const section of root.querySelectorAll<HTMLElement>('.slides > section')) {
    padding.set(section, getComputedStyle(section).padding);
  }
  return () => {
    for (const [section, value] of padding) {
      section.style.setProperty('padding', value, 'important');
      section.style.setProperty('display', DECK.display, 'important');
    }
  };
}

/**
 * 舞台按固定的 1600×900 等比缩放并居中，四周必然剩下富余（外加 `margin` 那一圈）。
 * 这块富余是**外壳的**：技能的选择器够到的最外层就是 `.slides > section`，
 * 谁也写不到它上面。不接管就露出浏览器白底——深色投放面上一圈很厚的白框。
 *
 * 取色顺序是根节点、然后第一张有不透明底色的页；封面用渐变时 `backgroundColor`
 * 是透明的，所以要往后找，而不是认死第一页。
 */
function fillStageBackground(root: HTMLElement): () => void {
  const opaque = (element: HTMLElement): string | undefined => {
    const color = getComputedStyle(element).backgroundColor;
    // 透明的写法不止一种（关键字，或 alpha 为 0 的函数式记法），一律按末位 alpha 判
    const alpha = Number(/,\s*([\d.]+)\s*\)$/.exec(color)?.[1] ?? '1');
    return color === 'transparent' || alpha === 0 ? undefined : color;
  };
  const sections = Array.from(root.querySelectorAll<HTMLElement>('.slides > section'));
  const color = opaque(root) ?? sections.map(opaque).find((value) => value !== undefined);
  if (color === undefined) return () => undefined;

  // 写 body 而不是某个容器：背景会从 body 提升到画布，连滚动过头的区域也铺得到
  const previous = document.body.style.getPropertyValue('background-color');
  document.body.style.setProperty('background-color', color);
  return () => {
    document.body.style.setProperty('background-color', previous);
  };
}

export function mountSlideDeck(root: HTMLElement, view: SlideView): Promise<SlideDeckHandle> {
  // 框架的结构类由外壳加，技能只需标出「这份是幻灯片」
  root.classList.add('reveal');
  document.documentElement.classList.add('viewer-slides');

  const restoreBox = view === 'print' ? keepAuthoredBox(root) : undefined;
  // 必须在 reveal 接手之前取色：那会儿页面还是技能样式说了算的样子
  const restoreStage = fillStageBackground(root);

  const deck = new Reveal(root, { ...DECK, view });
  // 排分页是 reveal 内部的一段异步流程；不等 pdf-ready 就返回，调用方会在版式排完之前开打印
  const paginated =
    view === 'print' ? new Promise<void>((resolve) => deck.on('pdf-ready', () => resolve())) : Promise.resolve();

  return deck
    .initialize()
    .then(() => paginated)
    .then(() => {
      restoreBox?.();
      return {
        dispose: () => {
          deck.destroy();
          restoreStage();
          document.documentElement.classList.remove('viewer-slides');
          // print 视图是单向的：destroy 不摘这两个类，也不还 body 上的固定尺寸
          document.documentElement.classList.remove('reveal-print', 'print-pdf');
          document.body.style.removeProperty('width');
          document.body.style.removeProperty('height');
        }
      };
    });
}

/**
 * 等图表把尺寸跟上再拍照。
 *
 * 图表的 resize 走 ResizeObserver，是异步的；而 `window.print()` 是同步的。
 * 不等这一下，刚从 `display:none` 里出来的那几页会以 0×0 的画布进 PDF。
 */
export function settleCharts(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 300)));
  });
}
