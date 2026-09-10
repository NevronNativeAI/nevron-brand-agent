---
name: nevron-document-nocover
description: Generate a short Nevron document PDF with no cover page and no table of contents — content starts on page 1 under the running header, and the "Let there be content!" back cover closes it. Use when Kaja asks for a short Nevron document, meeting notes, a memo, a letter, a checklist, a one- or two-page write-up, a continuation document, or says "no cover page" / "no first page". For a full document with a cover and contents page, use nevron-document instead.
---

# Nevron document generator (no cover page)

Produces a print-ready A4 PDF matching
`J:\Produkcija\_Brand Identity\08_Documents\_Document Template\2025-02-Document template_NoFirstpage.docm`.

Same house styles as the full template, minus the front matter: no cover, no
introduction page, no disclaimer page, no table of contents. Content starts on
page 1 with the running header and footer already in place, and the back cover
closes the document.

Use it for anything short enough that a cover page would be overkill — meeting
notes, a memo, a checklist, a letter, a two-page technical note.

The `.docm` original carries a Word macro (`AdjustHeadingSpaceWithDebug`) that
tidies heading spacing at page tops. CSS handles that natively here, so there is
no macro to port.

## Page order

1. **Body, from page 1** — numbered sections (`1`, `1.1`, `1.1.1`), paragraphs,
   bullets, numbered lists, figures with captions, tables, NAS/URL links.
   Running header (grey wordmark left, running head right) and footer
   (copyright left, page number right) on every page. Auto-paginated.
2. **Back cover** — "Let there be content!", white bracket frame, contact block,
   white tagline logo.

## Scope — layout, not writing

Default behaviour is **layout only**: set the text Kaja gives you. Do not
invent, expand or rewrite copy, and do not fill gaps with placeholder prose. If
something is missing, ask. Write copy only when she explicitly asks for it —
then follow `BRAND.md` for tone.

## Where the output goes

There is no default location. **Ask where the document should be saved** and
build into a scratch working folder until Kaja confirms it. Once she confirms,
move it where she asked and delete the scratch folder, the superseded renders
and the preview PNGs.

## What to collect before building

- **Running head** — the grey line at the top right of every page. This is the
  only place the document names itself, so it matters more here than in the full
  template. Something like `Hotel Bled  I  Kick-off meeting`.
- **The content**, as markdown or as a `body` block array.
- Copyright year, if not the current one.

## Build steps

1. Make a working folder. Put any images in `<workdir>/images/`.
2. Write `<workdir>/content.md` and `<workdir>/data.json` — see
   `examples/data.example.json`. The only difference from the full template is
   `"variant": "nocover"`.
3. Build with the shared engine (it lives in the sibling skill):
   ```
   node "${CLAUDE_PLUGIN_ROOT}/skills/nevron-document/build.mjs" "<workdir>/data.json" "<workdir>/output" --png
   ```
   Writes `output/<slug>.html`, `output/<slug>.pdf` and, with `--png`, one PNG
   per page under `output/preview/`.
4. **Verify by reading the preview PNGs** — a PDF can't be eyeballed from a
   terminal, the PNGs can. Check: no heading stranded at the foot of a page, no
   table clipped, page numbers running from 1, back cover intact. Fix and re-run.
5. Show Kaja the PDF path and wait for her to confirm before filing anything.
6. **Stale viewer warning**: PDF readers cache by path. If a fix "didn't take",
   she is looking at the old file — render to a new name or ask her to reopen.

## data.json

| Field | Meaning |
|---|---|
| `slug` | Output filename, no extension. Use `<YYYY-MM>-<Name>`. |
| `variant` | **`"nocover"`** — this is what selects this layout. |
| `title` | Not printed on the page; used for the slug fallback and PDF title. |
| `runningHead` | Header text, top right of every page. |
| `year` | Footer copyright year. |
| `numbered` | `false` for unnumbered headings throughout. |
| `markdownFile` / `markdown` / `body` | The content. One of these is required. |
| `footerNote` | Overrides the footer copyright line. |
| `company` | Overrides any of name / street / city / country / phone / email / web. |
| `backHeadline` | Defaults to `"Let there\nbe content!"`. |
| `lang` | Document language attribute. Slovenian documents: `"sl"`. |

Cover fields (`docType`, `subtitle`, `coverIcon`, `intro`, `disclaimer`, `toc`)
are ignored in this variant.

## Markdown the parser understands

`#` / `##` / `###` headings · blank-line paragraphs · `-` bullets (indent two
spaces for level 2) · `1.` numbered lists (same indent rule) · `![caption](path)`
figures · `| a | b |` tables with a `| --- |` rule · `---` on its own line for a
page break · `**bold**`, `*italic*`, `[text](url)` inline · a bare `NAS:` or
`https://` line becomes the 8 pt blue Link style.

## Fidelity notes

Measurements, colours and type: `../nevron-document/reference/style-notes.md`.
The engine, stylesheet and paginator are shared with `nevron-document` — a
change there affects this skill too.
