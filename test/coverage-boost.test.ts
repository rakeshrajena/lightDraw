import { describe, it, expect, afterEach, vi } from 'vitest';
import { createTestApp, createTestContainer } from './helpers';
import { Layout } from '../src/layout';
import { exportScene, exportApp } from '../src/io/export';
import { fillStyleRef, shadowToCss } from '../src/renderers/styles';
import { beginShapeClip, pointInMask } from '../src/renderers/clipUtils';
import { getWorldBounds, countNodes, isSubtreeDirty } from '../src/performance/bounds';
import { paintStyleKey } from '../src/performance/styleKey';
import type { Gradient } from '../src/types';
import { createDashboardFromJSON } from '../src/dashboard/registry';
import { createComponentFromJSON } from '../src/components/registry';
import { createFlowchart, createOrgChart, layoutDiagram, routeConnector, layoutNodesForce, pipelineLayout, registerDiagram, createDiagramFromJSON } from '../src/diagram/registry';
import { createPluginContext, installPlugin, getInstalledPlugins, clearInstalledPlugins } from '../src/plugins/index';
import { gradientToCss, createSvgGradient, isPattern, createSvgShadowFilter, setCanvasFill } from '../src/renderers/styles';
import { createAutomotiveFromJSON } from '../src/automotive/registry';

describe('Coverage — export & layout', () => {
  let container: HTMLDivElement;

  afterEach(() => {
    container?.remove();
  });

  it('exportScene supports json, svg, png, jpeg, html, pdf', () => {
    container = createTestContainer();
    const canvasApp = createTestApp(container, { renderer: 'canvas' });
    canvasApp.add(canvasApp.rect({ width: 40, height: 40, fill: '#f00' }));
    expect(exportScene(canvasApp, 'json')).toHaveProperty('type');
    expect(String(exportScene(canvasApp, 'png'))).toContain('data:image/png');
    expect(String(exportScene(canvasApp, 'jpeg'))).toContain('data:image');
    expect(String(exportScene(canvasApp, 'html'))).toContain('LightDraw Export');
    expect(String(exportScene(canvasApp, 'pdf'))).toContain('data:application/pdf');
    canvasApp.destroy();

    const svgApp = createTestApp(container, { renderer: 'svg' });
    svgApp.add(svgApp.rect({ width: 40, height: 40, fill: '#f00' }));
    svgApp.render();
    expect(String(exportScene(svgApp, 'svg'))).toContain('<svg');
    const svgRegion = exportApp(svgApp, {
      format: 'svg',
      region: svgApp.stage.children[0],
    });
    expect(String(svgRegion.data)).toContain('<svg');
    svgApp.destroy();
  });

  it('Layout grid, circular, tree, align, distribute', () => {
    container = createTestContainer();
    const app = createTestApp(container);
    const group = app.group();
    for (let i = 0; i < 6; i++) {
      group.add(app.rect({ width: 20, height: 20, fill: '#333' }));
    }

    Layout.grid(group, { columns: 3, gap: 5 });
    expect(group.children[1].x).toBeGreaterThan(group.children[0].x);

    Layout.circular(group, 100, 100, 60);
    expect(group.children[0].x).not.toBe(0);

    const tree = app.group();
    const parent = app.group();
    parent.add(app.rect({ width: 30, height: 20 }));
    tree.add(parent);
    Layout.tree(tree);
    expect(parent.y).toBeGreaterThanOrEqual(0);

    Layout.align(group, 'center');
    Layout.distribute(group, 'x');

    app.destroy();
  });
});

describe('Coverage — styles & clip', () => {
  it('fillStyleRef and shadowToCss', () => {
    const gradient: Gradient = {
      type: 'linear',
      x0: 0,
      y0: 0,
      x1: 100,
      y1: 0,
      stops: [{ offset: 0, color: '#000' }, { offset: 1, color: '#fff' }],
    };
    expect(fillStyleRef('#f00', 'g', 'n1')).toBe('#f00');
    expect(fillStyleRef(gradient, 'g', 'n1')).toContain('url(#g-n1)');
    expect(shadowToCss({ color: '#000', blur: 4, offsetX: 2, offsetY: 2 })).toContain('2px');
  });

  it('beginShapeClip covers shape types except path', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'canvas' });

    const shapes = [
      app.rect({ width: 40, height: 40, cornerRadius: 4 }),
      app.circle({ radius: 20 }),
      app.ellipse({ radiusX: 30, radiusY: 20 }),
      app.polygon({ points: [0, 0, 40, 0, 20, 40] }),
      app.star({ numPoints: 5, innerRadius: 10, outerRadius: 25 }),
      app.arc({ radius: 20, startAngle: 0, endAngle: Math.PI }),
      app.line({ x2: 50, y2: 0 }),
    ];

    for (const shape of shapes) {
      ctx.save();
      expect(() => beginShapeClip(ctx, shape)).not.toThrow();
      ctx.restore();
    }

    const mask = app.circle({ x: 10, y: 10, radius: 15 });
    expect(pointInMask(mask, 15, 15)).toBe(true);
    expect(pointInMask(null, 0, 0)).toBe(true);

    app.destroy();
    container.remove();
  });
});

