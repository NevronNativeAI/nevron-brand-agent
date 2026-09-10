# Nevron document template — style tokens

Everything below is measured out of the OOXML of

```
J:\Produkcija\_Brand Identity\08_Documents\_Document Template\2025-02-Document template.docx
J:\Produkcija\_Brand Identity\08_Documents\_Document Template\2025-02-Document template_NoFirstpage.docm
```

plus the InDesign original (`_source/2024-08-Document_Template.indd`, whose annotated
preview PDF spells out the type sizes as `B 40-44`, `R 24-28`, `R 18`, `B 17`, `R 10`, `R 9`).

`styles.css` is the implementation. If the Word template changes, re-measure and
update both.

## Page geometry

| | Value | Source |
|---|---|---|
| Page | A4, 210 × 297 mm | `w:pgSz 11906 × 16838` |
| Top / bottom margin | 35 mm | `w:top` / `w:bottom` 1985tw |
| Left margin | 15 mm | `w:left` 851tw |
| Right margin | 12.5 mm | `w:right` 707tw |
| Text area | 182.5 × 227 mm | derived |
| Header band | 12.5 mm from page top | `w:header` 708tw |
| Footer band | 12.5 mm from page bottom | `w:footer` 708tw |

**Decorative grid.** The frame, cover type, cover/back logos, running-head text
and page number do *not* sit on the page margins — they run 21.3 mm → 191.3 mm,
a 170 mm column inset 20 mm from each side. Body copy sits on the Word margins
(15 mm / 12.5 mm). That split is in the original template; it is not a bug here.

## Colour

| Role | Value |
|---|---|
| Cover "Document type", frame, running head | `#ADAFB6` |
| Cover title / subtitle / prepared-by | `#ACAFB6` |
| Footer copyright + page number | `#C0C2C5` |
| Body text | `#000000` |
| Link style | `#0054A6` |
| TOC level 2 / 3 | `#333333` |
| Back cover ground | `#ADAFB6`, all type white |

## Type — Neue Haas Unica Pro throughout

| Word style | Face | Size | Spacing |
|---|---|---|---|
| Cover document type | Regular | 18 pt | box top 15.5 mm |
| Cover title | **Bold** | 40 pt | baseline block top 200.8 mm |
| Cover subtitle | Regular | 24 pt | top 220.2 mm |
| Cover prepared-by | Regular | 9 pt | top ~258 mm |
| `TitleA` / `TitleANUM` | **Bold** | 17 pt | 24 pt before, 25 pt after |
| `TitleB` / `TitleBNUM` | Medium | 12 pt | 24 pt before, 6 pt after |
| `TitleC` / `TitleCNUM` | Medium | 10 pt | 24 pt before, 6 pt after |
| `Paragraph` | Regular | 10 pt | single leading, 12 pt after |
| `BulletlistLVL1` | Regular | 10 pt | indent 6.35 mm, 0 after |
| `BulletlistLVL2` | Regular | 10 pt | indent 15 mm, hanging 5 mm |
| `NumberingLVL1` | Regular | 10 pt | indent 8.8 mm, hanging 6.3 mm, 6 pt before/after |
| `NumberingLVL2` | Regular | 10 pt | indent 12.3 mm |
| `Link` | Regular | 8 pt | brand blue |
| `Imagesubtext` | Regular | 8 pt | 12 pt after |
| `Disclaimer` | Regular | 7 pt | pinned to the foot of the intro page |
| `TOC1` | **Bold** | 10 pt | 5 pt after |
| `TOC2` | Regular | 9 pt | `#333333` |
| `TOC3` | Light | 9 pt | `#333333` |
| Running head | Regular | 9 pt | right-aligned to 190 mm |
| Footer | Regular | 9 pt | copyright left, page number right |

Heading numbering is `1`, `1.1`, `1.1.1` — decimal, no trailing dot
(`numbering.xml` abstractNum 3). Bullets are `•` at level 1 and `–` at level 2;
Word's own definition uses Symbol `•` then Courier `o`, which reads poorly at 10 pt.

## Cover furniture

| Element | Size | Position |
|---|---|---|
| Brand frame | 170 × 170 mm | left 21.3 mm, top 19.9 mm |
| Frame bracket arms | 32 % long, 10.2 % thick | top-right + bottom-left |
| Topic icon | 62.5 × 61.6 mm | page-centred, top 71 mm |
| Logo (grey, with tagline) | 46.2 × 13.8 mm | right edge 191.3 mm, top 263.7 mm |

The icon slot holds a placeholder gear in the Word file. It takes any icon from
the brand repo's `assets/icons/` — the annotated InDesign preview says so
outright: *"The icon can be adapted to the content"*.

The cover title is bottom-anchored and auto-shrinks (40 pt → 22 pt floor) so a
long title grows upward without running into the frame's bottom-left bracket.
The InDesign spec gives the title a 40–44 pt range, so scaling is in the design.

## Back cover

Full-bleed `#ADAFB6`. Same 170 mm square as the cover, drawn as open 1 mm white
rules with 36 % arms. "Let there be content!" 25 pt bold white, top-left.
Contact column and address column 9 pt white at the foot (company name bold),
white tagline lockup in the same slot as the cover logo.

## Pagination

`paginate.js` lays the flow out itself rather than leaving it to Chrome's page
breaking, because the table of contents needs to know which page each heading
landed on. It fills fixed 227 mm content boxes, splits paragraphs and tables
that overflow (two-line minimum on each side of a break), and never leaves a
heading stranded at the foot of a page.

Splitting a paragraph moves plain text only — bold, italic and links inside a
paragraph that breaks across a page are lost. Paragraphs that long are rare; if
one matters, split it in the source instead.

## Render engine

Headless Chrome `--print-to-pdf`, Edge as fallback, no npm dependencies.
`--virtual-time-budget=20000` gives the paginator time to run before the print
snapshot. `-webkit-print-color-adjust: exact` keeps the grey back cover from
dropping out.

Neue Haas Unica Pro is installed per-user on Kaja's machine
(`%LOCALAPPDATA%\Microsoft\Windows\Fonts`), including the Medium and Light
weights the template needs. On a machine without it the stack falls back to
Open Sans → Helvetica Neue → Arial and the line breaks will differ.
