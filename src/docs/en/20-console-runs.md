# Run History

Every run you start in a conversation leaves a matching record in the Console: success or failure, how long it took, which skills it used, what files it produced. When an answer feels off, when you want to know what the assistant remembers about you, when an unfinished task should keep going — come to the Console's "Runs" group. How to open the Console: [A Tour of the Console](#/docs/console-tour).

## What you can do

- Filter out failed runs by status and see success rate and duration at a glance
- Pinpoint any run by its run ID and replay every step
- Download the files a run produced
- See what the assistant has stored in each layer of memory, and delete entries you don't approve of
- Resume an interrupted run, continuing from where it stopped

## The conversation and the Console: two views of the same thing

Every message you send sets off a whole set of actions the assistant performs to answer it — that's **one run**: in the conversation it shows up as the "Run flow" card (see [Seeing What the Assistant Is Doing](#/docs/transparency)); in the Console it settles into a **run record**. The two sides describe the same thing — the conversation shows you the present one; the Console keeps the entire history.

The key connecting the two sides is the **Run ID**. The easiest path needs no copying: hover over the assistant's answer and click **View trace** to land directly on this run in the run-detail page. When the message is hard to find, expand the "Run flow" card, click **Copy run ID**, and paste it into the search box on the Activity page or the detail page to filter — that finds it too.

![M-21 From one conversation to one run record](/docs-assets/console-runs/M-21.svg)

One question produces one run record; the record expands into details: timeline, tool calls, LLM turns, artifacts.

Below, the pages are explained in the order they appear in the sidebar's "Runs" group.

### Activity

**What it's for**: every run leaves a row here — status, start time, how it ended, which skills it used. To answer "how has it been doing lately" or "which run failed", come to this page.

At the top are four metric cards: **Success rate**, **Avg turns**, **Avg duration**, **Total runs**. They cover all runs and don't change with the filters below. If **Recent failures** appears under the cards (at most 5 entries), every run ID in it is clickable and jumps straight to that run's details.

**What you can do here**:

- Filter by run ID or skill name in the search box (the placeholder reads "Search run ID or skill…")
- Use the **All statuses** dropdown to see just one kind: `completed`, `failed`, `cancelled`, `running`; searching and filtering stack
- Page through older records with the pagination and page-size controls under the table
- Click a row's run ID to jump to the run-detail page for the complete record

![The Activity page: metric cards, recent failures, and the filterable run list](/docs-assets/console-runs/zh/S-console-runs-01-activity.png)

Finding failed runs needs no paging: pick failed in the status dropdown and only they remain; run IDs under Recent failures jump straight to the details.

**Typical use**: the assistant's last answer felt off — filter status to `failed` on this page and read the "Reason" column. That column shows English codes, corresponding one-to-one with the termination notices in "Why it stopped" in [Seeing What the Assistant Is Doing](#/docs/transparency) — `max-turns`, for instance, is the conversation's "Run stopped after reaching the turn limit". To dig deeper, click the run ID into the details.

### Inspector

**What it's for**: replaying one run in full — the final stop for troubleshooting.

The run list is on the left (searchable, pageable); click an entry and its file unfolds on the right:

- **LLM turns**: how many round trips between the assistant and the model — one card per turn: which turn, how many messages, how many tools; the turn tagged "Final answer" is the moment it reached its conclusion.
- **Task list**: if the run split the task, this is the checklist's final state — which items completed, which were delegated to another skill, matching the task list in the conversation; runs without a task split don't show this section.
- **Trace timeline**: every step in time order, colored by family — skill, model, tool, interface, artifact at a glance. Open any step to see its detailed data; tool calls carry durations, and a step stopped by a safety boundary is marked "Blocked by policy".
- **Artifacts**: the files this run produced: text types are **Preview**ed in place, images display directly, the rest you take with **Download**.

For a run still in progress, this page offers **Cancel run** when your system supports it; when it doesn't, the page says so plainly instead of giving you a button that does nothing.

**What you can do here**:

- From the conversation, click **View trace** to go straight to a run; clicking a run ID on the Activity page also jumps to this page with it selected
- A run reached this way is pulled to the top of the list and tagged "located by id" even if it isn't on the current page — the pagination isn't broken
- Pasting a run ID into this page's search box only filters the list — no "located by id" tag appears
- Read the LLM turn cards round by round to pin down where it made the wrong call

