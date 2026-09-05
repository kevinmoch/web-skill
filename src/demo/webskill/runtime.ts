import { OpfsProvider, isOpfsAvailable } from '@webskill/sdk/browser';
import { createLocalStorageRuntimeConfigStore } from '@webskill/chatbot';
import type { RuntimeConfig, RuntimeConfigStore } from '@webskill/chatbot';
import { CandidateStore, createCandidateSink } from '@webskill/sdk/governance';
import type { FileSystemProvider } from '@webskill/sdk';
import type { SerializingMemoryStore } from '@webskill/sdk';
import { seedBuiltinSkills } from './seedSkills';
import { createFieldHistory } from './fieldHistory';
import { withConfigDefaults } from './configDefaults';

const OPFS_ROOT = 'agile-demo';
const RUNTIME_CONFIG_KEY = 'agile.webskill.runtime-config';

/**
 * 「下载的文件」曾缺省置开，现已撤销：读本机下载目录是扩展宿主的事，
 * 本应用不再接那个端口（见 adapter.ts）。老存储里那个键已经是 `true`，得再翻一次，
 * 否则设置页会一直显示一个背后根本没有工具的「已开启」。
 */
const DOWNLOADS_RETIRED_KEY = 'agile.webskill.downloads-retired';

/**
 * 本机跑（dev server 或 `vite preview`）判定。
 *
 * **不能用 `import.meta.env.DEV`**：`preview` 跑的是生产构建，DEV 为 `false`，
 * 但它同样落在 `http://localhost`，出站准入照样会把需求表的 .docx 附件拦掉——
 * 于是出现「dev 正常、build+preview 全线失败」这种最难查的分叉。
 * 判据改成「页面自己就是从环回/私网地址加载的」：部署到公网域名时为 `false`，
 * 生产默认值一点没松。`--host` 起的 dev server 从局域网 IP 访问也算本机跑。
 */
function servedFromLocalHost(): boolean {
  const loc = (globalThis as { location?: { protocol?: string; hostname?: string } }).location;
  if (loc?.protocol !== 'http:') return false;
  const host = (loc.hostname ?? '').toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost') || host === '[::1]' || host === '::1') return true;
  // 127.0.0.0/8、10/8、172.16-31/12、192.168/16、169.254/16
  const octets = host.split('.');
  if (octets.length !== 4 || !octets.every((o) => /^\d{1,3}$/.test(o) && Number(o) <= 255)) return false;
  const [a, b] = octets.map(Number) as [number, number, number, number];
  return (
    a === 127 || a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254)
  );
}

/** 技能根：builtin 随应用发布，user 存用户导入与候选晋升的技能 */
export const SKILL_ROOTS = ['/skills/builtin', '/skills/user'] as const;

/** 候选与治理共用同一个根，否则 console 看不到 chatbot 投递的候选 */
export const MANAGED_ROOT = '/skills/user';

/** 外观/模型等运行配置的 localStorage 键（供宿主判断「是否已显式保存过」） */
export const RUNTIME_CONFIG_STORAGE_KEY = RUNTIME_CONFIG_KEY;

/** 原始存储内容。它与 `load()` 的返回值不同：没合并过默认值，因此能分出「用户显式设过」 */
function readRawConfig(): unknown {
  try {
    const stored = globalThis.localStorage?.getItem(RUNTIME_CONFIG_KEY);
    return stored ? JSON.parse(stored) : undefined;
  } catch {
    // 损坏的配置按未显式设置处理
    return undefined;
  }
}

/**
 * 在「localStorage + config.json 缺省值」之上包一层 config.json **表达不了**的宿主逻辑。
 *
 * 出厂缺省值（生成式 UI、技能自动生成、委派、图片附件与页面抓取、fetchData、
 * 读上传的文件、文档投放面、用户画像、模型条目）已全部搬进 `config.json`，
 * 由 `withConfigDefaults` 三方合并 —— 用户在 Console 里改过的项永远优先。
 * 留在这里的只有两件静态配置写不出来的事：
 * - 本机跑（dev server 与 `vite preview`）在 http://localhost，出站准入默认 https-only
 *   且拒环回，需求表的 .docx 附件会被拦——本机跑时缺省放行 http 与私有主机。
 *   判定见 `servedFromLocalHost`，取决于页面**运行时**从哪加载。
 *   ⚠️ 正因如此它不能进 config.json：那份是构建期常量，会连生产默认值一起放宽。
 * - 一次性存储迁移（`maxTurns === 10`、撤销「下载的文件」）：改的是存储里**已落盘**的值，
 *   而缺省值合并按定义碰不到用户存过的字段。
 */
