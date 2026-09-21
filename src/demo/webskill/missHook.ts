import { CandidateStore, FsAuditLog, LlmCandidateGenerator, createMissHook } from '@webskill/sdk/governance';
import { createLlmClient } from '@webskill/sdk/browser';
import { isLlmEntryUsable } from '@webskill/chatbot';
import type { FileSystemProvider, RuntimeRun } from '@webskill/sdk';
import { MANAGED_ROOT, type AgileWebSkillRuntime } from './runtime';

/**
 * console 的 Versions 页把「运行时未命中生成候选」开关落在治理根下的这个文件里
 * （`GovernanceFacade.missHook`）。SDK 没导出读取函数，开关的存放位置就是宿主与
 * console 之间的约定——两边指向同一个治理根，才是同一个开关。
 */
const MISS_HOOK_PATH = `${MANAGED_ROOT}/.webskill/misshook.json`;

async function missHookEnabled(fs: FileSystemProvider): Promise<boolean> {
  try {
    if (!(await fs.exists(MISS_HOOK_PATH))) return false;
    const parsed = JSON.parse(await fs.readText(MISS_HOOK_PATH)) as { enabled?: unknown };
    return parsed.enabled === true;
  } catch {
    // 读不懂的开关按「没开」处理：宁可不生成候选，也不能凭一条坏记录去调模型
    return false;
  }
}

/**
 * run 未激活任何技能时生成 draft 候选入库待审（console 审核队列里 source 为 `runtime-miss`）。
 *
 * 开关与模型**每次触发时才读**：装配期算好会让「开着启动 → 中途关闭」不生效，
 * 也会让用户换了模型之后候选还在用旧端点生成。
 */
export function createAgileMissHook(
  runtime: AgileWebSkillRuntime
): (input: { prompt: string; run: RuntimeRun }) => Promise<void> {
  return async (input) => {
    if (!(await missHookEnabled(runtime.storage))) return;

    const rc = await runtime.runtimeConfig.load();
    const active = rc.llm.entries.find((e) => e.id === rc.llm.defaultId) ?? rc.llm.entries[0];
    // 没配可用模型时静默跳过：未命中本身不是错误，不该因为「顺手想生成候选」把这一轮对话变成失败
    if (!active || !isLlmEntryUsable(active)) return;

    const audit = new FsAuditLog({ root: MANAGED_ROOT, fs: runtime.storage });
    const hook = createMissHook({
      generator: new LlmCandidateGenerator({ llm: createLlmClient(active), audit }),
      store: new CandidateStore({ root: MANAGED_ROOT, fs: runtime.storage }),
      audit
    });
    await hook(input);
  };
}
