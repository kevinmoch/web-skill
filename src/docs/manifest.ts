/**
 * 文档章节清单 —— 全站唯一真相。
 *
 * 章节顺序、slug、双语标题、所属部分只在这里维护；
 * 侧栏分组、上一章/下一章、路由校验全部从它派生
 * （与 SDK 中 CONSOLE_NAV 同一种设计模式）。
 *
 * slug 与 docs-authoring/01-architecture/01-information-architecture.md §2 严格一致，
 * 确定后不要改（外链会失效）。正文文件名为 `NN-<slug>.md`，NN 与 num 对齐。
 */

export interface DocPart {
  id: string;
  zh: string;
  en: string;
}

export interface DocChapter {
  /** 1..30，全局连续编号，也是文件名前缀 */
  num: number;
  /** 路由与锚点用标识 */
  slug: string;
  zh: string;
  en: string;
  /** DocPart.id */
  part: string;
}

export const DOC_PARTS: DocPart[] = [
  { id: 'start', zh: '开始使用', en: 'Getting Started' },
  { id: 'chat', zh: '对话', en: 'Conversations' },
  { id: 'page', zh: '页面能力', en: 'Page Capabilities' },
  { id: 'console', zh: '控制台', en: 'Console' },
  { id: 'cases', zh: '场景实战', en: 'Case Studies' },
  { id: 'reference', zh: '参考', en: 'Reference' }
];

export const DOC_CHAPTERS: DocChapter[] = [
  // 第一部分 · 开始使用
  { num: 1, slug: 'intro', zh: '认识 WebSkill 助手', en: 'Meet the WebSkill Assistant', part: 'start' },
  { num: 2, slug: 'editions', zh: '网页版与扩展版', en: 'Web and Extension Editions', part: 'start' },
  { num: 3, slug: 'quickstart', zh: '五分钟上手', en: 'Up and Running in Five Minutes', part: 'start' },
  // 第二部分 · 对话
  { num: 4, slug: 'chat-tour', zh: '对话界面导览', en: 'A Tour of the Chat Interface', part: 'chat' },
  { num: 5, slug: 'chat-basics', zh: '提问、回答与打断', en: 'Asking, Answering, and Interrupting', part: 'chat' },
  { num: 6, slug: 'sessions', zh: '管理会话', en: 'Managing Sessions', part: 'chat' },
  { num: 7, slug: 'skills-usage', zh: '技能：让助手会干专业活', en: 'Skills: Giving the Assistant Expertise', part: 'chat' },
  { num: 8, slug: 'interactions', zh: '助手向你要东西：六种交互卡', en: 'Six Interaction Cards', part: 'chat' },
  { num: 9, slug: 'generative-ui', zh: '会画画的回答：生成式界面', en: 'Generative UI Responses', part: 'chat' },
  { num: 10, slug: 'attachments', zh: '附件、图片、语音与拍照', en: 'Attachments, Images, Voice, and Camera', part: 'chat' },
  { num: 11, slug: 'transparency', zh: '看懂助手在做什么', en: 'Seeing What the Assistant Is Doing', part: 'chat' },
  { num: 12, slug: 'models', zh: '选择模型', en: 'Choosing a Model', part: 'chat' },
  // 第三部分 · 页面能力
  { num: 13, slug: 'page-perception', zh: '让助手读当前页面', en: 'Letting the Assistant Read the Page', part: 'page' },
  { num: 14, slug: 'page-actions', zh: '让助手操作页面', en: 'Letting the Assistant Act on the Page', part: 'page' },
  { num: 15, slug: 'tabs', zh: '跨标签页工作', en: 'Working Across Tabs', part: 'page' },
  { num: 16, slug: 'artifacts', zh: '产物：大屏、公文、幻灯片与打印', en: 'Artifacts: Dashboards, Documents, Slides, and Printing', part: 'page' },
  { num: 17, slug: 'downloaded-files', zh: '让它看你刚下载的那个文件（仅扩展版）', en: 'Let It Read the File You Just Downloaded (Extension Only)', part: 'page' },
  // 第四部分 · 控制台
  { num: 18, slug: 'console-tour', zh: '控制台导览', en: 'A Tour of the Console', part: 'console' },
  { num: 19, slug: 'console-skills', zh: '技能管理', en: 'Skill Management', part: 'console' },
  { num: 20, slug: 'console-runs', zh: '运行记录', en: 'Run History', part: 'console' },
  { num: 21, slug: 'console-governance', zh: '治理与复核', en: 'Governance and Review', part: 'console' },
  { num: 22, slug: 'console-connections', zh: '连接', en: 'Connections', part: 'console' },
  { num: 23, slug: 'console-settings', zh: '设置', en: 'Settings', part: 'console' },
  // 第五部分 · 场景实战
  { num: 24, slug: 'case-report', zh: '生成一份敏捷运营报告', en: 'Case: Generating an Agile Operations Report', part: 'cases' },
  { num: 25, slug: 'case-summarize', zh: '让助手总结我正在看的页面', en: 'Case: Summarizing the Page You Are Viewing', part: 'cases' },
  { num: 26, slug: 'case-bulletin', zh: '出一份可打印的质量通报', en: 'Case: Producing a Printable Quality Bulletin', part: 'cases' },
  { num: 27, slug: 'case-slides', zh: '做一套幻灯片并放映', en: 'Case: Building and Presenting a Slide Deck', part: 'cases' },
  { num: 28, slug: 'case-fill-form', zh: '说一句话，它替你把表填好', en: 'Case: Filling Out a Form with One Sentence', part: 'cases' },
  { num: 29, slug: 'case-import-file', zh: '把一份文档里的内容录进系统', en: 'Case: Importing a Document into the System', part: 'cases' },
  { num: 30, slug: 'case-skill-lifecycle', zh: '把这次做过的事变成一个技能', en: 'Case: Turning What You Just Did into a Skill', part: 'cases' },
  // 第六部分 · 参考
  { num: 31, slug: 'comparison', zh: '能力对照表：网页版 vs 扩展版', en: 'Capability Comparison: Web vs Extension', part: 'reference' },
  { num: 32, slug: 'faq', zh: '常见问题与排错', en: 'FAQ and Troubleshooting', part: 'reference' },
  { num: 33, slug: 'privacy', zh: '隐私与数据去向', en: 'Privacy and Where Your Data Goes', part: 'reference' }
];

