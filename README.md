
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
├── agent/
│   └── nevron-brand.md          # The agent (install this)
├── BRAND.md                     # Full brand spec (agent reads on demand)
├── assets/
│   ├── logos/                   # SVG logos (monogram, with/without tagline)
│   ├── icons/                   # Custom Nevron SVG icons
│   ├── illustrations/           # Brand illustrations
│   ├── product-images/          # Hardware product photos
│   ├── screenshots/             # NevronCore app screenshots
│   ├── primeicons-list.txt      # Verified PrimeIcons names (icon verification)
│   └── fonts/
│       └── README.md            # Font licensing info
├── tokens/
│   └── nevron-tokens.css        # CSS custom properties (all brand tokens)
├── skills/                      # Claude Code skills (install these too)
│   ├── nevron-document/         # Full document PDF — cover, TOC, back cover
│   │   ├── SKILL.md
│   │   ├── build.mjs            # The shared engine (both skills call it)
│   │   ├── styles.css
│   │   ├── paginate.js
│   │   ├── reference/style-notes.md
│   │   └── examples/
│   └── nevron-document-nocover/ # Short document PDF — no cover, no TOC
│       ├── SKILL.md
│       └── examples/
└── examples/
    ├── web-component.html       # Branded feature card demo (PrimeIcons)
    ├── presentation-guide.md    # PowerPoint/Keynote slide templates
    └── document-guide.md        # PDF/Word document formatting
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
| `agent/nevron-brand.md` | The agent — install this |
| `BRAND.md` | Full spec (colors, typography, logos, assets, format guidelines) — read on demand |
| `assets/primeicons-list.txt` | Authoritative list of valid PrimeIcons names — greps instead of WebFetches |
| `tokens/nevron-tokens.css` | All brand tokens as CSS custom properties |
| `examples/` | Working reference snippets for web / presentations / documents |
| `skills/` | Skills that *produce* branded output, not just advise on it |

Keeps each session's context small, icon verification fast, and gives the agent one source of truth per topic.

---

```
 ╔══════════════════════════════════════╗
 ║  📄  DOCUMENT SKILLS                ║
 ╚══════════════════════════════════════╝
```

Two skills turn text into a print-ready A4 PDF in the house document style. They
reproduce the Word templates in
`J:\Produkcija\_Brand Identity\08_Documents\_Document Template\` as HTML/CSS and
render with headless Chrome — no Word, no InDesign, no npm install.

| Skill | Use it for | Pages |
|-------|-----------|-------|
| `nevron-document` | Reports, guides, specifications, proposals, manuals | Cover → introduction + disclaimer → table of contents → numbered body → back cover |
| `nevron-document-nocover` | Meeting notes, memos, letters, checklists, short notes | Body from page 1 → back cover |

Both are **layout only** by default: they set the text you give them and do not
write copy unless you ask. Neither has a default save location — they ask.

### Install

```bash
mkdir -p ~/.claude/skills
cp -r ~/nevron-brand-agent/skills/nevron-document          ~/.claude/skills/
cp -r ~/nevron-brand-agent/skills/nevron-document-nocover  ~/.claude/skills/
```

On Windows, junctions keep one source of truth instead of a copy that drifts:

```powershell
New-Item -ItemType Junction -Path "$env:USERPROFILE\.claude\skills\nevron-document"         -Target "<repo>\skills\nevron-document"
New-Item -ItemType Junction -Path "$env:USERPROFILE\.claude\skills\nevron-document-nocover" -Target "<repo>\skills\nevron-document-nocover"
```

Restart Claude Code, then ask for "a Nevron document about X" or "short Nevron
document, no cover page".

### Build one by hand

```bash
node <repo>/skills/nevron-document/build.mjs <workdir>/data.json <workdir>/output --png
```

`--png` also writes one PNG per page under `output/preview/` — the only practical
way to check a page from a terminal. Type sizes, colours and every measurement
are documented in `skills/nevron-document/reference/style-notes.md`.

---

```
 ╔══════════════════════════════════════╗
 ║  ⚡  QUICK START                     ║
 ╚══════════════════════════════════════╝
```

### 1. Clone the repo

```bash
cd ~
git clone https://github.com/kajasajn/nevron-brand-agent.git
```

### 2. Create the agents folder

```bash
mkdir -p ~/.claude/agents
```

### 3. Copy the agent file

```bash
cp ~/nevron-brand-agent/agent/nevron-brand.md ~/.claude/agents/
```

### 4. Restart Claude Code

Close and reopen Claude Code (or start a new session). Done.

### 5. Verify

Try asking:

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

Six SVG variants in `assets/logos/`:

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

Drop `tokens/nevron-tokens.css` into any web project:

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

`assets/icons/` holds custom Nevron SVGs (`web/`, `contentware/`, `technical/`) for cases PrimeIcons can't cover.

---

```
 ╔══════════════════════════════════════╗
 ║  🔄  UPDATING                       ║
 ╚══════════════════════════════════════╝
```

```bash
cd ~/nevron-brand-agent
git pull
cp agent/nevron-brand.md ~/.claude/agents/
```

Then restart Claude Code to pick up the changes.
