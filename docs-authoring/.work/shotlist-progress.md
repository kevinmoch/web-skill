# 截图进度 — 用户文档第 1 轮（第 4/5/7/11 章，中文版）

日期：2026-08-31。环境：http://localhost:3000/demo（dev:sdk），chrome-devtools MCP，深色主题，中文界面。
视口 1440×900@2x（拍摄时 MCP 在截图瞬间套用该设备指标；实际窗口 1600×1000@1.8）。
tour-05 窄屏用 375×812@3x 拍摄后 sharp 缩到 750×1624。
抽屉宽度拍摄期间调为 1300px（会话列表停靠分栏），拍完已恢复 712px。

## 逐张状态（28/28 已拍）

### 04-chat-tour（5 张）
| 编号 | 路径 | 状态 |
| --- | --- | --- |
| S-chat-tour-01-overview | public/docs-assets/chat-tour/zh/S-chat-tour-01-overview.png | 已拍（无标注原图 + sharp 合成 #38bdf8 圆形 ①②③④；会话列表停靠入镜；201KB） |
| S-chat-tour-02-header | public/docs-assets/chat-tour/zh/S-chat-tour-02-header.png | 已拍（头部条裁剪；tooltip 未渲染进截图，按钮为图标态） |
| S-chat-tour-03-message-actions | public/docs-assets/chat-tour/zh/S-chat-tour-03-message-actions.png | 已拍（悬停助手回答，操作栏：复制/删除/查看追溯 + tokens） |
| S-chat-tour-04-composer | public/docs-assets/chat-tour/zh/S-chat-tour-04-composer.png | 已拍（输入区一排入口） |
| S-chat-tour-05-narrow | public/docs-assets/chat-tour/zh/S-chat-tour-05-narrow.png | 已拍（375×812 设备模拟；窄屏下助手是页面底部 384px 高的底栏，占满屏宽） |

### 05-chat-basics（7 张）
| 编号 | 路径 | 状态 |
| --- | --- | --- |
| S-chat-basics-01-streaming | …/chat-basics/zh/S-chat-basics-01-streaming.png | 已拍（运行中间帧：思考中+工具调用 spinner+首行正文+停止按钮） |
| S-chat-basics-02-stopped-content-kept | …/S-chat-basics-02-stopped-content-kept.png | 已拍（页内轮询脚本在正文 ~700 字时点停止；正文截断保留 + 红字「运行已被你中止」+ 技能标记） |
| S-chat-basics-03-message-actions | …/S-chat-basics-03-message-actions.png | 已拍（悬停用户消息：复制/编辑/重试/删除 4 图标） |
| S-chat-basics-04-edit-message | …/S-chat-basics-04-edit-message.png | 已拍（编辑输入态 + 取消/发送） |
| S-chat-basics-05-undo-toast | …/S-chat-basics-05-undo-toast.png | 已拍（删除后 toast「消息已删除/本提示消失后即永久移除/撤销/关闭」；toast 存活约 5s，需先清定时器冻住再截） |
| S-chat-basics-06-resume-banner | …/S-chat-basics-06-resume-banner.png | 已拍（表单卡等待输入时刷新页面，横幅「你有一轮未完成的对话…恢复」出现） |
| S-chat-basics-07-markdown | …/S-chat-basics-07-markdown.png | 已拍（同一回答两段裁剪拼接：标题/加粗/列表/表格 + 高亮 TS 代码块） |

### 07-skills-usage（8 张）
| 编号 | 路径 | 状态 |
| --- | --- | --- |
| S-skills-01-skill-badge | …/skills-usage/zh/S-skills-01-skill-badge.png | 已拍（消息尾「技能 authored-bulletin」标记） |
| S-skills-02-skills-used | …/S-skills-02-skills-used.png | 已拍（悬停信息图标出 tooltip「本轮运行使用的技能」+ 标记行） |
| S-skills-03-trace-skill | …/S-skills-03-trace-skill.png | 已拍（运行流程块：激活 agile-ops-dashboard 3.9s + 技能行） |
| S-skills-04-two-phrasings | …/S-skills-04-two-phrasings.png | 已拍（同会话两种说法均触发 sprint-progress-report，sharp 拼接） |
| S-skills-05-skill-library | …/S-skills-05-skill-library.png | 已拍→**重拍**（首版含本机档案残留的生成技能 defect-dora-snapshot；已从 OPFS `skills/user/` 删除后重拍，技能库恰为 13 个内置技能；1500px 宽 261KB） |
| S-skills-06-fixed-vs-authored | …/S-skills-06-fixed-vs-authored.png | 已拍（同会话：笼统→agile-ops-screen，限定范围→authored-screen，拼接对比） |
| S-skills-07-save-skill-confirm | …/S-skills-07-save-skill-confirm.png | 已拍（活体确认卡：SKILL.md 预览 + 「将本次对话保存为技能…请逐字检查下方预览」+ 拒绝/允许） |
| S-skills-08-candidate-submitted | …/S-skills-08-candidate-submitted.png | 已拍（「已提交待审。审批并发布后才能使用。」+ cand-trb9v7cp + 复制 + 去审批） |

### 11-transparency（8 张）
| 编号 | 路径 | 状态 |
| --- | --- | --- |
| S-transparency-01-status-bar | …/transparency/zh/S-transparency-01-status-bar.png | 已拍（运行中状态条实测显示「思考中…」+ spinner，附运行流程块） |
| S-transparency-02-run-steps | …/S-transparency-02-run-steps.png | 已拍（运行细节全展开：运行流程/思考中/3 次工具调用/工具行） |
| S-transparency-03-tool-detail | …/S-transparency-03-tool-detail.png | 已拍（展开 authored-bulletin__publish，显示参数） |
| S-transparency-04-policy-blocked | …/S-transparency-04-policy-blocked.png | 已拍（OPFS 种 restricted 技能（run.js fetch 外网）→ restricted__run 行橙字「被策略拒绝」+ 拒绝原因 NETWORK_BLOCKED；拍完已删除该技能） |
| S-transparency-05-thinking | …/S-transparency-05-thinking.png | 已拍（思考块展开读思考内容；标题始终为「思考中」） |
| S-transparency-06-todo-list | …/S-transparency-06-todo-list.png | 已拍（规划类提示触发，1/4 混合态：1 已完成 + 1 进行中 + 2 待开始） |
| S-transparency-07-limit-reached | …/S-transparency-07-limit-reached.png | 已拍（轮次上限调 3 → 复杂需求触顶「达到轮次上限，运行已停止」+ RUN_MAX_TURNS_EXCEEDED 卡 + 打开设置；**上限已改回 1000 并验证恢复正常**） |
| S-transparency-08-run-id | …/S-transparency-08-run-id.png | 已拍（运行流程块：运行 ID run-imn6c5bj + 复制按钮 + 路由/执行/完成耗时） |

无「无法拍摄」项。

## 实测与正文不一致处（建议正文修订）