function wrapRuntimeConfigStore(base: RuntimeConfigStore): RuntimeConfigStore {
  const load = async (): Promise<RuntimeConfig> => {
    const config = await base.load();
    const raw = (readRawConfig() ?? {}) as {
      sandbox?: { remoteUrl?: Record<string, unknown> };
      loop?: { maxTurns?: number };
    };
    let next = config;
    // 迁移：SDK 0.12.0 起出厂 maxTurns 已是 50（分册 19，多步技能 + 任务清单记账
    // 在出厂 10 轮下会触顶 RUN_MAX_TURNS_EXCEEDED）。这里只把「Settings 整包落盘的
    // 出厂 10」迁到 50；未设置过的走 SDK 默认，用户显式改过的任何值都尊重。
    if (raw.loop?.maxTurns === 10) {
      next = { ...next, loop: { ...next.loop, maxTurns: 50 } };
    }
    // 一次性关回「下载的文件」：本应用曾把它缺省置开，老浏览器的存储里还留着 true
    if (globalThis.localStorage?.getItem(DOWNLOADS_RETIRED_KEY) !== '1') {
      next = { ...next, sandbox: { ...next.sandbox, downloadedFiles: false } };
      try {
        globalThis.localStorage?.setItem(RUNTIME_CONFIG_KEY, JSON.stringify(next));
        globalThis.localStorage?.setItem(DOWNLOADS_RETIRED_KEY, '1');
      } catch {
        // 存储不可用：本次加载仍返回关掉的值，标记未竖下次重试
      }
    }
    if (servedFromLocalHost() && raw.sandbox?.remoteUrl === undefined) {
      next = { ...next, sandbox: { ...next.sandbox, remoteUrl: { allowHttp: true, allowPrivateHosts: true } } };
    }
    return next;
  };
  return {
    load,
    save: (config) => base.save(config),
    reset: () => base.reset(),
    ...(base.subscribe ? { subscribe: (listener: () => void) => base.subscribe!(listener) } : {})
  };
}

export interface AgileWebSkillRuntime {
  storage: FileSystemProvider;
  runtimeConfig: RuntimeConfigStore;
  skillCandidates: ReturnType<typeof createCandidateSink>;
  /** 字段历史（T6）：与 chatbot 的 <chatRoot>/memory 完全隔离的独立 root */
  fieldHistory: SerializingMemoryStore;
  skillRoots: string[];
}

let cached: Promise<AgileWebSkillRuntime> | undefined;

async function assemble(): Promise<AgileWebSkillRuntime> {
  if (!isOpfsAvailable()) {
    // 英文：会进错误上报与 LLM 上下文
    throw new Error('OPFS is unavailable in this browser; WebSkill requires Origin Private File System support.');
  }

  const storage = new OpfsProvider({ rootName: OPFS_ROOT });
  const runtimeConfig = wrapRuntimeConfigStore(
    withConfigDefaults(createLocalStorageRuntimeConfigStore({ key: RUNTIME_CONFIG_KEY }), readRawConfig)
  );
  const skillCandidates = createCandidateSink({
    store: new CandidateStore({ root: MANAGED_ROOT, fs: storage })
  });

  await ensureSkillRoots(storage);
  // 首启播种内置技能（幂等）；必须在返回前完成——chatbot 装配时会读技能目录
  await seedBuiltinSkills(storage);

  const fieldHistory = createFieldHistory(storage);

  return { storage, runtimeConfig, skillCandidates, fieldHistory, skillRoots: [...SKILL_ROOTS] };
}

async function ensureSkillRoots(fs: FileSystemProvider): Promise<void> {
  for (const root of SKILL_ROOTS) {
    await fs.mkdir(root).catch(() => undefined);
  }
}

/** 全应用单例。chatbot 与 console 必须拿到同一个实例。 */
export function getWebSkillRuntime(): Promise<AgileWebSkillRuntime> {
  cached ??= assemble();
  return cached;
}
