# Settings

The eight pages in the Console's "Settings" group govern the assistant's temperament: how long one run may last, how much power skill scripts get, how answers are drawn, whether it remembers you, and what language the interface speaks. This chapter goes page by page in sidebar order, saying one thing per page — change it, and here's what you'll see differently. Every page can be compared against the real thing in the [Demo](/demo): open the Console (in the Demo, click **Settings** in the chat header, or the skill center in the left navigation), and the bottom group in the sidebar is **Settings**.

## What you can do

- Adjust the turn and time limits of one run, and know where to change them when you hit the ceiling
- Decide whether skill scripts can reach the network, which capabilities they may use, and which must ask you each time
- Switch the rendering framework for generative UI and preview the five interaction cards
- Add a one-click quick prompt to the welcome screen yourself
- Control skill provenance: which signatures to trust, what to do with unsigned skills
- View, delete, and export the profile the assistant has built of you; switch theme and language; export diagnostics

## The eight settings pages

![M-24 What the settings affect: the eight settings pages on the left, the behaviors each of them affects on the right](/docs-assets/console-settings/M-24.svg)

When you want to change a behavior but don't know which page it's on, work backwards from this map: find the behavior on the right, and the left side tells you the page.

One house rule for all eight pages, stated up front: changes are **saved instantly** — no "Save" button to click; they apply to the **next run** and don't interrupt the one in progress; every page has **Reset to defaults** at the bottom, which first asks "Reset this page to defaults?" and then restores only that page.

### Agent Runtime

**What it's for**: how long the assistant may work at most, what happens when it gets stuck, and in what form results reach you.

**What you can do here**:

Start with the four limits in the **Agent loop** section (defaults all come from the factory settings):

| Setting | What it governs | Default |
| --- | --- | --- |
| Max turns | How many think-and-act round trips the assistant may take before giving a final answer | 1000 |
| Total timeout (seconds) | A run's total duration; time spent waiting for your card answers doesn't count | 3600 |
| Tool timeout (seconds) | How long one tool call may take before it counts as stuck | 600 |
| Max history messages | How many history messages are replayed to the model each turn | 1000 |

