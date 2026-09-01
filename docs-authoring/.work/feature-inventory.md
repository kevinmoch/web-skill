# 事实基线（生成于 2026-08-31，SDK 文档系列 0.19.0）

> 本文件所有数字均来自 2026-08-31 在 `~/Git/web-skill-sdk`（HEAD `f1bf5be`）
> 与 `~/Git/web-skill-site` 实际执行的提取命令（命令见 04-sourcing/02-extraction-recipes.md），
> 不是手册转述。与 README §5 基准表的逐项比对见本文末节。

## 0. 与手册基准的差异总览

| 基准项               | 手册基准                                                      | 实测             | 结论                                    |
| -------------------- | ------------------------------------------------------------- | ---------------- | --------------------------------------- |
| console 导航分组     | 6 组                                                          | 6 组             | ✅ 一致                                 |
| console 可直达页面   | 25 页                                                         | 25 页            | ✅ 一致                                 |
| chatbot 用户文案条目 | 377 条（en）                                                  | 377 条           | ✅ 一致                                 |
| chatbot 文案域       | 26 个前缀                                                     | **28 个前缀**    | ⚠️ **实测值与手册基准不符**——见 §1 说明 |
| 扩展权限             | sidePanel, storage, tabs, scripting, webNavigation, downloads | 同左             | ✅ 一致                                 |
| 扩展宿主权限         | `<all_urls>`                                                  | `<all_urls>`     | ✅ 一致                                 |
| 扩展沙箱页           | `sandbox.html`, `view.html`                                   | 同左             | ✅ 一致                                 |
| 验收清单             | verify/agent/ 30 份 + verify/human/ 13 份                     | 30 + 13          | ✅ 一致                                 |
| Demo 屏幕            | 7 个                                                          | 7 个             | ✅ 一致                                 |
| Demo 页面工具        | 8 个                                                          | 8 个             | ✅ 一致                                 |
| Demo 内置技能        | 13 个                                                         | 13 个            | ✅ 一致                                 |
| 站点 i18n 键         | 198 条                                                        | 198 条（叶子键） | ✅ 一致                                 |

> ⚠️ **唯一不符项：chatbot 文案域数。** 实测 en 段有 **28** 个不同前缀；
> 手册（README §5 与 01-architecture/01 §3）写 26 个，是因为它把
> `app` / `common` / `a11y` 三个各 1 条的前缀合并成了一行。
> 以源码为准：**28 个前缀域**，映射表见 §1（三个小前缀仍合并归属第 4 章）。

---

## 1. chatbot 文案域覆盖（共 28 域 / 377 条 en）

出处：`packages/chatbot/src/i18n.ts`（en 段起始于第 11 行，zh 段起始于第 466 行）。
归属章参照 01-architecture/01-information-architecture.md §3。

