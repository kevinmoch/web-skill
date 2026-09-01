# Asking, Answering, and Interrupting

You don't need to learn any syntax to ask a question: type like you're sending a message, and send it. If the answer isn't good enough, you can stop it at any time, have it try again, or edit your message and resend. If you delete a message by mistake, you have a few seconds to undo.

## What you can do

- Type and send a message, or click an example on the welcome screen to start
- Answers appear piece by piece — you can start reading before it finishes
- Click **Stop** mid-generation; what's already written stays
- Use **Retry** to get a fresh answer, or **Edit message** to change what you said and resend
- Copy any message; after deleting you can **Undo**
- Closed the page before the last run finished? Come back and click **Resume** to pick up where it left off

## Sending your first message

1. Open the chat panel. In this site's Demo, the entry is in the bottom-right corner of the page, called **Expand AI copilot**.
2. Type in the input field at the bottom. The faint placeholder text says "Send a message...".
3. Press Enter, or click **Send**.

Before you've sent anything, the message area is a welcome screen: under "Try an example" there's a list of ready-made prompts, and clicking one sends that sentence for you. For example:

`Generate an agile operations report for the current project covering sprint health, requirement distribution, defect hotspots and test quality`

What this triggers: the assistant has to pull data in several steps — sprints, requirements, defects, tests — and then assemble it into a report, so the answer keeps going for a while, which is perfect for observing the states described below. Ask the same thing twice and the wording of the answer usually won't be identical. That's normal.

## Answers appear piece by piece

An answer doesn't pop out all at once — it appends section by section, so you can read while it generates.

While it's generating, the **Send** button becomes **Stop**. When the answer finishes, it changes back to **Send** and the input field works again.

![During generation the button shows "Stop" and the body grows piece by piece](/docs-assets/chat-basics/zh/S-chat-basics-01-streaming.png)

You don't have to wait for a generating answer to finish before reading it. Sample run output — your actual output will differ.

Answers aren't just plain text either: headings, lists, and tables are rendered with proper formatting, and code blocks get syntax highlighting.

![Headings, lists, tables, and highlighted code blocks all render with structure](/docs-assets/chat-basics/zh/S-chat-basics-07-markdown.png)

One answer can contain text, tables, and code at the same time. Sample run output — your actual output will differ.

## Stopping it midway

1. While the answer is generating, click **Stop** (the same button that was **Send** a moment ago).
2. Generation stops immediately, and the input field works again.

Stopping doesn't wipe anything: **the body already generated stays exactly as it was**. The answer then has two separate parts — the preserved body on top, and a "Run cancelled by you" notice below. The notice is visible by default; you don't need to expand anything. The preserved body can still be copied, deleted, or inspected with View trace.

![M-05 The lifecycle of a message](/docs-assets/chat-basics/M-05.svg)

Once sent, a message enters "generating" and ends in one of three states: completed, stopped, or failed. Stopped and failed can both go back to generating via "Retry". Note the annotation next to "stopped" in the diagram: content already generated is kept.

![After clicking Stop, the generated body is fully preserved, with the cancellation notice shown separately](/docs-assets/chat-basics/zh/S-chat-basics-02-stopped-content-kept.png)

The body and the cancellation notice are two separate parts — neither overwrites the other. Sample run output — your actual output will differ.

If you stop extremely early — before the first character comes out — you won't be left with an empty answer bubble; you'll only see the cancellation notice.

## Getting it to try again

If the answer isn't good enough, you don't have to retype the question:

1. Hover over **the message you sent**. A row of action buttons floats up beneath it.
2. Click **Retry**, and the assistant answers the same message again. Your original text is unchanged.

![The action buttons that appear when hovering over a message](/docs-assets/chat-basics/zh/S-chat-basics-03-message-actions.png)

The action buttons only appear on hover. On your messages: Copy, Edit message, Retry, Delete message. On the assistant's answers: Copy, Delete message, and **View trace** — which jumps to the detailed record of that run; see [Seeing What the Assistant Is Doing](#/docs/transparency).

