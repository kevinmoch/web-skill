# Letting the Assistant Act on the Page

The assistant can do more than read pages — it can act for you: fill forms, click buttons, switch pages. This chapter covers what it can do, what it asks you about first, and what to do if you disagree or change your mind.

## What you can do

- Have the assistant fill forms, click buttons, and switch pages with one sentence
- Tell apart which actions it does directly and which it asks about first
- Check "Don’t ask again" to stop repeated interruptions
- Revoke remembered authorizations in the Console

## What it can click and fill for you

Open the [Demo](/demo) and say `Take me to the defect management page` — it switches this system to that screen. Switching screens doesn't change data and won't interrupt you; changing page content (clicking, filling, selecting, submitting) follows a different set of rules — the next section.

## What you can just say

Phrase it like the left column:

| You say | It does | Does it ask first? |
| --- | --- | --- |
| "Scroll the table down and finish the remaining rows" | Scrolls down and stops at the bottom on its own | Always asks |
| "Click the plus on this row" | Clicks the icon to expand the details | Always asks |
| "Show 50 rows per page" | Picks an option in the "rows per page" dropdown | No — just does it |
| "Write ×× in the remarks" | Types into the input field | No — just does it |
| "Click save", "Open this requirement" | Clicks a button, link, or list row | Always asks |
| "Turn this switch on" | Sets it on; if it's already on, leaves it alone | Always asks |
| "Done filling — submit it" | Submits the form | Always asks |
| "Upload this screenshot" | After you allow, the system file chooser pops up and you pick by hand | Always asks |
| "Go back a page" | Goes back to the previous page (browser history) | Always asks |

![The authorization card for clicking the plus on a table row to expand its details](/docs-assets/page-actions/en/S-actions-08-expand-consent.png)

Every phrasing in the table can be tried as-is in the Demo.

**What it can't do**: **dragging** (dragging a card to another column, drag-and-drop file upload, slider captchas) and **horizontal scrolling** (the columns off to the right of a wide table) are both beyond it; between pages it can only go back to the previous page — it won't type a new URL for you.

## What it asks you about first

