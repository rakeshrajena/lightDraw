import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import {
  createTestApp,
  createTestContainer,
  populateRects,
  measureAverageMs,
  measureMs,
} from './helpers';

interface BenchmarkBaseline {
  version: string;
  phase: number;
  recordedAt: string;
  environment: string;
  scenarios: Record<
    string,
    {
      nodeCount: number;
      createMs: number;
      renderMs: number;
      hitTestMs: number;
      animateMs: number;
    }
  >;
}

const BASELINE_PATH = resolve(process.cwd(), 'benchmarks/baseline.json');

/** Vitest runs slower than standalone benchmark script (coverage, transforms, full suite). */
const VITEST_TOLERANCE = 3.5;

function loadBaseline(): BenchmarkBaseline | null {
  if (!existsSync(BASELINE_PATH)) return null;
  return JSON.parse(readFileSync(BASELINE_PATH, 'utf8')) as BenchmarkBaseline;
}

function assertWithinBudget(
  actual: number,
  baseline: number,
  label: string,
  tolerance = VITEST_TOLERANCE
): void {
  const max = baseline * (1 + tolerance);
  expect(
    actual,
    `${label}: ${actual.toFixed(2)}ms exceeds baseline ${baseline.toFixed(2)}ms × ${1 + tolerance}`
  ).toBeLessThanOrEqual(max);
}

describe('Performance regression', () => {
  const baseline = loadBaseline();

  it('baseline.json exists and is valid', () => {
    expect(baseline).not.toBeNull();
    expect(baseline!.phase).toBeGreaterThanOrEqual(0);
    expect(Object.keys(baseline!.scenarios).length).toBeGreaterThan(0);
  });

  it('render 500 nodes — within baseline budget', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    populateRects(app, 500);

    const renderMs = measureAverageMs(() => app.render(), 5);
    const key = 'nodes-500';
    const expected = baseline!.scenarios[key];

    expect(expected).toBeDefined();
    assertWithinBudget(renderMs, expected.renderMs, `render ${key}`);

    app.destroy();
    container.remove();
  });

  it('render 1000 nodes — within baseline budget', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    populateRects(app, 1000);

    const renderMs = measureAverageMs(() => app.render(), 3);
    const key = 'nodes-1000';
    const expected = baseline!.scenarios[key];

    expect(expected).toBeDefined();
    assertWithinBudget(renderMs, expected.renderMs, `render ${key}`);

    app.destroy();
    container.remove();
  });

  it('hitTest 1000 nodes — within baseline budget', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    populateRects(app, 1000);
    app.render();

    const hitTestMs = measureAverageMs(() => {
      app.hitTest(100, 100);
    }, 50);

    const key = 'nodes-1000';
    const expected = baseline!.scenarios[key];

    expect(expected).toBeDefined();
    assertWithinBudget(hitTestMs, expected.hitTestMs, `hitTest ${key}`, 3);

    app.destroy();
    container.remove();
  });

  it('create 500 nodes — within baseline budget', async () => {
    const container = createTestContainer();
    const createMs = await measureMs(() => {
      const app = createTestApp(container, { renderer: 'html' });
      populateRects(app, 500);
      app.destroy();
    });

    const key = 'nodes-500';
    const expected = baseline!.scenarios[key];

    expect(expected).toBeDefined();
    assertWithinBudget(createMs, expected.createMs, `create ${key}`);

    container.remove();
  });

  it('animation completes within duration budget', async () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const rect = app.rect({ x: 0, y: 0, width: 50, height: 50, fill: '#00f' });
    app.add(rect);

    const animateMs = await measureMs(async () => {
      await new Promise<void>((resolve) => {
        rect.animate({ x: 200, duration: 50, onComplete: resolve });
      });
    });

    // Animation must complete near requested duration (not compare to benchmark scheduling time)
    expect(animateMs).toBeGreaterThanOrEqual(40);
    expect(animateMs).toBeLessThan(500);

    app.destroy();
    container.remove();
  });
});

describe('Performance budgets (absolute)', () => {
  it('render 1000 nodes completes under 500ms (html renderer)', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    populateRects(app, 1000);

    const renderMs = measureAverageMs(() => app.render(), 3);
    expect(renderMs).toBeLessThan(500);

    app.destroy();
    container.remove();
  });

  it('hitTest on 1000 nodes completes under 50ms', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    populateRects(app, 1000);

    const hitTestMs = measureAverageMs(() => app.hitTest(50, 50), 20);
    expect(hitTestMs).toBeLessThan(50);

    app.destroy();
    container.remove();
  });

  it('create 500 nodes completes under 1000ms', async () => {
    const container = createTestContainer();
    const createMs = await measureMs(() => {
      const app = createTestApp(container, { renderer: 'html' });
      populateRects(app, 500);
      app.destroy();
    });
    expect(createMs).toBeLessThan(1000);
    container.remove();
  });
});
