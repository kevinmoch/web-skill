# Working Across Tabs

> **Extension only**: Working across several browser tabs at once and aggregating across websites are extension-only. "Working through a list item by item", though, the web version can also do: via in-app tabs when the system has its own tab bar, or within one site via "navigate + go back" when it doesn't. How far each form can go is in the edition-differences section at the end.

The extension-version assistant lives in the browser's sidebar, and within one task it can work across several tabs at once: it flips back and forth and reads by itself, then gathers the results scattered across the pages into one answer for you. This chapter covers how to use that, and where the boundaries are.

## What you can do

- Have the assistant consult several tabs at once and gather information scattered across pages into one conclusion.
- Hand it a list to work through item by item: it opens an item, reads it, comes back, moves to the next — no action needed from you in between.
- Always know which page it's working on, and call it back to your page anytime.
- Be clear about what it can't touch: tabs you opened yourself, and your screen.

## Working with multiple pages at once

The web-version assistant lives inside one website and can't reach the browser-tab layer. In the extension version, the pages available within one task are a set, called its **workset**: the page where you set it to work (the starting page), plus any pages its own actions newly opened.

Two things to know up front:

- **It can't open a page out of thin air.** Send it a URL and ask it to open a new page — it can't; only pages brought about by its actions (like clicking a link that opens in a new tab) can enter the workset.
- **Single-page rules apply unchanged.** Actions with side effects still pop a card to ask you first — see [Letting the Assistant Act on the Page](#/docs/page-actions).

![The extension sidebar assistant alongside several browser tabs](/docs-assets/tabs/en/S-tabs-01-sidepanel-tabs.png)

The assistant works in the sidebar and can use the multiple tabs next to it at the same time.

![The flow of reading multiple pages item by item from the starting page and gathering them into one answer](/docs-assets/tabs/en/S-tabs-02-multi-page-flow.svg)

Schematic — not a real screenshot. Starting from the starting page, it enters a detail page to read, returns to the list, moves to the next page, and gathers everything into one answer.

It takes what it needs from each of the pages and gathers it into one answer.

## Handing it a whole list to work through item by item

This is the most practical use of multiple tabs. Give it a list — orders, requirements, tickets — and say "go through them one by one and pick out the problematic ones". It opens each item itself, reads it, goes back to the list, moves to the next, and finally gathers all the results for you — you don't do anything in between.

The method fits in one sentence: enter an item → finish reading → back to the list → next item, looping until done. And it goes more than one level deep: from a list into a detail, and from the detail into a further level — drill-down at least three levels deep, and backing out level by level, are supported. The next section walks through the full process with an example; how far the web version can go is in the edition-differences section at the end.

![The item-by-item walkthrough: open the item, read it, note the key point, go back to the list, move to the next item, and once everything is read, gather it into one answer](/docs-assets/tabs/en/S-tabs-04-list-walkthrough.svg)

Schematic — not a real screenshot. It enters a detail, returns to the list, and moves to the next item by itself, looping until done.

The whole process needs no action from you; the run flow shows it advancing item by item.

![Three-level drill-down: level 1 the list page, level 2 the detail page, level 3 the detail's detail — the assistant can read into each level and back out level by level](/docs-assets/tabs/en/S-tabs-05-three-level-drilldown.svg)

Schematic — not a real screenshot. Multi-level drill-down, at least three levels deep: list page, detail page, and the detail's detail — in and out level by level.

From list to detail to the next level — every level in and out is traceable.

## A worked example: one big table from requirements to defects

> **Tip**: This section is a worked scenario to make the whole process concrete; your system's page structure may differ.

Imagine you're looking at a requirement list in an agile management system: one requirement per row, with a "view sprints" link at the end of each row. You say: `Check every requirement's sprints and unresolved defects, and gather them into one table.` What happens next:

1. **It clicks the first requirement's link.** A new browser tab pops up (an in-app tab on systems with a tab bar), holding that requirement's sprint table. You'll see an extra page on the tab bar — opened by it, and it's working on that page.
2. **It reads the sprint table, then clicks into each sprint row.** Each click pops another new tab holding that sprint's unresolved defects. After reading, it closes that page and clicks the next row.
3. **Back to the requirement list, on to the second requirement.** The same motions repeat for every requirement: open page, read table, drill down, close page, back to the list.
4. **Finally you get one big table.** One row per requirement: how many sprints, how many unresolved defects in total — the heaviest one visible at a glance.

![The worked-scenario drill-down: click a row's link in the requirement list and a new tab opens that requirement's sprint table; click a sprint's link and a new tab opens that sprint's defect table; after reading, back to the list for the next requirement](/docs-assets/tabs/en/S-tabs-07-scenario-drilldown.svg)

Schematic — not a real screenshot. It holds one requirement's sprint table open and clicks into the defect pages row by row.

Requirement list → sprint table → defect list — each level opens in its own tab.

Sample for illustration — not real data. The final summary table looks roughly like this:

| Requirement                  | Sprints | Unresolved defects |
| ---------------------------- | ------- | ------------------ |
| Req A: checkout flow revamp  | 3       | 2                  |
| Req B: report export         | 5       | 7                  |
| Req C: notifications         | 2       | 0                  |
| Req D: permission management | 4       | 5                  |

The final table delivered: one row per requirement.

How many pages does it hold open at once? The starting page, the current requirement's sprint table, the current sprint's defect page — **3 pages**. Even with 20 requirements at 5 sprints each — over a hundred openings in total — only two or three pages are open at any moment, because it usually closes a page once it's read. The 32-page limit only comes into play if you ask it to "keep the pages open for comparison"; what happens if you really hit it is the next section.

## Which tabs the assistant can use

This is the chapter's most important boundary: **the assistant can only use pages in the workset.**

- **Tabs you opened yourself, it can't even see.** Ones you open after the task starts, ones that were open all along — none of them are on its list; their addresses and titles never appear. If you want it to look at another page you're viewing, switch to it and then speak — it follows you to that page.
- **It can't close the starting page.** That page belongs to you: it can read it and click it, but not close it.
- **It doesn't take over the extension's own pages.** If you open the extension's settings page, for example, it won't follow you in.

![M-16 The boundary of the workset: on one side, pages inside the workset — the starting page and pages it opened itself, marked with the 32-page limit and the "enter an item → read → back to list → next item" loop; on the other side, tabs you opened yourself, which the assistant can't see](/docs-assets/tabs/en/M-16.svg)

The boundary is a hard isolation: inside the workset it can use; outside it, it can't perceive.

Sample for illustration — not real data. The cross-page aggregation looks roughly like this:

| Page / item            | Key point read                                             |
| ---------------------- | ---------------------------------------------------------- |
| Requirement list       | 4 requirements, each row ending with a "view sprints" link |
| Req A's sprint table   | 3 sprints; the current sprint is still open                |
| Sprint 3's defect page | 2 unresolved defects left                                  |
| Req B's sprint table   | 5 sprints; defects cluster in sprint 2                     |

Every switch and every read between pages is listed in the run flow.

## How many pages it can have open at once

Within one task, the workset holds at most 32 pages at the same time. The limit is set by the people who provide the system and can be adjusted between 2 and 32, but the interface has no place for you to change it — what's more worth learning is how to cope when you hit it.

**When it hits the limit, you'll see:** it wraps up without finishing, gives you conclusions based on the part already read, and the unread part simply isn't there. It has no way to ask you for a larger quota, so it won't prompt you to adjust it — it can't get one itself either.

**What to do:** narrow the scope and run it in two rounds. `Look at the first 20 rows` and `only this category` are both far more likely to finish in one pass than "go through everything".

In two other situations, you'll find "that page" no longer usable:

| What you see                                                  | What it is                                                                                                                           |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| The page you just looked at suddenly won't respond            | That page was closed or navigated away and is no longer in the workset; have it list the currently usable pages again, then continue |
| In a new conversation, it doesn't recognize pages from before | Page references don't carry across sessions; in a new conversation, start over from the current page                                 |

![Wrapping up at the capacity limit: it opens pages one by one, the number of simultaneously open pages grows, and at the 32-page limit it finishes what is in hand, wraps up, and tells you which part was not done](/docs-assets/tabs/en/S-tabs-06-capacity-wrapup.svg)

Schematic — not a real screenshot. At the 32-page limit, it finishes what it's holding, wraps up, and tells you which part wasn't done.

After hitting the limit it wraps up early, and conclusions are based only on the part already read.

## Will it hijack my screen?

No. When it switches between pages, it switches its own focus — the browser in front of you doesn't move at all. When a task ends, whichever page you were looking at is still the page you're on.

When the page it's holding isn't the one you're looking at, a notice appears in the sidebar: "The assistant is working on another tab — {page name}", with a button "Use my current tab": click it and it comes back to your page; don't, and it keeps working on that page while your screen stays put.

## Web version vs. extension version

|                                             | Web version                                        | Extension version              |
| ------------------------------------------- | -------------------------------------------------- | ------------------------------ |
| Between multiple browser tabs               | Not possible                                       | Supported (within the workset) |
| Aggregating across websites                 | Not possible                                       | Supported                      |
| Item-by-item work between in-app tabs       | Possible once the system's own tab bar is wired in | Supported                      |
| Item-by-item back-and-forth within one site | Possible via "navigate + go back"                  | Supported                      |

The third row deserves an extra word. Some systems have their own tab bar: click a link and the system opens a new in-app tab instead of a new browser tab. Once such a system wires in the corresponding capability, the web-version assistant can also work across tabs item by item — the tabs it opens appear on the tab bar, where you can see them, click in, and close them at will; the boundaries are the same set: only allowed pages are used, and the tab you're watching is never hijacked. Whether your system has this capability — ask the people who provide it.

The extension version's boundaries are as before: pages outside the workset it can't see; it doesn't touch your screen, and after one task the focus is as it was; at most 32 pages open at once per task (adjustable between 2 and 32), hitting the limit means wrapping up midway, and it can't ask you for a larger quota. For the overall difference, see [Web and Extension Editions](#/docs/editions).

## When something goes wrong

- **It says a page is unusable or can't be found.** That page was closed or navigated away and is no longer in the workset. Have it list the currently usable pages again, then continue.
- **In a new conversation it doesn't recognize pages it saw before.** Page references don't carry across sessions. Switch to that page and say again where to start.
- **It gave conclusions without finishing.** Most likely it hit the 32-page-per-task limit. Narrow the scope (first 20 rows, only one category) and run two rounds; it can't ask you for more quota and won't bring it up on its own.
- **You want it to look at another tab you've had open for a while.** It can't see pages you opened yourself. Switch to that page and then speak — it follows you there.
