#!/usr/bin/env node
/**
 * Capture full-viewport demo screenshots for README.md
 * Usage: npm run build && npm run build:website && node scripts/capture-readme-screenshots.mjs
 * Requires: playwright chromium (`npx playwright install chromium`)
 */
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';
import { spawn } from 'child_process';
import { setTimeout as delay } from 'timers/promises';

const PORT = 4173;
const BASE = `http://127.0.0.1:${PORT}`;
const OUT_DIR = 'docs/images';
const FIXED_TIME = new Date('2026-07-05T12:00:00Z').getTime();

/** Desktop viewport — full browser frame, not a cropped #app element */
const VIEWPORT = { width: 1280, height: 800 };

const SHOTS = [
  { path: '/examples/demo-dashboard.html', file: 'dashboard.png', wait: 500 },
  { path: '/examples/demo-automotive.html', file: 'automotive.png', wait: 600 },
  { path: '/examples/demo-diagram.html', file: 'diagram.png', wait: 500 },
  { path: '/examples/demo-ui.html', file: 'ui-components.png', wait: 400 },
  { path: '/examples/demo-animation.html', file: 'animation.png', wait: 400 },
];

async function waitForServer(url, attempts = 60) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await delay(1000);
  }
  throw new Error(`Preview server did not start at ${url}`);
}

function startPreview() {
  return spawn(
    'npx',
    ['vite', 'preview', '--config', 'website/vite.config.ts', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'],
    { stdio: 'pipe', shell: false }
  );
}

async function main() {
  if (!existsSync('website/dist/index.html')) {
    console.error('Run npm run build:website first.');
    process.exit(1);
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const server = startPreview();
  try {
    await waitForServer(BASE);
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: VIEWPORT });

    await page.addInitScript((fixed) => {
      const RealDate = Date;
      globalThis.Date = class extends RealDate {
        constructor(...args) {
          if (args.length === 0) super(fixed);
          else super(...args);
        }
        static now() {
          return fixed;
        }
      };
    }, FIXED_TIME);

    for (const shot of SHOTS) {
      const out = `${OUT_DIR}/${shot.file}`;
      console.log(`Capturing ${shot.file} (${VIEWPORT.width}×${VIEWPORT.height})…`);
      await page.goto(`${BASE}${shot.path}`, { waitUntil: 'networkidle' });
      await page.waitForSelector('#app canvas, #app .lightdraw-html-root', { timeout: 15000 });
      if (shot.path.includes('demo-diagram')) {
        await page.evaluate(() => {
          const wrap = document.querySelector('.demo-canvas-wrap');
          if (wrap instanceof HTMLElement) {
            wrap.style.flex = 'none';
            wrap.style.height = '640px';
            wrap.style.minHeight = '640px';
          }
        });
      }
      if (shot.wait) await delay(shot.wait);
      await page.screenshot({
        path: out,
        fullPage: false,
        animations: 'disabled',
        type: 'png',
      });
      console.log(`  → ${out}`);
    }

    await browser.close();
    console.log('Done.');
  } finally {
    server.kill('SIGTERM');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
