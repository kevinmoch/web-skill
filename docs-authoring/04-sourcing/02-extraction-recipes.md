# 02 · 提取配方

可直接执行的命令。**第 0 步的事实基线全靠这一节产出。**

所有命令的工作目录：`~/Git/web-skill-sdk`（除 §5 标明为站点仓库的）。

---

## 1. chatbot 界面文案（中英对照）

### 1.1 按域统计（覆盖度基线）

```bash
cd ~/Git/web-skill-sdk && node -e "
const fs=require('fs');
const src=fs.readFileSync('packages/chatbot/src/i18n.ts','utf8');
const en=src.slice(src.indexOf('en: {'), src.indexOf('zh: {'));
const keys=[...en.matchAll(/'([a-zA-Z0-9_.]+)':/g)].map(m=>m[1]);
const g={}; for(const k of keys){const d=k.split('.')[0]; g[d]=(g[d]||0)+1;}
console.log('总键数', keys.length);
for(const [d,n] of Object.entries(g).sort((a,b)=>b[1]-a[1])) console.log(String(n).padStart(4), d);
"
```

产出的域清单要逐个在 `.work/feature-inventory.md` 里标注归属章节。
**任何一个域没有归宿 = 覆盖不全。**

### 1.2 导出某个域的全部中英文案

把 `interaction.` 换成你要查的前缀：

```bash
cd ~/Git/web-skill-sdk && node -e "
const fs=require('fs'); const PREFIX='interaction.';
const s=fs.readFileSync('packages/chatbot/src/i18n.ts','utf8');
const enP=s.slice(s.indexOf('en: {'), s.indexOf('zh: {')), zhP=s.slice(s.indexOf('zh: {'));
const g=p=>{const m={};for(const x of p.matchAll(/'([\w.]+)':\s*\n?\s*'((?:[^'\\\\]|\\\\.)*)'/g))m[x[1]]=x[2];return m;};
const E=g(enP), Z=g(zhP);
for(const k of Object.keys(E).filter(k=>k.startsWith(PREFIX)))
  console.log(k+'\n  EN: '+E[k]+'\n  ZH: '+(Z[k]||'(缺)'));
"
```

用途：写某一章前先把该章涉及的文案域全导出来，**照着界面真实措辞写**，
这样文档里的每个加粗词都能在界面上找到。

---

## 2. console 页面清单与页面简介

### 2.1 25 个页面与分组

```bash
cd ~/Git/web-skill-sdk && sed -n '/export type ConsolePage/,/^$/p' packages/console/src/react/nav.ts
cd ~/Git/web-skill-sdk && sed -n '/export const CONSOLE_NAV/,/as const satisfies/p' packages/console/src/react/nav.ts
```

第二条给出**分组与页面顺序**——第 19-23 章的小节顺序必须与它一致。

### 2.2 每页的 label 与 purpose

```bash
cd ~/Git/web-skill-sdk && node -e "
const fs=require('fs');
const s=fs.readFileSync('packages/console/src/react/i18n.ts','utf8');
const enP=s.slice(s.indexOf('en: {'), s.indexOf('zh: {')), zhP=s.slice(s.indexOf('zh: {'));
const g=p=>{const m={};for(const x of p.matchAll(/'([\w.]+)':\s*\n?\s*'((?:[^'\\\\]|\\\\.)*)'/g))m[x[1]]=x[2];return m;};
const E=g(enP), Z=g(zhP);
const pages=[...new Set(Object.keys(E).filter(k=>k.startsWith('page.')).map(k=>k.split('.').slice(1,-1).join('.')))];
console.log('页面数:', pages.length);
for(const p of pages)
  console.log('['+p+'] '+Z['page.'+p+'.label']+' / '+E['page.'+p+'.label']+'\n  ZH: '+(Z['page.'+p+'.purpose']||'')+'\n  EN: '+(E['page.'+p+'.purpose']||''));
"
```

预期输出 **25 个页面**。这是第四部分的写作底稿。

> **重要：只取 `purpose`，绝对不要用 `capability`。**
> `capability` 是写给实现者看的，内容形如
> `@webskill/core SkillDiscovery + SkillCatalog.`——
> 出现在用户文档里就是严重的视角事故。

---

## 3. 运行限制的默认值

