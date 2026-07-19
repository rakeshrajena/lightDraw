#!/usr/bin/env node
/**
 * CI size gate — fails if bundle gzip exceeds documented targets.
 * Run after `npm run build`.
 *
 * Phase 5 aspirational targets (IMPLEMENTATION_PLAN): core 8 KB, svg/html 3 KB, etc.
 * v0.9.0 measured baselines below are enforced until further tree-shaking.
 * See IMPLEMENTATION_PLAN.md Phase 5 — documented size exceptions.
 */
import { readFileSync, existsSync } from 'fs';
import { gzipSync } from 'zlib';

/**
 * Gzip limits in bytes (v1.1.0 measured baselines + headroom).
 *
 * Measured after diagram studio (editor, network icons, org collapse) (2026-07):
 *   core 39.3 KB | svg 12.6 KB | html 20.1 KB | ui 16.0 KB
 *   dashboard 38.2 KB | automotive 30.8 KB | diagram 34.8 KB | full 130.7 KB
 */
const TARGETS = {
  'lightdraw.core.min.js': 40 * 1024,
  'lightdraw.svg.min.js': 13 * 1024,
  'lightdraw.html.min.js': 21 * 1024,
  'lightdraw.ui.min.js': 17 * 1024,
  'lightdraw.dashboard.min.js': 39 * 1024,
  'lightdraw.automotive.min.js': 32 * 1024,
  'lightdraw.diagram.min.js': 36 * 1024,
  'lightdraw.min.js': 133 * 1024,
};

const LEGACY_BUNDLES = [
  'lightdraw.core.legacy.js',
  'lightdraw.svg.legacy.js',
  'lightdraw.html.legacy.js',
  'lightdraw.ui.legacy.js',
  'lightdraw.dashboard.legacy.js',
  'lightdraw.automotive.legacy.js',
  'lightdraw.diagram.legacy.js',
  'lightdraw.legacy.js',
];

let failed = false;

for (const [file, maxBytes] of Object.entries(TARGETS)) {
  const path = `dist/${file}`;
  if (!existsSync(path)) {
    console.error(`MISSING: ${path}`);
    failed = true;
    continue;
  }
  const gzip = gzipSync(readFileSync(path));
  const kb = (gzip.length / 1024).toFixed(2);
  const maxKb = (maxBytes / 1024).toFixed(0);
  if (gzip.length > maxBytes) {
    console.error(`FAIL: ${file} — ${kb} KB gzip (max ${maxKb} KB)`);
    failed = true;
  } else {
    console.log(`OK:   ${file} — ${kb} KB gzip (max ${maxKb} KB)`);
  }
}

for (const file of LEGACY_BUNDLES) {
  const path = `dist/${file}`;
  if (!existsSync(path)) {
    console.error(`MISSING legacy: ${path}`);
    failed = true;
  } else {
    console.log(`OK:   ${file} exists`);
  }
}

if (failed) {
  process.exit(1);
}

console.log('Size gate passed.');
