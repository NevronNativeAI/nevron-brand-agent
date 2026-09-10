# Datasheet style tokens

Sampled directly from the source InDesign PDFs (ICCBased RGB `scn` operands) under
`J:/Produkcija/HišnaProdukcija-TehničnaBesedila/Datasheets`. These are the source of truth
for `styles.css`.

## Colours
| Role | Value | Origin |
|------|-------|--------|
| Cover + back-cover background | `#ADAFB6` | `0.678 0.686 0.714 scn` |
| Section bars, bold spec labels, primary text | `#000000` | `0 0 0 scn` |
| Section headings (PRODUCT OVERVIEW …) | `#00052E` navy | `0 0.02 0.18 scn` |
| Inner-page background (behind white cards) | `#EFF0F0` | light fill / brand s6 |
| White cards / stripes / bracket rules | `#FFFFFF` | `1 1 1 scn` |
| Spec values | `#3A3D43` | slightly lighter than labels |
| Spec group divider | `#000000` | one continuous thin (0.25mm) **black** line per group |
| Dimension lines + measurement text | `#6E7278` | leader lines / ticks / captions |
| Running-header meta + grey wordmark | `#9BA0A6` | measured (no header rule) |

Brand system reference: `${CLAUDE_PLUGIN_ROOT}/tokens/nevron-tokens.css`
(the datasheet grey is datasheet-specific, NOT the brand navy).

## Type
- Family: `'Neue Haas Unica', 'Helvetica Neue', Arial, sans-serif` (InDesign uses a Helvetica-class face; Arial renders faithfully).
- Cover title ~42pt/700; subtitle ~20pt/400.
- Section titles ~19pt/700 uppercase, navy.
- Section bars 11pt/700 white on black.
- Spec rows 9pt; labels 700 black, values 400 grey.
- Body copy 9.5pt, line-height ~1.65, justified.

## Geometry
- Page: A4 portrait, full-bleed via a `.page__bg` layer inset −3mm (kills print slivers). Content margin 16mm.
- Running header band 26mm tall, white, **no** rule.
- Section bar width 62mm; label column 46mm; one continuous black divider at 53mm.
- **Cover frame**: a single brand frame from `J:/Produkcija/_Brand Identity/17_Concepts/Frames` (square, white line-hatch L-brackets), **inlined** into the page. Placed 178mm square, inset 16mm from the top-right → decoration lands top-right + left-middle. No separate white square (that was part of the original example's own frame asset).
- **Dimension lines**: `.dimv` (right of image) / `.dimh` (below) — 0.2mm leader line, end ticks, caption with no fill.
- **Ports**: grey band flex-pinned to the page bottom; each connector gets a 0.2mm leader line + caption placed at its measured `xPercent`.
- Back cover: two open white bracket corners (1mm rules), top-right and bottom-left.

## Assets (`../assets/`)
- `nevron-tagline-white.svg` — cover + back footer lockup (nevron + "elevating guest experience").
- `nevron-wordmark.svg` / `nevron-wordmark-grey.svg` — inner-page running-header logo (grey used).
- `nevron-icon.svg` — bracket mark only (spare).
- Frames are NOT stored here — the builder reads + inlines them from the brand Frames folder at build time.

## Render engine
Headless Chrome `--print-to-pdf` (Edge fallback). No npm dependencies. `-webkit-print-color-adjust: exact`
forces the grey/black backgrounds to print.