1. **04-chat-tour**：头部实测只显示静态标题「Agile Copilot」，未见「中间显示当前会话的名字」。
2. **11-transparency §思考过程**：正文称想完后变「思考耗时 {duration}」——实测运行结束后仍显示「思考中」，全文无「耗时」字样（DOM 已验证）。运行中状态条实测为「思考中…」，未抓到「路由中」字面（阶段名在运行流程块里：路由/执行/激活/完成）。
3. **11-transparency §工具调用**：展开单次调用只显示「参数」，无「执行结果」「耗时」区（耗时仅在运行中的折叠行右侧显示，如 99ms）。
4. **11-transparency §任务清单**：本次抓的混合态清单无「已委派给」条目（该轮未发生委派）；alt「含已委派给条目」需换委派场景的触发方式或修订。
5. **07-skills-usage**：~~技能库 14 个~~ 实为 **13** 个内置技能——第 14 行 `defect-dora-snapshot` 是本机浏览器档案里残留的生成技能（两仓库源码均不存在），已从 OPFS 清除并重拍 S-skills-05。表格仍有「受管」状态标（sprint-closeout），默认每页 10 条分页。技能标记 tooltip 文案是「本轮运行使用的技能」，无独立可见标题区块。
6. **07-skills-usage §运行步进**：「已激活技能：xx」实测形态是运行流程块里的「激活 agile-ops-dashboard 3.9s」条目 + 块尾「技能 agile-ops-dashboard」行，无「已激活技能：」前缀。
7. **保存为技能**：技能生成要求「流程中的工具调用必须在本会话中真实演示过」——走技能委派的运行（如大屏生成）不计入，直接存会被拒并解释原因。确认卡预览（SKILL.md）在确认文案**上方**，文案写「下方预览」。
8. **中断恢复横幅**：授权卡（需要授权）等待时刷新，会话只剩用户消息、无横幅（运行被标记中止）；表单卡（需要补充信息）等待时刷新才有横幅。
9. **Demo 持久化告警**：被停止/中断过的会话偶现「以下会话文件读不动，已跳过：session-*.json」红色提示（session-mtg7pll2-cqkthf.json、session-mtg7zk4p-p00l8e.json）。
10. **Console 布局**：助手抽屉拉宽（1300px）时打开 console，主内容区被挤成 38px 宽；需先收起助手抽屉。恢复 712px 后正常。
11. **撤销 toast**：存活约 5 秒，位置在窗口右下角（fixed right-4 bottom-4）；截图需先清定时器冻住再截。

## 脱敏复查

- localStorage `agile.webskill.runtime-config` 内含真实形态的模型 API key（sk-…）。本次**未拍摄**设置-大模型页；技能库/运行细节等截图均不含密钥。
- 截图内的用户身份为 Demo 假数据（test / test@abc.com），运行 ID、候选 ID 均为本机生成值，无敏感信息。

## 环境恢复确认

- 轮次上限：已从 3 改回 1000，并新跑一条多轮需求验证正常完成。
- 抽屉宽度：已从 1300 改回 712（localStorage agile_chat_width）。
- OPFS 里为构造策略拒绝种的 `restricted` 技能已删除（removeEntry 后验证不存在）。
- 未做任何 git 操作，未改 src/ 下代码。

---

# 截图进度 — 用户文档第 2 轮（第 13/14/16 章网页版，中文版）

日期：2026-08-31。环境同第 1 轮（http://localhost:3000/demo dev:sdk，chrome-devtools MCP，深色中文，1440×900@2x）。
MCP filePath 白名单只有 `$TMPDIR`（os.tmpdir()）：先存 `$TMPDIR/webskill-shots/`，sharp 压缩（palette q85）后 cp 进 `public/docs-assets/<slug>/zh/`。
**本轮不碰扩展版**（MCP 浏览器禁扩展），见文末「无法拍摄」清单。

## 逐张状态（本轮新拍 12 张；S-actions-06 沿用上午已拍）

### 13-page-perception（新拍 1 张）
| 编号 | 路径 | 状态 |
| --- | --- | --- |
| S-perception-02-excluded | …/page-perception/zh/S-perception-02-excluded.png | 已拍（抽屉区裁剪：用户消息 + 提示条「正在读取页面内容（区域：#main-content-wrapper）已排除：#agile-real-kpis」）。**Demo 的 scope 本没有 exclude**（控制台显示「排除区域：无」）——为拍它临时给 `src/demo/webskill/perception.ts` 的 AGILE_PAGE_SCOPE 加了 `exclude: ['#agile-real-kpis']`，拍完即还原（git status 无 src 改动） |

### 14-page-actions（新拍 6 张 + 沿用 1 张）
| 编号 | 路径 | 状态 |
| --- | --- | --- |
| S-actions-01-consent-card | …/page-actions/zh/S-actions-01-consent-card.png | 已拍（整帧：「帮我打开缺陷管理页面，然后点一下『提报缺陷/问题』」→ 授权卡「允许助手点击「提报缺陷/问题」吗？」+ 拒绝/允许 + 记住复选框） |
| S-actions-02-remember | …/S-actions-02-remember.png | 已拍（授权卡裁剪，复选框勾选态：「以后不再询问 本页面 里的「点击」操作」；拍完**取消勾选再允许**，不留已记住授权） |
| S-actions-03-page-changed | …/S-actions-03-page-changed.png | 已拍（sharp 前后对比拼接：左缺陷列表 / 右允许后「新增缺陷问题」表单弹窗已开，2164×1740） |
| S-actions-04-declined | …/S-actions-04-declined.png | 已拍（新会话点「拒绝」：运行细节展开 act_on_page 失败「Page action was declined by the user. PAGE_ACTION_DECLINED」+ 助手明说没执行并继续回答未解决缺陷数，页面无变化） |
| S-actions-05-policy-blocked | …/S-actions-05-policy-blocked.png | 已拍（沿用第 1 轮构造法：OPFS `agile-demo/skills/user/restricted`（run.js fetch https://example.com）→ 点名调用 → restricted__run 橙字「被策略拒绝」+ NETWORK_BLOCKED「Network request blocked by sandbox network policy: example.com」；**拍完已删技能**并验证 user 目录干净）。注意 OPFS 根是 `agile-demo/` 子目录，第一轮记录没提这层 |
| S-actions-06-revoke | …/S-actions-06-revoke.png | 沿用（上午已拍） |
| S-actions-07-filled-form-consent | …/S-actions-07-filled-form-consent.png | 已拍（需求管理屏「创建新需求/故事」模态 8 字段全填好 + 授权卡「允许助手点击「保存需求」吗？」同框；拍完点**拒绝**，未写入演示数据） |

