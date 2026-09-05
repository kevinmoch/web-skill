# Seeing What the Assistant Is Doing

Which step the assistant is on, what it touched, and why it stopped are all shown directly in the conversation. Once you can read them, you know when to wait, when to step in, and where to look when something goes wrong.

## What you can do

- Tell at a glance from the run status whether the assistant is still working
- Expand **Run flow** to review what each step did
- See the status and arguments of every tool call
- Track long tasks with the **Task list**
- Understand why a run stopped and what to do next
- Copy the **Run ID** to pinpoint the exact run in the Console's run history

## The phases of a run

After you send a message, the answer area first shows **Thinking…**, meaning the run has started. Expand the **Run flow** card to see each phase advance in this order:

| Phase | What the assistant is doing |
| --- | --- |
| Route | Deciding which skill or tool to use |
| Activate | A skill has been chosen; loading it |
| Execute | Actually working: querying data, reading pages, generating content |
| Interact | Paused, waiting for you to answer a card |
| Complete | Finished normally |
| Failed | Ended abnormally (including you cancelling it); for specific reasons see "Why it stopped" below |

Two things to know up front:

- Phases loop. After a batch of tools finishes, it goes back to **Route** and decides the next step. Several rounds of this in a complex task are normal.
- If a phase sits at **Interact**, it's not stuck — it's waiting for you. Scroll up and find the unanswered card.

![The status area during a run, showing "Thinking…"](/docs-assets/transparency/en/S-transparency-01-status-bar.png)

"Thinking…" means the run has started; to see which phase it's in, expand Run flow.

![M-11 How a run moves through its phases](/docs-assets/transparency/en/M-11.svg)

After Execute it may return to Route; from any phase it can end in Failed (including you cancelling it yourself).

## Run flow: every step is visible

"Thinking…" only tells you the assistant is working. Expand the **Run flow** card and it lists each step of the run in order; when a skill was activated, there's a step like "Skill activated: <skill name>" with a duration on the right.

![M-12 The information layers of the run interface](/docs-assets/transparency/en/M-12.svg)

Details unfold layer by layer: the run status in "Thinking…", each step in Run flow, and the arguments one level deeper on each step.

![The full step list with Run flow expanded](/docs-assets/transparency/en/S-transparency-02-run-steps.png)

Every step is accounted for. Sample run output; your actual output will differ.

## Tool calls: what it touched

A tool is one concrete action the assistant can perform — "read the requirement list", "navigate to a page" — provided by the system you're in. The run area shows "{count} tool calls". Each call takes a row: a status icon plus the tool name, with the duration on the right; open the row to see its **Arguments**.

Each call has four possible states:

- **Running**: executing right now.
- **Completed**: succeeded, with a result.
- **Failed**: didn't succeed. A failed call expands on its own, with **Why it failed** attached. The assistant usually tries another approach and carries on, so a single failure is nothing to worry about.
- **Blocked by policy**: the call never executed at all.

"Blocked by policy" deserves an extra word: your system sets safety boundaries for the assistant — certain data it must not touch, certain operations it must not do. A call that hits a boundary is stopped outright, with **Why it was blocked** attached. This isn't an error; it's the boundary doing its job — it means not every request gets executed.

![The arguments section of a single tool call, expanded](/docs-assets/transparency/en/S-transparency-03-tool-detail.png)

Expand a call to see its arguments; the duration sits on the right of each row. Sample run output; your actual output will differ.

![A tool call showing the "Blocked by policy" status](/docs-assets/transparency/en/S-transparency-04-policy-blocked.png)

A blocked call is marked "Blocked by policy" with the reason it was blocked.

## The thinking process

While the assistant organizes its thoughts, a collapsed section titled **Thinking…** appears in the answer area. Open it to read what it's thinking in this stretch — when you suspect it misunderstood you, look here first. It collapses automatically when the run ends, and you can expand it again anytime.

![The thinking-process section during a run, titled "Thinking…"](/docs-assets/transparency/en/S-transparency-05-thinking.png)

The thinking content can be expanded and read. Sample run output; your actual output will differ.

## Task list: progress on long tasks

