# Six Interaction Cards

When the assistant stops halfway through a task, it's usually asking you for something: an answer, a permission, or a file — waiting in the conversation as a small card (an interaction card). This chapter covers how to recognize them, how to respond, and what happens if you don't answer.

## What you can do

- Recognize the six kinds of cards and see at a glance what each one wants
- Fill in fields, make choices, give confirmations — every card has a clear way to respond
- Read what it's about to do on an authorization card before deciding to allow or deny
- Understand the "Suggested:" line on a card, and decide whether to take it or ignore it
- When a card gets scrolled up by the message stream, use the waiting indicator to jump back to it

## Why cards pop up

The assistant stops to ask you in three situations: it's missing information, it needs permission (the action has side effects), or it needs a file (one that lives only on your machine). These correspond to six kinds of cards, with the title shown in the card's top-left corner.

In a complex task, the card may come from a subtask it sent out: the card carries an extra "From: {label}" badge — just answer it as usual.

![M-08 A recognition tree for the six cards](/docs-assets/interactions/en/M-08.svg)

"What the assistant needs" decides which card pops up: one more sentence, a nod or a shake, a set of fields, a pick from candidates, a permission, a file — one kind for each.

## Answer needed

**When it appears**: the assistant is one sentence short of continuing. For example, you say "say hello with the greeting skill", and it doesn't know whom to greet.

**What's on the card**: one question, one input field, and **Submit** and **Cancel**. A required field left empty can't be submitted: clicking Submit is stopped, with the message "This field is required".

**What you do**: fill it in and click **Submit**. If you don't want to answer, click **Cancel** — the run ends with your cancellation.

![The "Answer needed" card: one question, one input field, Submit and Cancel buttons](/docs-assets/interactions/en/S-interactions-01-ask.png)

The question's wording is generated for the task at hand; what doesn't change is the "Answer needed" title and these two buttons. Sample run output; your actual output will differ.

## Confirmation

**When it appears**: before doing something with consequences, the assistant asks you a yes-or-no question, like "Confirm publishing this quarterly report?".

**What's on the card**: one readable confirmation question, **Confirm** and **Cancel**.

**What you do**: if you agree, click **Confirm**. If you don't, click **Cancel** — "Cancel" here doesn't abort the run; it answers "no": the run doesn't fail, the assistant takes that answer and carries on, and the thing doesn't get done.

![The "Confirmation" card: one confirmation question, with Confirm and Cancel buttons](/docs-assets/interactions/en/S-interactions-02-confirm.png)

Clicking "Cancel" means shaking your head, not calling off the whole run. Sample run output; your actual output will differ.

## Information needed

**When it appears**: what the assistant needs isn't one sentence but a set of fields — for example, it wants you to set the filter conditions before generating a chart.

**What's on the card**: a multi-field form, each field with a name; required fields left empty can't be submitted, with the message "This field is required". At the bottom are **Submit** and **Cancel**.

**What you do**: fill it in and click **Submit**, and what follows runs on the values you entered. Click **Cancel** and the run ends with your cancellation — it won't hang there waiting, and it won't finish the run for you on default values.

![The "Information needed" card: a multi-field form with dropdowns and required-field checks](/docs-assets/interactions/en/S-interactions-03-form.png)

The fields are decided by the task at hand; what doesn't change is the required-field check and these two buttons. Sample run output; your actual output will differ.

## Choose an option

**When it appears**: the answer is one of a few candidates and the assistant lets you pick. For example, you say "open that project" while you have several projects at hand.

**What's on the card**: one question plus a number of options, and **Submit** and **Cancel**.

**What you do**: select one and click **Submit** — what follows uses the one you picked; if none of them fits, click **Cancel**.

![The "Choose an option" card: a question and a list of candidates](/docs-assets/interactions/en/S-interactions-04-select.png)

The candidates are given by the task at hand. Sample run output; your actual output will differ.

## The value it guesses for you

On the two cards "Answer needed" and "Choose an option", an extra line sometimes appears next to the question: "Suggested:" followed by a value, with a **Use** entry beside it. This line comes from what it remembers about you — things you've answered and chosen in the past are recorded and become the basis for guessing this time.

When you see it, remember three things:

1. **It doesn't fill it in for you.** The suggested value just sits there for you to look at; if you don't click **Use**, the value doesn't count, and what's submitted is still empty. This is a hard rule of the card: suggestions are never pre-filled into the control — it only counts as filled once you confirm.
2. **It tells you what the guess is based on.** Beside the suggestion there's a reason, like "you've picked this the last few times". The reason is there for you to judge whether to take it — if it's talking about something from three months ago, skip it and fill in your own.
3. **When it can't guess, it doesn't.** With no basis to back one, the field stays empty — it won't make up a plausible-looking value to fill the gap.

![A card with a suggested value: "Suggested:" followed by a value, with a reason and a "Use" entry beside it](/docs-assets/interactions/zh/S-interactions-09-suggestion.png)