## Fixing something you just said

Said something wrong, or want to add a sentence? Edit and resend:

1. Hover over the message you sent and click **Edit message**.
2. The message turns into an input field — change the content directly.
3. Click **Send**: the conversation shows the edited text and the assistant answers the edited version. Click **Cancel**: it stays as it was and no new answer is produced.

![The editing state of a message, with "Cancel" and "Send"](/docs-assets/chat-basics/zh/S-chat-basics-04-edit-message.png)

Only your own messages can be edited; the assistant's answers can't. If you're not happy with an answer, use **Retry**.

## Copy and delete

**Copy**: hover over a message and click **Copy**. After a successful copy the button's tooltip changes to "Copied" and changes back after a moment. Both your messages and the assistant's answers can be copied.

**Delete**: hover over a message and click **Delete message**. The message disappears from the conversation immediately, and a notice pops up at the bottom of the screen titled "Message deleted", with a smaller line below: "It is removed for good once this notice closes." — **click "Undo" before the notice disappears and the message comes back**. The notice only stays for a few seconds; once it's gone, the message can't be recovered. Deletion is real: even if you refresh the page, a deleted message doesn't come back.

![The undo notice that appears after deleting a message](/docs-assets/chat-basics/zh/S-chat-basics-05-undo-toast.png)

The undo window is only a few seconds — click "Undo" before the notice disappears to get the message back.

> **Note**: Deleting a message has an undo window; deleting a **session** doesn't. A session is an independent conversation, and deleting it removes all of its messages and run history along with it — the confirmation text spells it out: "The conversation and its run history are removed. This cannot be undone." See [Managing Sessions](#/docs/sessions) for details.

## What if the last run didn't finish

Only when the previous run stopped on a **form-style card waiting for you to fill in or answer** will a banner appear at the top of the conversation after you refresh or reopen the page, titled "You have an unfinished conversation", with the text "A previous run was interrupted while waiting for your input. Resume to continue where it left off."

Click **Resume** and the run continues from where it stopped; the card that was waiting for you reappears. Runs that finished normally don't show this banner.

![The interruption banner at the top of the conversation, with a "Resume" button](/docs-assets/chat-basics/zh/S-chat-basics-06-resume-banner.png)

When you see this banner, click "Resume" to continue where you left off — no need to start over.

> **Note**: If a run was stopped on an **authorization card** (titled "Authorization required") when you refreshed or reopened the page, this banner does not appear — that run is marked as cancelled and can't be resumed from here; to continue that task, send the message again. For how to tell the six kinds of cards apart, see [Six Interaction Cards](#/docs/interactions).

By the way: conversation content is stored on your device. Refresh the page, or even quit the browser entirely and reopen it — your session history is still there.

## Web version vs. extension version

Everything in this chapter behaves the same in both: sending messages, answers appearing piece by piece, stop, retry, edit, copy, delete and undo, and resuming an interrupted run. The difference isn't how the conversation works but the range the assistant can read and write: the extension version can work across tabs, so answers may involve content from other tabs; the web version only involves the site it's on.

## When something goes wrong

- **The answer stopped midway, showing "Run stopped because the model request failed".** Usually a network or model-configuration problem. The part already generated is kept — it doesn't disappear along with the error. Check your network first, then hover over your message and click **Retry**. If you've configured a model yourself, check the configuration following [Choosing a Model](#/docs/models).
- **You deleted the wrong message, but the undo notice is already gone.** That message can't be recovered. Next time, watch for the notice at the bottom of the screen after deleting and click **Undo** in time.
- **You don't see the resume banner.** Only runs interrupted while stopped on a form-style card waiting for your input get the banner after a refresh. Runs stopped on an **authorization card** don't — they've been marked as cancelled. Runs that already finished, or that you stopped yourself with **Stop**, don't either. To continue, just send a new message.
- **Worried that refreshing will wipe your content.** It won't. After a refresh, answers are still there exactly as they were, content preserved by Stop is still there, and deleted messages don't come back. Quit the browser entirely and reopen it — everything is unchanged.
