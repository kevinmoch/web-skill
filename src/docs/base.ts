/**
 * 给根绝对路径（/docs-assets/...、/demo 等）加构建 base 前缀。
 *
 * 主站 base 恒为 '/'，本函数是零操作；独立文档构建（vite.docs.config.ts）
 * 可用 DOCS_BASE 指定子路径（如 /docs/），让 markdown 里写死的根绝对
 * 图片与链接在子路径部署下仍然可达。hash 与外链原样返回。
 */
export function withBase(path: string): string {
  if (!path.startsWith('/')) return path;
  const base = import.meta.env.BASE_URL;
  if (base === '/') return path;
  return base.replace(/\/+$/, '') + path;
}
