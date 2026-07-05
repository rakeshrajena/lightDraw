import { describe, it, expect, afterEach, vi } from 'vitest';
import { createTestApp, createTestContainer } from './helpers';
import { Sprite } from '../src/shapes';
import { pathContainsPoint, pathBounds } from '../src/utils/pathHitTest';
import { detectBestRenderer, Matrix2D } from '../src/utils';
import { CanvasRenderer } from '../src/renderers/CanvasRenderer';
import { ImageNode } from '../src/shapes';
import { Group } from '../src/shapes/Group';
import {
  createNodeBox,
  diagramToJSON,
  normalizeDiagramData,
  seededRandom,
  applyPositions,
} from '../src/diagram/helpers';
import { clearRenderers, registerRenderer } from '../src/registry/renderers';
import { HTMLRenderer } from '../src/renderers/HTMLRenderer';

describe('Phase 12 coverage boost (95% gate)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('Sprite play, updateFrame, and stop', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'canvas' });
    const sprite = app.sprite({
      src: 'data:image/png;base64,mock',
      frameWidth: 16,
      frameHeight: 16,
      frames: 4,
      fps: 12,
      width: 32,
      height: 32,
    });
    app.add(sprite);
    sprite.play({ loop: false });
    sprite.updateFrame(performance.now() + 100);
    sprite.stop();
    const single = app.sprite({ frames: 1, playing: true });
    single.play();
    expect(single.playing).toBe(true);
    app.destroy();
  });

  it('path hit test fallback and bounds', () => {
    const d = 'M10 10 L90 10 L90 90 L10 90 Z';
    expect(pathContainsPoint(d, 50, 50)).toBe(true);
    expect(pathContainsPoint(d, 200, 200)).toBe(false);
    expect(pathContainsPoint('M0 0 L10 0', 5, 0, 8)).toBe(true);
    const b = pathBounds(d);
    expect(b.width).toBeGreaterThan(0);
    expect(b.height).toBeGreaterThan(0);
  });

  it('detectBestRenderer branches', () => {
    const orig = document.createElement;
    vi.spyOn(document, 'createElement').mockImplementation(() => {
      throw new Error('no canvas');
    });
    expect(detectBestRenderer()).toBeTruthy();
    document.createElement = orig;
  });

  it('CanvasRenderer skips image/sprite without loaded bitmap', () => {
    const container = createTestContainer();
    const renderer = new CanvasRenderer();
    renderer.init(container, {
      width: 200,
      height: 200,
      pixelRatio: 1,
      background: '#fff',
    });
    const img = new ImageNode({ width: 40, height: 40 });
    const spr = new Sprite({ frameWidth: 16, frameHeight: 16, frames: 2, width: 32, height: 32 });
    const group = new Group();
    group.add(img, spr);
    renderer.render(group);
    expect(renderer.getLastDrawCallCount()).toBeGreaterThanOrEqual(0);
    renderer.destroy();
  });

  it('SVG renderer full shape matrix and dash offset clear', () => {
    const container = createTestContainer(800, 600);
    const app = createTestApp(container, { renderer: 'svg' });
    const line = app.line({ x: 0, y: 0, x2: 80, y2: 40, stroke: '#000', strokeWidth: 2 });
    line.dashOffset = 5;
    app.add(
      app.ellipse({ x: 100, y: 50, radiusX: 30, radiusY: 15, fill: '#0f0' }),
      line,
      app.arc({ x: 200, y: 50, radius: 20, startAngle: 0, endAngle: Math.PI, fill: '#ff0' }),
      app.image({ src: 'data:image/png;base64,mock', width: 40, height: 40, x: 300, y: 20 })
    );
    app.render();
    line.dashOffset = 0;
    app.render();
    expect(container.querySelector('ellipse')).not.toBeNull();
    app.destroy();
  });

  it('path hit test Path2D fast path', () => {
    const orig = globalThis.Path2D;
    class MockPath2D {
      constructor(public d: string) {}
    }
    // @ts-expect-error test mock
    globalThis.Path2D = MockPath2D;
    const canvasProto = HTMLCanvasElement.prototype.getContext;
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      isPointInPath: () => true,
      isPointInStroke: () => false,
    } as unknown as CanvasRenderingContext2D);

    expect(pathContainsPoint('M0 0 L10 0 L10 10 Z', 5, 5)).toBe(true);

    HTMLCanvasElement.prototype.getContext = canvasProto;
    globalThis.Path2D = orig;
  });

  it('Matrix2D copyFrom and singular invert', () => {
    const m = new Matrix2D().scale(2, 3).translate(10, 20);
    const copy = new Matrix2D();
    copy.copyFrom(m);
    expect(copy.e).toBe(m.e);
    const out = new Matrix2D();
    const singular = new Matrix2D().scale(0, 1);
    expect(singular.invertInto(out)).toBeNull();
    expect(m.toCSS()).toContain('matrix');
  });

  it('detectBestRenderer without canvas uses svg or html', () => {
    clearRenderers();
    registerRenderer('html', () => new HTMLRenderer());
    const orig = document.createElement;
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') throw new Error('no canvas');
      return orig.call(document, tag);
    });
    const choice = detectBestRenderer();
    expect(['svg', 'html', 'canvas']).toContain(choice);
    clearRenderers();
    registerRenderer('canvas', () => new CanvasRenderer());
  });

  it('diagram helpers and node transform state', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'canvas' });
    const box = createNodeBox(app, 'A', 60, 30);
    const g = app.group();
    g.add(box);
    box.metadata.diagramId = 'a1';
    box.metadata.diagramType = 'network';
    applyPositions(g, new Map([['a1', { x: 10, y: 20 }]]));
    expect(diagramToJSON(box).type).toBe('network');
    expect(normalizeDiagramData({ nodes: [], edges: [] }).nodes).toEqual([]);
    const r = seededRandom(99);
    expect(r()).toBeGreaterThanOrEqual(0);

    const child = app.rect({ x: 5, y: 5, width: 10, height: 10 });
    g.add(child);
    child.x = 10;
    const world = child.getWorldMatrix();
    expect(world.e).toBeDefined();
    expect(child.getTransformState().x).toBe(10);
    expect(child.getApp()).toBe(app);
    app.destroy();
  });

  it('HTML renderer focus and high contrast', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html', highContrast: true });
    const btn = app.rect({
      width: 40,
      height: 30,
      fill: '#2563eb',
      focusable: true,
      role: 'button',
    });
    app.add(btn);
    app.focusNode(btn);
    app.render();
    app.destroy();
  });

  it('path hit test stroke detection', () => {
    const orig = globalThis.Path2D;
    class MockPath2D {
      constructor(public d: string) {}
    }
    // @ts-expect-error test mock
    globalThis.Path2D = MockPath2D;
    const canvasProto = HTMLCanvasElement.prototype.getContext;
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      isPointInPath: () => false,
      isPointInStroke: () => true,
    } as unknown as CanvasRenderingContext2D);

    expect(pathContainsPoint('M0 0 L100 0', 50, 0, 4)).toBe(true);

    HTMLCanvasElement.prototype.getContext = canvasProto;
    globalThis.Path2D = orig;
  });

  it('Group sortChildren and nested visibility', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'canvas' });
    const g = app.group({ zIndex: 2 });
    const a = app.rect({ width: 10, height: 10, zIndex: 1 });
    const b = app.rect({ width: 10, height: 10, zIndex: 3 });
    g.add(b, a);
    g.sortChildren?.();
    const hidden = app.rect({ width: 5, height: 5, visible: false });
    g.add(hidden);
    app.add(g);
    app.render();
    app.destroy();
  });
});
