---
name: presentation-standard
description: Generate a Nevron business presentation deck from the house PowerPoint layouts — covers, section dividers, three-step slides, bullets, text-plus-visual splits, icon card grids, comparison panels, progressive donut, panel and photo-callout builds, stat rows, device screenshot grids, diagrams and closings. Renders 16:9 HTML that matches the house slides shape for shape, and prints to PDF via headless Chrome. Use when Kaja asks for a presentation, a deck, a pitch deck, a product overview or a customer presentation. For philosophy or vision decks with no slide templates, use presentation-abstract instead.
---

# Nevron presentation deck

Builds a deck out of the real house layouts. A `deck.json` names layouts and
supplies copy; `build.mjs` composes them from an extracted scene graph of the
house PowerPoint and renders positioned HTML, optionally printing to PDF.

## The rule that makes this work

**Nothing is transcribed by hand.** Every coordinate, colour, font size and shape
comes out of the PPTX via `extract.mjs` into `reference/house.json`. If a slide
looks wrong, fix the extractor or the renderer — never nudge a number to make one
slide look right. Six earlier rebuilds failed by hand-typing values read off the
XML, losing fidelity at each step.

## Pipeline

```
2024-08-PPT_Most common elements&layouts.pptx
  └─ extract.mjs  → reference/house.json  +  assets/ppt-extracted/media/
       └─ deck.json + build.mjs → index.html (+ deck.pdf)
            └─ verify.mjs → side-by-side gallery vs the exported house PNGs
```

`build.mjs` inlines four support files into the deck it writes, so the output is
a single self-contained page:

| File | Role |
|---|---|
| `styles.css` | Stage mechanics — positioning, print rules. Never slide geometry. |
| `ui.css` | Navigation chrome. Hidden in `@media print`. |
| `ui.js` | Navigation behaviour: overview, counter, progress, touch. |
| `render.mjs` | Draws a scene from `house.json`. Only source of slide geometry. |

`ui.css` and `ui.js` are omitted when `build()` runs with `reference: true`, so
verification captures are clean slides with no chrome in the screenshot.

Source deck:
```
J:\Produkcija\_Brand Identity\07_PPT Presentations\PPT_Most common elements & layouts\2024-08-PPT_Most common elements&layouts.pptx
```

`reference/house.json` is committed, so **you do not need the J: share to build a
deck** — only to re-extract after the source PowerPoint changes.

## Build a deck

```bash
node build.mjs deck.json out --pdf
```

Flags: `--pdf` also prints `out/deck.pdf`; `--reference` renders missing images as
visible placeholders instead of failing; `--source-fonts` uses the deck's own
faces (Neue Haas Unica Pro, Inter) instead of embedded Open Sans — use it only
when checking fidelity on a machine that has the brand fonts installed.

Paths in `deck.json` resolve relative to that file. The example below assumes
`examples/presentation-standard/`.

## deck.json

```jsonc
{
  "title": "NevronCore — guest experience",
  "mediaRoot": "../../../assets/ppt-extracted/media",  // extracted house imagery
  "fontDir": "../../../assets/ppt-extracted/fonts",    // embeds Open Sans for portability
  "slides": [
    { "layout": "cover", "text": { "2": [{ "runs": ["NevronCore", "\n", "Guest experience"] }] } },
    { "layout": "bullets", "section": "Product", "text": { "12": ["Simple and friendly GUI", "…"] } },
    { "layout": "donut-build", "steps": [ {}, { "charts": { "7": [30, 70] } } ] },
    { "layout": "cards-3-light", "text": { "8": "A shared delivery plan" } }
  ]
}
```

Per slide:

| Key | Meaning |
|---|---|
| `layout` | a named layout (below), or use `houseSlide: 42` for any of the 55 directly |
| `text` | `{ "<shapeId>": string \| string[] \| [{runs:[…]}] }` — run overrides keep each run's own colour and weight |
| `images` | `{ "<shapeId>": "path.jpg" }` or `{ src, crop, alt }` |
| `charts` | `{ "<shapeId>": [25, 50, 25] }` — the slice count must match the source |
| `hide` | shape ids to drop |
| `section` / `source` | top-right section label / bottom-left source line |
| `steps` | per-step overrides for the build sequences |
| `label` | accessible name for the slide |

Shape ids come from `out/manifest.json` after any build, or from
`reference/house.json`.

**Layouts:** All 55 house slides have exactly one catalogue name. No aliases or
derived layouts are included. Names identify layout structure, not sample copy.

