import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DocsPage from './DocsPage';
import LanguageToggle from '../../components/LanguageToggle';
import { chapterBySlug, chapterTitle } from '../../docs/manifest';
import { docsRouteFromHash, type DocsRoute } from '../../docs/router';
import { withBase } from '../../base';

/**
 * 独立文档构建（pnpm build:docs → dist-docs/）的外壳。
 * 只含文档模块：左侧章节树 + 正文 + 右栏大纲 + 语言切换（放在侧栏顶部，
 * 因为没有主站 header）；没有主站的 header 导航、footer、回顶按钮。
 * hash 路由格式与主站一致（#/docs/<slug>[#锚点]），深链两边互换可用。
 */
export default function DocsApp() {
  const { t, i18n } = useTranslation();
  const [route, setRoute] = useState<DocsRoute>(
    () => docsRouteFromHash(window.location.hash) ?? { slug: null, anchor: null }
  );

  useEffect(() => {
    const onHashChange = () => {
      // 与主站回落规则一致：hash 与文档无关或为空时回到文档首页，不白屏
      setRoute(docsRouteFromHash(window.location.hash) ?? { slug: null, anchor: null });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    try {
      const isZh = (i18n.resolvedLanguage || i18n.language || '').startsWith('zh');
      const chapter = chapterBySlug(route.slug ?? undefined);
      const docsName = t('docs.pageTitle');
      document.title = chapter
        ? `${chapter.num}. ${chapterTitle(chapter, isZh)} - ${docsName} - webskill.ai`
        : `${docsName} - webskill.ai`;
      document.documentElement.lang = i18n.resolvedLanguage || i18n.language || 'en';
    } catch (e) {
      // ignore
    }
  }, [t, i18n.language, i18n.resolvedLanguage, route]);

  // 宽度与主站文档页一致：三栏规范放宽到 90rem（见 App.tsx 的 isDocs 分支）
  // 侧栏顶部行：demo 入口对齐左边框，语言切换在右；桌面端撑满侧栏宽度，
  // 窄屏（菜单行右侧）退回紧凑的一组。/demo 经 withBase 适配子路径部署
  const sidebarTop = (
    <div className="flex items-center justify-between gap-3 min-[60rem]:w-full">
      <a
        href={withBase('/demo')}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-medium text-accent hover:underline underline-offset-[0.125rem]"
      >
        {t('docs.demoEntry')}
      </a>
      <LanguageToggle />
    </div>
  );

  return (
    <div className="min-h-screen bg-bg text-text-main font-sans flex flex-col items-center">
      <main className="w-full max-w-[90rem] flex-1">
        <DocsPage t={t} slug={route.slug} anchor={route.anchor} sidebarTop={sidebarTop} />
      </main>
    </div>
  );
}
