---
name: service-report
description: Generate a Nevron service report PDF — the on-site visit report in the house document style, with the fixed skeleton (introduction, service details, scope of work, service delivery, testing and verification, conclusion and suggestions, signature) and a captioned photo attachments page. Use when Kaja asks for a service report, a site visit report, an annual service report, a maintenance or inspection report, or a report for a vessel or property. Matches the GCCL reports.
---

# Service report

The report an engineer leaves behind after a site visit: what was inspected, what
was done, what was tested, what should happen next, and photographs proving it.

Matches the reports in `J:\Projekti\GCCL\Documents\Service reports <year>\`. Read
the most recent one for the customer before writing a new one — the wording is
consistent between visits on purpose, and continuity is the point.

## It runs on the document engine

A service report **is** a Nevron document with a fixed skeleton, so this skill has
no builder of its own — same arrangement as `nevron-document-nocover`:

```
node "${CLAUDE_PLUGIN_ROOT}/skills/nevron-document/build.mjs" "<workdir>/data.json" "<workdir>/output" --png
```

Everything below is how to fill that `data.json`. Start from
`examples/data.example.json`, which is a complete report.

## The cover

| Field | Value |
|---|---|
| `docType` | `"Service report"` |
| `title` | `"Annual service report"`, or `"Service report"` for an unscheduled visit |
| `subtitle` | The vessel or property name, on its own |
| `coverIcon` | `"technical/ServiceB.svg"` — the gear |
| `runningHead` | `"Service report  I  <vessel>"` |
| `date` | The date of the visit, not the date of writing |

`toc` is `false` and `numbered` is `false`. A service report is short and its
sections are fixed, so a contents page is noise.

## The skeleton — keep these sections, in this order

1. **Introduction** (`introTitle` / `intro`) — two short paragraphs: what the
   report covers, then "Find a detailed service report on the next page."
2. **Service details** — a two-column table: customer, their address, their phone,
   address of service (the vessel), date of service.
3. **Scope of work** — bullets. What the visit set out to do.
4. **Service delivery** — bullets. What was actually done and found, one finding
   per bullet, in the order it happened.
5. **Testing and verification** — bullets. What was confirmed working.
6. **Conclusion and suggestions** — paragraphs, not bullets. The engineer's
   judgement: current state, risks, what to plan for.
7. **Signature** — `Service provided by Nevron representative: **Name**`
8. **Attachments** — on its own page (`{ "pagebreak": true }`), the line "Kindly
   examine the images provided to assess the current status.", then the photos.

Sections stay even when short. A visit with nothing to report still has a
Testing and verification section saying so.

## Photographs

Attachments go two-up with a caption under each:

```json
{ "figures": [
  { "img": "images/hdmi-splitter.jpeg", "caption": "HDMI splitter" },
  { "img": "images/server-rack.jpeg",   "caption": "Server, HDMI splitter and USB hub" }
]}
```

One `figures` block per row. Rows never split across a page.

- Captions name the **object**, not the action — "USB hub", "Cable management",
  not "we installed a USB hub".
- Engineers send phone photos, usually via WhatsApp with names like
  `WhatsApp Image 2026-04-22 at 10.55.08.jpeg`. Rename them to what they show
  before building; the filename ends up in the source folder forever.
- Photos are cropped to a consistent height by the grid, so a portrait phone
  photo will lose its top and bottom. Check the render.

## Writing it

This is a factual record, so the same rule as the datasheet applies, harder:

**Never invent a finding.** Every bullet comes from the engineer's notes or the
photographs. If the notes are thin, ask — do not smooth them into plausible prose.
A service report is referred back to years later when something fails, and an
invented "confirmed working" is worse than a gap.

You may tidy grammar, make tense consistent (past tense, third person), and cut
repetition. You may not add a finding, a cause or a recommendation that was not
in the notes.

Tone: plain, unhurried, no salesmanship. "It was noted that water still enters
the server room under certain conditions" — not "unfortunately we discovered a
serious water ingress issue". The conclusion may recommend work, but it reads as
engineering judgement, not an upsell.

## Build steps

1. Working folder, photos in `<workdir>/images/`, renamed to what they show.
2. Write `data.json` from the example.
3. Run the document engine with `--png`.
4. **Look at the pages.** Check the attachments grid, that no section is stranded
   at a page foot, and that the photos are not cropped through their subject.
5. Report the PDF path and wait for confirmation.
6. File it next to last year's report for that customer, matching the existing
   naming: `<Vessel>_<Month>_<Year>.pdf`, or `<Vessel>_ServiceReport_<Month><Year>.pdf`
   in older folders — match the folder you are filing into, not this document.

## Notes

- The gear icon is `assets/icons/technical/ServiceB.svg`, a single path with
  `fill-rule="evenodd"`. It has to be one path: the cover CSS force-tints every
  shape in the icon with `!important`, so a masked or multi-shape icon fills in
  solid. Any new cover icon must be built the same way.
- The `figures` grid block lives in the shared document engine, so
  `nevron-document` can use it too.
