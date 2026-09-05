# Generative UI Responses

A batch of data, a set of comparisons, a form to fill in — putting these into plain words only adds detours, so sometimes the assistant draws its answer straight into an interface: a table, a chart, a form, a kanban, or a document that opens in a new window. This is called **generative UI**: the answer isn't just text, it's an interface you can look at, fill in, and click.

## What you can do

- Recognize the five forms an answer can take: table, chart, form, kanban, document
- Sort and drag column widths in a table; fill in and submit a form
- Use the "Suggested:" line under a field — click "Use" to put the suggested value in
- Click "Open document" to view a dashboard, document, or slide deck in a new window
- Understand the two limitation notices: the saved-record one and the only-the-first-item one

## More than text

Most answers are text. But when the content is itself "a batch of data" or "a form to fill in", the assistant draws the answer straight into an interface — no setup needed from you. The same question may get text this time and a table next time, depending on which is clearer. The interface's colors follow your light/dark theme automatically; you don't need to re-ask after switching themes.

![M-09 What an answer can look like](/docs-assets/generative-ui/en/M-09.svg)

An answer has six possible looks: forms are for you to fill in, a document wants you to click a button to open it, and the rest are mainly for looking at.

## The kinds you'll run into

### Table

List-type answers usually come straight out as a table. Click a column header to sort; drag a column's edge to adjust its width. With lots of data, the table may show a few rows first and fill in row by row after — it's drawing while generating, not stuck.

![A table answer: click a column header to sort, drag a column edge to adjust its width](/docs-assets/generative-ui/en/S-genui-01-table.png)

List-type answers come out as sortable tables. Sample run output; your actual output will differ.

### Chart

Trend, share, and comparison answers get charts, often with a few metric cards alongside: one big number plus a name. In the Demo, send `Generate an agile operations report for the current project covering sprint health, requirement distribution, defect hotspots and test quality` and you'll see a report-style answer mixing metric cards, charts, and tables.

![A chart answer, with metric cards alongside](/docs-assets/generative-ui/en/S-genui-02-chart.png)

Charts and metric cards can be mixed together. Sample run output; your actual output will differ.

### Form

When the assistant needs several pieces of information at once, besides popping up a fixed card (see [Six Interaction Cards](#/docs/interactions)), it may also draw the form right into the answer: text boxes, dropdowns, dates, checkboxes — fill it in and click submit. Item groups that can be repeated carry "Add" and "Remove" buttons. When a dropdown shows "No options are available for this field.", the option list is empty — it isn't broken; just tell it in words instead.

![A form answer: fields can be filled in directly, and item groups can be added and removed](/docs-assets/generative-ui/en/S-genui-03-form.png)

A form drawn into an answer; below an empty field there may be a line with a suggested value — see below. Sample run output; your actual output will differ.

### Kanban

Status-distribution and progress-overview answers may give a kanban: cards laid out in columns, so you can see at a glance which column is piled up. A kanban is laid out for looking at — cards can't be dragged.

![A kanban answer: cards laid out in columns](/docs-assets/generative-ui/en/S-genui-04-kanban.png)

A kanban lays a pile of statuses out by zone, for viewing only. Sample run output; your actual output will differ.

### Document

Full-page works like dashboards, formal documents, and slide decks appear in the conversation as a card with an "Open document" button; click it and the work opens in a new window. In the Demo, send `Open the current project's delivery monitoring dashboard in a new window — sprint progress, defect distribution, test quality, and DORA metrics on one screen` to get one. For how to page through, print, and export after opening, see [Artifacts: Dashboards, Documents, Slides, and Printing](#/docs/artifacts).

![A document answer: a card with an "Open document" button](/docs-assets/generative-ui/en/S-genui-05-document.png)

Click "Open document" and the full-page work opens in a new window.

## How to interact with it

Tables, charts, and kanbans are for looking at: sorting, paging ("Previous page" / "Next page"). Forms are for filling in: after you submit, the answer continues from your input — the title of the resulting chart may carry the very value you just picked.

Hidden in forms is a rarely discovered convenience: **suggested values**. While a field is still empty, a line of small text may appear below it: it starts with "Suggested:", followed by a value, sometimes with a reason in parentheses, and ends with a "Use" button. Click "Use" and the value goes into the field; don't click and it isn't filled — it never writes itself in, so if it looks wrong just ignore it. When the field already has content, this line doesn't appear.

![The suggested-value line under a form field: starting with "Suggested:", ending with a "Use" button](/docs-assets/generative-ui/zh/S-genui-08-suggestion.png)

What the suggested-value line really looks like. Sample run output; your actual output will differ.

## Saved records can't be operated

Interface answers are saved on your device along with the session. In the round just generated they're alive: you can fill, click, and submit. When you page back to them later (refresh, reopen the page, switch sessions and return), the interface is still in place with its content unchanged, but it can't be operated anymore, and there's an extra line below: "This is a saved record — its actions are no longer available."

No data is lost — the interface has become a saved record. If you want to operate it again, send a new sentence and have it draw a fresh one.

![An interface card in a past session, with "This is a saved record — its actions are no longer available." shown below](/docs-assets/generative-ui/en/S-genui-06-readonly.png)

When you page back to it, the buttons no longer work, and the notice is attached below the interface.

## Some content only shows the first item

A repeatable item group in a form, under certain renderers, shows only the first group, with a notice line: "This renderer shows only the first item of a repeatable group." The first group can still be filled in and submitted normally; the rest aren't lost — this renderer just can't draw them. The renderer is chosen by your system in the Console under "Settings → Generative UI" (see [Settings](#/docs/console-settings)); switch to another and you can see them all. In the Chinese interface, certain renderers show this notice as 「当前渲染档只显示重复组的第一项。」 — it's the same notice.

![An item group showing only the first group, with "This renderer shows only the first item of a repeatable group." below](/docs-assets/generative-ui/zh/S-genui-07-array-first-item.png)

Showing only the first group is a limitation of the renderer, not lost data.

## Web version vs. extension version

Generative UI itself is the same in both: the five forms, suggested values, and the two limitation notices look the same and behave the same in both versions. The "document" form's opening is the same too: after clicking "Open document", both forms first pop up a confirmation card titled "Confirmation", and the window opens only after you agree. The difference is only in how the window is hosted: the web version opens the site's own viewer page, while the extension version's window is opened for you by the extension. For the details of the confirmation card, see [Artifacts: Dashboards, Documents, Slides, and Printing](#/docs/artifacts).

## When something goes wrong

- **When browsing an old session, the buttons on the interface don't respond.** That's normal — it's a saved record ("This is a saved record — its actions are no longer available."). To operate it again, send a new message.
- **An item group seems to be missing entries.** If there's a line saying "This renderer shows only the first item of a repeatable group.", it's a display limitation — the data isn't lost; switch to another renderer to see everything.
- **A whole block of interface is a data preview labeled "Preview" and can't be interacted with.** Your system has chosen a renderer that's still in preview — switch to another one.
- **An interface in an old session is down to a line saying "Generative UI from an earlier version is no longer rendered."** Interfaces generated by earlier versions can't be rendered in the new version; the content is still in the text answer — if you need the interface, ask again.
- **This answer is text-only when it used to draw interfaces.** Your system may have turned off the generative UI toggle in settings. The toggle only governs "the assistant drawing interfaces on its own": interfaces produced by skills (the instructions that teach the assistant to do something) and the six interaction cards appear as usual. Details in [Settings](#/docs/console-settings).