| 域                | 条数 | 首行        | 归属章                         | 处置           | 状态 |
| ----------------- | ---- | ----------- | ------------------------------ | -------------- | ---- |
| `settings.*`      | 111  | i18n.ts:302 | 22（console 设置）+ 12（模型） | 写             | 待写 |
| `interaction.*`   | 62   | i18n.ts:147 | **8**（六种交互卡）            | 写             | 待写 |
| `composer.*`      | 34   | i18n.ts:254 | 5（提问）+ 10（附件语音拍照）  | 写             | 待写 |
| `session.*`       | 24   | i18n.ts:24  | **6**（管理会话）              | 写             | 待写 |
| `message.*`       | 14   | i18n.ts:55  | 5（消息操作）                  | 写             | 待写 |
| `surface.*`       | 14   | i18n.ts:217 | **9**（生成式界面）            | 写             | 待写 |
| `error.*`         | 14   | i18n.ts:448 | 29（排错）                     | 写             | 待写 |
| `tool.*`          | 12   | i18n.ts:90  | **11**（看懂助手在做什么）     | 写             | 待写 |
| `trace.*`         | 12   | i18n.ts:108 | 11                             | 写             | 待写 |
| `welcome.*`       | 10   | i18n.ts:56  | 3（五分钟上手）+ 4（界面导览） | 写             | 待写 |
| `header.*`        | 9    | i18n.ts:14  | 4（界面导览）                  | 写             | 待写 |
| `run.*`           | 8    | i18n.ts:131 | 11                             | 写             | 待写 |
| `status.*`        | 8    | i18n.ts:240 | 11                             | 写             | 待写 |
| `todo.*`          | 6    | i18n.ts:140 | 11（任务清单）                 | 写             | 待写 |
| `toast.*`         | 5    | i18n.ts:42  | 5（含撤销 Undo）               | 写             | 待写 |
| `capability.*`    | 5    | i18n.ts:85  | **12**（模型能力标记）         | 写             | 待写 |
| `perception.*`    | 5    | i18n.ts:119 | **13**（页面感知）             | 写             | 待写 |
| `cot.*`           | 4    | i18n.ts:103 | 11（思考过程）                 | 写             | 待写 |
| `candidate.*`     | 4    | i18n.ts:113 | 20（治理复核）+ 7（技能）      | 写             | 待写 |
| `result.*`        | 4    | i18n.ts:235 | **16**（产物）                 | 写             | 待写 |
| `banner.*`        | 3    | i18n.ts:249 | 5（中断提示）                  | 写             | 待写 |
| `vercel.*`        | 3    | i18n.ts:440 | 9（生成式界面的一种渲染档）    | 写             | 待写 |
| `app`             | 1    | i18n.ts:12  | 4                              | 合并到第 4 章  | 待写 |
| `common`          | 1    | i18n.ts:41  | 4                              | 合并到第 4 章  | 待写 |
| `a11y`            | 1    | i18n.ts:447 | 4                              | 合并到第 4 章  | 待写 |
| `thinking`        | 1    | i18n.ts:107 | 11                             | 合并到第 11 章 | 待写 |
| `skillGeneration` | 1    | i18n.ts:160 | 7                              | 合并到第 7 章  | 待写 |
| `attachment`      | 1    | i18n.ts:276 | 10                             | 合并到第 10 章 | 待写 |

合计校验：111+62+34+24+14+14+14+12+12+10+9+8+8+6+5+5+5+4+4+4+3+3+1×6 = 377 ✅
无孤儿域：28 个前缀全部有归宿。

---

## 2. console 页面覆盖（共 25 页 / 6 组）

出处：`packages/console/src/react/nav.ts:8`（`ConsolePage` 联合类型，25 个 id）、
`nav.ts:50`（`CONSOLE_NAV`，6 组）；label/purpose 取自
`packages/console/src/react/i18n.ts`（en 段 `page.*.label` 起始于 i18n.ts:80，
zh 段起始于 i18n.ts:1695）。**只取 `purpose`，不取 `capability`**（视角纪律）。

分组与顺序（第 18–22 章小节顺序必须与此一致）：
overview(1) → skills(4) → runs(3) → governance(5) → connections(4) → settings(8) = 25 ✅

