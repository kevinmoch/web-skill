# 文档数据契约（authored-bulletin）

`authored-bulletin__publish` 收的是**结构化数据**，不是 HTML/CSS。
你只负责说「这里是一段正文」「这里是一张柱状图」，版式、字号、配色、边距全部由技能
统一渲染。这条规矩换来一件事：**屏幕上看到的文档，和用户在窗口里另存下来的 DOCX，
是同一份数据渲染出来的两张脸**，图表、表格、指标卡都在，不会一存就丢。

不要写 HTML 标签，也不要写 HTML 实体。所有文本按原样给出，`&`、`<`、`>`、引号
都直接写，技能会替你转义。

## 调用参数

```
authored-bulletin__publish({ doc, dataSource })
```

- `doc` —— 下面这个对象。
- `dataSource` —— 数据出处，会显示在文档窗口里给用户看。写你**真正读过**的来源，
  例如 `"页面：付款管理 / 合同台账"` 或 `"工具：list_bugs, get_dora_metrics"`。
  没读过的来源一个字都不要写。

## doc 对象

```json
{
  "docType": "plain",
  "title": "2024 年第三季度交付质量分析",
  "subtitle": "研发中心 · 季度例行分析",
  "meta": [
    { "label": "统计范围", "value": "2024-07-01 ~ 2024-09-30" },
    { "label": "数据来源", "value": "缺陷管理平台" }
  ],
  "blocks": [],
  "signature": { "org": "研发质量组", "date": "2024 年 10 月 9 日" }
}
```

| 字段        | 必填        | 说明                                                                                                                                                    |
| ----------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docType`   | 否          | `"plain"`（默认，普通 Word 文档）或 `"official"`（红头公文）。见 SKILL.md 的对照表                                                                      |
| `title`     | **是**      | 文档标题，居中大字                                                                                                                                      |
| `subtitle`  | 否          | 副标题，标题下一行                                                                                                                                      |
| `meta`      | 否          | `{label, value}` 数组，一行灰色小字。放统计范围、口径、版本这类信息                                                                                     |
| `official`  | 仅 official | `{ issuer, documentNumber?, recipient? }`。`issuer` 是发文单位（红字），`documentNumber` 是文号，`recipient` 是主送单位。`plain` 文档**不得**带这个字段 |
| `blocks`    | **是**      | 正文，见下。至少一项                                                                                                                                    |
| `signature` | 否          | `{ org?, date? }`，右下角落款。公文一般要，普通文档通常不要                                                                                             |

## blocks —— 11 种块

每一项都是 `{ "type": "..." }`。正文里唯一的内联样式是 `**加粗**`，
因为只有它在屏幕和 Word 里都能还原；不要用 `*斜体*`、`` `代码` ``、`# 标题`
或任何别的 markdown 记号，它们会原样显示成星号和井号。

### heading —— 小节标题

```json
{ "type": "heading", "level": 2, "text": "一、总体情况" }
```

`level` 取 1 / 2 / 3。文档标题已经由 `title` 给了，正文里的分节从 `level: 2` 起步。

### paragraph —— 正文段落

```json
{ "type": "paragraph", "text": "三季度共受理缺陷 **1 284** 件，较上季度下降 12.4%。" }
```

一段一个块，不要把整篇正文塞进一个 `paragraph`——那样导出的 Word 里也是一坨。

### list —— 列表

```json
{ "type": "list", "ordered": false, "items": ["交付准时率 96.2%", "线上事故 0 起"] }
```

`ordered: true` 出编号，缺省是圆点。

### table —— 表格

```json
{
  "type": "table",
  "title": "各产品线缺陷分布",
  "columns": ["产品线", "新增", "修复", "遗留"],
  "rows": [
    ["支付", 312, 298, 14],
    ["风控", 205, 205, 0]
  ],
  "caption": "数据截至 2024-09-30"
}
```

`rows` 里每一行的单元格数必须等于 `columns` 的长度，否则被挡回。
数字就写数字，不要写成 `"312"`。`columnWidths` 可选，是各列的宽度权重。

### chart —— 图表

```json
{
  "type": "chart",
  "chartType": "bar",
  "title": "月度缺陷趋势",
  "labels": ["7 月", "8 月", "9 月"],
  "series": [
    { "name": "新增", "values": [468, 421, 395] },
    { "name": "修复", "values": [452, 430, 410] }
  ],
  "caption": "9 月新增缺陷环比下降 6.2%"
}
```

`chartType`：`bar` / `line` / `area` / `pie` / `scatter` / `stacked-bar` / `dual-axis`。
每条 `series` 的 `values` 长度必须等于 `labels` 的长度，且必须是**数字**不是字符串。
导出 DOCX 时，图会以屏幕上那张图的样子贴进去，下面再自动附一张数据表，
所以数字仍然可编辑——你不需要为了「怕丢」额外再写一遍表格。

