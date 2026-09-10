# Cover frames

The 19 line-hatch geometric frames the datasheet cover draws from — diagonal,
horizontal, vertical, thin, double, cross, X and full. White on transparent,
square, meant to be inlined at 178mm inset 16mm from the top-right.

**Source of truth:** `J:\Produkcija\_Brand Identity\17_Concepts\Frames`
(Nevron brand identity, internal). These are a vendored subset, copied
unmodified so a datasheet builds without network-share access.

The full house set there also contains pixel, dot, circle, checker and organic
patterns. Those are deliberately **not** vendored — they clash with the
datasheet layout and the builder filters them out anyway
(`FRAME_ALLOW` / `FRAME_DENY` / `FRAME_EXCLUDE` in `skills/datasheet/build.mjs`).

If the brand set changes on J:, re-copy the approved subset here rather than
editing these files — J: stays the original.