### 16-artifacts（新拍 5 张）
| 编号 | 路径 | 状态 |
| --- | --- | --- |
| S-artifacts-01-artifact-cards | …/artifacts/zh/S-artifacts-01-artifact-cards.png | 已拍（消息末尾产物卡：iteration-export.json · application/json · 13819 bytes · 下载按钮）。**内置文档技能全部 `resultCard:false`，没有任何内置流程会出产物卡**——本张用自种用户技能 `iteration-json-export`（fetchData→writeArtifact 默认出卡）实拍，拍完已删。正文措辞（「如果这次运行还产出了文件」）在本 Demo 实际不触发，建议修订或换内置触发 |
| S-artifacts-02-open-confirm | …/S-artifacts-02-open-confirm.png | 已拍（打开文档 → 「请确认」卡：技能「agile-ops-screen」要把一份文档投到独立窗口打开…是否继续？文案与正文逐字一致） |
| S-artifacts-03-screen-window | …/S-artifacts-03-screen-window.png | 已拍（viewer 窗口 1440×900@2x：敏捷运营监控大屏深蓝主题，KPI 行 + 饼/面积/折线/柱 4 图 + 明细表；工具条按产物声明默认收起，只留角落小圆钮） |
| S-artifacts-04-slides-presenting | …/S-artifacts-04-slides-presenting.png | 已拍（agile-slide-deck 固定模板 8 页：封面 + 左下角页码 1/8 + 右上「打印」钮） |
| S-artifacts-05-print-preview | …/S-artifacts-05-print-preview.png | 已拍（**打印版式冻结法**：原生打印对话框不在页面内、MCP 截不到——覆写 `window.print` 抛错使 viewer 停在 reveal `print-pdf` 版式，全页长图裁前两页）。固定模板是**浅色**；「深色底色保留」用 authored-slides 深色版另跑一份实拍（深蓝 rgb(15,27,46) 每页底色都在，版式/图表/表格完整）。两张会话都留在会话列表 |

## 无法拍摄（扩展版，需人工在真实扩展环境补拍）

MCP 浏览器以 `--disable-extensions` 启动，加载不了扩展，以下全部跳过：

- S-perception-05-extension-web（13 章，扩展版读普通网页）
- S-tabs-01 ~ 06（15 章跨标签页全套）
- S-downloads-01 ~ 06（17 章读本机下载文件，还需 chrome://extensions 开「允许访问文件网址」）
- S-artifacts-06（批次 K：扩展版下载授权可撤销；16 章正文未引用，仅 shotlist 列出）

## 实测与正文/资料不一致处（建议修订）

1. **13 章**：Demo 未配置排除区域（scope 只有 include），「已排除：{scope}」提示在 Demo 默认配置下永不出现；13 章「已排除」段落配图的拍摄依赖临时改 scope（见上）。若希望 Demo 默认就能演示，需要在 perception.ts 常驻一个 exclude。
2. **14 章 §它能替你点什么**：「切屏不算改动数据，不会打断你」与实测一致（navigate_to_screen 直接执行不弹卡）；授权卡出现在随后的点击上。runbook §8 的表述（「提出需求 → 授权卡出现」）容易误读成导航也弹卡，实际弹卡的是导航后的点击。
3. **14 章 §哪些事它会先问你**：填表任务实测是**两层确认**——助手填完先弹 ask_user 表单卡（「表单已填写完毕，是否确认提交保存这个新需求？」确认提交/需要修改/取消），选了确认提交后点「保存需求」时才弹页面操作授权卡。正文「它可以自己把整张表填好，但按下『提交』之前一定会停下来问你」成立，但中间这层 ask_user 是模型自发加的，不是每次都有。
4. **16 章 §在对话里打开**：见 S-artifacts-01 行——内置技能（sprint-progress-report 等报告类）根本不写文件产物，文档类技能写了但 `resultCard:false` 不出卡；「消息末尾会列出产物卡片」在现版 Demo 无内置触发路径。24 章 S-case-report-05（同形态产物卡）届时同样拍不到内置触发。
5. **16 章 §打印**：S-artifacts-05 拍的是 reveal 打印版式本身（即喂给打印预览的内容），不是系统打印对话框——MCP/CDP 截不到原生对话框；图注「打印预览里每页一张纸」按此理解成立。
6. **Demo 健壮性**：授权卡悬挂时点「停止」按钮未见生效（仍停在等待态），刷新页面运行才按中止处理（第 1 轮第 8 条的补充）。
7. **模型自述别全信**：authored-slides 那轮助手声称「幻灯片已在文档窗口打开放映」，但实际没开（打开文档按钮还在、确认卡未点）——开窗必须先确认的规则实测守住了。

## 环境事故与处置（vite 依赖缓存）

拍摄中途发现 `node_modules/.vite/deps/` 里 **echarts 入口文件缺失**（只剩共享 chunk `echarts-BE7oV_Dl-*.js`，`_metadata.json` 的 optimized 列表里也没有 echarts）：viewer 外壳 `import('echarts')` 一律 504（Outdated Optimize Dep），大屏/幻灯片图表全空。该缓存是当天早些时候的再优化写坏的，与本轮编辑无关。
处置（均为临时、均已还原）：`src/demo/main.tsx` 顶部临时加 `import 'echarts'` 触发重扫 + 手写 deps 垫片 `echarts.js`（re-export 该 chunk）。**dev server 重启后请确认 echarts 恢复正常**（重启会全量重扫依赖；本轮按要求未动 3000 端口进程）。

## 环境恢复确认

- `src/demo/webskill/perception.ts`、`src/demo/main.tsx` 均已还原（git status 无 src/demo 改动）；`node_modules/.vite/deps/echarts.js` 垫片已删。
- OPFS：`agile-demo/skills/user/` 下的 restricted、iteration-json-export 均已删除（目录只剩 skills.lock.json / .webskill）；无 OPFS 根目录 skills 误留。
- localStorage：`agile.page-action.consent:*` 为空（无已记住授权）；`agile_chat_width` 仍为 712；轮次上限未动。
- 浏览器侧：3 个 viewer 窗口已关闭；MCP emulate 的 1440×900@2x 是截图瞬态，不残留。
- 演示数据无写入：需求创建在授权卡上点了拒绝；大屏/幻灯片/导出产物只是会话内的运行产物。
- 未做任何 git 操作。

---

# 截图进度 — 用户文档第 3 轮（控制台六章 18~23，中文版）

日期：2026-08-31 傍晚。环境：http://localhost:3000/demo（dev:sdk），chrome-devtools MCP，深色中文。
视口说明：MCP 视口截图为 1440×900@2x（2880×1800）；fullPage 截图走真实窗口（1600 宽 @2x）。
JS 坐标是 1600×1000@1.8 布局，与截图的 1440 布局**不一致**，裁剪一律按截图像素目测。
长页拍法：展开内容区外层滚动容器（inline style，window.__restore 记录后复原）→ fullPage → 裁剪；有内部卡片的页（洞察）展开会撑歪，改用「视口两段 + sharp 拼接」。
console-skills 03/04 目录里原有旧图（外批次残件：03 弹窗偏移裁切、04 红字 Path not found 错误），本轮已重拍覆盖。

## 逐张状态（本轮 36 拍齐 + 1 无法拍摄）

### 18-console-tour（剩 1）
| 编号 | 状态 |
| --- | --- |
| S-console-tour-05-extension | **无法拍摄**：扩展版控制台是扩展选项页形态，MCP 浏览器 `--disable-extensions` 加载不了扩展；用网页版控制台冒充属伪造。需真实扩展环境人工补拍（同第 2 轮扩展清单） |

