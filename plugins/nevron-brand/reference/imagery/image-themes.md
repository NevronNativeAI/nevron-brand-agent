# Imagery themes

Which art direction a generated or chosen image should follow. Shared by every
skill that puts a photograph on a page — `offer`, `presentation-standard`,
`presentation-abstract`.

**Tokens and imagery are two separate layers.** A theme is a token set; the art
direction is chosen independently. Abundance runs on Hospitality's colours and
type with completely different imagery. Do not assume one implies the other.

Full direction, and the source of what follows:
`C:\Users\Kaja\Desktop\nevron-content\themes\README.md`

## Examples

Three per theme live in the repo clone at `assets/image-themes/<theme>/` — in the
library, not the plugin, so they are cloned once rather than copied on every
release. Reach them with `libraryRoot()`.

They are **style references, not a quality bar.** Read them for palette, framing,
subject and mood. The wider collections they came from are
`~/Downloads/{Maritime, Hospitality, Abundance}`, 311 images in total.

## The three directions

### Maritime — cold, wide, far away
The emotion is distance. Expedition ships and cruise vessels at anchor in vast
water, open ocean, decks at first light. Cool blues and greys, high horizon, a
lot of empty water. People are small or absent. Wide angle, contemplative.

Recurring subjects: an expedition ship anchored in a vast fjord; a cruise ship
gliding through open water; a suite with floor-to-ceiling glass onto the sea; an
early deck with a small group; an IPTV screen on a cabin wall.

### Hospitality — warm, human, candid
Real guests and real staff in ordinary moments. A guest just woken, a parent and
child at a pool, a manager at their desk early, a corridor at night. Warm light,
mid-distance, faces and hands. Golden brown and anthracite.

Recurring subjects: a Scandinavian terrace in July; a guest resting in a lounge;
a hotel bar in southern Europe; a phone held up to a room door; an entrance open
to the street.

### Abundance — cinematic, textural, poetic
Hospitality's tokens, an entirely different eye. Ultra-luxury and abstraction
rather than candid warmth: hands preparing something, an illuminated path, a
winding road, a jungle retreat. Closer crops, deeper contrast, more staged.

Recurring subjects: a behind-the-scenes kitchen scene; a textural close-up of
hands; two illuminated paths; a winding road to a retreat.

### AI — not settled
Geometric patterns, otherwise undescribed. Ask before generating to an AI theme;
do not invent the direction.

## Generating

Every reference image was made with Leonardo's **Lucid Realism** preset, and the
prompt vocabulary in the collections is consistent enough to copy:

> `A cinematic photo of …` · `A hyperrealistic wide-angle shot of …` ·
> `A photorealistic close-up scene of …` · `A candid photograph of …` ·
> `An editorial photo of …`

Build a prompt as: **framing verb → subject → setting → light → mood**, then the
theme's palette. For a slide or an offer page, put the layout first — which half
of the frame the subject occupies and which half stays quiet for type. That is
what `promptFor({ subject, placement })` in `lib/images.mjs` does.

**Ask before generating.** Codex can produce these where it is installed and
signed in with a ChatGPT account; the build tells you whether that is true on this
machine. Where it is not, hand the prompts over. Never spend on generation without
asking, and never generate a photograph of a real, named property.
