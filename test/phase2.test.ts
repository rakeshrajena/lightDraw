import { describe, it, expect, afterEach, vi } from 'vitest';
import { App } from '../src/App';
import { CanvasRenderer } from '../src/renderers/CanvasRenderer';
import { SpatialIndex } from '../src/performance/SpatialIndex';
import { createTestApp, createTestContainer, populateRects, measureAverageMs } from './helpers';
import { heapUsed, forceGc } from './setup';

describe('Phase 2 — Dirty region rendering', () => {
  let container: HTMLDivElement;
  let app: App;

  afterEach(() => {
    app?.destroy();
    container?.remove();
  });

  it('partial clearRect when moving one node after initial render', () => {
    container = createTestContainer();
    app = createTestApp(container, { renderer: 'canvas' });
    const rect = app.rect({ x: 10, y: 10, width: 40, height: 40, fill: '#f00' });
    app.add(rect);
    app.render();

    const renderer = app['renderer'] as CanvasRenderer;
    rect.x = 50;
    rect.markDirty();
    app.render();

    expect(renderer.lastClearRectCount).toBeGreaterThan(0);
    expect(renderer.lastClearRectCount).toBeLessThan(5);
  });
});

describe('Phase 2 — Batch rendering', () => {
  it('batches same-fill rects into fewer fill calls', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'canvas' });
    for (let i = 0; i < 100; i++) {
      app.add(
        app.rect({
          x: (i % 10) * 12,
          y: Math.floor(i / 10) * 12,
          width: 10,
          height: 10,
          fill: '#2563eb',
        })
      );
    }
    app.render();
    const renderer = app['renderer'] as CanvasRenderer;
    expect(renderer.lastFillCallCount).toBeLessThan(20);

    app.destroy();
    container.remove();
  });
});

describe('Phase 2 — Spatial index', () => {
  it('hit tests 10000 nodes under 4ms average', () => {
    const container = createTestContainer(800, 600);
    const app = createTestApp(container, {
      renderer: 'html',
      performance: { spatialIndex: true, spatialIndexThreshold: 100 },
    });
    populateRects(app, 10000);
    app.render();

    const ms = measureAverageMs(() => app.hitTest(100, 100), 30);
    expect(ms).toBeLessThan(4);

    app.destroy();
    container.remove();
  });

  it('SpatialIndex query returns candidates at point', () => {
    const container = createTestContainer();
    const app = createTestApp(container);
    const a = app.rect({ x: 0, y: 0, width: 20, height: 20, fill: '#f00' });
    const b = app.rect({ x: 100, y: 100, width: 20, height: 20, fill: '#00f' });
    app.add(a, b);

    const index = new SpatialIndex(32);
    index.rebuild(app.stage);
    const hits = index.queryPoint(5, 5);
    expect(hits.some((n) => n.id === a.id)).toBe(true);
    expect(hits.some((n) => n.id === b.id)).toBe(false);

    app.destroy();
    container.remove();
  });
});

describe('Phase 2 — Layer cache', () => {
  it('static cached group re-renders quickly after first frame', () => {
    const container = createTestContainer();
    const app = createTestApp(container, {
      renderer: 'canvas',
      performance: { layerCache: true },
    });
    const group = app.group({ cacheAsBitmap: true });
    for (let i = 0; i < 200; i++) {
      group.add(
        app.rect({
          x: (i % 20) * 14,
          y: Math.floor(i / 20) * 14,
          width: 12,
          height: 12,
          fill: '#10b981',
        })
      );
    }
    app.add(group);
    app.render();
    group.clearDirty();
    for (const child of group.children) child.clearDirty();

    const ms = measureAverageMs(() => app.render(), 5);
    expect(ms).toBeLessThan(5); // cached re-render; headroom under coverage instrumentation

    app.destroy();
    container.remove();
  });

  it('cache invalidated on node destroy without heap growth', async () => {
    const container = createTestContainer();
    forceGc();
    const before = heapUsed();

    for (let cycle = 0; cycle < 20; cycle++) {
      const app = createTestApp(container, {
        renderer: 'canvas',
        performance: { layerCache: true },
      });
      const group = app.group({ cacheAsBitmap: true });
      const rects = [];
      for (let i = 0; i < 50; i++) {
        const r = app.rect({ width: 10, height: 10, fill: '#333' });
        rects.push(r);
        group.add(r);
      }
      app.add(group);
      app.render();
      for (const r of rects) r.destroy();
      group.clear();
      app.destroy();
    }

    forceGc();
    const after = heapUsed();
    expect(after - before).toBeLessThan(48 * 1024 * 1024); // headroom under full-suite vitest load
    container.remove();
  });
});

describe('Phase 2 — Renderer diff updates', () => {
  it('SVG renderer reuses DOM nodes across frames', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'svg' });
    const rect = app.rect({ width: 50, height: 50, fill: '#f00' });
    app.add(rect);
    app.render();
    const el = container.querySelector(`#${rect.id}`);
    expect(el).not.toBeNull();

    rect.fill = '#00f';
    rect.markDirty();
    app.render();
    const el2 = container.querySelector(`#${rect.id}`);
    expect(el2).toBe(el);

    app.destroy();
    container.remove();
  });

  it('HTML renderer updates attrs without recreating root children', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const rect = app.rect({ x: 5, y: 5, width: 30, height: 30, fill: '#f00' });
    app.add(rect);
    app.render();
    const root = container.querySelector('.lightdraw-html-root')!;
    const childCountAfterFirst = root.children.length;

    rect.x = 20;
    rect.markDirty();
    app.render();
    expect(root.children.length).toBe(childCountAfterFirst);
    const el = container.querySelector(`#${rect.id}`) as HTMLElement;
    expect(el.style.left).toBe('20px');

    app.destroy();
    container.remove();
  });
});

describe('Phase 2 — requestRender coalescing', () => {
  it('coalesces multiple requestRender calls into one frame', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const renderSpy = vi.spyOn(app, 'render');
    app.requestRender();
    app.requestRender();
    app.requestRender();
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(renderSpy.mock.calls.length).toBeLessThanOrEqual(2);
        renderSpy.mockRestore();
        app.destroy();
        container.remove();
        resolve();
      }, 50);
    });
  });
});

describe('Phase 2 — Canvas performance', () => {
  it('renders 1000 nodes under 16ms on canvas', () => {
    const container = createTestContainer();
    const app = createTestApp(container, {
      renderer: 'canvas',
      performance: { batchRendering: true, spatialIndex: true },
    });
    populateRects(app, 1000);
    app.render();
    const ms = measureAverageMs(() => app.render(), 5);
    expect(ms).toBeLessThan(16);
    app.destroy();
    container.remove();
  });

  it('renders 10000 nodes under 100ms on canvas', () => {
    const container = createTestContainer(800, 600);
    const app = createTestApp(container, {
      renderer: 'canvas',
      performance: { batchRendering: true, spatialIndex: true },
    });
    populateRects(app, 10000);
    app.render();
    const ms = measureAverageMs(() => app.render(), 3);
    expect(ms).toBeLessThan(100);
    app.destroy();
    container.remove();
  });
});
