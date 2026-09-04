import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'motion/react';
import { List, PenLine, X } from 'lucide-react';
import DocsSidebar from './DocsSidebar';
import DocsHome from './DocsHome';
import DocsChapter from './DocsChapter';
import { chapterBySlug, chapterTitle, getChapterContent } from '../../docs/manifest';

export interface DocsPageProps {
  t: (key: string, opts?: Record<string, unknown>) => any;
  /** 当前章 slug；null 表示文档首页。未知 slug 在 App 路由层已回落为 null */
  slug: string | null;
  /** 章内锚点（##/### 标题 id） */
  anchor: string | null;
  /**
   * 可选的侧栏顶部插槽（独立文档构建用来放语言切换——它没有主站 header，
   * 切换按钮需要新位置）。桌面端渲染在侧栏顶部，窄屏渲染在「菜单」那一行右侧；
   * 主站不传，布局完全不变。
   */
  sidebarTop?: ReactNode;
}

/**
 * 文档外壳：左侧章节树（17rem，60rem 以上常驻，窄屏折叠为抽屉）
 * + 正文区 + 右栏大纲（章节页内渲染）。`docs-root` 类承载视觉规范的作用域
 * CSS 变量与 CJK 断行规则（index.css，规范 §1/§2）。
 */
export default function DocsPage({ t, slug, anchor, sidebarTop }: DocsPageProps) {
  const { i18n } = useTranslation();
  const isZh = (i18n.resolvedLanguage || i18n.language || '').startsWith('zh');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const chapter = chapterBySlug(slug ?? undefined);
  // 语言切换不丢章节：slug 存在 location.hash 里，切语言只换内容、不动路由。
  // 某语言缺正文时 getChapterContent 回落到另一语言并标记 fallback（见 manifest.ts 注释）。
  const resolved = chapter ? getChapterContent(chapter.slug, isZh) : null;

  // 切章滚到顶部；带锚点时滚到锚点（scroll-mt-16 已把顶栏高度算进去，标题不会被遮）
  useEffect(() => {
    if (anchor) {
      const scroll = () => document.getElementById(anchor)?.scrollIntoView({ block: 'start' });
      const raf = requestAnimationFrame(scroll);
      // 字体/图片加载引起的二次位移兜底
      const timer = window.setTimeout(scroll, 120);
      return () => {
        cancelAnimationFrame(raf);
        window.clearTimeout(timer);
      };
    }
    window.scrollTo({ top: 0 });
  }, [slug, anchor, isZh]);

  const heading = chapter ? `${chapter.num}. ${chapterTitle(chapter, isZh)}` : t('docs.pageTitle');

  return (
    <div className="docs-root px-6 py-8 sm:px-10" lang={isZh ? 'zh' : 'en'}>
      {/* 窄屏顶栏：打开章节抽屉（侧栏 60rem 以上常驻，规范 §2 断点） */}
      <div className="mb-6 flex items-center gap-3 min-[60rem]:hidden">
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label={t('docs.menu')}
          className="flex items-center gap-2 rounded-md border border-border-color px-3 py-2 text-sm text-text-dim transition-colors hover:text-text-main"
        >
          <List className="h-4 w-4" />
          {t('docs.menu')}
        </button>
        <span className="truncate text-sm text-text-dim">{heading}</span>
        {sidebarTop && <div className="ml-auto shrink-0">{sidebarTop}</div>}
      </div>

      <div className="flex gap-10">
        {/* 桌面侧栏：17rem、底色 bg-alt（规范 §2/§6） */}
        <aside className="hidden w-[17rem] shrink-0 min-[60rem]:block">
          <div className="sticky top-6 flex h-[calc(100vh-4rem)] flex-col rounded-lg border border-[var(--docs-divider)] bg-surface p-4">
            {sidebarTop && <div className="mb-3 flex shrink-0 justify-end">{sidebarTop}</div>}
            <DocsSidebar t={t} isZh={isZh} currentSlug={slug} />
          </div>
        </aside>

        {/* 正文区 */}
        <div className="min-w-0 flex-1">
          {!chapter && <DocsHome t={t} isZh={isZh} />}
          {chapter && resolved && (
            <DocsChapter
              t={t}
              isZh={isZh}
              chapter={chapter}
              content={resolved.content}
              fallback={resolved.fallback}
            />
          )}
          {/* 深链到撰写中的章节：不白屏，给占位页 */}
          {chapter && !resolved && (
            <div className="max-w-[43rem]">
              <h1 className="mb-4 text-[1.75rem] font-semibold tracking-[-0.02em] text-text-main min-[40rem]:text-[2rem]">
                {heading}
              </h1>
              <div className="flex items-start gap-2 rounded-lg border border-border-color bg-surface px-4 py-3 text-sm text-text-dim">
                <PenLine className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span>{t('docs.writingDesc')}</span>
              </div>
              <a
                href="#/docs"
                className="mt-6 inline-block text-sm font-medium text-accent underline underline-offset-[0.125rem]"
              >
                {t('docs.backHome')}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* 窄屏抽屉（z-index 按规范 §6：遮罩 50 / 侧栏 60） */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-50 bg-bg/70 backdrop-blur-sm min-[60rem]:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed inset-y-0 left-0 z-[60] flex w-[280px] flex-col border-r border-border-color bg-bg p-4 min-[60rem]:hidden"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-[1px] text-text-dim">
                  {t('docs.sidebarTitle')}
                </span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  aria-label={t('docs.close')}
                  className="rounded-md p-1 text-text-dim transition-colors hover:text-text-main"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <DocsSidebar
                t={t}
                isZh={isZh}
                currentSlug={slug}
                onNavigate={() => setDrawerOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
