/**
 * 给根绝对路径（/docs-assets/...、/skills/builtin、/demo 等）加构建 base 前缀。
 *
 * 主站 base 恒为 '/'，本函数是零操作；独立文档构建（vite.docs.config.ts）默认 './'、
 * 也可用 DOCS_BASE 指定子路径（如 /docs/），让写死的根绝对图片、链接与运行时
 * 取回的资源在子路径部署下仍然可达。hash 与外链原样返回。
 *
 * 文档外壳与 demo 共用一份：demo 的内置技能播种、附件下载同样按根绝对路径写死。
 */
/**
 * 相对 base（'./'）下不能直接返回 './xxx'：产物里 demo 有两个入口——根上的 demo.html
 * 和目录索引用的 demo/index.html，两者 URL 深度不同，同一个相对路径会解析到两个位置。
 * 改为从本模块自身的 chunk 地址（恒为 <产物根>/assets/*.js）反推产物根，与页面 URL 无关。
 */
export const APP_BASE = import.meta.env.BASE_URL.startsWith('.')
  ? new URL('../', import.meta.url).href
  : import.meta.env.BASE_URL;

export function withBase(path: string): string {
  if (!path.startsWith('/')) return path;
  if (APP_BASE === '/') return path;
  return APP_BASE.replace(/\/+$/, '') + path;
}
