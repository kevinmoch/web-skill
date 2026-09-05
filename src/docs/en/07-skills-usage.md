# Skills: Giving the Assistant Expertise

When you ask the assistant to produce a weekly report or a monitoring dashboard, skills are what actually do the work. After this chapter you'll know how to set them in motion with one sentence, and how to confirm which one was used this time.

## What you can do

- Use one natural-language sentence to get a report, dashboard, document, slide deck, or analysis out of the assistant.
- You don't need to memorize any skill names — say what you want clearly and the assistant picks the skill itself.
- See which skill was actually used, on the message and in the run flow.
- Browse all installed skills in the Console's skill library.

## What a skill is

A skill is a packaged bundle of "instructions for doing something + scripts". Once installed, the assistant knows how to do that thing. Which skills your system has installed determines what specialized work the assistant can do.

Take the Demo (Agile Studio): it ships with 13 built-in skills, which fall into five categories by the kind of artifact they produce. An artifact is the finished product of a run — a report, a dashboard page, and so on.

| Category | Built-in skills | Artifact |
| --- | --- | --- |
| Reports | `sprint-progress-report`, `sprint-weekly-brief`, `agile-ops-dashboard`, `cross-project-health` | Structured reports shown right in the conversation |
| Dashboards | `agile-ops-screen`, `authored-screen` | Monitoring dashboards that open in a separate window, good for casting to a big screen |
| Documents | `quality-bulletin`, `authored-bulletin` | Printable bulletin documents |
| Slides | `agile-slide-deck`, `authored-slides` | Slide decks you can present and export to PDF |
| Analysis | `requirement-doc-digest`, `bug-screenshot-triage`, `sprint-closeout` | Findings about the current page or project |

What happens after you say something can be summed up in one diagram:

