# Privacy and Where Your Data Goes

Working with the assistant, one question can't be avoided: the things you say, the pages it reads, the files you upload — where do they all end up? This chapter lays it out in three buckets: what stays on this machine, what goes to the model, and what never leaves — each bucket verifiable in the interface, each with a switch left in your hands.

## What you can do

- See where each kind of data goes: what stays on this machine, what is sent to the model service you configured, and what never leaves
- Understand the boundary of its permissions: it can only see and operate what you can see and operate in the interface
- Know what actually goes out when you send a Word file, an Excel file, a pdf, or an image
- Turn off the sending of page images, turn off "Learn from how you answer", and delete what it has remembered entry by entry — the switches are in the table at the end

## One diagram: where the data goes

The assistant runs in your browser: the only place it stores data is this browser, and the only direction it sends data is the model service you configured yourself on the Console's **LLM** page (for how to configure it, see [Connections](#/docs/console-connections)).

![M-33 Where the data goes: sessions, memory, skill files and settings stay on this machine; your questions, page content, tool results and attachment content go to the model; password field values never leave](/docs-assets/privacy/en/M-33.svg)

Three destinations in one diagram: the left zone is stored on this machine, the middle zone goes with the conversation to the model service you configured, the right zone never leaves; the original Word and Excel files stay on this machine — only the text read out of them is sent.

Which model you pick also decides what leaves: with the **Chrome built-in** option, model requests don't leave this machine (the trade-off: no tool support, plain chat only); and the **Demo model** that answers when no model is configured makes no network requests either. See [Choosing a Model](#/docs/models).

## Its permissions are your permissions

Before talking about "what gets sent out", get a more fundamental question straight: what data can it read and touch at all — where is the boundary? The answer: it has no channel of its own; the entrance is the very interface in front of you.

- **The read side**: what it reads is the page content the browser renders, not data fetched around the back from some backend API. Whatever you can see on the interface is what it can see; things not shown on screen — collapsed panels, in-app tabs not switched to, hidden fields — don't enter its view. And the page tools provided by your system pull from the same source the page shows you (in the Demo, the two read the very same data).
- **The write side**: the buttons it can click and the fields it can fill are controls the page already put there for you, performing the same clicks and typing as a hand would; when it operates on a page where you're logged in, the system sees it as you operating (for the rules, see [Letting the Assistant Act on the Page](#/docs/page-actions)).

