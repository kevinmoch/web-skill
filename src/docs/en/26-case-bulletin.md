# Case: Producing a Printable Quality Bulletin

With one sentence, the assistant turns the current project's quality situation into a formal bulletin: issuing unit, tables, conclusion, and signature block all in place, laid out for A4, ready to print or save as a PDF. This chapter strings together skills, the artifact window, and printing into one complete task.

![From one sentence to a PDF: make the request → the assistant generates the bulletin → preview in the conversation → open the document → print or save as PDF; asking for changes goes back to "generate a fresh version"](/docs-assets/case-bulletin/M-26.svg)

## Before you start

- Open the [Demo](/demo) and select a project on the left — the bulletin draws on its data.
- Make sure you can see the assistant entry on the right edge of the page.

## Step 1: Make the request

Click the quality bulletin entry under "Try an example" on the welcome screen, or paste this into the input field:

```
Generate a printable quality bulletin for the current project with defect trends, test coverage and a release-readiness conclusion
```

This sentence sets no scope and states no requirements, so the assistant goes with a "ready-made" fixed-template skill: fast and steady, but not editable. The ready-made vs. made-on-the-spot trade-off is covered in [Skills: Giving the Assistant Expertise](#/docs/skills-usage) and isn't repeated here.

![A summary of the bulletin's key points appears in the conversation, with an "Open document" button](/docs-assets/case-bulletin/zh/S-case-bul-01-preview.png)

The assistant first gives a brief summary of the bulletin's key points, with an **Open document** button at the end. Sample run output — your actual output will differ.

## Step 2: Open the document to see the layout

Click **Open document**. Before the window opens, a **Confirmation** card pops up, stating who wants to open the window and where the data comes from; the window only opens when you click **Confirm** (see [Artifacts: Dashboards, Documents, Slides, and Printing](#/docs/artifacts)).

![The bulletin opened in a separate window, with letterhead, tables, and signature block complete](/docs-assets/case-bulletin/zh/S-case-bul-02-document.png)

It isn't a stretch of plain text but a fully laid-out bulletin: the red letterhead and issue number, the defect-grading table, the test-coverage table, the four DORA metrics, the release-readiness score and conclusion, and the signature block with seal. The layout the skill set (margins and such) is preserved when printing.

## Step 3: Print or save as a PDF

1. In the document window's top-right corner, click **Print** — use this button, not the browser menu's print.
2. Check the layout in the print preview.
3. Print directly; to save it as a file, choose "Save as PDF" as the print destination.

![The bulletin in the print preview, the A4 layout matching what's on screen](/docs-assets/case-bulletin/zh/S-case-bul-03-print-preview.png)

![The bulletin file after saving as a PDF](/docs-assets/case-bulletin/zh/S-case-bul-04-pdf.png)

## Step 4: Ask it for a revised version

The fixed template's scope is hard-wired: it pulls the entire project's full data, and not a word of the layout can be changed. To change something, just say so, for example:

```
Keep only this sprint's data, and turn the release-readiness section into a table
```

The assistant switches to a "made on the spot" skill, fetches the data again, and lays out a **fresh** version rather than fine-tuning the original — the skill badge changes its name along with it. Seeing it redo the whole thing doesn't mean it misunderstood you.

![The second version regenerated after asking for changes, its skill badge different from the first](/docs-assets/case-bulletin/zh/S-case-bul-05-second-version.png)

What saves a round is stating your requirements up front:

```
Generate a quality bulletin for the current sprint, with only the defect trends and test coverage sections, and the conclusion as a table
```

With the scope limited and the structure specified, the first attempt goes "made on the spot".

## Other phrasings that work

- "Produce a printable quality bulletin for the current project" — the shortest phrasing.
- "Can this project be released? Give me a formal bulletin with the data behind it" — a different way of asking, the same artifact.
- The step-4 sentence with scope and structure — a customized version from the start.

## What this used

| Step | Chapter |
| --- | --- |
| Setting a skill in motion with one sentence, recognizing the skill badge | [Skills: Giving the Assistant Expertise](#/docs/skills-usage) |
| Watching what the assistant does step by step | [Seeing What the Assistant Is Doing](#/docs/transparency) |
| The "Confirmation" card before the window opens | [Six Interaction Cards](#/docs/interactions) |
| Opening the document, printing, and saving as a PDF | [Artifacts: Dashboards, Documents, Slides, and Printing](#/docs/artifacts) |

## Web version vs. extension version

The flow is the same in both; the difference is the data scope: the web version only pulls data from the current system; on the extension version, a "made on the spot" skill can also read your other open tabs before aggregating (see [Working Across Tabs (Extension Only)](#/docs/tabs)).

## When something goes wrong

**You clicked "Open document" and no window came out.** First check whether you clicked **Cancel** on the confirmation card; if you confirmed and the window still didn't open, the browser most likely blocked the pop-up — allow it, then click once more.

**I only asked to change one spot, but it redid the whole document.** This is the fixed template's boundary, not a malfunction: the original can't be edited, so it switches to "made on the spot" and builds a fresh version. To save a round, limit the scope and state your requirements in the first sentence.

**The bulletin's data scope isn't what I wanted.** Ask vaguely and it pulls the entire project's full data; if you only want one sprint or one kind of defect, say the scope clearly in the first sentence.
