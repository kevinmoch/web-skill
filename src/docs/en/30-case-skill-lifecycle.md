# Case: Turning What You Just Did into a Skill

Once you've walked the assistant through getting something done, you can save that process as a skill: after review and publishing, one sentence reruns it next time; if you're not happy with it in use, you can change it again or roll it back to an old version. This chapter walks a skill's whole life through in one continuous sequence of operations.

## Before you start

- Open the [Demo](/demo), pick any project on the left, then switch to the **Bugs** screen — the quick prompt this chapter uses only appears on this screen
- Make sure you can see the assistant entry on the right edge of the page
- Make sure "Skill generation" is on: Console → **Settings** → **Agent Runtime**. It's on by default in the Demo and off by default out of the box; when it's off, the entry in step 1 doesn't appear — see [Settings](#/docs/console-settings)

A skill's life isn't a straight line — it's a loop:

![M-30 The life of a skill: a conversation saved as a skill enters the review queue after you confirm the preview; once approved and published it can be called; find something to change, change it, and the change takes effect; unhappy, roll back to the previous version and return to "ready to use" to continue the loop](/docs-assets/case-skill-lifecycle/en/M-30.svg)

After a rollback the skill stays in the library and keeps being used, which is why the diagram ends with a return line back to "ready to use".

## Step 1: Save this conversation as a skill

The Demo's welcome screen has a ready-made quick prompt under "Try an example" — use it as-is:

`List the current project’s bugs, then read its DORA metrics, and turn the "query bugs + read DORA" flow into a reusable skill`

It first has the assistant actually do the thing once — list the bugs, read the DORA metrics — and then triggers "save as skill". The assistant pops up a confirmation card whose text reads `Save this conversation as the skill "{name}"?`, and below it: **It will be submitted for review, not activated. Please check the preview below for anything that must not be stored.**

That responsibility note is written for you: the conversation may contain things that shouldn't be kept long-term — specific people's names, internal numbers, one-off passwords. Confirm word by word that there's nothing, then click save.

![The "save as skill" confirmation card, with a full preview of the skill content to be saved](/docs-assets/case-skill-lifecycle/en/S-case-life-01-save-confirm.png)

After saving, the notice reads: `"{name}" was submitted for review. It cannot be used until a reviewer approves and publishes it.` — saved doesn't mean usable; it enters the review queue. The card shows a candidate ID: click **Copy candidate ID** to copy it, or click **Go to review** to jump straight to the review queue.

![The "submitted for review" notice after submitting, with the candidate ID and the "Go to review" entry](/docs-assets/case-skill-lifecycle/en/S-case-life-02-candidate-submitted.png)

> **Note**: When this conversation's task list contains "Delegated to …" items, the save may fail — delegated steps don't count as steps performed in this conversation. What to do: don't let it delegate; redo the key steps yourself, then save. For the reason, see [Seeing What the Assistant Is Doing](#/docs/transparency).

## Step 2: Approve and publish

Click **Go to review** to land right in the review queue with that entry selected.

1. Click **View details** — below it is the complete content of every file of this skill; what's about to be published is right here to read word by word.
2. If everything looks right, click **Publish**. One click completes the whole review procedure, followed by the notice "Published … — installed, versioned and audited."

![The skill awaiting approval in the review queue, with each file's full text listed in the details](/docs-assets/case-skill-lifecycle/en/S-case-life-03-review-queue.png)

Publishing takes effect immediately: the skill appears in the library and is usable back in the conversation.

![Published successfully, the notice stating it was installed, versioned and audited](/docs-assets/case-skill-lifecycle/en/S-case-life-04-published.png)

For the full rules on rejecting, filtering, and so on, see [Governance and Review](#/docs/console-governance).

## Step 3: Run it once with the new skill

Back in the conversation, send a natural-language sentence, for example `Show me the current project's bug list and DORA metrics`. The **Skill** badge on the assistant's message shows exactly the one you just published — the first half of the loop is closed: the saved skill really is usable.

![Running once with the new skill, the skill badge on the message is exactly it](/docs-assets/case-skill-lifecycle/en/S-case-life-05-run-with-skill.png)

Sample run output — your actual output will differ.

## Step 4: Change this skill

After using it for a while you may want changes — say, having it write the metric interpretation in more detail. Two ways to change it:

- **Change it yourself**: Console → **Library** → click the skill name to enter the **Editor**; when you're done, click **Save & validate** — once saved, it takes effect.
- **Have the assistant change it**: say clearly in the conversation what to change; the change then enters the review queue and waits for your approval — changes never take effect without a heads-up.

![Editing this skill in the Editor, with validation results given on save](/docs-assets/case-skill-lifecycle/en/S-case-life-06-editor-save.png)

For an item-by-item explanation of "Validation issues", see [Skill Management](#/docs/console-skills); for how review works, see [Governance and Review](#/docs/console-governance).

## Step 5: Run it once more with the changed skill

Send the same sentence again, and the change shows in the result — the second half of the loop closes too: the change really took effect, not just a file that got edited.

![Running once with the changed skill, the result reflecting the change just made](/docs-assets/case-skill-lifecycle/en/S-case-life-07-run-after-edit.png)

Sample run output — your actual output will differ.

## Step 6: Not happy? Roll back

If the changed version works worse than the old one, you can go back: Console → **Governance** → **Versions**, select this skill, find the version you want and click **Rollback**; after confirming you'll see "Rolled back to …". Use it once more in the conversation and the behavior is the old version's — not just a version number that changed. Each skill keeps only its latest 5 versions; for the second-confirmation and failure-recovery details, see [Governance and Review](#/docs/console-governance).

![Rolling back to the previous version on the Versions page, with a second confirmation](/docs-assets/case-skill-lifecycle/en/S-case-life-08-rollback.png)

A rollback isn't the end — the skill keeps being used, changed, and leaving new version records behind; that's exactly one turn of the loop in the diagram.

## Other phrasings that work

"Save as skill" doesn't rely on a fixed incantation — phrase the same intent differently and the same confirmation card comes up:

- `Save the process we just did, so I can use it directly later`
- `I'll be running this query every week — make it a skill`

There's only one key: make "keep what was done this time, so it can be rerun" clear.

## What this used

| Step | Chapter |
| --- | --- |
| The four things about saving a skill: shown to you first, checked by you, usable only after review, jumpable | [Skills: Giving the Assistant Expertise](#/docs/skills-usage) |
| The effect of "Delegated to" items in the task list | [Seeing What the Assistant Is Doing](#/docs/transparency) |
| The library, the Editor, save-as-validate | [Skill Management](#/docs/console-skills) |
| The review queue, publishing taking effect, versions and rollback | [Governance and Review](#/docs/console-governance) |
| The "Skill generation" toggle | [Settings](#/docs/console-settings) |

## Web version vs. extension version

The whole flow is the same in both: save, review, use, change, roll back — no version difference. The only difference is the Console entry: on the web version you enter from the admin page inside your website (in the Demo, click **Settings** in the chat header); on the extension version, from the extension's options page. Each side keeps its own library and review records.

## When something goes wrong

**You clicked "Go to review" but it says the entry is no longer there.** It may already have been approved, rejected, or cleaned up, and the page states where it went; first check the library to see whether it's already usable — see [Skill Management](#/docs/console-skills).

**The save button in the Editor won't click through.** Saving validates: "Validation issues" lists the problems one by one, and it only saves once they're fixed — this keeps you from breaking the skill, and isn't a malfunction.

**The version you want to go back to won't let you click "Rollback".** The page states "No archive kept for this version, so it cannot be restored." — this version's files weren't kept, and there's no going back to it.
