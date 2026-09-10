# Illustrations

Synced from `J:\Produkcija\_Brand Identity\04_Illustrations`, which stays the source
of truth. Working files (`Source/`, 38 MB of .ai) and the UI dev package are not
carried across — only the finished artwork.

These are **library** assets: they live at the repo root, not inside the plugin, so
they are cloned once rather than re-copied into the plugin cache on every release.
Reach them with `libraryRoot()` from `plugins/nevron-brand/lib/brand-paths.mjs`.

The document engine resolves a `coverIcon` against this folder, so any of these can
be a document cover illustration — which is what a full document cover usually
carries.

## Renamed on the way in

The brand share holds several Illustrator default exports. Those names say nothing
about the artwork, so the agent cannot pick the right one by grepping. They were
renamed here after looking at each. **If you re-sync from J:, re-apply this
mapping** or the meaningless names come back:

| On J: | Here | What it shows |
|---|---|---|
| `Asset 111.svg` | `Destinations.svg` | Eiffel Tower with screens orbiting it |
| `Asset 121.svg` | `SaveThePlanetLeaves.svg` | Earth hugging itself, framed in leaves |
| `Asset 21.svg` | `ConfirmedDevice.svg` | Glowing device with a tick |
| `Asset 31.svg` | `PlanetNight.svg` | Smiling earth under a moon |
| `Asset 41.svg` | `MessageSent.svg` | Envelope with a tick |
| `Asset 51.svg` | `RequestAccepted.svg` | Checklist with a tick |
| `Asset 61.svg` | `DiscoverDestinations.svg` | Figure at a window onto mountains |
| `Asset 71.svg` | `HotelWelcome.svg` | Lit hotel entrance, red carpet |
| `Asset 81.svg` | `ServicesAroundYou.svg` | Figure surrounded by service icons |
| `il-d-maritim222e.png` | `il-d-coastal.png` | Coastal resort at dusk — **not** a duplicate of `il-d-maritime.png`, which is a ship at sea |
| `COnfirmed.svg` | `Confirmed.svg` | Typo in the original |
| `Circle/C1–C7.png` | `Circle/PlatformRings-1…7.png` | The platform stack as concentric rings, built up one layer per frame, outermost first |

The `PlatformRings` names read the labelled rings (setup, network, components,
digital services) as the platform stack. If that reading is wrong, rename them —
the sequence order is the part that matters.
