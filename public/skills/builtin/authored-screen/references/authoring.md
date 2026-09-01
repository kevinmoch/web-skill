# 文档编写契约（监控大屏）

文档窗口是一个**受信外壳**：你交给 `publish` 的 HTML 只作为数据写进 DOM，
里面的 `<script>` 不会执行，也读不到本页任何状态。所以大屏里**不写任何 JS**，
也就没有自动轮播、自动刷新、倒计时——需要图表、表格、指标时用第二节的预置组件占位。

## 一、硬约束（违反会被 publish 拒收）

1. 只出**片段**：根节点是一个 `<div class="…" data-viewer-chrome="hidden">`，
   不要 `<!doctype>` / `<html>` / `<head>` / `<body>`。
   `data-viewer-chrome="hidden"` 必须写在根节点上，否则窗口右上角的悬浮胶囊
   会压在大屏上。
2. 禁止 `<script>` `<style>` `<link>` `<meta>` `<base>` `<iframe>` `<object>` `<embed>`。
   样式全部写进 `css` 参数。
3. 禁止内联事件属性（`onclick=` `onerror=` …）与 `javascript:` 链接。
4. **不要引用外链图片**：窗口的 CSP 只放行同源与 `data:`，`https://…` 的图片会被拦成空框。
   需要图标、徽标时用**内联 `<svg>`** 或纯 CSS 画。
5. 文本里的 `&` `<` `>` 写成 `&amp;` `&lt;` `&gt;`。

另外强烈建议在根节点同时写 `data-viewer-chart-font="lg"`：它会把图表画布里的
标题、坐标轴与图例字号调大，投屏远看才认得出。

## 二、数据组件（唯一的动态内容）

不要用 `<div>` 拼柱状图。写一个**空**占位，外壳会把真组件挂进去：

```html
<div
  class="screen__chart"
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

- **`Chart` 的容器必须有确定高度**（CSS 写 `height`，或由 grid 行高分配），
  否则画布 0 高、图看不见。大屏里给到 `min-height: 260px` 起步。
- 挂载后生成的结构，CSS 按这些钩子写：
  - `Metric` → `[data-webskill-metric="label"|"value"|"change"]`
  - `Gauge` → 外层带 `[data-tone]`，内部 `[data-webskill-gauge="label"|"track"|"fill"|"value"]`
  - `Table` → 原生 `table / thead / th / td`；`KeyValue` → 原生 `dl / dt / dd`

## 三、CSS

- 窗口里没有 Tailwind、没有设计 token，写普通 CSS。
- 选择器都从自己的根 class 起头（`.screen …`），不要写裸 `body` / `*`。
- 中文字体族：`'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif`。

## 四、大屏版式（照这个骨架排，不要摆卡片墙）

业界大屏的样子是**一条顶栏 + 一行 KPI + 左中右三栏，中栏是主视觉**。
最常见的翻车是把六个等大圆角卡片摆成两行——那是后台管理页，不是大屏。

```html
<div class="screen" data-viewer-chrome="hidden" data-viewer-chart-font="lg">
  <header class="screen__top">…标题 / 主体名 / 数据口径 / 取数时间…</header>
  <section class="screen__kpi">…4～6 个 Metric 占位，等宽一行…</section>
  <main class="screen__body">
    <aside class="screen__col">…2～3 块…</aside>
    <section class="screen__hero">…主视觉：这屏最该被看到的那张图或那个数…</section>
    <aside class="screen__col">…2～3 块…</aside>
  </main>
</div>
```

```css
.screen {
  height: 100vh;
  overflow: hidden;
  display: grid;
  grid-template-rows: auto auto 1fr;
  gap: 14px;
  padding: 16px;
}
.screen__kpi {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
}
.screen__body {
  display: grid;
  grid-template-columns: 1fr 1.7fr 1fr;
  gap: 14px;
  min-height: 0;
}
.screen__col {
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: 14px;
  min-height: 0;
}
/* 每一块都撑满自己的格子，而不是退回内容自然高度 */
.screen__panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.screen__panel .screen__chart {
  flex: 1 1 auto;
  min-height: 0;
}
```

- **根节点写 `height: 100vh; overflow: hidden`，不是 `min-height`**：
  大屏一旦出现纵向滚动条就是废的，投屏时下半截永远看不到。
- **每块都要撑满格子**：分区容器 `min-height: 0`，块内图表 `flex: 1 1 auto; min-height: 0`。
  少了这两句，每块就退回内容自然高度——上半屏挤成一堆、下半屏大片空白，
  也就是「一堆卡片堆在一起」的样子。
- **信息要有主次**：中栏比两侧宽（`1.7fr` 对 `1fr`），主视觉里的数字/图明显更大。
  六块一样大等于没有重点。KPI 行按信息块实际数量改 `repeat(N, 1fr)`，不要留空格子。
- 分区标题用小号字 + 左侧 3px 竖条，不要大圆角白卡片；圆角收到 `4～8px`，
  块间距 `12～16px`，整体比后台页更紧。
- 深色底更适合投屏：底 `#070d1a`，块底 `#0e1729`，描边 `1px solid #1e2c45`，
  正文 `#e6edf7`，次要文字 `#7f93b5`。用户指定了别的配色就按用户的来。
- 远看优先：主视觉关键数字 ≥ 56px，KPI 数字 ≥ 40px，区块标题 ≥ 16px，正文不小于 14px。
- 顶栏放标题 + 主体名 + 数据口径（把你真正读过的页面名或工具名写上去）+ 取数时间，
  不要写「实时」——数据是这次取的快照，没有自动刷新。
- 状态色克制使用：正常绿 `#3fbf8f`、注意黄 `#e0a94b`、告警红 `#e05c5c`，
  一屏里出现的告警色不超过两处，否则失去提示意义。