![From one sentence to a skill's output: your request goes through routing, activation, and execution in a sandbox, and the artifact comes back to the conversation. Routing has a fork — ask vaguely and you get a ready-made skill; set a scope or requirements and you get a made-on-the-spot one](/docs-assets/skills-usage/en/M-07.svg)

The assistant first decides which skill to use, activates it, runs it in a sandbox, and finally returns the artifact to the conversation. These stage names (Route, Activate, Execute, Complete) correspond one-to-one with what you see in the run flow. The decision has a fork: ask vaguely and it takes a "ready-made" skill; set a scope or specific requirements and it takes a "made on the spot" one.

## How to trigger a skill

**You don't need to memorize skill names or fixed phrasings.** Say what you want in natural language. The three phrasings below all ask "how is the current sprint going", and in most cases they activate the same skill:

- `Analyze the current sprint’s burndown, judge whether it can land on time, and explain the evidence and risks`
- `Analyze the current sprint’s burndown deviation and identify which requirements are slowing it down`
- Can this sprint be finished on time?

The first two come verbatim from the "Try an example" quick prompts on the Demo's welcome screen; the third is casual everyday phrasing. The assistant judges your intent, not your wording — rather than memorizing incantations, be specific about what artifact you want and which slice of data to use.

![Two phrasings of the same request both triggered the same skill](/docs-assets/skills-usage/en/S-skills-04-two-phrasings.png)

Two different phrasings activated the same skill — no fixed phrasing to memorize. Sample run output; your actual output will differ.

> **Tip**: If you weren't clear enough the first time, the assistant may pop up a card asking you for details. Just answer it as usual.

## Two kinds of skills: ready-made and made on the spot

For three kinds of artifacts — dashboards, documents, and slides — the Demo has a pair of skills each: one uses a fixed template (ready-made), the other builds to your requirements on the spot (made on the spot).

| What you want | Ready-made | Made on the spot |
| --- | --- | --- |
| Dashboard | `agile-ops-screen` | `authored-screen` |
| Document | `quality-bulletin` | `authored-bulletin` |
| Slides | `agile-slide-deck` | `authored-slides` |

What the difference means for you:

|  | Ready-made | Made on the spot |
| --- | --- | --- |
| Speed | Fast and steady | A bit slower |
| Which data it pulls | A fixed, full-scope set | The scope you specify |
| Layout / sections / colors | Can't be changed | Up to you |
| Slide count | Fixed | Decided by the content |
| Changes after generation | Not possible | Say the word and it produces a fresh version |

If anything you say carries one of these signals, the assistant goes "made on the spot":

1. You limited the data scope: "the ones on the current page", "only this category", "from this period".
2. You specified content or form: which metrics to show, how to lay out the sections, what colors, how many slides.
3. After seeing the result you ask for changes — even just "switch to a light color scheme".

Only when you vaguely ask for a standard artifact (no scope, no requirements) does it go "ready-made", because that's faster and steadier:

- "Give me an operations dashboard" → ready-made, the fastest.
- "Give me a dashboard that only shows the requirements on the current page" → made on the spot (you set a scope).
- "The dashboard is done — change the defect section to a line chart" → made on the spot (a redo).

When you ask for changes to a ready-made artifact, the assistant doesn't fine-tune the original — it switches to the made-on-the-spot one and builds a fresh version: you'll see it pull the data again and produce a new copy. It didn't misunderstand you; a fixed template genuinely can't be edited.

![Asking vaguely and asking with a scope activated different skills](/docs-assets/skills-usage/en/S-skills-06-fixed-vs-authored.png)

Asked twice in the same session: the vague ask activated the ready-made skill, the scoped ask activated the made-on-the-spot one — the two side-by-side skill badges show different names. Sample run output; your actual output will differ.

## Turning this conversation into a skill

After you've walked the assistant through getting something complex done, you can save the process, and next time one sentence reruns it. Four things to know when saving.

**First, it shows you before asking whether to save.** The assistant pops up a confirmation card whose text reads: `Save this conversation as the skill "{name}"? {description}`, and on a new line: `It will be submitted for review, not activated. Please check the preview below for anything that must not be stored.` In the interface, `{name}` is the skill's name and `{description}` is a one-line description of the skill. The "preview below" phrasing is the interface's own wording — the preview actually sits above the copy. The interface is what counts; both refer to the same preview.

**Second, saved doesn't mean usable.** What gets saved is only a skill awaiting approval: it enters the review queue and takes effect only after someone approves and publishes it. After submitting you'll see the notice: `"{name}" was submitted for review. It cannot be used until a reviewer approves and publishes it.` — until then it can't be called.

**Third, you can jump straight to it.** After submitting, the card shows a candidate ID: click **Copy candidate ID** to copy it, or click **Go to review** to jump straight to the Console's Review Queue. For how review works, see [Governance and Review](#/docs/console-governance).

**Fourth, take a look yourself before saving.** The line "Please check the preview below for anything that must not be stored" is a responsibility note written for you: the conversation may contain things you don't want kept long-term — people's names, internal numbers, one-off passwords. Read it word by word, confirm there's nothing, then click save.

![The "save as skill" confirmation card, with a preview of the skill's content](/docs-assets/skills-usage/en/S-skills-07-save-skill-confirm.png)

The confirmation card shows the full skill content to be saved, and the responsibility note about checking the preview is written right on the card.

![The "submitted for review" notice after submitting, with the candidate ID and "Go to review"](/docs-assets/skills-usage/en/S-skills-08-candidate-submitted.png)

The notice after submitting states "It cannot be used until a reviewer approves and publishes it", and gives the candidate ID and the "Go to review" entry.

> **Tip**: If you don't see this entry, your system may have turned it off. The toggle is in the Console under **Settings** → **Agent Runtime** → "Skill generation". It's on by default in the Demo.

## How to tell which skill it used

Assistant messages carry a **Skill** badge showing the name of the skill used this time.

![The skill badge on an assistant message](/docs-assets/skills-usage/en/S-skills-01-skill-badge.png)

The skill badge sits right on the message, visible at a glance. Sample run output; your actual output will differ.

At the end of the message, the **Skills used in this run** section lists every skill used this turn.

![The "Skills used in this run" section at the end of a message](/docs-assets/skills-usage/en/S-skills-02-skills-used.png)

Expand the **Run flow** card: the "Activate" step shows the skill name and how long it took (for example, "Skill activated: sprint-progress-report", with a duration like 3.9s alongside).

![The "Activate" step in the run flow, with the skill name and duration](/docs-assets/skills-usage/en/S-skills-03-trace-skill.png)

## Which skills are installed

Click **Open Console** in the chat header and go to the Console's **Library** (where skills are managed and run history is reviewed): every installed skill's origin and status is on this page. The Demo ships with exactly those 13 built-in skills; for installation and version management, see [Skill Management](#/docs/console-skills).

![The 13 built-in skills in the Console's Library](/docs-assets/skills-usage/en/S-skills-05-skill-library.png)

All 13 built-in skills on one Library page.

## Where skills run

Skill scripts run in an isolated sandbox — they can't touch your page content or private data, and can only use capabilities you've allowed. For detailed sandbox and security settings, see [Settings](#/docs/console-settings).

## Web version vs. extension version

Skill usage is the same in both: the same ways to trigger, the same skill badge and Library. The difference is data reach — on the web version, a skill can only pull data from the system you're currently in (within the system it can still aggregate multiple pages by navigating and returning); on the extension version, the assistant can also read your other open tabs, so skills that aggregate across sites get more complete data.

## When something goes wrong

**The assistant just chats in plain text without using a skill.** Usually it judged that the task doesn't need one — be specific about the artifact you want ("make it a weekly report", "generate a dashboard") and ask again. If the current model's capability badge shows "No tools", it can't call skills at all; switch to another model and try again — see [Choosing a Model](#/docs/models).

**A skill failed halfway through.** The message gives the failure reason; click **Retry** to run it again. If it keeps failing, check the details of that run in the Console's run history — see [Run History](#/docs/console-runs).

**A tool call shows "Blocked by policy".** A capability the skill requested was stopped by a security policy — accessing the network or reading files, for example. Allow the capability on the Console's **Sandbox & Security** page under **Settings**, or contact the people who provide this system — see [Settings](#/docs/console-settings).
