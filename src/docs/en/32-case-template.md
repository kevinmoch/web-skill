# Case: Producing Files from Your Own Template

Quotation sheets, handover forms, contract review forms — you already have these on hand, and their format is fixed: merged cells, column widths, borders, clauses, signature lines. What this chapter does: hand your template to the assistant, say what to fill in, and it produces a new file following that template — only the data changes; the format stays as-is.

## What you can do

- Hand it an Excel or Word template you already have, have it fill in the data, and get a new file out
- When detail rows run short, it inserts rows automatically, copying the style and row height of the row above
- Have it place images into designated cells (like the photo area reserved in a handover form)
- Store the template in a skill and reuse it by name later — no re-uploading every time

It follows three rules with templates — the things most worth remembering in this chapter:

1. **Formula cells are never overwritten.** It fills the data cells and lets the template do the sums itself, so the totals are already computed when you open the file.
2. **Plain numbers are stored as numbers, correctly.** They don't turn into text — otherwise summing the amounts would be ruined.
3. **A wrong address errors on the spot.** Point it at a cell that doesn't exist and it tells you where the mistake is, instead of quietly writing to the wrong place.

## Prepare a template

You don't have to adapt the template for it, and you don't need to plant placeholders — it fills by cell address ("put the customer name in B3", that kind of thing). What kinds of files can serve as templates:

- Excel (.xlsx) and Word (.docx) both work;
- an xlsx saved by WPS works too;
- a macro-enabled template (xlsm) can be used to produce files, but the new file it produces carries no macros — it opens normally. That's by design, not a macro that got lost.

> **Extension only**: An online document you have open in WPS can serve as a template too. It only reads the original and produces a new file — it never writes back to your online document; when it can't get the original, it says so plainly and tells you to download the original in WPS and upload it. For the read-only terms on online documents, see [Letting the Assistant Read the Page](#/docs/page-perception).

## Upload the template and say what to fill

1. Drag the template file into the input field, or click **Attach a file** to pick it.
2. Add what you want filled in, for example: `Following this quotation template, make a quote: Customer A, 10 units of Product A and 5 units of Product B, with the on-site photos placed in the reserved photo area`.

![The template file attached to the input field, the attachment chip showing its name and type clearly](/docs-assets/case-template/en/S-case-tpl-01-upload.png)

![The request naming what to fill, and the run](/docs-assets/case-template/en/S-case-tpl-02-prompt.png)

Sample run output — your actual output will differ.

## Check the new file it produced

The produced file isn't previewed in the conversation, and no window opens — at the end of the conversation an artifact card appears, showing the file name, type, and size, with a **Download** button. Not previewing is deliberate: the new file is your template changed over as-is, the layout is whatever you see when you open it, and a collapsed preview standing in would only mislead.

![The produced-file card at the end of the conversation, with file name, type, size, and a download button](/docs-assets/case-template/en/S-case-tpl-03-result.png)

Sample run output — your actual output will differ.

After downloading, open it with Excel, Word, or WPS, and check three places: the merged cells and column widths match the template; the formula cells weren't written over with dead numbers, so the totals are right on opening; and the inserted detail rows carry the style of the row above.

![The opened new file: the layout matches the template, formula cells not overwritten](/docs-assets/case-template/en/S-case-tpl-04-opened.png)

Sample run output — your actual output will differ.

## Store the template in a skill for later reuse

A form you produce every week doesn't need the template re-uploaded every week. When you save this conversation as a skill (for the full flow, see [Case: Turning What You Just Did into a Skill](#/docs/case-skill-lifecycle)), the template file uploaded in this session can be packed into the skill package as-is. The review page lists the file's path, size, and source — its content is not shown as text. That isn't garbled output; it's deliberate: what the review needs to see is "what the package carries", not the content of the sheet.

![The review screen of a skill carrying a template file; this kind of file is not shown as text](/docs-assets/case-template/en/S-case-tpl-05-skill-assets.png)

Afterwards, just name the template in the skill: `Use the quotation template in the skill to make a quote for Customer B` — no re-upload needed; if you upload a fresh template in this session, it uses the fresh one. You can also upload a template into a skill by hand in the Console's skill editor (see [Skill Management](#/docs/console-skills)); opening this kind of file in the editor shows only its name, size, and type, with no save entry — it can't be edited, so it can't be broken by editing.

## Web version vs. extension version

The upload-template-and-produce-a-file path is primarily the extension version's; whether the web version can do it depends on whether the system you're in has wired this capability — check "Wired capabilities" on the Console's **About & Diagnostics** page. Using an online WPS document as a template is extension-only. Storing templates in skills, review, and editor upload are the same in both.

## What this used

| Step | Chapter |
| --- | --- |
| Attaching the template to the input field | [Attachments, Images, Voice, and Camera](#/docs/attachments) |
| The artifact card and downloading | [Artifacts: Dashboards, Documents, Slides, and Printing](#/docs/artifacts) |
| Saving as a skill, review and publish | [Case: Turning What You Just Did into a Skill](#/docs/case-skill-lifecycle) |
| Uploading a template file in the editor | [Skill Management](#/docs/console-skills) |
