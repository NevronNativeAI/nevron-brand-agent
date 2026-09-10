
```
 ███╗   ██╗███████╗██╗   ██╗██████╗  ██████╗ ███╗   ██╗
 ████╗  ██║██╔════╝██║   ██║██╔══██╗██╔═══██╗████╗  ██║
 ██╔██╗ ██║█████╗  ██║   ██║██████╔╝██║   ██║██╔██╗ ██║
 ██║╚██╗██║██╔══╝  ╚██╗ ██╔╝██╔══██╗██║   ██║██║╚██╗██║
 ██║ ╚████║███████╗ ╚████╔╝ ██║  ██║╚██████╔╝██║ ╚████║
 ╚═╝  ╚═══╝╚══════╝  ╚═══╝  ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝
 B R A N D   A G E N T
```

A standalone **Claude Code agent** that enforces Nevron brand consistency across all output formats: web, presentations, documents, and print.

Works in both the **Claude Code CLI** (terminal) and the **Claude Code desktop app**.

---

```
 ╔══════════════════════════════════════╗
 ║  📦  WHAT'S INCLUDED                ║
 ╚══════════════════════════════════════╝
```

```
nevron-brand-agent/
├── .claude-plugin/
│   └── marketplace.json         # makes this repo an installable marketplace
├── plugins/
│   └── nevron-brand/            # THE PLUGIN — everything a build needs offline
│       ├── .claude-plugin/plugin.json
│       ├── BRAND.md             # full brand spec (agent reads on demand)
│       ├── agents/
│       │   └── nevron-brand.md  # the brand agent
│       ├── lib/
│       │   └── brand-paths.mjs  # resolves the plugin + library roots
│       ├── tokens/
│       │   └── nevron-tokens.css
│       ├── assets/              # only what the skills actually inline
│       │   ├── logos/           # SVG logos — one source of truth
│       │   ├── icons/           # custom Nevron SVG icons
│       │   ├── frames/          # 19 datasheet cover frames (vendored from J:)
│       │   ├── primeicons-list.txt
│       │   └── fonts/README.md
│       └── skills/
│           ├── nevron-document/         # full document PDF — cover, TOC, back cover
│           ├── nevron-document-nocover/ # short document PDF — no cover, no TOC
│           ├── datasheet/               # product datasheet PDF
│           ├── offer/                   # client offer (ponudba) web page + PDF
│           ├── presentation-abstract/  # dark 16:9 idea deck (web + PDF)
│           └── service-report/         # site-visit report (runs on the document engine)
├── assets/                      # THE LIBRARY — bulk imagery, deliberately not in the plugin
│   ├── app-screens/             # 32 product UI screens for offers and leaflets (86 MB)
│   ├── screenshots/             # NevronCore app screenshots (64 MB)
│   ├── product-images/          # hardware product photos (19 MB)
│   └── illustrations/           # brand illustrations (5.4 MB)
├── scripts/
│   └── migrate-from-hand-install.ps1
├── examples/
│   ├── web-component.html
│   ├── presentation-guide.md
│   └── document-guide.md
└── index.html                   # the GitHub Pages site
```

---

```
 ╔══════════════════════════════════════╗
 ║  🧱  ARCHITECTURE                    ║
 ╚══════════════════════════════════════╝
```

The agent file is intentionally **slim** (~180 lines). It holds brand philosophy, fast lookups, and pointers. Everything heavy lives in the repo and is loaded only when the agent actually needs it.

| File | Role |
|------|------|
| `plugins/nevron-brand/agents/nevron-brand.md` | The agent |
| `plugins/nevron-brand/BRAND.md` | Full spec (colors, typography, logos, assets, format guidelines) — read on demand |
| `plugins/nevron-brand/assets/primeicons-list.txt` | Authoritative list of valid PrimeIcons names — greps instead of WebFetches |
| `plugins/nevron-brand/tokens/nevron-tokens.css` | All brand tokens as CSS custom properties |
| `examples/` | Working reference snippets for web / presentations / documents |
| `plugins/nevron-brand/skills/` | Skills that *produce* branded output, not just advise on it |
| `assets/` (repo root) | Bulk imagery kept **out** of the plugin so each release stays ~700 KB |

Keeps each session's context small, icon verification fast, and gives the agent one source of truth per topic.

---

```
 ╔══════════════════════════════════════╗
 ║  📄  SKILLS                          ║
 ╚══════════════════════════════════════╝
```

