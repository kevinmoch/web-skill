# FAQ and Troubleshooting

Come in with a symptom, leave with the cause and the next step. Every symptom gets an actionable fix, not just a "please contact your administrator".

![M-32 The troubleshooting decision tree: branching from "what went wrong" into error cards, no response, mid-run stops, wrong results, attachments and voice, pages, skills, and connectivity, with the leaves pointing to the matching sections of this chapter](/docs-assets/faq/M-32.svg)

## How to use this chapter

Look things up by **what you see** — no need to first judge which module the problem is in. Interface messages are quoted verbatim so you can match them word for word. A text quick-reference for the diagram above:

| What you see | Go to this section |
| --- | --- |
| A card titled "Something went wrong" | What the error card says |
| No reaction after sending, or it only chats | The assistant doesn't respond |
| The run ended early | The run stopped midway |
| The answer doesn't match the page or the document | The result is wrong or off track |
| Images, voice, camera, or files won't go out | Can't send images / can't use voice |
| Page unreadable, clicks not taking effect | Page unreadable / actions not taking effect |
| A skill can't be called or errors out | Skill problems |
| Offline, weak network, closed the tab | Offline, weak networks, and multiple tabs |
| Its behavior doesn't match your expectation | These are not bugs |
| None of the above | When it's not covered here |

> **Extension only**: Of the items in "These are not bugs", the two about the workset and multi-page processing only happen on the extension version — the web version has no cross-tab capability.

## What the error card says

When a run errors, a card titled "Something went wrong" appears in the conversation: one suggestion tailored to this error, plus two buttons — **Open settings** (jumping straight to the relevant settings page) and **Dismiss**.

![A typical error card: the title "Something went wrong", one suggestion, and the buttons "Open settings" and "Dismiss"](/docs-assets/faq/zh/S-faq-01-error-card.png)

When in doubt, do the generic thing first: "Dismiss this and try again. Open the run steps above to see how far it got." If resending still errors, follow the sentence on the card to the matching section of this chapter — that sentence is quoted verbatim in the sections below.

## The assistant doesn't respond

