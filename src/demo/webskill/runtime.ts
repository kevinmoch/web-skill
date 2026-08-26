import { OpfsProvider, isOpfsAvailable } from '@webskill/sdk/browser';
import { createLocalStorageRuntimeConfigStore } from '@webskill/chatbot';
import type { RuntimeConfig, RuntimeConfigStore } from '@webskill/chatbot';
import { CandidateStore, createCandidateSink } from '@webskill/sdk/governance';
import type { FileSystemProvider } from '@webskill/sdk';
import type { SerializingMemoryStore } from '@webskill/sdk';
import { seedBuiltinSkills } from './seedSkills';
import { createFieldHistory } from './fieldHistory';
import { devLlmEntries } from './devModels';

const OPFS_ROOT = 'agile-demo';
const RUNTIME_CONFIG_KEY = 'agile.webskill.runtime-config';

/**
 * 开发模型已装载过的标记。没它的话用户删掉某个 Dev 条目后一刷新就又回来了；
 * 用户一旦保存过配置（save 竖标记），就不再补种——删掉的条目是用户的选择。
 */
const DEV_MODELS_SEEDED_KEY = 'agile.webskill.dev-models-seeded';

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

/**
 * 在 localStorage 实现之上包一层本应用的默认值：
 * - 本 demo 的卖点之一是声明式渲染，所以 `generativeUi` 缺省打开；SDK 默认关
 *   （catalog 描述计入每次请求）。判定走原始存储内容——「用户显式关过」不能被写回。
 * - 技能脚本要按数据源取数（T4），`sandbox.capabilities.fetchData` 缺省打开。
 * - 「下载的文件」（console › 设置 › 沙箱与安全）`sandbox.downloadedFiles` 缺省打开。
 * - 「允许技能脚本读上传的文件」`sandbox.uploadFiles` 缺省打开；开关只是配置闸门，
 *   每次读取仍要用户在同意卡上放行。
 * - 本机跑（dev server 与 `vite preview`）在 http://localhost，出站准入默认 https-only
 *   且拒环回，需求表的 .docx 附件会被拦——本机跑时缺省放行 http 与私有主机。
 *   判定见 `servedFromLocalHost`。⚠️ 这只是本地开发的让步，**不能进生产默认值**。
 * - 质量通报公文走文档投放面（T4），`documentSurface.enabled` 缺省打开。
 * - 多步任务沉淀为技能（T5）是本 demo 的卖点之一，`skillGeneration` 缺省打开；
 *   确认卡与候选投递由 SDK 自动接线（config.skillCandidates 已在传）。
 * - 个性化画像（T6）也是演示主线之一，`userProfile.enabled` 缺省打开；
 *   SDK 默认关——既关记录也关注入，关掉是彻底的。
 * - 开发态模型装载（仅 dev）：`.env` 里的三组模型经 `__WEBSKILL_DEV_LLM__` 注入后
 *   补进 llm.entries；只补缺失 id、从不覆盖用户编辑过的条目，用户保存过一次就不再补种。
 */
