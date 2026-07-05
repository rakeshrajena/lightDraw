import { describe, it, expect, afterEach } from 'vitest';
import { createTestApp, createTestContainer } from './helpers';
import { AnimationEngine } from '../src/animation/Animation';
import {
  parsePathSegments,
  getPathLength,
  getPointAtLength,
  samplePath,
  morphPath,
  rectPath,
} from '../src/utils/pathGeometry';
import { exportApp } from '../src/io/export';

describe('Phase 11 coverage boost', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('AnimationEngine color and motion path', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'canvas' });
    const path = app.path({ d: 'M0 0 L100 0 L100 100 Z', fill: null, stroke: '#000' });
    const dot = app.circle({ x: 0, y: 0, radius: 5, fill: '#f00' });
    app.add(path, dot);

    const ctrl = AnimationEngine.animate(dot, {
      motionPath: path,
      duration: 100,
      fill: '#00ff00',
      onUpdate: () => undefined,
    });
    expect(ctrl).toBeTruthy();
    ctrl.stop();
    app.destroy();
  });

  it('pathGeometry utilities', () => {
    const d = 'M10 10 L90 10 L90 90 Z';
    const segs = parsePathSegments(d);
    expect(segs.length).toBeGreaterThan(0);
    expect(getPathLength(d)).toBeGreaterThan(0);
    const pt = getPointAtLength(d, 10);
    expect(pt.x).toBeDefined();
    expect(samplePath(d, 5).length).toBe(5);
    const morphed = morphPath(rectPath(10, 10), rectPath(20, 20, 4), 0.5);
    expect(morphed).toContain('M');
  });

  it('App timeline and export smoke', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'canvas' });
    const r = app.rect({ width: 30, height: 20, fill: '#2563eb' });
    app.add(r);
    app.timeline().move(r, { x: 50, duration: 10 }).play();
    expect(app.getRenderer()).toBeTruthy();
    expect(app.getPixelRatio()).toBeGreaterThan(0);
    expect(app.getBackground()).toBeDefined();
    exportApp(app, { format: 'svg' });
    app.destroy();
  });

  it('additional shape types render on canvas', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'canvas' });
    app.add(
      app.sprite({ src: 'data:image/png;base64,mock', frameWidth: 16, frameHeight: 16, frameCount: 4 }),
      app.image({ src: 'data:image/png;base64,mock', width: 40, height: 40 }),
      app.layer({ name: 'L1' })
    );
    app.render();
    app.destroy();
  });
});
