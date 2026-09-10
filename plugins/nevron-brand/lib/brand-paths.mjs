/* ==========================================================================
   Brand root resolution, shared by the builders.

   The plugin deliberately ships only what a build must have offline. Bulk
   imagery (screenshots, product images, illustrations) stays in the repo, so
   it is cloned once instead of being re-copied into the plugin cache on every
   release. That means two roots, not one.
   ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

/** Bundled with the plugin: BRAND.md, tokens/, assets/logos, assets/icons.
 *  Always present. `fromDir` is a skill folder (<plugin>/skills/<name>). */
export function pluginRoot(fromDir) {
  return process.env.CLAUDE_PLUGIN_ROOT || path.resolve(fromDir, '..', '..');
}

/** The repo clone: assets/screenshots, assets/product-images,
 *  assets/illustrations, examples/. May legitimately be absent — callers must
 *  cope with null rather than fail the build. */
export function libraryRoot(pRoot) {
  const marker = path.join('assets', 'screenshots');
  const candidates = [
    process.env.NEVRON_BRAND_LIBRARY,
    // running from a repo checkout: <repo>/plugins/nevron-brand -> <repo>
    path.resolve(pRoot, '..', '..'),
    // installed from the marketplace: the clone sits beside the plugin cache
    path.join(os.homedir(), '.claude', 'plugins', 'marketplaces', 'nevron-brand-agent'),
  ].filter(Boolean);
  for (const c of candidates) {
    try { if (fs.existsSync(path.join(c, marker))) return c; } catch { /* keep looking */ }
  }
  return null;
}