| 页面 id             | 中文名（label） | purpose（中文，写作底稿）                                                                                          | 归属章 | 处置 | 状态 |
| ------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------ | ------ | ---- | ---- |
| overview            | 概览            | 工作区健康度：真实指标、待办队列与最近运行。                                                                       | 17     | 写   | 待写 |
| skills.library      | 技能库          | 所有已安装技能的来源、状态与使用情况。                                                                             | 18     | 写   | 待写 |
| skills.editor       | 编辑器          | 编辑技能文件，保存即校验 SKILL.md 契约。                                                                           | 18     | 写   | 待写 |
| skills.transfer     | 安装与导出      | 从压缩包、URL 或目录安装技能，并把自有技能打包分发。                                                               | 18     | 写   | 待写 |
| skills.integrity    | 完整性与清单    | 按 manifest 与 lockfile 做逐文件 SHA-256 校验。                                                                    | 18     | 写   | 待写 |
| runs.activity       | 运行记录        | 每次运行的状态、耗时与激活的技能。                                                                                 | 19     | 写   | 待写 |
| runs.inspector      | 运行详情        | 单次运行的生命周期时间线、工具调用、大模型往返与产物。                                                             | 19     | 写   | 待写 |
| runs.sessions       | 会话与记忆      | 会话消息、三个记忆作用域，以及中断运行的快照。                                                                     | 19     | 写   | 待写 |
| governance.review   | 审批队列        | 候选技能进入技能库前的人工审查。                                                                                   | 20     | 写   | 待写 |
| governance.audit    | 审计日志        | 发布、回滚与状态变更的哈希链记录。                                                                                 | 20     | 写   | 待写 |
| governance.versions | 版本            | 版本历史、回滚与技能状态机。                                                                                       | 20     | 写   | 待写 |
| governance.eval     | 评估            | 任务集、批量执行与回归报告。                                                                                       | 20     | 写   | 待写 |
| governance.insights | 洞察            | 评分维度、重复技能、依赖图与使用统计。                                                                             | 20     | 写   | 待写 |
| connections.models  | 大模型          | 智能体可以使用的模型列表。在对话框里用户可按会话选择，未选择时用默认项。一个模型都没配时运行时回退到内置演示模型。 | 21     | 写   | 待写 |
| connections.mcp     | MCP 端点        | 远程 MCP 服务器的连接状态与暴露的工具。                                                                            | 21     | 写   | 待写 |
| connections.webmcp  | WebMCP 工具     | 当前页面通过浏览器 WebMCP 通道暴露给模型的工具。                                                                   | 21     | 写   | 待写 |
| connections.page    | 页面技能        | 当前页面声明的临时技能，随页面生成或销毁。                                                                         | 21     | 写   | 待写 |
| settings.runtime    | 智能体运行时    | 循环护栏、交互策略、路由策略与输出形态。                                                                           | 22     | 写   | 待写 |
| settings.sandbox    | 沙箱与安全      | 执行器档位、网络策略与逐能力审批。                                                                                 | 22     | 写   | 待写 |
| settings.genui      | 生成式 UI       | 由哪套框架渲染智能体生成的界面，以及它的外观。                                                                     | 22     | 写   | 待写 |
| settings.prompts    | 快捷指令        | 对话欢迎页上一点即发的常用指令。                                                                                   | 22     | 写   | 待写 |
| settings.trust      | 信任与签名      | 管理信任的签名密钥，以及未签名技能的处置方式。                                                                     | 22     | 写   | 待写 |
| settings.privacy    | 隐私与用户画像  | 智能体是否从你的回答里学习，以及它在本机保留了什么。                                                               | 22     | 写   | 待写 |
| settings.appearance | 外观            | 本工作区的主题与语言。                                                                                             | 22     | 写   | 待写 |
| settings.about      | 关于与诊断      | 版本、存储用量与诊断导出。                                                                                         | 22     | 写   | 待写 |

---

## 3. 扩展版能力（manifest 实测）

出处：`examples/browser-extension/manifest.json:7`（permissions）、`:8`（host_permissions）、
`:28`（side_panel）、`:47`（sandbox.pages）。content_scripts 两段均匹配 `<all_urls>`。

| 能力           | 权限依据                      | 用户语言翻译（写作用）                             | 归属章     | 处置 |
| -------------- | ----------------------------- | -------------------------------------------------- | ---------- | ---- |
| 侧栏形态       | `sidePanel`（sidepanel.html） | 助手住在浏览器侧栏，不依赖某个网站                 | 2、15      | 写   |
| 本地配置存储   | `storage`                     | 设置与授权记录保存在本机浏览器里                   | 22、30     | 写   |
| 跨标签页工作   | `tabs` + `<all_urls>`         | 可以同时看/操作多个标签页（限工作集）              | **15**、28 | 写   |
| 读写任意网页   | `scripting` + `<all_urls>`    | 能读能操作你打开的任意网页（网页版仅限自身所在页） | 13、14、28 | 写   |
| 跟随标签页切换 | `webNavigation`               | 切换标签页后绑定自动跟过去                         | 15         | 写   |
| 下载文件       | `downloads`                   | 能替你下载文件，且能感知下载是否真的发生           | 16         | 写   |
| 沙箱执行       | `sandbox.pages`: sandbox.html | 技能脚本跑在独立沙箱页                             | 22、30     | 写   |
| 投放查看器     | `sandbox.pages`: view.html    | 大屏/幻灯片在独立窗口放映，开窗前需确认卡同意      | 16、26     | 写   |

配套约束（每处强能力同屏必写，见 04-sourcing/03 §5）：密码框不读不记、
工作集外标签页枚举不到、不抢占用户画面、下载授权可撤销、换页清端点、嵌入帧端点不接管。

