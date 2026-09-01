import { BookOpen, Image as ImageIcon, MonitorSmartphone, Package } from 'lucide-react';
import { FadeIn } from '../../components/FadeIn';
import { chapterHash } from './DocsSidebar';
import DocsBadge from './DocsBadge';
import DocsImage from './DocsImage';
import { DOC_CHAPTERS, chapterTitle, hasChapterContent, splitEditionBadge } from '../../docs/manifest';

interface DocsHomeProps {
  t: (key: string, opts?: Record<string, unknown>) => any;
  isZh: boolean;
}

interface ReadingPath {
  title: string;
  desc: string;
  /** 章节号列表；空数组表示「按顺序读全部」，渲染成指向第 1 章的入口 */
  chapters: number[];
}

function ChapterChip({ t, isZh, num }: { t: DocsHomeProps['t']; isZh: boolean; num: number }) {
  const chapter = DOC_CHAPTERS.find((c) => c.num === num);
  if (!chapter) return null;
  const ready = hasChapterContent(chapter.slug, isZh);
  const title = splitEditionBadge(chapterTitle(chapter, isZh));
  const label = (
    <>
      <span className="truncate">
        {chapter.num}. {title.text}
      </span>
      {title.extensionOnly && <DocsBadge>{t('docs.badgeExtension')}</DocsBadge>}
    </>
  );
  if (!ready) {
    return (
      <span
        aria-disabled="true"
        className="flex cursor-not-allowed items-center gap-2 rounded-md border border-border-color px-3 py-1.5 text-sm text-text-dim opacity-50"
      >
        {label}
        <span className="shrink-0 font-mono text-[10px]">{t('docs.writing')}</span>
      </span>
    );
  }
  return (
    <a
      href={chapterHash(chapter.slug)}
      className="flex items-center gap-2 rounded-md border border-border-color px-3 py-1.5 text-sm text-text-dim transition-colors hover:border-accent/50 hover:text-accent"
    >
      {label}
    </a>
  );
}

/** 文档首页：阅读路径入口 + 版本基线 + 形态提示 + 总览图占位（M-01 后续补） */
export default function DocsHome({ t, isZh }: DocsHomeProps) {
  const paths = (t('docs.paths', { returnObjects: true }) as ReadingPath[]) ?? [];
  const versions = (t('docs.versions', { returnObjects: true }) as string[]) ?? [];

  return (
    <div className="max-w-[43rem]">
      <FadeIn>
        <h1 className="mb-3 text-[1.75rem] font-semibold tracking-[-0.02em] text-text-main min-[40rem]:text-[2rem]">
          {t('docs.homeTitle')}
        </h1>
        <p className="mb-10 leading-[1.75] text-text-dim">{t('docs.homeSubtitle')}</p>
      </FadeIn>

      {/* 阅读路径 */}
      <FadeIn delay={0.05}>
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-text-main">
          <BookOpen className="h-4 w-4 text-accent" />
          {t('docs.pathsTitle')}
        </h2>
        <div className="mb-10 grid gap-4 sm:grid-cols-2">
          {paths.map((path, i) => (
            <div
              key={i}
              className="flex flex-col rounded-lg border border-border-color p-4 transition-colors hover:border-accent/40"
            >
              <div className="mb-1 text-sm font-semibold text-text-main">{path.title}</div>
              <p className="mb-3 text-sm leading-6 text-text-dim">{path.desc}</p>
              <div className="mt-auto flex flex-col items-stretch gap-2">
                {path.chapters.length === 0 ? (
                  <a
                    href={chapterHash(DOC_CHAPTERS[0].slug)}
                    className="rounded-md border border-accent/40 px-3 py-1.5 text-sm text-accent transition-colors hover:bg-surface"
                  >
                    {t('docs.readAll')}
                  </a>
                ) : (
                  path.chapters.map((num) => <ChapterChip key={num} t={t} isZh={isZh} num={num} />)
                )}
              </div>
            </div>
          ))}
        </div>
      </FadeIn>

      {/* 版本基线 */}
      <FadeIn delay={0.1}>
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-text-main">
          <Package className="h-4 w-4 text-accent" />
          {t('docs.versionTitle')}
        </h2>
        <div className="mb-10 rounded-lg border border-border-color p-4">
          <p className="mb-3 text-sm text-text-dim">{t('docs.versionDesc')}</p>
          <ul className="flex flex-wrap gap-2">
            {versions.map((v) => (
              <li key={v} className="rounded border border-border-color bg-surface px-2 py-1 font-mono text-xs text-accent">
                {v}
              </li>
            ))}
          </ul>
        </div>
      </FadeIn>

      {/* 形态提示 */}
      <FadeIn delay={0.15}>
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-text-main">
          <MonitorSmartphone className="h-4 w-4 text-accent" />
          {t('docs.editionsTitle')}
        </h2>
        <div className="mb-10 rounded-lg border border-border-color p-4">
          <p className="text-sm leading-6 text-text-dim">{t('docs.editionsDesc')}</p>
        </div>
      </FadeIn>

      {/* 全书能力总览图（M-01，预渲染 SVG；figure+图注 与正文截图同款呈现，规范 §5） */}
      <FadeIn delay={0.2}>
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-text-main">
          <ImageIcon className="h-4 w-4 text-accent" />
          {t('docs.overviewTitle')}
        </h2>
        <DocsImage
          src="/docs-assets/intro/M-01.svg"
          alt={t('docs.overviewCaption')}
          imgClassName="mx-auto"
        />
      </FadeIn>
    </div>
  );
}
