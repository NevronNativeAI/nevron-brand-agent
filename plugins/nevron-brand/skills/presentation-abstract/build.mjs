#!/usr/bin/env node
/* ==========================================================================
   Nevron abstract deck builder
   Usage:
     node build.mjs <deck.json> [outputDir] [--pdf]

   You write the slides. This wraps them.

   Deliberately NOT a slide template engine: the look is a language, not a set
   of shapes to fill, so slide bodies are authored freely in HTML. What this
   guarantees is the chrome that must never vary - the eyebrow, the logo, the
   slide numbering, the fonts, the background - so a hand-written deck cannot
   drift from the house look.
   ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { pluginRoot } from '../../lib/brand-paths.mjs';
import { detectImageRoutes, missingImages } from '../../lib/images.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN = pluginRoot(__dirname);

const deckPath = process.argv[2];
if (!deckPath) {
  console.error('Usage: node build.mjs <deck.json> [outputDir] [--pdf]');
  process.exit(1);
}
const wantPdf = process.argv.includes('--pdf');
const deck = JSON.parse(fs.readFileSync(deckPath, 'utf8'));
const deckDir = path.dirname(path.resolve(deckPath));
const outRoot = path.resolve(
  process.argv[3] && !process.argv[3].startsWith('--')
    ? process.argv[3]
    : path.join(deckDir, 'out'),
);

const slug = deck.slug || 'deck';
const outDir = path.join(outRoot, slug);
fs.mkdirSync(path.join(outDir, 'assets', 'images'), { recursive: true });
fs.mkdirSync(path.join(outDir, 'assets', 'logos'), { recursive: true });

// ---- slides -------------------------------------------------------------
const slidesFile = path.resolve(deckDir, deck.slidesFile || 'slides.html');
if (!fs.existsSync(slidesFile)) {
  console.error(`No slides file at ${slidesFile}. Write your <section class="slide"> blocks there.`);
  process.exit(1);
}
const rawSlides = fs.readFileSync(slidesFile, 'utf8');

const sections = [...rawSlides.matchAll(/<section\b[\s\S]*?<\/section>/g)].map((m) => m[0]);
if (!sections.length) {
  console.error('No <section> blocks found in the slides file.');
  process.exit(1);
}

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const pad = (n) => String(n).padStart(2, '0');
const total = sections.length;
const logoSrc = 'assets/logos/nevron-logo-no-tagline-white.svg';

/** Inject the invariant chrome into a slide the author wrote. */
function chrome(section, i) {
  const n = pad(i + 1);
  let out = section;

  // number every slide, so the counter and any deep link stay in step
  out = out.replace(/<section\b([^>]*)>/, (m, attrs) => {
    let a = attrs;
    if (!/\bclass=/.test(a)) a += ' class="slide"';
    else if (!/\bclass="[^"]*\bslide\b/.test(a)) a = a.replace(/class="([^"]*)"/, 'class="slide $1"');
    if (!/data-slide=/.test(a)) a += ` data-slide="${n}"`;
    return `<section${a}>`;
  });

  // eyebrow: per-slide override, else the deck default, else nothing
  const eyebrowAttr = (section.match(/data-eyebrow="([^"]*)"/) || [])[1];
  const eyebrow = eyebrowAttr != null ? eyebrowAttr : (deck.eyebrow || '');
  const showsNumber = deck.numberInEyebrow !== false && i > 0;
  const eyebrowText = eyebrow && showsNumber ? `${eyebrow} \u00b7 ${n}` : eyebrow;

  if (!/class="top-bar"/.test(out)) {
    const bar = `  <div class="top-bar">\n` +
      `    <span class="mono">${esc(eyebrowText)}</span>\n` +
      `    <img class="brand-logo" src="${logoSrc}" alt="Nevron">\n` +
      `  </div>\n`;
    out = out.replace(/(<section[^>]*>)/, `$1\n${bar}`);
  }

  if (!/class="counter"/.test(out)) {
    out = out.replace(/<\/section>\s*$/, `  <span class="counter">${n} / ${pad(total)}</span>\n</section>`);
  }
  return out;
}

const body = sections.map(chrome).join('\n\n');

// ---- assets -------------------------------------------------------------
// Brand logos come from the plugin's own set. Imagery is the author's - this
// only carries across what already exists next to deck.json.
for (const name of [
  'nevron-logo-no-tagline-white.svg',
  'nevron-logo-icon-white.svg',
  'nevron-logo-tagline-white.svg',
]) {
  try {
    fs.copyFileSync(
      path.join(PLUGIN, 'assets', 'logos', name),
      path.join(outDir, 'assets', 'logos', name),
    );
  } catch { /* a missing optional logo is not fatal */ }
}

const srcImages = path.resolve(deckDir, deck.imagesDir || 'images');
let copied = 0;
if (fs.existsSync(srcImages)) {
  for (const f of fs.readdirSync(srcImages)) {
    if (/^Thumbs\.db$/i.test(f)) continue;
    try {
      fs.copyFileSync(path.join(srcImages, f), path.join(outDir, 'assets', 'images', f));
      copied++;
    } catch { /* skip unreadable */ }
  }
}

// ---- assemble -----------------------------------------------------------
const css = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, 'deck.js'), 'utf8');

const html = `<!DOCTYPE html>
<html lang="${deck.lang || 'en'}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(deck.title || slug)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/primeicons@7.0.0/primeicons.css">
<style>
${css}

/* one slide per printed page, at deck aspect */
@page { size: 1600px 900px; margin: 0; }
</style>
</head>
<body>
<div class="deck" id="deck">
${body}
</div>
<script>
${js}
</script>
</body>
</html>
`;

const htmlPath = path.join(outDir, 'index.html');
fs.writeFileSync(htmlPath, html);

// ---- report -------------------------------------------------------------
console.log('Slides  ->', total);
if (copied) console.log('Images  ->', copied, 'copied from', path.relative(deckDir, srcImages) || 'images');

const missing = missingImages(html, outDir);
if (missing.length) {
  const routes = detectImageRoutes();
  console.warn('');
  console.warn(`[!] ${missing.length} image(s) referenced but not present:`);
  missing.forEach((m) => console.warn('      ' + m));
  console.warn('    ' + routes.note);
  console.warn('    Ask before generating anything - do not assume.');
}

console.log('HTML    ->', htmlPath);

// ---- pdf ----------------------------------------------------------------
if (wantPdf) {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean);
  const chromeBin = candidates.find((c) => { try { return fs.existsSync(c); } catch { return false; } });
  if (!chromeBin) {
    console.warn('[!] no Chrome or Edge found - open index.html and print to PDF by hand');
  } else {
    const pdfPath = path.join(outRoot, `${slug}.pdf`);
    execFileSync(chromeBin, [
      '--headless', '--disable-gpu', '--no-pdf-header-footer',
      `--print-to-pdf=${pdfPath}`, '--virtual-time-budget=15000',
      'file:///' + htmlPath.replace(/\\/g, '/'),
    ], { stdio: 'ignore' });
    console.log('PDF     ->', pdfPath);
  }
}
