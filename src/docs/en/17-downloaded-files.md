# Let It Read the File You Just Downloaded (Extension Only)

The previous chapter was about saving things the assistant made to your machine; this chapter goes the other way: letting the assistant read files already on your machine. Reading your things is far more sensitive than saving your things, so this chapter's focus isn't what it can read — it's that every single read goes through you first.

> **Extension only**: Only the extension version can read your download folder. The web version can't reach it; to show the assistant a local file there, your only option is uploading it by hand — see [Attachments, Images, Voice, and Camera](#/docs/attachments).

## What you can do

- Just say "look at the spreadsheet I just exported" — no more opening the folder and dragging the file into the chat
- Every list of the folder and every file read goes through you first
- Check "Don’t ask again" to cut down interruptions, and revoke in the Console anytime
- Unreadable formats are marked while listing — you don't find out only after clicking

## What this is for

You clicked "Export Excel" in a business system, and the file landed in your download folder. In the past, showing the assistant this spreadsheet meant finding the file and dragging it into the chat; now you just say "look at the one I just exported". What you save is the trip through the folder.

## It asks you twice

Don't assume "authorize once, read freely afterwards" — between you speaking and it reading the content, there are two authorization cards, both titled "Authorization required":

1. **To see what's in the folder, a card pops up first**, asking "Allow the assistant to see the list of files you recently downloaded?". Only when you click allow does it list the recently downloaded files.
2. **To open one of them, another card pops up**, asking "Allow the assistant to read this file from your downloads?", with the file's name and size on the card. Only when you confirm does it read.

Why does even listing need asking? Because file names are themselves information: `resignation-certificate.pdf`, `medical-report.pdf` — merely listing the names already leaks something that shouldn't leak. The first card guards against that.

Click deny on either card and that's the end: it gets neither the list nor the file, and simply tells you honestly that it couldn't do it this time.

![M-18 How many gates one read passes through](/docs-assets/downloaded-files/en/M-18.svg)

Both cards need your nod; deny either one and the flow ends there; unreadable formats are already marked during listing.

![The first authorization card that pops up before listing](/docs-assets/downloaded-files/en/S-downloads-01.png)

The first gate: before you allow, it doesn't even know what's in the folder.

![The second authorization card that pops up before reading a file, with the file's name and size on the card](/docs-assets/downloaded-files/en/S-downloads-02.png)

The second gate states which file it will read and how big it is; it reads only after you confirm.

## What it sees and what it doesn't

The list contains only file names, sizes, and download completion times — no paths. At no point does the assistant get a file's location on your disk — what it gets is a claim check: the file is fetched by number, and the path is kept by the browser extension itself. So it can say neither your username nor which drive you store things on.

And it can't go rummaging on its own: only when you tell it to look does it list the folder.

## What "Don’t ask again" remembers

The authorization cards have a "Don’t ask again" checkbox whose label spells out the remembered scope:

- On the list-the-folder card: `Don’t ask again to list your downloads`
- On the read-a-file card: `Don’t ask again to read files from your downloads`

In other words, what's remembered is **not this one file**, but **this kind of action on the whole download folder**. The two kinds of actions are remembered separately: letting it list doesn't mean letting it open files.

![Close-up of the "Don’t ask again" checkbox on the authorization card](/docs-assets/downloaded-files/en/S-downloads-03.png)

Read the label before checking: it remembers this kind of action on the whole folder, not the one file in front of you.

To take it back: open the Console, go to **Connections** → **Page Skills**, and find "Remembered page actions" — download authorizations and page actions are remembered in the same list; click **Revoke** (see [Connections](#/docs/console-connections)). Revoking takes effect immediately, and next time it asks you first again.

![Revoking a remembered download authorization in the Console](/docs-assets/downloaded-files/en/S-downloads-04.png)

Remembered authorizations can be revoked one by one; afterwards, each action is confirmed individually again.

## Which formats it can read

Exactly the same as what you can upload by hand:

| Type     | Readable formats                   |
| -------- | ---------------------------------- |
| Image    | png, jpeg, webp, gif               |
| Text     | txt, md, csv, json, log, yaml, yml |
| File     | pdf                                |
| Doc text | docx, xlsx (Word, Excel)           |

Word and Excel files are read into text in your browser before going to the model — what goes out is the text, not the original file — the same path as uploading by hand.

Formats it can't read (zip, for example) are already marked unreadable during listing — you don't get an error only after clicking. Images have one exception: if the current model doesn't take images, they're marked during listing with a note that switching models fixes it (see [Choosing a Model](#/docs/models)), instead of a wasted attempt that fails.

## First use: two switches to turn on

This capability is off out of the box. To use it, turn on two switches — both are required:

1. **The capability switch in the Console.** Open the Console, go to **Settings** → **Sandbox & Security**, find the "Downloaded files" group, and turn on **Allow reading downloaded files**. While it's off, the assistant doesn't even know the capability exists — it won't propose looking at your files, rather than proposing and getting blocked.

![Turning on "Allow reading downloaded files" in the Console](/docs-assets/downloaded-files/en/S-downloads-05.png)

2. **The browser's file-access switch.** Type `chrome://extensions` in the address bar, find this extension, click "Details", and turn on "Allow access to file URLs". The extension cannot turn this one on by itself — you must do it by hand. That's the browser protecting you, not the product being fussy.

![Turning on "Allow access to file URLs" in chrome://extensions](/docs-assets/downloaded-files/en/S-downloads-06.png)

This browser switch can only be turned on by you.

## Does it know you downloaded something?

In one situation, yes: when it clicked a button on the page itself and that triggered a download (you asked it to click "Export", say), it knows a download happened. But be clear about the limits:

- **It only knows "it happened", not what the file is called.** To learn the name, it still goes through the two cards above.
- **Only downloads caused by its own action are counted.** You downloading something else on the side — it can't see that.

In other words, it is not watching your download folder. And files are read-only to it: no renaming, no deleting, no writing into them.

## Web version vs. extension version

Everything in this chapter is extension-only. The web version can't read your download folder; to show the assistant a local file, your only option is uploading it by hand — and both paths handle exactly the same formats.

## When something goes wrong

- **A prompt tells you to turn on a switch at `chrome://extensions`.** The browser's file-access permission hasn't been granted yet. Turn it on as in the previous section, then retry.
- **A prompt says the file can't be opened and may have been moved or deleted.** The file really isn't where it was. Find it or download it again, then retry. No need to touch the permission switch this time — the switch is fine; fiddling with it accomplishes nothing.
- **A prompt says this format can't be read.** The type isn't among the four categories above. Convert it to pdf or a text format and retry.
- **A prompt says the current model can't look at images.** Switch to a model that supports images — see [Choosing a Model](#/docs/models).
- **The assistant tells you to upload the file by hand, as if it didn't know the feature exists.** Most likely the capability switch is off: turn on **Allow reading downloaded files** under Settings → Sandbox & Security, then say it again.
