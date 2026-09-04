import { chapterBySlug } from './manifest';

export interface DocsRoute {
  slug: string | null;
  anchor: string | null;
}

/**
 * 从 location.hash 解析文档路由（hash 路由，零依赖、静态托管无需 rewrite）：
 *   #/docs                     文档首页
 *   #/docs/<slug>              某章
 *   #/docs/<slug>#<anchor>     章内锚点（## 标题 id）
 * 返回 null 表示 hash 与文档无关；未知 slug 回落为文档首页（slug: null），不白屏。
 *
 * 主站外壳（App.tsx）与独立文档外壳（DocsApp.tsx）共用本函数，
 * 两边的深链格式保持一致、可以互换。
 */
export function docsRouteFromHash(hash: string): DocsRoute | null {
  if (!/^#\/docs(\/|$)/.test(hash)) return null;
  const body = hash.slice('#/docs'.length);
  const [pathPart, anchorPart] = body.split('#');
  const slug = pathPart.replace(/^\//, '').split('/')[0] || null;
  // 锚点可能是中文标题的 slug，经地址栏/href 写入后会被百分号编码，这里解码回原始 id
  let anchor: string | null = null;
  if (anchorPart) {
    try {
      anchor = decodeURIComponent(anchorPart);
    } catch {
      anchor = anchorPart;
    }
  }
  return {
    slug: slug && chapterBySlug(slug) ? slug : null,
    anchor
  };
}