---

## 4. verify/ 验收清单实测

出处：`ls verify/agent/ verify/human/`（2026-08-31 实测）。

### verify/agent/（30 份，编号 00–29）

00-overview / 01-environment / 02-chat-basics / 03-message-fidelity / 04-skills /
05-interactions / 06-generative-ui / 07-attachments / 08-page-perception /
09-page-actions / 10-models / 11-runtime-limits / 12-sessions-memory /
13-privacy-profile / 14-mcp-endpoints / 15-sandbox-security / 16-install-trust /
17-console-skills / 18-console-runs / 19-governance-review / 20-governance-audit /
21-governance-versions / 22-governance-eval-insights / 23-console-connections /
24-console-settings / 25-theme-visual / 26-console-shell / 27-linked-documents /
28-catalog-visuals / 29-container-layout

供给章节映射照 04-sourcing/01 §2 表，实测文件名与手册表逐字一致。

### verify/human/（13 份，编号 00–12）

00-overview / 01-voice-dictation / 02-chrome-builtin-ai / 03-webmcp-host-page /
04-downloads-filesystem / 05-persistence / 06-appearance-responsive /
07-network-resilience / 08-accessibility-concurrency / 09-oauth-page-actions /
10-document-print / 11-real-model-behavior / 12-camera-capture

注：手册 01-source-map.md §2 的 human 表只列了 12 份（01–12），
实测多出的 `00-overview.md` 是第 13 份，README §5 的「13 份」口径正确。

---

## 5. Demo 素材实测（站点仓库）

| 素材                                | 实测                                                                                                                                                                                                                                                                                       | 出处                                                        | 归属章              | 处置                         |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- | ------------------- | ---------------------------- |
| Demo 屏幕                           | 7 个：overview / requirements / sprints / bugs / tests / metrics / webskill-manager                                                                                                                                                                                                        | `src/demo/types.ts:3`                                       | 3、23–27            | 写                           |
| 页面工具                            | 8 个：list_projects(:99) / list_requirements(:29) / list_sprints(:48) / list_bugs(:60) / list_test_suites(:79) / get_dora_metrics(:91) / get_field_history(:137) / navigate_to_screen(:107)                                                                                                | `src/demo/webskill/pageSkills.ts`（PAGE_TOOLS 数组 :26 起） | 7、11、13、23–27    | 写                           |
| 页面技能（按屏）                    | PAGE_SKILLS 按 7 屏分组（含 page-view-summary :170、requirement-kanban-alignment :183 等）                                                                                                                                                                                                 | `src/demo/webskill/pageSkills.ts:166`                       | 7、23–27            | 写                           |
| 内置技能                            | 13 个：agile-ops-dashboard / agile-ops-screen / agile-slide-deck / authored-bulletin / authored-screen / authored-slides / bug-screenshot-triage / cross-project-health / quality-bulletin / requirement-doc-digest / sprint-closeout / sprint-progress-report / sprint-weekly-brief       | `public/skills/builtin/`                                    | 7、16、23–27        | 写                           |
| 站点 i18n 键                        | 198 条（zh.json 叶子键实测）                                                                                                                                                                                                                                                               | `src/locales/zh.json`                                       | 站点集成（第 6 步） | 写文档模块时新增键须中英同步 |
| **成对技能（固定模板 / 动态构建）** | **3 对**：大屏 `agile-ops-screen` ↔ `authored-screen`；公文 `quality-bulletin` ↔ `authored-bulletin`；幻灯片 `agile-slide-deck` ↔ `authored-slides`。固定模板取数口径与版式写死、改不动；动态构建按用户限定的范围现场排版，可反复改版重投。选用规则写在各自 `SKILL.md` 的 `description` 里 | `public/skills/builtin/*/SKILL.md` 头部                     | **7、25、26、29**   | 写（本次补入）               |

---

## 5.1 逐项处理列表（本次补入）

内部术语「扇出—汇聚」，**文档中禁止出现该词**，对用户叫「逐项处理一个列表」。

