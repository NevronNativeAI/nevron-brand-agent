# Nevron Brand Specification

Full brand reference. The `nevron-brand` agent reads this on demand — it does not memorize it.

---

## Brand Personality

Nevron is a **technology company serving the hospitality industry**.

| Trait | Meaning |
|-------|---------|
| Professional | Enterprise-grade reliability, trustworthy |
| Modern | Clean, contemporary design language |
| Innovative | Forward-thinking tech solutions |
| Approachable | Warm enough for hospitality, not cold corporate |
| Confident | Bold in capability claims, backed by substance |

**Voice:** Clear, direct, technically competent. Avoids jargon when speaking to hotel staff, embraces it with technical audiences. Never salesy or hyperbolic.

**Tagline:** *Smart solutions for smart hotels*

**Product name:** **NevronCore** — one word, capital N and C. Never "Nevron Core" or "nevroncore". Position as a platform, not just software.

**Product areas:**
- Hotel Apps — guest-facing mobile and web applications
- TV Portals — in-room entertainment and information systems
- Mobile Apps — staff and guest mobile applications
- Dashboard — hotel management and analytics interface

---

## Color System

All brand tokens are available as CSS custom properties in `tokens/nevron-tokens.css`. Always use the tokens, not raw hex.

### Primary Blues (main brand scale)

| Token | Hex | CSS var | Usage |
|-------|-----|---------|-------|
| M1 — Navy | `#000126` | `--nevron-color-m1` | Darkest backgrounds, text on light |
| M2 — Dark Blue | `#002391` | `--nevron-color-m2` | Secondary dark, accents |
| M3 — Brand Blue | `#1B92FF` | `--nevron-color-m3` | **Primary brand color, CTAs, links** |
| M4 — Medium Blue | `#73C7FF` | `--nevron-color-m4` | Interactive states, highlights |
| M5 — Light Blue | `#C3E9FF` | `--nevron-color-m5` | Backgrounds, decorative |
| M6 — Pale Blue | `#E1F4FF` | `--nevron-color-m6` | Light backgrounds, cards |

### Secondary Grays

| Token | Hex | CSS var | Usage |
|-------|-----|---------|-------|
| S1 — Near Black | `#080C13` | `--nevron-color-s1` | Body text |
| S2 — Dark Gray | `#353941` | `--nevron-color-s2` | Secondary text |
| S3 — Medium Gray | `#707379` | `--nevron-color-s3` | Tertiary text, borders |
| S4 — Gray | `#B4B6B9` | `--nevron-color-s4` | Disabled states, placeholders |
| S5 — Light Gray | `#E0E1E2` | `--nevron-color-s5` | Borders, dividers |
| S6 — Off White | `#EFF0F0` | `--nevron-color-s6` | Subtle backgrounds |

### Supporting Colors — functional only, never decorative

| Token | Hex | Usage |
|-------|-----|-------|
| Red | `#DA2025` | Errors, destructive actions, alerts |
| Orange | `#E56600` | Warnings, attention |
| Yellow | `#F6A900` | Caution, highlights |
| Green | `#36A058` | Success, confirmation, positive |

### Neutrals

| Token | Hex | Usage |
|-------|-----|-------|
| Black | `#000000` | Pure black — use sparingly |
| White | `#FFFFFF` | Backgrounds, text on dark |

### Color Rules

1. Primary actions use M3 (`#1B92FF`)
2. Dark backgrounds use M1 (`#000126`) or S1 (`#080C13`)
3. Body text: S1 on light, White on dark
4. Supporting colors are functional only — never decorative
5. Never mix primary blues with supporting colors as co-equal accents
6. Maintain WCAG AA minimum (4.5:1 body text, 3:1 large text)
7. Emphasis uses M3 blue — not bold red

### Gradients — the only approved patterns

Two gradients are brand-approved. No other gradient combinations are on-brand.

**1. Blue gradient (text accents, decorative elements)**

```css
background: var(--nevron-gradient-blue);
/* = linear-gradient(135deg, M3, M4, M5) */
```