### 19-console-skills（3 张）
| 编号 | 状态 |
| --- | --- |
| S-console-skills-03-transfer-preview | 已拍（重拍覆盖旧残件；demo-packed-skill.zip 真包安装预览：归档内容树 + 预检 2 通过 + 未签名警告 + 信任复选框；整帧裁剪 1048×1100） |
| S-console-skills-04-integrity | 已拍（重拍覆盖旧残件；装好 demo-packed-skill 后选中：完整性通过「2 个文件通过 · 0 已修改 · 0 缺失 · 0 多出」+ 签名未签名 + 安装账本 2 行；fullPage 裁 2320×1668） |
| S-console-skills-05-save-validation | 已拍（编辑器把 demo-packed-skill 的 SKILL.md 删掉 name 字段 → 「未保存的更改」+ 红框「校验问题（1）SKILL_INVALID_METADATA…missing required `name` field」；校验失败未落盘，事后 Monaco setValue 还原并验证 OPFS 原文件未变） |

### 20-console-runs（6 张）
| 编号 | 状态 |
| --- | --- |
| S-console-runs-01-activity | 已拍（指标卡 81%/5.0/1.2min/176 + 近期失败 5 条 + 10 行表格；视口整页） |
| S-console-runs-02-inspector | 已拍（run-f6dmms49 iteration-json-export：3 轮 LLM 卡 + 最终答复 + 全彩时间线 + 产物卡 13.5KB 预览/下载；fullPage 裁 2380×2640） |
| S-console-runs-03-sessions | 已拍（对话会话 5 行 + 记忆浏览器已加载 + 中断的运行空态「没有中断的运行。」；fullPage 裁 2380×2600） |
| S-console-runs-04-locate-by-id | 已拍（从旧会话「你好」悬停消息点**查看追溯**直达：run-159vip2v 提到列表最前并标「按 id 定位」） |
| S-console-runs-05-failed-run | 已拍（run-uej083ju max-turns 失败：failed 行 + 3 轮卡 + 任务清单 0/4 + 时间线尾部 run.failed「Agent loop exceeded the maximum of 3 turns」+ 产物空态；两段拼接 2300×1930） |
| S-console-runs-06-memory | 已拍（session 层 session-mtgzr0y2-jb9r9l：activeSkillNames + paramHistory 两条明文条目各带删除钮；从同一张 fullPage 裁出） |

### 21-console-governance（7 张）
| 编号 | 状态 |
| --- | --- |
| S-console-gov-01-review-queue | 已拍（4 行：burndown-quick-report 草稿/对话生成/低 + 3 条历史已发布；含 文档源 区） |
| S-console-gov-02-audit-log | 已拍（顶部四行即本轮新事件 skill.rolled_back/edited/installed/versioned；全部事件类型 + 校验链 + 第 1/46 页） |
| S-console-gov-03-versions | 已拍（demo-packed-skill 三版本 Rollback/Edit/Install + 已回滚提示 + 技能状态表 2 行 active + 运行时未命中钩子已关闭；fullPage 裁 2390×2140） |
| S-console-gov-04-evaluation | 已拍（2 条任务 + 全部执行 + 最近报告 通过率100% 平均分1.00 + 回归建议；视口整页） |
| S-console-gov-05-insights | 已拍（评分卡 2 张 + 疑似重复无 + 依赖图 + 使用统计图表与表格；两段拼接 1900×2780） |
| S-console-gov-06-review-actions | 已拍（候选详情对话框：ID cand-c8nz1iep/来源/风险/创建时间 + SKILL.md 全文 + 驳回理由必填 + 发布/驳回；对话框文件区内部滚动，A/B 两段拼接 1265×2057） |
| S-console-gov-07-rollback | 已拍（回滚确认弹窗「归档会先通过校验；任何失败都会完整恢复当前文件。回滚会记录新版本与审计事件。」+ 取消/回滚） |

### 22-console-connections（6 张）
| 编号 | 状态 |
| --- | --- |
| S-console-conn-01-models | 已拍（4 模型行：Dev·OpenAI 默认/Anthropic/Google/Chrome 内置 不可用；**列表不含密钥字段**，已逐字验证页面文本无 sk- 形态明文） |
| S-console-conn-02-mcp | 已拍（端点表：agile-page in-process:// streamable-http 出网严格 已连接 10 个工具 + 添加端点） |
| S-console-conn-03-webmcp | 已拍（实验性标 + 启用 WebMCP 开 + 7 个 agile_get_* 工具，各带来源与 不可信内容 徽章 + 三档启停；视口整页） |
| S-console-conn-04-page-skills | 已拍（7 个页面临时技能带来源/渠道徽章 + 只读感知 已启用 #main-content-wrapper 排除无 + 图像抓取关 + 最近感知记录空态 + 已记住的页面操作空态；fullPage 裁 2380×2030） |
| S-console-conn-05-agile-page | 已拍（端点注册表 10 个工具全列；两段拼接 2220×2305） |
| S-console-conn-06-tool-toggle | 已拍（list_sprints 卡：已启用/按需启用/已禁用 三档；单行裁 2220×195） |

### 23-console-settings（14 张）
| 编号 | 状态 |
| --- | --- |
| S-console-set-01-runtime | 已拍（智能体循环 7 项 + 技能状态 + 交互 + 路由器 + 智能体能力 4 开关 + 多模态 + 流式与结果渲染 + 恢复默认；fullPage 裁 2340×4400，264KB） |
| S-console-set-02-sandbox | 已拍（沙箱三档 + 网络策略 + 出站 URL + 数据源/TS/文档/下载/上传 + 能力五档 + 审批粒度；fullPage 裁 2660×4955，284KB 已接近上限） |
| S-console-set-03-genui | 已拍（4 渲染框架卡 + 交互卡片 5 张预览 ask/confirm/form/select/authorize；两段拼接 2220×2077） |
| S-console-set-04-prompts | 已拍（9 条指令 + 「对话里只展示前 8 条」+ 展示条数 8 + 恢复宿主默认；视口整页） |
| S-console-set-05-trust | 已拍（未签名技能三档 允许/警告(选中)/拒绝 + 信任密钥空态 + 添加密钥；视口裁 2220×960） |
| S-console-set-06-privacy | 已拍（学习开关开 + 加密存储开 + 两个上限 + 画像 5 条 + 导出/导入/立即提炼/清除×2/恢复默认；两段拼接 2220×1925） |
| S-console-set-07-appearance | 已拍（主题 深色选中 + 语言 中文选中 + 语音识别语言 跟随界面语言 + 恢复默认；视口裁 2220×700） |
| S-console-set-08-about | 已拍（版本 0.16.0 + 存储用量 5.7MB/10GB + 已接线能力 12 项中 9 项 + 导出诊断信息 + 危险操作 重置；视口裁 2220×1180） |
| S-console-set-09-add-prompt | 已拍（新增快捷指令对话框：中文/英文文案已填示例 + 图标 无图标 + 关闭/保存；拍完点关闭未保存，列表仍 9 条） |
| S-console-set-11-diagnostics | 已拍（「导出诊断信息」行裁剪：说明 + 导出钮；2220×95） |
| S-privacy-02-profile-entries | 已拍（画像条目 6 条：英文大白话 + 高置信 + 删除图标；裁 1860×395） |
| S-privacy-03-delete-confirm | 已拍（删除确认弹窗：「删除「…」？该条目删掉找不回来。」+ Cancel/删除该条；拍完点 Cancel，条目数仍 40） |
| S-privacy-04-import-diff | 已拍（导入预览弹窗：「新增 1 条、变更 1 条，来自 http://localhost:3000。」+ 取消/导入；用导出文件加 1 改 1 构造，拍完取消未写入） |
| S-privacy-05-credential-rejected | 已拍（「导入失败」弹窗：The user profile file contains a credential field "apiKey"; the import was rejected） |

