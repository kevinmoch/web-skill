# Artifacts: Dashboards, Documents, Slides, and Printing

After the assistant produces a report, a dashboard, or a slide deck — where to view it, how to save it locally, how to print it — this chapter covers it all.

## What you can do

- View report-type artifacts right in the conversation, with tables and charts unfolding in place.
- Click **Open document** to view documents, dashboards, and slides in a separate window — you're asked before the window opens.
- Download artifacts to your machine, for the record or to share.
- Print an artifact from the document window, or save it as a PDF.

## What the assistant can produce

An artifact is the finished product of a run: a report, a dashboard page, a document, a slide deck. Take the [Demo](/demo) (Agile Studio): its built-in skills produce four kinds (how to get the assistant to produce them: [Skills: Giving the Assistant Expertise](#/docs/skills-usage)):

| Artifact | Example in the Demo | Where it belongs |
| --- | --- | --- |
| Report | Sprint progress summary (`sprint-progress-report`) | Shown right in the conversation |
| Dashboard | Delivery monitoring dashboard (`agile-ops-screen`), deep-blue theme, good for casting | Presented in a new window |
| Document | Quality bulletin (`quality-bulletin`), laid out for A4 | Viewed in a new window, printed |
| Slides | Eight-page delivery quality analysis (`agile-slide-deck`) | Presented in a new window, exported to PDF |

For dashboards, documents, and slides, the Demo has a pair of skills each: a fixed-template "ready-made" one and an on-the-spot "made on the spot" one. When you ask for changes to a ready-made artifact, the assistant doesn't fine-tune the original — it switches to the made-on-the-spot one and builds a fresh version. [Skills: Giving the Assistant Expertise](#/docs/skills-usage) explains this in full; it isn't repeated here.

Once an artifact is ready, it can go four ways:

![The four destinations of an artifact: view in the conversation, present in a new window (needs your consent), download locally, print to PDF](/docs-assets/artifacts/M-17.svg)

Of the four destinations, only "present in a new window" needs your consent first; the other three are yours for the taking.

## Opening in the conversation

Report-type artifacts render right in the conversation: below the body text sit the tables, charts, and conclusions — no extra window needed. Among the Demo's built-in skills, only the report kind takes this path; once a dashboard, document, or slide deck is ready, it doesn't unfold in the conversation — instead you get an **Open document** button, inviting you to a separate window (the next section).

## Presenting in a new window

Artifacts like documents, dashboards, and slides are hard to see squeezed into the chat column, so the message carries an **Open document** button. Clicking it doesn't open the window directly — first a card titled **Confirmation** pops up, whose text reads:

`Skill “{skillName}” wants to open a document in a separate window. It carries data from “{dataSource}”. Continue?`

In the card, `{skillName}` is the name of the skill that wants to open the window, and `{dataSource}` is where the data in this artifact came from. The window only opens when you click **Confirm**; click **Cancel** and it doesn't open — the run continues with a "you didn't agree" outcome, without stalling, and certainly without quietly opening the window anyway. This wording comes from the Demo; your system's phrasing may differ, but the "ask before opening a window" step is always there.

![The "Confirmation" card before a window opens, stating which skill wants to open it and where the data comes from](/docs-assets/artifacts/zh/S-artifacts-02-open-confirm.png)

It always asks before opening a window, and the card says who's opening it and where the data comes from.

The window that opens is the system's own viewer page — the address bar shows this site's address. The window shows only this artifact: the artifact's own scripts don't execute, and there's no entry that jumps back to operate the page. Close the original conversation page and the window still works.

![A monitoring dashboard opened in a separate window](/docs-assets/artifacts/zh/S-artifacts-03-screen-window.png)

The dashboard fills the separate window; when casting, you can click "Hide toolbar" on the toolbar to tuck it away, and a small round button stays in the corner to bring it back anytime. Sample run output — your actual output will differ.

Slides in the window take presentation form: turn pages with the arrow keys, and the page number in the bottom-left corner shows which page you're on and how many there are.

![Slides being presented, with the page number in the bottom-left corner](/docs-assets/artifacts/zh/S-artifacts-04-slides-presenting.png)

Sample run output — your actual output will differ.

## Downloading to your machine

The built-in skills' dashboards, documents, and slides don't produce download cards — the finished product lives in the viewer window, and to keep a copy you use printing or save-as-PDF from the next section. To actually get a file, there are two paths:

**Files produced by a custom skill are downloaded in the conversation.** When a skill writes its product out as a file, the end of the message lists artifact cards: each card shows the file name, type, and size, with a **Download** button on the right. Clicking it saves the file into the browser's download folder — this step needs no authorization, since it's something you asked for.

![Artifact cards at the end of a message, with file name, type, size, and a download button](/docs-assets/artifacts/zh/S-artifacts-01-artifact-cards.png)

The picture shows an artifact card from a custom skill; the Demo's built-in skills don't use this kind of card.

**Every run's artifact files are downloaded in the Console.** All files a run produced — including the dashboard, document, and slide source files written by the built-in skills — stay in that run's details in the Console, where you can preview them or click **Download**. Copy the run ID and locate the run in [Run History](#/docs/console-runs).

Don't get the direction backwards: this chapter is about "things the assistant made being saved to your machine". The other direction — letting the assistant read files in your download folder — is a different matter, asks for your nod every time, and is only supported on the extension version. See [Let It Read the File You Just Downloaded (Extension Only)](#/docs/downloaded-files).

## Printing or saving as a PDF

The top-right corner of the document window has a **Print** button. Two verified guarantees:

- When slides print, each page's layout (padding, arrangement) is kept as the skill designed it — no text flush against the paper's edge.
- Dark slides don't lose their background when printed — a dark background doesn't come out as white paper.

Documents come laid out for A4. To save as a PDF, choose "Save as PDF" in the print dialog.

> **Tip**: To print slides, use the **Print** button inside the document window — it lays each page out as one sheet before invoking printing. Using the browser's print menu directly may print only the current page.

![The print preview of the slides, with layout and dark background preserved](/docs-assets/artifacts/zh/S-artifacts-05-print-preview.png)

In the print preview each page is one sheet, and the layout and background match what you see on screen.

## Web version vs. extension version

The four destinations are the same in both: view in the conversation, open a window after confirming, download, print — the confirmation card before window-opening is always there. The difference is how much data an artifact can hold: web-version artifacts only draw data from the system you're currently in; the extension version can read your other open tabs before producing, so artifacts that aggregate across sites can only be made there (see [Working Across Tabs (Extension Only)](#/docs/tabs)).

## When something goes wrong

**You clicked "Open document" and no window came out.** First check whether you clicked **Cancel** on the confirmation card just now — not opening the window is exactly the intended response; click **Open document** again and confirm. If the window still doesn't open after confirming, the browser most likely blocked the new window as a pop-up: allow pop-ups for this site, then click once more.

**The printed slides have only one page.** You probably used the browser's own print entry. Close the preview and use the **Print** button in the document window's top-right corner instead.

**You can't find the downloaded file.** Open the browser's download history and look for the newest entry by time; if it isn't there, copy the run ID and download this run's artifacts again from the run details of the Console's [Run History](#/docs/console-runs).

**The conversation shows "Unsupported result block".** The interface version and the artifact version don't match — you didn't do anything wrong. Send this message, together with what you saw, to the people who provide this system.
