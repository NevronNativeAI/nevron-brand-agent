---
name: presentation-abstract
description: Build an abstract Nevron pitch deck — company philosophy, a broad idea, a way of seeing a market, a partnership case. Dark 16:9 slides, enormous light type, generated 3D hero imagery, one idea per slide. Use when Kaja asks for a pitch deck, a philosophy or vision deck, a partnership or investor deck, a keynote, or "a deck like the NevronCore pitch". NOT for feature, product or technical presentations, and not for hotel-specific decks built from the sales templates.
---

# Abstract presentation

For the deck you give when the point is an **idea**: how Nevron sees the world,
why a market is moving, what a partnership could be, what the company believes.
Dark, spare, enormous type, one thought per slide.

## What this is not

Send these elsewhere:

| If it is… | Use |
|---|---|
| Feature or module walkthroughs, technical architecture, specs | Not this skill. A product deck is a different animal — dense, tabular, screenshot-led |
| A hotel-specific sales deck from the SL/EN templates | The `presentation` skill on the J: share |
| A written document, report or proposal | `nevron-document` |
| A product spec sheet | `datasheet` |
| A priced client offer | `offer` |

If the request is "show them what NevronCore does", it is probably a product
deck, not this. Say so and check before building — the two look similar and
read completely differently.

## Read these first, every time

1. `reference/design-language.md` — the rules. Canvas, type, colour, the moves.
2. `reference/slide-gallery.md` — the gold-standard deck read slide by slide.

Then open the deck itself if you can reach it:
`J:\Prodaja\Active-use-resources\Presentation\NevronCore\Pitch_Nevron2_2026-06-29\deck1-the-pitch-2026-06-29.html`

**Orient, do not copy.** This skill deliberately has no slide templates. The
reference deck's eighteen slides use almost eighteen different layouts, and
reproducing them in order would produce a worse deck than composing fresh for
the argument. Absorb the temperament; build what the argument needs.

## How to build one

### 1. Get the argument first

Do not open an editor until you can state, in one line each:

- who is in the room and what they already believe
- the one thing they should think differently afterwards
- the ask

Then write the arc as a list of one-sentence slide claims. Ten to fourteen
slides. If a slide's claim needs an "and", split it.

Show Kaja the arc and get it agreed **before** building slides. Rewriting an
argument is cheap; rebuilding fourteen composed slides is not.

### 2. Write the slides

Author `slides.html` as a sequence of bare sections:

```html
<section class="slide cover">
  ...your composition...
</section>

<section class="slide" data-eyebrow="The problem">
  ...
</section>
```

You write only the body. The builder injects the eyebrow bar, the wordmark, the
slide numbering and the counter, so those cannot drift. Set `data-eyebrow` per
slide to change the section name; otherwise the deck default is used.

Compose with the moves in the design language — statement against a hero, kicker
stack, node constellation, card field, full bleed. Combine them. Invent one if
the argument needs it and the temperament holds.

### 3. Imagery — ask before generating

Hero images are **generated 3D renders**, never stock and never photographs of
people. They are also composed for the slide: subject in one half, the other
half falling to near-black so type has room.

Some machines can generate them here and most cannot, so:

1. Run the build. It reports every referenced image that does not exist yet, and
   what image routes this machine actually has.
2. **Ask Kaja how she wants them made.** Never assume, and never spend on
   generation without asking. The options are:
   - **Codex** — only if it is installed *and* signed in with a ChatGPT account.
     The build tells you whether that is true here. Then use the
     `codex-coworker:image` skill.
   - **Prompts** — write the prompts out and let her generate them wherever she
     prefers. This is the right default when Codex is absent or unconfirmed.
3. Either way, prompts must lead with **layout**: where the subject sits, which
   half stays dark. `images.mjs` exports `promptFor({ subject, placement })`
   which builds one in house style; `placement` is `left`, `right`, `center` or
   `bleed`.

Never copy hero images out of the reference deck or another client's deck. They
belong to that argument, and reuse makes two decks look like the same meeting.

### 4. Build

```
node "${CLAUDE_PLUGIN_ROOT}/skills/presentation-abstract/build.mjs" "<workdir>/deck.json" "<workdir>/out" --pdf
```

Writes `out/<slug>/index.html` with `assets/`, and `out/<slug>.pdf` at 16:9.

### 5. Verify by looking

Screenshot slides at 1600×900 and look at them. Never judge a deck from markup.
Check: nothing crowding the edges, no slide carrying two ideas, type never over
the bright part of a render, the mono kicker present and blue.

To render one slide, extract its `<section>` into its own file with the same
`<head>` — the styles are self-contained.

## deck.json

| Field | Meaning |
|---|---|
| `slug` | Output folder name |
| `title` | Browser title |
| `eyebrow` | Default section name in the top bar |
| `numberInEyebrow` | `false` to stop appending `· NN` from slide 2 on |
| `slidesFile` | Defaults to `slides.html` |
| `imagesDir` | Defaults to `images`, copied to `assets/images/` |
| `lang` | Document language |

## Notes

- Fonts (Open Sans, JetBrains Mono) and PrimeIcons load from CDNs. Build online
  or the PDF comes out wrong.
- `styles.css` is lifted whole from the gold-standard deck, so a new deck cannot
  drift from it. If the house look moves, re-lift rather than hand-edit.
- Slide bodies are yours; the chrome is not. Do not hand-write a `top-bar` or a
  `counter` — the builder owns those.
- The deck scroll-snaps and takes arrow keys, space, Home and End.
