import type { PageToolDef } from './pageSkills';
import { MANAGED_ROOT, SKILL_ROOTS, getWebSkillRuntime } from './runtime';

/**
 * 让模型用自然语言改技能：把 console 的技能文件编辑口暴露成两个 MCP 工具。
 *
 * 工具定义自 SDK 0.19.0 起由 `createSkillEditTools` 提供（原本 134 行手写，
 * 与 ccs 那份逐字同构）。留在这里的只有本应用的后端装配：技能根、版本库根、审计源。
 *
 * 走 console 后端而不是直接写 fs，是因为写入这条路上的保护全在后端里：
 * 路径逃逸校验、写完整库校验、归因本技能的 error 自动回滚、版本快照、审计留痕。
 *
 * 读用 SDK 内建的 `read_skill_file`，这里不重复造。
 *
 * **加载时机**：工具的 spec 现在住在 console 包里，而挂端点时就要拿它去注册，
 * 所以 console 从「模型第一次改技能时加载」提前到了「首次挂端点前加载」。
 * 仍是动态 import（独立 chunk，不进首屏主包），但不再是「用到才拉」。
 */

const CHAT_ROOT = '/chat';

let pending: Promise<PageToolDef[]> | undefined;

export function loadSkillEditTools(): Promise<PageToolDef[]> {
  pending ??= (async () => {
    const { createSkillEditTools } = await import('@webskill/console');
    return createSkillEditTools({
      // 工厂只调一次、失败不缓存（SDK 侧保证）：一次瞬时错误不该把工具永久钉死
      backend: async () => {
        const runtime = await getWebSkillRuntime();
        const { createFsConsoleBackend, createFsTraceSource } = await import('@webskill/console');
        return createFsConsoleBackend({
          fs: runtime.storage,
          roots: [...SKILL_ROOTS],
          traces: createFsTraceSource(runtime.storage, CHAT_ROOT),
          // 编辑与版本化只在注入 versionStoreRoot 时才挂载；缺了它 writeSkillFile 根本不存在
          versionStoreRoot: MANAGED_ROOT,
          chatRoot: CHAT_ROOT
        });
      }
    });
  })().catch((e: unknown) => {
    // 装配失败不缓存：下一次挂端点重试，否则一次瞬时错误会把编辑能力永久钉死
    pending = undefined;
    throw e;
  });
  return pending;
}