Hitting a ceiling stops the run, and the notice states which limit and its current value; the error card has a button jumping straight to this page — the termination-reason mapping is in [Seeing What the Assistant Is Doing](#/docs/transparency). Raising the turn and time limits costs more tokens; if you want to see what hitting the ceiling looks like, turn a limit down and try once — **remember to turn it back or click "Reset to defaults" afterwards** — it affects every run you make from then on.

- In the **Interaction** section, decide: for missing parameters, **Ask the user** or **Let the LLM fill in**; for actions needing confirmation, **Required** or **Auto-approve**; **Interaction timeout (seconds)** governs how long a card waits for you — 300 seconds by default, and an unanswered card ends the run because the form was not submitted in time.
- In the **Agent capabilities** section, toggle one by one: **Task list**, **Generative UI**, **Skill generation** (the entry that turns a conversation into a skill — off at the factory, on by default in the Demo; the effect is in [Skills: Giving the Assistant Expertise](#/docs/skills-usage)), **Delegate sub-tasks** (it hands a step to another skill, which finishes it serially before it continues — one sentence may unfold into several runs). When the current model doesn't support tools, all four are greyed out with the reason stated on the page.
- In the **Multimodal** section, decide whether images may go to the model: **Image attachments** and **Page image capture** are both off at the factory (on by default in the Demo); once on, the conversation shows capture counts — see [Letting the Assistant Read the Page](#/docs/page-perception).
- The remaining items: **Failure quarantine threshold** — a skill that fails this many times in a row is quarantined automatically (5 by default; one success resets the count); whether answers stream out word by word (**Streaming responses**) and carry **Render result blocks** at the end; three size limits (tool result, document, extracted text, in KB) — over the limit means refusal, not truncation, and the error states the actual size, the limit, and where to change it; **Temperature (optional)** left empty uses the model vendor's default. The **Lifecycle hooks** section is up to your system: when the system has registered no hooks, the section shows the empty state "No lifecycle hooks are registered."; when the system hasn't wired this entry at all, the whole section doesn't appear.

![The Agent Runtime page: sections for limits, interaction, agent capabilities, multimodal, and more](/docs-assets/console-settings/zh/S-console-set-01-runtime.png)

**Typical use**: big tasks keep hitting "the turn limit" — first break the task into smaller pieces and say them separately; if it genuinely needs a long run, then raise **Max turns**.

### Sandbox & Security

**What it's for**: how tight the isolation around skill scripts is, whether they can reach the network, and which capabilities are decided case by case. The sandbox is the isolated environment skill scripts run in: code inside it can't touch your pages or data, and can only use the capabilities allowed here — the full account of where data goes is in [Privacy and Where Your Data Goes](#/docs/privacy).

**What you can do here**:

- Choose how skill scripts run: **Auto** (default; automatically picks the strongest isolation available), **Blob worker**, **Iframe sandbox** (the strongest isolation in a browser). No special reason, no need to touch it.
- Set the **Network policy**: **Deny all** (default) / **Allow all** / **Whitelist**. When a skill script wants the network and gets stopped, the failure reason says it was a policy refusal, not a connectivity problem.
- In **Outbound URL policy**, open up plain http or private-network addresses (both off by default), and verify on the spot with **Test URL** whether an address passes — it goes through the same judgment as a real install.
- Turn on as needed (all off at the factory): **Skill data sources** (register by name the addresses skills may pull data from; each pull is limited to 1000 KB by default), **TypeScript support**, **Allow opening documents**, **Let skill scripts read uploaded files** (each read still asks you first; one file is limited to 20 MB by default — over the limit means refusal, not truncation. The Demo turns this one on by default). **Allow reading downloaded files** corresponds to an extension-version capability — see the edition differences at the end of the chapter.
- Set a level for each of the five capabilities: **On** (just do it) / **Require approval** (pop a card asking you) / **Off** (refuse outright) — Read references, Read assets, Write artifacts, and Confirm default to on at the factory; **Fetch data source** defaults to off (on by default in the Demo). **Approval scope** decides how long one approval lasts: **Once per run** (default) or **Every call**.

![The Sandbox & Security page: execution mode, network policy, and per-capability switches](/docs-assets/console-settings/zh/S-console-set-02-sandbox.png)

**Typical use**: a skill's network request was stopped by policy — add its address to the **Whitelist**, confirm it passes with **Test URL**, then go back to the conversation and rerun.

### Generative UI

**What it's for**: which rendering framework draws the tables, charts, and forms the assistant generates, and which layout presets it may choose from. This is the only place in the whole documentation where rendering framework names appear — because that's what the interface says.

**What you can do here**:

- Pick one of four frameworks: **Native (React)** (default, shipped with the product), **A2UI**, **OpenUI**, **Vercel AI SDK**. **A2UI** and **OpenUI** need your system to install the corresponding parts first — without them they're greyed out with what's missing stated; **Vercel AI SDK** carries a "Preview" badge and is a data-preview option that involves no installation. Switching takes effect on the spot — go back to the conversation and you can see the difference in presentation; the way repeatable groups display, for instance, varies by framework — see [Generative UI Responses](#/docs/generative-ui).
- In the **Interaction cards** preview area, see directly how the five cards (ask, confirm, form, select, authorize) look under the current framework and the current theme.
- Under **Scenario presets**, check which layout presets the assistant may choose from; when the **Generative UI** master switch on the Agent Runtime page is off, everything here is greyed out.
- Browse the **AI component catalog**: the components the assistant can draw, listed row by row with "When to use it".

![The Generative UI settings page: four rendering frameworks and the interaction-card previews](/docs-assets/console-settings/zh/S-console-set-03-genui.png)

**Typical use**: a card's style looks wrong — first confirm in this page's preview area that this is indeed how the current framework renders it, then decide whether to switch.

### Quick Prompts

**What it's for**: the one-click instruction cards on the conversation's welcome screen are added, edited, and removed here.

**What you can do here**:

1. Click **Add quick prompt**.
2. Fill in **Chinese text** and **English text** (at least one; the language you leave empty borrows the one you filled), and optionally pick a built-in icon.
3. Click **Save**. Back in the conversation, start a new session and it's on the welcome screen; clicking the card sends exactly the text you wrote.

![The edit dialog for adding a quick prompt](/docs-assets/console-settings/zh/S-console-set-09-add-prompt.png)

- Each prompt can be **Edit**ed or **Remove**d (with confirmation; removing only affects the welcome screen — existing conversations are untouched). There's a craft to writing them: no blanks left to fill in, no hard-coded item numbers — one click and it runs. One of the Demo's built-ins can serve as a model: `Analyze the current sprint’s burndown, judge whether it can land on time, and explain the evidence and risks`.
- **Prompts shown in the chat** defaults to 8, at most 20; add more than that and the welcome screen shows only the first few — this page warns you.
- **Restore host defaults**: clears your edited list so your system puts back its own prompts next time — with confirmation, and every prompt you edited here is lost.

![The Quick Prompts page: the prompt list and the display count](/docs-assets/console-settings/zh/S-console-set-04-prompts.png)

**Typical use**: turn the question you ask every week into a prompt — like `Output this sprint’s progress brief using the weekly report template` — and from then on one click sends it.

### Trust & Signing

**What it's for**: which skill signatures to trust, and what to do with unsigned skills. It governs "where a skill comes from and whether it's believable", paired with the install page of [Skill Management](#/docs/console-skills).

**What you can do here**:

- Set the policy for **Unsigned skills**: **Allow** (no notice at all) / **Warn** (default; installs as usual, but with one more confirmation and a recorded warning) / **Deny** (simply won't install). Changes affect the install page's pre-check results on the spot.
- Add keys under **Trusted signing keys** (fill in a label and the public key); the key ID is computed by the interface — no hand-copying. Two sentences to read carefully: a public key bundled inside a skill package creates no trust by itself; with an empty trust store, choosing **Deny** rejects every skill.

![The Trust & Signing page: the unsigned-skills policy and the trusted-key list](/docs-assets/console-settings/zh/S-console-set-05-trust.png)

> **Note**: Page actions you checked "Don't ask again" for on an authorization card are not on this page. They're in the **Remembered page actions** section of the **Page Skills** page in the **Connections** group — **Revoke** entry by entry or **Revoke all**; what the revoke entries look like and the detailed steps are in [Connections](#/docs/console-connections); the rules of the authorization card itself are in [Letting the Assistant Act on the Page](#/docs/page-actions).

**Typical use**: after installing a skill from an unfamiliar source, set **Unsigned skills** to **Warn** or **Deny** — then anything you add to the library afterwards gives you peace of mind.

### Privacy & User Modeling

**What it's for**: answering "what has it remembered about me" — and letting you see it, change it, and take it with you. A fuller account of where data goes: [Privacy and Where Your Data Goes](#/docs/privacy).

The master switch **Learn from how you answer** is **off** at the factory: off means nothing is recorded and the profile stays blank (the Demo turns it on for demonstration, so you see it on there). Once on, it records what the assistant asked you and what you answered, then distills that into a profile sent to the model in later conversations — every item you fill into a form may become model input.

**See it.** **What the model has been told about you** is no black box: the profile is a list of plain, readable conclusions, each marked **High confidence** or **Low confidence**, and you can read them one by one. These are inferred from past answers — not things you stated.

![The profile entry list: each entry is a readable conclusion with a confidence mark](/docs-assets/console-settings/zh/S-privacy-02-profile-entries.png)

**Change it.** Every entry can be deleted individually (with a second confirmation) — it's not wipe-all-or-nothing: delete whichever entry is wrong. This is the two ends of one thing together with the suggested values on interaction cards and the auto-suggestions in forms: over there it makes suggestions based on these entries; over here you take out the ones you don't accept (see [Six Interaction Cards](#/docs/interactions) and [Case: Filling Out a Form with One Sentence](#/docs/case-fill-form)).

![The confirmation when deleting a single profile entry](/docs-assets/console-settings/zh/S-privacy-03-delete-confirm.png)

**Take it with you.** **Export** saves the profile to a file, and you can uncheck entries you don't want to take before exporting; **Import** first shows a preview of the changes: how many new, how many overwritten, and which site the profile came from — look before you confirm.

![The change preview before importing: how many added and overwritten, and the origin site](/docs-assets/console-settings/zh/S-privacy-04-import-diff.png)

One hard rule: if content that looks like passwords or keys has crept into a profile file, **both export and import are refused outright** — not waved through with a warning. The reason: such files routinely end up attached to emails or dropped into cloud drives, and credentials riding along become a long-term leak. When an import is refused, a dialog titled **Import failed** pops up — the failure reason inside is the raw message thrown by the underlying layer, not the page being broken.

![The notice when a profile containing credentials is rejected](/docs-assets/console-settings/zh/S-privacy-05-credential-rejected.png)

A few more things you can do:

- Turning off the master switch asks once: **Also clear it** or **Keep it** for what's already recorded — the switch alone deletes no data.
- **Clear behaviour records** and **Clear refined profile** are two independent buttons, and both need a second click to really delete; deleting the profile doesn't delete the raw records, and vice versa.
- **Refine now** re-summarizes from the stored records; with an empty profile it won't conjure entries out of thin air — it gives you a clear empty-result statement.
- **Encrypt stored records** is on by default: the records and the profile on this machine are stored encrypted.
- Two limits: the profile sent to the model stays under 4 KB by default (older, lower-confidence entries are dropped first); behaviour records are kept to 500 by default (the earliest are dropped).

![The Privacy & User Modeling page: the master switch, the profile list, and the clear buttons](/docs-assets/console-settings/zh/S-console-set-06-privacy.png)

**Typical use**: an entry in the profile is wrong — delete that one entry on the spot; no need to wipe the whole profile.

### Appearance

**What it's for**: the theme and language of the assistant panel and the Console themselves — unrelated to your website's appearance. This is the only place to change them: the "Switch language" entry in the chat header changes the same thing — see [A Tour of the Chat Interface](#/docs/chat-tour).

**What you can do here**:

- **Theme**: **Light** / **Dark** — changes only the colors of the assistant panel and the Console themselves, not your website (this documentation page is always dark; the two don't affect each other).
- **Language**: English / 中文. The interface copy is fully bilingual — one switch, and every sentence on both the Console and the conversation side changes together.
- **Dictation language**: which language voice input recognizes in — by default **Follow UI language**: switch the interface to English and dictation recognizes English accordingly.

Every switch takes effect on the spot, no refresh needed; refresh or come back the next day and the choice still holds. Theme and language are one and the same setting: whether you arrive at this page from the chat panel or the Console, you're changing the same place.

![The Appearance page: theme, language, and dictation language](/docs-assets/console-settings/zh/S-console-set-07-appearance.png)

**Typical use**: the interface is in the wrong language — switch it on this page; no need to touch the browser's language settings.

### About & Diagnostics

**What it's for**: what information to bring when reporting a problem — all on this page.

**What you can do here**:

- See the **Version** number: the first thing you'll be asked when reporting an issue.
- See **Storage** (used / total); when the system hasn't reported it, a dash is shown — nothing's broken.
- Expand **Wired capabilities**: when an item shows "Not wired", its entry points are hidden — "why don't I have this button" finds its answer here.
- Click **Export** to download a diagnostics file: version, skill list, and runtime configuration are in it; model keys are stripped. Attach it when reporting problems; the full troubleshooting flow: [FAQ and Troubleshooting](#/docs/faq).

![The diagnostics export button](/docs-assets/console-settings/zh/S-console-set-11-diagnostics.png)

![The About & Diagnostics page: version, storage, wired capabilities, and the danger zone](/docs-assets/console-settings/zh/S-console-set-08-about.png)

At the very bottom of the page is the **Danger zone**: **Reset** restores every runtime setting to the factory defaults, and your configured model credentials are cleared along with them — with a second confirmation, and no undo; skills, sessions, the audit log, and trust keys are untouched — it resets settings, not data.

**Typical use**: settings got messy and you can't be bothered to revert item by item — first click **Reset to defaults** on the page in question; when everything's a mess, use **Reset** here.

## Web version vs. extension version

Both forms have all eight settings pages with essentially the same content. Two differences:

- **Where it's stored**: both sides' settings live only in this browser on this device and don't follow your account — switch browsers or devices and you set them again, and the profile doesn't sync over either (which is exactly why the profile offers export and import).
- **Where individual switches apply**: **Allow reading downloaded files** corresponds to the extension version's "let it read the file you just downloaded" capability (see [Let It Read the File You Just Downloaded (Extension Only)](#/docs/downloaded-files)). Most web-version systems haven't wired this capability — the note next to the switch says "Turning it on also requires the host to wire up a downloads reader." — and turning it on has no real effect there.

## When something goes wrong

**You changed a setting and the conversation shows no difference.** Changes apply to the next run; the one in progress is unaffected — send it again to verify. Settings are saved instantly, so don't go looking for a "Save" button; switch away and back, refresh the page — you should see the new value.

**You forgot what you changed.** **Reset to defaults** at the bottom of each page restores only that page (with confirmation); to revert everything, use **Reset** in the **Danger zone** at the bottom of the **About & Diagnostics** page — mind that it also clears your configured model credentials.

**A skill's network or data access was refused.** Go to the **Sandbox & Security** page: first confirm the **Network policy** isn't "Deny all", add the address it needs to the **Whitelist**, confirm it passes on the spot with **Test URL**, then go back to the conversation and rerun.

**A switch is greyed out, or a whole group of settings is gone.** Greyed-out usually means the current model doesn't support tools (the **Agent capabilities** group, with an explanation on the page); a whole group missing means your system doesn't provide the corresponding capability — check under **Wired capabilities** on the **About & Diagnostics** page.
