#!/usr/bin/env node
/* ==========================================================================
   Nevron offer (ponudba) builder
   Usage:
     node build.mjs <data.json> [outputDir] [--pdf]

   Produces  <outputDir>/<slug>/index.html  plus icons/ and screenshots/,
   the exact shape clients.nevron.co serves, and optionally a PDF beside it.

   Reproduces the offer pages at clients.nevron.co/<Hotel>/ponudba.
   Pricing comes from the live NevronCore rate card when J: is reachable,
   otherwise from a dated snapshot - see pricelist.mjs.
   ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { pluginRoot } from '../../lib/brand-paths.mjs';
import { detectImageRoutes, missingImages } from '../../lib/images.mjs';
import {
  resolveRateCard, monthlyFromDaily, capacityMonthly, applyMinimum, round2,
} from './pricelist.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN = pluginRoot(__dirname);

// ---- args ---------------------------------------------------------------
const dataPath = process.argv[2];
if (!dataPath) {
  console.error('Usage: node build.mjs <data.json> [outputDir] [--pdf]');
  process.exit(1);
}
const wantPdf = process.argv.includes('--pdf');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const dataDir = path.dirname(path.resolve(dataPath));
const outRoot = path.resolve(process.argv[3] && !process.argv[3].startsWith('--')
  ? process.argv[3] : path.join(dataDir, 'output'));

const slug = data.slug || 'Ponudba';
const outDir = path.join(outRoot, slug);
fs.mkdirSync(path.join(outDir, 'icons'), { recursive: true });
fs.mkdirSync(path.join(outDir, 'screenshots'), { recursive: true });

// ---- i18n ---------------------------------------------------------------
// Only the chrome is translated. Everything with meaning is yours to write.
const L = {
  sl: {
    validUntil: 'Ponudba velja do', expired: 'Ponudba je potekla', remaining: 'še',
    fixedMonthly: 'Fiksne mesečne postavke', item: 'Postavka', monthly: 'Mesečno (standard)',
    totalFixed: 'Skupaj fiksno', licensing: 'Licenciranje platforme',
    pilotTerms: 'Pilotni pogoji licenc', oneTime: 'Enkratni stroški',
    included: 'Kaj še dobite v pilotu', howItRuns: 'Kako poteka pilot',
    perMonth: '/mes', free: 'Vse licence brezplačno', standard: 'Standardna cena',
    bed: 'ležišč', room: 'enot', days: 'dni',
    liveSource: (d) => `Cenik NevronCore, osveženo ${d}`,
    snapSource: (d, a) => `Cenik NevronCore, shranjena kopija z dne ${d} (${a} dni stara) — preveri cene pred pošiljanjem`,
    tagline: 'Smart solutions for smart hotels',
  },
  en: {
    validUntil: 'Offer valid until', expired: 'Offer expired', remaining: 'still',
    fixedMonthly: 'Fixed monthly items', item: 'Item', monthly: 'Monthly (standard)',
    totalFixed: 'Total fixed', licensing: 'Platform licensing',
    pilotTerms: 'Pilot licence terms', oneTime: 'One-time costs',
    included: 'What else you get in the pilot', howItRuns: 'How the pilot runs',
    perMonth: '/mo', free: 'All licences free', standard: 'Standard price',
    bed: 'beds', room: 'rooms', days: 'days',
    liveSource: (d) => `NevronCore rate card, last updated ${d}`,
    snapSource: (d, a) => `NevronCore rate card, stored copy from ${d} (${a} days old) — verify before sending`,
    tagline: 'Smart solutions for smart hotels',
  },
};
const lang = data.lang === 'en' ? 'en' : 'sl';
const t = L[lang];

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const eur = (n) => '\u20ac' + Number(n).toLocaleString(lang === 'sl' ? 'sl-SI' : 'en-IE',
  { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const eur0 = (n) => '\u20ac' + Number(n).toLocaleString(lang === 'sl' ? 'sl-SI' : 'en-IE',
  { maximumFractionDigits: 0 });

// ---- assets -------------------------------------------------------------
/** Copy a referenced image into the output folder, keeping its subpath. */
function asset(rel) {
  if (!rel) return '';
  const src = path.resolve(dataDir, rel);
  const dest = path.join(outDir, rel.replace(/^\.\//, ''));
  try {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  } catch {
    console.warn('[!] image not found, referenced anyway:', rel);
  }
  return rel;
}

// The NevronCore mark on the platform poster comes from the plugin's own logo
// set, not from a copy scraped out of an existing client folder.
(function placeLogo() {
  const from = path.join(PLUGIN, 'assets', 'logos', 'nevron-logo-icon-white.svg');
  const to = path.join(outDir, 'icons', 'LogoIcon_neg.svg');
  try { fs.copyFileSync(from, to); } catch { console.warn('[!] could not place logo icon'); }
})();

// ---- pricing ------------------------------------------------------------
/**
 * Build the monthly table. Two modes, as asked for:
 *   nevroncore - lines are derived from the live rate card + your assumptions
 *   custom     - you supply every line and its amount yourself
 */
function buildPricing() {
  const p = data.pricing || {};
  const mode = p.mode === 'custom' ? 'custom' : 'nevroncore';

  if (mode === 'custom') {
    const lines = (p.lines || []).map((l) => ({ ...l, amount: Number(l.amount) || 0 }));
    const subtotal = lines.reduce((a, l) => a + l.amount, 0);
    return {
      mode, lines, total: round2(p.total != null ? p.total : subtotal),
      source: p.sourceLabel || 'Cenik po meri (rocno vnesene postavke)',
      minimum: null, warning: null, drift: [],
    };
  }

  const rc = resolveRateCard(p.pricingPage ? { pricingPage: p.pricingPage } : {});
  const a = p.assumptions || {};
  const lines = [];
  const rate = (key) => {
    const hit = rc.card.monthly.groups.flatMap((g) => g.items).find((i) => i.key === key);
    return hit ? hit.rate : 0;
  };

  if (a.beds || a.rooms) {
    const cap = capacityMonthly(rc.card, { beds: a.beds || 0, rooms: a.rooms || 0 });
    if (cap.amount > 0) {
      const unit = cap.by === 'bed' ? t.bed : t.room;
      lines.push({
        label: 'NevronCore platforma',
        detail: `Capacity \u2014 ${cap.count} ${unit} \u00d7 ${eur(cap.rate)}`,
        amount: cap.amount,
      });
    }
  }
  const daily = [
    ['guestTP', 'guestDevices', 'Guest Experience \u2014 naprave gostov'],
    ['hostDevices', 'hostDevices', 'Host devices \u2014 TV, tablice, kioski'],
    ['signageDevices', 'digitalSignage', 'Digital Signage'],
    ['aiGuestTP', 'aiGuest', 'AI Intelligence \u2014 naprave gostov'],
    ['aiHostDevices', 'aiHost', 'AI Intelligence \u2014 host devices'],
    ['staffBasic', 'staffBasic', 'Staff Operations \u2014 Basic'],
    ['staffPremium', 'staffPremium', 'Staff Operations \u2014 Premium'],
  ];
  for (const [assumptionKey, rateKey, label] of daily) {
    const qty = Number(a[assumptionKey]) || 0;
    if (!qty) continue;
    const r = rate(rateKey);
    lines.push({
      label,
      detail: `${qty} \u00d7 ${eur(r)} \u00d7 30 ${t.days}`,
      amount: monthlyFromDaily(r, qty),
    });
  }

  const subtotal = lines.reduce((x, l) => x + l.amount, 0);
  const min = applyMinimum(rc.card, subtotal);

  return {
    mode, lines, total: min.total, minimum: min,
    source: rc.origin === 'live' ? t.liveSource(rc.asOf) : t.snapSource(rc.asOf, rc.snapshotAge),
    consoleSource: rc.sourceLabel, asOf: rc.asOf, origin: rc.origin,
    warning: rc.warning, drift: rc.drift, card: rc.card,
  };
}

/** The pilot -> 50 % -> standard ladder every offer to date has used. */
function licensePhases(total) {
  const p = data.pricing || {};
  const pilot = p.pilotMonths || 4;
  const disc = p.discountMonths || 8;
  return [
    { cls: ' license-phase--active', period: lang === 'sl' ? `Mesec 1\u2013${pilot} (pilot)` : `Month 1\u2013${pilot} (pilot)`,
      price: '\u20ac0', label: t.free },
    { cls: ' license-phase--discount', period: lang === 'sl' ? `Mesec ${pilot + 1}\u2013${pilot + disc}` : `Month ${pilot + 1}\u2013${pilot + disc}`,
      price: eur0(round2(total / 2)) + t.perMonth, label: lang === 'sl' ? `50 % popust naslednjih ${disc} mesecev` : `50 % discount for ${disc} months` },
    { cls: '', period: lang === 'sl' ? `Mesec ${pilot + disc + 1}+` : `Month ${pilot + disc + 1}+`,
      price: eur0(total) + t.perMonth, label: t.standard },
  ];
}

// ---- section builders ---------------------------------------------------
function coverSection() {
  const c = data.cover || {};
  const h = data.hotel || {};
  const meta = (c.meta || []).map((m, i) =>
    `<span class="cover__meta-item"><i class="pi ${i === 0 ? 'pi-home' : 'pi-shield'}"></i> ${esc(m)}</span>`).join('\n      ');
  return `  <section class="cover">
    ${c.badge ? `<span class="cover__badge"><i class="pi pi-bolt"></i> ${esc(c.badge)}</span>` : ''}
    <h1 class="cover__hook">${esc(c.hook || '')}</h1>
    ${c.sub ? `<p class="cover__sub">${esc(c.sub)}</p>` : ''}
    <p class="cover__hotel"><i class="pi pi-building"></i> ${esc(h.name || '')}</p>
    ${meta ? `<div class="cover__meta">\n      ${meta}\n    </div>` : ''}
    <a href="#glavni-modul" class="cover__cta">${esc(c.cta || (lang === 'sl' ? 'Poglej naprej' : 'Read on'))} <i class="pi pi-arrow-down"></i></a>
    <div class="cover__logo">
      <strong>Nevron</strong>
      ${t.tagline}
    </div>
  </section>`;
}

function mainModuleSection() {
  const m = data.mainModule;
  if (!m) return '';
  return `  <section class="section section--concept-hero" id="glavni-modul">
    <div class="hero-concept">
      <div class="hero-concept__visual">
        <h2 class="hero-concept__title">${esc(m.title || '')}</h2>
        <p class="hero-concept__lead">${esc(m.lead || '')}</p>
      </div>
      ${m.image ? `<div class="hero-concept__poster">
        <img src="${esc(asset(m.image))}" alt="${esc(m.alt || m.title || '')}">
      </div>` : ''}
      ${m.badge ? `<div class="hero-concept__badge-anchor">
        <span class="badge-main"><i class="pi pi-star-fill"></i> ${esc(m.badge)}</span>
      </div>` : ''}
    </div>
  </section>`;
}

function includedSection() {
  const items = data.included || [];
  if (!items.length) return '';
  const rows = items.map((it) => {
    const poster = it.image
      ? `<div class="module-row__poster"><img src="${esc(asset(it.image))}" alt="${esc(it.title || '')}"></div>`
      : `<div class="module-row__poster module-row__poster--platform">
          <div class="platform-poster">
            <img src="icons/LogoIcon_neg.svg" alt="NevronCore" class="platform-poster__logo">
            <div class="platform-poster__title">NevronCore</div>
            <div class="platform-poster__sub">${esc(it.posterSub || 'Platforma')}</div>
          </div>
        </div>`;
    return `      <div class="module-row">
        ${poster}
        <div class="module-row__body">
          <div class="module-row__head">
            <h3>${esc(it.title || '')}</h3>
            ${it.subtitle ? `<small>${esc(it.subtitle)}</small>` : ''}
          </div>
          <p class="module-row__desc">${esc(it.desc || '')}</p>
        </div>
      </div>`;
  }).join('\n');
  return `  <section class="section">
    <h2>${esc(data.includedTitle || t.included)}</h2>
    <div class="module-stack">
${rows}
    </div>
  </section>`;
}

function timelineSection() {
  const months = data.timeline || [];
  if (!months.length) return '';
  const items = months.map((m, i) => `      <div class="tl-month tl-month--m${i + 1}">
        <div class="tl-month__num">${esc(m.period || '')}</div>
        <div class="tl-month__title">${esc(m.title || '')}</div>
        <div class="tl-month__desc">${esc(m.desc || '')}</div>
      </div>`).join('\n');
  return `  <section class="section">
    <h2>${esc(data.timelineTitle || t.howItRuns)}</h2>
    <div class="timeline">
${items}
    </div>
  </section>`;
}

function pricingSection(pr) {
  const rows = pr.lines.map((l) => `        <tr>
          <td>${esc(l.label)}${l.detail ? `<br><small style="color:var(--s3)">${esc(l.detail)}</small>` : ''}</td>
          <td class="text-right nowrap">${eur(l.amount)}</td>
        </tr>`).join('\n');

  const minNote = pr.minimum && pr.minimum.raised
    ? `<p style="font-size:0.8rem;color:var(--s3);margin-top:0.75rem">${esc(pr.card.monthly.minimum.note)}</p>`
    : '';

  const phases = licensePhases(pr.total).map((p) => `      <div class="license-phase${p.cls}">
        <div class="license-phase__period">${esc(p.period)}</div>
        <div class="license-phase__price">${esc(p.price)}</div>
        <div class="license-phase__label">${esc(p.label)}</div>
      </div>`).join('\n');

  return `  <section class="section section--dark">
    <h2>${esc(t.licensing)}</h2>
    ${data.pricing && data.pricing.lead ? `<p class="section-subtitle">${esc(data.pricing.lead)}</p>` : ''}

    <h3>${esc(t.fixedMonthly)}</h3>
    <div class="table-wrap">
      <table>
        <thead><tr><th>${esc(t.item)}</th><th class="text-right">${esc(t.monthly)}</th></tr></thead>
        <tbody>
${rows}
          <tr class="mr-final"><td><strong>${esc(t.totalFixed)}</strong></td>
          <td class="text-right nowrap"><strong>${eur(pr.total)}${esc(t.perMonth)}</strong></td></tr>
        </tbody>
      </table>
    </div>
    ${minNote}
    <p style="font-size:0.75rem;color:var(--s3);margin-top:1rem">${esc(pr.source)}</p>

    <h3>${esc(t.pilotTerms)}</h3>
    <div class="license-timeline">
${phases}
    </div>
  </section>`;
}

function ctaSection() {
  const c = data.cta || {};
  if (!c.title) return '';
  const mail = c.email
    ? `mailto:${c.email}${c.cc ? `?cc=${c.cc}` : ''}${c.subject ? `${c.cc ? '&' : '?'}subject=${encodeURIComponent(c.subject)}` : ''}`
    : '#';
  return `  <section class="section final-cta">
    <h2>${esc(c.title)}</h2>
    <p class="section-subtitle">${esc(c.text || '')}</p>
    <a class="cover__cta" href="${esc(mail)}">${esc(c.button || (lang === 'sl' ? 'Zanima me' : "I'm interested"))}</a>
  </section>`;
}

// ---- assemble -----------------------------------------------------------
const pricing = buildPricing();

const validDate = data.validUntil
  ? new Date(data.validUntil + 'T23:59:59')
  : null;
const validLabel = validDate
  ? validDate.toLocaleDateString(lang === 'sl' ? 'sl-SI' : 'en-IE', { day: 'numeric', month: 'long', year: 'numeric' })
  : '';

const css = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');

const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc((data.hotel && data.hotel.name) || slug)} \u2014 ${lang === 'sl' ? 'Ponudba' : 'Offer'}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/primeicons@7.0.0/primeicons.css">
<style>
${css}
</style>
</head>
<body>
${validDate ? `<div class="countdown" data-expiry="${data.validUntil}T23:59:59">
  <div class="countdown__inner">
    <i class="pi pi-clock"></i>
    <span class="countdown__label">${esc(t.validUntil)}</span>
    <span class="countdown__date">${esc(validLabel)}</span>
    <span class="countdown__time"></span>
  </div>
</div>` : ''}
<div class="page">
${coverSection()}
${mainModuleSection()}
${includedSection()}
${timelineSection()}
${pricingSection(pricing)}
${ctaSection()}
  <footer class="footer">
    <strong>Nevron d.o.o.</strong>
    <span>${t.tagline}</span>
  </footer>
</div>
<script>
(function () {
  var el = document.querySelector('.countdown');
  if (!el) return;
  var end = new Date(el.dataset.expiry).getTime();
  var out = el.querySelector('.countdown__time');
  function tick() {
    var d = end - Date.now();
    if (d <= 0) { out.textContent = '${t.expired}'; out.classList.add('countdown__time--expired'); return; }
    var days = Math.floor(d / 86400000), h = Math.floor(d % 86400000 / 3600000),
        m = Math.floor(d % 3600000 / 60000), s = Math.floor(d % 60000 / 1000);
    out.textContent = '${t.remaining} ' + days + ' dni ' + h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    setTimeout(tick, 1000);
  }
  tick();
})();
</script>
</body>
</html>
`;

const htmlPath = path.join(outDir, 'index.html');
fs.writeFileSync(htmlPath, html);

// ---- report -------------------------------------------------------------
console.log('Pricing ->', pricing.mode === 'custom' ? 'custom pricelist' : 'NevronCore rate card');
console.log('Source  ->', pricing.consoleSource || pricing.source);
if (pricing.warning) console.warn('[!]', pricing.warning);
if (pricing.drift && pricing.drift.length) {
  console.warn('[!] snapshot drifted from live (live wins):');
  pricing.drift.forEach((d) => console.warn('      ' + d));
}
if (pricing.minimum && pricing.minimum.raised) {
  console.log(`Minimum -> raised ${eur(pricing.minimum.from)} to ${eur(pricing.minimum.total)}`);
}
console.log('Total   ->', eur(pricing.total) + t.perMonth);
const missing = missingImages(html, outDir);
if (missing.length) {
  const routes = detectImageRoutes();
  console.warn('');
  console.warn(`[!] ${missing.length} image(s) referenced but not present:`);
  missing.forEach((m) => console.warn('      ' + m));
  console.warn('    ' + routes.note);
  console.warn('    Ask before generating anything - do not assume.');
  console.warn('    Ready-made app screens: assets/app-screens/ in the repo clone.');
  console.warn('');
}

console.log('HTML    ->', htmlPath);

// ---- pdf ----------------------------------------------------------------
if (wantPdf) {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  ].filter(Boolean);
  const chrome = candidates.find((c) => { try { return fs.existsSync(c); } catch { return false; } });
  if (!chrome) {
    console.warn('[!] no Chrome or Edge found - open index.html and Print to PDF by hand');
  } else {
    const pdfPath = path.join(outRoot, `${slug}.pdf`);
    execFileSync(chrome, [
      '--headless', '--disable-gpu', '--no-pdf-header-footer',
      `--print-to-pdf=${pdfPath}`, '--virtual-time-budget=10000',
      'file:///' + htmlPath.replace(/\\/g, '/'),
    ], { stdio: 'ignore' });
    console.log('PDF     ->', pdfPath);
  }
}
