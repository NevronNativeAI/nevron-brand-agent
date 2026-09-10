#!/usr/bin/env node
/* ==========================================================================
   Nevron Datasheet builder
   Usage:
     node build.mjs <data.json> [outputDir]
   Produces  <outputDir>/<slug>.html  and  <outputDir>/<slug>.pdf
   PDF is rendered with the system Chrome (headless --print-to-pdf) — no npm deps.
   ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { pluginRoot } from '../../lib/brand-paths.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN = pluginRoot(__dirname);

// ---- args --------------------------------------------------------------
const dataPath = process.argv[2];
if (!dataPath) { console.error('Usage: node build.mjs <data.json> [outputDir]'); process.exit(1); }
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const dataDir = path.dirname(path.resolve(dataPath));
const outDir = path.resolve(process.argv[3] || path.join(dataDir, 'output'));
fs.mkdirSync(outDir, { recursive: true });

const slug = (data.slug || data.headerName || data.product || 'datasheet')
  .replace(/[^\w\-]+/g, '_');

// ---- helpers -----------------------------------------------------------
const esc = (s) => String(s ?? '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const fileURL  = (abs) => 'file:///' + abs.replace(/\\/g, '/');
// Logos come from the plugin's shared set - one source of truth, no per-skill copies.
const logoURL  = (name) => fileURL(path.resolve(PLUGIN, 'assets', 'logos', name));
// Resolve an image path from the data file relative to the data file's folder.
const imgURL = (p) => {
  if (!p) return '';
  if (/^(file|https?|data):/i.test(p)) return p;
  return 'file:///' + path.resolve(dataDir, p).replace(/\\/g, '/');
};

// ---- decorative frame (official brand asset, white-on-transparent) --------
// Picks a random frame from the brand Frames folder (SVG or PNG), honouring an
// exclusion list. Override with data.frame (name or path) or data.framesDir.
const FRAME_EXCLUDE = new Set([
  'CirclesBIG.svg', 'FramesBigDots.png', 'FramesBigDotsThin.png',
  'FramesBigSquares.png', 'Circles large.svg', 'Squares 2.svg',
  // normal (non-Big) diagonals — too sparse; prefer the bolder variants
  'Diagonal.svg', 'FramesDiaginal.png',
]);
// Keep line-hatch geometric frames (diagonal, horizontal, vertical, thin,
// double, cross, X, full). These read as one motif with the white corner
// square; pixel/dot/checker/circle/organic patterns clash with it and are denied.
const FRAME_ALLOW = /(diag|horizon|vertical|thin|double|cross|framesx|^x\.|full)/i;
const FRAME_DENY = /(pixel|dot|circle|star|heart|butterfl|wave|arrow|zigzag|chess|checker|square)/i;
let frameWasRandom = false;
function pickFrame() {
  // Bundled with the plugin by default, so a build needs no network share.
  // Point framesDir at J:/Produkcija/_Brand Identity/17_Concepts/Frames to use
  // the full house set when you are on the office network.
  const dir = data.framesDir || path.join(PLUGIN, 'assets', 'frames');
  if (data.frame) {
    const p = /[\\/]/.test(data.frame) ? path.resolve(dataDir, data.frame) : path.join(dir, data.frame);
    return fs.existsSync(p) ? p : null;
  }
  try {
    const files = fs.readdirSync(dir).filter(f =>
      /\.(svg|png)$/i.test(f) && !FRAME_EXCLUDE.has(f) && !/^Thumbs/i.test(f)
      && FRAME_ALLOW.test(f) && !FRAME_DENY.test(f));
    if (!files.length) return null;
    frameWasRandom = true;
    return path.join(dir, files[Math.floor(Math.random() * files.length)]);
  } catch { return null; }
}
// Inline the exact frame asset so the output is self-contained and pixel-exact:
// SVGs are embedded as inline <svg>, rasters as base64 data URIs.
const framePath = pickFrame();
let frameHTML = '';
if (framePath) {
  const ext = path.extname(framePath).toLowerCase();
  try {
    if (ext === '.svg') {
      let svg = fs.readFileSync(framePath, 'utf8').replace(/<\?xml[^>]*\?>\s*/i, '').trim();
      frameHTML = svg.replace(/<svg\b/i, '<svg class="cover__frame"');
    } else {
      const b64 = fs.readFileSync(framePath).toString('base64');
      frameHTML = `<img class="cover__frame" src="data:image/${ext === '.png' ? 'png' : 'jpeg'};base64,${b64}" alt="">`;
    }
    // A random pick makes the cover irreproducible unless we say what it was.
    const picked = path.basename(framePath);
    console.log('Frame ->', picked, frameWasRandom ? `(random - pin it with "frame": "${picked}")` : '(pinned)');
  } catch { frameHTML = ''; }
}