| House slide | Layout | Structure |
|---|---|---|
| 1 | `notice` | Pale blue notice with centred small text |
| 2 | `cover-photo` | Photo right; hatched frame |
| 3 | `cover` | Navy cover with glow and solid frame |
| 4 | `cover-wave` | Navy cover with wave frame |
| 5 | `donut-step-1` | Donut reveal, step 1 of 6 |
| 6 | `donut-step-2` | Donut reveal, step 2 of 6 |
| 7 | `donut-step-3` | Donut reveal, step 3 of 6 |
| 8 | `donut-step-4` | Donut reveal, step 4 of 6 |
| 9 | `donut-step-5` | Donut reveal, step 5 of 6 |
| 10 | `donut-step-6` | Donut reveal, step 6 of 6 |
| 11 | `panel-step-1` | Three-column panel reveal, step 1 of 4 |
| 12 | `panel-step-2` | Three-column panel reveal, step 2 of 4 |
| 13 | `panel-step-3` | Three-column panel reveal, step 3 of 4 |
| 14 | `panel-step-4` | Three-column panel reveal, step 4 of 4 |
| 15 | `section` | Navy title-only divider |
| 16 | `phone-hero` | Navy title and large phone right |
| 17 | `text-phone-cloud` | Pale text and phone/cloud illustration |
| 18 | `text-browser-screen` | Pale text and browser-style app screen |
| 19 | `bullets` | Pale bullets and phone in hand |
| 20 | `devices` | Pale 2 x 3 app-screen grid with captions |
| 21 | `integration-diagram` | Pale text and phone/gear integration diagram |
| 22 | `quadrant-matrix` | Pale quadrant matrix |
| 23 | `quadrant-callouts` | Quadrant matrix with white and navy callouts |
| 24 | `section-subtitle` | Navy title and subtitle |
| 25 | `split` | Navy text and 2 x 2 photo grid |
| 26 | `bullets-screen-short` | Navy bullets and shorter app screen |
| 27 | `bullets-screen-tall` | Navy bullets and tall app screen |
| 28 | `bullets-screen-poster` | Navy bullets and poster-format screen |
| 29 | `sentiment-grid` | Navy text and emoji sentiment grid |
| 30 | `section-subtitle-variant` | Title/subtitle variant; same placement as 24 |
| 31 | `bullets-phone` | Navy bullets and one phone |
| 32 | `bullets-phone-dense` | Navy denser bullet text and one phone |
| 33 | `bullets-two-phones` | Navy bullets and two phones |
| 34 | `statement` | Navy statement |
| 35 | `photo-callout-step-1` | Full-bleed photo, title and one callout |
| 36 | `photo-callout-step-2` | Full-bleed photo, title and two callouts |
| 37 | `steps-3` | Pale blue numbered 1?2 x 3 steps |
| 38 | `cards-3-light` | White title and three icon cards |
| 39 | `proposal-qr` | Pale phone and QR circles with frame |
| 40 | `proposal-tray` | Phone and QR card on a tray |
| 41 | `proposal-card` | Phone, QR card and envelope |
| 42 | `proposal-envelope-grid` | Phone and envelope-grid backdrop |
| 43 | `proposal-origami` | Phone and origami on marble |
| 44 | `section-subtitle-high` | Navy title/subtitle placed higher than 24/30 |
| 45 | `stats` | Navy three-stat row |
| 46 | `photo-panels-3` | Navy three labelled photo panels |
| 47 | `photo-cards-6` | Navy six photo cards |
| 48 | `text-circular-diagram` | Navy text and concentric-circle diagram |
| 49 | `bullets-system-diagram` | Navy bullets and system diagram |
| 50 | `cards-3` | Navy three icon cards with text |
| 51 | `cards-8` | Navy eight icon cards |
| 52 | `product-hero-room` | Navy product hero with room illustration |
| 53 | `product-hero-screens` | Navy product hero with screen illustration |
| 54 | `closing-frame` | Thank-you closing with frame |
| 55 | `closing` | Thank-you closing with slogan, logo and frame |

**Sequences** expand to several slides: `donut-build` (5-10), `panel-build`
(11-14), and `photo-callout-build` (35-36). They preserve the progressive
reveals; use `steps` for overrides on each source slide. Individual step names
remain available when only one state is needed.

Migration: `agenda` -> `steps-3`; `comparison` -> `panel-step-4`; `doughnut` ->
`donut-step-2`; `image-grid` -> `devices`; `photo` -> `cover-photo` (or choose a
photo-callout layout for a full-bleed image). `closing` now selects 55, not 3.
`table` was removed: there is no native table in the house deck. Use
`cards-3-light` for the real slide 38; it accepts text slots, not `rows`.

## Navigating the built deck

