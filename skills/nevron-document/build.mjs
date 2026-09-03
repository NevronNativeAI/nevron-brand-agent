#!/usr/bin/env node
/* ==========================================================================
   Nevron document builder
   Usage:
     node build.mjs <data.json> [outputDir]

   Produces <outputDir>/<slug>.html and <outputDir>/<slug>.pdf.
   PDF is rendered with the system Chrome (headless --print-to-pdf). No npm deps.

   Reproduces the house Word templates:
     variant "full"     → 2025-02-Document template.docx
     variant "nocover"  → 2025-02-Document template_NoFirstpage.docm
   ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..', '..'); // nevron-brand-agent root

// ---- args ---------------------------------------------------------------
const dataPath = process.argv[2];
if (!dataPath) {
  console.error('Usage: node build.mjs <data.json> [outputDir]');
  process.exit(1);
}
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const dataDir = path.dirname(path.resolve(dataPath));
const outDir = path.resolve(process.argv[3] || path.join(dataDir, 'output'));
fs.mkdirSync(outDir, { recursive: true });

const variant = /^(nocover|body)$/.test(data.variant || '') ? 'nocover' : 'full';
const slug = (data.slug || data.title || 'document').replace(/[^\w\-]+/g, '_');

// ---- helpers ------------------------------------------------------------
const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

function localFile(p) {
  if (!p) return '';
  if (/^(file|https?|data):/i.test(p)) return p;
  return 'file:///' + path.resolve(dataDir, p).replace(/\\/g, '/');
}

function readFirst(candidates) {
  for (const c of candidates) {
    try { if (c && fs.existsSync(c)) return fs.readFileSync(c, 'utf8'); } catch { /* keep looking */ }
  }
  return null;
}

/** Inline a brand logo SVG, recoloured. The repo ships blue + white only, so a
 *  grey lockup is made by recolouring the white one.
 *
 *  The Illustrator exports carry their fills in a <style> block keyed on
 *  .cls-1 / .st0. Inlined into HTML those blocks are document-scoped, so three
 *  logos on one page would fight over the same class name and the last one
 *  would win. Strip the blocks and put the fill on the <svg> root instead. */
function logoSVG(name, colour) {
  const svg = readFirst([path.join(REPO, 'assets', 'logos', name)]);
  if (!svg) {
    console.warn('[!] logo not found:', name);
    return '';
  }
  return svg
    .replace(/<\?xml[^>]*\?>\s*/i, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/\sclass="[^"]*"/g, '')
    .replace(/\sstyle="[^"]*"/g, '')
    .replace(/\sfill="[^"]*"/g, '')
    .replace(/<svg\b/i, `<svg fill="${colour}" preserveAspectRatio="xMidYMid meet"`)
    .trim();
}

/** Cover topic icon: a name resolved against the brand repo's icon sets, or a
 *  path relative to data.json. SVG is inlined (and force-tinted by the CSS). */