![The Inspector page: the run list on the left, one run's complete file on the right](/docs-assets/console-runs/zh/S-console-runs-02-inspector.png)

Select a run, and on the right are its turns, checklist, timeline, and artifacts.

![Arriving from the conversation via "View trace", the target run is tagged "located by id"](/docs-assets/console-runs/zh/S-console-runs-04-locate-by-id.png)

When you arrive via "View trace", the target run is pulled to the front even if it isn't on the current page, tagged "located by id"; pasting an ID into search only filters.

![The details of a failed run, with the failure reason marked on the timeline](/docs-assets/console-runs/zh/S-console-runs-05-failed-run.png)

The failed step is documented on the timeline; the end-reason code and the conversation's termination notice describe the same thing.

**Typical use**: hover over the assistant's answer and click **View trace** to land directly on this page, then replay step by step: which turn it misread, which tool call failed, and why. When the message is hard to find, copy the run ID (steps in [Seeing What the Assistant Is Doing](#/docs/transparency)) and filter in the search box. When the record is gone, the page says so plainly and shows the ID as-is — it won't quietly swap in some other run for you.

### Sessions & Memory

**What it's for**: what the assistant remembers, in which layer, and where unfinished runs stopped.

**Chat sessions**: a list of all sessions (including archived ones); click one to read its messages read-only. Renaming, archiving, and other management happen in the chat panel — see [Managing Sessions](#/docs/sessions).

**Memory browser**: answers "what has it remembered about me". Memory has three layers, named exactly as shown on the page:

| Layer | What it records | How long it's kept |
| --- | --- | --- |
| `session` | Temporary notes within one conversation | Goes with that conversation |
| `skill` | A skill's own notes | Kept across conversations |
| `user` | What the assistant knows about "you" | Kept across conversations and skills |

Pick a layer, fill in the identifier, click **Load** to see every entry; delete what shouldn't stay with **Delete**. The profile has a more readable view on the "Privacy & User Modeling" page in Settings (see [Settings](#/docs/console-settings)); where the data goes: [Privacy and Where Your Data Goes](#/docs/privacy).

**Interrupted runs**: when you refresh the page while a run is paused on a card waiting for your answer, a snapshot is left behind. Click **Resume** to go back to the conversation, where that card reappears. Runs interrupted on an **authorization card** can't be resumed, though — see [Asking, Answering, and Interrupting](#/docs/chat-basics). Snapshots written by older builds are listed but can't be resumed.

![Overview of the Sessions & Memory page](/docs-assets/console-runs/zh/S-console-runs-03-sessions.png)

Three blocks on one page: sessions, memory, interrupted runs.

![The memory browser's entry list](/docs-assets/console-runs/zh/S-console-runs-06-memory.png)

Memory is visible entry by entry — and deletable entry by entry.

**Typical use**: suspecting it remembered something it shouldn't — load the `user` layer and read entry by entry, deleting anything you don't approve of on the spot.

> **Note**: Deleting or clearing sessions on this page cannot be undone once confirmed — see [Managing Sessions](#/docs/sessions).

## Web version vs. extension version

The three pages themselves are the same in both; the difference is in what the records contain: extension-version runs can span tabs, so timelines and tool calls may include reads and actions on other tabs; web-version records only involve the current site. Records and memory are both stored in this machine's browser — another computer or another browser won't see them.

## When something goes wrong

- **A run ID search finds nothing.** First check the ID was copied in full; then consider whether its session was deleted — deleting a session in the chat panel deletes its run records along with it (see [Managing Sessions](#/docs/sessions)), and they can't be recovered.
- **After clicking "View trace", the detail page says the ID wasn't found.** That's not an error — it's telling you plainly there's no such record: most likely the run went away with a deleted session. The page shows the ID it was looking for as-is, so you can check it.
- **Clicking "Resume" does nothing or errors.** Two possibilities: the snapshot was written by a much older build (marked on the page) and can't be resumed at all; or resuming needs the chat panel present — in the Demo, open the chat panel once, then come back and click Resume.
- **Deleted a memory entry and worried it didn't take.** After deletion the list is re-pulled from storage — an entry that's gone is deleted; if unsure, refresh the page and look again.