`index.html` is a presentation, not a scrolling page. One slide is shown at a
time and the stage scales to fit the window.

| Key | Does |
|---|---|
| `→` `space` `PageDown` | Next slide |
| `←` `PageUp` | Previous slide |
| `O` | Overview — every slide as a numbered thumbnail; click one to jump |
| `F` | Fullscreen |
| digits then `↵` | Jump to that slide number |
| `Home` `End` | First / last slide |
| `?` | Keyboard help |
| `Esc` | Close the overview or the help panel |

The control bar (previous, counter, next, overview, fullscreen) fades out after a
few seconds and returns on mouse movement, so a projected slide is not sitting
under a toolbar. A progress bar runs along the bottom edge. Swiping left and
right works on touch screens. `index.html#7` deep-links to slide 7.

None of this reaches the PDF — print CSS removes the chrome, and the PDF is one
slide per page.

## Brand rules this enforces

- **Corner radius 0.** Sharp corners are a hard brand rule (BRAND.md).
- **The frame marks content** (guidelines 2.4.2). It is a patterned corner-bracket
  pair forming one square, never a border and never hand-drawn. `deck.frame` picks
  a pattern from `assets/frames/` — the variants signal different content
  platforms (2.4.5), so pick one and keep it for the whole deck. Omit `frame` to
  keep the house cover art.
- Slogan with the frame: **"Let there be content" / "Be content!"**
- **No slide numbers.** The house deck has none; the extractor drops them.
- Palette and type come from the deck's own theme — do not restyle.

## Imagery

Product screens, illustrations and photography live at the repo root, not in the
plugin (the plugin cache never prunes, so bulk assets stay out of it):
`assets/app-screens/`, `assets/illustrations/`, `assets/image-themes/`.
Photography direction: `reference/imagery/image-themes.md`.
Never generate a photograph of a real named property, and ask before generating
imagery at all.

## Verify against the house slides

```bash
NEVRON_FONT_MODE=source node verify.mjs \
  ../../assets/ppt-extracted/media \
  ../../assets/ppt-reference \
  ../examples/presentation-standard/verification
```

Captures each layout at 1600×900 beside its exported house PNG and writes
`index.html` plus `results.json`. Run it after any change to the extractor or
renderer. `vertical-text-overflow` entries are informational — PowerPoint text
boxes overflow by design when autofit is off; judge by the pictures.

## Re-extract after the source PowerPoint changes

```bash
node extract.mjs "<path to the pptx>" reference/house.json ../../assets/ppt-extracted/media
```

Expect **0 warnings**. A warning names a picture the renderer cannot draw and
wants an explicit substitution; a non-zero count means something regressed.

## Known limits

- Chart plot bounds are not in the OOXML — Office auto-layouts them, so the donut
  ring geometry is a declared fallback and reads slightly thin against the export.
  Every build reports this rather than hiding it.
- EMF and WMF art is rasterised at 4× through GDI+, so it is pixels, not vector.
  Windows only; on macOS or Linux those pictures fall back to a substitution.
- `custGeom` (arbitrary DrawingML paths) is not drawn; it raises rather than
  guessing, and wants an image slot.
- Slide 43 still paints an opaque navy patch around the origami artwork, and some
  font weights and line wraps differ from the export. Renderer and source-art
  limitations, not alternative layouts.
- PDF print scaling **was** wrong and is now fixed — worth recording, because
  both causes are easy to reintroduce. Slides printed at ~67% inside correct
  960 × 540 pt pages, pinned top-left with white margins. Two separate causes:

  1. **Group child offsets were paint-only.** `render.mjs` emitted a group as
     `transform: scale(s) translate(-cx,-cy)` while its children kept absolute
     offsets, so a child's *layout* position was e.g. 1428 px inside a 960 px
     slide. The offset now goes into `left`/`top` — with `transform-origin: 0 0`,
     `scale(s)·translate(t)` and `left: s·t` + `scale(s)` are identical on screen,
     but the second is layout rather than paint.
  2. **Chrome's print fitter reads raw descendant layout.** Shapes may hang off
     the slide edge, which PowerPoint clips at the boundary. `overflow: hidden`,
     `contain: paint`, `clip-path` and `overflow: clip` all clip the *paint* and
     none of them stop the fitter shrinking every page to fit the widest one.
     `contain: size layout paint` on `.slide` does, because size containment
     makes the slide's box independent of its contents. Safe only because the
     renderer always writes an explicit width and height on the slide — do not
     drop those.

  Verify after any change to grouping or slide CSS: the PDF's painted area must
  be 960 × 540 pt, i.e. the nested content matrix is `3.125`, not less.
