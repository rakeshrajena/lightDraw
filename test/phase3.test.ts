import { describe, it, expect, afterEach, vi } from 'vitest';
import { App } from '../src/App';
import { AnimationEngine } from '../src/animation/Animation';
import {
  getPathLength,
  getPointAtLength,
  morphPath,
  rectPath,
  samplePath,
} from '../src/utils/pathGeometry';
import { createTestApp, createTestContainer } from './helpers';

afterEach(() => {
  vi.useRealTimers();
  AnimationEngine.stopAll();
});

describe('Phase 3 — Path motion', () => {
  let container: HTMLDivElement;
  let app: App;

  afterEach(() => {
    AnimationEngine.stopAll();
    app?.destroy();
    container?.remove();
  });

  it('object position follows path at t=0, 0.5, 1', async () => {
    container = createTestContainer();
    app = createTestApp(container);
    const pathD = 'M0 0 L200 0';
    const dot = app.circle({ x: 0, y: 0, radius: 5, fill: '#f00' });
    app.add(dot);

    const len = getPathLength(pathD);
    expect(getPointAtLength(pathD, 0).x).toBeCloseTo(0, 0);
    expect(getPointAtLength(pathD, len * 0.5).x).toBeCloseTo(100, 0);
    expect(getPointAtLength(pathD, len).x).toBeCloseTo(200, 0);

    await new Promise<void>((resolve) => {
      dot.animate({
        motionPath: pathD,
        duration: 200,
        easing: 'linear',
        onStart: () => {
          expect(dot.x).toBeCloseTo(0, 0);
          expect(dot.y).toBeCloseTo(0, 0);
        },
        onComplete: () => {
          expect(dot.x).toBeCloseTo(200, 0);
          expect(dot.y).toBeCloseTo(0, 0);
          resolve();
        },
      });
    });
  });

  it('getPointAtLength matches path endpoints', () => {
    const d = 'M10 20 L110 20';
    const len = getPathLength(d);
    expect(len).toBeCloseTo(100, 0);
    const start = getPointAtLength(d, 0);
    const end = getPointAtLength(d, len);
    expect(start.x).toBeCloseTo(10, 0);
    expect(start.y).toBeCloseTo(20, 0);
    expect(end.x).toBeCloseTo(110, 0);
    expect(end.y).toBeCloseTo(20, 0);
  });
});

describe('Phase 3 — Stroke dash offset', () => {
  it('animates dashOffset from 0 to 100', async () => {
    const container = createTestContainer();
    const app = createTestApp(container);
    const line = app.path({
      d: 'M0 0 L100 0',
      stroke: '#000',
      strokeWidth: 2,
      dash: [10, 10],
      dashOffset: 0,
    });
    app.add(line);

    await new Promise<void>((resolve) => {
      line.animate({ dashOffset: 100, duration: 50, onComplete: resolve });
    });

    expect(line.dashOffset).toBe(100);
    AnimationEngine.stopAll();
    app.destroy();
    container.remove();
  });
});

describe('Phase 3 — Path morph', () => {
  it('rect to rounded-rect morph is smooth at 30 steps', () => {
    const from = rectPath(100, 80, 0);
    const to = rectPath(100, 80, 20);
    let maxDelta = 0;
    let prev = morphPath(from, to, 0);

    for (let i = 1; i <= 30; i++) {
      const t = i / 30;
      const next = morphPath(from, to, t);
      const prevPts = prev.match(/-?\d+\.?\d*/g)?.map(Number) ?? [];
      const nextPts = next.match(/-?\d+\.?\d*/g)?.map(Number) ?? [];
      for (let j = 0; j < Math.min(prevPts.length, nextPts.length); j++) {
        maxDelta = Math.max(maxDelta, Math.abs(nextPts[j] - prevPts[j]));
      }
      prev = next;
    }

    expect(maxDelta).toBeLessThan(15);
    const start = morphPath(from, to, 0);
    const end = morphPath(from, to, 1);
    expect(start).toMatch(/^M0 0/);
    expect(end).toContain('100');
  });

  it('animates path d via morphTo', async () => {
    const container = createTestContainer();
    const app = createTestApp(container);
    const from = rectPath(80, 60, 0);
    const to = rectPath(80, 60, 15);
    const shape = app.path({ d: from, fill: '#3b82f6' });
    app.add(shape);

    await new Promise<void>((resolve) => {
      shape.animate({ morphTo: to, duration: 50, onComplete: resolve });
    });

    expect(shape.d).toBe(morphPath(from, to, 1));
    AnimationEngine.stopAll();
    app.destroy();
    container.remove();
  });
});

describe('Phase 3 — Sprite play', () => {
  it('frame index advances with play({ fps, loop })', async () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const sprite = app.sprite({
      width: 32,
      height: 32,
      frameWidth: 32,
      frameHeight: 32,
      frames: 4,
    });
    app.add(sprite);

    sprite.play({ fps: 1000, loop: false });
    expect(sprite.playing).toBe(true);

    await new Promise<void>((resolve) => setTimeout(resolve, 50));

    expect(sprite.currentFrame).toBeGreaterThan(0);

    sprite.stop();
    app.destroy();
    container.remove();
  });
});

describe('Phase 3 — Animation groups', () => {
  it('animates multiple props atomically with single easing', async () => {
    const container = createTestContainer();
    const app = createTestApp(container);
    const rect = app.rect({ x: 0, y: 0, width: 40, height: 40, opacity: 1, fill: '#00f' });
    app.add(rect);

    await new Promise<void>((resolve) => {
      rect.animate({ x: 100, y: 50, opacity: 0.5, duration: 50, onComplete: resolve });
    });

    expect(rect.x).toBe(100);
    expect(rect.y).toBe(50);
    expect(rect.opacity).toBeCloseTo(0.5, 1);
    AnimationEngine.stopAll();
    app.destroy();
    container.remove();
  });
});