## 实测与正文不一致处（建议正文修订）

1. **20 章 §运行详情**：「按 id 定位」标注**不由搜索框粘贴触发**——搜索框只做过滤（列表只剩那条、无标注）；标注来自 `focusRunId` 直达（消息操作栏「查看追溯」进详情时，目标不在当前页才提到最前并标注）。正文「粘进搜索框…标着按 id 定位提到最前」与实现不符。
2. **21 章 §审计日志**：表格「事件」列只显示英文事件名（skill.rolled_back），中文说明（如「回滚版本」）只在「全部事件类型」下拉里，正文「事件名带中文说明」对表格行不成立。
3. **22 章 §MCP 端点**：Demo 的 agile-page 端点实为 **10 个工具**（正文写 8 个）——多 `list_skill_files`、`write_skill_file`（技能自编写工具）；「取填表建议」对应 `get_field_history`。
4. **23 章 §隐私**：删除单条画像的确认弹窗按钮是英文 **Cancel**（其余界面皆中文）；含凭据画像的「导入失败」正文也是英文原文（SDK 抛的 WebSkillError 文案未翻译）。
5. **21 章 §审批队列**：对话里存技能后卡片写「已提交待审」，队列里该条目状态实为**草稿**；草稿不能直接驳回（报 APPROVAL_REQUIRED），详情里只有发布/驳回——「提交评审→批准→发布」的链路在 UI 上草稿态即可见发布钮。
6. **23 章 §智能体运行时**：Demo 页无「生命周期钩子」一节（系统没接该入口，整节不出现——与正文「整节不出现」的情形一致）。

## 脱敏复查

- 大模型页（conn-01）列表无密钥字段（已脚本验证无 `sk-` 形态明文）；**编辑表单未打开过**。诊断导出按钮（set-11）只拍到行，未点导出。
- 画像导出文件（~/Downloads/webskill-user-profile.json）为 Demo 假数据，已删除；构造的导入文件在 $TMPDIR。
- 截图内身份仍是 Demo 假数据 test/test@abc.com；运行/候选 ID 为本机生成。

## 环境恢复确认

- 候选 burndown-quick-report（cand-c8nz1iep）已在审批队列删除（审计留痕）；**注意**：草稿态不能直接驳回（APPROVAL_REQUIRED），只能发布或删除。
- demo-packed-skill 已卸载：OPFS `skills/user/` 只剩 skills.lock.json/.webskill；lock 里 demo-packed-skill 条目已随卸载移除。
- skills.lock.json 中残留的 defect-dora-snapshot 条目（指向已删文件、导致完整性页 Path not found 的旧残件）本轮已清；sprint-closeout 条目保留（技能库已拍图上的「受管」标靠它）。
- 编辑器 Monaco 内容已还原（OPFS 文件验证未变）；所有展开的滚动容器/弹窗样式均经 window.__restore 复原。
- 设置未做任何改动（轮次上限、审批粒度、能力开关等全部未动）；无已记住授权。
- 未做 git 操作；src/ 下改动均为本轮开始前的既有状态（mtime 02:27–15:15）。

---

# 截图进度 — 用户文档第 4 轮（quickstart/editions/models + sessions/interactions/genui/attachments/场景章）

日期：2026-08-31 晚。环境同前（http://localhost:3000/demo dev:sdk，深色中文，1440×900@2x）。
新技巧：抓「运行中」帧用 fetch 计数补丁——`window.fetch` 包装后把第 4 次 api 调用挂起（abort 感知），运行停在「思考中…+运行流程展开（路由/激活/两次工具调用耗时行）+停止」后从容拍，拍完 `__release()` 放行完成；qs-03/04 同一轮 run-lp2jh9sr。

## 03-quickstart（4/4）
| 编号 | 状态 |
| --- | --- |
| S-quickstart-01-demo-entry | 已拍（全景视图整帧 + sharp 合成 #38bdf8 圆形①+细箭头指向右缘「展开 AI 助手」；142KB） |
| S-quickstart-02-welcome | 已拍（抽屉欢迎页裁剪 1260×1800） |
| S-quickstart-03-running | 已拍（run-lp2jh9sr 中间帧：思考中…+运行流程展开含 read_skill_file/sprint-progress-report__run 两行工具调用+停止钮；抽屉裁剪 1253×1800） |
| S-quickstart-04-result | 已拍（同一轮放行后的最终回答：结论/依据/风险 + 技能 sprint-progress-report 标记） |

**不符**：正文「欢迎页上面三张能力卡（技能按需调用/生成式 UI/运行透明）」——chatbot 0.16.0 欢迎页只有标题+快捷指令卡，能力卡字符串在包内无调用点（死代码）。S-quickstart-02 按实拍为准。

## 02-editions（2 拍 + 1 无法拍摄）
| 编号 | 状态 |
| --- | --- |
| S-editions-01-web-in-site | 已拍（站点+抽屉同框整帧 2880×1800，252KB） |
| S-editions-02-extension-sidepanel | **无法拍摄**：MCP 浏览器禁扩展，侧栏形态无法真实呈现 |
| S-editions-03-console-entry | 已拍（只拍网页版半边：抽屉头部含设置齿轮的裁剪条 1253×130；扩展版选项页半边拍不到，未拼接伪造） |

## 12-models（3 拍 + 1 无法拍摄）
| 编号 | 状态 |
| --- | --- |
| S-models-01-menu | 已拍（模型菜单：当前项 ✓Dev·OpenAI + Anthropic/Google + Browser built-in 置灰；500×295） |
| S-models-02-capabilities | 已拍（输入区模型钮+可用工具+不可传图片两图标；620×210。**悬停 tooltip 未渲染**（CDP 真悬停+2s 也无），两图标的文字来自 aria-description） |
| S-models-03-no-model | 已拍（清空 llm.entries 后发送触发「尚未配置大模型」引导卡：取消/配置大模型；拍完从 sessionStorage 备份恢复 4 条目并 reload 验证） |
| S-models-04-demo-badge | **无法拍摄**：chatbot 0.16.0 里 `composer.model.demo`（演示模型）无调用点（死字符串）；零模型时发送只弹「尚未配置大模型」引导（引擎 createDemoLlm 回退存在但被 UI 引导拦截），对话里产不出「演示模型」标注的回答 |

环境恢复：models-03 拍摄用 localStorage 清空法，配置备份在 sessionStorage，拍完即写回并 reload 确认 entries=4、默认项 dev-openai。

