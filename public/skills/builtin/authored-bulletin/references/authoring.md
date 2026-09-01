# 文档编写契约（通报公文）

文档窗口是一个**受信外壳**：你交给 `publish` 的 HTML 只作为数据写进 DOM，
里面的 `<script>` 不会执行，也读不到本页任何状态。所以文档里**不写任何 JS**；
需要图表、表格、指标时用第二节的预置组件占位。

## 一、硬约束（违反会被 publish 拒收）

1. 只出**片段**：根节点是一个 `<div class="…">`，不要 `<!doctype>` / `<html>` /
   `<head>` / `<body>`。
2. 禁止 `<script>` `<style>` `<link>` `<meta>` `<base>` `<iframe>` `<object>` `<embed>`。
   样式全部写进 `css` 参数。
3. 禁止内联事件属性（`onclick=` `onerror=` …）与 `javascript:` 链接。文档是静态的。
4. **不要引用外链图片**：窗口的 CSP 只放行同源与 `data:`，`https://…` 的图片会被拦成空框。
   需要印章、徽标时用**内联 `<svg>`** 或纯 CSS 画；没有印章也完全成立，
   不要为此塞占位图或写「此处应有印章」。
5. 正文里的 `&` `<` `>` 写成 `&amp;` `&lt;` `&gt;`。

## 二、数据组件（唯一的动态内容）

不要用 `<div>` 拼柱状图。写一个**空**占位，外壳会把真组件挂进去：

```html
<div
  class="bulletin__chart"
  data-webskill-component="Chart"
  data-webskill-props='{"type":"bar","labels":["一区","二区","三区"],"series":[{"name":"本月完成量","values":[128,96,74]}]}'
></div>
```

- `data-webskill-props` 是 **JSON**，写在**单引号**属性里，JSON 的双引号因此不用转义；
  值里若出现单引号写成 `&#39;`。数字要写成数字，不要写成字符串。
- 名字大小写敏感，白名单只有五个；写错或 props 不合 schema，只会在原地显示一行
  英文降级提示，不会静默留空：

| 组件       | props                                                                                                                                                       |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Chart`    | `{ type: "bar" \| "line" \| "area" \| "pie" \| "scatter" \| "stacked-bar" \| "dual-axis", title?, labels: string[], series: [{ name, values: number[] }] }` |
| `Table`    | `{ title?, columns: string[], rows: (string \| number \| boolean \| null)[][], columnWidths?: number[] }`                                                   |
| `Metric`   | `{ label, value: string \| number, change?: string, trend?: "up" \| "down" \| "neutral" }`                                                                  |
| `Gauge`    | `{ label?, value: number, min?: number, max?: number, tone?: "neutral" \| "success" \| "warning" }`                                                         |
| `KeyValue` | `{ items: [{ label, value }] }`                                                                                                                             |

- **`Chart` 的容器必须有确定高度**（CSS 写 `height`，或由 flex / grid 分配），
  否则画布 0 高、图看不见。
- 挂载后生成的结构，CSS 按这些钩子写：
  - `Metric` → `[data-webskill-metric="label"|"value"|"change"]`
  - `Gauge` → 外层带 `[data-tone]`，内部 `[data-webskill-gauge="label"|"track"|"fill"|"value"]`
  - `Table` → 原生 `table / thead / th / td`；`KeyValue` → 原生 `dl / dt / dd`

## 三、CSS

- 窗口里没有 Tailwind、没有设计 token，写普通 CSS。
- 选择器都从自己的根 class 起头（`.bulletin …`），不要写裸 `body` / `*`。
- 中文字体族：`'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif`。
- 要让底色出现在打印件里，加 `print-color-adjust: exact;`。

## 四、公文版式要点

这份文档的目标是**能直接按 A4 打印**，所以：

- 版心：`max-width: 820px; margin: 0 auto; padding: 44px 56px;`，配
  `@media print { @page { size: A4; margin: 16mm; } }`。
- 结构按公文习惯自上而下：发文单位（红头）→ 文号 → 标题 → 主送机关 →
  正文（一、二、三分条）→ 结论/要求 → 落款单位 + 日期。
- 红头：单位名居中放大、下面一条 `3px solid #c0202a` 的红线；文号小字居中。
- 正文：16px / `line-height: 1.9` / `text-indent: 2em`；标题居中加粗，不要用
  Markdown 风格的 `#`。
- 数据要克制：一份公文里**最多两三处**图表或表格，其余用文字叙述。
  公文不是仪表盘，堆满图会变得不像公文。
- 分页控制：`h2, h3 { break-after: avoid; }`、表格与图表容器加
  `break-inside: avoid;`，避免打印时被拦腰截断。
