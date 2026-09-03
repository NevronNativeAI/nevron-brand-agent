---
name: nevron-document
description: Generate a full Nevron document PDF in the house Word-template style — grey cover with the brand frame and a topic icon, introduction page with the legal disclaimer at its foot, auto-numbered table of contents, numbered body sections, and the "Let there be content!" back cover. Use when Kaja asks for a Nevron document, report, guide, specification, proposal, manual, project document or "a document in the Nevron template", and it needs a cover page. For a short document with no cover or contents page, use nevron-document-nocover instead.
---

# Nevron document generator (full)

Produces a print-ready A4 PDF matching
`J:\Produkcija\_Brand Identity\08_Documents\_Document Template\2025-02-Document template.docx`.

Pipeline: a `data.json` (plus a markdown file for the content) → `build.mjs`
fills an HTML template → system Chrome prints it to PDF. No InDesign, no Word,
no npm install.

## Page order

1. **Cover** — grey brand frame (170 mm square), "Document type" label, a topic
   icon of your choosing, big bold title + subtitle, prep line, grey tagline logo.
2. **Introduction** — running header and footer start here; the legal disclaimer
   sits at the foot of this same page (7 pt), exactly as the template does it.
3. **Table of contents** — auto-built from the headings, with real page numbers.
4. **Body** — numbered sections (`1`, `1.1`, `1.1.1`), paragraphs, bullets,
   numbered lists, figures with captions, tables, NAS/URL links. Auto-paginated.
5. **Back cover** — "Let there be content!", white bracket frame, contact block,
   white tagline logo.

## Scope — layout, not writing

Default behaviour is **layout only**: take the text Kaja gives you (a markdown
file, a paste, an existing document) and set it. Do not invent, expand or
rewrite copy, and do not fill gaps with placeholder prose. If something is
missing, ask. Write copy only when Kaja explicitly asks for it — then follow
`BRAND.md` for tone.

## Where the output goes

There is no default location. **Ask where the document should be saved** and
build into a scratch working folder until Kaja confirms it. Once she confirms,
move it where she asked and delete the scratch folder, the superseded renders
and the preview PNGs.

## What to collect before building

- **Document type** — the small grey label on the cover ("Technical
  documentation", "Project specification", "Proposal", …).
- **Title** and **subtitle**.
- **Running head** — the grey line at the top right of every inner page.
  Defaults to `Title  I  Subtitle`.
- **Date** for the cover prep line, and the copyright year.
- **Topic icon** — any SVG from `../../assets/icons/` (the contentware set has
  60-odd) or a path to one. Named in `coverIcon`, tinted grey automatically.
  The InDesign original says outright that the icon adapts to the content.
- **Introduction** — one or two short paragraphs.
- **The content**, as markdown or as a `body` block array.

## Build steps

1. Make a working folder. Put any images in `<workdir>/images/`.
2. Write `<workdir>/content.md` and `<workdir>/data.json`
   (`examples/data.example.json` + `examples/sample.md` are a complete pair).
3. Build:
   ```
   node "C:/Users/Kaja/.claude/mcp-servers/nevron-brand-agent/skills/nevron-document/build.mjs" "<workdir>/data.json" "<workdir>/output" --png
   ```
   Writes `output/<slug>.html`, `output/<slug>.pdf` and, with `--png`, one PNG
   per page under `output/preview/`.
4. **Verify by reading the preview PNGs** — a PDF can't be eyeballed from a
   terminal, the PNGs can. Check: cover title clear of the frame, icon sensible,
   TOC page numbers correct, no heading stranded at the foot of a page, no table
   clipped, back cover intact. Fix and re-run.
5. Show Kaja the PDF path and wait for her to confirm before filing anything.
6. **Stale viewer warning**: PDF readers cache by path. If a fix "didn't take",
   she is looking at the old file — render to a new name or ask her to reopen.

## data.json

`examples/data.example.json` is the working reference. Fields:

| Field | Meaning |
|---|---|
| `slug` | Output filename, no extension. Use `<YYYY-MM>-<Name>`. |
| `variant` | Omit, or `"full"`. |
| `docType` | Grey cover label. |
| `title`, `subtitle` | Cover type. Title auto-shrinks if long. |
| `runningHead` | Inner-page header text. Defaults to `title  I  subtitle`. |
| `date`, `year` | Cover prep line and copyright. |
| `coverIcon` | Icon name or path, e.g. `"contentware/APPSB.svg"`. |
| `introTitle`, `intro` | Heading and paragraph array for page 2. |
| `disclaimer` | Overrides the standard legal text. |
| `toc`, `tocTitle` | `false` drops the contents page. |
| `numbered` | `false` for unnumbered headings throughout. |
| `markdownFile` / `markdown` / `body` | The content. One of these is required. |
| `footerNote` | Overrides the footer copyright line. |
| `company` | Overrides any of name / street / city / country / phone / email / web. |
| `backHeadline` | Defaults to `"Let there\nbe content!"`. |
| `lang` | Document language attribute. Slovenian documents: `"sl"`. |

## Markdown the parser understands

`#` / `##` / `###` headings · blank-line paragraphs · `-` bullets (indent two
spaces for level 2) · `1.` numbered lists (same indent rule) · `![caption](path)`
figures · `| a | b |` tables with a `| --- |` rule · `---` on its own line for a
page break · `**bold**`, `*italic*`, `[text](url)` inline · a bare `NAS:` or
`https://` line becomes the 8 pt blue Link style.

## Fidelity notes

- Measurements and colours: `reference/style-notes.md`. Re-measure if the Word
  template is ever revised.
- Logos come from the repo's own `assets/logos/`, inlined and recoloured — never
  redraw them.
- The engine also serves `nevron-document-nocover`; a change here affects both.
- Renderer auto-detects Chrome then Edge. Override with `CHROME_PATH`. With no
  browser it still writes the HTML — open it and Print → Save as PDF (A4, no
  margins, background graphics on).