Complex tasks get broken down into a **Task list**. Each item has three states: **Pending**, **In progress**, **Completed**. The progress number `{done}/{total}` next to the title tells you how many are done.

Some items show "Delegated to {skill}". Don't be surprised when you see this line — three things to remember:

1. **It's dividing up the work itself.** In a complex task, the assistant hands a step to a more specialized skill. You don't need to do anything.
2. **It happens one step at a time, not all at once.** It only continues to the next step once the delegated one is done. So when you see "Delegated to", just wait.
3. **One side effect to know about.** The delegated part doesn't count as steps performed in this conversation. Because of that, when you "save the conversation as a skill", a conversation with "Delegated to" items may not save (see [Skills: Giving the Assistant Expertise](#/docs/skills-usage)). What to do then: don't let it delegate — redo the key steps yourself, then save.

![A task list with items in progress and completed](/docs-assets/transparency/en/S-transparency-06-todo-list.png)

Each item's state and the progress number next to the title are directly visible. Sample run output; your actual output will differ.

## Why it stopped

When a run ends early, the interface gives a one-line reason. Handle it according to this table:

| On-screen message | What it means and what you can do |
| --- | --- |
| Run cancelled by you | You clicked Stop yourself. Nothing to handle; if you want to continue, send it again. |
| Run stopped after reaching the turn limit | A "turn" is one round of the assistant thinking plus acting; the default limit is 1000 turns. Hitting it means the task is too complex: break it into steps and say them separately. The limit can be raised in Settings; the error card for hitting the limit has a button that jumps straight to that settings page. |
| Run stopped after reaching the time limit | The default limit is 3600 seconds (1 hour). Same approach: break the task down first, and adjust the setting if that's not enough. |
| Run stopped because the model request failed | Usually a network or model-configuration problem. Check your network; if you've configured a model yourself, check the configuration following [Choosing a Model](#/docs/models). |
| Run stopped because the form was not submitted in time | There's a time limit on how long the assistant's card waits for you (5 minutes by default); past that, the run ends. Answer cards promptly when you see them; if you missed one, send again. |
| Run stopped because a lifecycle hook failed | You didn't do anything wrong — an internal check in the system errored. Contact the people who provide this system. |
| Run stopped after too many calls to unknown tools | It kept trying to use a tool that doesn't exist — usually the current skill doesn't match this page. Rephrase and retry; if that doesn't work, confirm the skill you want is enabled. |
| Run did not finish | A catch-all message, cause unknown. Retry first; if it keeps happening, copy the Run ID and look it up in [Run History](#/docs/console-runs). |

![The notice shown when a run stops for reaching a limit](/docs-assets/transparency/en/S-transparency-07-limit-reached.png)

A limit-reached notice says which limit was hit, its current value, and where to change it.

## View trace and the Run ID

Every run has a unique **Run ID**: expand the **Run flow** card to see it, and click **Copy run ID** to copy it. Search for it in the Console's [Run History](#/docs/console-runs) to pinpoint the complete record of that run.

![The Run ID and its copy button](/docs-assets/transparency/en/S-transparency-08-run-id.png)

The copied Run ID is the single most important clue when troubleshooting.

## Web version vs. extension version

What's displayed is the same in both: run status, run flow, tool calls, task list, termination notices. The difference is in the step content: the extension version can work across tabs, so the steps may include reading and operating on other tabs; the web version's steps only involve the current site.

## When something goes wrong

- **The run sits still, as if waiting for something.** Scroll up, find the unanswered card, and answer it — the run continues. Leave it unanswered too long and the run ends with "Run stopped because the form was not submitted in time".
- **You keep hitting the limits.** Raise them in the Console [Settings](#/docs/console-settings); the change applies to the next run. That page also has "Restore defaults" to revert. Raising the limits is only a fallback — try breaking the task into steps first.
- **A tool call is "Blocked by policy".** A safety boundary stopped the operation — first read the reason next to it; if you genuinely need the operation, contact the people who provide the system to adjust the policy.
- **You can't tell why a run failed.** Copy the Run ID and send it to the people who provide the system together with what you saw — more effective than retrying over and over in the conversation.
