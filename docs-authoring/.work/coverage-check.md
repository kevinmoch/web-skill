# 覆盖度核对（验收 §1）— 生成于 2026-09-01

核对方法：按 `docs-authoring/04-sourcing/02-extraction-recipes.md` 的命令在
`~/Git/web-skill-sdk`（HEAD `f1bf5be`，0.19.0 系列）与本仓库重新执行提取，
与 `src/docs/zh/` 33 章逐条比对。✓ = 已覆盖（注明落点）；✗ = 打不上勾。

## 1. chatbot 文案域（实测 28 个前缀 / 377 条 en）

> 手册基准 26 个前缀；实测 28 个（`app`/`common`/`a11y` 三个 1 条前缀被手册合并计数）。
> 以源码为准，28 个全部有归宿（依据 `.work/feature-inventory.md` §1，本次逐域抽查复核）。

| 域 | 条数 | 落点章 | 核对结果 |
| --- | --- | --- | --- |
| settings.* | 111 | 23（八个设置页逐节）+ 12（模型） | ✓ |
| interaction.* | 62 | 8（六种卡各一节）+ 14（pageAction.* 授权分级） | ✓ |
| composer.* | 34 | 5（发出消息）+ 10（附件/语音/拍照） | ✓ |
| session.* | 24 | 6（新建/切换/重命名/归档/删除） | ✓ |
| message.* | 14 | 5（复制/编辑/重试/删除） | ✓ |
| surface.* | 14 | 9（生成式界面五种形态） | ✓ |
| error.* | 14 | 32（全部 14 键，见下表） | ✓ |
| tool.* | 12 | 11（工具调用行、被策略拒绝） | ✓ |
| trace.* | 12 | 11（运行流程、trace.phase 六阶段） | ✓ |
| welcome.* | 10 | 3 + 4 | ⚠️ 部分：标题/描述/快捷示例已写；`welcome.capability.*`（三张能力卡）在 chatbot 源码中无调用点（死字符串），第 1、3 章正文仍按"有三张能力卡"描述——见验收报告问题 P-01 |
| header.* | 9 | 4（头部按钮逐个） | ✓ |
| run.* | 8 | 11（终止原因表，逐字一致） | ✓ |
| status.* | 8 | 11 | ⚠️ 该域 8 键在 chatbot src 无调用点（阶段名实际由 trace.phase.* 渲染）；第 8 章「运行状态显示等待输入」的表述依赖 status.interact，实测与源码均不支持——见验收报告问题 P-02 |
| todo.* | 6 | 11（任务清单） | ✓ |
| toast.* | 5 | 5（删除撤销 toast） | ✓ |
| capability.* | 5 | 12（模型能力标记） | ✓ |
| perception.* | 5 | 13（读取范围提示） | ✓ |
| cot.* | 4 | 11（思考过程） | ✓ |
| candidate.* | 4 | 21（审批队列）+ 7（存技能） | ✓ |
| result.* | 4 | 16（产物卡） | ✓ |
| banner.* | 3 | 5（中断恢复横幅，"停在表单类卡片上才有"已按实测写） | ✓ |
| vercel.* | 3 | 9（渲染档只显示第一项） | ✓ |
| app / common / a11y | 1+1+1 | 4（界面分区、键盘与读屏提示） | ✓ |
| thinking | 1 | 11 | ✓ |
| skillGeneration | 1 | 7（存技能确认卡） | ✓ |
| attachment | 1 | 10（每条消息图片张数上限提示） | ✓ |

**结论：28 域中 26 域完全打勾；welcome.* 与 status.* 两域部分打勾（各含一处正文与实现不符，详见验收报告 P-01/P-02）。**

## 2. console 页面（实测 25 页 / 6 组，与 nav.ts 顺序一致）

| 组（nav.ts 顺序） | 页面 | 落点 | 结果 |
| --- | --- | --- | --- |
| overview | overview | 18「概览页」节 | ✓ |
| skills | skills.library / .editor / .transfer / .integrity | 19 四个 h3（技能库→编辑器→安装与导出→完整性与清单） | ✓ 顺序一致 |
| runs | runs.activity / .inspector / .sessions | 20 三个 h3 | ✓ 顺序一致 |
| governance | governance.review / .audit / .versions / .eval / .insights | 21 五个 h3 | ✓ 顺序一致 |
| connections | connections.models / .mcp / .webmcp / .page | 22 四个 h3 | ✓ 顺序一致 |
| settings | settings.runtime / .sandbox / .genui / .prompts / .trust / .privacy / .appearance / .about | 23 八个 h3 | ✓ 顺序一致 |

