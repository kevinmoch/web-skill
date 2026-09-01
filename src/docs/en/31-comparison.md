# Capability Comparison: Web vs Extension

The two forms are the same assistant: embedded in a website it's the web version, installed on the browser it's the extension version. The vast majority of capabilities are identical; the real difference comes down to one thing — how many pages the assistant can reach. This chapter gathers the difference sections from across the book into a few small tables, so you can check everything in one place.

How to read the tables: one capability per row, with only three possible values — Yes / No / Limited — and a short note in parentheses. The exact limits behind "Limited" are written in the chapter each row's "Details" links to; they're not repeated here.

![M-31 The capability boundary: the inner circle is what the web version can reach — the one website it lives on; the outer circle is what the extension version can reach — any web page, multiple tabs, files downloaded on this machine; the outer circle's edge is marked with constraints: password fields are not read, at most 32 pages open at once per round, authorizations are revocable](/docs-assets/comparison/M-31.svg)

The outer circle is one size bigger than the inner one, but the circle's edge is marked with constraints: bigger capability, boundaries still clear.

## How to tell which one I'm using

- **Look at where the assistant lives.** Embedded in a website's page, opened from a button on the page (in the Demo, "Expand AI copilot" on the right edge of the page) — that's the web version. Living in the browser's sidebar, opened from the extension icon in the browser toolbar — that's the extension version.
- **Look at where the Console opens.** Opening on a page inside the website (in the Demo, from "Settings" in the chat header) — web version. Opening in a browser tab as the extension's options page — extension version.
- **Try another tab.** Switch to another tab: if the assistant can follow you and read that page, it's the extension version; the web version only appears on the page it lives on.

## Conversation capabilities

How a conversation works is basically the same in both; the difference is only the range the assistant can read and write — that's the next table.

| Capability | Web version | Extension version | Details |
| --- | --- | --- | --- |
| Ask, interrupt, retry, edit, delete with undo | Yes | Yes | [Asking, Answering, and Interrupting](#/docs/chat-basics) |
| Manage sessions (create, search, archive, delete) | Yes | Yes | [Managing Sessions](#/docs/sessions) |
| The six interaction cards | Yes | Yes | [Six Interaction Cards](#/docs/interactions) |
| Generative UI (tables, charts, forms, kanban) | Yes | Yes | [Generative UI Responses](#/docs/generative-ui) |
| Run steps, task list, termination notices | Yes | Yes | [Seeing What the Assistant Is Doing](#/docs/transparency) |
| Attachments, voice input, camera | Yes | Yes (the first time you use the microphone or camera, you grant permission once in a regular tab) | [Attachments, Images, Voice, and Camera](#/docs/attachments) |
| Pick a model, read capability badges | Yes | Yes | [Choosing a Model](#/docs/models) |
| Using the browser's built-in AI as the model | Limited (depends on which browser you open it in) | Yes | [Choosing a Model](#/docs/models) |

## Page capabilities

The group where differences concentrate. There's a single root cause: the web version's eyes and hands are confined to the one website it lives on.

| Capability | Web version | Extension version | Details |
| --- | --- | --- | --- |
| Read the current page | Yes (only the page it's on) | Yes (any web page you have open) | [Letting the Assistant Read the Page](#/docs/page-perception) |
| Read third-party frames nested in the page | Limited | Yes (cross-origin text and images nested several frames deep can all be read) | [Letting the Assistant Read the Page](#/docs/page-perception) |
| Act on pages (click, fill, submit) | Yes (only the page it's on) | Yes (any web page you open and hand over to it) | [Letting the Assistant Act on the Page](#/docs/page-actions) |
| Working across tabs | No | Yes (only pages in the workset) | [Working Across Tabs (Extension Only)](#/docs/tabs) |
| Working through a list item by item | Limited (within one site, via "navigate + go back") | Yes (across tabs and across sites, no action needed from you midway) | [Working Across Tabs (Extension Only)](#/docs/tabs) |
| Keeping several pages open for comparison | No | Yes | [Working Across Tabs (Extension Only)](#/docs/tabs) |
| Working with several pages open at once in one round | No | Limited (at most 32 pages, adjustable between 2 and 32; hitting the cap means wrapping up midway) | [Working Across Tabs (Extension Only)](#/docs/tabs) |

## Artifacts and downloads

| Capability | Web version | Extension version | Details |
| --- | --- | --- | --- |
| The four destinations for artifacts: view in conversation, open a window, download, print | Yes | Yes | [Artifacts: Dashboards, Documents, Slides, and Printing](#/docs/artifacts) |
| Opening a window with "Open document" | Yes | Yes (both forms pop a confirmation card first; the window opens only after you agree) | [Artifacts: Dashboards, Documents, Slides, and Printing](#/docs/artifacts) |
| Confirming a download happened | Regular browser download (the download itself needs no authorization) | Can tell whether the download actually happened | [Let It Read the File You Just Downloaded (Extension Only)](#/docs/downloaded-files) |
| Artifacts pulling data from multiple sites | No (only the current system's data) | Yes (reads your other open tabs first, then produces) | [Artifacts: Dashboards, Documents, Slides, and Printing](#/docs/artifacts) |
| Reading a file you just downloaded | No (manual upload only) | Yes (lists the download folder, reads files in it) | [Let It Read the File You Just Downloaded (Extension Only)](#/docs/downloaded-files) |

## Management and settings

Same Console, opened in different places: on the web version it opens inside the website (in the Demo, click **Settings** in the chat header); on the extension version it opens in a browser tab (the extension's options page). Clicking **Settings** or **Go to review** in the conversation takes you straight to the corresponding section. Each side manages its own skill library and records.

| Capability | Web version | Extension version | Details |
| --- | --- | --- | --- |
| The Console (six groups, 25 pages) | Yes | Yes | [A Tour of the Console](#/docs/console-tour) |
| Skill library, editor, install and verify | Yes | Yes | [Skill Management](#/docs/console-skills) |
| Run history and memory | Yes | Yes | [Run History](#/docs/console-runs) |
| Review, audit, versions, evaluation, insights | Yes | Yes | [Governance and Review](#/docs/console-governance) |
| Manually adding remote tool services (the MCP Endpoints page) | Yes | No (it lists the endpoints the current web page itself provides, cleared when you change pages) | [Connections](#/docs/console-connections) |
| Settings (the eight settings pages) | Yes | Yes | [Settings](#/docs/console-settings) |

> **Note**: The **Allow reading downloaded files** toggle in Settings corresponds to the extension version's ability to read the download folder; most systems on the web version haven't wired this capability, so turning it on has no practical effect — the note next to the toggle says so.

## Permissions and boundaries

The extension version can reach further, and the corresponding constraints are written down one by one. Every line below is a hard boundary, not a "usually won't".

| Stronger capability | The constraint that comes with it | Details |
| --- | --- | --- |
| Can read any web page | Password field values are never read, and never remembered | [Letting the Assistant Read the Page](#/docs/page-perception) |
| Can act on any web page | Operations with side effects all need your authorization first; remembered authorizations are revocable | [Letting the Assistant Act on the Page](#/docs/page-actions) |
| Can work across tabs | Only pages in the workset; tabs you opened yourself it can't even see | [Working Across Tabs (Extension Only)](#/docs/tabs) |
| Can switch between pages while working | It doesn't touch your screen: when a round ends, you're still on whichever page you were looking at | [Working Across Tabs (Extension Only)](#/docs/tabs) |
| Can read your downloaded files | Listing and reading each pop their own authorization card; remembered authorizations can be viewed and revoked in the Console | [Let It Read the File You Just Downloaded (Extension Only)](#/docs/downloaded-files) |
| Can discover the tools a web page provides | After you move to another page, the previous page's endpoints are cleared | [Connections](#/docs/console-connections) |

## When things don't line up

**The table says "Yes", but you can't find it in the interface.** On the web version, many capabilities are up to the system you're in. Check "Wired capabilities" on the Console's **About & Diagnostics** page; if something genuinely isn't wired, contact the people who provide this system. See [Settings](#/docs/console-settings).

**The table says "Limited", and you want to know exactly where it stops.** Follow the link in that row's "Details" — the limit is written in that chapter's "Web version vs. extension version" section. For example, "Limited" on working through a list item by item means "doable within one site, not across sites".

**Still not sure which form you're on.** Go back to "How to tell which one I'm using" at the top of this chapter — any one of the three signs is enough.

**What the table says doesn't match the interface you see.** The actual interface of the form you're using prevails. If what you're using is the Demo or the extension itself, send this chapter's name together with what you saw to the people who provide the system.
