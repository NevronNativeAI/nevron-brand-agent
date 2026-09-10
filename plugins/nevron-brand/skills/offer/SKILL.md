---
name: offer
description: Generate a Nevron client offer (ponudba) as a hosted web page in the house style — dark hero with a validity countdown, the lead module, what else the pilot includes, the pilot timeline, and a licensing section priced either from the live NevronCore rate card or from a custom pricelist. Use when Kaja asks for an offer, a ponudba, a client proposal, a pilot offer or a quote for a hotel. Produces the upload-ready folder plus a PDF.
---

# Nevron offer (ponudba) generator

Produces the page that gets served at `clients.nevron.co/<Hotel-Name>/ponudba`, and a
PDF of the same offer for attaching to email. Pipeline: a `data.json` → `build.mjs`
fills the template → headless Chrome prints the PDF.

Reference offers to match — read one before building a new one:
`clients.nevron.co/{NEU-Residences, Ribno-Alpine-Resort, Hotel-Kompas-Bled}/ponudba`

## The rule that matters most

**Draft the copy. Never invent a number.**

You may write the hook, the module descriptions, the timeline narrative and the CTA
in the house tone. You must **not** invent, estimate or "reasonably assume" any of:

- occupancy rates, adoption rates, conversion rates
- guest touchpoints per day
- projected additional revenue
- bed or room counts
- discount percentages or pilot length

Every one of those comes from Kaja or the hotel. If a figure is missing, leave the
field out and ask for it. An offer is a commercial document — a plausible-looking
invented number is the worst possible failure here.

Prices are the exception: they come from the rate card, not from you (below).

## Two pricing modes

Set `pricing.mode`:

### `"nevroncore"` — the standard rate card
Lines are computed from the live NevronCore rate card and the quantities you supply
in `pricing.assumptions`. You give quantities; the skill supplies rates.

The rate card is read from the SaaS site at build time:
```
J:/Produkcija/HišnaProdukcija-TrzenjskiMateriali/2026-SaaS-Website/pricing.html
```
A dated snapshot lives in `reference/rate-card.json` as a fallback for when J: is not
reachable. The live page always wins, and any drift between the two is printed as a
warning at build time.

**Always tell Kaja how fresh the prices are.** The build prints it, and the rendered
page carries the same line under the pricing table:
> `Cenik NevronCore, osveženo 2026-09-10`

If it fell back to the snapshot, the line says so and how old the copy is. Do not let
an offer go out on snapshot prices without saying so out loud.

The maths, for checking by hand:
- daily-billed lines: `rate × quantity × 30`
- capacity: `beds × €0.50` or `rooms × €1.00`, **whichever is higher**
- a whole-bill monthly minimum applies — it is not a per-line floor

### `"custom"` — a negotiated pricelist
You supply `pricing.lines` as `[{ label, detail, amount }]` and optionally `total`.
Nothing is derived. Set `sourceLabel` to say where the prices were agreed, e.g.
`"Cenik po meri, potrjen z vodstvom 10. 9. 2026"` — the page prints it under the table
in place of the rate-card line.

Use this when the deal is priced outside the standard card. Do not quietly edit
rate-card numbers to fake a custom deal — switch modes so the page says which it is.

## The licence ladder

Every offer to date uses the same shape, and the skill builds it from the total:
pilot months at €0 → `discountMonths` at 50 % → standard price. Set `pilotMonths` and
`discountMonths`; the month labels and the halved figure are worked out for you.

## Page structure

1. **Countdown bar** — sticky, from `validUntil`. Counts down live, flips to
   "Ponudba je potekla" on expiry.
2. **Cover** — badge, hook (`h1`), subtitle, hotel name, meta pills, scroll CTA, Nevron
   lockup. Dark navy gradient, full height.
3. **Lead module** — the one thing this offer is really pitching, with its poster image
   and a "Glavni modul ponudbe" badge.
4. **What else you get** — a stack of module rows. Each has either its own image or the
   generated NevronCore platform poster.
5. **How the pilot runs** — timeline cards, one per phase.
6. **Licensing** — dark section: the fixed monthly table, the total, the provenance
   line, and the three-phase licence ladder.
7. **CTA** — mailto to the salesperson.

