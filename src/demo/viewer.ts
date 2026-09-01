import { startViewerShell, watchBlockedResources } from '@webskill/sdk/browser';
import { mountViewerComponents, type ViewerComponentsHandle } from '@webskill/sdk/ui';
import type { SlideDeckHandle, SlideView } from './viewerSlides';

/**
 * viewer 页面入口（文档投放面）。
 *
 * 这份脚本是**受信外壳**，技能产出的 HTML/CSS 只作为数据写进 DOM。
 * 页面跑在 opaque origin：localStorage 一碰就抛、opener 读不到——这正是隔离生效的样子。
 * 参考 SDK 仓库 examples/chatbot-playground/src/viewer.ts（去掉了 e2e 探针）。
 */

const mustFind = (id: string): HTMLElement => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`viewer shell is missing #${id}`);
  return el;
};
const content = mustFind('viewer-content');
const style = mustFind('viewer-skill-style');
const blocked = mustFind('viewer-blocked');

// 必须在文档写入**之前**挂上：CSP 违规事件不补发
watchBlockedResources(window, blocked);

let components: ViewerComponentsHandle | undefined;
let deck: SlideDeckHandle | undefined;
/** 投放时的原样 HTML：reveal 的打印版式会不可逆地改写 DOM，还原只能靠整篇重挂 */
let pristine = '';

startViewerShell(window, { content, style }, () => {
  pristine = content.innerHTML;
  void mount(null, false);
});

/**
 * 挂载一份文档。`restore` 为真时先把 DOM 写回投放时的原样——打印切换版式要用；
 * 刚投放的那一次不需要，白写一遍就是白解析一遍。
 */
async function mount(view: SlideView, restore: boolean): Promise<void> {
  // 每份文档重挂一次：旧实例不释放会连同 canvas 一起泄漏
  components?.dispose();
  deck?.dispose();
  deck = undefined;
  if (restore) content.innerHTML = pristine;
  applyDocumentChrome();
  // 图表画布文字（canvas，CSS 够不到）：产物声明 data-viewer-chart-font="lg" 时调大到投屏可读
  const fontSizes = docPref('viewerChartFont') === 'lg' ? { title: 16, axisLabel: 14, legend: 14 } : undefined;
  // 文档 HTML 里 data-webskill-component 占位 → 宿主预置组件（Chart/Table/Metric/Gauge/KeyValue 白名单）
  components = mountViewerComponents(content, fontSizes ? { fontSizes } : undefined);

  // reveal 只在幻灯片文档里加载：通报公文 / 监控大屏一个字节都不会拉
  if (docPref('viewerMode') !== 'slides') return;
  const slides = await import('./viewerSlides');
  const root = content.querySelector<HTMLElement>(slides.SLIDE_ROOT_SELECTOR);
  if (root) deck = await slides.mountSlideDeck(root, view);
}

/**
 * 查看偏好从**产物**里读，不从 URL 读：入口统一成 SDK 内置的 `OpenDocument` 之后，
 * viewer 地址全站只有一个，带不了「这一份怎么看」的信息。
 */
function docPref(key: string): string | undefined {
  return (content.querySelector<HTMLElement>('[data-viewer-chrome], [data-viewer-chart-font], [data-viewer-mode]')
    ?.dataset ?? {})[key];
}

window.addEventListener('pagehide', () => {
  components?.dispose();
  deck?.dispose();
});

// 打印入口；allow-modals 保证 window.print() 不被静默吞掉
document.getElementById('viewer-print')?.addEventListener('click', () => void printDocument());

/**
 * 幻灯片必须先切到 reveal 的分页版式，否则导出的 PDF 只有当前这一页。
 * 该版式是单向的（reveal 自己没有反向操作），所以打印完整篇重挂回普通视图。
 */
async function printDocument(): Promise<void> {
  if (!deck) {
    window.print();
    return;
  }
  const { settleCharts } = await import('./viewerSlides');
  await mount('print', true);
  await settleCharts();
  window.print();
  await mount(null, true);
}

// 投屏场景：右上角胶囊可整条隐藏，角落留小圆钮恢复；
// 产物声明 data-viewer-chrome="hidden"（监控大屏这类纯展示投放面）时初始即隐藏，只留恢复钮
const chrome = document.getElementById('viewer-chrome');
const chromeRestore = document.getElementById('viewer-chrome-restore');
// 用 hidden 属性而不是内联 style.display：内联声明压得过 viewer.html 里那条
// `@media print`，而胶囊是 fixed 的——压不住就会印在每一页的右上角
const hideChrome = () => {
  if (chrome) chrome.hidden = true;
  if (chromeRestore) chromeRestore.hidden = false;
};
const showChrome = () => {
  if (chrome) chrome.hidden = false;
  if (chromeRestore) chromeRestore.hidden = true;
};
document.getElementById('viewer-chrome-hide')?.addEventListener('click', hideChrome);
chromeRestore?.addEventListener('click', showChrome);

function applyDocumentChrome(): void {
  if (docPref('viewerChrome') === 'hidden') hideChrome();
  else showChrome();
}