| 事实                 | 实测值                                                                      | 出处                                                           | 归属章 |
| -------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- | ------ |
| 一轮工作集容量       | 默认 32，可调范围 2 ~ 32                                                    | `packages/agent/src/tabs/policy.ts:6,9,12`                     | 15     |
| 撞上限的表现         | `workset-full` 硬拒绝；模型中途收尾，**无入口向用户要更多配额**             | 同上 `:162` + `docs/0.17.0/18-req-workset-capacity-default.md` | 15、29 |
| 页面失效             | `expired`（认识但不在了）/ `unknown`（没见过或跨会话）                      | `policy.ts:91,112,136`                                         | 15、29 |
| 支持层数             | 至少三层下钻与逐层回退                                                      | `docs/0.16.0/16-req-panel-navigation-and-focus.md` FR-16.6     | 15     |
| 页面操作动作         | 8 种：click / fill / submit / select / set / attach / **scroll** / **back** | `packages/agent/src/pageAction/types.ts:63`                    | 14     |
| 操作后的去向         | 4 种：打开新页 / 当前页跳转 / 弹出对话框 / 无变化                           | `packages/agent/src/prompts/pageAction.ts`                     | 14     |
| 滚动的停止条件       | 仅当页面表明有更多内容时才滚，`atEnd` 为真即停                              | 同上                                                           | 14     |
| **网页版能到哪一步** | 同站内靠「跳转 + 后退」也能逐项往返；做不到跨标签页/跨站点/多页并留         | `docs/0.16.0/13-req-action-destination-signal.md` §3           | 15、28 |

---

## 6. deferred-items 中影响第 4 / 5 / 7 / 11 章的条目（写作红线）

出处：`docs/deferred-items.md`（2026-08-31 实测全文）。**以下能力一律不写，
也不写「即将支持」。**

| 条目            | 位置                  | 影响章      | 不准写的内容                                                                                                                                                               |
| --------------- | --------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D15（残留子项） | deferred-items.md:185 | 4、5、7、12 | 消息分支（branch picker）、消息反馈（👍/👎）、follow-up 建议、语音朗读、**composer 内模型选择器**、**composer 内 SkillPicker**——界面上没有这些入口，导览与操作步骤不得提及 |
| D30             | deferred-items.md:365 | 4、5        | 「把某次对话手动降级为纯聊天」的开关不存在（`composer.plainChatOnly` 无消费方），不写                                                                                      |
| D26             | deferred-items.md:316 | 11          | 并发多智能体：委派是**串行**的，子代理是独立的一次运行、父级顺序等待——不要写成并行执行                                                                                     |
| D44（部分）     | deferred-items.md:532 | 11          | 思考过程的展示以现有 `cot.*` 界面为准；不要描述成 assistant-ui 官方 chain-of-thought 组件形态（该组件线未接入，官方原语已 legacy）                                         |
| D53             | deferred-items.md:689 | 7、14       | 「可回放页面操作的技能」不存在：技能存不下可重放的目标标识，沙箱脚本也摸不到页面 DOM——不写「录制一次、以后自动重放」类用法                                                 |
| D62             | deferred-items.md:811 | 7、11       | 委派给子代理的步骤**不在本会话的留存轨迹里**：运行步进/轨迹里看不到子代理细节，「从轨迹生成技能」时委派里做过的调用不能写进 steps                                          |

相邻章节的相关红线（非 4/5/7/11，但写作时同批注意）：
D41（表单动态选项/远程搜索不存在，:484 → 第 8、9 章）、
D45（a2ui 档 `arrayFirstItemOnly` 一句文案中文界面下显示英文，:563 → 第 9 章）、
D63（没有 wait_for_downloads 工具，:826 → 第 14、16 章）、
D57（本地技能治理状态在 Library/Integrity 无呈现，:744 → 第 19 章）、
D58（portal 内容不进页面感知轮廓，日期格读不到，:754 → 第 13、14 章）、
D64/D65（页面拖拽、横向滚动不做，:851/:864 → 第 14 章）。

---

## 7. 已确认不写（含理由）