Use for: gradient text highlights, decorative bars, accent surfaces, illustrations. When applied as `background-clip: text`, remember the descender-clip pitfall (set `display: inline-block` + `line-height: 1.4`).

**2. Dark gradient (dark backgrounds, hero sections)**

```css
background: var(--nevron-gradient-dark);
/* = radial-gradient: soft disc of M3-at-40%-over-M1 (held 0-25%),
     smooth fade to M1 by 80% */
```

A radial glow of **M3 (or M2 for subtler)** placed over **M1 Navy**. Position can be `center`, `top`, `top left`, `top right`, `bottom`, `bottom right`, etc. — corner and edge variants are all on-brand.

Subtler variant using M2 instead of M3:

```css
background: var(--nevron-gradient-dark-subtle);
/* = same pattern with M2 instead of M3 */
```

For a custom position, compose inline (still on-brand):

```css
background: radial-gradient(ellipse at top left,
  var(--nevron-color-m3),
  var(--nevron-color-m1));
```

**What's NOT allowed:**
- Linear gradients across the full color scale
- Gradients involving supporting colors (red/orange/yellow/green)
- Gradients mixing blues with grays
- Multi-stop decorative gradients outside these two patterns

---

## Typography

### Primary typeface: Neue Haas Unica

```css
font-family: 'Neue Haas Unica', 'Open Sans', 'Helvetica Neue', Arial, sans-serif;
```

**Open Sans** is the web fallback when Neue Haas Unica is not available (freely available from Google Fonts).

### Type Scale

| Level | Size | Weight | Line height | Usage |
|-------|------|--------|-------------|-------|
| Display | 3rem (48px) | 700 | 1.1 | Hero headlines |
| H1 | 2.25rem (36px) | 300 (light) | 1.15 | Page titles — thin weight is deliberate |
| H2 | 1.75rem (28px) | 600 | 1.2 | Section headings |
| H3 | 1.375rem (22px) | 600 | 1.25 | Subsection headings |
| H4 | 1.125rem (18px) | 600 | 1.3 | Card titles, labels |
| Body Large | 1.125rem (18px) | 400 | 1.6 | Lead paragraphs |
| Body | 1rem (16px) | 400 | 1.5 | Default body text |
| Body Small | 0.875rem (14px) | 400 | 1.5 | Captions, metadata |
| Caption | 0.75rem (12px) | 400 | 1.4 | Fine print |

### Typography Rules

1. Use `rem` units for all font sizes
2. Max 2-3 font weights per page/slide
3. Headings: 600-700. Body: 400
4. Line length: 60-75 characters optimal
5. Paragraph spacing: 1em between paragraphs

---

## Logo

### Variants

All six variants live in `assets/logos/`.

| Variant | File | When to use |
|---------|------|-------------|
| Monogram / Icon | `nevron-logo-icon.svg` | Favicons, app icons, small avatars, loading states |
| Icon (white) | `nevron-logo-icon-white.svg` | Monogram on dark backgrounds |
| Without tagline (blue) | `nevron-logo-no-tagline-blue.svg` | Navigation, headers, small-medium placements |
| Without tagline (white) | `nevron-logo-no-tagline-white.svg` | Navigation/headers on dark |
| With tagline (blue) | `nevron-logo-tagline-blue.svg` | Hero sections, large placements, first impressions |
| With tagline (white) | `nevron-logo-tagline-white.svg` | Hero sections on dark |

### Logo Rules

1. **Clear space:** min 1/3 of logo height around all sides. Optimal: 2/3 of logo height
2. **Dark backgrounds** → white variant
3. **Light backgrounds** → blue variant
4. **Minimum size:** monogram 24px, without tagline 80px wide, with tagline 120px wide
5. **Never:** stretch, distort, rotate, add shadows/effects, change colors, place on busy backgrounds, crop
6. **NEVER inline or recreate the logo SVG.** Always copy the source file from `assets/logos/` into the project folder and reference it via `<img src="...">`. Recreating the SVG from memory or paths produces garbled letterforms. "Self-contained single file" is not a valid reason to inline a logo — use an `<img>` with a sibling SVG file instead.

