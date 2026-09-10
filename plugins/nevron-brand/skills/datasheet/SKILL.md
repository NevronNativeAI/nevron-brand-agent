---
name: datasheet
description: Generate a Nevron product datasheet PDF in the exact house style (grey cover with a diagonal brand frame, PRODUCT OVERVIEW with dimension lines, PORTS band, black-barred TECHNICAL SPECIFICATIONS tables, "Let there be content!" back cover). Use when Kaja asks to make/create a new datasheet, a spec sheet, or a product datasheet — for set-top boxes, servers, remotes, or any Nevron/Homatics/Translite device. Rebuilds the InDesign look as HTML/CSS and renders to PDF via headless Chrome (no InDesign needed).
---

# Nevron Datasheet generator

Produces a print-ready A4 datasheet PDF in the house style. Pipeline: a `data.json` → `build.mjs` fills an HTML template → system Chrome prints it to PDF. Everything lives in this skill folder.

## Where datasheets live
```
J:\Produkcija\HišnaProdukcija-TehničnaBesedila\Datasheets
```
This is the home of every Nevron datasheet — the InDesign originals to clone from, and where each finished sheet is filed once Kaja confirms it (structure + naming under [Saving to Datasheets](#saving-to-datasheets-production-naming)). Build in a scratch working folder first; never draft straight into this root.

## Output structure (fixed 5+ page layout)
1. **Cover** — grey (`#ADAFB6`), "Datasheet" label, a single **brand frame** (diagonal-hatch L-brackets, top-right + left-middle), centred product render with drop shadow, big bold product name + subtitle, prep line, white tagline logo.
2. **Product overview** — white running header (grey wordmark left, `Datasheet | <headerName>` right, no rule), `PRODUCT OVERVIEW` navy heading, justified 2-column copy + product renders with **technical dimension lines** (leader lines + end ticks), then a grey **PORTS** band (fills to the page bottom) with connector **leader-line labels**.
3–n. **Technical specifications** — black section bars (Hardware platform, Network, DRM, Audio and video, Interface, RCU, Power supply, General …), bold label · one continuous thin **black** divider · value rows. Auto-paginates, never clips a row.
last. **Back cover** — grey, "Let there be content!", white bracket motif, address + tagline logo.

## What to collect before building
Ask Kaja for whatever is missing — do not invent product facts:
- **Product name + subtitle** and the **header name** (running header). e.g. "TL-4KBR" / "Android TV 4K Set Top Box".
- **A reference datasheet to clone** — the closest existing folder under the Datasheets root. Read its PDF to mirror the spec sections/rows.
- **Raw specs** — a spec dump (text, CSV, an existing datasheet PDF, or `.xlsx`). Read PDFs/text directly and transcribe into `specs`. For `.xlsx`, ask Kaja to paste/export CSV (Node here has no xlsx reader). **Copy every row exactly — never drop or paraphrase a value.**
- **Product photos** — Kaja provides clean renders (hero top view, front/side for dimensions, and the port panels). Copy into `<workdir>/images/`. **Never AI-generate product imagery, and never pull renders from other project folders without asking first** (global hard rule). Product renders often already exist in the existing datasheets — ask before reusing.
- **Overview prose** — write it in the house tone if not supplied: calm, factual, hospitality/managed-deployment framing, **4 tight paragraphs** (longer overflows the page). Scrub any third-party branding.

## Build steps
1. Create a working folder and put product images in `<workdir>/images/`.
2. Write `<workdir>/data.json` from `examples/data.example.json` (the complete schema reference).
3. Run the builder:
   ```
   node "${CLAUDE_PLUGIN_ROOT}/skills/datasheet/build.mjs" "<workdir>/data.json" "<workdir>/output"
   ```
   Writes `output/<slug>.html` and `output/<slug>.pdf`.
4. **Verify** by reading the produced PDF back. Cheap per-page check: split one `<section>` into its own HTML and `chrome --headless --screenshot` it to a PNG. Confirm frame placement, dimension lines, every port label aligned, all spec rows present, back cover intact. Iterate and re-run.
5. **Watch for stale viewers**: PDF viewers cache by path. If Kaja says a fix "didn't take", the viewer is showing the old file — render to a NEW filename or have her close + reopen. Delete superseded PDFs from the output folder to avoid confusion.
6. Report the PDF path and wait for Kaja to confirm the sheet.
7. **Once confirmed**: file it into the Datasheets root (below), then **remove the trash** — delete the scratch working folder, superseded PDF/HTML renders, downloaded source images, and any intermediate cutouts/previews. Only the filed `<YYYY-MM>-<Product>/` folder survives. Do not delete anything before she confirms.

## Saving to Datasheets (production naming)
Match the existing structure exactly:
```
J:/Produkcija/HišnaProdukcija-TehničnaBesedila/Datasheets/
  <YYYY-MM>-<Product>/
    <YYYY-MM>-Datasheet_<Product>.pdf
    _Source/
      data.json
      <YYYY-MM>-Datasheet_<Product>.html
      images/…            (product renders)
      <Frame>.svg         (the chosen frame, for reference)
```
Set `slug` to `<YYYY-MM>-Datasheet_<Product>` so the PDF/HTML are named correctly. Example on disk: `2026-07-TL-4KBR/2026-07-Datasheet_TL-4KBR.pdf`.

## data.json schema
See `examples/data.example.json` for a complete working example. Fields:
- `slug` — output filename. `product`, `subtitle`, `headerName`, `date` (e.g. "July 20, 2026"), `year`.
- `coverImage` — path (relative to data.json) to the clean hero render (top view).
- `overview` — array of ~4 paragraph strings.
- `overviewImages` — `[{ src, dimV?, dimH? }]`. `dimV` draws a vertical dimension line (with ticks) on the image's right; `dimH` a horizontal one below. Use the top view for W×D and a side/port view for H.
- `ports` — array; each item is either a path string, or `{ src, labels: [[xPercent, "Name"], …] }`. `xPercent` is the connector's horizontal centre as a % of the image width — **measure it** (overlay a % ruler over the photo and screenshot) so leader lines line up. Omit or `[]` to hide the band.
- `specs` — `[{ section, rows: [[label, value], …] }]`, in order. Groups kept whole, auto-paginated.
- `frame` — optional: a specific frame filename (e.g. `"DiagonalBig.svg"`) or path. **Omit to pick a random geometric frame** from the Frames folder. `framesDir` overrides the folder. The build prints which frame it used and, when the pick was random, the exact `"frame"` value that reproduces it — copy that into `data.json` before filing the sheet so the cover can be rebuilt.
- `backHeadline` (default "Let there\nbe content!"), `company` (defaults to Nevron d.o.o — override only if needed).

## Frames
- Source: the 19 approved line-hatch frames ship with the plugin at `${CLAUDE_PLUGIN_ROOT}/assets/frames`, so a build needs no network share. The full house set lives at `J:/Produkcija/_Brand Identity/17_Concepts/Frames` — point `framesDir` there when you are on the office network and want a frame outside the approved pool.
- The builder picks a **random line-hatch geometric** frame (diagonal, horizontal, vertical, thin, double, cross, X, full) and **inlines it** (exact + self-contained). Pixel/dot/circle/checker/organic patterns and the sparse non-Big diagonals are excluded — they clash with the layout. Adjust `FRAME_ALLOW`/`FRAME_DENY`/`FRAME_EXCLUDE` in `build.mjs` to change the pool.
- Placement: a 178mm square inset 16mm from the top-right, so the decoration lands top-right + left-middle (the reference layout). Do **not** overlay a separate white square — in the original examples the corner square was part of that specific frame asset, not a permanent element.

## Fidelity notes
- Palette, fonts, geometry: `reference/style-notes.md`. Cover/back grey `#ADAFB6`; section bars/divider black; headings navy `#00052E`.
- Logos come from the plugin's shared set at `${CLAUDE_PLUGIN_ROOT}/assets/logos/` — the tagline lockup for the cover and back, the grey no-tagline wordmark for the running header. Never inline or recreate them.
- Body font Arial/Helvetica (matches InDesign). Installing "Neue Haas Unica" sharpens fidelity but isn't required.
- Renderer auto-detects Chrome then Edge; override with `CHROME_PATH=<path>`. If no browser, it still writes the HTML — open and Print → Save as PDF (A4, no margins, background graphics on).
- Units in the source spec sheets are often imperial (e.g. `< 2 lbs`); ask Kaja if she wants metric.
