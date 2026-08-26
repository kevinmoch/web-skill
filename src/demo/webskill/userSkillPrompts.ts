import type { FileSystemProvider } from '@webskill/sdk';
import type { QuickPrompt } from '@webskill/chatbot';
import { MANAGED_ROOT } from './runtime';

/**
 * 沉淀闭环的最后一段（04 §2.7）：晋升到 /skills/user 的技能自动变成快捷指令。
 * 存了但下次想不起来怎么叫它，等于没存。
 *
 * 上限 3 条、按最近修改排序；超过的只在技能库里找得到。
 */

const USER_SKILL_PROMPT_LIMIT = 3;

/** 从 SKILL.md 正文取 name（frontmatter 第一处 name:；技能名是机读标识，不译） */
function skillNameOf(markdown: string): string | undefined {
  const m = /^name:\s*(.+)$/m.exec(markdown);
  return m?.[1]?.trim();
}

export async function listUserSkillPrompts(fs: FileSystemProvider): Promise<QuickPrompt[]> {
  if (!(await fs.exists(MANAGED_ROOT))) return [];
  const entries = await fs.list(MANAGED_ROOT);
  const dirs = entries.filter((e) => e.type === 'directory');
  const withMtime: { name: string; at: number }[] = [];
  for (const dir of dirs) {
    const skillMd = `${dir.path}/SKILL.md`;
    if (!(await fs.exists(skillMd))) continue;
    const name = skillNameOf(await fs.readText(skillMd));
    if (!name) continue;
    const at = (await fs.stat(skillMd)).mtimeMs ?? 0;
    withMtime.push({ name, at });
  }
  return (
    withMtime
      .sort((a, b) => b.at - a.at)
      .slice(0, USER_SKILL_PROMPT_LIMIT)
      // 沉淀来的技能统一用 sparkles：它们是「从使用里长出来的」指令
      .map((s) => ({ icon: 'sparkles' as const, text: { zh: `请运行 ${s.name} 技能`, en: `Run the ${s.name} skill` } }))
  );
}