Six skills turn content into a finished Nevron deliverable. Four produce a
print-ready A4 PDF from the InDesign and Word originals; the fourth builds the
client offer page, and one an abstract pitch deck. All render with headless Chrome — no InDesign, no Word, no PowerPoint, no npm install.

They group into three: **Documents** (prose you write), **Service** (a record of
hardware or a visit) and **Sales** (something a client is meant to be persuaded by).

| Skill | Category | Use it for | Pages |
|-------|----------|-----------|-------|
| `nevron-document` | Documents | Reports, guides, specifications, proposals, manuals | Cover → introduction + disclaimer → table of contents → numbered body → back cover |
| `nevron-document-nocover` | Documents | Letters, legal documents, memos, meeting notes, checklists | Body from page 1 → back cover |
| `datasheet` | Service | Product datasheets for set-top boxes, servers, remotes | Grey cover with brand frame → product overview with dimension lines + ports band → black-barred spec tables → back cover |
| `offer` | Sales | Client offers (ponudba) for a hotel | Web page + PDF: hero with validity countdown → lead module → pilot contents → timeline → licensing ladder → CTA |
| `presentation-abstract` | Sales | Philosophy, vision, partnership and investor decks | Dark 16:9 slides: cover → statement → concept → forces → the ask. Not for feature or product decks |
| `service-report` | Service | Site-visit and annual service reports | Cover → introduction → service details → scope → delivery → testing → conclusion → captioned photo attachments |

The document skills are **layout only** by default: they set the text you give
them and do not write copy unless you ask. `datasheet` never invents product
facts — it asks for the spec sheet and the renders. None of them has a default
save location.

### Build one by hand

```bash
node <repo>/plugins/nevron-brand/skills/nevron-document/build.mjs <workdir>/data.json <workdir>/output --png
node <repo>/plugins/nevron-brand/skills/datasheet/build.mjs      <workdir>/data.json <workdir>/output
node <repo>/plugins/nevron-brand/skills/offer/build.mjs         <workdir>/data.json <workdir>/out --pdf
node <repo>/plugins/nevron-brand/skills/presentation-abstract/build.mjs <workdir>/deck.json <workdir>/out --pdf
# a service report runs on the document engine, like nevron-document-nocover
```

`--png` (document skills) also writes one PNG per page under `output/preview/` —
the only practical way to check a page from a terminal. Type sizes, colours and
every measurement are documented in each skill's `reference/style-notes.md`.

### Datasheet cover frames

The 19 approved line-hatch frames ship inside the plugin, so a datasheet builds
with no network-share access. The full house set stays on the brand share at
`_Brand Identity\17_Concepts\Frames` — set `framesDir` in `data.json` to reach
it when you are on the office network.

The builder picks one at random unless you pin `"frame"`. It prints which one it
used and the exact value that reproduces it — copy that into `data.json` before
filing a sheet, or the cover cannot be rebuilt.

### Offer pricing

The `offer` skill prices from the **live NevronCore rate card** on the SaaS site at
`2026-SaaS-Website/pricing.html`, and falls back to a dated snapshot in
`skills/offer/reference/rate-card.json` when J: is not reachable. Every offer page
states which source and which date it used, and the build warns loudly when it is
working from a snapshot.

Set `pricing.mode` to `"custom"` to price a deal by hand instead. Do not edit
rate-card figures to fake a negotiated price — switch modes, so the page says so.

Earlier offers are **not** a pricing source: they predate the current card and
disagree with each other.

### Deck imagery

The `presentation-abstract` skill has **no slide templates** on purpose: it carries the
design language plus the gold-standard deck as reference, and composes fresh for the
argument. Its hero images are generated 3D renders, never stock.

Generation depends on the machine, so the build reports which images are missing and
what routes exist locally — Codex signed in with a ChatGPT account, or nothing. It then
**asks** how you want them made rather than spending anything on its own. Where Codex is
unavailable it writes layout-led prompts for you to use elsewhere.

---

```
 ╔══════════════════════════════════════╗
 ║  ⚡  QUICK START                     ║
 ╚══════════════════════════════════════╝
```

### 1. Add the marketplace

In Claude Code:

```
/plugin marketplace add NevronNativeAI/nevron-brand-agent
```

### 2. Install the plugin

```
/plugin install nevron-brand
```

That brings in the brand agent and all three skills together — no copying, no
junctions, no paths to configure.

