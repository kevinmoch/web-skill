# Choosing a Model

Which model answers you is your own choice: switch per session, effective on the spot. This chapter covers where to switch, what the capability badges next to model names mean, and how the interface prompts you when no model is configured or a model is unavailable.

## What you can do

- Switch models per session in the input area, effective on the spot, no new session needed
- Read the "Model capabilities" badges: Tools / No tools, Images / No images
- Know what switching models affects and what it doesn't
- Recognize the demo model, and know its answers can't be taken as conclusions
- When no model is configured or an entry is greyed out, know where to go

## Where to switch models

Among the row of entries at the bottom of the input area there's a **Model** button; the button shows the name of the model this session is using. Click it open for the model menu: the checked one is the current one; click another to switch immediately.

![The model menu expanded: the available models listed, the current one checked, unavailable entries greyed out](/docs-assets/models/zh/S-models-01-menu.png)

The switch only takes effect for the current session, and no page refresh is needed either. Three boundaries to know up front:

- Switch to another session and it may be using another model; **new sessions use the default**.
- Switching models here **doesn't change the global default**; the default is set on the LLM page of the Console's [Connections](#/docs/console-connections) group.
- The menu's model list also comes from the LLM page: rename entries or add and remove them there, and the menu follows on the spot.

The bottom-right corner of every assistant message marks the name of the model that produced it — even paging back through old sessions you can tell which one was in use at the time.

## What the capability badges mean

Next to the model menu is a set of **Model capabilities** badges: two small icons; hover the pointer over them (a screen reader reads them aloud directly) to see the text:

| Badge | Meaning |
| --- | --- |
| Tools / No tools | Whether this model can call tools |
| Images / No images | Whether you can send it image attachments |

A tool is one concrete action the assistant can perform, like "read the requirement list" or "navigate to a page"; a skill is a packaged "instruction manual for doing something" — install it and the assistant can do that thing. **The consequences of "No tools" are far bigger than the words suggest: when the model doesn't support tools, the assistant can't call skills, and can't read or act on pages either — plain chat only.** If you feel "the assistant suddenly got dumb", the number-one cause is this: most likely the current model doesn't support tools — the assistant isn't broken.

![M-13 Model capabilities decide what you can do: the current model forks into "tools supported?" and "images supported?", each leading to what can and can't be done](/docs-assets/models/M-13.svg)

Of the two badges, tools decides whether the assistant can work; images only decides whether it can look at pictures.

![The Model capabilities badges in the input area: two small icons for tools and images](/docs-assets/models/zh/S-models-02-capabilities.png)

Hover an icon to see its text; when it shows "No tools" a reason comes with it: "Unavailable: the selected model does not support tool calling."

"No images" has a very local effect: image attachments sent to it are blocked with the prompt "the selected model does not accept images" — switch to a model with an **Images** badge. For more on images and attachments, see [Attachments, Images, Voice, and Camera](#/docs/attachments).

## What happens with no model configured

When there's not a single usable model, clicking send (or clicking the **Model** button) doesn't start a conversation — it pops up a guide titled "**No model configured**": A large language model has not been configured yet. Configure one on the model settings page before chatting. Click **Configure model** and you jump to the LLM page of the Console's [Connections](#/docs/console-connections) group.

![The "No model configured" guide, with the entry to configure one](/docs-assets/models/zh/S-models-03-no-model.png)

The other situation is **an entry in the menu being greyed out and unselectable**: hovering over it shows "Not usable: this entry has no API key or base URL. Configure it in the console." — go to the LLM page and complete it, or delete it.

## The demo model

When no real model is connected at all, the assistant is answered by the built-in **Demo model**: replies are demo text, marked "Demo model". It's what makes the Demo site work out of the box — you can start chatting before you've configured any model.

- **What it's for**: walk the full conversation flow without filling in any key. It isn't connected to a real model service and makes no network requests.
- **Its limits**: demo text doesn't mean it really read your data and pages — the content is only good for getting familiar with the interface, not for conclusions. To get real work out of it, configure a real model on the LLM page.

Seeing the "Demo model" mark means this answer is only a demo.

## What switching a model affects

- **Capabilities and style.** The capability badges follow the current model; different models also answer with different styles and speeds. Asking the same question with another model and getting a different answer is normal.
- **It only affects the answers that come after.** Answers already produced don't change, and the model marks on the messages stay.
- **It doesn't touch the global default.** Switching models in a session is temporary; new sessions still use the default.

## The browser's built-in AI

When adding a model, besides OpenAI-compatible / Anthropic / Google, the providers include a **Chrome built-in (experimental)** option. The interface describes it as: "Runs entirely on this device through the browser Prompt API. No endpoint or API key is needed." — chatting sends no model requests to any server.

Two limitations to know:

- It **doesn't support tool calling** — the interface's own words: "The built-in model cannot call tools, so skills that run scripts will not work with it." Select it and the capability badges are No tools and No images — the assistant is down to plain chat.
- It's only offered in Chromium-based browsers, and you have to turn on the corresponding flag first and wait for the browser to finish downloading the model. When it isn't ready, the LLM page spells out the concrete reason (for example "The on-device model is not ready yet. Chrome has to finish downloading it first."), and the entry in the menu is greyed out — unselectable, rather than erroring after you select it.

## Web version vs. extension version

The model menu, capability badges, and configuration entry are the same in both. The only difference comes from the browser's built-in AI option: it requires a Chromium engine — the extension version runs on Chrome, so it's naturally satisfied; the web version depends on which browser you open it in.

## When something goes wrong

- **The assistant suddenly stops calling skills and reading pages, and only chats.** Check whether the capability badge shows **No tools**: if so, switch to a model with a **Tools** badge; if it's a model you configured yourself, also check on the Console's LLM page whether its "Supports tool calling" toggle got turned off.
- **The entry you want is greyed out.** Hover to see the cause: missing API key or base URL — complete it on the LLM page; a greyed-out Chrome built-in option means the browser side isn't ready — handle it by the concrete reason written on the LLM page.
- **"No model configured" pops up when sending.** Click **Configure model** to go to the LLM page and add a model; for how to fill in the address and key, see [Connections](#/docs/console-connections).
- **Images won't go out, with the prompt "the selected model does not accept images".** Switch to a model with **Images**; if it still fails after switching, check the multimodal toggle in settings — see [Attachments, Images, Voice, and Camera](#/docs/attachments).
