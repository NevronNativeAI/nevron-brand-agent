/* ==========================================================================
   NevronCore rate card resolution.

   Prices go stale, and a stale price in a client-facing offer is worse than
   no price at all. So the live SaaS pricing page is the source of truth, the
   vendored snapshot is only a fallback, and every result carries the date it
   came from so the caller can say so out loud.
   ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const LIVE_PRICING_PAGE =
  'J:/Produkcija/HišnaProdukcija-TrzenjskiMateriali/2026-SaaS-Website/pricing.html';

/** Strip tags to a pipe-delimited text stream, the shape the parser expects. */
function flatten(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]+>/g, '|')
    .replace(/\|{2,}/g, '|')
    .replace(/&euro;/g, '\u20ac')
    .replace(/&amp;/g, '&')
    .replace(/&mdash;/g, '\u2014')
    .replace(/&middot;/g, '\u00b7')
    .replace(/&dagger;/g, '\u2020')
    .replace(/[ \t]+/g, ' ');
}

/** Pull every "EUR x.xx /unit" rate out of the live page, keyed by its label. */
function parseLiveRates(html) {
  const text = flatten(html);
  const rates = {};
  // e.g.  |Guest devices|€0.10 /day /TP|—|
  const row = /\|([A-Za-z][A-Za-z0-9 &+\-,()']{2,60})\|\u20ac([0-9]+(?:\.[0-9]{1,2})?)\s*\/([a-zA-Z]+)\s*\/?([a-zA-Z]*)\|/g;
  let m;
  while ((m = row.exec(text)) !== null) {
    const [, label, amount, unitA, unitB] = m;
    rates[label.trim()] = {
      rate: Number(amount),
      unit: unitB ? `${unitA}/${unitB}` : unitA,
    };
  }
  // one-time costs: |Room Care|€580|~8 h Nevron|
  const once = /\|([A-Za-z][A-Za-z0-9 &+\-,():']{2,70})\|\u20ac([0-9][0-9,]*)\|/g;
  const oneTime = {};
  while ((m = once.exec(text)) !== null) {
    oneTime[m[1].trim()] = Number(m[2].replace(/,/g, ''));
  }
  return { rates, oneTime };
}

function formatDate(d) {
  return d.toISOString().slice(0, 10);
}

/**
 * Resolve the rate card.
 * Returns { card, origin, asOf, stale, warning } - always. Never throws on a
 * missing share; the caller decides whether a snapshot is good enough.
 */
export function resolveRateCard(opts = {}) {
  const snapshotPath = path.join(__dirname, 'reference', 'rate-card.json');
  const card = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  const livePath = opts.pricingPage || LIVE_PRICING_PAGE;

  let origin = 'snapshot';
  let asOf = card.capturedFrom;
  let warning = null;
  let live = null;

  try {
    if (fs.existsSync(livePath)) {
      const html = fs.readFileSync(livePath, 'utf8');
      const mtime = fs.statSync(livePath).mtime;
      live = parseLiveRates(html);
      origin = 'live';
      asOf = formatDate(mtime);
    } else {
      warning =
        `The live rate card at ${livePath} is not reachable (no J: access?). ` +
        `Falling back to the snapshot captured ${card.capturedFrom}. Verify the ` +
        `prices before this offer goes to a client.`;
    }
  } catch (err) {
    warning =
      `Could not read the live rate card (${err.message}). Falling back to the ` +
      `snapshot captured ${card.capturedFrom}. Verify the prices before sending.`;
  }

  // Cross-check the snapshot against the live page and shout about drift, so a
  // stale vendored file cannot quietly under- or over-quote a hotel.
  const drift = [];
  if (live) {
    for (const group of card.monthly.groups) {
      for (const item of group.items) {
        const hit = live.rates[item.label];
        if (hit && typeof item.rate === 'number' && hit.rate !== item.rate) {
          drift.push(`${item.label}: snapshot \u20ac${item.rate}, live \u20ac${hit.rate}`);
          item.rate = hit.rate;          // live always wins
        }
      }
    }
    for (const group of card.oneTime.groups) {
      for (const item of group.items) {
        const hit = live.oneTime[item.label];
        if (hit && typeof item.cost === 'number' && hit !== item.cost) {
          drift.push(`${item.label}: snapshot \u20ac${item.cost}, live \u20ac${hit}`);
          item.cost = hit;
        }
      }
    }
  }

  const snapshotAge = Math.round(
    (Date.now() - new Date(card.capturedFrom).getTime()) / 86400000,
  );

  return {
    card,
    origin,
    asOf,
    warning,
    drift,
    stale: origin === 'snapshot' && snapshotAge > 30,
    sourceParts: { origin, asOf, snapshotAge },
    snapshotAge,
    sourceLabel:
      origin === 'live'
        ? `NevronCore rate card, live from the SaaS site, last updated ${asOf}`
        : `NevronCore rate card, vendored snapshot from ${asOf} (${snapshotAge} days old)`,
  };
}

/** Monthly cost of a daily-billed line: rate x quantity x 30. */
export function monthlyFromDaily(rate, quantity, daysPerMonth = 30) {
  return round2(rate * quantity * daysPerMonth);
}

/** Capacity line: whichever of beds x rate / rooms x altRate is higher. */
export function capacityMonthly(card, { beds = 0, rooms = 0 }) {
  const item = card.monthly.groups
    .flatMap((g) => g.items)
    .find((i) => i.key === 'capacity');
  if (!item) return { amount: 0, basis: null };
  const byBed = round2(beds * item.rate);
  const byRoom = round2(rooms * item.alternate.rate);
  return byBed >= byRoom
    ? { amount: byBed, by: 'bed',  count: beds,  rate: item.rate }
    : { amount: byRoom, by: 'room', count: rooms, rate: item.alternate.rate };
}

/** Apply the whole-bill monthly minimum. */
export function applyMinimum(card, subtotal) {
  const min = card.monthly.minimum.amount;
  return subtotal < min
    ? { total: min, raised: true, from: round2(subtotal), minimum: min }
    : { total: round2(subtotal), raised: false, minimum: min };
}

export function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export { LIVE_PRICING_PAGE };
