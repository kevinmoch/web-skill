# A Tour of the Chat Interface

This chapter walks you through every corner of the assistant's chat panel: what each area is called and where each button lives, so you can find any spot mentioned in later chapters. Every screen in this chapter can be compared against the real thing by opening the assistant in the [Demo](/demo).

## What you can do

- Point out the four areas of the chat panel and what each one does
- Reach the session list, settings, and the Console from the header
- Recognize every action on a message: copy, retry, delete, and more
- Put text, attachments, voice, and photos into the input area, and switch models per session
- Adjust how the panel sits: docked, collapsed, or fitted to a narrow screen

## The four areas

Wherever the panel opens, it has the same four areas. The numbers on the overview screenshot are referenced by this chapter and the ones after it.

![Overview of the chat interface with the four areas marked: ① header, ② session list, ③ message area, ④ input area](/docs-assets/chat-tour/en/S-chat-tour-01-overview.png)

①②③④ correspond one-to-one with the table below; when you see a number, you know which part is meant.

| # | Area | What you do here |
| --- | --- | --- |
| ① | Header | Open the session list, start a new chat, enter settings; shows the assistant's name (Agile Copilot in the Demo) |
| ② | Session list | Switch, search, and start sessions; when the panel is narrow it collapses into an overlay |
| ③ | Message area | Your questions and the assistant's answers in time order; a new session first shows "How can I help you today?" plus a set of "Try an example" prompts — click one to send it |
| ④ | Input area | Type, add attachments, dictate, take a photo, pick a model, send |

![Structural diagram of the chat interface: header on top, message area in the middle, input area at the bottom, session list on the side](/docs-assets/chat-tour/en/M-04.svg)

The diagram gives you the structure; the full screenshot gives you the real look. They describe the same thing.

> **Tip**: You can use it without a mouse: Tab moves focus, Esc closes overlays, and the arrow keys move through menus. Screen readers read messages aloud one by one and announce generation status.

## The header: sessions, settings, and the Console entry

On the far left of the header ① is the **Sessions** button (tooltip "Expand Session List"); it opens the session list in area ②. When your system offers docking, next to it is **Dock to page** (which becomes **Undock from page** once docked). The middle shows the assistant's name (Agile Copilot in the Demo). On the right, in order: **New chat** (the plus sign), **Settings**, and — if your system provides it — **Close chat**. All of these names appear as tooltips in the interface.

![Close-up of the header buttons](/docs-assets/chat-tour/en/S-chat-tour-02-header.png)

The button names all come from their tooltips and match the terms used in the text one-to-one.

Three more entries don't live in the chat panel's top bar — your system decides where they go: **Open Console**, **Switch to light theme** / **Switch to dark theme**, and **Switch language**. The Console is where you manage skills (the instructions that teach the assistant how to do a particular job), review run history, and adjust settings; in the Demo, click **Settings** to enter it. Theme and language are changed in the Console under Settings → Appearance. Switching between light and dark only changes the colors of the assistant panel and the Console themselves, not the look of the site you're on (this documentation page is always dark, and the two don't affect each other).

## The message area: what's on a message

In the message area ③, move your pointer over a message (or focus it with the keyboard) and its action bar, "Message actions", appears:

- **Copy**: copy the text of this message.
- **Retry**: have the assistant answer again.
- **Delete message**: remove this one; there's a short undo window after deleting.
- **Edit message**: change something you already sent and send it again.
- **View trace**: see exactly which steps the assistant took this turn.
- A message also shows **{count} tokens** (how much compute this answer used) and **Skills used in this run** (which skills it called this turn).
- When there are many messages, **Load earlier messages** appears at the top of the list.

The detailed usage of these actions is covered in [Asking, Answering, and Interrupting](#/docs/chat-basics) and [Seeing What the Assistant Is Doing](#/docs/transparency); this chapter only points out where things are.

![An assistant message with its action bar](/docs-assets/chat-tour/en/S-chat-tour-03-message-actions.png)

These actions aren't hidden in a menu: hover over a message and the action bar appears, as in the screenshot.

## The input area: what you can put in

In the middle of the input area ④ is the input field (placeholder text "Send a message..."); press Enter to send. While the assistant is answering, the **Send** button becomes **Stop**. Below the input field sits a row of entries:

- **Attach a file**: attach images, text, files, and more to the message so they go out together.
- **Voice input**: speak instead of typing. Recognition runs locally in the browser, and the transcript lands in the input field, where you can edit it yourself before sending.
- **Take a photo**: use the camera to take a picture. The photo goes into the input field as an attachment and is only sent when you press send.
- **Model**: switch which model this session uses. When no model is configured yet, the built-in **Demo model** answers instead, and its replies are marked as such.

![All the entries in the input area: attachments, model, voice, camera, send](/docs-assets/chat-tour/en/S-chat-tour-04-composer.png)

This screenshot shows the full row of entries in the input area.

## How the panel can be arranged

- **Docking and undocking**: click **Dock to page** and the assistant panel changes from a floating overlay to occupying one side of the page, with the page content making room; click **Undock from page** to restore. Your system decides whether to offer this pair of buttons — the Demo doesn't. In the Demo you drag the panel's left edge to resize it, and click "Collapse AI copilot" in the bottom-right corner to close it.
- **Closing doesn't lose anything**: whether you use **Close chat** or the Demo's "Collapse AI copilot", your sessions and messages are still there when you reopen.
- **Narrow screens and narrow panels**: when the panel gets narrow (what matters is the panel's own width, not the window size), the session list ② automatically collapses into an overlay: click the **Sessions** button to expand it; it floats above the message area instead of squeezing it. Press Esc, click the backdrop outside the overlay, or pick a session, and it retracts. On narrow screens like phones, the panel fills the full screen width, and the four areas keep their roles.

![The chat interface on a 375px-wide screen](/docs-assets/chat-tour/en/S-chat-tour-05-narrow.png)

Fully usable on a narrow screen: the session list collapses into an overlay, and the message area isn't squeezed.

## Web version vs. extension version

The areas and buttons in this chapter are essentially the same in both forms. What differs is where the assistant lives:

- **Web version**: the assistant is embedded in the page of the site you're using. It opens only in that page and can only see that page. The entry is provided by the site — in the Demo it's "Expand AI copilot" in the bottom-right corner; other systems may place it elsewhere.
- **Extension version**: the assistant lives in the browser's sidebar, independent of any site. When you switch to another tab, it can follow you to that page.

> **Extension only**: There is no "Expand AI copilot" page button in the sidebar version — open it from the extension icon in the browser toolbar.

## When something goes wrong

**You can't find the assistant entry.** On the web version, first check the bottom-right corner of the page for "Expand AI copilot" (that's where it is in the Demo); if it's not there, ask a colleague who works with your system. On the extension version, click the extension icon in the browser toolbar to open it in the sidebar.

**A button does nothing, or the panel is stuck.** Just refresh the page: sessions and messages are stored on your device, refreshing won't lose them, and you can reopen the assistant and keep chatting. For the details of what's saved, see [Managing Sessions](#/docs/sessions).

**The interface is in the wrong language.** Switch the language in the Console under Settings → Appearance; the chat panel and the Console change together.