### 3. Already installed by hand? Clean up first

Copies and junctions made before the plugin existed stay active alongside it,
so the same skill registers twice — bare `datasheet` and namespaced
`nevron-brand:datasheet`. Old junctions also dangle, because the plugin
conversion moved `skills/` under `plugins/nevron-brand/`.

The script is a dry run until you pass `-Apply`, and backs up anything that is
not a link:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\migrate-from-hand-install.ps1
powershell -ExecutionPolicy Bypass -File scripts\migrate-from-hand-install.ps1 -Apply
```

It touches only the four brand items. The nevron.co website skills
(`nevron-copy`, `nevron-post`, `nevron-publish`, `nevron-seo`) are never
affected.

### 4. Restart Claude Code

### 5. Verify

> "Use the nevron-brand agent to design a button using Nevron brand colors."

---

```
 ╔══════════════════════════════════════╗
 ║  🔁  AUTO-TRIGGER SETUP             ║
 ╚══════════════════════════════════════╝
```

By default, you have to explicitly ask Claude to use the brand agent each time. To make it **automatic**, paste this prompt into Claude Code:

```
Add the nevron-brand agent to my CLAUDE.md so it auto-triggers for any Nevron brand tasks.

Ask me which projects I want to add it to — show me a multiple selection list of my projects that have a CLAUDE.md file. Also give me the option to add it globally to ~/.claude/CLAUDE.md.