function wrapRuntimeConfigStore(base: RuntimeConfigStore): RuntimeConfigStore {
  const load = async (): Promise<RuntimeConfig> => {
    const config = await base.load();
    let raw: {
      agentCapabilities?: Record<string, unknown>;
      documentSurface?: Record<string, unknown>;
      userProfile?: Record<string, unknown>;
      sandbox?: {
        capabilities?: Record<string, unknown>;
        remoteUrl?: Record<string, unknown>;
        downloadedFiles?: boolean;
        uploadFiles?: boolean;
      };
      multimodal?: Record<string, unknown>;
      loop?: { maxTurns?: number };
    } = {};
    try {
      const stored = globalThis.localStorage?.getItem(RUNTIME_CONFIG_KEY);
      raw = stored ? JSON.parse(stored) : {};
    } catch {
      // 损坏的配置按未显式设置处理
    }
    let next = config;
    if (raw.agentCapabilities === undefined || !('generativeUi' in raw.agentCapabilities)) {
      next = { ...next, agentCapabilities: { ...next.agentCapabilities, generativeUi: true } };
    }
    if (raw.agentCapabilities === undefined || !('skillGeneration' in raw.agentCapabilities)) {
      next = { ...next, agentCapabilities: { ...next.agentCapabilities, skillGeneration: true } };
    }
    if (raw.documentSurface === undefined || !('enabled' in raw.documentSurface)) {
      next = { ...next, documentSurface: { ...next.documentSurface, enabled: true } };
    }
    if (raw.userProfile === undefined || !('enabled' in raw.userProfile)) {
      next = { ...next, userProfile: { ...next.userProfile, enabled: true } };
    }
    // 迁移：SDK 0.12.0 起出厂 maxTurns 已是 50（分册 19，多步技能 + 任务清单记账
    // 在出厂 10 轮下会触顶 RUN_MAX_TURNS_EXCEEDED）。这里只把「Settings 整包落盘的
    // 出厂 10」迁到 50；未设置过的走 SDK 默认，用户显式改过的任何值都尊重。
    if (raw.loop?.maxTurns === 10) {
      next = { ...next, loop: { ...next.loop, maxTurns: 50 } };
    }
    // 能力开关默认全开（新用户零配置演示）：子任务委派 / 图片附件 / 页面图像抓取。
    // 键缺失才补默认——用户显式关掉的开关必须保持关（值强压会让开关「关不掉」）。
    // 注意：sandbox.typescript 不在此列——它需要配套 esbuildUrl 才能跑，
    // 只开开关不配 URL 会让每次沙箱执行直接报错，不能默认开。
    if (raw.agentCapabilities === undefined || !('delegation' in raw.agentCapabilities)) {
      next = { ...next, agentCapabilities: { ...next.agentCapabilities, delegation: true } };
    }
    if (raw.multimodal === undefined || !('imageAttachments' in raw.multimodal)) {
      next = { ...next, multimodal: { ...next.multimodal, imageAttachments: true } };
    }
    if (raw.multimodal === undefined || !('pageImageCapture' in raw.multimodal)) {
      next = { ...next, multimodal: { ...next.multimodal, pageImageCapture: true } };
    }
    if (raw.sandbox?.capabilities === undefined || !('fetchData' in raw.sandbox.capabilities)) {
      next = {
        ...next,
        sandbox: { ...next.sandbox, capabilities: { ...next.sandbox.capabilities, fetchData: true } }
      };
    }
    // 「下载的文件」（console › 设置 › 沙箱与安全）缺省打开；用户显式关过的保持关。
    // 开关与取件通路是「与」的关系：reader 已在 adapter.ts 注入，
    // 但浏览器不支持 File System Access API 时 list() 仍会明确报错。
    if (raw.sandbox === undefined || !('downloadedFiles' in raw.sandbox)) {
      next = { ...next, sandbox: { ...next.sandbox, downloadedFiles: true } };
    }
    // 「允许技能脚本读上传的文件」缺省打开；用户显式关过的保持关。
    // 关掉开关后技能只能看到附件的元信息，读不到字节。
    if (raw.sandbox === undefined || !('uploadFiles' in raw.sandbox)) {
      next = { ...next, sandbox: { ...next.sandbox, uploadFiles: true } };
    }
    if (servedFromLocalHost() && raw.sandbox?.remoteUrl === undefined) {
      next = { ...next, sandbox: { ...next.sandbox, remoteUrl: { allowHttp: true, allowPrivateHosts: true } } };
    }
    // 开发态模型装载：只补充不存在的 id；生产构建 __WEBSKILL_DEV_LLM__ 为 undefined，这里是空操作
    if (globalThis.localStorage?.getItem(DEV_MODELS_SEEDED_KEY) !== '1') {
      const devs = devLlmEntries();
      if (devs.length > 0) {
        const existing = new Set(next.llm.entries.map((e) => e.id));
        const added = devs.filter((e) => !existing.has(e.id));
        if (added.length > 0) {
          const entries = [...next.llm.entries, ...added];
          next = { ...next, llm: { ...next.llm, entries, defaultId: next.llm.defaultId ?? entries[0]?.id } };
        }
      }
    }
    return next;
  };
  return {
    load,
    save: async (config) => {
      await base.save(config);
      // 用户保存过配置就竖标记：之后删掉的 Dev 条目不会在刷新时复活
      globalThis.localStorage?.setItem(DEV_MODELS_SEEDED_KEY, '1');
    },
    reset: async () => {
      await base.reset();
      globalThis.localStorage?.removeItem(DEV_MODELS_SEEDED_KEY);
    },
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
  const runtimeConfig = wrapRuntimeConfigStore(createLocalStorageRuntimeConfigStore({ key: RUNTIME_CONFIG_KEY }));
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
