---
name: agile-ops-dashboard
description: 为当前项目生成敏捷运营报告（会话内展示）——迭代健康、需求分布、缺陷热点与测试质量汇聚于一个 surface。
---

## 何时使用

当用户要求敏捷运营报告、运营小结或项目交付健康的会话内一页总览时使用。
与 `agile-ops-screen`（独立窗口的深蓝监控大屏）区分：本技能的报告直接渲染在对话里。

## 输入

- `projectId`（可选）：缺省取当前选中项目。

## 步骤

1. 调用 `agile-ops-dashboard__run`（可带 `projectId`）。脚本经 `fetchData`
   读取迭代、需求、缺陷、测试套件与 DORA 指标，一次渲染出报告 surface。
2. 只解说头条结论（一两句）。报告本身是交付物——不要在聊天里复述上面的数字。