describe('Coverage — performance utilities', () => {
  it('bounds helpers and paintStyleKey', () => {
    const container = createTestContainer();
    const app = createTestApp(container);
    const rect = app.rect({ x: 10, y: 20, width: 50, height: 30, fill: '#abc' });
    app.add(rect);

    const wb = getWorldBounds(rect);
    expect(wb.width).toBeGreaterThan(0);
    expect(countNodes(app.stage)).toBe(1);
    expect(isSubtreeDirty(rect)).toBe(true);
    rect.clearDirty();
    expect(isSubtreeDirty(rect)).toBe(false);
    expect(paintStyleKey(rect)).toContain('#abc');

    app.destroy();
    container.remove();
  });
});

describe('Coverage — SVG shapes sync', () => {
  it('renders polygon, star, ellipse, line', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'svg' });
    app.add(
      app.polygon({ points: [0, 0, 50, 0, 25, 40], fill: '#f00' }),
      app.star({ numPoints: 5, innerRadius: 10, outerRadius: 25, fill: '#ff0' }),
      app.ellipse({ radiusX: 30, radiusY: 20, fill: '#0f0' }),
      app.line({ x2: 80, y2: 40, stroke: '#000', strokeWidth: 1 })
    );
    app.render();
    expect(container.querySelector('polygon')).not.toBeNull();
    expect(container.querySelector('ellipse')).not.toBeNull();
    expect(container.querySelector('line')).not.toBeNull();
    app.destroy();
    container.remove();
  });
});

describe('Coverage — canvas shapes render', () => {
  it('renders arc, polyline, polygon, sprite paths on canvas', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'canvas' });
    const group = app.group({ clip: true });
    group.add(app.circle({ radius: 30, fill: '#00f' }));
    app.add(
      app.arc({ radius: 25, startAngle: 0, endAngle: Math.PI, fill: '#f90' }),
      app.polyline({ points: [0, 0, 40, 40, 80, 0], stroke: '#333', strokeWidth: 2 }),
      app.polygon({ points: [0, 0, 30, 0, 15, 25], fill: '#639' }),
      app.star({ innerRadius: 10, outerRadius: 20, numPoints: 5, fill: '#fc0' }),
      app.ellipse({ radiusX: 30, radiusY: 15, fill: '#0cf' }),
      app.roundedRect({ width: 40, height: 30, cornerRadius: 6, fill: '#9f9' }),
      group,
      app.rect({
        width: 60,
        height: 60,
        fill: '#f00',
        shadow: { color: 'rgba(0,0,0,0.3)', blur: 8, offsetX: 2, offsetY: 2 },
      })
    );
    expect(() => app.render()).not.toThrow();
    app.destroy();
    container.remove();
  });
});

describe('Coverage — Phase 4 events & a11y', () => {
  it('high-contrast canvas render and focus API', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'canvas', highContrast: true });
    const r = app.rect({
      x: 20,
      y: 20,
      width: 40,
      height: 40,
      fill: '#2563eb',
      focusable: true,
      listening: true,
    });
    app.add(r);
    app.focusNode(r);
    app.render();
    app.setHighContrast(false);
    app.render();
    app.destroy();
    container.remove();
  });

  it('dashboard speedometer and component card render on HTML', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    app.add(
      createDashboardFromJSON('speedometer', { value: 90, size: 120 }, app)!,
      createComponentFromJSON('card', { title: 'Stats', width: 200, height: 100 }, app)!,
      createComponentFromJSON('label', { text: 'Hello' }, app)!
    );
    app.render();
    app.destroy();
    container.remove();
  });
});

