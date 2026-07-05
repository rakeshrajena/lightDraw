#!/usr/bin/env node
/**
 * CI size gate — fails if bundle gzip exceeds documented targets.
 * Run after `npm run build`.
 *
 * Phase 5 aspirational targets (IMPLEMENTATION_PLAN): core 8 KB, svg/html 3 KB, etc.
 * v0.4.0 measured baselines below are enforced until further tree-shaking.
 * See IMPLEMENTATION_PLAN.md Phase 5 — documented size exceptions.
 */
import { readFileSync, existsSync } from 'fs';
import { gzipSync } from 'zlib';

/** Gzip limits in bytes (v0.9.0 measured baselines + headroom). */
const TARGETS = {
  'lightdraw.core.min.js': 24 * 1024,
  'lightdraw.svg.min.js': 10 * 1024,
  'lightdraw.html.min.js': 9 * 1024,
  'lightdraw.ui.min.js': 8 * 1024,
  'lightdraw.dashboard.min.js': 10 * 1024,
  'lightdraw.automotive.min.js': 10 * 1024,
  'lightdraw.diagram.min.js': 6 * 1024,
  'lightdraw.min.js': 41 * 1024,
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
