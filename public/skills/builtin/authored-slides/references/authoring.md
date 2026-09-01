# 文档编写契约（幻灯片）

文档窗口是一个**受信外壳**：你交给 `publish` 的 HTML 只作为数据写进 DOM，
里面的 `<script>` 不会执行。放映引擎（reveal.js）由外壳负责启动，
你只要写出它认得的结构；图表、表格、指标用第二节的预置组件占位。

## 一、结构（写错就不成为幻灯片）

```html
<div class="deck" data-viewer-mode="slides" data-viewer-chart-font="lg">
  <div class="slides">
    <section class="deck__cover">…第 1 页…</section>
    <section>…第 2 页…</section>
  </div>
</div>
```

- 根节点必须带 `data-viewer-mode="slides"`，外壳看到它才会挂放映引擎；
  漏了就退化成一张长网页。
- 根节点下**必须**有且只有一个 `<div class="slides">`，它的直接子元素是
  一页一个的 `<section>`；至少两页。
- 建议同时写 `data-viewer-chart-font="lg"`：把图表画布里的字号调大，投影才看得清。
- 舞台尺寸固定 **1600 × 900**（16:9），CSS 按这个尺寸写，不要用 `vw` / `vh`。
- 不要用 reveal 的 `fragment` 逐步动画：导出 PDF 时会全部展开，反而更乱。

## 二、硬约束（违反会被 publish 拒收）

1. 只出**片段**：不要 `<!doctype>` / `<html>` / `<head>` / `<body>`。
2. 禁止 `<script>` `<style>` `<link>` `<meta>` `<base>` `<iframe>` `<object>` `<embed>`。
   样式全部写进 `css` 参数。
3. 禁止内联事件属性（`onclick=` `onerror=` …）与 `javascript:` 链接。
4. **不要引用外链图片**：窗口的 CSP 只放行同源与 `data:`，`https://…` 的图片会被拦成空框。
   需要图标、徽标时用**内联 `<svg>`** 或纯 CSS 画。
5. 文本里的 `&` `<` `>` 写成 `&amp;` `&lt;` `&gt;`。

## 三、数据组件（唯一的动态内容）

不要用 `<div>` 拼柱状图。写一个**空**占位，外壳会把真组件挂进去：

```html
<div
  class="deck__chart"
  data-webskill-component="Chart"
  data-webskill-props='{"type":"bar","labels":["一区","二区","三区"],"series":[{"name":"完成率","values":[67,57,50]}]}'
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

- 挂载后生成的结构，CSS 按这些钩子写：
  - `Metric` → `[data-webskill-metric="label"|"value"|"change"]`
  - `Gauge` → 外层带 `[data-tone]`，内部 `[data-webskill-gauge="label"|"track"|"fill"|"value"]`
  - `Table` → 原生 `table / thead / th / td`；`KeyValue` → 原生 `dl / dt / dd`

## 四、CSS（三个必须照抄的写法）

1. **前缀写 `.deck.reveal`**。技能样式在放映引擎自带样式**之前**注入，
   只写 `.deck` 压不过它的默认值。（`.deck` 换成你自己的根 class。）
2. **section 用后代选择器，不能用 `>`**：

   ```css
   .deck.reveal .slides section {
     height: 100%;
     flex-direction: column;
   }
   ```

   导出 PDF 时每个 `<section>` 会被引擎包进一层 `.pdf-page`，
   `.slides > section` 当场失配，屏幕上好好的版式一打印就散。

3. **不要给 section 写 `display`**：引擎会把 `display` 直接写成内联样式，
   CSS 里写了也无效。版式靠上面那句的 `flex-direction: column` 加子元素的
   `flex` 分配来搭。
4. 图表容器要能拿到高度：`.deck__chart { flex: 1 1 auto; min-height: 320px; }`；
   两栏并排时外层 `display: grid; grid-template-columns: 1fr 1fr; min-height: 0;`，
   里面的图表写 `height: 100%; min-height: 0;`。
5. 想让底色出现在 PDF 里，加 `print-color-adjust: exact;`。
6. 中文字体族：`'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif`。

## 五、配色与对比度（标题和背景分不清，八成是这一节没照做）

1. **每一页的标题都要显式写 `color`，选择器必须带 `.reveal`**：

   ```css
   .deck.reveal .slides section h1,
   .deck.reveal .slides section h2 {
     color: #f2f7ff;
   }
   ```

   只写 `.deck__cover h1 { color: … }` 压不过放映引擎自带的默认字色（深灰）。
   你给封面刷了深色底、标题却仍是引擎的深灰——这就是「首页标题跟背景分不清」的成因。
   副标题、正文、页码同理，凡是要定字色的选择器都带上 `.reveal`。

2. 全篇只用**一种**底色基调，不要每页换底：深底 `#0f1b2e`～`#132340`，或浅底 `#f7f9fc`。
   封面可以用渐变，但**渐变最亮的那一端也要明显比标题字暗**（深底方案）
   或明显比标题字亮（浅底方案）。深蓝底配中蓝标题、浅灰底配浅灰标题都是看不清。

3. 成套取色，不要临场调：

   |      | 标题      | 副标题 / 正文 | 分隔线 / 边框 | 强调      |
   | ---- | --------- | ------------- | ------------- | --------- |
   | 深底 | `#f2f7ff` | `#a8bcd9`     | `#24304a`     | `#4da3ff` |
   | 浅底 | `#0f2340` | `#41546f`     | `#dde4ee`     | `#1a6fd4` |

4. **强调色不用来写整行标题**：它只上一个关键数字、一个词或一条下划线。
   图表的 series 颜色也要与底色拉开——深底上不要用深蓝系柱子。

5. 封面单独检查一遍：标题、副标题、日期、数据口径四行是不是都定了 `color`，
   有没有哪一行还在吃继承值。

## 六、内容密度与页数

- **页数由内容决定**：一个站得住的论点一页，前面封面、后面结论页。
  不要预设固定页数（不是「一般八页」），也不要为凑页数把一个论点拆成两页或加没数据的「展望」。
  用户给了页数或大纲就严格照办。
- 一页一个论点：`<h2>` 写论点本身（「逾期应付集中在两家供应商」），
  不要写成栏目名（「应付分析」）。
- 一页最多两个信息块（一图一结论、或两图并排），文字不超过 3 行。
- 结论句放在页面底部（`margin-top: auto`），用一句话说清「所以怎样」。
- 首页放标题、副标题、日期与数据口径；末页放结论与下一步建议。
