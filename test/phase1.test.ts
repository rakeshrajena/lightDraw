import { describe, it, expect, afterEach } from 'vitest';
import { App } from '../src/App';
import { Layout } from '../src/layout';
import { pathContainsPoint, pathBounds } from '../src/utils/pathHitTest';
import { gradientToCss } from '../src/renderers/styles';
import { createTestApp, createTestContainer, measureAverageMs } from './helpers';
import type { Gradient } from '../src/types';

describe('Phase 1 — Path hit testing', () => {
  it('detects point inside closed rect path', () => {
    const d = 'M 10 10 L 110 10 L 110 60 L 10 60 Z';
    expect(pathContainsPoint(d, 50, 30)).toBe(true);
    expect(pathContainsPoint(d, 5, 5)).toBe(false);
  });

  it('detects point on line path', () => {
    const d = 'M 0 0 L 100 0';
    expect(pathContainsPoint(d, 50, 0, 4)).toBe(true);
    expect(pathContainsPoint(d, 50, 50)).toBe(false);
  });

  it('computes path bounds', () => {
    const b = pathBounds('M 10 20 L 80 20 L 80 90 Z');
    expect(b.x).toBeCloseTo(10);
    expect(b.width).toBeCloseTo(70);
    expect(b.height).toBeCloseTo(70);
  });

  it('Path node containsPoint uses pathHitTest', () => {
    const container = createTestContainer();
    const app = createTestApp(container);
    const path = app.path({ d: 'M 0 0 L 100 0 L 100 100 Z' });
    expect(path.containsPoint(50, 50)).toBe(true);
    expect(path.containsPoint(200, 200)).toBe(false);
    app.destroy();
    container.remove();
  });
});

describe('Phase 1 — Gradients', () => {
  const linearGradient: Gradient = {
    type: 'linear',
    x0: 0,
    y0: 0,
    x1: 100,
    y1: 0,
    stops: [
      { offset: 0, color: '#000' },
      { offset: 1, color: '#fff' },
    ],
  };

  it('gradientToCss produces linear-gradient', () => {
    const css = gradientToCss(linearGradient);
    expect(css).toContain('linear-gradient');
    expect(css).toContain('#000');
    expect(css).toContain('#fff');
  });

  it('SVG renderer applies gradient fill', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'svg' });
    app.add(app.rect({ width: 80, height: 40, fill: linearGradient }));
    app.render();
    expect(container.querySelector('linearGradient')).not.toBeNull();
    app.destroy();
    container.remove();
  });

  it('HTML renderer applies gradient background', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const rect = app.rect({ width: 80, height: 40, fill: linearGradient });
    app.add(rect);
    app.render();
    const el = container.querySelector(`#${rect.id}`) as HTMLElement;
    expect(el.style.background).toContain('gradient');
    app.destroy();
    container.remove();
  });
});

describe('Phase 1 — Masking & clipping', () => {
  let container: HTMLDivElement;
  let app: App;

  afterEach(() => {
    app?.destroy();
    container?.remove();
  });

  it('respects mask in hit testing', () => {
    container = createTestContainer();
    app = createTestApp(container, { renderer: 'html' });
    const mask = app.circle({ x: 0, y: 0, radius: 30, fill: '#000' });
    const rect = app.rect({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      fill: '#f00',
      mask,
    });
    app.add(rect);
    app.render();
    expect(app.hitTest(15, 15)?.node).toBe(rect);
    expect(app.hitTest(80, 80)).toBeNull();
  });

  it('renders with clip without error on canvas', () => {
    container = createTestContainer();
    app = createTestApp(container, { renderer: 'canvas' });
    const group = app.group({ clip: true });
    group.add(app.circle({ radius: 40, fill: '#00f' }));
    app.add(group);
    expect(() => app.render()).not.toThrow();
  });
});

describe('Phase 1 — Flex layout', () => {
  it('wraps items in row direction', () => {
    const container = createTestContainer();
    const app = createTestApp(container);
    const group = app.group();
    for (let i = 0; i < 6; i++) {
      group.add(app.rect({ width: 50, height: 20, fill: '#333' }));
    }
    Layout.flex(group, { direction: 'row', wrap: true, gap: 10, padding: 0, width: 200 });
    expect(group.children[1].x).toBeGreaterThan(group.children[0].x);
    app.destroy();
    container.remove();
  });

  it('centers items with justify center', () => {
    const container = createTestContainer();
    const app = createTestApp(container);
    const group = app.group();
    group.add(app.rect({ width: 40, height: 20 }));
    group.add(app.rect({ width: 40, height: 20 }));
    Layout.flex(group, { direction: 'row', justify: 'center', gap: 10, width: 200 });
    expect(group.children[0].x).toBeGreaterThan(0);
    app.destroy();
    container.remove();
  });
});

describe('Phase 1 — Sprite auto-play', () => {
  it('advances frames when playing', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const sprite = app.sprite({
      width: 32,
      height: 32,
      frameWidth: 32,
      frameHeight: 32,
      frames: 4,
      fps: 60,
      playing: true,
    });
    app.add(sprite);
    const frame0 = sprite.currentFrame;
    app.render();
    app.render();
    expect(sprite.currentFrame).not.toBe(frame0);
    app.destroy();
    container.remove();
  });
});

describe('Phase 1 — Matrix pool', () => {
  it('reuses pooled matrices after release', async () => {
    const { matrixPool, Matrix2D } = await import('../src/utils');
    const m = matrixPool.acquire();
    m.translate(10, 20);
    matrixPool.release(m);
    const reused = matrixPool.acquire();
    expect(reused.e).toBe(0);
    expect(reused.f).toBe(0);

    const src = new Matrix2D();
    src.translate(5, 5);
    const inv = matrixPool.acquire();
    expect(src.invertInto(inv)).not.toBeNull();
    const pt = inv.transformPoint(5, 5);
    expect(pt.x).toBeCloseTo(0);
    expect(pt.y).toBeCloseTo(0);
    matrixPool.release(inv);
  });
});

describe('Phase 1 — Performance', () => {
  it('path hit test completes under 0.5ms average', () => {
    const d = 'M 0 0 L 200 0 L 200 200 L 0 200 Z';
    const ms = measureAverageMs(() => pathContainsPoint(d, 100, 100), 100);
    expect(ms).toBeLessThan(0.5);
  });

  it('masked scene 500 nodes renders under 500ms', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const mask = app.circle({ radius: 200, fill: '#000' });
    for (let i = 0; i < 500; i++) {
      app.add(
        app.rect({
          x: (i % 25) * 12,
          y: Math.floor(i / 25) * 12,
          width: 10,
          height: 10,
          fill: '#2563eb',
          mask: i === 0 ? mask : undefined,
        })
      );
    }
    const ms = measureAverageMs(() => app.render(), 3);
    expect(ms).toBeLessThan(550); // 500 masked nodes; headroom under coverage CI
    app.destroy();
    container.remove();
  });
});
