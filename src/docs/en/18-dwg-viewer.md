# DWG Drawings: View, Measure, and Compare

No CAD software to install, no tens of megabytes of drawings to copy back and forth: have the assistant open a DWG drawing in a separate window — look at its layers, measure its dimensions, and even stack two drawings together to compare them component by component and export the differences to Excel.

## What you can do

- Three ways to open a DWG drawing: drag a .dwg into the conversation as an attachment, or click a drawing link on the page; the extension version can also read the browser's download list directly.
- Look at the drawing through the "Views / Layers / Properties" tabs, toggling layers like in a CAD viewer.
- Measure distance, area, and coordinates with the measure toolbar, with readings following the pointer live.
- Stack two drawings together: tint them apart, swap their order, drag them into alignment.
- Draw a box around an area and compare it component by component, with differences numbered on the drawing and exportable to Excel.

![M-34 The two layers of an overlay comparison: the new drawing on top and the old one below, each tinted one color, the overlap showing a third color, and the difference circles landing between the two layers](/docs-assets/dwg-viewer/en/M-34.svg)

Two drawings stacked like two sheets of tracing paper: each tinted one color, with differences marked on the drawing as numbered circles.

## Opening a drawing

Three channels, depending on where the drawing is:

- **Drag the drawing into the conversation**: drag a .dwg in as an attachment, or click **Attach a file** — the drawing is taken in as its original bytes.
- **A drawing link on the page**: a link on the page pointing to a .dwg — have the assistant open it; when the link points to another site, a confirmation card pops up before fetching.
- **The browser's download list**: for a drawing you just exported, simply say "open the drawing I just downloaded". Listing the folder and reading the file each pop one authorization card — the same pair as in [Let It Read the File You Just Downloaded (Extension Only)](#/docs/downloaded-files).

> **Extension only**: Of the three channels, the "browser download list" one is extension-only; on the web version the first two suffice. The download list marks .dwg as "unreadable" — that only means no text can be extracted from it; it can still be handed to the viewer to look at.

Whichever the channel, **the drawing's bytes never enter the conversation context**: the drawing is parsed on the viewer side, and what the assistant gets is only a summary (how many entities, which layers); only the file name and a claim check appear in the conversation — it opens the viewer for you, it doesn't read the drawing into the chat.

![A DWG drawing opened in the viewer window, with the file name in the title bar](/docs-assets/dwg-viewer/en/S-dwg-01-open.png)

The window title is the file name; with two drawings open, the two names sit side by side, so there's no mixing them up.

## Reading the viewer

Once open, it lands in **model space** by default, and the **Views** tab switches you to the individual sheets; scroll to zoom, drag to pan, and **Fit** on the **Properties** tab brings the whole drawing back into view. **Whatever can't be drawn says so with an honest count**, such as "{n} ACIS solid(s) are not shown" — 3D solids can't be drawn in this version, but they're never silently dropped; when fills are too dense to resolve, it tells you to zoom in and look again.

## Views · Layers · Properties

