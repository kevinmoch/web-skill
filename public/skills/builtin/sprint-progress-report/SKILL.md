---
name: sprint-progress-report
description: 分析当前迭代进展并渲染可视化小结，含燃尽情况、故事点分布与风险提示。
---

## 何时使用

当用户询问迭代进度、燃尽、速率，或当前迭代能否按时收尾时使用。

## 输入

- `projectId`（可选）：缺省取当前选中项目。

## 步骤

1. 调用技能工具 `sprint-progress-report__run`（可带 `projectId`）。脚本经
   `fetchData` 读取迭代与需求数据，计算故事点分布并渲染报告 surface。
2. 对渲染出的 surface 做简要解说：完成率、剩余故事点是否超出迭代速率目标、
   主要风险。不要把原始数据贴回——surface 已经展示了。
