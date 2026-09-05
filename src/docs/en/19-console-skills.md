# Skill Management

A skill is a packaged bundle of "instructions for doing something + scripts"; once installed, the assistant knows how to do that thing. Everything after installation belongs to this chapter: where it came from, whether it's been used lately, editing its content, and whether its files have been touched. The four pages in the Console's "Skills" group map to exactly these four concerns.

## What you can do

- See every installed skill in the Library: source, version, when it was last used
- View and edit skill files in the Editor, with automatic validation on save that tells you right away when something's wrong
- Install new skills from an archive, a URL, or a folder — nothing is written before you confirm the preview
- Package skills for others; uninstall the ones you no longer need
- Verify a skill file by file to confirm it's still what you installed

## Where skills come from and where they go

![Where a skill comes from and where it goes: preinstalled, archives, URLs, folders, and temporary page-provided skills enter the library via installation (possibly after review), get used by conversations, and can be exported](/docs-assets/console-skills/en/M-20.svg)

Skills have several sources: preinstalled by the system (the Demo's 13 built-in skills), installed by you from an archive, URL, or folder, and provided temporarily by a page. The first two kinds land in the Library once installed, work in conversations, and can be exported; page-provided temporary skills never enter the Library and vanish when you leave the page — see [Connections](#/docs/console-connections). One exception: skills the assistant generates or edits for you don't go straight into the library — they first become skills awaiting approval in the review queue, and take effect only after review and publishing; see [Governance and Review](#/docs/console-governance). What each of the 13 built-in skills does: [Skills: Giving the Assistant Expertise](#/docs/skills-usage).

## The four pages

### Library

**What it's for**: which skills are installed, where each came from, and when it last came in handy.

**What you can do here**:

- Type a keyword in the filter box to match name and description at once — type "slides" and both slide-making skills appear
- Read each row's badges: "Source" tells you where it came from; "Managed" means a package manager looks after it — only managed skills can be uninstalled, renamed, and verified file by file
- Scan the "Last used" column — skills untouched for a long time stand out at a glance
- Click a skill name to open the Editor; the row-end menu has "Open in Editor" and "Export", and managed skills additionally have "Verify integrity", "Rename", and "Uninstall"
- Click "Model context" to see the skill list exactly as the assistant sees it — it matches this page, so when the assistant "doesn't know" a skill, check here first

![The Library showing all 13 of the Demo's built-in skills on one page, with source, contents, and last used](/docs-assets/console-skills/en/S-console-skills-01-library.png)

**Typical use**: wondering "what's the dashboard skill called, and when was it last used" — type `screen` in the filter box and a pair of skills shows up: one ready-made, one made on the spot. Which one runs is the assistant's call based on your words; the difference is in [Skills: Giving the Assistant Expertise](#/docs/skills-usage).

### Editor

**What it's for**: viewing and editing the files inside a skill. Saving validates automatically; mistakes are listed on the spot, and the file can't be saved until they're fixed.

**What you can do here**:

- Pick a skill and a file in the file tree on the left; pick a folder and the right side shows its file list and the new-entry buttons
- Create and delete files and folders; deletion asks for confirmation, and deleting a key file like SKILL.md is blocked with an explanation
- After editing, click "Save & validate": on success it shows "Saved & validated"; on failure the "Validation issues" are listed below — fix them one by one and save again

A skill's main file is SKILL.md, and its content is an instruction sheet: when to use it, what inputs it needs, how many steps. Take the built-in skill `sprint-weekly-brief`:

```markdown
---
name: sprint-weekly-brief
description: 用周报模板输出当前迭代的进展简报——结构固定，数据自动填充。
---

## 何时使用

当用户要求迭代周报、迭代小结，或当前迭代的结构化进展汇报时使用。
```

![The Editor: the skill's file tree on the left, the SKILL.md content on the right](/docs-assets/console-skills/en/S-console-skills-02-editor.png)

![Validation failed on save: the "Validation issues" are listed one by one, and the file can't be saved until they're fixed](/docs-assets/console-skills/en/S-console-skills-05-save-validation.png)

Sections like "## 何时使用" ("when to use it") are the basis on which the assistant picks skills. If you don't want to edit by hand, hand it to the assistant: a skill it edits becomes a skill awaiting approval — reviewed before use. The full process: [Case: Turning What You Just Did into a Skill](#/docs/case-skill-lifecycle).

### Install & Export

**What it's for**: bringing in skills from outside, or packaging your own skills for others.

There are three install sources — pick one:

1. **Archive URL**: paste the archive's URL. By default only https is accepted and private-network addresses are refused; this limit is adjusted under Settings › Sandbox & Security — see [Settings](#/docs/console-settings).
2. **Local .zip file**: drag the archive in, or click "Choose a zip".
3. **Skill folder upload**: pick a folder and the browser packs it for you.

![The three install sources: URL, local archive, folder](/docs-assets/console-skills/en/S-console-skills-06-install-sources.png)

Whichever the source, clicking "Preview & install" first produces an "Install preview": which files the archive contains and how many "Pre-install checks" passed, listed item by item. Nothing is written before you confirm the preview; if any pre-install check fails, the "Install" button is greyed out; a file that isn't even a valid archive never reaches the preview at all.

![The install preview: archive contents and pre-install checks listed item by item](/docs-assets/console-skills/en/S-console-skills-03-transfer-preview.png)

> **Note**: Installing a skill means bringing in someone else's scripts to run. A signature is the author's seal on the package, proving it wasn't swapped in transit; when the preview shows the warning "Archive is not signed. Install it only if you trust its source.", confirm you trust where it came from before checking the box to continue. Whether unsigned skills are allowed, warned about, or refused, and which signers are trusted, are managed under Settings › Trust & Signing — see [Settings](#/docs/console-settings).

Installing a skill under an existing name is a supported upgrade flow: the preview warns that a skill with the same name exists and will be overwritten; the old version stays in the version history and can be rolled back — see [Governance and Review](#/docs/console-governance).

The "Installed skills" list below lets you "Export" or "Uninstall" one by one, or select several and click "Export skill pack" to bundle them into a single archive for distribution. Exporting is a plain browser download; uninstalling asks for a second confirmation and cannot be undone once confirmed.

**Typical use**: a colleague sends you a skill archive — drag it in, see all the pre-install checks pass, click Install. It then appears in the Library and works in conversations right away.

### Integrity & Manifest

**What it's for**: answering one question — is the skill I installed still the one I installed?

**What you can do here**:

- Select a skill and it's verified file by file automatically, summarized as "{verified} files verified · {mismatches} modified · {missing} missing · {extras} extra"; if the result looks wrong, click "Re-verify" to check again
- Each file's result is one of four: Verified, Modified, Missing, Not in manifest
- See the signature status: "Signed and verified", "Not signed", "Verification failed" — signed skills also show the signer and the signing time
- Browse the "Install ledger": when each skill was installed and from where

![Integrity & Manifest: per-file verification results and the install ledger](/docs-assets/console-skills/en/S-console-skills-04-integrity.png)

When to come here: a skill suddenly misbehaves, or you recently installed one from a source you don't know well. Two rules to set your mind at ease:

- Edits you make in the Editor don't count as anomalies — saving updates the records in step, and re-verification still passes across the board. Only touching files outside the Editor gets reported as "Modified".
- A skill that fails verification is quarantined: it won't be matched or executed, and this page shows "Quarantined" with the reason and the time.

## Web version vs. extension version

The four pages work the same in both: the same Library, Editor, install, and verification. The only difference is how the Console opens — on the web version you enter from a management page inside your website (in the Demo, click "Settings" in the chat header); on the extension version it's the extension's options page. Details: [A Tour of the Console](#/docs/console-tour).

## When something goes wrong

**The "Install" button is greyed out.** Go through the "Pre-install checks" in the install preview one by one: not a valid archive, incomplete SKILL.md content, or a trust policy that doesn't allow unsigned skills — all block at this step. For the first two, get a sound package; for signature-related ones, adjust under Settings › Trust & Signing — see [Settings](#/docs/console-settings).

**Installed, but the conversation can't reach it.** First confirm it's in the Library; then check the "Dependency cycles" and "Missing dependencies" sections on the Integrity & Manifest page — what's listed there are skills excluded from the catalog: a dependency isn't installed, or the dependencies loop back in a circle. The assistant can't see them, they don't appear in the Library, and this page is the only place they show up. Install the missing dependency or untangle the cycle, and they're back.

**Verification reports "Modified" — did someone touch it?** First recall whether you or a colleague touched its files outside the Editor — edits made in the Editor don't count. If it wasn't you, uninstall the skill and reinstall it from a source you trust.

**Can't save — the save button does nothing.** Saving validates: mistakes are listed one by one under "Validation issues", and only a clean file saves. Deleting a key file like SKILL.md is likewise blocked with a reason — that's keeping the skill from being crippled, not a malfunction.
