# Case: Filling Out a Form with One Sentence

Creating a requirement, breaking it into tasks, and adding test cases used to mean opening three pages and filling out three forms. This chapter does one thing: say one sentence and have the assistant run through it for you — with the emphasis on seeing clearly when you still hold control.

## Before you start

- Open the [Demo](/demo) and select a project on the left.
- Switch to the **Requirements** screen on the left — the quick prompt this chapter uses only appears in this screen's empty state; you won't find it on the default screen.
- If you'd rather speak: the first time you use voice you need to allow the microphone — see [Attachments, Images, Voice, and Camera](#/docs/attachments).

## Step 1: Say what's on your mind

The most effortless way is speaking, not typing:

1. Click **Expand AI copilot** on the right edge of the page to open the chat panel, then click **Voice input** below the input field — the interface enters "Recording".
2. Speak your idea into the microphone, for example: "Plan a new requirement for me: support exporting the weekly report, high priority, broken into sprint tasks, with test cases to match."
3. Click **Stop voice input** — the recognized words land in the input field. Glance over them for typos, fix them, then press Enter.

![Speaking into voice input, in the recording state](/docs-assets/case-fill-form/zh/S-case-form-01.png)

Spoken words land in the input field first, and you can edit them right up to sending.

If you'd rather neither type nor speak, there's a ready-made one under "Try an example" on the welcome screen:

`Turn my idea into a plan: new requirement, sprint tasks and test cases — then guide me through creating them on each page`

What it triggers: the assistant splits one thing into three kinds of records — requirement, sprint tasks, test cases — then takes you to the **Requirements**, **Sprints**, and **Tests** pages to create them one by one.

## Step 2: It takes you there and fills out the form

After you send, no directions needed from you: it first jumps to **Requirements**, opens the **Create Requirement** form, and fills it field by field. When one form is done it moves on to the next, and you can see which step it's on throughout.

![The assistant has jumped to the Requirements page and opened the Create Requirement form](/docs-assets/case-fill-form/zh/S-case-form-02.png)

![The requirement form's fields filled in automatically, the cursor still on the form](/docs-assets/case-fill-form/zh/S-case-form-03.png)

Jumping pages and filling fields don't interrupt you — nothing is written into the system yet, and if it's filled wrong you can see it and change it back. Sample run output — your actual output will differ.

## Step 3: At "submit", it stops

**It can fill out an entire form on its own, but before pressing "submit" it always stops and asks you.**

![M-28 One sentence becomes a record: spoken, understood, jumping to the right page, filling field by field, [STOP] the submit confirmation card, written successfully after Allow](/docs-assets/case-fill-form/M-28.svg)

The only [STOP] in the whole chain is the submit confirmation card: however smoothly the filling goes, writing into the system has to pass through you. The dashed line in the diagram is the other exit — deny: this record isn't written, but the task continues.

The authorization card is titled **Authorization required** and spells out what it's about to submit:

![The submit confirmation card standing in front of the filled form](/docs-assets/case-fill-form/zh/S-case-form-04.png)

Two consecutive frames of the same run as the previous image: the form is filled, and the authorization card stands in front of submission. Sample run output — your actual output will differ.

- If everything looks right, click **Allow**: the record really is written into the system and appears in the list right away.

![After a successful submission, the new entry in the requirement list](/docs-assets/case-fill-form/zh/S-case-form-05.png)

Once allowed, the write is immediately visible. Sample run output — your actual output will differ.

- If a field is wrong: **fix it right on the form**, then click **Allow** — no need to have the assistant start over.
- If you don't want it submitted: click **Deny**. This record isn't written, but the task doesn't break — it explains that the step wasn't done, then moves on to fill the next form.

![After a denied submission, the assistant explains the record wasn't written and continues with the rest](/docs-assets/case-fill-form/zh/S-case-form-06.png)

Denying blocks only this one record; the task continues. Sample run output — your actual output will differ.

- If you don't want to be asked every time: the authorization card has a **Don’t ask again for this kind of action** option. Think it through before checking it — **this hands over the approval power for this kind of submission**. A wrong check can be undone; for the grading rules and the revoke entry, see [Letting the Assistant Act on the Page](#/docs/page-actions).

## How it knows what to fill in

A form filled out of thin air — the first reaction is usually wariness: where did these values come from? Three cases:

1. **They were in your sentence.** The title and priority came out of your own mouth; it uses them directly.
2. **You didn't say, but it remembers your habits.** The assignee and story points, for example. For these fields it **doesn't fill in for you** — it only places a suggested value beside the field, with a reason attached — "you've assigned it to this person the last few times". It only counts once you click **Use** to take it; if you don't, it stays empty. For the mechanics, see [Six Interaction Cards](#/docs/interactions).

![Field close-up: the suggested value and its reason visible at the same time](/docs-assets/case-fill-form/zh/S-case-form-07.png)

It tells you what the guess is based on. Sample run output — your actual output will differ.

3. **Neither of the above.** The field is left empty. It won't make up a plausible-looking value to muddle through.

Suggestions are learned from how you've answered and chosen in the past, stored on your own machine, and can be viewed and deleted one by one — for how to manage them, see "Privacy & User Modeling" in [Settings](#/docs/console-settings); for whether they get sent out, see [Privacy and Where Your Data Goes](#/docs/privacy). Getting no suggestions at all the first few times is normal: it doesn't know you yet.

## Other phrasings that work

No fixed incantation to memorize — the phrasings below all take the same path:

- `Add this requirement to the backlog for me: title it "Export weekly report", high priority`
- `I want to add a sprint task: weekly report template design, 3 points, assign it to me`
- The spoken version: press **Voice input** and say any of the above out loud

## What this used

| Step | Chapter |
| --- | --- |
| One spoken sentence turned into text | [Attachments, Images, Voice, and Camera](#/docs/attachments) |
| Jumping to the right page, reading the form | [Letting the Assistant Read the Page](#/docs/page-perception) |
| Filling fields, the confirmation before submission, denying and undoing | [Letting the Assistant Act on the Page](#/docs/page-actions) |
| Suggested values and their reasons | [Six Interaction Cards](#/docs/interactions) |
| Progress across three pages | [Seeing What the Assistant Is Doing](#/docs/transparency) |

## Web version vs. extension version

Jumping pages, filling forms, the submit confirmation, and suggested values behave the same in both. The only difference is the first-time voice permission grant:

> **Extension only**: The extension version lives in the browser's sidebar, and the microphone needs to be granted once in a regular tab that opens automatically; back in the sidebar, click **Voice input** once more and it works — see [Attachments, Images, Voice, and Camera](#/docs/attachments).

## When something goes wrong

- **The recognized text has typos.** Don't rush to send — the voice lands in the input field, so fix it first, then send; if it's already sent, just add a sentence correcting it.
- **One of the values it filled is wrong.** The field is right there on the page — fix it directly, then click **Allow**; no need to have it start over.
- **The suggestions keep guessing wrong.** If you don't click **Use** they don't count; if the guesses are consistently wrong, go to [Settings](#/docs/console-settings) and delete the profile entry that's off.
- **An authorization card sat unanswered too long and the run ended on its own.** There's a time limit on waiting for an answer; on timeout it ends with "Run stopped because the form was not submitted in time" — just send again.
