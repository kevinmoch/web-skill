---
name: sprint-weekly-brief
description: 用周报模板输出当前迭代的进展简报——结构固定，数据自动填充。
---

## 何时使用

当用户要求迭代周报、迭代小结，或当前迭代的结构化进展汇报时使用。

## 输入

- `projectId`（可选）：缺省取当前选中项目。
- `highlights`（第二轮由模型填写）：2-3 句亮点描述。

## 步骤

1. 先不带 `highlights` 调用 `sprint-weekly-brief__run`，它会返回数据摘要
   ——不要把摘要原样贴回。
2. 基于摘要写 2-3 句亮点，再把它们作为 `highlights` 参数再次调用该工具。
3. 返回的 surface 是固定版式（KPI 带、燃尽图、风险、页脚），原样呈现，
   不要重排结构。
