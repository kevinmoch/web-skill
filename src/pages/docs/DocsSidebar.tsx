import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import DocsBadge from './DocsBadge';
import {
  DOC_PARTS,
  chaptersInPart,
  chapterTitle,
  hasChapterContent,
  splitEditionBadge,
  type DocChapter
} from '../../docs/manifest';

interface DocsSidebarProps {
  t: (key: string) => string;
  isZh: boolean;
  currentSlug: string | null;
  /** 窄屏抽屉里点击章节后收起抽屉 */
  onNavigate?: () => void;
}

export function chapterHash(slug: string): string {
  return `#/docs/${slug}`;
}

/** 左侧章节树：按 6 部分分组、当前章高亮、缺正文的章节显示「撰写中」不可点 */
export default function DocsSidebar({ t, isZh, currentSlug, onNavigate }: DocsSidebarProps) {
  const [query, setQuery] = useState('');

  const matches = (chapter: DocChapter): boolean => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      chapter.slug.includes(q) ||
      chapter.zh.toLowerCase().includes(q) ||
      chapter.en.toLowerCase().includes(q)
    );
  };

  const visibleParts = useMemo(
    () =>
      DOC_PARTS.map((part) => ({
        part,
        chapters: chaptersInPart(part.id).filter(matches)
        // matches 依赖 query；chaptersInPart 结果是稳定引用
      })).filter((group) => group.chapters.length > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query]
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <label className="flex items-center gap-2 rounded-md border border-border-color bg-bg px-3 py-2">
        <Search className="h-4 w-4 shrink-0 text-text-dim" />
        <input
          id="docs-chapter-search"
          name="docs-chapter-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('docs.searchPlaceholder')}
          aria-label={t('docs.searchPlaceholder')}
          className="w-full bg-transparent text-sm text-text-main outline-none placeholder:text-text-dim"
        />
      </label>
      <nav className="code-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
        {visibleParts.map(({ part, chapters }) => (
          <div key={part.id} className="mb-5">
            <div className="mb-2 font-mono text-xs uppercase tracking-[1px] text-text-dim">
              {isZh ? part.zh : part.en}
            </div>
            <ul className="space-y-0.5">
              {chapters.map((chapter) => {
                const ready = hasChapterContent(chapter.slug, isZh);
                const active = chapter.slug === currentSlug;
                const title = splitEditionBadge(chapterTitle(chapter, isZh));
                const inner = (
                  <>
                    <span className="mr-2 font-mono text-xs text-text-dim">{chapter.num}.</span>
                    <span className="min-w-0 flex-1">
                      {title.text}
                      {title.extensionOnly && <DocsBadge>{t('docs.badgeExtension')}</DocsBadge>}
                    </span>
                    {!ready && (
                      <span className="ml-2 shrink-0 rounded border border-border-color px-1 font-mono text-[10px] text-text-dim">
                        {t('docs.writing')}
                      </span>
                    )}
                  </>
                );
                return (
                  <li key={chapter.slug}>
                    {ready ? (
                      <a
                        href={chapterHash(chapter.slug)}
                        onClick={onNavigate}
                        aria-current={active ? 'page' : undefined}
                        className={`flex items-start rounded-md px-2 py-1.5 text-sm transition-colors ${
                          active
                            ? 'bg-surface font-semibold text-accent'
                            : 'text-text-dim hover:bg-surface hover:text-text-main'
                        }`}
                      >
                        {inner}
                      </a>
                    ) : (
                      <span
                        aria-disabled="true"
                        className="flex cursor-not-allowed items-start rounded-md px-2 py-1.5 text-sm text-text-dim opacity-50"
                      >
                        {inner}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        {visibleParts.length === 0 && (
          <p className="px-2 text-sm text-text-dim">{t('docs.searchEmpty')}</p>
        )}
      </nav>
    </div>
  );
}
