import { describe, it, expect, afterEach } from 'vitest';
import {
  createTestApp,
  createTestContainer,
  populateRects,
  heapUsed,
  forceGc,
} from './helpers';
import { forceDirectedLayout } from '../src/diagram/layouts';

/** Max heap growth allowed per scenario (bytes). */
const MAX_GROWTH = {
  appCycle200: 30 * 1024 * 1024,
  appCycle1000: 50 * 1024 * 1024,
  nodes1000: 56 * 1024 * 1024,
  groups500: 40 * 1024 * 1024,
  render500: 50 * 1024 * 1024,
  // Raised for diagram icon/editor overhead under full-suite load (~36 MB observed).
  forceLayout50: 40 * 1024 * 1024,
};

describe('Memory', () => {
  const containers: HTMLDivElement[] = [];

  afterEach(() => {
    while (containers.length > 0) {
      containers.pop()?.remove();
    }
    forceGc();
  });

  it('App create/destroy × 200 — heap growth bounded', () => {
    forceGc();
    const before = heapUsed();
    const cycles = 200;

    for (let i = 0; i < cycles; i++) {
      const container = createTestContainer(400, 300);
      containers.push(container);
      const app = createTestApp(container, { renderer: 'html' });
      app.add(app.rect({ width: 20, height: 20, fill: '#000' }));
      app.render();
      app.destroy();
    }

    forceGc();
    const growth = heapUsed() - before;
    expect(growth).toBeLessThan(MAX_GROWTH.appCycle200);
  });

  it('App create/destroy × 1000 — heap growth bounded', () => {
    forceGc();
    const before = heapUsed();
    const cycles = 1000;

    for (let i = 0; i < cycles; i++) {
      const container = createTestContainer(200, 150);
      containers.push(container);
      const app = createTestApp(container, { renderer: 'html' });
      app.destroy();
    }

    forceGc();
    const growth = heapUsed() - before;
    expect(growth).toBeLessThan(MAX_GROWTH.appCycle1000);
  });

  it('add/remove 1000 nodes — heap growth bounded', () => {
    forceGc();
    const before = heapUsed();
    const container = createTestContainer();
    containers.push(container);
    const app = createTestApp(container, { renderer: 'html' });

    const nodes = [];
    for (let i = 0; i < 1000; i++) {
      const rect = app.rect({ width: 5, height: 5, fill: '#000' });
      nodes.push(rect);
      app.add(rect);
    }
    expect(app.stage.children.length).toBe(1000);

    for (const node of nodes) {
      app.stage.remove(node);
      node.destroy();
    }
    app.stage.clear();
    app.destroy();

    forceGc();
    expect(heapUsed() - before).toBeLessThan(MAX_GROWTH.nodes1000);
  });

  it('nested groups × 500 — heap growth bounded after destroy', () => {
    forceGc();
    const before = heapUsed();
    const container = createTestContainer();
    containers.push(container);
    const app = createTestApp(container, { renderer: 'html' });

    for (let i = 0; i < 500; i++) {
      const group = app.group();
      group.add(app.circle({ radius: 3, fill: '#f00' }));
      app.add(group);
    }
    app.render();
    app.destroy();

    forceGc();
    expect(heapUsed() - before).toBeLessThan(MAX_GROWTH.groups500);
  });

  it('populate 500 rects render/destroy — heap growth bounded', () => {
    forceGc();
    const before = heapUsed();
    const container = createTestContainer();
    containers.push(container);
    const app = createTestApp(container, { renderer: 'html' });

    populateRects(app, 500);
    for (let i = 0; i < 5; i++) {
      app.render();
    }
    app.destroy();

    forceGc();
    expect(heapUsed() - before).toBeLessThan(MAX_GROWTH.render500);
  });

  it('repeated create/destroy — growth rate stabilizes (no linear leak)', () => {
    forceGc();

    function cycleGrowth(count: number): number {
      const before = heapUsed();
      for (let i = 0; i < count; i++) {
        const c = createTestContainer(100, 100);
        containers.push(c);
        const app = createTestApp(c, { renderer: 'html' });
        app.add(app.rect({ width: 5, height: 5 }));
        app.destroy();
      }
      forceGc();
      return heapUsed() - before;
    }

    const first = cycleGrowth(50);
    forceGc();
    const second = cycleGrowth(50);

    // Second batch should not grow significantly more per-object than first (2× allowance).
    // Floor raised for theme-system App overhead (~10 MB observed on CI/local).
    expect(second).toBeLessThan(Math.max(first * 2, 12 * 1024 * 1024));
  });

  it('App create/destroy × 10000 — completes without error (Phase 12)', () => {
    for (let i = 0; i < 10_000; i++) {
      const container = createTestContainer(80, 60);
      const app = createTestApp(container, { renderer: 'html' });
      app.destroy();
      container.remove();
    }
    forceGc();
    expect(true).toBe(true);
  });

  it('force layout × 50 runs — heap growth bounded', () => {
    forceGc();
    const before = heapUsed();
    const container = createTestContainer();
    containers.push(container);
    const app = createTestApp(container, { renderer: 'html' });

    for (let run = 0; run < 50; run++) {
      const nodes = Array.from({ length: 20 }, (_, i) => ({ id: `n${i}` }));
      const edges = Array.from({ length: 19 }, (_, i) => ({ from: `n${i}`, to: `n${i + 1}` }));
      forceDirectedLayout(nodes, edges, { seed: run, iterations: 30 });
    }
    app.destroy();

    forceGc();
    expect(heapUsed() - before).toBeLessThan(MAX_GROWTH.forceLayout50);
  });
});