### Logo Selection — quick decision

```
Space < 80px?             → Monogram / Icon
First-impression (hero)?  → With tagline
Nav, header, repeated?    → Without tagline
Dark background?          → White variant
Light background?         → Blue variant
```

---

## Icons — MANDATORY: PrimeIcons

PrimeIcons is the primary icon library. Do **not** use inline SVGs, Heroicons, Lucide, or any other source unless PrimeIcons genuinely lacks the icon.

### Setup

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/primeicons/primeicons.css">
```

npm: `npm install primeicons`

### Usage

```html
<i class="pi pi-check"></i>
<i class="pi pi-home"></i>
<i class="pi pi-user"></i>
```

### Verification — REQUIRED

Before using any icon name, verify it exists. Grep the local list:

```
{BRAND_REPO}/assets/primeicons-list.txt
```

Never guess icon names. An unverified name renders as a blank space.

### Fallback to custom icons

Only fall back to `assets/icons/*.svg` (custom Nevron icons) if PrimeIcons truly has no equivalent. Custom icons come in three categories:

- `icons/web/` — 46 platform feature icons
- `icons/contentware/` — 62 hotel service & content icons
- `icons/technical/` — 19 infrastructure icons

Naming: PascalCase with `B` suffix (Blue variant), e.g., `RoomControlB.svg`, `PowerfulCMSB.svg`.

---

## Brand Assets

Everything lives under `assets/`.

```
assets/
├── logos/                          # 6 SVG logo variants
├── icons/                          # Custom Nevron SVG icons (blue)
│   ├── web/                        # 46 icons — product/platform features
│   ├── contentware/                # 62 icons — hotel services & content
│   └── technical/                  # 19 icons — infrastructure & tech
├── illustrations/                  # Brand illustrations (SVG + PNG)
│   ├── IL*.png                     # App state illustrations (login, cart, check-in)
│   ├── Asset *.svg                 # Abstract brand illustrations
│   ├── Isometric room.svg
│   ├── Room_Flat.svg
│   ├── Partners.svg
│   └── Nevron_ilustracija_*.png    # Full brand illustration scenes
├── product-images/                 # Hardware product photos (PNG)
│   ├── FaSTBox *.png               # Set-top box models
│   ├── Remote_*.png                # Remote control models
│   └── Tablet.png
├── screenshots/                    # NevronCore app screenshots (PNG)
│   ├── mobile/                     # 69 screens
│   ├── tablet/                     # 41 screens (H + V)
│   └── tv/                         # 22 screens
├── fonts/
│   └── README.md                   # Font licensing info
└── primeicons-list.txt             # Verified PrimeIcons names
```

### Screenshot naming

Pattern: `{Device}_{Feature}.png`

- Mobile: `Mobile_Dashboard_v1.png`, `Mobile_AiChat.png`, `Mobile_Cart.png`
- Tablet (horizontal): `TabletH_Dashboard_v1.png`, `TabletH_LiveTV.png`
- Tablet (vertical): `TabletV_Dashboard_v1.png`, `TabletV_Cart.png`
- TV: `TV_Dashboard.png`, `TV_LiveTV.png`, `TV_Cart.png`

### Asset usage rules

1. **Copy files into the project folder** before referencing — never link directly to repo paths in shipped code
2. Use real brand assets when appropriate, but **sparingly**. Not every section needs an image
3. Pick assets that genuinely add value to the content

---

## Format-Specific Guidelines

### Web (HTML/CSS)

**Architecture:**
- Mobile-first responsive (`min-width` breakpoints)
- Semantic HTML5 (proper heading hierarchy, landmarks)
- BEM naming: `.block__element--modifier`
- Import `tokens/nevron-tokens.css` for all brand tokens

**Breakpoints:**
- Mobile: base (< 768px)
- Tablet: `min-width: 768px`
- Desktop: `min-width: 1024px`
- Wide: `min-width: 1440px`

**Spacing (8px grid):**
- `0.5rem, 1rem, 1.5rem, 2rem, 3rem, 4rem, 6rem` (= 8, 16, 24, 32, 48, 64, 96 px)

**Corner radius — hard brand rule: default is 0 (sharp corners).**

| Element | Radius | Token |
|---------|--------|-------|
| **Cards** | **0 (always)** | `--nevron-radius-lg` |
| Buttons, inputs (default) | 0 | `--nevron-radius-md` |
| Modals, large containers | 0 | `--nevron-radius-xl` |
| Hero sections | 0 | `--nevron-radius-2xl` |
| Tags, indicators, badges | 0.25rem | `--nevron-radius-sm` (exception) |
| Pills, avatars, profile images | 9999px | `--nevron-radius-full` (exception) |

Sharp corners define Nevron's visual language — architectural, confident, precise. Rounded corners soften the brand and should only appear on pills, avatars, or small indicators that genuinely need distinction.

**Components:**
- Buttons — min 44px touch target, `padding: 0.75rem 1.5rem`, sharp corners (`--nevron-radius-md`)
- Cards — always sharp (`--nevron-radius-lg` = 0), subtle shadow, `padding: 1.5-2rem`
- Inputs — 44px min height, M3 focus state, sharp corners
- Links — M3 blue, underline on hover
- Pills / avatars — only these use `--nevron-radius-full`

**Token usage:**

```css
color: var(--nevron-color-m3);
background: var(--nevron-color-white);
font-family: var(--nevron-font-family);
```

### Presentations (PowerPoint / Keynote)

**Dimensions:** 16:9 (1920×1080px)

**Slide types:**

| Type | Background | Title | Body | Logo |
|------|-----------|-------|------|------|
| Title | M1 Navy or M1→M3 gradient | White, Display, centered | M5, Body Large | With tagline, white, bottom-right |
| Section divider | M3 Brand Blue | White, H1 | M5, small number | — |
| Content | White | M1, H2, top-left | S1, Body | Without tagline, blue, bottom-right |
| Image + text | 50/50 or 60/40 split | Text side: white or M6 bg | — | — |
| Data / chart | White | M1, H2 | Chart colors: M3, M4, M5, S3 | — |
| Closing | Match title | — | Contact, CTA | With tagline |

**Rules:**
- Max 6-8 lines of text per slide
- One idea per slide
- Consistent 80px margins
- Never stretch images
- Emphasis uses M3 blue, not red or bold

### Documents (PDF / Word)

**Page setup:**
- A4 (210×297mm) or Letter (8.5×11")
- Margins: 25mm top/bottom, 20mm left/right
- Header: logo (without tagline) top-left, page number top-right
- Footer: company info, S4 line separator

**Hierarchy:**
- Document title — H1, M1 Navy
- Section headers — H2, M3 Brand Blue
- Subsections — H3, S1
- Body — Body size, S1, single or 1.15 line spacing
- Captions — Caption size, S3

**Cover page:**
- Logo with tagline, centered upper third
- Document title — Display or H1, centered
- Date/version — Body Small, S3, bottom

**Rules:**
- Page numbers everywhere except cover
- M3 blue for links and emphasis
- Tables: M1 header row, alternating White/S6 rows
- Pull quotes: M3 left border, italic, indented

### Print

**CMYK equivalents:**

| Color | CMYK |
|-------|------|
| M1 Navy | C100 M98 Y34 K33 |
| M3 Brand Blue | C85 M43 Y0 K0 |
| Rich black (large areas) | C40 M30 Y20 K100 |

Consult brand guide for exact CMYK values of other tokens.

**Print rules:**
- Bleed: 3mm min on all sides
- Safe zone: critical content ≥ 5mm from trim
- Min font size: 7pt body, 5pt fine print
- Min logo print size: monogram 10mm, full logo 25mm
- CMYK mode, not RGB