**You send a message and nothing happens at all, or you're told "No model configured".** There's no usable model yet. Click **Configure model** to add one: for how to fill in the address and key see [Connections](#/docs/console-connections); for how to choose see [Choosing a Model](#/docs/models).

**The error card says "Check the model configuration in Settings, or try again."** The model is unavailable, or this request failed. Check your network first, then retry; if you've configured a model yourself, check the configuration on the Console's **LLM** page — see [Choosing a Model](#/docs/models). You'll also see this card right after a network outage; once the connection is back, just resend — see "Offline, weak networks, and multiple tabs" in this chapter.

**It sits still, as if waiting for something.** Most likely a card has popped up and is waiting for your answer: scroll up, find the unanswered one, answer it, and the run continues. If you can't find the card, click **Go to form** next to "Waiting for your input: …" above the input area to jump back to it — see [Six Interaction Cards](#/docs/interactions).

**It suddenly only chats — no skills, no page reading.** The current model doesn't support tools: check whether the model capability badge shows **No tools**, and switch to a model with a **Tools** badge; if it's a model you configured yourself, also check whether its "Supports tool calling" toggle got turned off on the LLM page. See [Choosing a Model](#/docs/models).

## The run stopped midway

Every early stop comes with a one-line reason on the interface. The full list of all eight termination reasons is in the "Why it stopped" section of [Seeing What the Assistant Is Doing](#/docs/transparency); here we only cover the ones an error card tells you directly.

**"The run exceeded its total time budget. Try a smaller task." or "Run stopped: the total run time limit (N s) was reached. Adjust it in Settings › Agent."** The task is too big: break it into steps and say them separately; if you genuinely need more time, **Open settings** on the error card jumps straight to the page where the limit is adjusted. See [Seeing What the Assistant Is Doing](#/docs/transparency).

**"The run reached its turn limit." or "Run stopped: the turn limit of N was reached. Adjust it in Settings › Agent."** Its rounds of thinking-plus-acting hit the ceiling. Same handling: break the task down first, then consider raising the limit.

**"Timed out waiting for your input."** There's a time limit on how long a card waits for your answer; past that, the run ends with "Run stopped because the form was not submitted in time". Send again, and answer promptly this time — see [Six Interaction Cards](#/docs/interactions).

**"You stopped this run."** You clicked **Stop** yourself. Nothing to handle; if you want to continue, send it again.

**"Run stopped because a lifecycle hook failed"** — you didn't do anything wrong; an internal check in the system errored. Contact the people who provide this system. See [Seeing What the Assistant Is Doing](#/docs/transparency).

**"Run stopped after too many calls to unknown tools"** — it kept trying to use a tool that doesn't exist; most likely the current skill doesn't match this page. Rephrase and retry; if that doesn't work, confirm the skill you want is enabled. See [Seeing What the Assistant Is Doing](#/docs/transparency).

**"Run did not finish"** — a catch-all message, cause unknown. Retry first; if it keeps happening, copy the Run ID and look it up in [Run History](#/docs/console-runs). See [Seeing What the Assistant Is Doing](#/docs/transparency).

## The result is wrong or off track

**The numbers in the report don't match what you see on the page.** The data was pulled at the moment you asked; it doesn't know about changes to the page after that. Send it again and it will re-pull the latest data.

**Its summary doesn't match the content you see.** It only read the region marked out in the perception notice, and only what's currently displayed. Scroll to the part you want it to see, then ask again — see [Letting the Assistant Read the Page](#/docs/page-perception).

**Its retelling doesn't match the document you gave it.** First narrow the scope: have it read only the part you care about and check again; if it still doesn't match, pasting that passage to it directly is more reliable — see [Case: Importing a Document into the System](#/docs/case-import-file).

## Can't send images / can't use voice

**An image attachment is refused, or the photo button is greyed out.** Two common causes: the image attachment toggle is off — turn on **Image attachments** under Settings → Multimodal; or the current model doesn't accept images — switch to a model whose capability badges include **Images**. See [Attachments, Images, Voice, and Camera](#/docs/attachments) and [Choosing a Model](#/docs/models).

**Voice or camera says the browser denied it.** Follow the prompt to allow the microphone or camera in the browser's site permission settings, then try again. On the extension version you first grant it once in the regular tab it opens automatically before the sidebar can use it — see [Attachments, Images, Voice, and Camera](#/docs/attachments).

**You sent a long text, but the answer reads like it didn't finish it.** Text beyond 32K characters is truncated. Send it in parts, or state up front which part you want — see [Attachments, Images, Voice, and Camera](#/docs/attachments).

**The model errors after a PDF is sent.** The current model may not accept document input: switch models, or convert the content to Word or plain text and send that.

## Page unreadable / actions not taking effect

**It says it can't see the page content.** Most likely your system hasn't enabled page perception: on the Console's **Page Skills** page, check whether the perception status says "Not enabled"; if it's indeed off, contact the people who provide this system. See [Letting the Assistant Read the Page](#/docs/page-perception).

**It says it clicked, but nothing happened on the page; or a tool call shows "Blocked by policy".** That step was stopped by a security policy, or you didn't authorize it. Clicking deny only fails that one step — the rest of the run continues; for a policy block, first read the reason it was blocked, and if you genuinely need the operation, contact the people who provide this system to adjust it. See [Letting the Assistant Act on the Page](#/docs/page-actions).

**It says it can't find the thing it's supposed to act on.** Once the page changes, the elements it noted go stale. Have it read the page again and retry — most of the time it does this on its own. See [Letting the Assistant Act on the Page](#/docs/page-actions).

## Skill problems

**The error card says "The model kept calling tools that do not exist. Check that the skill actually ships the scripts it describes."** Most likely the skill doesn't match the current page, or the skill is missing files. Rephrase and retry; if that doesn't work, verify the skill on the "Integrity & Manifest" page of the Console's skill management — see [Skill Management](#/docs/console-skills).

**The error card says "A tool schema cannot be sent to this model. Turn off Generative UI in Settings › Generative UI, or switch models."** Do exactly that, either of the two: turn off generative UI (answers fall back to text and cards), or switch models. See [Settings](#/docs/console-settings) and [Choosing a Model](#/docs/models).

**Installed, but the conversation can't call it.** Check the "Dependency cycles" and "Missing dependencies" sections on the "Integrity & Manifest" page — skills listed there are excluded from the skill catalog, and the assistant can't see them. Install the dependencies it declares, or untie the dependency loop, and it comes back — see [Skill Management](#/docs/console-skills).

**A skill's network access or data fetch was refused.** Go to the **Sandbox & Security** page in Settings: confirm the network policy isn't "Deny all", add the addresses it needs to the **Whitelist**, use **Test URL** to confirm on the spot that they're allowed through, then go back to the conversation and rerun. See [Settings](#/docs/console-settings).

## Offline, weak networks, and multiple tabs

**The network dropped mid-generation.** An error card appears ("Check the model configuration in Settings, or try again."); the part of the body already generated is kept, not wiped. Once the network is back, resend the same message directly — no need to refresh the page.

**Answers are slow on a weak network.** Slow is normal: output slows down but doesn't break. On an extremely weak network it either completes or gives a clear timeout error — it never hangs silently; the **Stop** button stays clickable throughout.

**You closed the tab mid-generation, or the computer went to sleep.** Just reopen: the session isn't corrupted, the generated part is intact, and the unfinished message is either kept half-written or clearly marked as interrupted. For a run that was stopped on a form-style card, a resume banner appears at the top after refresh — click it to pick up where you left off, see [Asking, Answering, and Interrupting](#/docs/chat-basics).

**In another tab you don't see the session you just started here, or the skill you just installed.** Both tabs share the same local storage — refresh that tab and you'll see it; and messages sent from both tabs at the same time don't overwrite each other — each history stays intact.

## These are not bugs

**Cards and buttons in old sessions won't respond to clicks.** That's a saved record ("This is a saved record — its actions are no longer available."). To act again, send a new message — see [Generative UI Responses](#/docs/generative-ui).

**A group of items looks a few entries short.** If there's a line saying "This renderer shows only the first item of a repeatable group.", that's a display limit — no data is lost; switch to another presentation to see everything, see [Generative UI Responses](#/docs/generative-ui).

**You only wanted a small tweak, but it redid the whole thing.** Ready-made artifacts with fixed templates can't be edited, so it switched to the "made on the spot" one and produced a fresh version. To save a round, state the scope and requirements in your very first sentence — see [Skills: Giving the Assistant Expertise](#/docs/skills-usage).

**Same request, different page count this time.** That's the "made on the spot" path — the page count is decided by the content and isn't fixed, see [Skills: Giving the Assistant Expertise](#/docs/skills-usage) and [Case: Building and Presenting a Slide Deck](#/docs/case-slides).

**It wrapped up before finishing the whole list.** One round can have at most 32 pages open at once — it hit the cap. Narrow the scope (the first 20 rows, only one category) and run it in two rounds; it has no way to ask you for a larger quota, so it won't bring this up on its own — see [Working Across Tabs (Extension Only)](#/docs/tabs).

**The page you just looked at suddenly won't respond.** That page was closed or navigated away and is no longer in the workset. Have it list the currently usable pages again, then continue — see [Working Across Tabs (Extension Only)](#/docs/tabs).

**The session list shows "These session files could not be read and were skipped: …".** A few session files couldn't be read this time and were skipped; the rest of your sessions are unaffected. Reopen the panel or refresh and check again; if it keeps happening, report it as in the next section — see [Managing Sessions](#/docs/sessions).

## When it's not covered here

**Look it up yourself first.** Expand that run's **Run flow** card, click **Copy run ID**, then paste it into the search on the Console's **Run History** page: replay step by step where it stopped, which tool call failed, and what the failure reason was. See [Run History](#/docs/console-runs).

**To report a problem, send three things to the people who provide this system:**

1. **The Run ID** — the single most important clue in troubleshooting; copy it as above. Note: deleting a session deletes its run records along with it, so copy it early.
2. **What you saw** — the exact words on the error card, and roughly when it happened.
3. **The diagnostics file** — on the Console's **About & Diagnostics** page under Settings, click **Export**; versions, the skill list, and the run configuration are all in there, with model keys stripped out.

![Where to export diagnostics: the "Export" button on the Settings › About & Diagnostics page](/docs-assets/faq/zh/S-faq-02-diagnostics-export.png)

The version number is on the same page — it's usually the first thing you'll be asked when reporting a problem.
