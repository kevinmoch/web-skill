import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Languages } from 'lucide-react';
import { chapterHash } from './DocsSidebar';
import MarkdownBody, { DocsSlugContext, extractToc } from './MarkdownBody';
import { chapterTitle, prevNext, type DocChapter } from '../../docs/manifest';

interface DocsChapterProps {
  t: (key: string) => string;
  isZh: boolean;
  chapter: DocChapter;
  content: string;
  /** 当前语言缺正文、正在回落显示另一语言的内容 */
  fallback: boolean;
}

function PrevNextLink({
  t,
  isZh,
  label,
  chapter,
  dir
}: {
  t: (key: string) => string;
  isZh: boolean;
  label: string;
  chapter?: DocChapter;
  dir: 'prev' | 'next';
}) {
  if (!chapter) return <span className="flex-1" />;
  const Icon = dir === 'prev' ? ArrowLeft : ArrowRight;
  return (
    <a
      href={chapterHash(chapter.slug)}
      className={`group flex flex-1 items-center gap-3 rounded-lg border border-border-color px-4 py-3 transition-colors hover:border-accent/50 hover:bg-surface ${
        dir === 'next' ? 'flex-row-reverse text-right' : ''
      }`}
    >
      <Icon className="h-4 w-4 shrink-0 text-text-dim transition-colors group-hover:text-accent" />
      <span className="min-w-0">
        <span className="block font-mono text-xs text-text-dim">{label}</span>
        <span className="block truncate text-sm text-text-main transition-colors group-hover:text-accent">
          {chapter.num}. {chapterTitle(chapter, isZh)}
        </span>
      </span>
    </a>
  );
}

/**
 * 章节页：正文（43rem 列宽）+ 右栏大纲（h2/h3，滚动高亮，80rem 以上显示，
 * 列 16rem / 内容 14rem，底部渐隐遮罩——规范 §2/§6）+ 章底上一章/下一章。
 */
export default function DocsChapter({ t, isZh, chapter, content, fallback }: DocsChapterProps) {
  const articleRef = useRef<HTMLDivElement>(null);
  const toc = useMemo(() => extractToc(content), [content]);
  const [activeHeading, setActiveHeading] = useState('');

  useEffect(() => {
    setActiveHeading('');
    const root = articleRef.current;
    if (!root) return;
    // 阅读线判定：视口顶部 100px 以内最后一个越线的标题即「正在读」的小节
    const onScroll = () => {
      const headings = Array.from(root.querySelectorAll('h2[id], h3[id]'));
      let current = '';
      for (const h of headings) {
        if (h.getBoundingClientRect().top <= 100) current = h.id;
        else break;
      }
      setActiveHeading(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [content]);

  const { prev, next } = prevNext(chapter.slug);
  // 语言回落时正文实际语言与 UI 语言相反，CJK 断行规则按正文语言命中
  const contentLang = fallback ? (isZh ? 'en' : 'zh') : isZh ? 'zh' : 'en';

  return (
    <DocsSlugContext.Provider value={chapter.slug}>
      <div className="flex gap-10">
        <div ref={articleRef} className="min-w-0 flex-1">
          {fallback && (
            <div className="mb-6 flex items-start gap-2 rounded-lg border border-border-color bg-surface px-4 py-3 text-sm text-text-dim">
              <Languages className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <span>{t('docs.translationPending')}</span>
            </div>
          )}
          <MarkdownBody content={content} lang={contentLang} />
          <div className="mt-12 flex max-w-[43rem] flex-col gap-3 border-t border-[var(--docs-divider)] pt-6 sm:flex-row">
            <PrevNextLink t={t} isZh={isZh} label={t('docs.prev')} chapter={prev} dir="prev" />
            <PrevNextLink t={t} isZh={isZh} label={t('docs.next')} chapter={next} dir="next" />
          </div>
        </div>
        {toc.length > 0 && (
          <aside className="hidden w-[16rem] shrink-0 min-[80rem]:block">
            <div className="sticky top-6 w-[14rem]">
              <div className="mb-3 font-mono text-xs uppercase tracking-[1px] text-text-dim">
                {t('docs.toc')}
              </div>
              <div className="relative">
                <nav className="code-scrollbar max-h-[calc(100vh-10rem)] overflow-y-auto pb-8">
                  <ul className="space-y-1 border-l border-[var(--docs-divider)]">
                    {toc.map((item) => (
                      <li key={item.id}>
                        <a
                          href={`${chapterHash(chapter.slug)}#${item.id}`}
                          aria-current={activeHeading === item.id ? 'location' : undefined}
                          className={`-ml-px block border-l-2 py-1 text-sm transition-colors ${
                            item.level === 3 ? 'pl-6' : 'pl-3'
                          } ${
                            activeHeading === item.id
                              ? 'border-accent text-accent'
                              : 'border-transparent text-text-dim hover:text-text-main'
                          }`}
                        >
                          {item.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
                {/* 底部 2rem 渐隐遮罩（规范 §6） */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-bg to-transparent" />
              </div>
            </div>
          </aside>
        )}
      </div>
    </DocsSlugContext.Provider>
  );
}
