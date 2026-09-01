# Connections

The assistant can answer and get work done thanks to two kinds of sources: which model it thinks with, and which tools it can call — a tool is one concrete action it can perform, like "read the requirement list" or "navigate to a page". The four pages in the Console's **Connections** group manage these sources. Day-to-day chatting never comes here; you come when you need to fill in a model's address and key, hook up more tool sources, or figure out "why can/can't it do this".

## What you can do

- Add models, test connections, and set the default on the **LLM** page
- Connect external tool services on the **MCP Endpoints** page and see their connection state and tool lists
- Toggle the tools the current web page itself provides on the **WebMCP Tools** page
- See which temporary skills the current page gives the assistant and which page region it can read on the **Page Skills** page
- Enable or disable individual tools one by one, and revoke page-action authorizations you checked "Don't ask again" for

## What the four pages manage

The capabilities behind one answer can come from four places: skills installed in the Library (packaged "instructions for doing something"), page tools provided by your system, tools the web page itself reports, and tool services elsewhere on the network. Add "which model", and you have exactly what this group's four pages manage.

![M-23 Where tools come from: four sources — skills, page tools, the web page's own tools, and remote tool services — flow into the capabilities available to the assistant](/docs-assets/console-connections/M-23.svg)

The four sources merge into the same capability list; whichever source isn't connected, its capabilities are absent from the list.

### LLM

**What it's for**: every model the assistant can use is in this list. The conversation can switch per session (see [Choosing a Model](#/docs/models)); unswitched sessions use the default; when none has been added at all, it falls back to the built-in demo model — you can chat, but no real model service is connected; it's a demonstration.

**What you can do here**:

- Click **Add model** and fill in **Display name**, **Provider**, and the **Model** name; the providers are OpenAI-compatible / Anthropic / Google / Chrome built-in
- If the service gave you a dedicated address, fill in **Base URL (optional)**, and put the key in **API key** — after saving, the list never shows it in plain text
- Click **Test connection** to run a real probe: "Endpoint reachable" or "Endpoint unreachable or not configured", and whether "Streaming supported" — each with a stated reason
- Use **Use as default** to designate the default model for new sessions; removing asks for one more confirmation

![The LLM page: each model shows its display name, provider, and model name, and the default carries a badge](/docs-assets/console-connections/zh/S-console-conn-01-models.png)

The default carries a Default badge; keys are never shown in plain text.

**Typical use**: after getting an address and a key from a model provider — Add model, pick the provider, fill in Base URL and API key, click Test connection, see "Endpoint reachable", save, then Use as default. The first model automatically becomes the default; when you remove the default, the default falls to the first remaining entry.

Two switches whose consequences you should know: turning off **Supports tool calling** reduces the model to plain chat — no skills, no page reading; turning off **Supports image input** means you can't send it images. The **Chrome built-in** option runs on this machine and needs no key, but doesn't support tool calling.

### MCP Endpoints

**What it's for**: connecting tool services from outside your system. MCP is a general way of plugging in; one endpoint is one tool service's address; whether it's connected and which tools it offers are all on this page.

**What you can do here**:

- Click **Add endpoint** and fill in **Name**, **URL**, **Transport**, plus **Headers** when needed
- See each endpoint's status: Connected / Connecting / Failed / Unavailable; failures state the reason — a misspelled hostname, a service that isn't up, and rejected credentials each get their own wording
- Click **Test** to run a real round trip and report its latency, with a locatable **Failure detail** when it fails
- Manage endpoints with **Reconnect** / **Disable** / **Remove**; removing asks for one more confirmation, and its tools become unavailable immediately. Adding and removing are both recorded in the audit log of [Governance and Review](#/docs/console-governance)
- Some services require signing in first: turn on **Use OAuth** when adding; the row then shows Not authorized / Authorized / Authorization expired, and when it expires you click **Authorize** to sign in again
- In the **Endpoint Registry** below, see every tool offered by the connected endpoints, and click a tool name to see which arguments it asks for

![The MCP Endpoints page: the endpoint list shows connection state and tool count live, with failure reasons next to the status](/docs-assets/console-connections/zh/S-console-conn-02-mcp.png)

Status, tool count, and egress-policy badge are all in the row.

**Typical use**: the Demo ships with an `agile-page` endpoint — your system (Agile Studio) offers its tools to the assistant through it, 10 in all. Eight of them serve the business: querying requirements, sprints, defects, and test suites, fetching metrics, listing projects, switching pages, and getting form-fill suggestions; the other two (`list_skill_files`, `write_skill_file`) work on skill files themselves, letting the assistant read and modify the skills you've installed — [Case: Turning What You Just Did into a Skill](#/docs/case-skill-lifecycle) runs on them. Saying `Take me to the defect management page` in the conversation goes through the page-switching tool among them.

![The Demo's page endpoint and its 10 tools in the Endpoint Registry](/docs-assets/console-connections/zh/S-console-conn-05-agile-page.png)

Every tool can be enabled or disabled individually. If you don't want the assistant switching pages on its own, flip that one tool to Disabled — the endpoint's other tools keep working.

![A single tool's three-way toggle: Enabled / On demand / Disabled; when its endpoint is disabled the tool is marked "Endpoint is disabled"](/docs-assets/console-connections/zh/S-console-conn-06-tool-toggle.png)

> **Note**: When adding an endpoint, **Allow plain http for this endpoint** and **Allow private and loopback hosts for this endpoint** are both off by default — check them only after confirming; and they can only be opened within what Settings › Sandbox & Security has already allowed — when it's globally forbidden, the checkboxes here can't be checked. MCP services come in two kinds: those with a network address, and those started by a command line on your computer; the browser can only connect the former.

### WebMCP Tools

**What it's for**: seeing which tools the web page you're looking at provides by itself. WebMCP is a standard channel in the browser: pages report tools directly to the assistant through it, with no extra wiring from your system. The page carries an Experimental badge; capabilities may change with browser versions.

**What you can do here**:

- Grouped by source: the page body and each embedded page region count as separate sources, each group marked with one of three states — Not supported / Supported, not enabled / Enabled
- Turn on a source with **Enable WebMCP**; turning one off doesn't implicate the others
- Within a source, set each tool individually to Enabled / On demand / Disabled
- A tool carrying the **Untrusted** badge returns the web page's own content; the assistant treats it as reference material, not as instructions to follow

![The WebMCP Tools page: grouped by source, each group marked with one of three states, tools toggled one by one](/docs-assets/console-connections/zh/S-console-conn-03-webmcp.png)

Source names, state badges, and per-tool toggles all live in their own groups.

**Typical use**: the Demo declares such a set of tools: current view, projects, requirements, sprints, defects, tests, and metrics — 7 in all. This channel matters especially for the extension version — the assistant isn't inside the page, so the tools a page reports are its main route to page data. When the browser is too old, this page shows "WebMCP is not available in this browser/environment." — that's the browser's matter, not your system being broken.

### Page Skills

**What it's for**: seeing which skills the current page temporarily gives the assistant. These skills aren't installed into the Library: leave or close the page and they disappear from the catalog — as the interface puts it, "They live and die with the page". Long-resident skills live in the Library of [Skill Management](#/docs/console-skills). This page also handles two other things: which page region the assistant can read, and the authorizations you've remembered.

**What you can do here**:

- The **Page-declared temporary skills** section lists the skills the current page gives, each with Source and Channel badges; click "View skill contract" at the end of a row to read the full content
- Verify in the **Page perception (read-only)** section: status (Enabled / Not enabled), **Readable regions**, **Excluded regions**; the page may also declare an **Actionable scope** separately — readable doesn't mean operable
- **Page image capture** is off by default; when on, images inside the readable regions go to the model provider along with the read; the count and size limits are changed under Settings › Agent Runtime
- **Recent reads** lists each read's time, region, and node count one by one
- Revoke remembered authorizations in the **Remembered page actions** section — next section

![The Page Skills page: temporary skills, perception scope, and remembered authorizations top to bottom](/docs-assets/console-connections/zh/S-console-conn-04-page-skills.png)

The perception section is read-only; the only switch is Page image capture.

**Typical use**: in the Demo, this page lists the temporary skills each screen declares, and the badges say which screen declared them — for instance, the requirements screen has a skill that checks whether requirement statuses and sprint stages are consistent, and the sprint screen has one that judges whether a sprint can land on time. Whichever screen you're on, that screen's skills are what the assistant holds; switch screens and the previous screen's skills lapse — not lost, just living and dying with the page. Perception details: [Letting the Assistant Read the Page](#/docs/page-perception).

### Revoking remembered authorizations

Page actions you checked "Don't ask again" for in the conversation are all listed in the **Remembered page actions** section of the **Page Skills** page — the interface text reads: "Actions you told the assistant not to ask about again. Revoking one brings back the confirmation prompt." Entries are grouped by remembered scope; click **Revoke** entry by entry, or **Revoke all** to clear a whole group. Revoking takes effect immediately — no refresh needed — and the next action of the same kind pops the card asking you again. When nothing is remembered, the section reads "Nothing is remembered; every page action still asks first." The rules of the authorization card itself: [Letting the Assistant Act on the Page](#/docs/page-actions); extension-version download authorizations are revoked in the same place — see [Let It Read the File You Just Downloaded (Extension Only)](#/docs/downloaded-files).

## Web version vs. extension version

|  | Web version | Extension version |
| --- | --- | --- |
| Where these four pages are | A management page inside your website (in the Demo, click **Settings** in the chat header) | The extension's options page |
| LLM page | Identical | Identical |
| MCP Endpoints page | Remote tool services can be added and removed by hand | Lists the endpoints the currently bound web page itself provides — cleared when the page changes; manual adding isn't supported |
| Coverage of page tools | Only the website you're on | Any web page: without the page changing a line, the assistant can discover its endpoints, temporary skills, and WebMCP tools |

## When something goes wrong

- **An endpoint's status shows Failed.** The reason is written next to the status: a misspelled hostname, a service that isn't up, and rejected credentials each get their own wording. Fix it and click **Reconnect**; when unsure whether it gets through, click **Test**.
- **The assistant says a tool is unavailable, or never mentions it at all.** Look up that tool in the **Endpoint Registry** on the **MCP Endpoints** page or on the **WebMCP Tools** page: has it been flipped to Disabled, or has its whole endpoint / source been turned off?
- **The assistant suddenly only chats — no skills, no page reading.** Check on the **LLM** page whether the current model's **Supports tool calling** got turned off — without it the assistant is left with plain conversation. What the model capability badges mean: [Choosing a Model](#/docs/models).
- **The WebMCP Tools page shows "WebMCP is not available in this browser/environment."** The browser is too old or the experimental flag isn't on. This doesn't affect the tools your system provides through its own channel — only this browser channel is unusable.
- **A temporary skill that was there yesterday is gone today.** It lives and dies with the page: switching pages or closing the tab makes it disappear, and it can't be found in the Library either — that's by design, not a loss.
