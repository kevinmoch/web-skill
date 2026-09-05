# Managing Sessions

One independent conversation is a session. Once you've used the assistant for a while, you'll need to create, find, organize, and delete them — but first, one thing matters most: the assistant's memory ends at the session boundary.

## What you can do

- Create and switch sessions so each thing stays in its own place
- Search sessions by title, and pull up older sessions and messages
- Rename, archive, and delete sessions
- Close the page and come back — every session is still there

## What a session is

A session is the boundary of the assistant's memory. Two rules are enough:

- **Within one session, it remembers what was said before.** That "what was said before" is its context — you can follow up with "and what about the second sprint?", and it knows what "the second" refers to.
- **Switch sessions and it starts from zero.** In a new session it doesn't know what you talked about elsewhere; sessions don't affect each other.

So "why did it forget what I just said" and "why does it still remember the previous topic" have the same answer: check whether you're still in the same session.

When should you start a new session? Three situations to judge by:

1. **You've changed topics.** The last thing is done and the new topic has nothing to do with it — start a new session; don't let it drag the old topic into the new question.
2. **The answers are being led astray by what came before.** You just had it analyze project A, then asked about project B, and the answer still speaks in project A's terms — a new session is the cleanest correction.
3. **The session has dragged on too long.** The longer you chat, the more material piles up behind it, and the more easily it mixes old and new information; rather than working to correct it, start a new session and restate what you need.

![M-06 Sessions and context](/docs-assets/sessions/en/M-06.svg)

Each session remembers the conversation inside itself, and nothing crosses between them — switching sessions means starting over.

## Creating and switching

1. Click the **Sessions** button at the far left of the header (tooltip "Expand Session List") to open the session list.
2. Click **New chat** on the right side of the header (the plus button): the message area returns to the welcome screen, ready for a fresh start.
3. Click any session in the list to switch over to it and continue where you left off.

You don't have to title sessions yourself: after you send the first message, the title is taken from that sentence; a session that doesn't have a title yet shows in the list as "New chat". A title you've changed yourself stays as it is — later messages won't overwrite it.

![The session list expanded, with multiple sessions arranged by time](/docs-assets/sessions/en/S-sessions-01-session-list.png)

Older sessions sit above newer ones in the list; click one to switch. The current session is marked.

## Finding older conversations

**Search.** The search box at the top of the list (placeholder text "Search sessions…") filters by title as you type, and the regular list and the "Archived" group at the bottom are filtered together. Clear the search box to get back to the full list.

**Load earlier.** When there are many sessions, the list first shows the most recent batch, and **Load earlier sessions** appears at the top; click it and an earlier batch is added above the list — while loading, the button shows "Loading…", and when there's nothing earlier it stops appearing. The same goes for opening a very long session: the earliest messages aren't on the first screen; click **Load earlier messages** at the top of the message area to fill them in above.

![Searching sessions: after typing a keyword, only the matching sessions remain](/docs-assets/sessions/en/S-sessions-02-search.png)

Search filters by title; the regular group and the "Archived" group are filtered together.

The Console's "Sessions & Memory" page can also browse all sessions (archived ones included), but it's read-only there — renaming, archiving, and deleting can only be done in the session list here. See [Run History](#/docs/console-runs).

## Rename, archive, delete

Move your pointer over a session in the list and a three-dot menu floats up on the right (its label is "Session actions: {title}"). All three actions live inside:

- **Rename**: the title turns into an input field; press Enter to apply, Esc to cancel. Leaving it empty doesn't apply.
- **Archive**: the session moves from the regular list to the "Archived" group at the bottom. Archiving is not deleting — the content is intact; in "Archived", click **Unarchive** on it and it moves back to the regular list.
- **Delete**: a confirmation box pops up first. Its title reads `Delete “{title}”?` ({title} shows the session's title), and its body reads: **"The conversation and its run history are removed. This cannot be undone."** It only executes when you click **Delete**; **Cancel** doesn't delete.

![The session's three-dot menu: Rename, Archive, Delete](/docs-assets/sessions/en/S-sessions-03-actions-menu.png)

This menu only appears when you hover over a session row; all three organizing actions are inside.

![Archived sessions move to the "Archived" group at the bottom of the list](/docs-assets/sessions/en/S-sessions-05-archived.png)

Archiving just puts it away — it isn't deletion; unarchiving restores it to its place.

![The confirmation dialog for deleting a session](/docs-assets/sessions/en/S-sessions-04-delete-confirm.png)

The confirmation dialog spells out "The conversation and its run history are removed. This cannot be undone." — read it carefully before you click.

Run history is the archive left behind by the set of actions (the run flow) behind each of its answers — see [Seeing What the Assistant Is Doing](#/docs/transparency). Also, when you delete the session you're currently looking at, the interface automatically switches to another session or the empty list — it won't leave you sitting on a conversation that no longer exists.

> **Note**: Deleting a **message** has an undo window of a few seconds (see [Asking, Answering, and Interrupting](#/docs/chat-basics)); deleting a **session** doesn't. Once confirmed, the conversation and its run history are gone for good — a refresh won't bring them back. When in doubt, archive instead of delete.

## Will closing the page lose them?

No. Sessions are stored in the browser on your device: refresh the page, close the tab, even quit the browser entirely and reopen it — the session list and the full contents of every conversation are all still there.

The only exception is clearing the site data yourself ("Clear site data" in the browser's settings): that wipes the sessions along with it, and the list goes back to the empty state "No conversations yet."

## Web version vs. extension version

Session management itself is the same in both: create, switch, search, rename, archive, delete — same behavior, and contents are stored on your device in both. The difference is how much one session can hold: the extension version can work across tabs, so one conversation may string together several sites; a conversation on the web version only involves the site it lives on.

## When something goes wrong

- **The list shows the notice "These session files could not be read and were skipped: …".** A few session files couldn't be read this time and the list skipped them; the rest of your sessions are unaffected. This usually happens when a write was interrupted mid-way (the browser crashed at the moment of saving, for example); if a skipped one is the session you're looking for, reopen the panel or refresh the page and check again; if it keeps happening, contact the people who provide this system.
- **You deleted the wrong session and want it back.** It can't be recovered — deleting a session has no undo window; confirming means permanent deletion. Next time you're unsure, archive first.
- **You definitely chatted about it, but it's not in the list.** First check whether it's in the "Archived" group at the bottom; then search for a keyword from its title in the search box; if the list is long, click **Load earlier sessions** to page upward.
- **You opened an old session and can't see the earliest messages.** Click **Load earlier messages** at the top of the message area, and the earlier content is added above.