### metrics —— 指标卡一排

```json
{
  "type": "metrics",
  "items": [
    { "label": "缺陷总数", "value": 1284, "change": "-12.4%", "trend": "down" },
    { "label": "平均修复时长", "value": "18.6 h", "change": "-2.1 h", "trend": "down" }
  ]
}
```

最多 6 张，一排放得下。`trend` 取 `up` / `down` / `neutral`。

### keyValue —— 键值清单

```json
{
  "type": "keyValue",
  "title": "本次统计口径",
  "items": [
    { "label": "统计周期", "value": "2024-07-01 ~ 2024-09-30" },
    { "label": "纳入范围", "value": "线上环境 P0-P2 缺陷" }
  ]
}
```

讲**同一个东西**的若干条属性用它；若干条可比较的记录请用 `table`。

### callout —— 提示框

```json
{ "type": "callout", "tone": "warning", "title": "需要关注", "text": "风控线遗留缺陷已连续两个季度上升。" }
```

`tone` 取 `info`（默认）/ `success` / `warning` / `danger`。一篇里别超过两三个，
满屏提示框等于没有提示。

### quote —— 引文

```json
{ "type": "quote", "text": "质量红线不可突破。", "source": "《研发管理办法》第 12 条" }
```

### divider —— 分隔线

```json
{ "type": "divider" }
```

### pageBreak —— 强制分页

```json
{ "type": "pageBreak" }
```

打印和导出时从这里翻页。附件、附表另起一页时用。

## 一份普通 Word 文档的完整例子

```json
{
  "doc": {
    "docType": "plain",
    "title": "三季度交付质量分析",
    "subtitle": "研发中心",
    "meta": [{ "label": "统计范围", "value": "2024-07-01 ~ 2024-09-30" }],
    "blocks": [
      {
        "type": "metrics",
        "items": [
          { "label": "缺陷总数", "value": 1284, "change": "-12.4%", "trend": "down" },
          { "label": "准时交付率", "value": "96.2%", "change": "+1.8pt", "trend": "up" }
        ]
      },
      { "type": "heading", "level": 2, "text": "一、总体情况" },
      { "type": "paragraph", "text": "三季度共受理缺陷 **1 284** 件，较上季度下降 12.4%。" },
      {
        "type": "chart",
        "chartType": "line",
        "title": "月度缺陷趋势",
        "labels": ["7 月", "8 月", "9 月"],
        "series": [{ "name": "新增", "values": [468, 421, 395] }]
      },
      { "type": "heading", "level": 2, "text": "二、分产品线情况" },
      {
        "type": "table",
        "columns": ["产品线", "新增", "遗留"],
        "rows": [
          ["支付", 312, 14],
          ["风控", 205, 31]
        ]
      },
      { "type": "callout", "tone": "warning", "text": "风控线遗留缺陷连续两季度上升。" }
    ]
  },
  "dataSource": "页面：缺陷管理 / 交付看板"
}
```

## 一份红头公文的完整例子

只有用户说了「通报 / 公文 / 通告 / 红头」才这么写。

```json
{
  "doc": {
    "docType": "official",
    "official": {
      "issuer": "某某集团办公室",
      "documentNumber": "某办发〔2024〕17 号",
      "recipient": "各分子公司、各部门："
    },
    "title": "关于 2024 年第三季度交付质量情况的通报",
    "blocks": [
      { "type": "paragraph", "text": "现将 2024 年第三季度交付质量情况通报如下。" },
      { "type": "heading", "level": 2, "text": "一、总体情况" },
      { "type": "paragraph", "text": "三季度共受理缺陷 1 284 件，较上季度下降 12.4%。" }
    ],
    "signature": { "org": "某某集团办公室", "date": "2024 年 10 月 9 日" }
  },
  "dataSource": "页面：缺陷管理"
}
```

公文**不画公章**——技能不会替你生成任何印章图形，也不要在正文里用文字模拟一个。

## publish 会挡回什么

`publish` 校验不过就一条都不投放，返回 `PUBLISH_REJECTED: ...` 并逐条说明。
常见的几条：

- `doc.title` 空；
- `blocks` 为空数组；
- 块的 `type` 拼错（大小写敏感，是 `keyValue` 不是 `keyvalue`）；
- 表格某一行的单元格数和 `columns` 对不上；
- 图表的 `values` 长度和 `labels` 对不上，或者写成了字符串；
- `docType: "official"` 却没给 `official.issuer`；
- `docType: "plain"` 却带了 `official` 字段；
- `dataSource` 空。

按提示改完再调一次即可，不必重新取数。
