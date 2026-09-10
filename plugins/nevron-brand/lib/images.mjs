/* ==========================================================================
   Where the deck's imagery comes from.

   An abstract deck lives or dies on its hero images, and they are generated,
   not stock. Some machines can generate them here; most cannot. So this
   detects what is actually available and reports it - it never decides. The
   skill asks the user before spending anything on generation.
   ========================================================================== */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function canRun(cmd, args = ['--version']) {
  // one command string rather than shell-plus-args, so Windows can resolve a
  // .cmd shim without tripping Node's deprecation warning
  try {
    execSync([cmd, ...args].join(' '), { stdio: 'ignore', timeout: 15000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * What image routes exist on THIS machine right now.
 * Returns { codex, doctor, auth, route, note } - never throws.
 */
export function detectImageRoutes() {
  const codex = canRun('codex');
  let doctor = false;
  let auth = null;

  if (codex) {
    // codex-doctor ships with the codex-coworker plugin and is the only
    // reliable read on whether image generation is actually usable: it needs
    // ChatGPT-account auth, an API key will not do.
    try {
      const out = execSync('codex-doctor', { encoding: 'utf8', timeout: 60000 });
      doctor = true;
      if (/image generation[^\n]*available/i.test(out)) auth = 'chatgpt';
      else if (/image generation[^\n]*(needs|unavailable|api)/i.test(out)) auth = 'apikey';
    } catch {
      doctor = false;
    }
  }

  let route, note;
  if (codex && auth === 'chatgpt') {
    route = 'codex';
    note = 'Codex is installed and signed in with a ChatGPT account, so it can generate the hero images here.';
  } else if (codex && auth === 'apikey') {
    route = 'prompts';
    note = 'Codex is installed but authenticated with an API key, which cannot generate images. Hand the prompts to the user instead.';
  } else if (codex && !doctor) {
    route = 'ask';
    note = 'Codex is on PATH but codex-doctor is not, so image generation cannot be confirmed. Ask the user before trying it.';
  } else {
    route = 'prompts';
    note = 'No Codex on this machine. Write the image prompts out for the user to generate elsewhere.';
  }

  return { codex, doctor, auth, route, note };
}

/** Which <img> files a built deck refers to but does not have yet. */
export function missingImages(html, outDir) {
  const refs = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((src) => !/^(https?:|data:)/.test(src));
  const missing = [];
  for (const rel of [...new Set(refs)]) {
    const abs = path.join(outDir, rel);
    try { if (!fs.existsSync(abs)) missing.push(rel); } catch { missing.push(rel); }
  }
  return missing;
}

/**
 * Turn a slide's intent into an image prompt that describes LAYOUT first.
 * The deck composes text around the image, so where the subject sits in frame
 * matters more than what it is.
 */
export function promptFor({ subject, placement = 'right', mood = 'abstract' }) {
  const where = {
    right: 'positioned on the right half of the frame, with the left half falling away to near-black empty space for text',
    left: 'positioned on the left half of the frame, with the right half falling away to near-black empty space for text',
    center: 'centred in frame with generous dark margin on all four sides',
    bleed: 'filling the frame edge to edge, with the upper-left quadrant kept darkest and least busy so text can sit over it',
  }[placement] || placement;

  return [
    `A ${mood} 3D render of ${subject}, ${where}.`,
    'Deep near-black background (#03040d) with a soft blue radial glow.',
    'Electric blue (#1B92FF) and pale blue (#73C7FF) light only - no other hues.',
    'Cinematic studio lighting, subtle volumetric haze, high contrast, photoreal materials.',
    'No text, no logos, no watermarks, no people, no user interface.',
    '16:9, 1600x900 or larger.',
  ].join(' ');
}
