# Offer page — style and pricing notes

## Where the design came from

`styles.css` is lifted verbatim from the live offer pages so a new offer cannot
drift from the ones already sent:

- `clients.nevron.co/NEU-Residences/ponudba`
- `clients.nevron.co/Ribno-Alpine-Resort/ponudba`
- `clients.nevron.co/Hotel-Kompas-Bled/ponudba`

236 rules. If the house look changes, re-lift it from the newest live offer rather
than hand-editing this copy.

## Type and colour

- **Inter** (400/500/600/700/800) from Google Fonts. Not Open Sans — the offer pages
  deliberately differ from the brand site.
- PrimeIcons 7.0.0 from jsDelivr.
- Brand palette under short names: `--m1` `#000126` … `--m6` `#E1F4FF`,
  `--s1` `#080C13` … `--s6` `#EFF0F0`, plus `--green` `#36A058` for the total row and
  `--orange` `#E56600`.
- Both font and icon CSS load remotely. Build online, or the PDF comes out wrong.

## Page furniture

| Piece | Class | Note |
|---|---|---|
| Validity bar | `.countdown` | Sticky, `data-expiry`, live ticker, flips to expired |
| Hero | `.cover` | Full-height navy gradient, badge + hook + meta pills |
| Lead module | `.hero-concept` | Poster image and the "Glavni modul" badge |
| Included items | `.module-row` in `.module-stack` | Own image, or the generated NevronCore poster |
| Timeline | `.tl-month` in `.timeline` | `--m1`, `--m2`, `--m3` modifiers tint each card |
| Licensing | `.section--dark` | Table, `.mr-final` total row, then the ladder |
| Ladder | `.license-phase` | `--active` (pilot, green), `--discount` (blue), plain |
| CTA | `.final-cta` | mailto, not a form — no backend to post to |

## The pricing model

Every figure in the three reference offers reconciles to:

```
monthly = rate × quantity × 30
```

Verified against the live pages before this skill was written:

| Line | Check | Result |
|---|---|---|
| Ribno platform | 40 × €0.10 × 30 | €120 ✓ |
| Kompas platform | 45 × €0.10 × 30 | €135 ✓ |
| Kompas check-in | 20 × €0.05 × 30 | €30 ✓ |
| Kompas orders | 20 × €0.04 × 30 | €24 ✓ |
| NEU capacity | 200 beds × €0.50 | €100 ✓ |
| NEU AI Memory | 200 beds × €1.00 | €200 ✓ |

Capacity is the exception — it is billed monthly, not daily, and is **whichever of
beds × €0.50 and rooms × €1.00 is higher**.

A whole-bill monthly minimum applies. It is not a floor on any single line: below it
you pay the minimum, above it you pay what you use.

## Source of truth for rates

The live SaaS pricing page:
```
J:/Produkcija/HišnaProdukcija-TrzenjskiMateriali/2026-SaaS-Website/pricing.html
```
`reference/rate-card.json` is a dated snapshot for when J: is unreachable. The
resolver reads the live page, compares it against the snapshot, prints any drift, and
lets the live values win. The page always states which source and which date it used.

**The old offers are not a pricing source.** They predate the current rate card and
carry rates that no longer apply — the AI ChatBot line alone appears at both €0.12 and
€0.08 across them. Quote from the rate card, never from a previous offer.

## Things that will bite you

- Slovenian number format is `€304,00`, comma decimal. The builder uses `sl-SI`
  automatically from `lang`; do not hand-format currency into `data.json`.
- The countdown needs `validUntil` as `YYYY-MM-DD`; it appends end-of-day itself.
- Images are copied into the output folder, so `data.json` paths are relative to
  `data.json`, not to the output.
- The mailto link is the only interactive element. The reference pages have a posting
  form; that needs a backend this skill does not ship.