function iconHTML(spec) {
  if (!spec) return '';
  const tries = [
    path.resolve(dataDir, spec),
    path.join(REPO, 'assets', 'icons', spec),
    path.join(REPO, 'assets', 'icons', 'contentware', spec),
    path.join(REPO, 'assets', 'icons', 'contentware', spec + '.svg'),
    path.join(REPO, 'assets', 'illustrations', spec),
  ];
  const hit = tries.find((p) => { try { return fs.existsSync(p); } catch { return false; } });
  if (!hit) {
    console.warn('[!] cover icon not found:', spec);
    return '';
  }
  if (path.extname(hit).toLowerCase() === '.svg') {
    const svg = fs.readFileSync(hit, 'utf8')
      .replace(/<\?xml[^>]*\?>\s*/i, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')   // don't leak class rules into the page
      .replace(/\sclass="[^"]*"/g, '')
      .trim();
    console.log('Icon  ->', path.basename(hit));
    return svg;
  }
  return `<img src="file:///${hit.replace(/\\/g, '/')}" alt="">`;
}

// ---- inline markup (bold / italic / links) ------------------------------
function inline(s) {
  return esc(s)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => `<a href="${u}">${t}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
}

// ==========================================================================
// Markdown → block list
// ==========================================================================
function parseMarkdown(md) {
  const lines = md.replace(/\r\n?/g, '\n').split('\n');
  const blocks = [];
  let para = [];

  const flush = () => {
    if (para.length) { blocks.push({ p: para.join(' ') }); para = []; }
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();

    if (!line) { flush(); continue; }

    if (/^(---|\*\*\*|___)$/.test(line)) { flush(); blocks.push({ pagebreak: true }); continue; }

    let m;
    if ((m = line.match(/^(#{1,3})\s+(.*)$/))) {
      flush();
      blocks.push({ ['h' + m[1].length]: m[2].trim() });
      continue;
    }

    if ((m = line.match(/^!\[([^\]]*)\]\(([^)\s]+)\)/))) {
      flush();
      blocks.push({ img: m[2], caption: m[1] || '' });
      continue;
    }

    if ((m = raw.match(/^(\s*)[-*+]\s+(.*)$/))) {
      flush();
      blocks.push({ ul: m[2].trim(), level: m[1].length >= 2 ? 2 : 1 });
      continue;
    }

    if ((m = raw.match(/^(\s*)(\d+[.)]|[a-z][.)])\s+(.*)$/))) {
      flush();
      blocks.push({ ol: m[3].trim(), level: m[1].length >= 2 ? 2 : 1 });
      continue;
    }

    // Markdown table
    if (/^\|.*\|$/.test(line) && /^\|[\s:|-]+\|$/.test((lines[i + 1] || '').trim())) {
      flush();
      const cells = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const head = cells(line);
      const rows = [];
      i += 2;
      while (i < lines.length && /^\|.*\|$/.test(lines[i].trim())) { rows.push(cells(lines[i])); i++; }
      i--;
      blocks.push({ table: { head, rows } });
      continue;
    }

    // A bare NAS / URL line is the template's "Link" style
    if (/^(NAS:|https?:\/\/|\\\\|[A-Z]:[\\/])/.test(line) && !/\s{2,}/.test(line)) {
      flush();
      blocks.push({ link: line });
      continue;
    }

    para.push(line);
  }
  flush();
  return blocks;
}

// ==========================================================================
// Blocks → HTML
// ==========================================================================
function renderBlocks(blocks, opts) {
  const numbered = opts.numbered !== false;
  const counters = [0, 0, 0];
  const toc = [];
  const out = [];
  let tocId = 0;

  const level = (b) => (b.h1 ? 1 : b.h2 ? 2 : b.h3 ? 3 : 0);

  // Bullets get their paragraph gap back only after the last item in a run.
  const isList = (b) => b && (b.ul !== undefined);

  blocks.forEach((b, i) => {
    const lvl = level(b);

    if (lvl) {
      const text = b.h1 || b.h2 || b.h3;
      const styles = ['TitleA', 'TitleB', 'TitleC'][lvl - 1];
      const wantNum = numbered && b.numbered !== false;
      let label = '';
      if (wantNum) {
        counters[lvl - 1]++;
        for (let k = lvl; k < 3; k++) counters[k] = 0;
        label = counters.slice(0, lvl).join('.');
      }
      const id = 'h' + ++tocId;
      const cls = styles + (wantNum ? ' ' + styles + 'NUM' : '');
      out.push(
        `<div class="${cls}" data-toc="${id}">` +
        (label ? `<span class="num">${label}</span>` : '') +
        inline(text) + '</div>'
      );
      toc.push({ id, lvl, label, text });
      return;
    }

    if (b.p !== undefined) { out.push(`<p class="Paragraph">${inline(b.p)}</p>`); return; }

    if (b.ul !== undefined) {
      const last = !isList(blocks[i + 1]);
      out.push(`<div class="BulletlistLVL${b.level === 2 ? 2 : 1}${last ? ' is-last' : ''}">${inline(b.ul)}</div>`);
      return;
    }

    if (b.ol !== undefined) {
      const lv = b.level === 2 ? 2 : 1;
      // restart the counter when a new run of numbered items begins
      if (!(blocks[i - 1] && blocks[i - 1].ol !== undefined)) { counters.olA = 0; counters.olB = 0; }
      let mark;
      if (lv === 1) { counters.olA = (counters.olA || 0) + 1; counters.olB = 0; mark = counters.olA + '.'; }
      else { counters.olB = (counters.olB || 0) + 1; mark = String.fromCharCode(96 + counters.olB) + '.'; }
      out.push(`<div class="NumberingLVL${lv}"><span class="num">${mark}</span>${inline(b.ol)}</div>`);
      return;
    }

    if (b.link !== undefined) {
      const href = b.link.replace(/^NAS:\s*/, '');
      out.push(`<p class="Link"><a href="${esc(/^https?:/.test(href) ? href : '#')}">${esc(b.link)}</a></p>`);
      return;
    }

    if (b.img !== undefined) {
      out.push(`<figure class="figure"><img src="${localFile(b.img)}" alt=""></figure>`);
      if (b.caption) out.push(`<p class="Imagesubtext">${inline(b.caption)}</p>`);
      return;
    }

    if (b.caption !== undefined) { out.push(`<p class="Imagesubtext">${inline(b.caption)}</p>`); return; }

    if (b.table) {
      const head = (b.table.head || []).map((c) => `<th>${inline(c)}</th>`).join('');
      const rows = (b.table.rows || [])
        .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('');
      out.push(`<table class="table">${head ? `<thead><tr>${head}</tr></thead>` : ''}<tbody>${rows}</tbody></table>`);
      return;
    }

    if (b.pagebreak) { out.push('<div class="pagebreak"></div>'); return; }

    if (typeof b === 'string') out.push(`<p class="Paragraph">${inline(b)}</p>`);
  });

  return { html: out.join('\n'), toc };
}

// ==========================================================================
// Page shells
// ==========================================================================
const COMPANY = Object.assign({
  name: 'Nevron d.o.o',
  street: 'Kidričeva cesta 56',
  city: '4220 Škofja Loka',
  country: 'Slovenia, EU',
  phone: 'T: +386 (0)4 777 00 70',
  email: 'info@nevron.eu',
  web: 'www.nevron.eu',
}, data.company || {});

const YEAR = data.year || new Date().getFullYear();
const FOOTER_NOTE = data.footerNote ||
  `Trade and secret confidential, Copyright © ${YEAR} ${COMPANY.name}.`;
const RUNNING_HEAD = data.runningHead ||
  [data.title, data.subtitle].filter(Boolean).join('  I  ');

const LOGO_GREY_MARK = logoSVG('nevron-logo-no-tagline-white.svg', '#ADAFB6');
const LOGO_GREY_FULL = logoSVG('nevron-logo-tagline-white.svg', '#ACAFB6');
const LOGO_WHITE_FULL = logoSVG('nevron-logo-tagline-white.svg', '#FFFFFF');

// Header + footer furniture, cloned onto every page by the paginator.
const CHROME_HTML =
  `<div class="rhead__logo">${LOGO_GREY_MARK}</div>` +
  `<div class="rhead__meta">${esc(RUNNING_HEAD)}</div>` +
  `<div class="rfoot"><span>${esc(FOOTER_NOTE)}</span><span class="rfoot__page"></span></div>`;

function coverPage() {
  const prepared = data.prepared || [
    'This document was prepared by',
    `${COMPANY.name}. on ${data.date || ''}.`.replace(/\s+\./g, '.'),
    `Copyright © ${YEAR} ${COMPANY.name}.`,
  ];
  return `<section class="page page--cover">
  <div class="cover__type">${esc(data.docType || '')}</div>
  <div class="cover__frame"><i class="tr-h"></i><i class="tr-v"></i><i class="bl-v"></i><i class="bl-h"></i></div>
  ${data.coverIcon ? `<div class="cover__icon">${iconHTML(data.coverIcon)}</div>` : ''}
  <div class="cover__title">${esc(data.title || '')}</div>
  ${data.subtitle ? `<div class="cover__subtitle">${esc(data.subtitle)}</div>` : ''}
  <div class="cover__prepared">${prepared.map(esc).join('<br>')}</div>
  <div class="cover__logo">${LOGO_GREY_FULL}</div>
</section>`;
}

/** Introduction at the top, disclaimer pinned to the foot of the same page —
 *  the template does this with Disclaimer's 8000tw space-before. */
function introPage(introBlocks) {
  const intro = renderBlocks(introBlocks, { numbered: false }).html;
  return `<section class="page page--intro">
  ${CHROME_HTML}
  <div class="page__content">
    <div class="intro">
      <div class="TitleA">${esc(data.introTitle || 'Introduction')}</div>
      ${intro}
    </div>
    <p class="disclaimer">${inline(data.disclaimer || DEFAULT_DISCLAIMER)}</p>
  </div>
</section>`;
}

const DEFAULT_DISCLAIMER =
  'All rights reserved. The information contained in this document is confidential and may also be ' +
  'proprietary and a trade secret. Without prior written approval from ' + COMPANY.name + ', no part of ' +
  'this document may be reproduced or transmitted in any form or by any means, including but not ' +
  'limited to electronic, mechanical, photocopying or recording or stored in any retrieval system of ' +
  'whatever nature. The use of any copyright notice does not imply unrestricted public access to any ' +
  'part of this document. ' + COMPANY.name + ' trade names used in this document are trademarks of ' +
  COMPANY.name + '. Other trademarks are acknowledged as the property of their rightful owners.';

function tocFlow(toc) {
  const rows = toc.map((t) =>
    `<div class="TOC${t.lvl}">` +
    `<span class="toc__label">${t.label ? esc(t.label) + ' ' : ''}${esc(t.text)}</span>` +
    `<span class="toc__dots"></span>` +
    `<span class="toc__page" data-toc-for="${t.id}"></span>` +
    `</div>`
  ).join('\n');
  return `<div id="tocflow"><div class="TitleA">${esc(data.tocTitle || 'Table of contents')}</div>\n${rows}</div>`;
}

function backPage() {
  return `<section class="page page--back">
  <div class="page__bg"></div>
  <div class="back__frame"><i class="tr-h"></i><i class="tr-v"></i><i class="bl-v"></i><i class="bl-h"></i></div>
  <div class="back__headline">${esc(data.backHeadline || 'Let there\nbe content!').replace(/\n/g, '<br>')}</div>
  <div class="back__contact">
    <div>${esc(COMPANY.phone)}<br>${esc(COMPANY.email)}<br>${esc(COMPANY.web)}</div>
    <div><strong>${esc(COMPANY.name)}</strong><br>${esc(COMPANY.street)}<br>${esc(COMPANY.city)}<br>${esc(COMPANY.country)}</div>
  </div>
  <div class="back__logo">${LOGO_WHITE_FULL}</div>
</section>`;
}

// ==========================================================================
// Assemble
// ==========================================================================
let bodyBlocks = data.body;
if (!bodyBlocks) {
  const md = data.markdown != null
    ? data.markdown
    : data.markdownFile
      ? fs.readFileSync(path.resolve(dataDir, data.markdownFile), 'utf8')
      : null;
  if (md == null) {
    console.error('[!] Nothing to lay out. Give the data file a "body" array, "markdown", or "markdownFile".');
    process.exit(1);
  }
  bodyBlocks = parseMarkdown(md);
}

const rendered = renderBlocks(bodyBlocks, { numbered: data.numbered });
const wantTOC = variant === 'full' && data.toc !== false && rendered.toc.length > 0;

const introBlocks = Array.isArray(data.intro)
  ? data.intro.map((p) => (typeof p === 'string' ? { p } : p))
  : data.intro ? [{ p: data.intro }] : null;

const frontPages = variant === 'full'
  ? coverPage() + '\n' + (introBlocks ? introPage(introBlocks) : '')
  : '';

// Cover is page 1 but prints no number (w:titlePg); the body-only variant
// numbers from its first page.
const firstPageNumber = 1;

const css = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, 'paginate.js'), 'utf8');

const html = `<!doctype html>
<html lang="${data.lang || 'en'}">
<head>
<meta charset="utf-8">
<title>${esc(data.title || slug)}</title>
<style>
${css}
</style>
</head>
<body>
<div id="pages">
${frontPages}
</div>

${wantTOC ? tocFlow(rendered.toc) : ''}

<div id="flow">
${rendered.html}
</div>

<script>
window.NEVRON_DOC = {
  chromeHTML: ${JSON.stringify(CHROME_HTML)},
  firstPageNumber: ${firstPageNumber}
};
</script>
<script>
${js}
</script>
<script>
// The back cover is appended after pagination so it always lands last.
document.getElementById('pages').insertAdjacentHTML('beforeend', ${JSON.stringify(backPage())});
</script>
</body>
</html>`;

const htmlPath = path.join(outDir, `${slug}.html`);
fs.writeFileSync(htmlPath, html, 'utf8');
console.log('HTML  ->', htmlPath);

// ---- render to PDF with system Chrome -----------------------------------
function findChrome() {
  const guesses = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  ].filter(Boolean);
  return guesses.find((g) => { try { return fs.existsSync(g); } catch { return false; } });
}

const pdfPath = path.join(outDir, `${slug}.pdf`);
const chrome = findChrome();
if (!chrome) {
  console.error('\n[!] Chrome/Edge not found. Set CHROME_PATH, or open the HTML and print to PDF');
  console.error('    manually (A4, no margins, background graphics on).');
  process.exit(0);
}
const fileURL = 'file:///' + htmlPath.replace(/\\/g, '/');

try {
  execFileSync(chrome, [
    '--headless',
    '--disable-gpu',
    '--no-pdf-header-footer',
    '--virtual-time-budget=20000',
    `--print-to-pdf=${pdfPath}`,
    fileURL,
  ], { stdio: 'ignore' });
  console.log('PDF   ->', pdfPath);
} catch (e) {
  console.error('[!] Chrome render failed:', e.message);
}

// ---- optional page previews (--png) -------------------------------------
// A PDF can't be eyeballed from a terminal; these can. Used by the skill's
// verification step and handy for showing Kaja a page before filing anything.
if (process.argv.includes('--png')) {
  const shotDir = path.join(outDir, 'preview');
  fs.mkdirSync(shotDir, { recursive: true });

  let count = 0;
  try {
    const dom = execFileSync(chrome, [
      '--headless', '--disable-gpu', '--virtual-time-budget=20000', '--dump-dom', fileURL,
    ], { encoding: 'latin1', maxBuffer: 128 * 1024 * 1024 });
    count = (dom.match(/class="page page--/g) || []).length;
  } catch (e) {
    console.error('[!] Could not count pages for preview:', e.message);
  }

  for (let i = 1; i <= count; i++) {
    const isolated = html.replace(
      '</body>',
      `<style>#pages .page:not(:nth-child(${i})){display:none!important}</style></body>`
    );
    const tmp = path.join(shotDir, `.page-${i}.html`);
    fs.writeFileSync(tmp, isolated, 'utf8');
    const png = path.join(shotDir, `${slug}-p${String(i).padStart(2, '0')}.png`);
    try {
      execFileSync(chrome, [
        '--headless', '--disable-gpu',
        '--virtual-time-budget=20000',
        '--window-size=794,1123',
        '--force-device-scale-factor=1.6',
        `--screenshot=${png}`,
        'file:///' + tmp.replace(/\\/g, '/'),
      ], { stdio: 'ignore' });
    } catch (e) {
      console.error(`[!] preview page ${i} failed:`, e.message);
    }
    fs.unlinkSync(tmp);
  }
  if (count) console.log(`PNG   -> ${shotDir}  (${count} pages)`);
}