describe('Coverage — Phase 6 UI components', () => {
  it('toast auto-dismiss and progressBar JSON round-trip', () => {
    vi.useFakeTimers();
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const toast = createComponentFromJSON('toast', { message: 'Hi', duration: 500, x: 0, y: 0 }, app)!;
    app.add(toast);
    vi.advanceTimersByTime(600);
    expect(toast.visible).toBe(false);
    vi.useRealTimers();

    const bar = createComponentFromJSON('progressBar', { value: 33, x: 0, y: 40 }, app)!;
    app.add(bar);
    app.render();
    expect(bar.ariaValueNow).toBe(33);
    app.destroy();
    container.remove();
  });

  it('flex layout and component card/label', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const group = app.group();
    group.add(app.rect({ width: 10, height: 10 }));
    group.add(app.rect({ width: 10, height: 10 }));
    Layout.flex(group, { direction: 'row', gap: 4, wrap: true });
    app.add(
      createComponentFromJSON('card', { title: 'T', width: 100, height: 80, x: 0, y: 0 }, app)!,
      createComponentFromJSON('label', { text: 'Label', x: 0, y: 90 }, app)!
    );
    app.render();
    app.destroy();
    container.remove();
  });

  it('input native change event', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const input = createComponentFromJSON('input', { value: '', x: 10, y: 10 }, app)!;
    app.add(input);
    app.render();
    const el = document.getElementById(input.id) as HTMLInputElement;
    el.value = 'typed';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    app.destroy();
    container.remove();
  });

  it('diagram flowchart, org chart, and automotive widgets', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'canvas' });
    const fc = createFlowchart(app, {
      nodes: [
        { id: 'a', label: 'Start', type: 'start', x: 0, y: 0 },
        { id: 'b', label: 'Pick', type: 'decision', x: 0, y: 60 },
        { id: 'c', label: 'End', type: 'end', x: 0, y: 120 },
      ],
      edges: [
        { from: 'a', to: 'b', label: 'yes' },
        { from: 'b', to: 'c' },
      ],
    });
    layoutDiagram(fc);
    const org = createOrgChart(app, {
      name: 'CEO',
      children: [{ name: 'Engineering', children: [{ name: 'Dev' }] }],
    });
    const route = routeConnector(app, 10, 10, 100, 80, 'orthogonal');
    app.add(fc, org, route);
    app.add(
      createAutomotiveFromJSON('tachometer', { value: 4000, x: 200, y: 0 }, app)!,
      createAutomotiveFromJSON('fuelGauge', { value: 70, x: 300, y: 0 }, app)!,
      createAutomotiveFromJSON('warningLamp', { active: true, x: 400, y: 0 }, app)!
    );
    app.render();
    app.destroy();
    container.remove();
  });
});

describe('Coverage — stack and flow layout', () => {
  it('stack and flow layout position children', () => {
    const container = createTestContainer();
    const app = createTestApp(container);
    const group = app.group();
    group.add(app.rect({ width: 20, height: 10 }));
    group.add(app.rect({ width: 20, height: 10 }));
    Layout.stack(group, { direction: 'column', gap: 4 });
    expect(group.children[1].y).toBeGreaterThan(group.children[0].y);
    Layout.flow(group, { columns: 2, gap: 8 });
    Layout.align(group, 'center');
    Layout.distribute(group, 'x');
    const wide = app.group();
    for (let i = 0; i < 4; i++) wide.add(app.rect({ width: 30, height: 10 }));
    Layout.flex(wide, { direction: 'row', wrap: true, justify: 'space-between', width: 100 });
    app.destroy();
    container.remove();
  });
});

describe('Coverage — diagram module extras', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('layoutNodesForce and pipelineLayout position nodes', () => {
    const container = createTestContainer();
    const app = createTestApp(container);
    const nodes = [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
      { id: 'c', label: 'C' },
    ];
    const edges = [
      { from: 'a', to: 'b' },
      { from: 'b', to: 'c' },
    ];
    const positions = layoutNodesForce(nodes, edges, { seed: 1, iterations: 20 });
    expect(positions.size).toBe(3);

    const group = app.group();
    group.add(app.rect({ width: 40, height: 30 }));
    group.add(app.rect({ width: 40, height: 30 }));
    pipelineLayout(group, 20, 5);
    expect(group.children[1].x).toBeGreaterThan(group.children[0].x);
    app.destroy();
  });

  it('registerDiagram custom factory', () => {
    const container = createTestContainer();
    const app = createTestApp(container);
    registerDiagram('customFlow', (props, a) =>
      createFlowchart(a, props.data as { nodes: { id: string; label: string }[]; edges: [] })
    );
    const node = createDiagramFromJSON(
      'customFlow',
      { data: { nodes: [{ id: 'x', label: 'X' }], edges: [] } },
      app
    );
    expect(node).toBeTruthy();
    app.destroy();
  });

  it('orthogonal and straight routeConnector styles', () => {
    const container = createTestContainer();
    const app = createTestApp(container);
    const orth = routeConnector(app, 0, 0, 100, 50, 'orthogonal');
    const straight = routeConnector(app, 0, 0, 100, 50, 'straight');
    app.add(orth, straight);
    app.render();
    app.destroy();
  });
});