## 06-sessions（5/5）
| 编号 | 状态 |
| --- | --- |
| S-sessions-01-session-list | 已拍（列表展开：搜索框+加载更早+多条不同标题会话；抽屉裁剪 1253×1800） |
| S-sessions-02-search | 已拍（搜「大屏」剩 2 条匹配 + 清除钮） |
| S-sessions-03-actions-menu | 已拍（悬停「你好」行出三点菜单：重命名/归档/删除） |
| S-sessions-04-delete-confirm | 已拍（删空会话「新建会话」确认框：「会话与运行记录会一并删除，且无法撤销。」逐字一致；拍完取消未删） |
| S-sessions-05-archived | 已拍（列表底部「已归档」分组 + 其下「这个迭代能按时做完吗？」） |

制造状态：「你好，一句话介绍一下你自己」重命名为「随便问问」（保留）；「这个迭代能按时做完吗？」已归档（保留在已归档组）。列表原有 80+ 条真实会话，未额外批量制造。

## 10-attachments（6 拍 + 2 无法拍摄）
| 编号 | 状态 |
| --- | --- |
| S-attachments-01-chips | 已拍（composer 挂 4 类附件：notes.md 文本 / weekly-draft.pdf 文件 / sso.docx 文档正文 / dashboard-photo.jpg 图片，各带类型标签与大小；模型切到 Dev·Anthropic（可传图片）后拍） |
| S-attachments-02-compressed | 已拍（72MB 平滑 PNG 挂入 → chip 显示「已压缩 68.8 MB → 172.8 KB」；chip 文件名被压成单字母是带压缩提示时的真实 UI） |
| S-attachments-03-dictating | 已拍（点语音输入 → 按钮变红色停止方块（可访问名「录音中/停止语音输入」），输入区进入录音态） |
| S-attachments-04-camera | **无法拍摄**：MCP 环境无摄像头设备（enumerateDevices 无 videoinput），拍照钮置灰、取景对话框无法打开；getUserMedia 探测挂起后已 reload 清理 |
| S-attachments-05-model-no-images | 已拍（Dev·OpenAI 下 composer：可用工具扳手 + 不可传图片斜线图 + 拍照钮置灰）。**提示文案只在按钮原生 title 里**（「添加附件/拍照 — 当前模型不接受图片」），CDP 截图截不到原生 tooltip；挂图片文件被静默拒（accept 过滤），无可见 toast |
| S-attachments-06-handoff | **无法拍摄**：扩展版侧栏授权流程，MCP 浏览器禁扩展 |
| S-attachments-07-xlsx-doc-text | 已拍（requirements-sheet.xlsx chip 显示「文档正文 2.4 KB」） |
| S-attachments-08-images-dropped | 已拍（7 张 jpg 挂上发送 → 用户消息带 5 张图 + 红字上方灰字「每条消息最多发送 5 张图片。未发送：bug-06.jpg, bug-07.jpg」；该轮 bug-screenshot-triage 真实跑完） |

测试文件在 $TMPDIR/webskill-shots/attach/（notes.md / weekly-draft.pdf / requirements-sheet.xlsx / dashboard-photo.jpg / photo.png / bug-01~07.jpg）。附件都只挂在输入区或随一条真实运行发出，未污染演示数据。

## 08-interactions（9/9）
| 编号 | 状态 |
| --- | --- |
| S-interactions-01-ask | 已拍（「需要回答」卡：问题+必填输入框+取消/提交；触发语「先问我一个问题再动手：这份燃尽报告要叫什么名字？」） |
| S-interactions-02-confirm | 已拍（OPFS 种 confirm-demo 技能（run.js 调 context.confirm）→「请确认」卡「确认发布这份季报吗？」+取消/确认；**拍完已删技能**。无内置触发路径：内置技能无人调 context.confirm） |
| S-interactions-03-form | 已拍（「需要补充信息」卡：迭代下拉+报告范围必填文本+包含缺陷明细勾选；触发语要求「用 ask_user 工具一次性问我」——直说「给我一张表单」会被 render_ui 画成生成式表单而不是交互卡） |
| S-interactions-04-select | 已拍（「选择一个选项」卡：APAC/Europe/LATAM） |
| S-interactions-05-authorize | 已拍（缺陷管理屏点「提报缺陷/问题」触发：「需要授权」警告色卡 + 请求的能力 pageAction + 说明逐字 + 记住复选框 + 拒绝/允许；拍完点拒绝） |
| S-interactions-06-file-pick | 已拍（OPFS 种 file-demo 技能（必填参数 doc 为 format:binary）→ 点名运行不带参 →「需要一个文件」卡 + 选择文件/拒绝；**拍完已删技能**。卡上说明文字是英文原文（runtime 硬编码 Open local file picker to fill field））。点拒绝后运行照常继续（与正文一致） |
| S-interactions-07-submitted | 已拍（select 卡提交后变只读：「已提交」标 + APAC 选中 + 按钮置灰） |
| S-interactions-08-waiting | 已拍（等待指示「正在等你操作：…」+ 去表单钮 + 底部停止钮）。**不符**：正文说「运行状态这时显示等待输入」——实测状态条仍是「思考中…」，流程块阶段为「交互 select」，全文无「等待输入」 |
| S-interactions-09-suggestion | 已拍（画像已有 sprint-closeout 条目 → 问「这次收尾打算用哪个技能」→ select 卡带「建议：sprint-closeout（你以往做迭代收尾时都用 sprint-closeout 技能）+ 使用」行） |

注意：交互卡 5 分钟超时会吃掉未答的运行（RUN_INTERACTION_TIMEOUT），拍摄窗口要抓紧；期间产生的两条超时失败运行属正常记录。

## 09-generative-ui（8/8）
| 编号 | 状态 |
| --- | --- |
| S-genui-01-table | 已拍（敏捷运营报告里的测试套件明细表：可排序列头 套件/覆盖率%/通过率%/状态 + 通过/未通过行） |
| S-genui-02-chart | 已拍（同一报告顶部：DORA 四项指标数字 + 迭代完成率 + 需求分布柱状图 + 未关闭缺陷饼图混排） |
| S-genui-03-form | 已拍（render_ui 表单「新建需求」：必填文本 + 优先级/目标迭代单选 + 备注多行 + 提交） |
| S-genui-04-kanban | 已拍（需求按状态三列看板：待开发 4（琥珀）/进行中 14（蓝）/已完成 2（绿），卡片带编号+标题） |
| S-genui-05-document | 已拍（agile-ops-screen 产出的「打开文档」卡 + 技能标记） |
| S-genui-06-readonly | 已拍（翻回表单会话：表单在下，下方「这是已保存的记录，其中的操作已不可用。」逐字） |
| S-genui-07-array-first-item | 已拍（控制台切 Vercel AI SDK 预览档 → 表单含重复组「任务列表」→ 下方「当前渲染档只显示重复组的第一项。」；**拍完已切回 Native（React）并验证**） |
| S-genui-08-suggestion | 已拍（负责人字段下「建议： test（你最近几次都指给了他） 使用」行。字段 suggestion 属性由模型按指令写入 spec） |

备注：建议值在交互卡（ask/select）与 render_ui 表单里都成立——08 章 S-interactions-09 是卡上的，本章 08 是表单字段下的。

