import { startViewerShell, watchBlockedResources } from '@webskill/sdk/browser';
import { mountViewerComponents, type ViewerComponentsHandle } from '@webskill/sdk/ui';

/**
 * viewer 页面入口（文档投放面）。
 *
 * 这份脚本是**受信外壳**，技能产出的 HTML/CSS 只作为数据写进 DOM。
 * 页面跑在 opaque origin：localStorage 一碰就抛、opener 读不到——这正是隔离生效的样子。
 * 参考 SDK 仓库 examples/chatbot-playground/src/viewer.ts（去掉了 e2e 探针）。
 */

const content = document.getElementById('viewer-content');
const style = document.getElementById('viewer-skill-style');
const blocked = document.getElementById('viewer-blocked');
if (!content || !style || !blocked) throw new Error('viewer shell is missing its mount points');

// 必须在文档写入**之前**挂上：CSP 违规事件不补发
watchBlockedResources(window, blocked);

let components: ViewerComponentsHandle | undefined;

startViewerShell(window, { content, style }, () => {
  // 每份文档重挂一次：旧实例不释放会连同 canvas 一起泄漏
  components?.dispose();
  applyDocumentChrome();
  // 图表画布文字（canvas，CSS 够不到）：产物声明 data-viewer-chart-font="lg" 时调大到投屏可读
  const fontSizes = docPref('viewerChartFont') === 'lg' ? { title: 16, axisLabel: 14, legend: 14 } : undefined;
  // 文档 HTML 里 data-webskill-component 占位 → 宿主预置组件（Chart/Table/Metric/Gauge/KeyValue 白名单）
  components = mountViewerComponents(content, fontSizes ? { fontSizes } : undefined);
});

/**
 * 查看偏好从**产物**里读，不从 URL 读：入口统一成 SDK 内置的 `OpenDocument` 之后，
 * viewer 地址全站只有一个，带不了「这一份怎么看」的信息。
 */
function docPref(key: string): string | undefined {
  return (content?.querySelector<HTMLElement>('[data-viewer-chrome], [data-viewer-chart-font]')?.dataset ?? {})[key];
}

window.addEventListener('pagehide', () => components?.dispose());

// 打印入口；allow-modals 保证 window.print() 不被静默吞掉
document.getElementById('viewer-print')?.addEventListener('click', () => window.print());

// 投屏场景：右上角胶囊可整条隐藏，角落留小圆钮恢复；
// 产物声明 data-viewer-chrome="hidden"（监控大屏这类纯展示投放面）时初始即隐藏，只留恢复钮
const chrome = document.getElementById('viewer-chrome');
const chromeRestore = document.getElementById('viewer-chrome-restore');
const hideChrome = () => {
  if (chrome) chrome.style.display = 'none';
  if (chromeRestore) chromeRestore.style.display = 'inline-flex';
};
const showChrome = () => {
  if (chrome) chrome.style.display = 'flex';
  if (chromeRestore) chromeRestore.style.display = 'none';
};
document.getElementById('viewer-chrome-hide')?.addEventListener('click', hideChrome);
chromeRestore?.addEventListener('click', showChrome);

function applyDocumentChrome(): void {
  if (docPref('viewerChrome') === 'hidden') hideChrome();
  else showChrome();
}
