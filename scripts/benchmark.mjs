/**
 * LightDraw benchmark runner — measures create, render, hitTest, animate.
 *
 * Usage:
 *   node scripts/benchmark.mjs              # run and print results
 *   node scripts/benchmark.mjs --save       # update benchmarks/baseline.json
 *   node scripts/benchmark.mjs --compare    # compare vs baseline (exit 1 on regression)
 */
import { performance } from 'perf_hooks';
import { JSDOM } from 'jsdom';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const BASELINE_PATH = resolve(ROOT, 'benchmarks/baseline.json');
const REGRESSION_TOLERANCE = 0.35;

const args = process.argv.slice(2);
const saveBaseline = args.includes('--save');
const compareBaseline = args.includes('--compare');

// --- jsdom + canvas mock (mirrors test/setup.ts) ---
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="app"></div></body></html>', {
  pretendToBeVisual: true,
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.navigator = dom.window.navigator;
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(performance.now()), 16);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
globalThis.performance = performance;
globalThis.Image = dom.window.Image;
globalThis.HTMLElement = dom.window.HTMLElement;

function installCanvasMock() {
  const proto = dom.window.HTMLCanvasElement.prototype;
  const original = proto.getContext;
  proto.getContext = function (type) {
    if (type === '2d') {
      const noop = () => undefined;
      return {
        canvas: this,
        fillStyle: '#000',
        strokeStyle: '#000',
        lineWidth: 1,
        lineCap: 'butt',
        lineJoin: 'miter',
        globalAlpha: 1,
        shadowColor: 'transparent',
        shadowBlur: 0,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        font: '10px sans-serif',
        textAlign: 'start',
        textBaseline: 'alphabetic',
        save: noop,
        restore: noop,
        beginPath: noop,
        closePath: noop,
        moveTo: noop,
        lineTo: noop,
        rect: noop,
        arc: noop,
        ellipse: noop,
        quadraticCurveTo: noop,
        fill: noop,
        stroke: noop,
        clip: noop,
        clearRect: noop,
        fillRect: noop,
        drawImage: noop,
        fillText: noop,
        strokeText: noop,
        setLineDash: noop,
        setTransform: noop,
        transform: noop,
        translate: noop,
        rotate: noop,
        scale: noop,
        createLinearGradient: () => ({ addColorStop: noop }),
        createRadialGradient: () => ({ addColorStop: noop }),
        measureText: (t) => ({ width: t.length * 8 }),
      };
    }
    return original ? original.call(this, type) : null;
  };
}
installCanvasMock();

const code = readFileSync(resolve(ROOT, 'dist/lightdraw.min.js'), 'utf8');
dom.window.eval(code);
const LightDraw = dom.window.LightDraw;

function avgMs(fn, iterations) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  return (performance.now() - start) / iterations;
}

function runScenario(nodeCount, renderer = 'html') {
  const container = document.getElementById('app');
  container.innerHTML = '';

  const createStart = performance.now();
  const app = LightDraw.createApp(container, {
    width: 800,
    height: 600,
    autoResize: false,
    renderer,
  });

  const cols = Math.ceil(Math.sqrt(nodeCount));
  for (let i = 0; i < nodeCount; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    app.add(
      app.rect({
        x: col * 12,
        y: row * 12,
        width: 10,
        height: 10,
        fill: '#2563eb',
      })
    );
  }
  app.render();
  const createMs = performance.now() - createStart;

  const renderMs = avgMs(() => app.render(), 10);

  const hitTestMs = avgMs(() => app.hitTest(100, 100), 50);

  const rect = app.rect({ x: 0, y: 0, width: 20, height: 20, fill: '#f00' });
  app.add(rect);
  const animateStart = performance.now();
  awaitAnimate(rect, { x: 200, duration: 50 });
  const animateMs = performance.now() - animateStart;

  app.destroy();

  return { nodeCount, createMs, renderMs, hitTestMs, animateMs };
}

function awaitAnimate(target, options) {
  return new Promise((resolve) => {
    target.animate({ ...options, onComplete: resolve });
  });
}

const COUNTS = [500, 1000, 5000];
const scenarios = {};

console.log('LightDraw Benchmark');
console.log('====================\n');

for (const count of COUNTS) {
  const result = runScenario(count, 'html');
  const key = `nodes-${count}`;
  scenarios[key] = result;
  console.log(`Scenario: ${count} nodes (html renderer)`);
  console.log(`  Create + add:  ${result.createMs.toFixed(2)} ms`);
  console.log(`  Render (avg):  ${result.renderMs.toFixed(2)} ms`);
  console.log(`  HitTest (avg): ${result.hitTestMs.toFixed(2)} ms`);
  console.log(`  Animate:       ${result.animateMs.toFixed(2)} ms`);
  console.log('');
}

const report = {
  version: '0.1.1',
  phase: 0,
  recordedAt: new Date().toISOString(),
  environment: `node ${process.version}, jsdom, html renderer`,
  scenarios,
};

if (saveBaseline) {
  mkdirSync(resolve(ROOT, 'benchmarks'), { recursive: true });
  writeFileSync(BASELINE_PATH, JSON.stringify(report, null, 2) + '\n');
  console.log(`Baseline saved to ${BASELINE_PATH}`);
}

if (compareBaseline) {
  if (!existsSync(BASELINE_PATH)) {
    console.error('No baseline found. Run: node scripts/benchmark.mjs --save');
    process.exit(1);
  }
  const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
  let failed = false;

  for (const key of Object.keys(scenarios)) {
    const current = scenarios[key];
    const base = baseline.scenarios[key];
    if (!base) {
      console.warn(`  [skip] No baseline for ${key}`);
      continue;
    }
    for (const metric of ['createMs', 'renderMs', 'hitTestMs', 'animateMs']) {
      const baseVal = base[metric];
      const curVal = current[metric];
      // Sub-millisecond metrics: use absolute tolerance to avoid flaky % checks
      const max =
        baseVal < 2 ? baseVal + 0.5 : baseVal * (1 + REGRESSION_TOLERANCE);
      if (curVal > max) {
        console.error(
          `  [FAIL] ${key}.${metric}: ${curVal.toFixed(2)}ms > ${max.toFixed(2)}ms (baseline ${baseVal.toFixed(2)}ms)`
        );
        failed = true;
      } else {
        console.log(
          `  [ok] ${key}.${metric}: ${curVal.toFixed(2)}ms (baseline ${baseVal.toFixed(2)}ms)`
        );
      }
    }
  }

  if (failed) process.exit(1);
  console.log('\nBenchmark comparison passed.');
}

if (!saveBaseline && !compareBaseline) {
  console.log('Tip: --save to write baseline, --compare to check regression');
}