The three tabs mimic a CAD viewer: the **Views** tab lists the paper spaces on top and model space below — click the one you want to look at (if the drawing has no paper-space layouts, this tab doesn't appear and only **Layers** and **Properties** remain); the **Layers** tab is the layer table filtered by the current view — tick layers on and off one by one, with a checkbox at the top to select all or none; the **Properties** tab holds operating hints and honest declarations — how many entities weren't drawn and which content is drawn approximately are all written on this page.

![The "Views / Layers / Properties" tabs visible side by side](/docs-assets/dwg-viewer/en/S-dwg-02-panels.png)

The layer table follows the current view: model space may have hundreds of layers, a paper space just the handful in its frame.

## Measuring

The toolbar at the bottom of the canvas is for measuring: **Distance** (click two points), **Area** (click around point by point, Enter or double-click to finish), **Coordinate** (read wherever you point), **Angle** (click three points), **Delete** (click an existing measurement away), **Clear** (clear all measurements on the current layer).

Readings follow the pointer **live**, and the coordinate tool reads wherever it points; readings are plain text you can select and copy. Two conversion rules to keep in mind:

- **What you measure in model space is the real size.** The drawing declares its own units (millimeters, mostly), so no calibration is needed; when the drawing declares no units, it says so outright, and readings are only in drawing units — for real lengths, calibrate first under **Settings** in the toolbar.
- **Measuring in a paper space, readings are converted back to real size at the viewport's scale**: when both points fall inside the same viewport, they're converted at that viewport's scale (1:200, say) and marked as such; when they don't fall inside a viewport, it marks the reading as a paper size instead of handing you a wrong number.

![The measure toolbar with a distance measurement's live reading](/docs-assets/dwg-viewer/en/S-dwg-03-measure.png)

While measuring a distance, the reading on the line follows the pointer live.

## Overlaying two drawings

At most two at a time — give it more and it says so, never quietly dropping a third. With two open, each drawing gets its own panel and its own canvas, the two canvases stack flat, and a **Stack** panel appears:

- **Active layer and reordering**: click a layer to make it current — measurements land on the current layer; **Reorder** swaps the two layers' order.
- **Hiding and tinting**: each layer can be hidden on its own. By default each layer is tinted one color and the overlap naturally shows a third, so which line belongs to which drawing is obvious at a glance; click **Tint** to return to the drawings' original colors.
- **Aligning**: when the two drawings' origins don't coincide, click **Align** and drag the canvas — what moves is the current layer, not the view; if you drag it crooked, click **Reset**.

Once aligned, measurements can **snap across layers**: drop a point on the new drawing and it snaps to the old drawing's endpoints, midpoints, and centers. When the two drawings declare different units, it says so: a number measured across layers isn't comparable.

![Two drawings overlaid, the two layers tinted apart, with the Stack panel on the side](/docs-assets/dwg-viewer/en/S-dwg-04-overlay.png)

One color on top, one color below, a third where they overlap.

## Comparing differences by component

Once stacked, click **Compare**, and a box appears on the canvas — draggable, and resizable from its edges and corners — **only what's inside the box is compared**, and the box shows live how many components each side has inside. Results are marked on the drawing as numbered circles:

- **Hover a circle for that item's explanation**: count changed, position moved, attribute modified, added, missing — each spelled out, as in "{block} moved by {distance}".
- The panel shows a summary: how many differences in all, and how many of each kind — count, moved, attribute, added, missing. The position tolerance (200 mm by default) is adjustable, and changing it recomputes on the spot.
- **Export** writes the numbers, explanations, and summary into an Excel file (two sheets: a summary and a difference detail), saved into the browser's download folder, with the numbers corresponding one-to-one to the circles on the drawing.
- Turning off a CAD layer during a comparison recomputes the differences **on the spot with the same box**; switching views or re-aligning voids the result, and you have to compare again.

When it can't compare, it also says so: when the two drawings' naming systems don't match, no table is produced, and when the box holds no comparable components, it tells you honestly.

![Differences marked on the drawing as numbered circles; hover a circle for that item's explanation](/docs-assets/dwg-viewer/en/S-dwg-05-diff.png)

![The Excel file written by "Export", with a summary sheet and a difference-detail sheet](/docs-assets/dwg-viewer/en/S-dwg-06-diff-export.png)

The numbers on the drawing, the hover explanations, and the Excel detail rows — all three places use the same numbering and wording.

## Web version vs. extension version

The viewer itself is the same in both forms: the "Views / Layers / Properties" tabs, measuring, two-drawing overlay, component comparison with Excel export — all identical on the web version and the extension version. The only difference is the opening channels: the extension version adds "reading drawings straight from the browser's download list"; on the web version, drag the drawing into the conversation or click a drawing link on the page.

## When something goes wrong

- **The drawing won't open.** Most likely the file is corrupted or its format version too old. First confirm it's a .dwg — .dxf isn't supported; then try another file. If nothing works, send the file name and what you saw to the people who provide this system.
- **It opens but doesn't draw completely.** First read the declarations on the **Properties** tab: with 3D solids it states how many are not shown; when fills are too dense, zoom in and they appear. When the drawing is too busy, turn off what you don't need on the **Layers** tab first.
- **The measured number is wrong.** First check which space you measured in: model space gives real sizes; a paper space converts at the viewport's scale, and outside a viewport what you measure is a paper size — marked on the reading. When the drawing declares no units, readings are only drawing units — calibrate a reference segment first, then measure.
