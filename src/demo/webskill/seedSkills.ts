import type { FileSystemProvider } from '@webskill/sdk';

/**
 * 内置技能播种：把随应用发布的 `public/skills/builtin/*` 写进 OPFS 的 `/skills/builtin`。
 *
 * 幂等是必须的：`.seeded` 戳存在即跳过——每次刷新都重写会覆盖用户对内置技能的改动。
 * 想升级内置技能，删掉 OPFS 里的戳或直接清站点数据。
 */

/** 技能目录 → 文件清单（HTTP 无法列目录，必须显式列出） */
const MANIFEST: Record<string, string[]> = {
  'sprint-progress-report': ['SKILL.md', 'scripts/run.js'],
  'agile-ops-dashboard': ['SKILL.md', 'scripts/run.js'],
  'sprint-weekly-brief': ['SKILL.md', 'scripts/run.js', 'references/brief.json'],
  'quality-bulletin': ['SKILL.md', 'scripts/run.js', 'references/bulletin.html', 'references/bulletin.css', 'assets/seal.png'],
  'agile-ops-screen': ['SKILL.md', 'scripts/run.js', 'references/screen.html', 'references/screen.css'],
  'requirement-doc-digest': ['SKILL.md'],
  'bug-screenshot-triage': ['SKILL.md'],
  'cross-project-health': ['SKILL.md', 'scripts/run.js'],
  'sprint-closeout': ['SKILL.md']
};

const SEED_STAMP = '/skills/builtin/.seeded';

async function copyFromPublic(fs: FileSystemProvider, targetRoot: string, skill: string, file: string): Promise<void> {
  const url = `/skills/builtin/${skill}/${file}`;
  const target = `${targetRoot}/${skill}/${file}`;
  const res = await fetch(url);
  if (!res.ok) {
    // 静默吞掉 404 会把错误页 HTML 当成技能内容写进 OPFS，必须炸在这里
    throw new Error(`Builtin skill asset missing: ${url} (HTTP ${res.status})`);
  }
  if (file.endsWith('.png')) {
    await fs.writeBinary(target, new Uint8Array(await res.arrayBuffer()));
  } else {
    const text = await res.text();
    // vite dev 对缺失路径可能回退成 HTML——技能契约文件必须过内容校验，不许带病落盘
    if (file === 'SKILL.md' && !text.startsWith('---')) {
      throw new Error(`Builtin skill asset is not a SKILL.md contract: ${url}`);
    }
    await fs.writeText(target, text);
  }
}

export async function seedBuiltinSkills(fs: FileSystemProvider): Promise<void> {
  if (await fs.exists(SEED_STAMP)) return;
  for (const [skill, files] of Object.entries(MANIFEST)) {
    await fs.mkdir(`/skills/builtin/${skill}`).catch(() => undefined);
    for (const file of files) {
      await copyFromPublic(fs, '/skills/builtin', skill, file);
    }
  }
  await fs.writeText(SEED_STAMP, new Date().toISOString());
}