Not every action needs your nod — the rules are graded (using the Demo's configuration as the example):

| What it's about to do | Does it ask first? | Why |
| --- | --- | --- |
| Type into an input field, pick an option in a dropdown | No — it just does it | Nothing is submitted yet; if it's filled wrong you can see it and change it back |
| Click a button, flip a switch, submit a form, upload a file, scroll, go back | Always asks | These really get written into the system |

Remember it in one sentence: **it can fill out an entire form on its own, but before pressing "submit" it always stops and asks you.**

![An automatically filled form: several fields already have content, and an authorization card pops up before submission](/docs-assets/page-actions/en/S-actions-07-filled-form-consent.png)

The filled form shows filling didn't interrupt you; the authorization card in front of submission shows it always asks before writing into the system. Sample run output — your actual output will differ.

> **Note**: Which action kinds are confirmation-free is decided by the system you're in. This chapter follows the Demo's configuration; your system may be stricter.

## It asks before acting

Actions that need your nod pop up an **Authorization required** card — before anything that really changes the page, it must have your consent. The card spells out three things:

1. What it wants to do and what it wants to touch, phrased like `Allow the assistant to click “{target}”?`; when filling text, the content itself sits on the card verbatim (`Allow the assistant to fill “{target}” with:`), so you see the content before approving.
2. Two buttons: **Allow** and **Deny**.
3. A "Don’t ask again" option (covered in detail later).

![A complete page-action authorization card, with the action description and the Allow and Deny buttons](/docs-assets/page-actions/en/S-actions-01-consent-card.png)

![The page before and after authorization: after Allow, the form really is changed](/docs-assets/page-actions/en/S-actions-03-page-changed.png)

After you click **Allow**, the page change is immediately visible. Sample run output — your actual output will differ.

![The authorization flow: the card pops up, with three outcomes — allow, allow and remember, deny](/docs-assets/page-actions/en/M-15.svg)

It only acts if you allow; allow-and-remember stops future asks and can be revoked in the Console; deny and it doesn't act.

Clicking **Deny** doesn't ruin the whole run: only that one action doesn't happen (the tool call shows **Failed** with a reason attached), the page doesn't change, and the assistant carries on. The denial is also recorded in the Console's audit log (see [Governance and Review](#/docs/console-governance)).

![The conversation after a denied authorization: the assistant explains the action wasn't performed, and the task continues](/docs-assets/page-actions/en/S-actions-04-declined.png)

The assistant says plainly that the step wasn't done, then continues with the rest. Sample run output — your actual output will differ.

## How it knows where it landed

It clicks and then keeps working on its own — it learns where every action ended up:

| What happened | What it does next |
| --- | --- |
| A new page opened | Switches over and reads that page |
| The current page jumped to a new address | Keeps reading on this page |
| A dialog popped up | Continues operating inside the dialog |
| The page didn't change | It knows the click didn't land, and tries another approach |

Two more things it also does on its own: **going back** (which likewise needs your consent first, unless you've checked don't-ask-again) and **scrolling** (only when the page indicates there's content you can't see, stopping at the bottom).

## Telling it not to ask every time

The authorization card has a **Don’t ask again for this kind of action** option. Check it and click **Allow**, and the same kind of action just happens from then on without interrupting you. In the Demo, the option spells out the remembered scope, phrased like `Don’t ask again for “submit” in this page` — what's remembered is "this kind of action in this scope", not just this one button.

![The "Don’t ask again" option on the authorization card](/docs-assets/page-actions/en/S-actions-02-remember.png)

Once checked and allowed, the same kind of action no longer pops a card.

There's one hard exception: **password fields are never remembered**. For any password-type control, you confirm in person every time; the option doesn't appear on the card, and the value to be filled shows as a row of dots, never in plain text.

## Changing your mind

Open the Console (where skills are managed and settings adjusted), go to the **Remembered page actions** section on the **Page Skills** page (the interface text reads: "Actions you told the assistant not to ask about again. Revoking one brings back the confirmation prompt."), and click **Revoke** entry by entry, or **Revoke all** to clear everything. Revoking takes effect immediately — no reload needed — and the next action of the same kind pops the card again. For the rest of this page, see [Connections](#/docs/console-connections).

![The Console's "Remembered page actions" section, with Revoke and Revoke all buttons](/docs-assets/page-actions/zh/S-actions-06-revoke.png)

Remembered authorizations are listed one by one; revoke singly or clear all at once.

Be clear about the distinction: revoking takes back the "don't ask again" memory. An action already performed can't be pulled back — it really was written into the system, and you need to change it back on the page yourself.

## Some things it won't do

**Readable doesn't mean operable.** Your system marks out an operable scope for the assistant; outside the scope it refuses outright — not even an authorization card pops up. It can read the list data, yet the delete button next to it may be outside the scope. A stopped call shows **Blocked by policy** in the **Run flow** with **Why it was blocked** attached (for the four states, see [Seeing What the Assistant Is Doing](#/docs/transparency)).

![A page action showing the "Blocked by policy" status](/docs-assets/page-actions/en/S-actions-05-policy-blocked.png)

A dialog you opened by hand, it won't touch either — only dialogs opened by its own actions can be operated further, and the authorization card then carries an extra line, "This dialog is outside the usual allowlist; it was opened by this task.". If the system hasn't opened up page actions at all, it simply says it can't be done.

## Actions under your login

When the assistant operates on a page where you're logged in, the system sees it as you. Read the authorization card carefully before clicking **Allow**; when in doubt, click **Deny**.

## Web version vs. extension version

| | Web version | Extension version |
| --- | --- | --- |
| Pages it can operate on | Only the one page the assistant is on | Any web page you've opened and handed to it |
| Confirm, remember, revoke | The same set of rules | The same set of rules |

The extension version can operate on more pages, with the constraints unchanged: the same authorization requirements, password fields still never remembered, and it can only touch tabs inside the workset — tabs you opened yourself it can't see (see [Working Across Tabs](#/docs/tabs)).

## When something goes wrong

- **It says it can't find the thing to operate on.** Once the page changes, the element it noted goes stale — have it read the page again and retry.
- **Authorization cards pop up too often.** Check **Don’t ask again for this kind of action** on the card, or describe a smaller task.
- **A card sat unanswered too long and the run ended on its own.** There's a time limit on waiting for an answer; on timeout the run ends with "Run stopped because the form was not submitted in time" — just send again.
- **You clicked Allow by mistake.** A submitted action can't be auto-reverted; change it back on the page by hand. If you'd checked "don't ask again", go to the Console and revoke that authorization.