25/25 ✓。每页有独立小节（h3 或 18 章的 h2 节），顺序与 `CONSOLE_NAV` 一致。

## 3. 交互卡类型（6 种）→ 第 8 章

| 卡 | 章节小节 | 配图 |
| --- | --- | --- |
| ask（需要回答） | ✓ | S-interactions-01 ✓ |
| confirm（请确认） | ✓ | S-interactions-02 ✓ |
| form（需要补充信息） | ✓ | S-interactions-03 ✓ |
| select（选择一个选项） | ✓ | S-interactions-04 ✓ |
| authorize（需要授权） | ✓ | S-interactions-05 ✓ |
| filePick（需要一个文件） | ✓ | S-interactions-06 ✓ |

6/6 ✓（另含建议值卡 S-interactions-09、已提交态、等待指示三张补充图）。

## 4. 运行终止原因（8 种）→ 第 11 章「它为什么停了」

`run.terminated.*` 8 键逐一比对，正文表格 8 行与 i18n 中文**逐字一致**，
每行均带处理建议：userCancelled / maxTurns / timeout / llmError /
interactionTimeout / hookError / toolResolutionExhausted / unknown = 8/8 ✓

## 5. 运行阶段（6 个）→ 第 11 章「一次运行分几个阶段」

路由 / 激活 / 执行 / 交互 / 完成 / 失败 = 6/6 ✓
（与渲染层实际使用的 `trace.phase.*` 六键一致；阶段会循环、停在交互是在等你，均已写明。）

## 6. 错误提示 error.*（14 条）→ 第 32 章

| 键 | 落点 |
| --- | --- |
| error.title（出错了） | 「错误卡上写了什么」节 ✓ |
| error.suggestion（通用建议） | 同节逐字引用 ✓ |
| error.suggestion.LLM_UNAVAILABLE / .LLM_REQUEST_FAILED | 「助手没有响应」节 + 断网节 ✓ |
| error.suggestion.RUN_TIMEOUT | 「运行中途停了」节 ✓ |
| error.suggestion.RUN_INTERACTION_TIMEOUT | 同节 ✓ |
| error.suggestion.RUN_MAX_TURNS_EXCEEDED | 同节 ✓ |
| error.suggestion.TOOL_RESOLUTION_EXHAUSTED | 同节 + 「技能相关的问题」节 ✓ |
| error.suggestion.TOOL_SCHEMA_UNAVAILABLE | 「结果不对或跑偏」节 ✓ |
| error.limit.totalTimeoutMs / .maxTurns | 「运行中途停了」节（与 suggestion 同引号列出） ✓ |
| error.message.RUN_CANCELLED | 「运行中途停了」节 ✓ |
| error.openSettings / error.dismiss | 「错误卡上写了什么」节（两个按钮） ✓ |

14/14 ✓

## 7. 内置技能（13 个）

13/13 在正文中出现（grep 核实），第 7 章全部提及：

- 三对「现成/现做」对照在第 7 章「两种技能」节以表格讲清：
  agile-ops-screen/authored-screen、quality-bulletin/authored-bulletin、
  agile-slide-deck/authored-slides ✓
- 其余 7 个（agile-ops-dashboard、bug-screenshot-triage、cross-project-health、
  requirement-doc-digest、sprint-closeout、sprint-progress-report、sprint-weekly-brief）
  在第 7 章技能库语境及场景章（24/25/27/29/30）中出现 ✓
- 第 26、27 章各演示一次「提修改 → 重做一版」（S-case-bul-05、S-case-slides-05 为证）✓
- 第 32 章有对应症状（「我只想微调，它却整份重做了一遍」「同样的需求，这次页数不一样」）✓

## 8. 页面操作动作（8 种）→ 第 14 章

click / fill / submit / select / set（拨开关、设值）/ attach（上传文件）/ scroll / back
= 8/8 ✓（含后退与滚动）；「它怎么知道自己点到哪了」一节存在并解释去向回报 ✓
授权分级「填写/选择不问、点击/提交要问」已写明 ✓

