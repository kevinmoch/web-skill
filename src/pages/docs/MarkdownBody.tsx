import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useState,
  type ReactElement,
  type ReactNode
} from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  Copy,
  Info,
  Lightbulb,
  Star,
  XCircle,
  type LucideIcon
} from 'lucide-react';
import DocsImage from './DocsImage';

/** 当前章 slug，供标题锚点 # 拼出可复制的深链（#/docs/<slug>#<id>） */
export const DocsSlugContext = createContext<string>('');

/** 从 React children 提取纯文本，用于给标题生成锚点 id */
function textOf(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (isValidElement(node)) return textOf((node.props as { children?: ReactNode }).children);
  return '';
}

/**
 * 标题 → 锚点 id。保留中日韩等字母与数字，空白折成连字符。
 * TOC 链接与标题 id 共用这个函数，两边必然一致。
 */
export function slugifyHeading(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[`*]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-');
}

export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

/** 从 Markdown 源提取 `##`/`###` 标题生成右栏大纲（规范 §6：只列 h2/h3）；跳过代码围栏内的内容 */
export function extractToc(markdown: string): TocItem[] {
  const out: TocItem[] = [];
  let inFence = false;
  for (const line of markdown.split('\n')) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m3 = /^###\s+(.+?)\s*#*\s*$/.exec(line);
    if (m3) {
      out.push({ id: slugifyHeading(m3[1]), text: m3[1], level: 3 });
      continue;
    }
    const m2 = /^##\s+(.+?)\s*#*\s*$/.exec(line);
    if (m2) out.push({ id: slugifyHeading(m2[1]), text: m2[1], level: 2 });
  }
  return out;
}

/** 标题 hover 左侧浮出的 # 锚点（样式在 index.css 的 .docs-h-anchor，规范 §2） */
function HeadingAnchor({ id }: { id: string }) {
  const slug = useContext(DocsSlugContext);
  return (
    <a
      href={slug ? `#/docs/${slug}#${id}` : `#${id}`}
      className="docs-h-anchor"
      aria-hidden="true"
      tabIndex={-1}
    >
      #
    </a>
  );
}

// ---------------------------------------------------------------------------
// 自定义容器（规范 §3）：写作规约的 `> **提示**：` 等 blockquote → 语义容器
// ---------------------------------------------------------------------------

type ContainerKind = 'tip' | 'info' | 'important' | 'warning' | 'danger';

const CONTAINER_STYLES: Record<ContainerKind, { bg: string; icon: LucideIcon }> = {
  tip: { bg: 'var(--docs-indigo-soft)', icon: Lightbulb },
  info: { bg: 'var(--docs-gray-soft)', icon: Info },
  important: { bg: 'var(--docs-purple-soft)', icon: Star },
  warning: { bg: 'var(--docs-yellow-soft)', icon: AlertTriangle },
  danger: { bg: 'var(--docs-red-soft)', icon: XCircle }
};

/**
 * 首段 `**标记**：` 的标签词 → 容器语义。顺序即优先级：
 * 「注意/警告」必须在「注（说明）」之前匹配（前者包含「注」字）。
 * 中英文标签都收，英文正文写作期可直接用 `> **Tip**：` 等。
 */
const CONTAINER_LABELS: ReadonlyArray<readonly [RegExp, ContainerKind]> = [
  [/^(注意|警告|warning|caution|⚠)/i, 'warning'],
  [/^(危险|danger|绝不允许)/i, 'danger'],
  [/^(仅扩展版|extension only|重要|important|★)/i, 'important'],
  [/^(提示|小提示|tip)/i, 'tip'],
  [/^(注|说明|note|info)/i, 'info']
];

/**
 * 判断子元素是否是我们注册的 p/strong 渲染器产物。
 * 注意：components 映射里覆盖过的标签，children 里元素的 type 是渲染函数而不是字符串。
 */
const isP = (c: ReactNode): c is ReactElement =>
  isValidElement(c) && (c.type === 'p' || c.type === renderP);
const isStrong = (c: ReactNode): c is ReactElement =>
  isValidElement(c) && (c.type === 'strong' || c.type === renderStrong);

function renderP({ children }: { children?: ReactNode }) {
  if (isLoneImage(children)) return <>{children}</>;
  return <p className="my-4 leading-[1.75]">{children}</p>;
}

function renderStrong({ children }: { children?: ReactNode }) {
  return <strong className="font-semibold text-text-main">{children}</strong>;
}

/** 摘掉首段的 `**标记**：` 前缀：去掉 strong 之前的空白、strong 本身、其后紧跟的冒号/空白；摘空则整段去掉 */
function stripLabel(firstP: ReactElement, body: ReactNode[]): ReactNode[] {
  const pKids = Children.toArray((firstP.props as { children?: ReactNode }).children);
  const strongIdx = pKids.findIndex(isStrong);
  let rest = pKids.slice(strongIdx + 1);
  if (typeof rest[0] === 'string') {
    const stripped = rest[0].replace(/^[：:]?\s*/, '');
    rest = stripped ? [stripped, ...rest.slice(1)] : rest.slice(1);
  }
  const out = body.filter((c) => c !== firstP);
  if (rest.length > 0) {
    out.unshift(cloneElement(firstP, {}, rest));
  }
  return out;
}

function renderBlockquote(children: ReactNode): ReactNode {
  const arr = Children.toArray(children);
  // react-markdown 会在块级子节点之间保留换行文本节点，首个元素不一定是 <p>，要找
  const firstP = arr.find(isP);
  if (firstP) {
    const pKids = Children.toArray((firstP.props as { children?: ReactNode }).children);
    // 标记必须是首段第一个非空白内容（防止正文里恰好加粗「注意」二字被误判成容器）
    const labelNode = pKids.find((c) => !(typeof c === 'string' && c.trim() === ''));
    if (isStrong(labelNode)) {
      const label = textOf((labelNode.props as { children?: ReactNode }).children).trim();
      const hit = CONTAINER_LABELS.find(([re]) => re.test(label));
      if (hit) {
        const kind = hit[1];
        const { bg, icon: Icon } = CONTAINER_STYLES[kind];
        return (
          <div
            data-container={kind}
            style={{ backgroundColor: bg }}
            className="my-4 rounded-lg px-4 py-3 text-[0.875rem] leading-[1.7142857] text-text-main [&_code]:text-[0.8125rem] [&_.docs-pre]:my-2 [&_.docs-pre]:border-0 [&_.docs-pre]:bg-transparent max-[40rem]:[&_.docs-pre]:-mx-4 max-[40rem]:[&_.docs-pre]:rounded-lg"
          >
            <p className="mb-1 flex items-center gap-1.5 font-semibold">
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </p>
            <div className="[&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0">
              {stripLabel(firstP, arr)}
            </div>
          </div>
        );
      }
    }
  }
  // 未识别的引用块：规范 §2 —— 左 2px divider 竖线 + text-2 色
  return (
    <blockquote className="my-4 border-l-2 border-[var(--docs-divider)] pl-4 text-text-dim [&>p]:my-2">
      {children}
    </blockquote>
  );
}

// ---------------------------------------------------------------------------
// 代码块壳：语言标签 + 复制按钮（规范 §4 第 1、2 条）
// ---------------------------------------------------------------------------

function CodeBlockShell({
  language,
  raw,
  children
}: {
  language: string;
  raw: string;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(raw);
    } catch {
      // 非安全上下文（如 http 局域网访问）下 clipboard API 不可用，退回 execCommand
      const ta = document.createElement('textarea');
      ta.value = raw;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } catch {
        // ignore
      }
      ta.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="docs-pre code-scrollbar group relative my-4 overflow-x-auto rounded-lg bg-surface max-[40rem]:-mx-6 max-[40rem]:rounded-none">
      <div className="absolute right-1 top-1 z-10 flex items-center gap-1">
        {/* 语言标签：hover 时隐去，让位给复制按钮 */}
        {language && !copied && (
          <span className="text-[0.75rem] text-text-dim transition-opacity group-hover:opacity-0">
            {language}
          </span>
        )}
        <button
          type="button"
          onClick={onCopy}
          aria-label={copied ? t('docs.copied') : t('docs.copy')}
          className={`flex h-10 min-w-10 items-center justify-center rounded-md border border-border-color px-2 text-text-dim backdrop-blur transition-opacity hover:bg-surface-hover hover:text-text-main ${
            copied ? 'opacity-100' : 'opacity-0 focus-visible:opacity-100 group-hover:opacity-100'
          }`}
        >
          {copied ? (
            <span className="flex items-center gap-1 text-xs text-accent">
              <Check className="h-3.5 w-3.5" />
              {t('docs.copied')}
            </span>
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 渲染映射（全部语义 token + .docs-root 作用域变量，规范 §1/§2）
// ---------------------------------------------------------------------------

/** 图片独占一段时不再裹 <p>，让 img 渲染器直接输出合法的 <figure>（容忍段落内换行空白节点） */
function isLoneImage(children: ReactNode): boolean {
  const kids = Children.toArray(children).filter(
    (c) => !(typeof c === 'string' && c.trim() === '')
  );
  return kids.length === 1 && isValidElement(kids[0]) && kids[0].type === renderImg;
}

function renderImg({ src, alt }: { src?: string; alt?: string }) {
  // 截图组件（规范 §5）：figure + figcaption（图注取 alt）+ 点击放大灯箱（DocsImage）
  return <DocsImage src={src} alt={alt} />;
}

const components: Components = {
  h1: ({ children }) => {
    const id = slugifyHeading(textOf(children));
    return (
      <h1
        id={id}
        className="mb-6 mt-1 scroll-mt-16 text-[1.75rem] font-semibold leading-tight tracking-[-0.02em] text-text-main min-[40rem]:text-[2rem]"
      >
        {children}
        <HeadingAnchor id={id} />
      </h1>
    );
  },
  h2: ({ children }) => {
    // 规范 §2：h2 上方 divider 分隔线 + padding-top 1.5rem + margin 3rem 0 1rem
    const id = slugifyHeading(textOf(children));
    return (
      <h2
        id={id}
        className="mb-4 mt-12 scroll-mt-16 border-t border-[var(--docs-divider)] pt-6 text-[1.5rem] font-semibold leading-snug text-text-main"
      >
        {children}
        <HeadingAnchor id={id} />
      </h2>
    );
  },
  h3: ({ children }) => {
    // h3 与 h2 同款上方分隔线（用户评审要求，覆盖规范 §2 的 VitePress 原文；
    // 偏离说明见 index.css .docs-root 头部注释）。间距比 h2 略收：
    // margin 2.5rem 0 0 + padding-top 1.25rem，小节「结束感」合计 3.75rem 间隔
    const id = slugifyHeading(textOf(children));
    return (
      <h3
        id={id}
        className="mt-10 scroll-mt-16 border-t border-[var(--docs-divider)] pt-5 text-[1.25rem] font-semibold text-text-main"
      >
        {children}
        <HeadingAnchor id={id} />
      </h3>
    );
  },
  h4: ({ children }) => {
    const id = slugifyHeading(textOf(children));
    return (
      <h4 id={id} className="mt-6 scroll-mt-16 text-[1.125rem] font-semibold text-text-main">
        {children}
        <HeadingAnchor id={id} />
      </h4>
    );
  },
  p: renderP,
  a: ({ children, href }) => {
    // 规范 §2：brand-1 + 下划线（offset .125rem）+ 字重 500；§6：外链自动追加小箭头
    const external = !!href && href.includes('://');
    return (
      <a
        href={href}
        className="font-medium text-accent underline underline-offset-[0.125rem]"
        {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      >
        {children}
        {external && <ArrowUpRight className="ml-0.5 inline h-3 w-3 align-baseline" />}
      </a>
    );
  },
  strong: renderStrong,
  ul: ({ children }) => <ul className="my-4 list-disc pl-5 [&>li+li]:mt-2">{children}</ul>,
  ol: ({ children }) => <ol className="my-4 list-decimal pl-5 [&>li+li]:mt-2">{children}</ol>,
  li: ({ children }) => <li className="leading-[1.75] [&>p]:my-1">{children}</li>,
  blockquote: ({ children }) => renderBlockquote(children),
  hr: () => <hr className="my-8 border-[var(--docs-divider)]" />,
  table: ({ children }) => (
    // 规范 §2：整体 overflow-x auto；th .875rem text-2 色 surface 底；偶数行 surface 底
    <div className="code-scrollbar my-4 overflow-x-auto rounded-lg border border-[var(--docs-divider)]">
      <table className="w-full border-collapse text-[0.875rem] [&_tbody_tr:nth-child(even)]:bg-surface">
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th className="bg-surface px-3 py-2 text-left text-[0.875rem] font-semibold text-text-dim">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="px-3 py-2 align-top">{children}</td>,
  img: renderImg,
  // 代码块容器（规范 §4）：底色 bg-alt、圆角 .5rem；40rem 以下取消圆角并左右出血
  pre: ({ children }) => {
    let language = '';
    let raw = '';
    if (isValidElement(children)) {
      const cls = (children.props as { className?: string }).className ?? '';
      language = /language-([\w-]+)/.exec(cls)?.[1] ?? '';
      raw = textOf((children.props as { children?: ReactNode }).children);
    }
    return (
      <CodeBlockShell language={language} raw={raw}>
        {children}
      </CodeBlockShell>
    );
  },
  code: ({ className, children }) => {
    const text = String(children ?? '').replace(/\n$/, '');
    const match = /language-([\w-]+)/.exec(className ?? '');
    if (match) {
      // 与 Implement/Standards 页同一高亮主题；padding 按规范 §4（pre 上下 1.25rem、code 左右 1.5rem）
      return (
        <SyntaxHighlighter
          language={match[1]}
          style={vscDarkPlus}
          PreTag="div"
          customStyle={{
            margin: 0,
            padding: '1.25rem 1.5rem',
            background: 'transparent',
            fontSize: '0.875em',
            lineHeight: 1.7,
            minWidth: '100%',
            width: 'max-content'
          }}
        >
          {text}
        </SyntaxHighlighter>
      );
    }
    // 无语言标记的围栏块：纯文本块
    if (text.includes('\n')) {
      return (
        <code className="block min-w-full whitespace-pre px-6 py-5 font-mono text-[0.875em] leading-[1.7] text-text-main">
          {text}
        </code>
      );
    }
    // 行内代码（规范 §4）：brand-1 文字 + default-soft 半透明底，叠在容器 soft 底上自然加深
    return (
      <code className="break-all rounded bg-[var(--docs-gray-soft)] px-[0.375rem] py-[0.1875rem] font-mono text-[0.875em] text-accent">
        {children}
      </code>
    );
  }
};

/**
 * 文档正文渲染。`lang` 是正文实际语言（语言回落时与 UI 语言不同），
 * 供 CJK line-break: strict 规则正确命中。
 */
export default function MarkdownBody({ content, lang }: { content: string; lang?: string }) {
  return (
    <div className="max-w-[43rem] text-base" lang={lang}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
