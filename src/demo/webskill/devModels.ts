import type { RuntimeConfig } from '@webskill/chatbot';

/**
 * 开发期模型装载：把站点根目录 `.env` 里的三组模型凭据变成 chatbot 的模型条目。
 * **仅开发态生效**——`__WEBSKILL_DEV_LLM__` 由 vite.config.ts 的 `define` 在 dev 下注入，
 * 生产构建被替换为 `undefined`，本文件的分支随之被 tree-shake。
 * 与 SDK 仓库 examples/chatbot-playground/src/devModels.ts 同款机制。
 */

type RuntimeLlmEntry = RuntimeConfig['llm']['entries'][number];
type RuntimeLlmProvider = RuntimeLlmEntry['provider'];

declare const __WEBSKILL_DEV_LLM__:
  | Record<'openai' | 'anthropic' | 'google', { baseUrl?: string; apiKey?: string; model?: string }>
  | undefined;

/** 固定 id 而非随机 id：历史会话存的是 entry id，随机 id 会让模型标签在重启后变成未知 */
const DEV_ENTRIES: readonly {
  id: string;
  label: string;
  provider: RuntimeLlmProvider;
  key: 'openai' | 'anthropic' | 'google';
}[] = [
  { id: 'dev-openai', label: 'Dev · OpenAI', provider: 'openai-compatible', key: 'openai' },
  { id: 'dev-anthropic', label: 'Dev · Anthropic', provider: 'anthropic', key: 'anthropic' },
  { id: 'dev-google', label: 'Dev · Google', provider: 'google', key: 'google' }
];

/** 各 provider 的官方默认端点（镜像 @webskill/ui-kit 的 PROVIDER_DEFAULT_BASE_URL；ui-kit 不是发布包，不可直接 import） */
const PROVIDER_DEFAULT_BASE_URL: Partial<Record<RuntimeLlmProvider, string>> = {
  anthropic: 'https://api.anthropic.com',
  google: 'https://generativelanguage.googleapis.com'
};

const trimmed = (value: string | undefined): string => (typeof value === 'string' ? value.trim() : '');

/** 由注入常量生成模型条目；缺凭据或缺模型名的 provider 不生成条目。生产构建恒为空数组。 */
export function devLlmEntries(): RuntimeLlmEntry[] {
  const injected = typeof __WEBSKILL_DEV_LLM__ === 'undefined' ? undefined : __WEBSKILL_DEV_LLM__;
  if (!injected) return [];
  const entries: RuntimeLlmEntry[] = [];
  for (const spec of DEV_ENTRIES) {
    const source = injected[spec.key];
    const apiKey = trimmed(source?.apiKey);
    const model = trimmed(source?.model);
    if (apiKey === '' || model === '') continue;
    // openai-compatible 没有官方默认端点，缺 baseUrl 就是配不出可用条目
    const baseUrl = trimmed(source?.baseUrl) || PROVIDER_DEFAULT_BASE_URL[spec.provider] || '';
    if (baseUrl === '') continue;
    entries.push({ id: spec.id, label: spec.label, provider: spec.provider, baseUrl, apiKey, model });
  }
  return entries;
}
