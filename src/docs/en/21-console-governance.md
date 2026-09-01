# Governance and Review

A skill isn't frozen once installed: where new skills come from, who approved them, where every change is recorded, how to roll back when a change goes wrong — the five pages under the Console's "Governance" group handle exactly these.

## What you can do

- Review skills awaiting approval: read the content word by word, then decide to publish or reject
- Look up "who changed what when" in the audit log — a record that can't be altered
- Roll a skill back to the last working version when a change breaks it
- Batch-run a skill through evaluation tasks to verify the change didn't break it
- See in Insights which skills are heavily used and which look like duplicates worth cleaning up

## Five pages forming one line

After you [save a successful process as a skill](#/docs/skills-usage) in a conversation, it doesn't take effect directly — it enters the **Review Queue** as a skill awaiting approval; only after you review and publish it does it enter the library. Every later edit, publish, and rollback goes into the **Audit Log**; when a change goes wrong you go back to an old version on the **Versions** page; **Evaluation** and **Insights** answer two other questions: is it still stable after the change, and what should be cleaned up.

![M-22 The gate a new skill passes to enter the library: a skill awaiting approval is published or rejected through the review queue, enters the library once published, every change is recorded in the audit log, and problems can be rolled back to an older version](/docs-assets/console-governance/M-22.svg)

The five pages sit under the **Governance** group in the Console's left navigation, and their top-to-bottom order is exactly this line: Review Queue, Audit Log, Versions, Evaluation, Insights.

### Review Queue

**What it's for**: before a skill awaiting approval enters the library, a human looks it over here — new skills don't slip in unannounced.

**What you can do here**:

- Filter queue entries by source and by status
- Open an entry's details and check its risk reasons and file contents word by word
- Click **Publish** to let it into the library, or **Reject** with a written reason
- Delete entries that are no longer needed

Each entry shows its name, status (draft / pending-review / approved / published / rejected), source, and risk (high / medium / low), and can be filtered by source and status. There are four sources: `generated`, `document`, `manual`, and `runtime-miss`; when the list is empty, the page spells out those four origins anyway.

A skill saved from a conversation comes in with the status **draft** — what the [save card](#/docs/skills-usage) calls "submitted for review" lands in the status column as draft. A draft has only two ways out: publish, or delete. Rejection is meant for entries in "pending-review" or "approved" — two states the normal flow never shows; they're left behind only when publishing errors out midway.

Reviewing an entry:

1. Under **Governance** → **Review Queue**, click **View details** on the entry.
2. Check the ID, source, risk, and creation time; high-risk ones list the reasons one by one (needing network access, writing outside the directory, and so on). Below is the complete content of every file in the skill — what's about to be published is read word by word here.
3. If it's fine, click **Publish**. One click completes the whole review procedure (for a draft, the submit and approve steps are filled in automatically), followed by the notice "Published {name} — installed, versioned and audited."
4. If not, click **Reject**: a rejection reason is required (the input box prompts "What has to change before this can be published?"), the button won't budge without one, and the reason stays on record. Rejecting only works on "pending-review" and "approved"; a **draft** can't be rejected — if you don't want it, click **Delete** in the list.

![The review queue list: every entry carries status, source, and risk badges](/docs-assets/console-governance/zh/S-console-gov-01-review-queue.png)

![The details list risk reasons and full file text one by one, with "Publish / Reject" at the bottom](/docs-assets/console-governance/zh/S-console-gov-06-review-actions.png)

Publishing takes effect immediately: the skill appears in the [library](#/docs/console-skills) and works in the conversation right away. When saving a skill from a conversation, the card's **Go to review** jumps straight to this page with that entry selected (the candidate ID can be copied); when the entry is no longer in the queue, the page states its possible whereabouts (approved, rejected, or removed) instead of leaving you to comb the list.

**Typical use**: having the assistant turn what it just did into a skill produces an entry that likewise waits here for your review — the full process is in [Case: Turning What You Just Did into a Skill](#/docs/case-skill-lifecycle).

### Audit Log

**What it's for**: who changed what when — an append-only ledger that can't be altered.

**What you can do here**:

- Filter events by type and by actor
- Expand any row to see the details of that change
- Click **Verify chain** to check whether the whole record has been tampered with

Installing, uninstalling, publishing, rolling back, quarantining, changing security and privacy policies, swapping model configurations… every action becomes a row: time, event, target, actor. The event column shows codes (like `skill.published`); the "Filter by type…" dropdown lists every event type with each entry spelled out, so there's no name-guessing. Click **View details** to expand a row's specifics.

![The audit log: every row is one change, filterable by type and actor](/docs-assets/console-governance/zh/S-console-gov-02-audit-log.png)

This record only grows. Click **Verify chain**: "Chain intact" means it's sound; when the chain breaks at some row, the page states the break point and the reason, the records before the break remain visible, and the notice carries a **Retry** entry.

**Typical use**: a skill is misbehaving — come here first to see who changed it recently and what was changed, then decide whether to roll back.

> **Note**: The log records "what happened", not sensitive content — a model-configuration change records only which items changed; keys never appear in the log. Skills' file contents aren't in the log either; for those, go to the Review Queue.

### Versions

**What it's for**: every version of every skill lives here, and a broken change can be rolled back.

**What you can do here**:

- See each skill's version history, and expand a version to see which files it contains
- Roll back to any old version whose archive is still kept
- Check skill states and deal with automatically quarantined skills

Every edit, publish, and rollback appends a version entry with its time, reason, and size; click **View archive** to see which files that version contains. The page states the retention policy: the latest 5 versions per skill are kept. When a built-in system skill has no version records, the page says so explicitly instead of showing a blank.

Rolling back to a previous version:

1. Under **Governance** → **Versions**, select the skill, find the version you want in the version list, and click **Rollback**.
2. A dialog confirms once more: the old version's files must pass verification before anything happens, and any failure fully restores the current files.
3. After "Rolled back to {versionId}." appears, go back to the conversation and use the skill once more — it behaves like the old version, not just a changed version number.

![Rollback has a second confirmation and spells out the verification and restore behavior](/docs-assets/console-governance/zh/S-console-gov-07-rollback.png)

![The Versions page: version history and skill states on the same page](/docs-assets/console-governance/zh/S-console-gov-03-versions.png)

Below on the same page is **Skill states**: a skill whose consecutive failures reach the threshold (5 by default, stated on the page) is quarantined automatically (state quarantined), and the assistant stops calling it. The quarantine reason is shown directly — "consecutive failed runs" and "integrity verification failed" (the files were modified) are told apart; calls blocked by safety policy don't count as failures. Click **Diagnose** to have the assistant analyze the latest failure and propose a repair plan — click **Apply** on whichever suggestion you accept; you can also switch it back to active in the state dropdown. Quarantine isn't lifted automatically just because one run happens to succeed.

At the bottom of the page is the **Runtime miss hook** switch: when it's on, and the assistant runs into something no skill can do, it automatically drafts a skill awaiting approval into the review queue — that's where entries with the source `runtime-miss` come from.

**Typical use**: an upgraded skill works worse than the old version — select it and click **Rollback** on the old version to go back.

### Evaluation

**What it's for**: after changing a skill, if you're not confident, run a set of tasks in batch and see whether the results hold steady.

**What you can do here**:

- Add and delete evaluation tasks
- Click **Run all** to run the whole set and see the pass rate and per-task conclusions
- Turn a failed run into a long-term regression task

Each task has three fields: `Prompt` (one instruction), expected substring (optional), and skills (optional, comma-separated). Click **Run all** to run the whole set; the button shows progress (Running {done}/{total}…). A report comes out afterwards: pass rate, average score, and per-task conclusions; failed ones show the gap between expected and actual, and you can click through to that run's details.

![The Evaluation page: task list, "Run all", and the latest report; the report content is an example from a real run — your actual results will differ](/docs-assets/console-governance/zh/S-console-gov-04-evaluation.png)

**Regression suggestions** are genuinely handy: copy a failed run's ID from [Run History](#/docs/console-runs), paste it into the input box, and click **Suggest & add** — it generates a new task modeled on that failure, watching that pitfall for you in every future evaluation.

**Typical use**: after changing a skill, rerun its handful of related tasks; if the pass rate didn't drop, use it with confidence.

> **Note**: "Run all" really calls the model to run the skills, so a working model must be configured first; without one the button is greyed out, with an explanation on the page. Configuring a model: [Connections](#/docs/console-connections).

### Insights

**What it's for**: which skills are heavily used, which suspected duplicates can be cleaned up — this page gives you a health report.

**What you can do here**:

- See each skill's scorecard and improvement suggestions
- Spot suspected-duplicate skill pairs and consider merging them
- Find skills that have never been used in the usage statistics

**Skill scores**: one scorecard per skill — a composite score plus four dimension bars (success / usage / eval / risk), with a suggestion (keep / improve / merge / deprecate / quarantine). The page notes "Scoped to managed skills only": only skills that went through the install flow and left install records are scored; built-in system skills have no install records, so the risk dimension has nothing to read and they don't take part — the reason is written on the page too.

**Possible duplicates**: skill pairs whose names and descriptions overlap heavily are listed together, with their similarity, and a suggestion to merge the two into one.

**Dependency graph**: click a node to see "who would be affected if it were removed"; when nothing depends on it, that too is stated. Look here before deleting a skill.

**Usage statistics**: each skill's activation, success, and failure counts, charted in success and failure series.

![The Insights page: scorecards, possible duplicates, the dependency graph, and usage statistics](/docs-assets/console-governance/zh/S-console-gov-05-insights.png)

## Web version vs. extension version

The five pages themselves are the same in both: the same review, audit, versions, evaluation, and insights. The only difference is the entry — on the web version you enter from a management page inside your website (in the Demo, click **Settings** in the chat header); on the extension version it's the extension's options page, which can land directly on a specific section when opened. Each side manages its own library and records. Entry details: [A Tour of the Console](#/docs/console-tour).

## When something goes wrong

**You clicked "Go to review", but the page says the entry is gone.** It may have been approved, rejected, or removed, and the page states the possible whereabouts. First check the [library](#/docs/console-skills) to see whether it's already usable.

**"Run all" is greyed out.** Batch evaluation really calls the model, and you haven't configured a working one yet. Configure one under **Connections** → **LLM** — see [Connections](#/docs/console-connections).

**The version you want won't let you click "Rollback".** The page states "No archive kept for this version, so it cannot be restored." — that version's files weren't kept, so there's no going back. Only the latest 5 versions per skill are kept; don't sit on an important version for too long before deciding.

**A skill suddenly can't be called.** Most likely it was quarantined automatically after consecutive failures. Check the state and quarantine reason lower on the **Versions** page, and click **Diagnose** for repair suggestions; once you're sure it's fine, switch it back to active in the state dropdown. If it's only tool calls showing "Blocked by policy", those don't count as failures and won't cause quarantine — that's a permissions matter; see [Settings](#/docs/console-settings).

**The audit log says the chain is broken.** The record file was altered or is damaged. Records before the break point are still trustworthy and still shown; click **Retry** in the notice to query again, then **Verify chain** once more to confirm the position. Events after the break point are no longer shown, because they can no longer be authenticated.
