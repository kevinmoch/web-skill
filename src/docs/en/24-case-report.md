# Case: Generating an Agile Operations Report

With one sentence, the assistant pulls together the current project's sprint health, requirement distribution, defect hotspots, and test quality into a report. This chapter strings together what you learned earlier — skills, the run flow, and artifact download — into one complete task you can follow along in the [Demo](/demo).

## Before you start

- Open the [Demo](/demo) and select a project on the left, for example **SmartCloud Core Platform** — the report draws on the "current project's" data.
- A new session's message area is the welcome screen; the sentence this chapter uses is right there under "Try an example" — or type it into the input field yourself.

## Step 1: Make the request

On the welcome screen, click this quick prompt (or type it verbatim into the input field), then press Enter to send:

```
Generate an agile operations report for the current project covering sprint health, requirement distribution, defect hotspots and test quality
```

What it triggers: the assistant judges this sentence to be asking for a report, so it activates a skill — a packaged bundle of "instructions for doing something + scripts" that, once installed, lets the assistant do that thing. What gets activated here is agile-ops-dashboard, which specializes in agile operations reports.

![The moment of asking: this quick prompt on the welcome screen](/docs-assets/case-report/en/S-case-report-01-prompt.png)

## Step 2: Watch how it works

After sending, expand the **Run flow** — it's the thing most worth watching in this chapter. Behind the "Activate agile-ops-dashboard" step comes a string of tool calls. A tool is one concrete action the assistant can perform, provided by the system you're in; every number in the report comes from one of these calls:

| This call | The data it brings back |
| --- | --- |
| `list_sprints` | The current project's sprint list |
| `list_requirements` | Requirement items and their statuses |
| `list_bugs` | The defect list with severity |
| `list_test_suites` | Test suites, coverage, and pass rates |

![With the run flow expanded, a string of data-fetching tool calls is visible](/docs-assets/case-report/en/S-case-report-02-run-steps.png)

Behind one sentence, the assistant queried four kinds of data separately before aggregating. Sample run output — your actual output will differ.

Open any one of the calls to see what arguments it carried and what it brought back:

![A single tool call expanded, showing its arguments and result](/docs-assets/case-report/en/S-case-report-03-tool-detail.png)

So the report isn't something the assistant made up: every number traces back to a real query. Sample run output — your actual output will differ.

![M-25 What happens behind one sentence](/docs-assets/case-report/en/M-25.svg)

You say one sentence; the assistant fetches data from the page tools in several rounds, hands it to the report skill to aggregate, and gives the report back to you. For a full explanation of on-screen elements like phase names and tool states, see [Seeing What the Assistant Is Doing](#/docs/transparency).

## Step 3: Get the result

The report is drawn right into the conversation: sprint health, requirement distribution, defect hotspots, and test quality each get a block, and the assistant adds a headline conclusion or two.

![The agile operations report in the conversation, one block per data area](/docs-assets/case-report/en/S-case-report-04-report.png)

The report covers the four areas you named. Sample run output — your actual output will differ.

This report is also an **artifact** — a finished product of a run. Built-in skills render the report right in the conversation; if the run also produced files (like the source files of a dashboard or a document), find this run in the console's **Inspector** — every file in the artifacts section has a **Download** button. For the kinds of artifacts, how to view them in a window, and how to print, see [Artifacts: Dashboards, Documents, Slides, and Printing](#/docs/artifacts).

![The artifacts section of a run's Inspector page, each file with preview and download](/docs-assets/case-report/zh/S-case-report-05-artifact-download.png)

In the run's Inspector page, every file the run produced is listed with a download button.

## Other phrasings that work

The assistant doesn't rely on fixed incantations. The two below are also ready-made quick prompts in the Demo, and they trigger different skills producing reports of different scope:

- `Analyze the current sprint’s burndown, judge whether it can land on time, and explain the evidence and risks` — it only queries the sprint area, giving a burndown analysis and a landing judgment; narrower than the operations report.
- `Output this sprint’s progress brief using the weekly report template` — it produces a brief following a fixed weekly-report template, with a set layout.

The point is to say which scope you care about: name all four areas and you get the operations report; ask only about the sprint and you get a sprint summary. The exact wording doesn't have to be copied.

## What this used

| Step | Chapter |
| --- | --- |
| Clicking a quick prompt on the welcome screen to send a request | [Asking, Answering, and Interrupting](#/docs/chat-basics) |
| The assistant activating the report skill | [Skills: Giving the Assistant Expertise](#/docs/skills-usage) |
| The report drawn right into the conversation | [Generative UI Responses](#/docs/generative-ui) |
| The multiple data fetches in the run flow | [Seeing What the Assistant Is Doing](#/docs/transparency) |
| Downloading the report artifact | [Artifacts: Dashboards, Documents, Slides, and Printing](#/docs/artifacts) |

## Web version vs. extension version

Both are the same: make the request, watch the run, get the report, download the artifact — done the same way. The only difference is the data source: the report always draws on the data of the system you're currently in. On the extension version the assistant can work across tabs, but producing a report itself has no version difference.

## When something goes wrong

**The numbers in the report don't match what you see on the page.** The data was fetched at the moment you asked; it doesn't know about changes on the page after that. Send the sentence again and it will re-fetch against the latest data.

**A tool call shows as failed.** A single failure is nothing to worry about — the assistant usually finds another approach and carries on. If the whole run failed, expand the run flow, copy the Run ID, and look up the cause in the Console's [Run History](#/docs/console-runs).

**What you actually want is a dashboard for casting, not a report in the conversation.** That's a different skill. Send this quick prompt: `Open the current project’s delivery monitoring screen in a new window: sprint progress, defect distribution, test quality and DORA metrics on one page` — it opens a deep-blue dashboard in a new window. The report skill in this chapter only draws the report into the conversation; don't confuse the two.