| 项                                              | 依据（deferred-items.md） | 理由                                              |
| ----------------------------------------------- | ------------------------- | ------------------------------------------------- |
| 消息分支 / 消息反馈 / follow-up 建议 / 语音朗读 | D15（:185）               | 刻意不做（0.5.0 规划会维持）                      |
| composer 内模型选择器 / SkillPicker             | D15（:185）               | 刻意不做；模型选择走头部/连接页，技能靠触发与徽章 |
| 手动降级纯聊天开关                              | D30（:365）               | 未实现，语义未定                                  |
| 并发多智能体                                    | D26（:316）               | 串行委派是既定模型                                |
| 页面操作回放技能                                | D53（:689）               | 无可重放目标标识，架构上不可能                    |
| 任意 HTML 模板渲染                              | D27（:322）               | **正式关闭，永不规划**（XSS 面）                  |
| 平板档专项适配                                  | D50（:663）               | 0.9.0 明确不做                                    |
| 整页栅格化抓取                                  | D28（:336）               | 只做可视区截图                                    |
| 跨设备用户画像同步                              | D29（:345）               | 画像只存本机                                      |
| 摄像头视频流（连续流）                          | D25（:310）               | 只做拍照（CameraCaptureDialog 已存在，可写）      |
| MCP OAuth / stdio 之外的扩展                    | D11（:136）               | OAuth 已排 0.7.0 但文档以已发布行为为准           |
| 暗色容器内嵌亮色区块                            | D34（:405）               | 只支持亮色内嵌暗色                                |
| Windows 宿主                                    | D16-A（:198）             | 正式关闭 + 文档诚实声明                           |
| `wait_for_downloads` 独立工具                   | D63（:826）               | 明确不做                                          |
| 页面拖拽 / 横向滚动                             | D64 / D65（:851 / :864）  | 0.18.0 非目标                                     |
| 表单远程搜索 / 动态选项                         | D41（:484）               | 四档渲染器均未实现                                |
| SDK 接入 / API / 架构实现                       | 00-charter/02             | 超出用户文档范围                                  |

---

## 6. 第三轮排查补入的能力（2026-08，用户感知强但曾整块遗漏）

### 6.1 附件是四类，不是三类

依据 `packages/core/src/attachment/kind.ts`。

| 界面词 | 格式 | 发出去的是什么 |
| --- | --- | --- |
| 图片 | png jpeg webp gif | 图片本身，可能被压缩；每条有张数上限 |
| 文本 | txt md csv json log yaml yml | 文字，**上限 32 KB，超出截断** |
| 文件 | pdf | 整份发给模型 |
| 文档正文 | **docx xlsx** | **在浏览器里抽成文字后只发文字，原文件不外发** |

「能不能传 Excel」是读者最想知道的问题之一，旧稿一个字没写。
docx/xlsx 的本地抽取同时是隐私卖点 → 第 10、29、33 章三处呼应。

### 6.2 页面动作的授权是分级的

依据**宿主** `src/demo/webskill/actions.ts`（不在 SDK 里，按域清点查不到）：

- `PREAUTHORIZED = ['fill', 'select']` —— 填写、选择**不弹确认卡**
- click / submit / set / attach —— **一律弹**
- 点拒绝只让该动作失败并记审计（`PAGE_ACTION_DECLINED`），**整轮运行继续**
- 接了 `consent` 才有「不再询问」，与 console 连接页同一份存储，**撤销即时生效**

旧稿写成「每一步都要你同意」，会直接劝退读者（见陷阱 21）。

### 6.3 把对话存成技能

`skillGeneration`：SDK 默认关，**Demo 默认开**，
`src/demo/webskill/runtime.ts:70` 原话称其为「本 demo 的卖点之一」。

- 确认文案含「请逐字检查下方预览，确认没有不应被保存的内容」——责任提示，不得弱化
- 提交后进**审批队列**，`candidate.submitted`：「审批并发布后才能使用」
- 给候选 ID（可复制）+「去审批」跳转
- **坑**：本轮有步骤被委派时可能存不成（`docs/deferred-items.md` D62）

### 6.4 委派子任务

`todo.delegatedTo`「已委派给 {skill}」——用户在任务清单里看得见。
**串行**，不是并行（D26）。

### 6.5 Demo 快捷提示词 = 产品自选的卖点清单

`src/demo/webskill/quickPrompts.ts` 每条都对应一个可跑通的场景。
第 27/28/29 章与候选场景库全部取自这里，**没有一条是编的**。
后续扩充场景章时**先读这个文件**。

素材：`public/demo/attachment/` 有 10+ 份中英文 `.docx`，**无 `.xlsx`**。
