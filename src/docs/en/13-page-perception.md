# Letting the Assistant Read the Page

To ask about something on the page, you don't have to copy and paste. Say "take a look at this page" and the assistant reads the page content before answering — and the interface shows exactly which part it read and which it didn't. This capability is called **page perception**: the assistant's ability to read the page you are currently looking at.

## What you can do

- Have the assistant read the current page with one plain sentence, and answer you based on the page's real data.
- See from the perception notice which region it read this time, and which it excluded.
- Decide whether the page's images go along — off by default.
- Verify every read in the Console afterwards.

## No more copy-paste

Asking about a row of data on a page used to mean selecting it, copying it, and pasting it into the chat. Now you just ask — what the assistant reads is the page's structured content (headings, body text, tables, and form labels are all in there), so answers can cite the real numbers and items on the page, not your retelling.

## How to get it to read

No fixed phrasing needed — just get the meaning "read the current page" across. In the [Demo](/demo), for example, send:

`Read the page I am currently looking at and summarize the key information and anomalies`

This comes verbatim from the quick prompts on the Demo's welcome screen. It triggers a page read: a perception notice appears in the answer area first, then the assistant summarizes section by section based on what it read.

![A summary the assistant produced from the page's real data](/docs-assets/page-perception/zh/S-perception-04-summary-result.png)

The numbers and items cited in the summary come from the page itself. Sample run output — your actual output will differ.

## What it read

When a read happens, the answer area shows a notice: **Reading page content (scope: {scope})**. The notice says which region was read — the region is marked out in advance by the system you're in; the assistant can't change it. In the Demo's case, the marked-out region is the main business area: lists, tables, and forms are inside it; the assistant's own chat panel is not.

![The perception notice, showing the region being read](/docs-assets/page-perception/zh/S-perception-01-reading-scope.png)

What was read is written right in the conversation — no guessing.

If the system has marked regions not to read, the interface tells you that too: **Excluded: {scope}**.

![The exclusion notice, stating which region was not read](/docs-assets/page-perception/zh/S-perception-02-excluded.png)

A region named in "Excluded" never enters the assistant's view.

To check afterwards, click **Settings** in the chat header and go to the **Page Skills** page in the **Connections** group: **Readable regions**, **Excluded regions**, and **Recent reads** are all on this page — see [Connections](#/docs/console-connections).

Two boundaries to know up front:

- It reads what's actually displayed on the page — collapsed panels and in-page tabs you haven't switched to aren't included. Expand them first, then ask.
- When the page is large it reads in segments, so waiting a beat longer is normal.

## Documents and screenshots on the page

Attachments hanging on table rows don't need downloading or opening one by one: Word documents on requirement rows, screenshots on defect rows — the assistant reads them one after another along the page, then gathers the results for you. In the [Demo](/demo)'s requirement pool, send:

`Read the requirement documents with attachments in the list I am viewing, extract acceptance criteria, and list items present in the documents but missing from the tickets`

It first reads the list, recognizes the rows with documents, then reads each one's content for comparison. For defect screenshots, send: `Look at the screenshots of these defects on the current page, judge which ones may share a root cause, and explain the reasoning`. Both come verbatim from the quick prompts on the Demo's welcome screen. When what it reads out should be recorded into the system, the full walkthrough is in [Case: Importing a Document into the System](#/docs/case-import-file).

![The assistant followed the document links in the requirement table to read multiple Word documents and gave a comparison](/docs-assets/page-perception/zh/S-perception-06-linked-docs.png)

The answer states content from inside the documents — proof it really followed the links and read them, not just the link text. Sample run output — your actual output will differ.

Three boundaries:

- **Word and Excel yield the extracted body text** — layout, comments, headers and footers aren't included, same as when you upload an attachment by hand; see [Attachments, Images, Voice, and Camera](#/docs/attachments). A pdf goes to the model in full; when the model doesn't accept documents, it errors and suggests switching models or using a Word link instead.
- **Defect screenshots count as images on the page**: they need **Page image capture** turned on first and a model badge showing "Images"; the switch is in "Images on the page" below.
- **It reads the links that appear on the page.** Documents on the same website are read directly; when a link points to another website, a "Confirmation" card pops up first every time, with the full address to be fetched written on the card — it fetches only after you agree.

![The "Confirmation" card that pops up before reading a document from another website, with the full address to be fetched written on the card](/docs-assets/page-perception/zh/S-perception-07-cross-origin-confirm.png)

Every cross-website read needs your nod, with the address written out in full on the card.

## What it can't read

- **Password field values are never read.** The same goes for fields the page deliberately hides — even if the system forgot to exclude them, their values don't enter the assistant's view.
- **Excluded regions are not read** — "Excluded" states which ones.
- **When it can't read something, it says so.** Ask about content outside its scope and it tells you it can't read it, rather than making up an answer.
- **Text on the page can't pry the scope open.** Even if the page contains phrases like "ignore your previous instructions", excluded regions stay unread — the scope is set by the system you're in; page content doesn't get a say.

![M-14 Which parts of a page the assistant can see](/docs-assets/page-perception/M-14.svg)

It reads body text, tables, and form labels; password field values are not read; whether page images are read is controlled by your toggle.

## Images on the page

By default the assistant reads text only — **not a single image is sent out**. If you want it to look at images too — "see how these two charts differ", say — you first turn on a switch: in the Console, the **Agent Runtime** page in the **Settings** group, the **Multimodal** section, **Page image capture**.

Once it's on, reads show a few extra counts:

| On-screen message | What it means |
| --- | --- |
| Captured {count} images | These images went to the model along with this read |
| {count} omitted | Over the count limit, or tiny icon-type images — not sent |
| {count} could not be read | Individual images failed; the text part is unaffected |

![The count notices for image capture](/docs-assets/page-perception/zh/S-perception-03-image-count.png)

Captured, omitted, and failed are counted separately, not merged into one number.

Turn the switch back off and text is still read while not a single image is sent. Note that each message has count and size limits for images, and the current model has to accept images — the badge must show "Images", otherwise it can't make sense of images even with the switch on. See [Choosing a Model](#/docs/models).

## Web version vs. extension version

|  | Web version | Extension version |
| --- | --- | --- |
| Pages it can read | Only the one page the assistant is on | Any web page you have open |
| Third-party frames embedded in the page | Limited | Can read cross-origin content nested several frames deep, text and images alike |

> **Extension only**: On any website you open, the assistant can read the current page — including third-party frames embedded several layers deep, such as cross-origin content inside the body.

![The extension version reading page content on an ordinary web page](/docs-assets/page-perception/zh/S-perception-05-extension-web.png)

Bigger capability, same constraints: password values still aren't read, the image-capture switch still applies, and it still says plainly when it can't read something. Sample run output — your actual output will differ.

## When something goes wrong

**It says it can't see the page content.** Most likely your system hasn't enabled page perception. Check the **Page Skills** page in the Console to see whether the perception status says "Not enabled"; if it's indeed off, contact the people who provide this system.

**Its summary doesn't match what you see.** First check the region in the perception notice — it only read the marked-out region; anything outside it, or not currently displayed on the page, it didn't see. Scroll to the part you want it to see, then ask again.

**It says it can't find an option you can clearly see.** Some pages paint pop-up overlays (like the cells of a date picker) in positions it can't read. This is a known boundary, not careless reading — click those cells yourself, or have it fill the input field directly instead.

**A notice says {count} could not be read.** Individual images failed, usually for exceeding the size limit; the text part is unaffected. When you need it to look at images, confirm **Page image capture** is on and the model capability badge shows "Images".