用户会问「为什么助手自己停了」，必须给出真实数字：

```bash
cd ~/Git/web-skill-sdk && grep -n "DEFAULT_LOOP_LIMITS" -A 15 packages/runtime/src/engine/limits.ts
```

把取到的默认步数/时长写进第 11 章与第 23 章（运行时设置），
并说明「达到上限时你会看到什么、可以怎么继续」。

---

## 4. 扩展版能力取证

### 4.1 权限清单

```bash
cd ~/Git/web-skill-sdk && node -e "
const m=require('./examples/browser-extension/manifest.json');
console.log('permissions:', (m.permissions||[]).join(', '));
console.log('host_permissions:', (m.host_permissions||[]).join(', '));
console.log('side_panel:', JSON.stringify(m.side_panel||null));
console.log('sandbox:', JSON.stringify(m.sandbox||null));
console.log('content_scripts:', (m.content_scripts||[]).map(c=>c.matches.join('|')).join(' ;; '));
"
```

实测结果（0.19.0）：
`sidePanel, storage, tabs, scripting, webNavigation, downloads` + `<all_urls>`，
沙箱页 `sandbox.html`、`view.html`。

**每一项权限都要在文档里翻译成用户能理解的一句能力**，例如
`tabs` + `<all_urls>` → 「扩展版可以同时看多个标签页，网页版只能看自己所在的这一个」。
这是第 15 章与第 31 章的事实依据。

### 4.2 扩展独有的工具面

```bash
cd ~/Git/web-skill-sdk && ls packages/agent/src/tabs/ packages/agent/src/pageAction/ packages/agent/src/prompts/
cd ~/Git/web-skill-sdk && grep -rn "deny\|reject\|blocked\|not allowed" packages/agent/src/pageAction/policy.ts packages/agent/src/tabs/policy.ts | head -20
```

第二条给出**什么会被拒绝**，对应界面上工具状态的「被策略拒绝」，
是写安全边界与排错章的关键素材。

---

## 5. Demo 素材（站点仓库）

```bash
cd ~/Git/web-skill-site && sed -n '1,12p' src/demo/types.ts                       # 7 个屏
cd ~/Git/web-skill-site && grep -oE "name: '[a-z_]+'" src/demo/webskill/pageSkills.ts | sort -u   # 8 个页面工具
cd ~/Git/web-skill-site && ls public/skills/builtin/                              # 13 个内置技能
cd ~/Git/web-skill-site && cat src/demo/webskill/quickPrompts.ts                  # 快捷提示（中英）
```

每个内置技能的说明书在 `public/skills/builtin/<name>/`，
读它的 `SKILL.md`（或同名说明文件）能知道**这个技能声称能做什么**，
写场景章时用来对齐预期。

---

## 6. 验收清单

```bash
cd ~/Git/web-skill-sdk && ls verify/agent/ verify/human/
cd ~/Git/web-skill-sdk && cat verify/agent/05-interactions.md      # 举例：六种交互卡
```

按 [01-source-map.md](01-source-map.md) §2 的映射表，
写每章前先读完对应的 verify 文件。

---

## 7. 尚未实现的能力（避免写错）

```bash
cd ~/Git/web-skill-sdk && cat docs/deferred-items.md
```

**动笔前必读。** 这份文件列出了明确延后实现的事项，
写作时若某个能力在这里出现，一律不写（也不要写"即将支持"）。

---

## 8. 事实基线模板

第 0 步的产物 `.work/feature-inventory.md` 用这个格式：

```markdown
# 事实基线（生成于 YYYY-MM-DD，SDK 0.19.0）

## chatbot 文案域覆盖（共 N 域 / M 条）

| 域             | 条数 | 归属章 | 状态 |
| -------------- | ---- | ------ | ---- |
| interaction.\* | 62   | 8      | 待写 |

## console 页面覆盖（共 25 页）

| 页面 id        | 中文名 | 归属章 | 状态 |
| -------------- | ------ | ------ | ---- |
| skills.library | 技能库 | 18     | 待写 |

## 扩展独有能力

| 能力 | 权限依据 | 归属章 |

## 已确认不写（含理由）

| 项 | 理由 |
```

「状态」列在写作过程中更新为 待写 / 已写 / 已配图 / 已审。
**这张表就是覆盖度的验收依据。**
