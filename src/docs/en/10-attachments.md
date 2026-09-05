# Attachments, Images, Voice, and Camera

Besides typing, you can attach files and images to a message and send them together — or simply speak, or take a shot with the camera. This chapter covers what you can send, what happens after it goes in, and what to do when something can't be sent.

## What you can do

- Attach files to a message: images, text, PDF, and Word and Excel too
- Use **Voice input** to turn what you say into text, which lands in the input field before you send
- Use **Take a photo** to shoot one with the camera and put it into the input field as an attachment

## Which files you can send

Click **Attach a file** below the input field to pick files, or drag files straight into the input area. An attached file shows as a small chip with its name, size, and a type label. There are four type labels, each accepting these formats:

| Type label | You can send                       |
| ---------- | ---------------------------------- |
| Image      | png, jpeg, webp, gif               |
| Text       | txt, md, csv, json, log, yaml, yml |
| File       | pdf                                |
| Doc text   | docx, xlsx                         |

**Word (docx) and Excel (xlsx) can be sent directly** — they fall under the "Doc text" kind. Formats not in the table (like zip) can't be sent.

![Multiple attachment chips in the input field, each with a type label](/docs-assets/attachments/en/S-attachments-01-chips.png)

An attachment chip shows the file name, size, and type label; you can remove it any time before sending.

![An input field with an xlsx attached, the type label showing "Doc text"](/docs-assets/attachments/en/S-attachments-07-xlsx-doc-text.png)

Once an Excel file is attached, its type label is "Doc text", not "File".

## What happens after they're attached

The four kinds of attachments aren't sent the same way, and the differences are ones you can observe:

| Type                 | What actually goes out        | What you should know                                                   |
| -------------------- | ----------------------------- | ---------------------------------------------------------------------- |
| Image                | The image itself              | Oversized ones are compressed first; there's a per-message count limit |
| Text                 | The text in the file          | Anything beyond 32K characters is truncated                            |
| File (pdf)           | The whole file                | Requires a model that supports document input                          |
| Doc text (docx/xlsx) | The text read out of the file | The original file is not sent in whole                                 |