## 13/14 新增（1 拍 + 1 无法拍摄）
| 编号 | 状态 |
| --- | --- |
| S-perception-06-linked-docs | 已拍（需求管理屏发「读取…带附件的那几条需求文档…」→ requirement-doc-digest 跑完：读取情况（7 份成功/CORE-121~133 共 13 份失败：链接返回应用壳 HTML 而非文档正文）+ 抽取的验收标准 + 文档有而工单缺的条目逐条列出） |
| S-perception-07-cross-origin-confirm | **无法拍摄**：Demo 需求附件全部同源（localhost:3000），同源判定直接放行不弹卡；让模型抓任意外部 URL 被它拒绝（「无法直接抓取任意外部网址」，改弹表单问读哪份）。机制在 runtime/linkedDocument.ts（跨源逐次确认、完整 URL 展示），但 Demo 无跨源链接可触发 |
| S-actions-08-expand-consent | 已拍（需求管理屏「把需求表第一行的加号点一下展开」→ 模型确认该行无独立加号节点、改点整行 →「需要授权」卡：pageAction + 允许助手点击「CORE-101…（整行文本）」吗？+ 记住复选框；拍完点拒绝） |

## 24-case-report（4 拍 + 1 无法拍摄，同一次连贯运行）
| 编号 | 状态 |
| --- | --- |
| S-case-report-01-prompt | 已拍（欢迎页快捷指令卡区，含「生成当前项目的敏捷运营报告…」那条） |
| S-case-report-02-run-steps | 已拍（运行流程全展开：思考内容 + read_skill_file + agile-ops-dashboard__run + 参数行）。**不符**：正文表格把 list_sprints/list_requirements/list_bugs/list_test_suites 写成运行流程里的「这次调用」——实测它们由技能脚本内部 fetchData 取数，流程块里只有 read_skill_file + __run 两行工具调用 |
| S-case-report-03-tool-detail | 已拍（read_skill_file 行展开：参数 {"skillName":"agile-ops-dashboard"}；展开只有「参数」区，无「执行结果」区——与第 1 轮第 3 条一致） |
| S-case-report-04-report | 已拍（报告主体：模块缺陷表+测试套件表+两条警示卡+缺陷截图墙+项目卡） |
| S-case-report-05-artifact-download | **无法拍摄**：agile-ops-dashboard 写产物带 resultCard:false，消息末尾不出现产物卡/下载钮（与第 2 轮 S-artifacts-01 的发现一致）。正文「如果这次运行还产出了文件」在本 Demo 无内置触发路径 |

## 25-case-summarize（4/4，同一次会话连贯拍摄：需求屏提问→缺陷屏同一句话→需求屏文档比对）
| 编号 | 状态 |
| --- | --- |
| S-case-sum-01-requirements-screen | 已拍（需求管理屏总结面板：页面概况 + 需求清单表 + 异常项概览） |
| S-case-sum-02-bugs-screen-same-prompt | 已拍（缺陷管理屏同一句话：模块/经办人两表 + 红/黄/蓝异常项——内容与需求屏完全不同） |
| S-case-sum-03-reading-scope-hint | 已拍（感知提示条「正在读取页面内容（区域：#main-content-wrapper）」；运行结束后仍留在消息流里） |
| S-case-sum-04-doc-digest | 已拍（文档比对：7 份可读取 + 13 份无法解析（附件链接返回应用壳 HTML）+ 验收标准 3 条 + 实现要点逐条 + 技能 requirement-doc-digest 标记） |

## 26-case-bulletin（4 拍 + 1 无法拍摄，同一次会话连贯运行）
| 编号 | 状态 |
| --- | --- |
| S-case-bul-01-preview | 已拍（quality-bulletin 跑完：通报要点速览表（缺陷趋势/测试覆盖/发布就绪度）+「打开文档」按钮） |
| S-case-bul-02-document | 已拍（打开文档 → 请确认卡「技能「quality-bulletin」要把一份文档投到独立窗口打开，其中包含来自「fetchData: requirements / bugs / testSuites / metrics」的数据。是否继续？」→ 确认 → viewer 窗口：红头+期号+缺陷态势表+测试覆盖表+打印钮） |
| S-case-bul-03-print-preview | 已拍（viewer 里隐藏外壳 chrome 后全页：即喂给打印的版式本身——原生打印预览对话框 MCP/CDP 截不到；红头+两表+DORA+发布就绪度结论+工程质量委员会红章落款，头尾拼接） |
| S-case-bul-04-pdf | **无法拍摄**：存 PDF 要走浏览器原生打印对话框（截不到也驱动不了「另存为 PDF」）；viewer 内容经 SDK 沙箱注入（opaque origin），headless --print-to-pdf 复刻不了同一份 |
| S-case-bul-05-second-version | 已拍（同会话提修改 → 第二版走 authored-bulletin：两版技能标记 quality-bulletin/authored-bulletin 同框 + 第二版要点） |

## 27-case-slides（5/5，同一次会话连贯运行：固定八页 → 提修改 → authored 三页）
| 编号 | 状态 |
| --- | --- |
| S-case-slides-01-open-confirm | 已拍（agile-slide-deck 的请确认卡：「要把一份文档投到独立窗口打开，其中包含来自「fetchData: projects / sprints / requirements / bugs / testSuites / metrics」的数据。是否继续？」+ 取消/确认） |
| S-case-slides-02-deck-cover | 已拍（viewer 封面页：三项目交付质量综合分析 + 页码 1/8 + 右上打印钮）。固定模板是**浅色**（非深色） |
| S-case-slides-03-page-turn | 已拍（方向键翻到第 2 页：三项目全景 KPI 卡+项目表，页码 2/8 + 左右翻页箭头） |
| S-case-slides-04-exported-pdf | 已拍（打印版式冻结法：覆写 window.print 抛错停在 reveal print-pdf 分页版式，整页长图裁前两页）。**正文「深色底色保留」对不上**：固定八页模板是浅色；深色底色保留的机制（print-color-adjust:exact）对深色 authored 片有效（第 2 轮已验证深蓝底每页都在）。原生打印预览对话框截不到 |
| S-case-slides-05-authored-three-pages | 已拍（同会话「就讲当前迭代，分三页」→ authored-slides 深蓝三页：第 1 页「进展：迭代完成度 72%」+ 页码 1/3）。该页有个小渲染瑕疵：左上一个 KPI 文字深底深字看不太清 |

## 28-case-fill-form（7/7）
| 编号 | 状态 |
| --- | --- |
| S-case-form-01~05 | 已拍（前轮完成：语音录音态 / 已跳到需求表单页 / 字段自动填好 / 提交确认卡 / 列表新增条目） |
| S-case-form-06 | 已拍（续跑「直接点保存需求」→ pageAction 授权卡「允许助手点击『保存需求』吗？」→ 连点两次拒绝 → 助手说明「连续两次被系统拒绝了（PAGE_ACTION_DECLINED），我这边无法完成点击」+ 表单状态表 + 请用户自点或允许后重试；列表仍 24 条未写入）。**措辞差异**：正文语境是「拒绝后任务继续做下一张表」，实测模型措辞为「被系统拒绝、请你手动点或授权后重试」——机制对（未写入、运行未中断、给后续路径），语气以截图为准 |
| S-case-form-07 | 已拍（render_ui「新建需求」表单卡：经办人字段下「建议：陈晨 —— 依据你的历史指派记录，最近 28 条需求中有 23 条指派给陈晨（占 82%），其次为林晨（3 条）、测试人员（2 条）」）。**两点注意**：① 与正文「页面表单字段旁摆建议值」的语境不同，是抽屉内表单卡（同 genui-08 路径，页面原生表单无建议 UI）；② 这次 spec 的建议行是纯文本，没有「使用」采纳钮（genui-08 那轮有），正文「你点了采纳才算数」在这张图上看不到对应控件 |