// ---------------------------------------------------------------------------
// 正文加载：Vite glob 批量导入，不要一篇篇手写 import
// ---------------------------------------------------------------------------

const zhFiles = import.meta.glob('./zh/*.md', {
  query: '?raw',
  eager: true,
  import: 'default'
}) as Record<string, string>;

const enFiles = import.meta.glob('./en/*.md', {
  query: '?raw',
  eager: true,
  import: 'default'
}) as Record<string, string>;

function baseName(path: string): string {
  return path.split('/').pop() ?? path;
}

/** `01-intro.md` → `intro` */
function slugOfFile(path: string): string {
  return baseName(path).replace(/^\d+-/, '').replace(/\.md$/, '');
}

function indexBySlug(files: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [path, content] of Object.entries(files)) {
    out[slugOfFile(path)] = content;
  }
  return out;
}

const zhBySlug = indexBySlug(zhFiles);
const enBySlug = indexBySlug(enFiles);

/**
 * 构建期校验（模块顶层执行一次）。
 *
 * 分批写作期间 30 章不会一次齐，所以缺失只 console.warn、不抛错：
 * 侧栏会把缺文件的章节渲染为「撰写中」不可点态，深链则落到撰写中占位页。
 * 校验内容：
 * 1. zh/ 与 en/ 文件名一一对应（规范硬约束，缺一即提示）；
 * 2. 文件名必须能对应到 manifest 里的章节（防拼写漂移）；
 * 3. manifest 中两个目录都没有正文的章节列个清单，方便追踪写作进度。
 */
