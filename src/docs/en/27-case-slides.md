# Case: Building and Presenting a Slide Deck

With one sentence, the assistant turns project data into a slide deck: presented in a new window, paged with the arrow keys, exportable to PDF. This chapter strings together skills, the window-opening confirmation, and print-to-export into one complete task.

## Before you start

Open the [Demo](/demo) and make sure you can see the assistant entry on the right edge of the page — everything happens in the conversation.

## Step 1: Make the request

This sentence comes verbatim from the "Try an example" quick prompts on the Demo's welcome screen; click it or send it to the assistant directly:

```
Turn delivery quality across all projects into a slide deck, present it in a new window with page navigation and PDF export
```

It sets no scope and states no pagination requirements, so it goes with the "ready-made" slides skill: a fixed eight pages, a cross-project analysis of the three demo projects — the fastest and steadiest. From this sentence to the presentation, it passes through these stages:

![How a slide deck is produced and presented: the request → the assistant generates the deck → asks to open a window → you agree → presentation in a new window → turn pages or export to PDF; asking to add or remove pages regenerates a fresh version](/docs-assets/case-slides/en/M-27.svg)

"You agree" is a required stage: without your nod, the window doesn't open.

## Step 2: Agree to open the window

Once the deck is ready, an **Open document** button appears in the message. Clicking it doesn't open the window directly — first a card titled **Confirmation** pops up, whose text reads:

`Skill “{skillName}” wants to open a document in a separate window. It carries data from “{dataSource}”. Continue?`

In the card, `{skillName}` is the name of the skill that wants to open the window, and `{dataSource}` is where the data in the deck came from. The window only opens when you click **Confirm**; click **Cancel** and it doesn't open — the run continues with a "you didn't agree" outcome, the assistant explains the window couldn't be opened, nothing stalls, and the window certainly isn't opened quietly anyway.

![The "Confirmation" card before the window opens, stating which skill wants to open it and where the data comes from](/docs-assets/case-slides/en/S-case-slides-01-open-confirm.png)

It always asks before opening a window, and the card says who's opening it and where the data comes from.

## Step 3: Present and export to PDF

Once the new window opens, it's in presentation form:

- Turn pages with the keyboard's arrow keys; the page number in the bottom-left corner shows which page you're on and how many there are.
- When casting, click "Hide toolbar" to tuck the toolbar away; a small round button stays in the corner to bring it back.
- Click the **Print** button in the window's top-right corner: it lays each page out as one sheet before invoking printing; choose "Save as PDF" in the print dialog to export. Dark slides don't lose their background when printed — a dark background doesn't come out as white paper.
- To exit, just close the window; the conversation is still there, and clicking **Open document** once more restarts the presentation.

![The cover page of the eight-page deck being presented in a separate window, with the page number in the bottom-left corner](/docs-assets/case-slides/en/S-case-slides-02-deck-cover.png)

The cover page: an overview of the three projects' health scores. Sample run output — your actual output will differ.

![Turning to the next page, the page number in the bottom-left corner changes along](/docs-assets/case-slides/en/S-case-slides-03-page-turn.png)

Turn pages with the arrow keys; eight pages in total.

![The exported PDF, one sheet per page, the dark background preserved](/docs-assets/case-slides/en/S-case-slides-04-exported-pdf.png)

The layout and background in the PDF match what you see on screen.

## Other phrasings, with the page count up to you

Slides are the artifacts where the "ready-made / made on the spot" difference shows most clearly (an artifact is the finished product of a run). The ready-made `agile-slide-deck` has its page count, page order, and content all hard-wired — those same eight pages; the made-on-the-spot `authored-slides` has its page count decided by the content — you specify what to cover and how many pages, and after it's done you can still ask to add or remove pages. For the one-sentence trade-off and decision logic, see [Skills: Giving the Assistant Expertise](#/docs/skills-usage). Three phrasings side by side:

- "Turn delivery quality across all projects into a slide deck" → a fixed eight pages, the fastest.
- "Cover only the current sprint, in three pages: progress, risks, next steps" → made on the spot, paged as you said.
- "The deck is done — add a page of defect details after the risks" → made on the spot, a regenerated version.

Mind the third one: asking for changes to a ready-made deck, the assistant doesn't fine-tune the original — it switches to the made-on-the-spot skill, fetches the data again, and produces a fresh copy. It didn't misunderstand you; a fixed template genuinely can't be edited.

![A version generated to the "three pages" requirement, its page count different from the fixed eight](/docs-assets/case-slides/en/S-case-slides-05-authored-three-pages.png)

In the same session, asked vaguely first and then with a page split — the two versions' skill badges and page counts both differ. Sample run output — your actual output will differ.

## What this used

| Step                                                                                  | Chapter                                                                    |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Setting a skill in motion with one sentence, telling ready-made from made on the spot | [Skills: Giving the Assistant Expertise](#/docs/skills-usage)              |
| The window-opening confirmation, presenting, printing, and exporting to PDF           | [Artifacts: Dashboards, Documents, Slides, and Printing](#/docs/artifacts) |
| Seeing clearly what the assistant does at each step                                   | [Seeing What the Assistant Is Doing](#/docs/transparency)                  |

## Web version vs. extension version

Both are the same: the confirmation card, presenting, page-turning, and PDF export all work alike. The only difference is the data scope: the web version only pulls data from the current system; the extension version can read your other open tabs before producing the deck, so slides that aggregate across sites can only be made there (see [Working Across Tabs (Extension Only)](#/docs/tabs)).

## When something goes wrong

**You clicked "Open document" and no window came out.** First check whether you clicked **Cancel** on the confirmation card — not opening the window is exactly the intended response; click once more and confirm. If the window still doesn't open after confirming, the browser most likely blocked the new window as a pop-up: allow pop-ups for this site, then click once more.

**The printout has only one page.** You probably used the browser's own print entry. Close the preview and use the **Print** button in the document window's top-right corner instead — it lays each page out as one sheet before printing.

**You asked for a change, but it redid the whole deck.** Normal behavior: a fixed template can't be edited, so it switched to made on the spot and produced a fresh version. To save a round, state "what to cover and how many pages" clearly in the first sentence.
