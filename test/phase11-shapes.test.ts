import { describe, it, expect, afterEach } from 'vitest';
import { createTestApp, createTestContainer } from './helpers';
import {
  Matrix2D,
  ObjectPool,
  lerp,
  clamp,
  degToRad,
  radToDeg,
  parseColor,
  interpolateColor,
  merge,
  shallowEqual,
  detectBestRenderer,
  matrixPool,
} from '../src/utils';
import type { Gradient } from '../src/types';
import { toJSON } from '../src/io/json';

describe('Phase 11 shapes & utils coverage', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('utils math and color helpers', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(lerp(0, 100, 0.5)).toBe(50);
    expect(degToRad(180)).toBeCloseTo(Math.PI);
    expect(radToDeg(Math.PI)).toBeCloseTo(180);
    const c = parseColor('#ff8000');
    expect(c.r).toBe(255);
    expect(interpolateColor('#000000', '#ffffff', 0.5)).toBeTruthy();
    const a = { x: 1, y: 2 };
    const b = merge({ ...a }, { z: 3 });
    expect(b.z).toBe(3);
    expect(shallowEqual({ a: 1 }, { a: 1 })).toBe(true);
    expect(detectBestRenderer()).toBeTruthy();

    const pool = new ObjectPool(() => ({ v: 0 }), (o) => {
      o.v = 0;
    });
    const item = pool.acquire();
    pool.release(item);
    const m = matrixPool.acquire();
    m.translate(10, 20).rotate(0.5);
    m.invert();
    matrixPool.release(m);
  });

  it('Matrix2D full transform chain', () => {
    const m = new Matrix2D();
    m.translate(10, 20).scale(2, 3).skew(0.1, 0.2).rotate(Math.PI / 4);
    const p = m.transformPoint(5, 5);
    expect(p.x).toBeDefined();
    const inv = new Matrix2D();
    m.invertInto(inv);
    const css = m.toCSS();
    expect(css).toContain('matrix');
  });

  it('all shapes on SVG renderer', () => {
    const container = createTestContainer(800, 600);
    const app = createTestApp(container, { renderer: 'svg' });
    const grad: Gradient = {
      type: 'linear',
      x0: 0,
      y0: 0,
      x1: 100,
      y1: 0,
      stops: [
        { offset: 0, color: '#f00' },
        { offset: 1, color: '#00f' },
      ],
    };
    const shapes = [
      app.rect({ x: 0, y: 0, width: 40, height: 30, fill: grad }),
      app.circle({ x: 60, y: 20, radius: 15, stroke: '#000', strokeWidth: 2 }),
      app.ellipse({ x: 100, y: 10, radiusX: 25, radiusY: 12, fill: '#0f0' }),
      app.line({ x: 140, y: 0, x2: 40, y2: 30, stroke: '#333', strokeWidth: 2 }),
      app.arc({ x: 200, y: 20, radius: 18, startAngle: 0, endAngle: Math.PI, fill: '#ff0' }),
      app.polygon({ points: [0, 0, 20, 0, 10, 20], x: 240, y: 0, fill: '#f0f' }),
      app.polyline({ points: [0, 0, 15, 15, 30, 0], x: 280, y: 0, stroke: '#000' }),
      app.path({ d: 'M0 0 L30 0 L15 25 Z', x: 320, y: 0, fill: '#ccc' }),
      app.star({ x: 360, y: 0, numPoints: 5, innerRadius: 8, outerRadius: 16, fill: '#fc0' }),
      app.text({ x: 400, y: 10, text: 'SVG', fontSize: 14, fill: '#111' }),
      app.roundedRect({ x: 460, y: 0, width: 50, height: 30, cornerRadius: 6, fill: '#8cf' }),
    ];
    for (const s of shapes) {
      app.add(s);
      expect(s.containsPoint(5, 5)).toBeDefined();
    }
    app.render();
    app.destroy();
  });

  it('all shapes on canvas with effects', () => {
    const container = createTestContainer(800, 600);
    const app = createTestApp(container, { renderer: 'canvas' });
    const group = app.group({ cacheAsBitmap: true });
    group.add(
      app.rect({
        width: 50,
        height: 40,
        fill: '#2563eb',
        shadow: { color: 'rgba(0,0,0,0.3)', blur: 4, offsetX: 2, offsetY: 2 },
        dash: [4, 2],
      })
    );
    app.add(
      group,
      app.sprite({
        src: 'data:image/png;base64,mock',
        frameWidth: 16,
        frameHeight: 16,
        frameCount: 4,
        playing: true,
        fps: 10,
      })
    );
    app.render();
    app.render();
    const json = toJSON(group);
    expect(json.type).toBe('group');
    group.destroy();
    app.destroy();
  });

  it('node interaction flags and hit test', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'canvas' });
    const node = app.rect({
      x: 10,
      y: 10,
      width: 50,
      height: 40,
      fill: '#f00',
      draggable: true,
      focusable: true,
      role: 'button',
      ariaChecked: true,
    });
    app.add(node);
    node.attr('custom', 42);
    expect(node.containsPoint(20, 20)).toBe(true);
    expect(node.containsPoint(200, 200)).toBe(false);
    app.hitTest(30, 30);
    app.destroy();
  });
});
