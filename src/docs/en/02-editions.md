# Web and Extension Editions

The WebSkill assistant comes in two forms: the **web version** is embedded in a website, its eyes and hands confined to that one site; the **extension version** is installed on your browser and can see and act on any web page you open, even working across several tabs. This chapter helps you tell which one you're using, and what to expect from each.

## What you can do

- Glance at the entry point and tell whether you're on the web version or the extension version
- Say what each form can and can't do
- Know where to look up the detailed comparison

![M-02 The two forms compared](/docs-assets/editions/M-02.svg)

The web-version assistant lives inside a website and can only read and write that one site; the extension-version assistant lives in the browser and can read and write any tab you have open.

## How to tell which one I'm using

| Sign | Web version | Extension version |
| --- | --- | --- |
| Where the entry is | Inside the site's page (in the Demo, on the right edge of the page — click **Expand AI copilot**) | The browser's sidebar |
| Close that website | The assistant disappears along with it | The assistant is still there |
| Opening the Console | Click **Settings** in the chat header (Demo); in other systems watch for an entry like "Open Console", leading to the in-site Console (where skills and settings are managed) | From the browser extension's options page |

The one-sentence version: an assistant that lives inside one particular website is the web version; one that lives on the browser and stays with you when you change sites is the extension version.

![The Console entry points of the two forms compared](/docs-assets/editions/zh/S-editions-03-console-entry.png)

The Console entry isn't in the same place on the two forms: on the web version (Demo) it's "Settings" in the chat header; on the extension version it's the browser extension's options page.

## The web version: an assistant that lives in the website

The web version is provided by the system you're in — like this site's [Demo](/demo). It knows that system: it can read the system's pages, pull data with the tools the system provides, and fill in forms and click buttons in the system for you. Outside that website, it can neither see nor touch anything.

![The web-version assistant in the Demo: the chat drawer open, the site's own interface next to it](/docs-assets/editions/zh/S-editions-01-web-in-site.png)

The assistant is embedded in the website — right next to the chat drawer is the site's own interface.

## The extension version: an assistant that lives in the browser

Once the extension is installed, the assistant appears in the browser's sidebar, alongside any web page you open. It can read the current page and act on it for you, and it can also have several tabs open at once, gathering information scattered across several sites into one conclusion.

![The extension-version assistant in the browser's sidebar, with an ordinary web page next to it](/docs-assets/editions/zh/S-editions-02-extension-sidepanel.png)

The assistant exists independently in the sidebar — it stays there no matter which site sits next to it.

Bigger capability, same constraints — these three hold at all times:

- **Password field values are never read**, and never remembered either.
- Operations with side effects (clicking, submitting, uploading) always pop up an **authorization card** first, stating what it's about to do; it acts only after you click allow. Authorizations you've asked it to remember can be revoked in the Console anytime.
- When it works across tabs, it can't touch tabs you opened yourself, and it won't hijack your screen — when a round of work finishes, the focus is back on the page you were on.

## Where the capabilities differ

| Capability | Web version | Extension version |
| --- | --- | --- |
| Read the current page | Only the site the assistant is on | Any web page you have open |
| Act on pages | Only the site the assistant is on | Any web page you have open |
| Working across tabs | No | Yes |
| Working through a list item by item | Possible within one site, via navigate-and-go-back | Across tabs and across sites, no action needed from you midway |
| Downloading files | Regular browser download | Can confirm the download actually happened; the authorization is revocable |
| Opening the Console | The in-site Console | The browser extension's options page |

This is the short version. The full comparison (including nested frames, the cap on simultaneously open pages, and more) is in [Capability Comparison: Web vs Extension](#/docs/comparison).

## Which one should I use

No need to agonize — it depends on where you are:

- You're using a business system with an assistant built in — you're already on the web version. It comes with the system; nothing to install.
- You want the assistant to help on any website, or to gather information across several sites — install the extension version.
- Wanting both is no conflict: same assistant, same usage — the only difference is how much it can see.

## When something goes wrong

**A feature the docs mention is nowhere to be found.** First confirm which form you're on: working across tabs and reading any website are extension-version capabilities; the web version doesn't have them. This chapter's short table and [Capability Comparison: Web vs Extension](#/docs/comparison) both mark which form each capability belongs to.

**The extension version says it can't read the current page.** The usual cause is that it isn't attached to this page: for example, you're on one of the browser extension's own pages (like its options page), which it doesn't take over in the first place. Switch back to a regular web page and ask again.

**Worried it might mess around on your page.** It won't. Filling input fields and picking dropdown options it does directly, but before clicking, submitting, or uploading it always stops to ask you — and you can deny it right on the authorization card, every time. See [Letting the Assistant Act on the Page](#/docs/page-actions).
