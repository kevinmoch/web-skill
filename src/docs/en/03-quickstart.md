# Up and Running in Five Minutes

Follow this chapter once through and you'll complete your first full conversation in the [Demo](/demo): from opening the assistant, to watching it pull data and analyze, to getting a conclusion. The whole thing takes about five minutes.

## After these five steps, you can

- Complete a full conversation in the Demo on your own: it pulls data, analyzes, and gives a conclusion
- Read what the notices on the run interface are telling you
- Know which chapter each part corresponds to, so you have somewhere to go when you want more

## Step 1: Open the Demo

Open this site's [Demo](/demo) in your browser (Agile Studio, a sample project management system), and pick any project in the left sidebar — from here on, the data the assistant pulls is for the "current project".

![The Demo home page, with the assistant entry marked by an arrow on the right edge](/docs-assets/quickstart/en/S-quickstart-01-demo-entry.png)

The assistant entry is on the right edge of the page, called **Expand AI copilot**.

## Step 2: Open the assistant

Click **Expand AI copilot** and the chat drawer slides out from the right. Before your first conversation, the message area is the welcome screen: under "How can I help you today?", the "Try an example" quick-prompt area lists ready-made prompts — clicking one is the same as sending that sentence.

![The welcome screen in the chat drawer: the greeting and the "Try an example" quick prompts](/docs-assets/quickstart/en/S-quickstart-02-welcome.png)

That's the whole welcome screen: one greeting, plus a set of ready-made prompts you can click directly.

## Step 3: Make your first request

In "Try an example", find the one below (it's in the screenshot above) and click it to send; if you can't find it, type it into the input field exactly as written and press Enter:

`Analyze the current sprint’s burndown, judge whether it can land on time, and explain the evidence and risks`

What it triggers: this sentence has the assistant call a skill — a packaged bundle of "instructions for doing something + scripts"; once installed, the assistant knows how to do that thing. The skill first pulls the current sprint's real data and then analyzes it. The whole process is one complete run — just right for watching how it works from start to finish.

## Step 4: Watch the assistant work

After sending, watch for three things in order:

1. **Thinking…** — the run has started; the assistant is organizing its approach.
2. **{count} tool calls** — a tool is one concrete action the system you're in provides to the assistant, like "read the sprint list"; every data fetch counts as one call, and the run area keeps a count.
3. **Run flow** — expand it to see each step of this run advancing in order.

![M-03 The full flow of one conversation (simplified)](/docs-assets/quickstart/en/M-03.svg)

You ask; the assistant understands, picks a skill and tools, pops a card to ask you when necessary, then executes and gives the result — the notices you see on the interface correspond to the parts of this diagram.

![A conversation mid-run: thinking and tool calls both in progress](/docs-assets/quickstart/en/S-quickstart-03-running.png)

What it looks like before the run has finished. Sample run output; your actual output will differ.

Recognizing them is enough for now; for a detailed reading, see [Seeing What the Assistant Is Doing](#/docs/transparency).

## Step 5: Get the result

When the run ends, the answer gives a complete judgment: whether the current sprint can wrap up on time, on what grounds, and where the risks are. The answer is laid out with headings and lists — just read it. Not happy with it? Hover over the message you sent and click **Retry** to have it run again.

![The final result of the burndown analysis: the wrap-up judgment, its grounds, and the risks](/docs-assets/quickstart/en/S-quickstart-04-result.png)

Same run as the previous screenshot, at its final result. Sample run output; your actual output will differ.

## What you just used

| What happened | Chapter |
| --- | --- |
| Clicking a quick prompt on the welcome screen and sending a message | [Asking, Answering, and Interrupting](#/docs/chat-basics) |
| The assistant picked a skill for the job on its own | [Skills: Giving the Assistant Expertise](#/docs/skills-usage) |
| Thinking…, tool calls, run flow | [Seeing What the Assistant Is Doing](#/docs/transparency) |
| The formatted, rendered answer | [Generative UI Responses](#/docs/generative-ui) |
| Switching to another model and running again | [Choosing a Model](#/docs/models) |

## What to read next

- To have it read the page you're looking at: [Letting the Assistant Read the Page](#/docs/page-perception)
- To have it fill forms and click buttons for you: [Letting the Assistant Act on the Page](#/docs/page-actions)
- To follow along on one complete task: the case studies start with [Case: Generating an Agile Operations Report](#/docs/case-report)

## Web version vs. extension version

This chapter's five steps are done the same way in both forms. The Demo itself is the web version; on the extension version the assistant sits in the browser's sidebar — same steps, except the places it can pull data from aren't limited to the current site. For how to tell the forms apart, see [Web and Extension Editions](#/docs/editions).

## When something goes wrong

**It shows "Run stopped because the model request failed".** Most likely a network or model-configuration problem. Check your network first, then hover over your message and click **Retry**; if you've configured a model yourself, check the configuration following [Choosing a Model](#/docs/models).

**It replied with plain text — no data pulled, no analysis.** Most likely the current model can't call tools. Look at the model capability badges in the input area; if they show "No tools", switch to another model and send the same sentence again.

**You changed your mind mid-generation.** Click **Stop** (the same button that was Send) — what's already generated stays; or simply send a new message with a different ask.
