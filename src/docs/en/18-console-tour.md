# A Tour of the Console

The Console is where you manage skills, review run history, and adjust settings. This chapter answers three questions: how to open it, how its 25 pages are laid out, and how to find the page you want fast. Every screen in this chapter can be compared against the real thing by opening the Console in the [Demo](/demo).

## What you can do

- Open the Console and recognize what each of the six groups manages
- Use the Overview page to judge how the assistant has been doing lately and whether anything needs you
- Jump straight to any page by name with the command palette — no need to memorize locations
- Check the page name and purpose line at the top of a page to confirm you're in the right place

## When you need the Console

Day-to-day chatting never touches the Console — asking questions and putting the assistant to work all happen in the chat panel. Come here for things like these:

- Installed a new skill, want to edit one, or want to package your own skill for someone else → [Skill Management](#/docs/console-skills)
- An answer failed or felt off, and you want to find out what happened in that run → [Run History](#/docs/console-runs)
- A candidate skill is waiting for your review, or you want to trace who changed what and when → [Governance and Review](#/docs/console-governance)
- Switching models, connecting external tool services, or seeing which tools and temporary skills the current page provides → [Connections](#/docs/console-connections); revoking remembered authorizations also lives on the **Page Skills** page in this group
- Adjusting the assistant's behavior limits, permissions, appearance, and privacy → [Settings](#/docs/console-settings)

These five kinds of tasks correspond to the five chapters of this part; this chapter only walks you to the door.

## How to open it

**Web version**: the Console is a management page inside your website, and the site decides where the entry is — look near the chat for something like "Open Console" or "Settings". In the Demo, click **Settings** in the chat header to enter:

1. Click **Expand AI copilot** on the right edge of the page to open the chat drawer (skip if it's already open).
2. Click **Settings** in the chat header (the gear icon; hovering shows its name). The Console opens in the site's main area, landing on the Overview page.

![The Settings button in the Demo's chat header — click it to enter the Console](/docs-assets/console-tour/zh/S-console-tour-02-entry.png)

The entry isn't hidden in a menu: it's the gear at the far right of the chat header.

Two more shortcuts live inside the conversation: **View trace** on a message's action bar takes you to that run's detail page; **Go to review** on a candidate-skill card takes you to the review queue. What each is for: [Seeing What the Assistant Is Doing](#/docs/transparency) and [Governance and Review](#/docs/console-governance).

> **Extension only**: The Console is the extension's options page and opens in a browser tab. Clicking **Settings** or **Go to review** in the chat opens the options page and lands directly on the matching section; you can also get in without the chat — find the extension in the browser's extension management and open its "Options" page.

## What the six groups manage

The left sidebar is the Console's entire table of contents: six top-level groups; open a group to see its pages — 25 in total. The order here matches exactly what you see in the interface.

![Console overview: the six groups top to bottom in the left sidebar, page content on the right](/docs-assets/console-tour/zh/S-console-tour-01-shell.png)

The six groups in the sidebar correspond one-to-one with the table below.

| Group | What it manages | Pages | Details |
| --- | --- | --- | --- |
| Overview | Workspace health: run metrics, things needing attention, recent runs | 1 | This chapter |
| Skills | What's installed, editing skills, install & export, checking whether skill files were tampered with | 4 | [Skill Management](#/docs/console-skills) |
| Runs | Records and details of every run, sessions, and what the assistant remembers | 3 | [Run History](#/docs/console-runs) |
| Governance | Review before new skills enter the library, an unchangeable ledger of changes, version rollback, stability verification, usage statistics | 5 | [Governance and Review](#/docs/console-governance) |
| Connections | Which model to use, external tool services, tools and temporary skills offered by the current page | 4 | [Connections](#/docs/console-connections) |
| Settings | How long the assistant may run, what skill scripts may do, how generated interfaces look, quick prompts, trust, privacy, appearance, about | 8 | [Settings](#/docs/console-settings) |

![M-19 A map of the Console: six groups and all 25 pages](/docs-assets/console-tour/M-19.svg)

When you can't find a page, check this map first: every node is a page in the sidebar, and the names on the nodes match the interface.

Two wayfinding tricks:

- Which page you're on is written at the top of the page — every page opens with its name and a one-line "what this page is for".
- The sidebar can be collapsed entirely: click the collapse button at the top of the sidebar (hovering shows "Collapse settings") and the whole column hides while the main area widens; an expand button remains at the left edge of the page (hovering shows "Expand settings") — click it to bring the sidebar back. On narrow screens the sidebar becomes an overlay that retracts itself once you pick a page.

## The Overview page: health at a glance

**What it's for**: this is where you land when entering the Console. It answers two questions — how has the assistant been doing lately, and is there anything you need to deal with.

**What you can do here**:

- Read four metric cards: **Runs**, **Success rate**, **Average duration**, **Pending review** (the number of candidate skills waiting for your review).
- See the five most recent runs under **Recent runs**: each run's ID, status, skills used, and start time. Click **View runs** to see everything on the Run History page.
- Deal with what's under **Needs attention**: entries appear when candidate skills await your review or a recent run failed, and clicking an entry jumps straight to the page in question; when all is well it shows "Nothing needs attention."
- Under **LLM usage statistics**, view charts of API requests, tokens used, and spend by time range (Today, Last 7 days, This month, and so on); the chart can switch between requests and tokens.

![The Overview page: four metric cards, the recent-runs list, needs-attention and usage statistics](/docs-assets/console-tour/zh/S-console-tour-03-overview.png)

The metrics aggregate real runs; when no conversation has been run yet, Recent runs shows "No runs yet."

**Typical use**: if the assistant seems to be failing a lot lately, glance at this page first — how much the success rate dropped, whether Needs attention lists failed runs — then click the failed one to continue investigating on the Run History page; the next steps are in [Run History](#/docs/console-runs).

The page also has a **Wiring self-check** section: the three data sources the Console depends on (**Run traces**, **Governance facade**, **Connect facade**) each show **Wired** or **Not wired**. In the Demo all three are wired; seeing Not wired means your system hasn't connected that data source, the corresponding features will be empty, and you should talk to the system's provider.

## Jumping quickly

Too many pages to memorize? Use the command palette:

1. In the Console, press `⌘K` (Mac) or `Ctrl+K` (Windows) to open the **Command palette**.
2. Type a word from the page name or its purpose — Chinese and English both work: searching "审计" or "audit" hits the same page.
3. Select with the arrow keys and press Enter to go straight there. Every result is written as "group / page" with a purpose line; when nothing matches you'll see "No matches".

![The command palette: results filter as you type, each showing its group, page name, and purpose](/docs-assets/console-tour/zh/S-console-tour-04-palette.png)

The command palette does exactly one thing: get you to that page. What you do on the page is still up to you.

## Web version vs. extension version

The Console itself — the six groups, the 25 pages, the command palette — is the same in both forms. What differs is where it opens:

| | Web version | Extension version |
| --- | --- | --- |
| Where it opens | A management page inside your website | The extension's options page, in a browser tab |
| Direct entries from the chat | **Settings** in the chat header, **View trace** on a message, and **Go to review** on a candidate-skill card all land on the matching Console page | Clicking **Settings** or **Go to review** opens the options page and lands on the matching section (such as the LLM page or the review queue) |

![The extension version's Console: opened in a browser tab as the extension's options page](/docs-assets/console-tour/zh/S-console-tour-05-extension.png)

Different form, same content: a page you learned in one form sits in the same group in the other.

## When something goes wrong

**You can't find the Console entry.** On the web version the entry is arranged by your system: in the Demo, click **Settings** in the chat header; on other systems look for an entry like "Open Console", and if you can't find it, ask the system's provider. On the extension version, open its "Options" page from the browser's extension management.

**The command palette can't find the page you want.** It does contains-matching on page names and purposes, in Chinese and English alike — try another phrasing, like "审计" or "audit". Note that it only navigates; it can't perform the operations on the page for you.

**The left column is gone.** Most likely it was collapsed: click the expand button at the left edge of the page (hovering shows "Expand settings") to bring it back. On narrow screens the sidebar is an overlay by design and retracts itself once you pick a page.

**The Overview page has no data.** Check **Wiring self-check** first: a **Not wired** item means this deployment hasn't connected that data source — talk to your system's provider. If everything is **Wired** but **Recent runs** is empty, no conversation has been run yet — go chat once and come back.
