# The abstract deck — design language

This is not a template. It is a way of composing a slide. Learn the language,
then build whatever the argument needs.

Gold standard, and the deck every rule here was read off:
`J:\Prodaja\Active-use-resources\Presentation\NevronCore\Pitch_Nevron2_2026-06-29\deck1-the-pitch-2026-06-29.html`

Open it before you build. Eighteen slides, and almost no two share a layout —
that is the point. What they share is a temperament.

---

## The temperament

**Dark, quiet, enormous type, one idea per slide.**

A slide holds a single thought. If you can't say what a slide argues in one
sentence, it is two slides. The deck is read at distance, out loud, by someone
talking over it — so it carries the shape of the argument, not its detail.

Restraint is the whole aesthetic. Vast empty space, one light source, one
accent colour, one image. A slide that feels underfilled is almost always right.

## Canvas

- **16:9, 1600 × 900**, one slide per viewport, scroll-snapped.
- Background is near-black `#03040d`, lifted by two soft radial glows —
  electric blue from the upper right, deep navy from the lower left. Never a
  flat black, never a gradient you can see banding in.
- Generous padding: `clamp(52px, 5.5vw, 104px)` vertical,
  `clamp(72px, 9vw, 184px)` horizontal. Type never approaches the edge.

## Type

| Role | Treatment |
|---|---|
| Display (cover) | Open Sans **300**, enormous — 100px+. Split the name: light stem, bold payload (`Nevron<b>Core</b>`) |
| Statement | Open Sans 300, 56–72px, tight leading, breaking across 3–4 short lines |
| Slide title | Open Sans 300–400, 40–52px |
| Lead / sub | Open Sans 400, 20–24px, at 66 % white |
| Body, bullets | Open Sans 400, 17–19px, at 66 % white |
| Micro-label | **JetBrains Mono**, 11–12px, uppercase, letter-spaced ~0.18em, in `#1B92FF` |

The mono micro-label is the signature. It sits above a heading as a kicker,
labels a node, marks a column. Blue, small, wide-tracked. Use it constantly —
it is what makes the deck read as Nevron rather than as a generic dark deck.

Never bold a whole heading. Weight 300 at large sizes is the house voice; bold
is for the one word that carries the emphasis.

## Colour

Brand palette only:

```
--m1 #000126   --m2 #002391   --m3 #1B92FF   --m4 #73C7FF   --m5 #C3E9FF
--bg0 #03040d  ink rgba(255,255,255,.95)  ink2 .66  ink3 .42  line .12
```

One accent: `#1B92FF`. It marks the kicker, the bullet square, the active node,
the glow. Everything else is white at three opacities. No second hue anywhere —
no greens, no ambers, no charts in six colours.

Panels are `rgba(255,255,255,0.04)` with a `blur(8px)` backdrop and a hairline
`rgba(255,255,255,0.12)` border. Glass, barely there.

## The invariant chrome

Every slide carries, and the builder injects so you never hand-write them:

- **top-left** — mono eyebrow, the section name, `· NN` appended from slide 2 on
- **top-right** — the Nevron wordmark, white, small
- **bottom-left** — `NN / TT` in mono at 42 % white

## Composition moves

Not slide types. Moves you combine.

**Statement against a hero.** Huge sentence on one side, generated image
occupying the other, image bleeding off-frame. The most-used move in the deck.
Text on the dark half, never over the bright part of the render.

**Kicker stack.** Mono rule + kicker, then blue mono label, then a large light
title, then a grey lead, then square-bullet lines. Vertical, left-aligned,
paired with an object floating right.

**Node constellation.** A hero image centred, with 3–5 labelled nodes ranged
down one side, each a mono micro-label over a short line of copy, connected by
thin lines and small circles. Use it to enumerate without a list.

**Card field.** 3–6 cards on the glass panel treatment, each an icon, a short
title, a line of copy. For principles, forces, pillars. Beyond six, it stops
being abstract and becomes a feature grid — which is the wrong deck.

**Full bleed.** Image edge to edge, scrim over it, copy in the darkest quadrant.
For a moment of scale or a section break.

**Cover and closing.** Same construction, bookending. The closing slide restates
the ask in one line.

## What breaks it

- More than one idea on a slide
- Body copy below ~16px, or paragraphs longer than two lines
- A second accent colour
- Filling the empty space
- Stock photography, or any image with a person's face
- Icons doing decoration rather than labelling
- Charts. If it needs a chart it is a different deck.
- Bold display type at large sizes