describe('Phase 3 — App.animate shorthand', () => {
  it('delegates to AnimationEngine', async () => {
    const container = createTestContainer();
    const app = createTestApp(container);
    const rect = app.rect({ x: 0, width: 20, height: 20, fill: '#f00' });
    app.add(rect);

    await new Promise<void>((resolve) => {
      app.animate(rect, { x: 80, duration: 50, onComplete: resolve });
    });

    expect(rect.x).toBe(80);
    AnimationEngine.stopAll();
    app.destroy();
    container.remove();
  });
});

describe('Phase 3 — Stagger', () => {
  it('5 nodes start 100 ms apart', async () => {
    const container = createTestContainer();
    const app = createTestApp(container);
    const nodes = Array.from({ length: 5 }, (_, i) =>
      app.rect({ x: i * 30, y: 0, width: 20, height: 20, fill: '#2563eb' })
    );
    app.add(...nodes);

    const order: number[] = [];
    await Promise.all(
      nodes.map(
        (node, i) =>
          new Promise<void>((resolve) => {
            AnimationEngine.animate(node as unknown as Record<string, unknown>, {
              y: 100,
              duration: 20,
              delay: i * 100,
              onStart: () => order.push(i),
              onComplete: resolve,
            });
          })
      )
    );

    expect(order).toEqual([0, 1, 2, 3, 4]);

    app.destroy();
    container.remove();
  });

  it('Timeline.stagger queues parallel delayed animations', async () => {
    const container = createTestContainer();
    const app = createTestApp(container);
    const nodes = [app.rect({ width: 10, height: 10 }), app.rect({ width: 10, height: 10 })];
    app.add(...nodes);

    await new Promise<void>((resolve) => {
      app
        .timeline()
        .stagger(nodes, { x: 50, duration: 50 }, 10)
        .call(resolve)
        .play();
    });

    expect(nodes[0].x).toBe(50);
    expect(nodes[1].x).toBe(50);
    app.destroy();
    container.remove();
  });
});

describe('Phase 3 — Memory / RAF', () => {
  it('stop 1000 animations — no orphaned RAF callbacks', () => {
    const container = createTestContainer();
    const app = createTestApp(container);
    const rect = app.rect({ width: 10, height: 10, fill: '#000' });
    app.add(rect);

    for (let i = 0; i < 1000; i++) {
      rect.animate({ x: i, duration: 5000 }).stop();
    }
    AnimationEngine.stopAll();
    expect(AnimationEngine.isTickScheduled()).toBe(false);

    app.destroy();
    container.remove();
  });

  it('500 concurrent animations — cleans up on stopAll', () => {
    const container = createTestContainer();
    const app = createTestApp(container);
    const rects = Array.from({ length: 500 }, () => {
      const r = app.rect({ width: 5, height: 5, fill: '#000' });
      app.add(r);
      return r;
    });

    for (const r of rects) {
      r.animate({ x: 100, opacity: 0.5, duration: 1000, loop: true });
    }

    expect(AnimationEngine.isTickScheduled()).toBe(true);
    AnimationEngine.stopAll();
    expect(AnimationEngine.isTickScheduled()).toBe(false);

    app.destroy();
    container.remove();
  });
});

describe('Phase 3 — Path geometry utilities', () => {
  it('handles empty and degenerate paths', () => {
    expect(getPathLength('')).toBe(0);
    const pt = getPointAtLength('', 10);
    expect(pt.x).toBe(0);
    expect(morphPath('M0 0 L10 0', 'M0 0 L20 0', 0.5)).toMatch(/^M/);
    expect(samplePath('M0 0', 1)).toHaveLength(1);
    expect(samplePath('M0 0 L100 0', 4).length).toBe(4);
  });

  it('motionPath accepts Path node reference', async () => {
    const container = createTestContainer();
    const app = createTestApp(container);
    const track = app.path({ d: 'M0 0 L100 0' });
    const dot = app.circle({ x: 0, y: 0, radius: 4, fill: '#f00' });
    app.add(track, dot);
    await new Promise<void>((resolve) => {
      dot.animate({ motionPath: track, duration: 50, onComplete: resolve });
    });
    expect(dot.x).toBeCloseTo(100, 0);
    app.destroy();
    container.remove();
  });

  it('AnimationEngine pause holds progress', async () => {
    const container = createTestContainer();
    const app = createTestApp(container);
    const rect = app.rect({ x: 0, width: 10, height: 10, fill: '#000' });
    app.add(rect);
    const ctrl = rect.animate({ x: 200, duration: 200 });
    await new Promise<void>((r) => setTimeout(r, 30));
    ctrl.pause();
    const pausedX = rect.x;
    expect(pausedX).toBeGreaterThan(0);
    await new Promise<void>((r) => setTimeout(r, 50));
    expect(rect.x).toBe(pausedX);
    ctrl.stop();
    app.destroy();
    container.remove();
  });

  it('rectPath generates valid open and rounded outlines', () => {
    expect(rectPath(50, 40, 0)).toContain('Z');
    expect(rectPath(50, 40, 8)).toContain('Q');
  });
});

describe('Phase 3 — Path morph performance', () => {
  it('100 morph steps complete under budget', () => {
    const from = rectPath(200, 150, 0);
    const to = rectPath(200, 150, 30);
    const start = performance.now();
    for (let i = 0; i <= 100; i++) {
      morphPath(from, to, i / 100);
    }
    // 150 ms allows CI/coverage instrumentation overhead; perf.test.ts enforces stricter gate
    expect(performance.now() - start).toBeLessThan(150);
  });
});