describe('Coverage — animation timeline', () => {
  it('Timeline move, rotate, scale, fade, wait, call, play', async () => {
    const container = createTestContainer();
    const app = createTestApp(container);
    const rect = app.rect({ width: 20, height: 20, fill: '#00f' });
    app.add(rect);
    const { Timeline } = await import('../src/animation/Timeline');
    const tl = new Timeline();
    tl.move(rect, { x: 10, duration: 1 })
      .rotate(rect, 15, 1)
      .scale(rect, 1.2, 1)
      .fade(rect, 0.5, 1)
      .wait(1)
      .call(() => undefined)
      .stagger([rect], { opacity: 1, duration: 1 }, 10);
    tl.play();
    await new Promise((r) => setTimeout(r, 5));
    tl.pause();
    tl.play();
    tl.stop();
    app.destroy();
  });
});

describe('Coverage — camera and events', () => {
  it('camera pan, zoom, follow, coordinate conversion', () => {
    const container = createTestContainer();
    const app = createTestApp(container);
    const rect = app.rect({ x: 50, y: 50, width: 20, height: 20, fill: '#f00' });
    app.add(rect);
    app.camera.pan(10, 5).setZoom(1.5).setRotation(30).setPosition(20, 15);
    app.camera.follow(rect);
    app.camera.update();
    const world = app.camera.screenToWorld(200, 150);
    const screen = app.camera.worldToScreen(world.x, world.y);
    expect(screen.x).toBeDefined();
    app.camera.follow(null);
    app.destroy();
  });

  it('EventEmitter on, once, off, emit', async () => {
    const { EventEmitter } = await import('../src/core/EventEmitter');
    const ee = new EventEmitter();
    let count = 0;
    const handler = () => {
      count++;
    };
    ee.on('test', handler);
    ee.emit('test');
    ee.once('once', () => {
      count++;
    });
    ee.emit('once');
    ee.emit('once');
    ee.off('test', handler);
    ee.emit('test');
    expect(count).toBe(2);
  });

  it('parallel animations resolve', async () => {
    const { parallel } = await import('../src/animation/Timeline');
    const container = createTestContainer();
    const app = createTestApp(container);
    const a = app.rect({ width: 10, height: 10, fill: '#00f' });
    app.add(a);
    await parallel([
      { target: a, options: { opacity: 0.5, duration: 1 } },
      { target: a, options: { x: 5, duration: 1 } },
    ]);
    app.destroy();
  });
});

describe('Coverage — easings', () => {
  it('all built-in easing functions and registry', async () => {
    const { easings, getEasing, registerEasing } = await import('../src/animation/Easing');
    for (const fn of Object.values(easings)) {
      expect(fn(0)).toBeDefined();
      expect(fn(0.5)).toBeDefined();
      expect(fn(1)).toBeDefined();
    }
    expect(getEasing('linear')(0.5)).toBe(0.5);
    expect(getEasing('missing')).toBe(easings.linear);
    registerEasing('customEase', (t) => t * 2);
    expect(getEasing('customEase')(0.25)).toBe(0.5);
  });
});

describe('Coverage — plugins and styles', () => {
  it('createPluginContext exposes registries', () => {
    const ctx = createPluginContext();
    expect(typeof ctx.registerJSONType).toBe('function');
    expect(typeof ctx.registerJSONResolver).toBe('function');
    expect(typeof ctx.registerEasing).toBe('function');
  });

  it('installPlugin tracks installed plugins', () => {
    clearInstalledPlugins();
    installPlugin({ name: 'test-plugin', version: '1', install: () => {} }, {} as never);
    expect(getInstalledPlugins()).toContain('test-plugin');
    installPlugin({ name: 'test-plugin', version: '1', install: () => {} }, {} as never);
    expect(getInstalledPlugins()).toHaveLength(1);
    clearInstalledPlugins();
  });

  it('gradient and pattern style helpers', async () => {
    const g: Gradient = {
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
    expect(gradientToCss(g)).toContain('linear-gradient');
    const radial: Gradient = { ...g, type: 'radial', r1: 50 };
    expect(gradientToCss(radial)).toContain('radial-gradient');
    const svgG = createSvgGradient(document, 'g1', g);
    expect(svgG.getAttribute('id')).toBe('g1');
    const pat = { type: 'pattern' as const, source: document.createElement('canvas'), repeat: 'repeat' as const };
    expect(isPattern(pat)).toBe(true);
    expect(fillStyleRef(pat, 'p', '1')).toContain('url');
    const shadow = createSvgShadowFilter(document, 'sh1', {
      offsetX: 2,
      offsetY: 2,
      blur: 4,
      color: '#000',
    });
    expect(shadow.getAttribute('id')).toBe('sh1');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    setCanvasFill(ctx, g);
    setCanvasFill(ctx, '#ff0000');
    const { setCanvasStroke } = await import('../src/renderers/styles');
    setCanvasStroke(ctx, radial);
  });
});