Add it to the agents table (or create one if it doesn't exist) with this row:
| **nevron-brand** | Nevron brand colors, typography, logo usage, spacing, brand guidelines, any Nevron-branded design decisions | User asks about Nevron brand, or is building/reviewing anything Nevron-branded |

Also add this to the agent decision flow (or create one): "Nevron brand question / building Nevron UI? → nevron-brand"
```

That's it. Claude will ask you which projects to configure, then handle the rest.

**What changes:**
- Ask about Nevron colors/fonts/guidelines → brand agent called automatically
- Build any Nevron-branded component → brand agent called first
- Review a design for brand consistency → brand agent consulted
- Correct tokens, logos, and typography used without you specifying them

---

```
 ╔══════════════════════════════════════╗
 ║  💬  USAGE EXAMPLES                 ║
 ╚══════════════════════════════════════╝
```

**Web design**
> "Design a hero section for the Nevron website"

**Presentations**
> "Create a slide layout for a client pitch deck"

**Documents**
> "Format a proposal document for Hotel Kempinski"

**Brand review**
> "Review this design for brand consistency"

**Slovenian**
> "Oblikuj kartico za NevronCore funkcijo"

The agent responds in the user's language (English or Slovenian).

---

```
 ╔══════════════════════════════════════╗
 ║  🎨  BRAND COLORS                   ║
 ╚══════════════════════════════════════╝
```

### Primary Blues

| Token | Hex | Role |
|-------|-----|------|
| M1 | ![#000126](https://placehold.co/16x16/000126/000126.png) `#000126` | Navy — dark backgrounds, text on light |
| M2 | ![#002391](https://placehold.co/16x16/002391/002391.png) `#002391` | Dark Blue — secondary dark, accents |
| **M3** | ![#1B92FF](https://placehold.co/16x16/1B92FF/1B92FF.png) `#1B92FF` | **Brand Blue — primary CTAs, links** |
| M4 | ![#73C7FF](https://placehold.co/16x16/73C7FF/73C7FF.png) `#73C7FF` | Medium Blue — interactive states |
| M5 | ![#C3E9FF](https://placehold.co/16x16/C3E9FF/C3E9FF.png) `#C3E9FF` | Light Blue — backgrounds, decorative |
| M6 | ![#E1F4FF](https://placehold.co/16x16/E1F4FF/E1F4FF.png) `#E1F4FF` | Pale Blue — light backgrounds, cards |

### Secondary Grays

| Token | Hex | Role |
|-------|-----|------|
| S1 | ![#080C13](https://placehold.co/16x16/080C13/080C13.png) `#080C13` | Near Black — body text |
| S2 | ![#353941](https://placehold.co/16x16/353941/353941.png) `#353941` | Dark Gray — secondary text |
| S3 | ![#707379](https://placehold.co/16x16/707379/707379.png) `#707379` | Medium Gray — tertiary text, borders |
| S4 | ![#B4B6B9](https://placehold.co/16x16/B4B6B9/B4B6B9.png) `#B4B6B9` | Gray — disabled, placeholders |
| S5 | ![#E0E1E2](https://placehold.co/16x16/E0E1E2/E0E1E2.png) `#E0E1E2` | Light Gray — borders, dividers |
| S6 | ![#EFF0F0](https://placehold.co/16x16/EFF0F0/EFF0F0.png) `#EFF0F0` | Off White — subtle backgrounds |

### Supporting (functional only — never decorative)

| Color | Hex | Role |
|-------|-----|------|
| Red | ![#DA2025](https://placehold.co/16x16/DA2025/DA2025.png) `#DA2025` | Errors, destructive actions |
| Orange | ![#E56600](https://placehold.co/16x16/E56600/E56600.png) `#E56600` | Warnings, attention |
| Yellow | ![#F6A900](https://placehold.co/16x16/F6A900/F6A900.png) `#F6A900` | Caution, highlights |
| Green | ![#36A058](https://placehold.co/16x16/36A058/36A058.png) `#36A058` | Success, confirmation |

---

```
 ╔══════════════════════════════════════╗
 ║  🏷️  LOGO ASSETS                    ║
 ╚══════════════════════════════════════╝
```

Seven SVG variants in `plugins/nevron-brand/assets/logos/`:

| Light background | | Dark background |
|------------------|-|-----------------|
| `nevron-logo-icon.svg` | ←→ | `nevron-logo-icon-white.svg` |
| Monogram (blue) | | Monogram (white) |
| | | |
| `nevron-logo-no-tagline-blue.svg` | ←→ | `nevron-logo-no-tagline-white.svg` |
| Headers, navigation | | Dark headers |
| | | |
| `nevron-logo-tagline-blue.svg` | ←→ | `nevron-logo-tagline-white.svg` |
| Hero sections, covers | | Dark hero sections |
| | | |
| `nevron-logo-no-tagline-grey.svg` | | |
| Running headers on grey/white document pages | | |

**Quick pick:**

| Question | Use |
|----------|-----|
| Small space (< 80px)? | Monogram/Icon |
| First impression (hero)? | With tagline |
| Navigation / repeated? | Without tagline |
| Dark background? | White variant |
| Light background? | Blue variant |

---

```
 ╔══════════════════════════════════════╗
 ║  🔤  CSS TOKENS                     ║
 ╚══════════════════════════════════════╝
```

Drop `plugins/nevron-brand/tokens/nevron-tokens.css` into any web project:

```html
<link rel="stylesheet" href="path/to/nevron-tokens.css">
```

Then use custom properties:

```css
.my-button {
  background-color: var(--nevron-color-primary);
  color: var(--nevron-color-white);
  font-family: var(--nevron-font-family);
  padding: var(--nevron-space-3) var(--nevron-space-6);
  border-radius: var(--nevron-radius-md);
  transition: background-color var(--nevron-transition-base);
}
```

---

```
 ╔══════════════════════════════════════╗
 ║  🔣  ICONS                           ║
 ╚══════════════════════════════════════╝
```

Nevron uses **PrimeIcons** as the mandatory icon library. The agent enforces this — no inline SVGs, no Heroicons, no Lucide unless PrimeIcons truly lacks an equivalent.

### CDN (required in every HTML file)

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/primeicons/primeicons.css">
```

### Usage

```html
<i class="pi pi-check"></i>
<i class="pi pi-arrow-right"></i>
```

### Verification

Every `pi pi-<name>` is grep-verified against `assets/primeicons-list.txt` before use. If the name is wrong, the icon renders as a blank square — the list prevents that.

### Fallback

`plugins/nevron-brand/assets/icons/` holds custom Nevron SVGs (`web/`, `contentware/`, `technical/`) for cases PrimeIcons can't cover.

---

```
 ╔══════════════════════════════════════╗
 ║  🔄  UPDATING                       ║
 ╚══════════════════════════════════════╝
```

```
/plugin update nevron-brand
```

Then restart Claude Code.

The plugin payload is deliberately small (~700 KB) because Claude Code keeps
**every installed version** in `~/.claude/plugins/cache/` and never prunes them.
Bulk imagery therefore lives at the repo root instead, inside the marketplace
clone, which is fetched once and shared by every version. Keep it that way —
moving `assets/screenshots` into the plugin would multiply 64 MB by your release
count on every teammate's disk.

To browse the full asset library, open the marketplace clone:

```
~/.claude/plugins/marketplaces/nevron-brand-agent/assets/
```