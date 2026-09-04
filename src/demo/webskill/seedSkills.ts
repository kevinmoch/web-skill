import { seedSkillsFromHttp } from '@webskill/sdk/browser';
import type { BuiltinSkillManifest } from '@webskill/sdk/browser';
import type { FileSystemProvider } from '@webskill/sdk';
import { APP_BASE } from '../../base';

/**
 * 内置技能播种：把随应用发布的 `public/skills/builtin/*` 写进 OPFS 的 `/skills/builtin`。
 *
 * 搬运本身自 SDK 0.19.0 起由 `seedSkillsFromHttp` 提供（原本 89 行手写）。
 * 它比手写多两条保护：HTTP 非 2xx、以及「SKILL.md 取回来是 HTML 兜底页」都当场抛出，
 * 不会把半份技能写进库；清单外的残留文件只在本技能目录内清理，`/skills/user` 不受影响。
 *
 * 幂等是必须的：戳存在即跳过——每次刷新都重写会覆盖用户对内置技能的改动。
 * 想升级内置技能，改 `SEED_STAMP`，或清站点数据。
 */

/** 技能目录 → 文件清单（HTTP 无法列目录，必须显式列出） */
const MANIFEST: BuiltinSkillManifest = {
  'sprint-progress-report': ['SKILL.md', 'scripts/run.js'],
  'agile-ops-dashboard': ['SKILL.md', 'scripts/run.js'],
  'sprint-weekly-brief': ['SKILL.md', 'scripts/run.js', 'references/brief.json'],
  'quality-bulletin': [
    'SKILL.md',
    'scripts/run.js',
    'references/bulletin.html',
    'references/bulletin.css',
    'assets/seal.png'
  ],
  'agile-ops-screen': ['SKILL.md', 'scripts/run.js', 'references/screen.html', 'references/screen.css'],
  'agile-slide-deck': ['SKILL.md', 'scripts/run.js', 'references/deck.html', 'references/deck.css'],
  'requirement-doc-digest': ['SKILL.md'],
  'bug-screenshot-triage': ['SKILL.md'],
  'cross-project-health': ['SKILL.md', 'scripts/run.js'],
  'sprint-closeout': ['SKILL.md'],
  // 三份「模型自己写版式」的文档技能：脚本只做投放校验，取数与 HTML/CSS 都由模型现场做
  'authored-bulletin': ['SKILL.md', 'references/authoring.md', 'scripts/publish.js'],
  'authored-screen': ['SKILL.md', 'references/authoring.md', 'scripts/publish.js'],
  'authored-slides': ['SKILL.md', 'references/authoring.md', 'scripts/publish.js']
};

/**
 * 戳名带版本：清单里新增技能时必须跟着改，否则已经打开过 demo 的浏览器
 * 永远拿不到新技能。改戳名会重抛全部内置技能，用户对它们的改动会被覆盖。
 */
const SEED_STAMP = '/skills/builtin/.seeded-v6';

export async function seedBuiltinSkills(fs: FileSystemProvider): Promise<void> {
  // baseUrl 只作用于 HTTP 取回侧：子路径/相对部署（dist-docs）下 `/skills/builtin/...`
  // 会打到站点根、被 SPA 兜底页顶掉，SKILL.md 取回来是 HTML。存储侧的根仍是 /skills/builtin。
  await seedSkillsFromHttp(fs, { manifest: MANIFEST, stamp: SEED_STAMP, baseUrl: APP_BASE });
}
