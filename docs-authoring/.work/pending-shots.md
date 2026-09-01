# 待人工补拍清单（21 张）

这些截图自动化环境拍不了（MCP 控制的浏览器禁用扩展、无摄像头、无跨源链接、演示模型未注入）。
正文相应位置已放「本节截图待补」的占位说明；拍完后**把文件放到下表「存放位置」**，告诉我一声，我把占位块换回图片引用。

## 拍摄环境准备

**扩展版截图（17 张，占大头）需要真实扩展环境：**

```bash
cd ~/Git/web-skill-sdk/examples/browser-extension
pnpm build
```

然后在 Chrome：`chrome://extensions` → 打开开发者模式 →「加载已解压的扩展程序」→ 选构建产物目录。从浏览器工具栏的扩展图标打开侧边栏。模型配置在扩展的设置里填一次（用 Demo 同款的模型配置即可）。

**通用要求**（与已拍截图保持一致）：
- 窗口 1440 × 900，缩放 100%，Retina（2x）最佳
- 深色主题、界面语言中文
- PNG 格式，单张 ≤ 300 KB
- 脱敏：书签栏、其他标签页标题、真实 API Key 不要入镜

---

## 一、扩展版：跨标签页（第 15 章，8 张）

在真实扩展侧边栏里操作。前 6 张参考 `docs-authoring/03-visuals/04-capture-runbook.md` §9；后 2 张是设想场景（用任意带「点链接开新标签页」的网页即可，不需要是 Agile 系统）。

| 编号 | 拍什么 | 文件名 | 所在章节 |
| --- | --- | --- | --- |
| S-tabs-01 | 浏览器全景：多个标签页 + 右侧扩展侧边栏助手 | S-tabs-01-sidepanel-tabs.png | 15 跨标签页工作 |
| S-tabs-02 | 跨页取数的运行流程（步骤里能看出用了哪几页） | S-tabs-02-multi-page-steps.png | 15 |
| S-tabs-03 | 跨多个标签页汇总出的结果回答 | S-tabs-03-cross-page-summary.png | 15 |
| S-tabs-04 | 逐项处理列表的过程（进详情、回列表、进下一项，建议连拍几张挑一张） | S-tabs-04-list-walkthrough.png | 15 |
| S-tabs-05 | 至少三层的下钻：列表→详情→再下一级 | S-tabs-05-three-level-drilldown.png | 15 |
| S-tabs-06 | 撞容量上限的表现（一轮最多同时开 32 页，撞上限后中途收尾） | S-tabs-06-capacity-wrapup.png | 15 |
| S-tabs-07 | 设想场景：点需求行链接→新标签页开迭代表→再点进缺陷页的下钻过程 | S-tabs-07-scenario-drilldown.png | 15 |
| S-tabs-08 | 设想场景：最后汇总出的总表 | S-tabs-08-scenario-summary.png | 15 |

存放：`public/docs-assets/tabs/zh/`

## 二、扩展版：读本机下载的文件（第 17 章，6 张）

参考 shotlist 批次 P（`docs-authoring/03-visuals/03-shotlist.md` 批次 P，6 张）。先在真实扩展里用「看看我刚下载的那份文件」类说法触发两道授权卡。

| 编号 | 拍什么 | 文件名 | 所在章节 |
| --- | --- | --- | --- |
| S-downloads-01 | 第一道授权卡：允许查看最近下载的文件列表吗 | S-downloads-01.png | 17 让它看你刚下载的那个文件 |
| S-downloads-02 | 文件清单（不含路径；不支持的格式已标出） | S-downloads-02.png | 17 |
| S-downloads-03 | 第二道授权卡：允许读取这份文件吗（含文件名·大小） | S-downloads-03.png | 17 |
| S-downloads-04 | 读出内容后的回答 | S-downloads-04.png | 17 |
| S-downloads-05 | 「不再询问」的两个档位（可分 a/b 两张或一张组合） | S-downloads-05.png | 17 |
| S-downloads-06 | 设置 → 沙箱与安全 →「允许读取下载的文件」开关（默认关） | S-downloads-06.png | 17 |

存放：`public/docs-assets/downloaded-files/zh/`

## 三、扩展版：其他章节（4 张）

| 编号 | 拍什么 | 文件名 | 存放位置 | 所在章节 |
| --- | --- | --- | --- | --- |
| S-editions-02 | 扩展侧边栏助手 + 旁边是任意第三方网页（体现独立于网站） | S-editions-02-extension-sidepanel.png | public/docs-assets/editions/zh/ | 2 网页版与扩展版 |
| S-console-tour-05 | 扩展选项页形态的控制台（浏览器标签页里打开的 console） | S-console-tour-05-extension.png | public/docs-assets/console-tour/zh/ | 18 控制台导览 |
| S-perception-05 | 在一个普通网页上让扩展版助手读取内容 | S-perception-05-extension-web.png | public/docs-assets/page-perception/zh/ | 13 让助手读当前页面 |
| S-attachments-06 | 扩展版里麦克风/摄像头「需要在普通标签页里授权一次」的提示 | S-attachments-06-handoff.png | public/docs-assets/attachments/zh/ | 10 附件、图片、语音与拍照 |

## 四、网页版但受环境限制（3 张）

| 编号 | 拍什么 | 拍法 / 为什么自动化拍不到 | 文件名 | 存放位置 | 所在章节 |
| --- | --- | --- | --- | --- | --- |
| S-attachments-04 | 拍照对话框（取景画面 + 快门） | 需要一个真实摄像头（或 Chrome 用 `--use-fake-device-for-media-stream` 启动的窗口），且当前模型要收图（先切到可传图片的模型再点「拍照」） | S-attachments-04-camera.png | public/docs-assets/attachments/zh/ | 10 |
| S-perception-07 | 读取**跨源**链接文档前的「请确认」卡（卡上完整地址可见） | Demo 附件全部同源不弹卡；需要页面上有一个指向**别的网站**的文档链接（可临时在任意本地页面加一个跨源链接），让助手读它 | S-perception-07-cross-origin-confirm.png | public/docs-assets/page-perception/zh/ | 13 |
| S-models-04 | 标注为「演示模型」的回答 | 需要一个宿主注入了演示模型的环境（Demo 在零模型配置时只弹「尚未配置大模型」引导，演示模型接管不了）；拍不到可以先用零模型的引导图替代或直接放弃这张 | S-models-04-demo-badge.png | public/docs-assets/models/zh/ | 12 选择模型 |

---

拍完任意一张：文件落到上表路径后直接告诉我，我把正文的「截图待补」占位块换回图片引用（中英两版一起换）。

## 状态更新（2026-09-01）
- 已人工补拍并换回正文引用（13 张）：S-downloads-01~06、S-editions-02、S-console-tour-05、S-perception-05、S-perception-07、S-attachments-04、S-attachments-06、S-tabs-01。
- 放弃实拍、改用示意图/示例表（8 张）：S-tabs-02/04/05/06/07 改为 Mermaid 示意图（public/docs-assets/tabs/zh/*.svg），S-tabs-03/08 改为正文 Markdown 示例表，S-models-04 撤掉图位（文字自足）。
- 至此文档全书无「截图待补」占位，无碎图引用。