The last kind deserves one more word: Word and Excel files are **read into text in your own browser** before sending, and only the read-out body text goes out — images and layout in the document are not included — the original file never leaves your machine. For who each kind of content goes to and what you control, see [Privacy and Where Your Data Goes](#/docs/privacy).

![M-10 The path of a file into the conversation](/docs-assets/attachments/en/M-10.svg)

Wherever a file comes from — picking, pasting, taking a photo — it first becomes an attachment in the input field, then goes its own way by type; it's only really sent after you click **Send**.

How big is 32K characters: everyday meeting notes and requirement summaries come nowhere near; a complete log accumulated over months easily exceeds it. An over-long file doesn't have to go in whole — excerpting the relevant passages and sending those works better.

## Images get compressed

Oversized images are compressed before sending. After compression, the attachment chip carries an extra line: "Compressed {from} → {to}" — both the before and after sizes are visible. What's compressed is only the copy that goes out; the original file on your machine is untouched. If one genuinely can't be compressed under the limit, it's clearly refused with a reason — never silently dropped.

![The compression notice "Compressed …" on an attachment chip](/docs-assets/attachments/en/S-attachments-02-compressed.png)

Compression is an automatic step before sending; you don't need to do anything.

There's a limit on how many images one message can carry. Attach too many at once and the extras **don't go out with it** — the message stream lists them explicitly: "Only {limit} images can be sent per message. Not sent: {names}" — which ones weren't sent, names and all. If you want them sent, split them into the next message.

![The over-limit notice, listing the file names that weren't sent](/docs-assets/attachments/en/S-attachments-08-images-dropped.png)

Both limits — per-image size and per-message count — live in "Settings → Multimodal" and are adjusted by your system; see [Settings](#/docs/console-settings).

## Speaking instead of typing

1. Click **Voice input** below the input field. The first time, the browser asks for microphone permission; allow it and recording starts, with "Recording" shown in the interface.
2. Finish what you have to say into the microphone, then click **Stop voice input**.
3. The recognized text lands in the input field — recognition happens locally in the browser. Read it over, fix it, then click **Send**: it typed for you; whether to send, and what to send, is still your call.

![Voice input recording, the button now reading "Stop voice input"](/docs-assets/attachments/en/S-attachments-03-dictating.png)

While recording, clicking the same button again ends it, and the text lands in the input field right away.

The prompts spell out both the cause and where things went:

- "The browser denied microphone access. Allow it in the site permission settings, then try again." — allow the microphone in the browser's site permission settings, then click once more.
- "Voice input stopped unexpectedly. Try again, or type your message."
- "This browser does not support speech recognition." — switch to a browser that supports it, or just type.

Whichever one you hit, typing is unaffected.

## Taking a photo with the camera

1. Click **Take a photo** below the input field to pop up the viewfinder dialog.
2. Aim at what you want to capture — a sheet of paper, a screen, an error popup — and click the shutter, **Capture**; the viewfinder closes right away.
3. The photo hangs in the input field as an attachment chip. The dialog spells it out: "The photo is added to the composer as an attachment. It is not sent until you send the message." Check the thumbnail, add your question, then click **Send**.

![The camera dialog: the viewfinder view and the shutter](/docs-assets/attachments/en/S-attachments-04-camera.png)

After capture it only sits in the input field — it won't go out unless you click send.

When the photo button is greyed out, hovering over it spells out which prerequisite is missing (the image channel is off, the current model doesn't take images, and so on); follow the prompt to supply it. The camera's failure prompts correspond one-to-one with the microphone's:

- "The browser denied camera access. Allow it in the site permission settings, then try again."
- "The photo could not be taken. Try again, or attach an image file instead."

## When images can't be sent

When sending an image is blocked, there are only two prompts, each with its own fix:

1. **"images are off in Settings → Multimodal".** The image channel is off by default (on by default in the Demo), because once it's on, the images you pick are uploaded to your configured model provider. Turn on **Image attachments** in settings — see [Settings](#/docs/console-settings).
2. **"the selected model does not accept images".** The model you're using doesn't take images. Switch to a model whose capability badges include "Images" — see [Choosing a Model](#/docs/models).

![The "the selected model does not accept images" prompt](/docs-assets/attachments/en/S-attachments-05-model-no-images.png)

The prompt spells out which of the two causes it is; follow the direction it points.

PDF has a corresponding situation: it goes to the model in whole, and when the model side refuses, the error card carries a line of explanation — this turn included a document, and the current model may not accept document input. Switch to a model that supports documents, or save the content as Word or plain text and send that.

## Web version vs. extension version

The four attachment kinds, compression, truncation, and the count limit are the same in both, and both versions have voice input and camera. The difference is the first-time permission grant:

> **Extension only**: The extension version lives in the browser's sidebar, and a sidebar has no place to pop the browser's permission box. The first time you click **Voice input** or **Take a photo**, it automatically opens a regular tab and asks you to grant permission there, with the sidebar prompting: "Microphone access needs to be granted once in a regular tab. Finish it there, then come back and try again." The camera likewise: "Camera access needs to be granted once in a regular tab. Finish it there, then come back and try again." Click allow in that tab, come back to the sidebar, click once more, and it works. The grant is one-time; afterwards it works directly.

![The prompt that microphone or camera permission needs to be granted once in a regular tab](/docs-assets/attachments/en/S-attachments-06-handoff.png)

The web version has no such step: the browser pops the permission box right on the current page — allow and use.

## When something goes wrong

- **Sending an image is refused, with a prompt saying images are off.** Turn on **Image attachments** in "Settings → Multimodal" (see [Settings](#/docs/console-settings)); if you're on the Demo, it's on by default.
- **The prompt says "the selected model does not accept images".** Switch to a model whose badges include "Images" — see [Choosing a Model](#/docs/models). A greyed-out photo button is usually the same cause.
- **You sent a long text file and the answer reads like it didn't finish it.** Most likely it went past 32K characters and was truncated — excerpt the relevant passages and send those.
- **Voice or camera prompts that the browser denied it.** Follow the prompt to allow the microphone or camera in the browser's site permission settings and retry; on the extension version, first finish the grant in the regular tab that opened automatically.
- **The model errors after a PDF is sent.** The current model may not accept document input: switch models, or convert the content to Word or plain text and send that.