## 29-case-import-file（6/6，同一新会话连贯运行）
| 编号 | 状态 |
| --- | --- |
| S-case-import-01 | 已拍（3 份 docx 小片各标「文档正文 10.x KB」） |
| S-case-import-02 | 已拍（「三份需求文档内容核对表」9 列 3 条全表 + 琥珀「待确认」卡（DEVOPS-112 状态保留与否 + 项目映射 PROJ-CD/PROJ-AGENT）+「建之前需你拍板」）。过程：render_ui 首次渲染失败（5ms），模型降级为简化表格卡 + markdown 全表 |
| S-case-import-03 | 已拍（任务清单卡「1/3」：DEVOPS-101 完成划线、AGENT-111 进行中蓝点、DEVOPS-112 待办空心圈） |
| S-case-import-04 | 已拍（第 1 条 DEVOPS-101 各字段已被填进创建表单 modal：概要/史诗/8 点/高/进行中/张雨绮/详细说明，保存授权卡同帧在抽屉里） |
| S-case-import-05 | 已拍（列表底部 CORE-138/139/140 三条新纪录各带 docx 附件链接，需求管理 27） |
| S-case-import-06 | 已拍（41.1KB 英文 md →「可见部分共 99 条…Item 99 的描述在附件中被截断（附件标注 [truncated]）…真实总数无法确认」+ 两个选择）。**实测校正正文**：截断阈值按字符数（32K 字符）而非字节——39.3KB 的中文 doc（约 1.3 万字符）未截断，41.1KB 的英文 doc（42069 字符）被截。正文「上限 32 KB」建议改成「32K 字符」口径 |

实测不符/环境限制（供正文参考）：① 项目切换器在顶部栏、不在助手可操作范围，跨项目文档只能建到当前项目（模型会主动说明并请你拍板）；② 文档里的编号不沿用，系统按当前项目规则分配新 ID（DEVOPS-101 → CORE-138）；③ 每条「打开表单」「保存」各弹一次 pageAction 授权卡，本次共点 5 次允许。

## 30-case-skill-lifecycle（5 拍 + 3 无法拍摄；连贯因果链：快捷提示→存技能→审批→发布→调用）
| 编号 | 状态 |
| --- | --- |
| S-case-life-01 | 已拍（confirm 授权卡：声称步骤 list_bugs/get_dora_metrics 对照 + SKILL.md 预览 + 「将本次对话保存为技能「defect-dora-review」？…它将提交审核，不会直接启用。请逐字检查下方预览，确认没有不应被保存的内容。」逐字 + 拒绝/允许）。前置：模型自加了「需要补充信息」卡（技能名称 defect-dora-review + 适用范围三选一） |
| S-case-life-02 | 已拍（「⚠️ 注意：该技能还不能直接使用——需要你确认候选，并经审核人批准发布后才能生效」+「已提交待审。审批并发布后才能使用。」+ 候选 ID cand-si1wqtah + 复制候选 ID + 去审批） |
| S-case-life-03 | 已拍（点「去审批」直接开出候选详情弹窗：ID/来源 generated/风险 low/创建时间/生成于会话 + SKILL.md 全文 + 驳回理由（必填）+ 发布/驳回） |
| S-case-life-04 | 已拍（点发布后回审批队列：defect-dora-review 行 状态「已发布」+ 来源「对话生成」+ 风险低。**注意**：队列里另有 8/31 拍摄留下的 defect-dora-snapshot、cross-project-health、sprint-closeout 三个已发布候选） |
| S-case-life-05 | 已拍（发布后欢迎页快捷提示多出「请运行 defect-dora-review 技能」；点它跑完，尾部「⚡ 技能 defect-dora-review」标记 + 缺陷清单/DORA 摘要） |
| S-case-life-06 | **无法拍摄**：控制台编辑器在本环境（浏览器 OPFS 后端）事实上只读——Monaco 能打开 SKILL.md，但「保存并校验」恒 disabled（源码：`disabled: !isDirty || saving || !backend.writeSkillFile`，实测输入字符后 isDirty 不置位、无「未保存的更改」标记，writeSkillFile 缺失）。defect-dora-review（托管）与 sprint-weekly-brief（local）均如此，「改动→校验结果」拍不到 |
| S-case-life-07 | **无法拍摄**（依赖 06 的改动生效，连带拍不到） |
| S-case-life-08 | **无法拍摄**：治理→版本页「版本历史」下拉为空（技能未经编辑只有初始发布记录，无回滚对象）；版本页只能看到技能状态机（defect-dora-review active）。回滚机制文字在页面上有（「回滚在校验后真实恢复旧归档…谱系不断裂」）但无可操作对象 |

## 收尾批次（主会话亲拍，2026-09-01）

- S-intro-01/02/03 已拍（报告结果/页面总结/大屏查看器）
- S-case-life-06/07/08 已拍（编辑器保存、改后运行、回滚确认弹窗——回滚弹窗拍完点取消，未动数据；链路 01-05 用 defect-dora-snapshot，06-08 因该技能被清改用 sprint-weekly-brief/sprint-closeout，正文未点名技能故一致）
- S-faq-01 已拍（最大轮次调 2 制造 RUN_MAX_TURNS_EXCEEDED 错误卡，拍完已恢复 1000 并核实生效）
- S-faq-02 已拍（关于与诊断页导出行）
- S-case-report-05 已拍（控制台运行详情的产物区下载——内置技能不出对话内产物卡，第 24 章正文与图注已改为此口径）
- S-case-bul-04 已拍（通报查看器的 A4 打印就绪版式；原生打印对话框与存成的 PDF 文件属系统层，自动化拍不到，此图为可得的最近真实形态）
- S-models-04 无法拍摄：清空模型条目后 Demo 显示「尚未配置大模型」，演示模型未被注入（需宿主注入演示档的环境）；已如实记录
- S-attachments-04 无法拍摄：自动化浏览器无摄像头设备，且当前模型不收图时拍照按钮置灰
- 扩展版整套（S-tabs-01~08、S-downloads-01~06、S-editions-02、S-perception-05/07、S-console-tour-05、S-attachments-06）维持「无法拍摄：MCP 浏览器禁扩展，需人工真实扩展环境补拍」

## 更正（2026-09-01 主会话补拍后）
以下先前几轮记为「无法拍摄」的项已由主会话补拍完成，记录以本条为准：
- S-case-report-05-artifact-download（控制台运行详情产物区下载）
- S-case-bul-04-pdf（查看器 A4 打印就绪版式）
- S-case-life-06/07/08（编辑器保存 / 改后运行 / 回滚确认弹窗；Monaco 编辑用 executeEdits API 落字，「isDirty 不置位」的早前判断不成立）
