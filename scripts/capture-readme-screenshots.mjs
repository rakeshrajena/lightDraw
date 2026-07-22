#!/usr/bin/env node
/**
 * Capture full-viewport demo screenshots + diagram wire-flow GIF for README.md
 * Usage: npm run build && npm run build:website && node scripts/capture-readme-screenshots.mjs
 * Requires: playwright chromium (`npx playwright install chromium`) and ffmpeg
 */
import { chromium } from 'playwright';
import { mkdirSync, existsSync, rmSync, statSync } from 'fs';
import { spawn, spawnSync } from 'child_process';
import { setTimeout as delay } from 'timers/promises';
import { join } from 'path';

const PORT = 4173;
const BASE = `http://127.0.0.1:${PORT}`;
const OUT_DIR = 'docs/images';
const FIXED_TIME = new Date('2026-07-05T12:00:00Z').getTime();

/** Desktop viewport — full browser frame, not a cropped #app element */
const VIEWPORT = { width: 1280, height: 800 };

const SHOTS = [
  { path: '/examples/demo-dashboard.html', file: 'dashboard.png', wait: 700 },
  { path: '/examples/demo-automotive.html', file: 'automotive.png', wait: 700 },
  { path: '/examples/demo-diagram.html', file: 'diagram.png', wait: 900 },
  { path: '/examples/demo-ui.html', file: 'ui-components.png', wait: 500 },
  { path: '/examples/demo-animation.html', file: 'animation.png', wait: 500 },
];

const FLOW_GIF = {
  file: 'diagram-flow.gif',
  /** Frames at ~10 fps for ~4.5s of motion */
  fps: 10,
  frames: 45,
  speed: '1.5',
};

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

function requireFfmpeg() {
  const probe = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' });
  if (probe.status !== 0) {
    throw new Error('ffmpeg is required to encode diagram-flow.gif');
  }
}

async function prepareDiagramCanvas(page) {
  await page.evaluate(() => {
    const wrap = document.querySelector('.demo-canvas-wrap');
    if (wrap instanceof HTMLElement) {
      wrap.style.flex = 'none';
      wrap.style.height = '640px';
      wrap.style.minHeight = '640px';
    }
  });
}

async function captureFlowGif(page) {
  requireFfmpeg();
  const framesDir = join(OUT_DIR, '.gif-frames');
  rmSync(framesDir, { recursive: true, force: true });
  mkdirSync(framesDir, { recursive: true });

  console.log(`Capturing ${FLOW_GIF.file} (${FLOW_GIF.frames} frames @ ${FLOW_GIF.fps} fps)…`);
  await page.goto(`${BASE}/examples/demo-diagram.html`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#app canvas, #app .lightdraw-html-root', { timeout: 15000 });
  await prepareDiagramCanvas(page);

  await page.evaluate((speed) => {
    const on = document.getElementById('flow-enabled');
    const status = document.getElementById('flow-status');
    const mode = document.getElementById('flow-mode');
    const playback = document.getElementById('flow-playback');
    const speedEl = document.getElementById('flow-speed');
    if (on instanceof HTMLInputElement) on.checked = true;
    if (status instanceof HTMLInputElement) status.checked = true;
    if (mode instanceof HTMLSelectElement) mode.value = 'both';
    if (playback instanceof HTMLSelectElement) playback.value = 'loop';
    if (speedEl instanceof HTMLInputElement) {
      speedEl.value = speed;
      speedEl.dispatchEvent(new Event('input', { bubbles: true }));
      speedEl.dispatchEvent(new Event('change', { bubbles: true }));
    }
    on?.dispatchEvent(new Event('change', { bubbles: true }));
    status?.dispatchEvent(new Event('change', { bubbles: true }));
    mode?.dispatchEvent(new Event('change', { bubbles: true }));
    playback?.dispatchEvent(new Event('change', { bubbles: true }));
  }, FLOW_GIF.speed);

  // Rebuild with flow opts if the demo exposes pick/show helpers
  await page.evaluate(() => {
    const btn = document.querySelector('[data-diagram="flowchart"]');
    if (btn instanceof HTMLElement) btn.click();
  });
  await delay(800);

  const clipHost = page.locator('#diagram-canvas-wrap');
  await clipHost.waitFor({ state: 'visible' });
  const box = await clipHost.boundingBox();
  if (!box) throw new Error('diagram canvas wrap not found');

  const intervalMs = Math.round(1000 / FLOW_GIF.fps);
  for (let i = 0; i < FLOW_GIF.frames; i++) {
    const framePath = join(framesDir, `frame-${String(i).padStart(3, '0')}.png`);
    await page.screenshot({
      path: framePath,
      clip: {
        x: Math.max(0, Math.floor(box.x)),
        y: Math.max(0, Math.floor(box.y)),
        width: Math.floor(box.width),
        height: Math.floor(box.height),
      },
      animations: 'allow',
      type: 'png',
    });
    await delay(intervalMs);
  }

  const outGif = join(OUT_DIR, FLOW_GIF.file);
  const palette = join(framesDir, 'palette.png');
  const frameGlob = join(framesDir, 'frame-%03d.png');

  // Two-pass palette GIF for smaller size / smoother colors
  const pass1 = spawnSync(
    'ffmpeg',
    [
      '-y',
      '-framerate',
      String(FLOW_GIF.fps),
      '-i',
      frameGlob,
      '-vf',
      'fps=10,scale=960:-1:flags=lanczos,palettegen=stats_mode=diff',
      palette,
    ],
    { encoding: 'utf8' }
  );
  if (pass1.status !== 0) {
    console.error(pass1.stderr);
    throw new Error('ffmpeg palettegen failed');
  }

  const pass2 = spawnSync(
    'ffmpeg',
    [
      '-y',
      '-framerate',
      String(FLOW_GIF.fps),
      '-i',
      frameGlob,
      '-i',
      palette,
      '-lavfi',
      'fps=10,scale=960:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5',
      outGif,
    ],
    { encoding: 'utf8' }
  );
  if (pass2.status !== 0) {
    console.error(pass2.stderr);
    throw new Error('ffmpeg gif encode failed');
  }

  rmSync(framesDir, { recursive: true, force: true });
  const sizeKb = Math.round(statSync(outGif).size / 1024);
  console.log(`  → ${outGif} (~${sizeKb} KB)`);
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
        await prepareDiagramCanvas(page);
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

    await captureFlowGif(page);

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