Sections with no data are skipped, so a short offer needs no placeholders.

## Build steps

1. Make a working folder. Put images in `<workdir>/screenshots/`.
2. Write `<workdir>/data.json` from `examples/data.example.json`.
3. Run:
   ```
   node "${CLAUDE_PLUGIN_ROOT}/skills/offer/build.mjs" "<workdir>/data.json" "<workdir>/out" --pdf
   ```
   Writes `out/<slug>/index.html` with `icons/` and `screenshots/` beside it, plus
   `out/<slug>.pdf`.
4. **Read the build output.** It reports the pricing mode, where the rates came from
   and how fresh they are, whether the monthly minimum was applied, and the total.
   Report all of that to Kaja — do not just say "done".
5. **Verify by rendering.** Screenshot the page and check the cover, the pricing table
   and the licence ladder. Never judge the layout from the markup.
6. Report the folder path and the total. Wait for Kaja to confirm before anything is
   uploaded or sent.

## data.json fields

| Field | Meaning |
|---|---|
| `slug` | Folder name, and the URL segment. Use the hotel name with hyphens. |
| `lang` | `"sl"` or `"en"`. Ask which — do not assume. Only the chrome is translated. |
| `hotel` | `name`, and `beds` / `rooms` / `units` for the capacity line. |
| `validUntil` | `YYYY-MM-DD`. Drives the countdown bar. |
| `cover` | `badge`, `hook`, `sub`, `meta[]`, `cta`. |
| `mainModule` | `title`, `lead`, `image`, `alt`, `badge`. |
| `included[]` | `title`, `subtitle`, `desc`, and either `image` or `posterSub`. |
| `timeline[]` | `period`, `title`, `desc`. |
| `pricing` | `mode`, `lead`, `pilotMonths`, `discountMonths`, plus `assumptions` or `lines`. |
| `cta` | `title`, `text`, `button`, `email`, `cc`, `subject`. |

`pricing.assumptions` takes **quantities only**: `beds`, `rooms`, `guestTP`,
`hostDevices`, `signageDevices`, `aiGuestTP`, `aiHostDevices`, `staffBasic`,
`staffPremium`. Never rates.

## Assets

There are three places a picture can come from, in this order:

**1. The app-screen library.** 32 ready-made product screens — mobile dashboard, fast
check-in, room service, catalogues, Room Care, TV client, signage — live in the repo
clone at `assets/app-screens/`, not inside the plugin (they are 86 MB, and anything in
the plugin is re-copied on every release). Reach them through `libraryRoot()` in
`lib/brand-paths.mjs`. Check here first: a real product screen always beats a
generated one.

**2. Generated hero imagery.** The lifestyle composites — a guest on a terrace with the
app, a reception desk, a room-service scene — are generated, and can be made here if
the machine supports it. The build reports every missing image and what routes exist
locally. **Ask Kaja how she wants them made; never assume and never spend on
generation without asking.** Where Codex is present and signed in with a ChatGPT
account, use the `codex-coworker:image` skill. Otherwise write the prompts out for her.
Prompts lead with layout — where the subject sits, which side stays dark for the
headline. `lib/images.mjs` exports `promptFor({ subject, placement })`.

**3. Photographs Kaja supplies.** Anything of a real property or a real person.

- **Never copy imagery out of another hotel's offer folder without asking** — one
  hotel's lobby in another hotel's offer is a real mistake, not a cosmetic one.
- Never generate a photograph of a named property. Generated imagery is for generic
  lifestyle and product scenes only.
- The NevronCore poster logo is taken from the plugin's own logo set, so no client
  folder needs to be raided for it.
- Fonts are Inter from Google Fonts; icons are PrimeIcons from the CDN. Both are
  loaded remotely, so the page needs a connection to look right. The PDF is rendered
  with the same, so build it online.

## Fidelity notes

- Palette, spacing and every component: `styles.css`, lifted from the live offers so
  a new page cannot drift from them.
- The offer pages use **Inter**, not the Open Sans of the brand site. That is
  deliberate — match the offers.
- Colours are the brand tokens under short names (`--m1`…`--m6`, `--s1`…`--s6`).
- `reference/style-notes.md` records the rate model and where each number comes from.
