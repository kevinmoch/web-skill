import { PagePerceptionPolicy } from '@webskill/sdk/agent';
import { createDomPerceptionReader } from '@webskill/sdk/browser';
import type { DomPerceptionReader } from '@webskill/sdk/browser';
import { FsAuditLog } from '@webskill/sdk/governance';
import type { AgileWebSkillRuntime } from './runtime';
import { MANAGED_ROOT } from './runtime';

/**
 * 感知与操作共用同一份 scope 口径：策略层判「能不能做」，reader 判「发不发句柄」，
 * 两处不一致会让模型拿到点不动的 ref。
 * 只圈业务主区：侧栏/对话面板不进上下文，既省 token 又降噪。
 * （感知会跳过 hidden 节点：业务页切换时，离开页的 DOM 不在，天然只读当前屏。）
 */
export const AGILE_PAGE_SCOPE = {
  frames: [{ frame: 'self' as const, include: ['#main-content-wrapper'] }]
} as const;

/** 同一个 reader 实例：感知发 ref，操作按 ref 执行，句柄表必须共享 */
export function createAgilePageReader(): DomPerceptionReader {
  return createDomPerceptionReader({ actionScope: AGILE_PAGE_SCOPE });
}

export function createAgilePerception(runtime: AgileWebSkillRuntime, reader: DomPerceptionReader): PagePerceptionPolicy {
  return new PagePerceptionPolicy({
    scope: AGILE_PAGE_SCOPE,
    reader,
    // 感知留痕是合规要求（FR-22.6 同口径）
    audit: new FsAuditLog({ root: MANAGED_ROOT, fs: runtime.storage })
  });
}