(function validateDocs() {
  const zhNames = new Set(Object.keys(zhFiles).map(baseName));
  const enNames = new Set(Object.keys(enFiles).map(baseName));
  for (const name of zhNames) {
    if (!enNames.has(name)) console.warn(`[docs] en/ 缺少与 zh/${name} 对应的文件`);
  }
  for (const name of enNames) {
    if (!zhNames.has(name)) console.warn(`[docs] zh/ 缺少与 en/${name} 对应的文件`);
  }
  const knownSlugs = new Set(DOC_CHAPTERS.map((c) => c.slug));
  for (const slug of Object.keys(zhBySlug)) {
    if (!knownSlugs.has(slug)) console.warn(`[docs] zh/ 存在未登记进 manifest 的章节文件：${slug}.md`);
  }
  for (const slug of Object.keys(enBySlug)) {
    if (!knownSlugs.has(slug)) console.warn(`[docs] en/ 存在未登记进 manifest 的章节文件：${slug}.md`);
  }
  const pending = DOC_CHAPTERS.filter((c) => !(c.slug in zhBySlug) && !(c.slug in enBySlug));
  if (pending.length > 0) {
    console.warn(`[docs] ${pending.length} 章待撰写：${pending.map((c) => c.slug).join(', ')}`);
  }
})();

// ---------------------------------------------------------------------------
// 派生查询
// ---------------------------------------------------------------------------

export function chapterBySlug(slug: string | null | undefined): DocChapter | undefined {
  return DOC_CHAPTERS.find((c) => c.slug === slug);
}

export function chaptersInPart(partId: string): DocChapter[] {
  return DOC_CHAPTERS.filter((c) => c.part === partId);
}

export function chapterTitle(chapter: DocChapter, isZh: boolean): string {
  return isZh ? chapter.zh : chapter.en;
}

/**
 * 「仅扩展版」类标记的拆分：章标题里内嵌的（仅扩展版）/(Extension Only)
 * 在侧栏等位置渲染为徽章（透明边框 + soft 底，视觉规范 §6 Badge），
 * 而不是混在标题文字里。正文里的同名标记由 Markdown 容器（`> **仅扩展版**：`）承担。
 */
export function splitEditionBadge(title: string): { text: string; extensionOnly: boolean } {
  for (const mark of ['（仅扩展版）', '(Extension Only)']) {
    if (title.includes(mark)) {
      return { text: title.replace(mark, '').trim(), extensionOnly: true };
    }
  }
  return { text: title, extensionOnly: false };
}

/** 该语言下是否有正文文件（侧栏「撰写中」态的依据） */
export function hasChapterContent(slug: string, isZh: boolean): boolean {
  return isZh ? slug in zhBySlug : slug in enBySlug;
}

/**
 * 取章节正文。
 *
 * 语言回落策略：中文是写作源语言，某章英文版缺失时回落到中文内容并返回
 * `fallback: true`，由界面显示「翻译进行中」提示——而不是 404 或空白，
 * 这样分批翻译期间英文读者仍能看到内容。
 */
export function getChapterContent(
  slug: string,
  isZh: boolean
): { content: string; fallback: boolean } | null {
  if (isZh) {
    if (slug in zhBySlug) return { content: zhBySlug[slug], fallback: false };
    if (slug in enBySlug) return { content: enBySlug[slug], fallback: true };
    return null;
  }
  if (slug in enBySlug) return { content: enBySlug[slug], fallback: false };
  if (slug in zhBySlug) return { content: zhBySlug[slug], fallback: true };
  return null;
}

/** 上一章/下一章，按 manifest 顺序（撰写中的章节也在序列里） */
export function prevNext(slug: string): { prev?: DocChapter; next?: DocChapter } {
  const idx = DOC_CHAPTERS.findIndex((c) => c.slug === slug);
  return {
    prev: idx > 0 ? DOC_CHAPTERS[idx - 1] : undefined,
    next: idx >= 0 && idx < DOC_CHAPTERS.length - 1 ? DOC_CHAPTERS[idx + 1] : undefined
  };
}
