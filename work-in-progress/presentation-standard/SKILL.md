---
name: presentation-standard
description: Generate a Nevron business presentation deck from the house PowerPoint layouts — covers, section dividers, agendas, bullets, text-plus-visual splits, icon card grids, comparison panels, progressive donut and panel builds, stat rows, device screenshot rows, tables and closings. Renders 16:9 HTML that matches the house slides shape for shape, and prints to PDF via headless Chrome. Use when Kaja asks for a presentation, a deck, a pitch deck, a product overview or a customer presentation. For philosophy or vision decks with no slide templates, use presentation-abstract instead.
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

## deck.json

```jsonc
{
  "title": "NevronCore — guest experience",
  "mediaRoot": "../../assets/ppt-extracted/media",  // extracted house imagery
  "fontDir": "../../assets/ppt-extracted/fonts",    // embeds Open Sans for portability
  "frame": "HorizonalBig.svg",                      // optional: swap the cover frame pattern
  "slides": [
    { "layout": "cover", "text": { "2": [{ "runs": ["NevronCore", "\n", "Guest experience"] }] } },
    { "layout": "bullets", "section": "Product", "text": { "3": ["Simple and friendly GUI", "…"] } },
    { "layout": "donut-build", "steps": [ {}, { "charts": { "7": [30, 70] } } ] },
    { "layout": "table", "rows": [["Module", "Included", "Price"], ["GuestFlow", "Yes", "€120"]] }
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

**Layouts:** `cover` · `cover-photo` · `section` · `agenda` · `bullets` ·
`split` · `cards-3` · `cards-8` · `comparison` · `stats` · `doughnut` ·
`devices` · `image-grid` · `table` · `photo` · `closing`.

**Sequences** expand to several slides — `donut-build` (house 5–10, one donut
revealed over six slides) and `panel-build` (house 11–14, a three-column panel
filled a column at a time). Use them; the reveal is how the house deck argues.

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
  ../../../../assets/ppt-extracted/media \
  ../../../../assets/ppt-reference \
  ../../../../examples/presentation-standard/verification
```

Captures each layout at 1600×900 beside its exported house PNG and writes
`index.html` plus `results.json`. Run it after any change to the extractor or
renderer. `vertical-text-overflow` entries are informational — PowerPoint text
boxes overflow by design when autofit is off; judge by the pictures.

## Re-extract after the source PowerPoint changes

```bash
node extract.mjs "<path to the pptx>" reference/house.json ../../../../assets/ppt-extracted/media
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
