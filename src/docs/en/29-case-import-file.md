# Case: Importing a Document into the System

The requirements and acceptance criteria are already written in a Word file, and you don't want to type them into the system again — hand the file to the assistant and have it read them out and enter them one by one for you.

First, let's be clear about where this file goes: a docx is read into text in your own browser, and only the read-out body text is sent to the model — the original file is never sent out in whole. For more on where data goes, see [Privacy and Where Your Data Goes](#/docs/privacy).

![M-29 A file becomes records in the system: pick the file, [on your computer] read into text, the text goes to the assistant, it restates what it's about to enter, you confirm, it fills the form entry by entry, confirms before each submission, entry complete](/docs-assets/case-import-file/M-29.svg)

The "on your computer" box spells it out: the reading happens locally, and the original file isn't sent out in whole.

## Before you start

- Open the [Demo](/demo), select a project, and go to the requirement backlog.
- A requirement row with an attachment has a .docx link in it — click to download; it's a ready-made practice file.

## Step 1: Hand the document to the assistant

1. Drag the docx you just downloaded into the input field, or click **Attach a file** below the input field to pick it.
2. The chip's type label reads "Doc text", and you can remove it any time before sending.

![Dragging a docx into the input field, the attachment chip's type label showing "Doc text"](/docs-assets/case-import-file/zh/S-case-import-01-docx-chip.png)

Attached to the input field doesn't mean sent — it only counts once you click **Send**.

## Step 2: Say what to enter, verify first, then let go

1. Add your instruction, for example: `Following this document, create the requirements it lists in the backlog`
2. The assistant first restates what it read and which entries it's about to enter. **Verify it right here** — when a document's tables are complex or the formatting is fancy, the read-out content may be off, and fixing it now is easier than correcting entry by entry afterwards.

![The assistant restating what it read from the document, listing the entries it's about to enter](/docs-assets/case-import-file/zh/S-case-import-02-restate.png)

The restating step is there for you to verify. Sample run output — your actual output will differ.

## Step 3: Watch it enter them one by one

1. Multiple entries become a **Task list**; the progress number next to the title (like 3/7) tells you which entry it's on.
2. It fills in the fields one by one — this step doesn't interrupt you. But the same rule as in [Case: Filling Out a Form with One Sentence](#/docs/case-fill-form) applies: **it can fill out an entire form on its own, but before pressing "submit" it always stops and asks you.** Every entry pops an authorization card (titled **Authorization required**) — read the filled content before clicking **Allow**.
3. If an entry is filled wrong, fix it right on the page, then click Allow; if you don't want an entry, click **Deny** — only that entry isn't written, and the rest carry on as usual.

![The task list showing the progress of multiple entries, with in-progress and completed items](/docs-assets/case-import-file/zh/S-case-import-03-progress.png)

The progress number advances entry by entry. Sample run output — your actual output will differ.

![A requirement filled into the form, an authorization card popping up before submission](/docs-assets/case-import-file/zh/S-case-import-04-form-consent.png)

The form is filled and the authorization card stands in front of submission — every entry written into the system needs your nod. Sample run output — your actual output will differ.

![The requirement list after all entries are entered](/docs-assets/case-import-file/zh/S-case-import-05-list-done.png)

The entered entries really do appear in the list. Sample run output — your actual output will differ.

## Other phrasings that work

- `Add the acceptance criteria in this file to the current requirement, one by one`
- `Don't enter anything yet — first tell me what you read from this document` — read-only, recommended for first-timers
- You can also click the Demo's ready-made quick prompt: `Read the requirement documents with attachments in the list I am viewing, extract acceptance criteria, and list items present in the documents but missing from the tickets` — it reads the documents attached in the list directly, and only compares without entering.

## Web version vs. extension version

Both are the same: reading, verifying, entering, and the confirmation before submission behave alike.

## What this used

| Step | Chapter |
| --- | --- |
| Attaching a file and the local read | [Attachments, Images, Voice, and Camera](#/docs/attachments) |
| Progress on multiple entries | [Seeing What the Assistant Is Doing](#/docs/transparency) |
| Filling doesn't interrupt, submitting asks for confirmation | [Letting the Assistant Act on the Page](#/docs/page-actions) |
| The full "it fills, you approve" flow | [Case: Filling Out a Form with One Sentence](#/docs/case-fill-form) |
| Where the file goes | [Privacy and Where Your Data Goes](#/docs/privacy) |

## When something goes wrong

- **The document is long, and it acts like it didn't finish it.** Read-out text beyond 32K characters gets truncated. Send it in segments, or state up front which part you want — "only enter the acceptance criteria in chapter 3", for example.

![The notice shown when the text is truncated for exceeding the limit](/docs-assets/case-import-file/zh/S-case-import-06-truncated.png)

- **What it restates doesn't match the document.** Don't let it act; copying that passage straight to it is more reliable.
- **You've changed your mind about one of the entries.** Click **Deny** on that entry's authorization card — it isn't written into the system, and the other entries are unaffected.