// ---- page builders -----------------------------------------------------
function coverPage(d) {
  return `<section class="page cover">
  <div class="page__bg"></div>
  ${frameHTML}
  <div class="cover__label">Datasheet</div>

  ${d.coverImage ? `<img class="cover__product" src="${imgURL(d.coverImage)}" alt="">` : ''}

  <div class="cover__title">
    <h1>${esc(d.product)}</h1>
    ${d.subtitle ? `<p>${esc(d.subtitle)}</p>` : ''}
  </div>

  <div class="cover__prepared">This datasheet was prepared by<br>Nevron d.o.o. on ${esc(d.date)}.<br>Copyright © ${esc(d.year || new Date().getFullYear())} Nevron d.o.o.</div>
  <img class="cover__logo" src="${logoURL('nevron-logo-tagline-white.svg')}" alt="Nevron">
</section>`;
}

function runningHeader(d) {
  return `<div class="rhead">
    <img class="rhead__logo" src="${logoURL('nevron-logo-no-tagline-grey.svg')}" alt="Nevron">
    <div class="rhead__meta">Datasheet&nbsp;&nbsp;|&nbsp;&nbsp;${esc(d.headerName || d.product)}</div>
  </div>`;
}

function overviewPage(d) {
  const paras = (d.overview || []).map(p => `<p>${esc(p)}</p>`).join('\n');
  const media = (d.overviewImages || []).map(m => `
      <figure class="shot">
        <div class="shot__box">
          <img src="${imgURL(m.src)}" alt="">
          ${m.dimV ? `<div class="dimv"><span>${esc(m.dimV)}</span></div>` : ''}
        </div>
        ${m.dimH ? `<div class="dimh"><span>${esc(m.dimH)}</span></div>` : ''}
      </figure>`).join('\n');

  // Ports: each entry is a path string, or { src, labels:[[xPercent, text], ...] }
  // where labels place a leader line + caption under each connector.
  const portItem = (p) => {
    const src = typeof p === 'string' ? p : p.src;
    const labels = (p && typeof p === 'object' && p.labels) ? p.labels : [];
    const caps = labels.map(([x, t]) =>
      `<span class="port__label" style="left:${x}%">${esc(t)}</span>`).join('');
    return `<figure class="port">
        <img src="${imgURL(src)}" alt="">
        ${labels.length ? `<div class="port__labels">${caps}</div>` : ''}
      </figure>`;
  };
  const portsHTML = (d.ports || []).map(portItem).join('\n');

  return `<section class="page overview">
  ${runningHeader(d)}
  <div class="overview__flow">
    <h2 class="section-title">Product overview</h2>
    <div class="overview__grid">
      <div class="overview__copy">${paras}</div>
      <div class="overview__media">${media}</div>
    </div>
  </div>
  ${portsHTML ? `<div class="ports">
    <h2 class="section-title">Ports</h2>
    <div class="ports__row">${portsHTML}</div>
  </div>` : ''}
</section>`;
}

/* Split spec groups across pages, keeping each group whole. Heights are
   estimated in mm to match the CSS: usable column ~236mm (297 - 40 top - 18
   bottom - a little slack); the first specs page loses ~18mm to the section
   title. A group ~= bar + padding (36mm) + 6mm per row. Overestimating is
   safe — it means fewer groups per page and never a clipped row. */
