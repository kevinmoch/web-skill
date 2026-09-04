/**
 * 文档投放面的 viewer 路由（SDK 分册 13）。
 *
 * 全站只有一个地址：入口由 SDK 内置的 `OpenDocument` 组件统一发起，宿主只在
 * 适配器的 `documentSurface` 装配位交出这一份。每份文档的查看偏好（隐藏打印胶囊、
 * 放大画布文字）因此不能再挂在 query 上，改由产物自己用 `data-viewer-*` 声明。
 *
 * 响应头（CSP + CORS）由 `vite.config.ts` 的 viewer 路由中间件挂，是宿主的部署责任——
 * `sandbox` 指令写在 `<meta>` 里会被忽略。
 */
import { withBase } from '../../base';

/** SDK 侧是 `window.open(viewerUrl)`：子路径/相对部署下不过 base 会打到站点根 */
export const VIEWER_URL = withBase('/viewer.html');
