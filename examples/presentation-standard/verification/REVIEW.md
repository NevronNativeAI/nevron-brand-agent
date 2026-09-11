# Catalogue verification — 2026-09-11

All 55 exports were visually inspected beside source-font HTML captures. The
catalogue names exactly one layout per house slide; named composition matches
direct `houseSlide` composition without changing the extracted scene graph.
The full mapping and migration notes are in `../../../presentation-standard/SKILL.md`.

Checks passed:

- 55 unique kebab-case names cover house slides 1–55 exactly once.
- All named layouts preserve the source composition, including closing 55.
- Donut 5–10, panel 11–14 and photo-callout 35–36 sequences expand in order.
- Per-step text overrides work without mutating house data.
- Retired names fail explicitly, including the removed derived table.
- All 55 captures completed; no missing-image diagnostics.
- Skill validation and Git whitespace checks passed.
- The example rebuilt to 27 HTML slides and 27 PDF pages. Every PDF page was
  rendered and visually inspected. The example generator and both JSON examples
  use the current catalogue.

Visual findings (not a pixel-match pass):

- Overall layout selection, composition and source imagery match the exports.
- Donut geometry retains its declared automatic-layout approximation.
- Source-font rendering differs in some weights and wraps, especially 45,
  47–48 and 50–53.
- 21: arrowheads are larger. 39: the curved connector follows the wrong arc.
- 22–23: pale grey icons render black.
- Navy bullet layouts show dark markers where the exports show white markers
  (25–29, 31–33, 49).
- 43: an opaque navy patch surrounds the origami image.
- Seven vertical-overflow diagnostics: shapes 9 and 13 on each of 12–14, and
  shape 18 on 50. The panel diagnostics concern obscured source text; the visible
  panels retain their composition. Slide 50 has different text wrapping.
- PDF print scaling is not correct: the first slide occupies about 645 × 363 pt
  within a 960 × 540 pt page. The previous committed PDF has the same class of
  issue (about 683 × 384 pt). Neither PDF is a full-page fidelity pass.

The extractor, renderer, house data and styles were left unchanged as requested.
The table composition branch, its colour-mixing helper and obsolete photo/closing
special cases were removed from the builder. No coordinates were transcribed.
The missing optional `Full.svg` override was removed from the example so the
original extracted house frames are used.

Reproduce from the repository root in PowerShell:

```powershell
$env:NEVRON_CHROME_ARGS='["--no-sandbox","--in-process-gpu"]'
node examples/presentation-standard/make-example.mjs
node plugins/nevron-brand/skills/presentation-standard/build.mjs examples/presentation-standard/deck.json examples/presentation-standard/deck --pdf
$env:NEVRON_FONT_MODE='source'
node plugins/nevron-brand/skills/presentation-standard/verify.mjs assets/ppt-extracted/media assets/ppt-reference examples/presentation-standard/verification
```

The Chrome flags above were required for headless Chrome in this Windows sandbox.
Written while the skill was held back under `work-in-progress/`. It now ships in
the plugin at `plugins/nevron-brand/skills/presentation-standard/`, and the
renderer defects listed above — bullet colour, the slide 39 arc and the 22–23
icon tint — have since been fixed. Slide 43 remains.