function paginateSpecs(groups) {
  const CPL = 66;                                   // approx chars per line in the value column
  const rowH = ([, v]) => 5.5 * Math.max(1, Math.ceil(String(v ?? '').length / CPL));
  const groupH = (g) => 35 + (g.rows || []).reduce((s, r) => s + rowH(r), 0);
  const capFor = (pageIdx) => 236 - (pageIdx === 0 ? 18 : 0);
  const pages = [];
  let cur = [], used = 0;
  for (const g of groups) {
    const h = groupH(g);
    if (cur.length && used + h > capFor(pages.length)) { pages.push(cur); cur = []; used = 0; }
    cur.push(g); used += h;
  }
  if (cur.length) pages.push(cur);
  return pages;
}

function specGroup(g) {
  const rows = (g.rows || []).map(([k, v]) =>
    `<div class="spec-row"><div class="spec-row__k">${esc(k)}</div><div class="spec-row__v">${esc(v)}</div></div>`
  ).join('\n');
  return `<div class="spec-group">
    <div class="spec-group__bar">${esc(g.section)}</div>
    <div class="spec-group__rows">${rows}</div>
  </div>`;
}

function specsPages(d) {
  const pages = paginateSpecs(d.specs || []);
  return pages.map((groups, i) => `<section class="page specs">
  <div class="page__bg"></div>
  ${runningHeader(d)}
  <div class="specs__body">
    ${i === 0 ? '<h2 class="section-title">Technical specifications</h2>' : ''}
    ${groups.map(specGroup).join('\n')}
  </div>
</section>`).join('\n');
}

function backPage(d) {
  const c = d.company || {};
  return `<section class="page back">
  <div class="page__bg"></div>
  <div class="back__headline">${esc(d.backHeadline || 'Let there\nbe content!').replace(/\n/g, '<br>')}</div>
  <div class="back__bracket-tr"></div>
  <div class="back__bracket-bl"></div>
  <div class="back__footer">
    <div class="back__addr">
      <div><strong>${esc(c.name || 'Nevron d.o.o')}</strong>${esc(c.street || 'Kidričeva cesta 56')}<br>${esc(c.city || '4220 Škofja Loka')}<br>${esc(c.country || 'Slovenia, EU')}</div>
      <div>${esc(c.phone || 'T: +386 (0)4 777 00 70')}<br>${esc(c.email || 'contact@nevron.eu')}<br>${esc(c.web || 'www.nevron.co')}</div>
    </div>
    <img class="back__logo" src="${logoURL('nevron-logo-tagline-white.svg')}" alt="Nevron">
  </div>
</section>`;
}

// ---- assemble ----------------------------------------------------------
const cssHref = 'file:///' + path.resolve(__dirname, 'styles.css').replace(/\\/g, '/');
const html = `<!doctype html><html lang="en"><head>
<meta charset="utf-8">
<title>Datasheet — ${esc(data.product)}</title>
<link rel="stylesheet" href="${cssHref}">
</head><body>
${coverPage(data)}
${overviewPage(data)}
${specsPages(data)}
${backPage(data)}
</body></html>`;

const htmlPath = path.join(outDir, `${slug}.html`);
fs.writeFileSync(htmlPath, html, 'utf8');
console.log('HTML  ->', htmlPath);

// ---- render to PDF with system Chrome ---------------------------------
function findChrome() {
  const envc = process.env.CHROME_PATH;
  const guesses = [
    envc,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  ].filter(Boolean);
  return guesses.find(g => { try { return fs.existsSync(g); } catch { return false; } });
}

const pdfPath = path.join(outDir, `${slug}.pdf`);
const chrome = findChrome();
if (!chrome) {
  console.error('\n[!] Chrome/Edge not found. Set CHROME_PATH or open the HTML and print to PDF manually.');
  process.exit(0);
}
try {
  execFileSync(chrome, [
    '--headless',
    '--disable-gpu',
    '--no-pdf-header-footer',
    `--print-to-pdf=${pdfPath}`,
    'file:///' + htmlPath.replace(/\\/g, '/'),
  ], { stdio: 'ignore' });
  console.log('PDF   ->', pdfPath);
} catch (e) {
  console.error('[!] Chrome render failed:', e.message);
  console.error('    Open the HTML in a browser and Print → Save as PDF (A4, no margins, background graphics on).');
}
