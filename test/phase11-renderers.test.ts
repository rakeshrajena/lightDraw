import { describe, it, expect, afterEach } from 'vitest';
import { Renderer } from '../src/renderers/Renderer';
import type { RenderContext } from '../src/renderers/Renderer';
import { Group } from '../src/shapes/Group';
import { Rect } from '../src/shapes';
import { createTestApp, createTestContainer } from './helpers';
import {
  parsePathSegments,
  getPathLength,
  getPointAtLength,
} from '../src/utils/pathGeometry';
import {
  num,
  str,
  bool,
  arr,
  getDiagramState,
  setDiagramState,
  createNodeBox,
  applyPositions,
  normalizeDiagramData,
  seededRandom,
  diagramToJSON,
} from '../src/diagram/helpers';

class TestRenderer extends Renderer {
  drawn: string[] = [];

  init(container: HTMLElement, options: RenderContext): void {
    this.width = options.width;
    this.height = options.height;
    this.pixelRatio = options.pixelRatio;
    this.background = options.background;
    void container;
  }

  resize(width: number, height: number, pixelRatio: number): void {
    this.width = width;
    this.height = height;
    this.pixelRatio = pixelRatio;
  }

  render(root: Group): void {
    this.traverse(root, (node) => {
      this.drawn.push(node.id);
    });
  }

  destroy(): void {}

  toDataURL(): string {
    return 'data:,';
  }

  getElement(): HTMLDivElement {
    return document.createElement('div');
  }

  exposeFill(
    fill: import('../src/types').FillStyle,
    setFill: (value: string) => void
  ): void {
    this.applyFillStyle({} as CanvasRenderingContext2D, fill, setFill);
  }

  exposeStroke(
    stroke: import('../src/types').StrokeStyle,
    setStroke: (value: string) => void
  ): void {
    this.applyStrokeStyle({} as CanvasRenderingContext2D, stroke, setStroke);
  }

  exposeShadow(ctx: CanvasRenderingContext2D, shadow: import('../src/types').Shadow | null): void {
    this.applyShadow(ctx, shadow);
  }
}

describe('Phase 11 renderer & geometry coverage', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('Renderer dirty region and render state', () => {
    const r = new TestRenderer();
    r.init(document.createElement('div'), {
      width: 200,
      height: 100,
      pixelRatio: 1,
      background: '#fff',
    });
    expect(r.needsFullRedraw).toBe(true);
    for (let i = 0; i < 12; i++) r.markDirty(i, i, 10, 10);
    expect(r.needsFullRedraw).toBe(true);
    r.clearDirty();
    expect(r.needsFullRedraw).toBe(false);
    r.forceFullRedraw();
    expect(r.needsFullRedraw).toBe(true);
    r.setRenderState({ focusedNodeId: 'n1', highContrast: true });
    r.setRenderState({});
  });

  it('Renderer style helpers and traverse', () => {
    const r = new TestRenderer();
    const fills: string[] = [];
    r.exposeFill('#abc', (v) => fills.push(String(v)));
    r.exposeFill(
      { type: 'linear', x0: 0, y0: 0, x1: 1, y1: 0, stops: [{ offset: 0, color: '#000' }] },
      (v) => fills.push(String(v))
    );
    r.exposeFill(null, () => undefined);
    expect(fills).toContain('#abc');

    const strokes: string[] = [];
    r.exposeStroke('#111', (v) => strokes.push(String(v)));
    r.exposeStroke(null, () => undefined);
    expect(strokes).toContain('#111');

    const ctx = document.createElement('canvas').getContext('2d')!;
    r.exposeShadow(ctx, { color: '#000', blur: 2, offsetX: 1, offsetY: 1 });
    expect(ctx.shadowBlur).toBe(2);
    r.exposeShadow(ctx, null);
    expect(ctx.shadowBlur).toBe(0);

    const root = new Group();
    const visible = new Rect({ width: 10, height: 10 });
    visible.visible = true;
    const hidden = new Rect({ width: 5, height: 5 });
    hidden.visible = false;
    root.add(visible, hidden);
    r.render(root);
    expect(r.drawn).toContain(visible.id);
    expect(r.drawn).not.toContain(hidden.id);
  });

  it('pathGeometry cubic, quadratic, and relative commands', () => {
    const cubic = 'M0 0 C10 0 20 10 30 10';
    const cubicRel = 'M0 0 c10 0 20 10 30 10';
    const quad = 'M0 0 Q15 0 30 15';
    const quadRel = 'm0 0 q15 0 30 15';
    const hv = 'M0 0 H50 V50 h-10 v-10 Z';

    for (const d of [cubic, cubicRel, quad, quadRel, hv]) {
      const segs = parsePathSegments(d);
      expect(segs.length).toBeGreaterThan(0);
      expect(getPathLength(d)).toBeGreaterThan(0);
      const pt = getPointAtLength(d, 1);
      expect(pt.x).toBeDefined();
    }
  });

  it('diagram helpers', () => {
    const props = { n: 42, s: 'ok', b: true, list: [1, 2] };
    expect(num(props, 'n', 0)).toBe(42);
    expect(num(props, 'missing', 7)).toBe(7);
    expect(str(props, 's')).toBe('ok');
    expect(bool(props, 'b')).toBe(true);
    expect(arr(props, 'list')).toEqual([1, 2]);
    expect(arr(props, 'missing', ['x'])).toEqual(['x']);

    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const box = createNodeBox(app, 'Node', 80, 40);
    const diagramGroup = app.group();
    diagramGroup.add(box);
    box.metadata.diagramId = 'n1';
    box.metadata.diagramType = 'flowchart';
    setDiagramState(box, { label: 'Node' });
    expect(getDiagramState(box).label).toBe('Node');
    const json = diagramToJSON(box);
    expect(json.type).toBe('flowchart');
    applyPositions(diagramGroup, new Map([['n1', { x: 50, y: 60 }]]));
    expect(box.x).toBe(50);

    const data = normalizeDiagramData({
      nodes: [{ id: 'a', label: 'A' }],
      edges: [{ from: 'a', to: 'b' }],
    });
    expect(data.nodes).toHaveLength(1);
    expect(data.edges).toHaveLength(1);

    const rand = seededRandom(123);
    expect(rand()).toBeGreaterThanOrEqual(0);
    expect(rand()).toBeLessThanOrEqual(1);
    app.destroy();
  });

  it('SVG image node and shape updates', () => {
    const container = createTestContainer(400, 300);
    const app = createTestApp(container, { renderer: 'svg' });
    const img = app.image({
      x: 10,
      y: 10,
      src: 'data:image/png;base64,mock',
      width: 32,
      height: 32,
    });
    const poly = app.polygon({
      x: 50,
      y: 10,
      points: [0, 0, 20, 0, 10, 20],
      fill: '#f00',
    });
    app.add(img, poly);
    app.render();
    expect(container.querySelector('image')).not.toBeNull();
    poly.points = [0, 0, 30, 0, 15, 25];
    poly.markDirty();
    app.render();
    app.destroy();
  });
});