## 9. 附件类型（4 类）→ 第 10 章

文本 / 图片 / 文件 / 文档正文 = 4/4 ✓，格式表与 SDK `kind.ts` 完全一致
（png/jpeg/webp/gif；txt/md/csv/json/log/yaml/yml；pdf；**docx/xlsx 已写到**）✓
「本地抽取」事实在 10/29/33 三章说法一致（浏览器内读成文字、只发正文、原文件不外发）✓
⚠️ 三章均写「32 KB」截断上限，实测与源码注释均为 **32K 字符**（`body.length` 按字符计）——
口径问题见验收报告 P-03。

## 10. verify/human（13 篇）

| 篇 | 场景 | 落点 | 结果 |
| --- | --- | --- | --- |
| 00-overview | 总则（方法论） | 无需落章 | — |
| 01-voice-dictation | 语音听写 | 10「用说的代替打字」 | ✓ |
| 02-chrome-builtin-ai | 浏览器内置 AI | 12「浏览器自带的 AI」 | ✓ |
| 03-webmcp-host-page | WebMCP 宿主 | 22「WebMCP 工具」节 | ✓ |
| 04-downloads-filesystem | 下载与文件系统 | 16 下载节 + 17 全章 | ✓ |
| 05-persistence | 持久化 | 6「关掉页面会丢吗」 | ✓ |
| 06-appearance-responsive | 外观与响应式 | 23 外观节 + 4 窄屏 | ✓ |
| 07-network-resilience | 断网弱网 | 32「断网、弱网与多标签页」 | ✓ |
| 08-accessibility-concurrency | 无障碍/剪贴板/并发 | 4（键盘/读屏提示行）+ 5（复制）+ 32（多标签页） | ⚠️ 弱覆盖：键盘/读屏仅第 4 章一行提示语 |
| 09-oauth-page-actions | 登录态页面操作 | 14「登录状态下的操作」 | ✓ |
| 10-document-print | 文档打印 | 16「打印或存成 PDF」+ 26 | ✓ |
| 11-real-model-behavior | 真实模型行为 | 8（一次问全表单卡）+ 12（换模型影响） | ✓ |
| 12-camera-capture | 摄像头拍照 | 10「用摄像头拍一张」 | ✓ |

12/12 有落点（00 为总则）；08 一篇为弱覆盖，已记录。

## 11. 六项易漏主题（单独确认）

1. **现成/现做两类技能** ✓ —— 第 7 章独立节 + 对照表；26/27 章各一次「提修改→重做一版」；32 章两条症状。
2. **逐项处理一个列表** ✓ —— 第 15 章独立节：层数（至少三层下钻）✓、网页版能到哪一步（差别小节节四行表 + 应用内页签说明）✓、容量 32 与撞上限表现（中途收尾、要不来说明）✓；第 14 章去向/后退/滚动 ✓。全书 grep 无「扇出」 ✓。
3. **附件四类** ✓ —— 第 10 章格式表含 docx/xlsx；10/29/33 三处本地抽取说法一致 ✓。
4. **把对话存成技能** ✓ —— 第 7 章一节 + 第 30 章完整场景；「审批并发布后才能使用」与「请逐字检查下方预览」责任提示原文保留、未弱化 ✓。
5. **页面操作授权分级** ✓ —— 第 14 章「填写/选择不问、点击/提交要问」；全书 grep 无「每一步都要你同意」类说法 ✓。
6. **委派子任务** ✓ —— 第 11 章解释「已委派给 {技能}」、写明串行（一步一步来）、写明"被委派的步骤可能存不成技能"的坑及应对 ✓。

## 总评

- 完全打勾：console 25 页、交互卡 6、终止原因 8、运行阶段 6、error.* 14、
  内置技能 13、页面动作 8、附件 4 类、六项易漏主题。
- 部分打勾（移交验收报告问题清单）：
  - P-01 welcome.capability.*（死字符串）↔ 第 1/3 章「三张能力卡」表述；
  - P-02 status.* 死字符串 ↔ 第 8 章「运行状态显示等待输入」表述；
  - P-03 附件截断上限「32 KB」应为「32K 字符」（10/29/33 三章同一口径）；
  - verify/human 08 弱覆盖。
