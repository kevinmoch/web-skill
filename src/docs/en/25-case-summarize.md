# Case: Summarizing the Page You Are Viewing

To ask about something on the page, there's no copying and pasting: one sentence gets the assistant to summarize the screen you're looking at; switch to another screen and ask again, and the summary follows. This chapter turns the page perception from [Letting the Assistant Read the Page](#/docs/page-perception) into one complete task.

## Before you start

- Open the [Demo](/demo) and switch to the **Requirements** screen on the left
- Make sure you can see the **Expand AI copilot** entry on the right edge of the page

## Step 1: Ask about the current page

Under "Try an example" on the welcome screen, click this quick prompt, or type it yourself:

`Read the page I am currently looking at and summarize the key information and anomalies`

This comes verbatim from the quick prompts on the Demo's welcome screen. It triggers a page read: a perception notice appears in the answer area first — "Reading page content (scope: {scope})" — then the assistant summarizes section by section based on what it read.

![The perception notice, showing the region being read](/docs-assets/case-summarize/en/S-case-sum-03-reading-scope-hint.png)

Which region was read is written right in the conversation — no guessing.

The boundaries of the read are exactly the same as in chapter 13:

![M-14 Which parts of a page the assistant can see](/docs-assets/page-perception/en/M-14.svg)

It reads body text, tables, and form labels; password field values are not read; whether the page's images are read is controlled by your toggle.

## Step 2: Get the summary of this screen

The items and numbers cited in the summary come from the Requirements screen itself, not from a retelling.

![After asking on the Requirements screen, the summary the assistant gave from that screen's real data](/docs-assets/case-summarize/en/S-case-sum-01-requirements-screen.png)

Every item in the summary can be found verbatim on this screen. Sample run output — your actual output will differ.

## Step 3: Switch screens and ask the same sentence again

Switch to the **Bugs** screen on the left, and send the same sentence verbatim once more.

![Asking the same sentence on the Bugs screen, the summarized content is completely different](/docs-assets/case-summarize/en/S-case-sum-02-bugs-screen-same-prompt.png)

Not a word of the phrasing changed, yet the summarized content is completely different. Sample run output — your actual output will differ.

Putting the two results side by side is the point of this chapter: what it reads is always the screen you're looking at the moment you send. It only reads what's currently displayed — collapsed panels and tabs you haven't switched to aren't included; to have it see a part, scroll or switch to that part first, then ask.

## Other phrasings that work

The assistant judges intent, not wording — these two also produce summaries:

- On the **Overview** screen, a more focused one appears among the quick prompts: `Give me a readout of the page I am on: which screen and which project I am viewing, plus its headline stats — backlog size, sprint progress, open defects and test quality`. It triggers a summary that reports only those items.
- To have it read the attached documents too: `Read the requirement documents with attachments in the list I am viewing, extract acceptance criteria, and list items present in the documents but missing from the tickets`. It triggers this: the assistant doesn't just read the list — it opens each requirement document with an attachment, reads out the text, and compares it against the ticket. For how a document gets read into text, see [Attachments, Images, Voice, and Camera](#/docs/attachments).

![The assistant extracted acceptance criteria from the requirement documents and listed items present in the documents but missing from the tickets](/docs-assets/case-summarize/en/S-case-sum-04-doc-digest.png)

Items present in the documents but missing from the tickets are listed one by one. Sample run output — your actual output will differ.

## What this used

| Step | Chapter |
| --- | --- |
| Clicking a quick prompt or typing a question | [Asking, Answering, and Interrupting](#/docs/chat-basics) |
| Reading the current page, and the boundaries of the read region | [Letting the Assistant Read the Page](#/docs/page-perception) |
| Reading text out of attached documents and comparing | [Attachments, Images, Voice, and Camera](#/docs/attachments) |

## Web version vs. extension version

Both versions work the same way; the difference is what can be summarized: the web version can only summarize the site the assistant lives on; the extension version can summarize any web page you have open — news, documentation sites, ticket systems all work.

> **Extension only**: On any website, you can have it summarize the page you're on, including third-party frame content nested several layers deep.

Bigger capability, same constraints: password field values still aren't read, and it still says plainly when it can't read something.

## When something goes wrong

**It says it can't see the page content.** Most likely your system hasn't enabled page perception — go to the Console's **Page Skills** page to check the perception status; for what to do, see [Letting the Assistant Read the Page](#/docs/page-perception).

**The summary doesn't match what you see.** First check the region in the perception notice: it only read the marked-out region and genuinely didn't see anything outside it.

**The document comparison is missing items.** Over-long documents get truncated. Have it restate what it read first, verify it's right, then have it compare.