This is what a suggested value looks like: if you don't click "Use", the field stays empty. Sample run output; your actual output will differ.

**Never having seen a single suggestion is normal.** Suggestions come from what it remembers about you, and it doesn't know you at first: having no suggestions the first few times isn't a malfunction; the longer you use it and the more you answer, the better the guesses. Your system may also not have turned this learning on — then there will never be any. These records are stored on your device and can be viewed and deleted one by one — for how to manage them, see "Privacy & User Modeling" in [Settings](#/docs/console-settings); for what's stored and whether it gets sent out, see [Privacy and Where Your Data Goes](#/docs/privacy).

## Authorization required

**When it appears**: the assistant is about to do something with side effects — change page content, read a file you downloaded, let a skill access an external data source, write out a file. These things must get your consent first.

**What's on the card**: the title is **Authorization required**, and the card's color scheme is visibly different from the other cards. It spells out which "Requested capability" it is, with the explanation: "This skill requests a capability. Review what it wants to do, then allow or deny the request. Denying cancels the run step that asked." When there are extra specifics, there's also "Request details". Two buttons at the bottom: **Allow** and **Deny**.

**What you do**: read clearly what it wants to do, then click **Allow**. Clicking **Deny** only cancels the run step that asked — it doesn't mean the whole run fails. Page-action authorization cards may also carry **Don’t ask again for this kind of action**; for which actions ask and which don't, and how to revoke a remembered one, see [Letting the Assistant Act on the Page](#/docs/page-actions).

![The "Authorization required" card: a warning-colored card spelling out the requested capability, with Allow and Deny buttons](/docs-assets/interactions/en/S-interactions-05-authorize.png)

The authorization card spells out what capability is being requested, clearly readable before you approve. Sample run output; your actual output will differ.

## File requested

**When it appears**: the assistant needs to work on a file it doesn't have — one that lives only on your machine, like "scan a local document".

**What's on the card**: one line explaining which file it needs, and two buttons: **Choose file** and **Decline**.

**What you do**: clicking **Choose file** opens the system's own file picker, and you do the picking yourself. Clicking **Decline** doesn't cancel the whole run: what the assistant gets is "not given", and it then takes another route — asking again, for example, or telling you an argument is missing.

![The "File requested" card: an explanation line, with Choose file and Decline buttons](/docs-assets/interactions/en/S-interactions-06-file-pick.png)

You pick the file yourself in the system picker; clicking "Decline" doesn't fail the whole run either. Sample run output; your actual output will differ.

## What happens if you ignore it

**Waiting has a time limit: 5 minutes by default.** Past the timeout with no answer, the run stops, with the message "Run stopped because the form was not submitted in time". Don't leave a card sitting — when you come back, you'll usually have to send it again.

While a card waits, two things help you find it:

- Above the input area there's a waiting indicator, "Waiting for your input: {target}"; when the form is hidden inside some panel, the panel name is written out along with it. If you can't find the card, click **Go to form** next to it and the viewport jumps straight back to the card.
- The status area at this point still shows **Thinking…**; expand **Run flow** and you'll see this run's phase sitting at **Interact** — it's not stuck, it's waiting for you.

![A submitted card becomes a read-only record, marked "Submitted"](/docs-assets/interactions/en/S-interactions-07-submitted.png)

After submitting, the card becomes a read-only record showing what was filled in at the time; it can't be changed anymore.

![The waiting indicator "Waiting for your input" above the input area, with the "Go to form" button beside it](/docs-assets/interactions/en/S-interactions-08-waiting.png)

While a card waits, the status area still shows "Thinking…", and the waiting indicator can bring the viewport back to the card.

Also: switch to another session and this card doesn't follow; switch back and it's still there. When you refresh or close the page, a run stopped on a form-style card can be resumed, one stopped on an authorization card can't — see [Asking, Answering, and Interrupting](#/docs/chat-basics).

## Web version vs. extension version

The two are the same: the six cards, the buttons, the required-field checks, the waiting indicator, the timeout behavior. The difference is only in content reach — a card on the extension version may involve pages on other tabs; the web version only involves the site it's on.

## When something goes wrong

- **You can't find the card.** Look at "Waiting for your input: …" above the input area, and click **Go to form** next to it to jump straight back.
- **You left it unanswered and the run ended by itself.** The wait is 5 minutes by default; timing out ends it with "Run stopped because the form was not submitted in time". Send it again — and answer promptly this time.
- **You submitted and then spotted a mistake.** A submitted card is a read-only record; it can't be changed. Have the assistant do it again, or send a new message to correct it.
- **You've never seen a suggested value.** New users getting no suggestions is normal; if the system hasn't turned on "Learn from how you answer", there will never be any — the toggle is in [Settings](#/docs/console-settings).
- **The authorization card is gone after a refresh.** A run stopped on an authorization card can't be resumed — send that thing again; form-style cards can be resumed from the banner at the top — see [Asking, Answering, and Interrupting](#/docs/chat-basics).