**So**: it can't read data you have no backend permission to see, and it can't touch data you have no right to maintain — the assistant reads and acts on your behalf within your own permissions, never overstepping. On top of that, the scope can shrink further: your system can mark out excluded regions, and the extension version reads and writes only in the tabs you hand to it (see [Letting the Assistant Read the Page](#/docs/page-perception) and [Working Across Tabs](#/docs/tabs)).

> **Tip**: "Never exceeding your permissions" doesn't mean "what's read stays put" — which read content goes to the model is the next section's business.

## What gets sent to the model

On every turn of the conversation, the following goes together to the model service you configured:

- **Your question**, plus the earlier conversation in the current session (how many messages are replayed has a cap, adjustable in [Settings](#/docs/console-settings)).
- **The page content the assistant read.** Which region gets read is marked out by the system you're in; what was read and what was excluded are both written in the conversation (see [Letting the Assistant Read the Page](#/docs/page-perception)).
- **The result of every tool call.** A tool is one concrete action the assistant can perform; whoever provides the tool is where the call executes: tools provided by the system you're in execute on the system side; a remote service you connected on the **MCP Endpoints** page receives the content of that call.
- **The attachments you put into a message** — what goes out differs by type; the next section takes them one by one.
- **The few conclusions distilled into your profile** — this item exists only when "Learn from how you answer" is on; see "What the assistant remembers" below.

Once this content leaves this machine, the data policy of the model service provider you chose applies, subject to the actual configuration of the system you're in.

## What is never sent

**Password field values.** They don't enter the result of page perception — even if the system forgot to mark them as an excluded region, their values don't enter the assistant's view; the same goes for fields the page deliberately hides. And they are never remembered: for any password-type control, you confirm in person every single time — the authorization card offers no "Don't ask again" option, and the value to be filled shows on the card as a row of dots (for the operating rules, see [Letting the Assistant Act on the Page](#/docs/page-actions)).

The boundary needs saying plainly: this does not mean "no sensitive content is ever sent" — content in ordinary input fields, as long as it sits inside a region being read, goes to the model along with the read. For anything involving passwords, IDs, or money, don't count on it to tell the difference for you: have the system you're in mark that region as excluded, or don't let the assistant read that page.

## What about the file I uploaded

Attaching a file to the input field doesn't mean it's sent — it only counts once you click **Send**. What goes out differs by attachment type:

| You send | What actually goes out |
| --- | --- |
| Image | The image itself; oversized ones are compressed first, and what's compressed is only the copy that goes out — the original file on your machine is untouched |
| Text (txt, md, csv, etc.) | The text in the file; anything beyond 32K characters is truncated |
| File (pdf) | The whole file; requires the current model to support document input |
| Doc text (docx, xlsx) | Read into text in your own browser before sending — what goes out is only the body text read out; images and layout in the document are not included — the original file is not sent in whole |

> **Extension only**: Having it read files from your download folder takes the same path with the same formats — what goes out is exactly the same as uploading by hand; the only difference is that both listing the folder and reading a file need your nod first (see [Let It Read the File You Just Downloaded](#/docs/downloaded-files)).

## Images on the page

By default the assistant reads text only — **not a single image is sent out**. If you want it to look at images too, turn on a switch first: in the Console, the **Agent Runtime** page in the **Settings** group, the **Multimodal** section — **Page image capture** (the same switch also lives on the **Page Skills** page in the **Connections** group). It's off out of the box; the Demo has it on for demonstration. Turn it back off and text is still read while not a single image is sent.

![M-14 Which parts of a page the assistant can see](/docs-assets/page-perception/en/M-14.svg)

What gets read is body text, tables, and form labels; password field values are not read; whether page images are read is controlled by your toggle.

Two prerequisites: the model capability badge must show "Images", and each message has count and size limits for images. For the count notices shown once it's on, see [Letting the Assistant Read the Page](#/docs/page-perception).

![The Page Skills page: the Page image capture toggle and the recent reads are both on this page](/docs-assets/console-connections/en/S-console-conn-04-page-skills.png)

Right next to the switch is **Recent reads** — the time and region of every read can be checked.

## What the assistant remembers

**Memory first.** What the assistant remembers falls into three layers (belonging to a session, to a skill, and about you), all stored on this machine, each entry visible and deletable in the **Memory browser** on the Console's **Sessions & Memory** page (see [Run History](#/docs/console-runs)); the memories it reads enter the current turn of conversation just like tool results.

**Then the profile — the item most easily misunderstood.** The master toggle **Learn from how you answer** on the **Privacy & User Modeling** page in the Console's **Settings** group is off out of the box: off means nothing is recorded and the profile stays blank (the Demo has it on for demonstration). Once it's on, the three things involved go to different places:

| The thing | Where it goes |
| --- | --- |
| The raw records of what you answered and picked | Stay on this machine, stored encrypted; at most 500 entries are kept, the oldest dropped beyond that |
| The few conclusions distilled from them | Sent to the model along with the prompt on every turn — without sending them, it has no way to know your habits. There's a length cap (4096 bytes by default; older and lower-confidence entries are dropped first beyond it) |
| The profile itself | Exists only on this machine, not synced across devices; to move to another device, carry it over yourself with export and import |

So "your preferences are stored only locally and never sent out" doesn't hold: **the raw records are not sent out, but the distilled conclusions are handed to the model as context.** If some entry shouldn't be sent, delete it one by one on the **Privacy & User Modeling** page (with a second confirmation); if you don't want the whole thing at all, turn off the master toggle — it will ask whether to "Also clear it" or "Keep it". For the full description, see [Settings](#/docs/console-settings).

![The Privacy & User Modeling page: the master toggle, the profile list, and the clear buttons](/docs-assets/console-settings/en/S-console-set-06-privacy.png)

The profile is not a black box: every entry is a plain readable sentence, deletable one by one.

![The profile entry list: each entry carries a confidence mark](/docs-assets/console-settings/en/S-privacy-02-profile-entries.png)

## What you can control

| I want to control | Where the switch is |
| --- | --- |
| Whether page images go out with a read | Settings → Agent Runtime → Multimodal → **Page image capture** (see [Letting the Assistant Read the Page](#/docs/page-perception)) |
| Whether image attachments can be sent | **Image attachments**, in the same section (see [Attachments, Images, Voice, and Camera](#/docs/attachments)) |
| Whether it learns from my answers | Settings → Privacy & User Modeling → **Learn from how you answer** (see [Settings](#/docs/console-settings)) |
| A profile entry it remembered is wrong | Delete entries one by one on the same page |
| What it has stored in each memory layer | Run History → Sessions & Memory → **Memory browser** (see [Run History](#/docs/console-runs)) |
| Whether skill scripts can reach the network | Settings → Sandbox & Security → **Network policy** (see [Settings](#/docs/console-settings)) |
| Remembered authorizations (page actions, downloaded files) | Connections → Page Skills → **Remembered page actions**, **Revoke** one by one (see [Connections](#/docs/console-connections)) |
| Whether it saves conversations as skills | Settings → Agent Runtime → **Skill generation** (see [Settings](#/docs/console-settings)) |
| Whether it can read downloaded files (extension version) | Settings → Sandbox & Security → **Allow reading downloaded files** (see [Let It Read the File You Just Downloaded](#/docs/downloaded-files)) |
| Which model to use — including one that runs on this machine | Connections → LLM (see [Choosing a Model](#/docs/models)) |

## Where the data is stored

Sessions and run history, the three memory layers, the profile and behaviour records, installed skills, your settings — all of it is stored in this browser on this device, and none of it follows an account: switching browsers or devices means starting over, and the profile doesn't follow you either (which is exactly why it has export and import).

- The profile and behaviour records are stored encrypted, and **Encrypt stored records** is on by default.
- When a skill is used, its instructions are handed to the model as conversation context; its scripts run in an on-device sandbox (an isolated environment for skill scripts — they can't touch your pages or data) and can't reach the network by default (for how to open it up, see [Settings](#/docs/console-settings)).
- Model keys are stored on this machine and never shown in plain text in the interface; they're stripped out when a diagnostics file is exported (see [Settings](#/docs/console-settings)).
- Deleting a session has no undo: the session and its run records are permanently deleted together (see [Managing Sessions](#/docs/sessions)); the browser's "clear site data" wipes the sessions along with everything else.
- To see how much space is used on this machine, check **Storage** on the Console's **About & Diagnostics** page.

![The About & Diagnostics page: version, storage, wired capabilities](/docs-assets/console-settings/en/S-console-set-08-about.png)

## Web version vs. extension version

The storage rules are the same in both forms: everything is stored on this machine; the password-field rules, the image toggle, and the profile's behavior are also the same. The difference is **how much can be read**:

- The web version can only read the one site it lives on; the extension version can read any web page you open — so the page content that goes out comes from a wider range of sources.
- Bigger capability, same constraints: password fields still aren't read and are still never remembered, the image-capture switch still applies, and it still says plainly when it can't read something.

> **Extension only**: The extension version can also read your download folder with your authorization — one card for listing, one card for reading a file; it never receives a file's location on your disk, and files are read-only to it. Remembered authorizations are revoked on the **Page Skills** page — see [Let It Read the File You Just Downloaded](#/docs/downloaded-files).

## When something goes wrong

- **Worried that some profile entry is being sent to the model.** Read and delete entries one by one under Settings → Privacy & User Modeling; if you don't want the whole thing at all, turn off **Learn from how you answer** and choose "Also clear it" when turning it off.
- **An image-capture count appeared in the conversation, and you don't want images sent.** Turn off **Page image capture** (Settings → Agent Runtime → Multimodal); attachment images have their own switch, **Image attachments**, in the same section.
- **You want to verify which region it actually read one time.** Look at the perception notice on that answer — what was read and what was excluded are both written there; afterwards, check entry by entry in **Recent reads** on the **Page Skills** page.
- **You want to wipe the data on this machine clean.** The profile and the raw records are two separate clear buttons, and each needs a second click to actually delete; deleting sessions is irreversible once confirmed; to wipe everything, use the browser's "clear site data".
