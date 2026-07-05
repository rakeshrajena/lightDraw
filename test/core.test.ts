import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { App } from '../src/App';
import { Matrix2D } from '../src/utils';
import { getEasing } from '../src/animation/Easing';
import { Layout } from '../src/layout';

describe('App', () => {
  let container: HTMLDivElement;
  let app: App;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);
    app = new App(container, { width: 800, height: 600, autoResize: false, renderer: 'html' });
  });

  afterEach(() => {
    app.destroy();
    container.remove();
  });

  it('creates an app with canvas renderer', () => {
    expect(app).toBeDefined();
    expect(app.getSize()).toEqual({ width: 800, height: 600 });
  });

  it('adds shapes to the stage', () => {
    const rect = app.rect({ width: 100, height: 50, fill: '#ff0000' });
    app.add(rect);
    expect(app.stage.children).toHaveLength(1);
  });

  it('creates nested groups', () => {
    const group = app.group();
    const circle = app.circle({ radius: 25, fill: '#00ff00' });
    group.add(circle);
    app.add(group);
    expect(group.children).toHaveLength(1);
  });

  it('hit tests shapes', () => {
    const rect = app.rect({ x: 100, y: 100, width: 50, height: 50, fill: '#000' });
    app.add(rect);
    app.render();
    const hit = app.hitTest(125, 125);
    expect(hit).not.toBeNull();
    expect(hit?.node).toBe(rect);
  });

  it('clear removes all stage children', () => {
    app.add(app.rect({ width: 10, height: 10 }));
    app.add(app.circle({ radius: 5 }));
    expect(app.stage.children.length).toBeGreaterThan(0);
    app.clear();
    expect(app.stage.children).toHaveLength(0);
  });

  it('exports and imports JSON', () => {
    const circle = app.circle({ x: 50, y: 50, radius: 30, fill: '#2563eb' });
    app.add(circle);
    const json = app.exportJSON();
    expect(json.type).toBe('group');
    expect(json.children?.length).toBeGreaterThan(0);

    app.loadJSON({
      type: 'dashboard',
      children: [
        { type: 'speedometer', props: { value: 82 } },
        { type: 'fuelGauge', props: { value: 64 } },
      ],
    });
    expect(app.stage.children.length).toBeGreaterThan(0);
  });
});

describe('Matrix2D', () => {
  it('translates points', () => {
    const m = new Matrix2D();
    m.translate(10, 20);
    const p = m.transformPoint(5, 5);
    expect(p.x).toBe(15);
    expect(p.y).toBe(25);
  });

  it('inverts matrix', () => {
    const m = new Matrix2D();
    m.translate(100, 50);
    const inv = m.invert();
    expect(inv).not.toBeNull();
    const p = inv!.transformPoint(100, 50);
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(0);
  });
});

describe('Easing', () => {
  it('returns linear easing', () => {
    const ease = getEasing('linear');
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
    expect(ease(0.5)).toBe(0.5);
  });

  it('returns bounce easing at endpoints', () => {
    const ease = getEasing('easeOutBounce');
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
  });
});

describe('Layout', () => {
  it('applies grid layout', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const app = new App(container, { width: 400, height: 300, autoResize: false, renderer: 'html' });
    const group = app.group();
    group.add(app.rect({ width: 50, height: 50 }));
    group.add(app.rect({ width: 50, height: 50 }));
    group.add(app.rect({ width: 50, height: 50 }));
    Layout.grid(group, { columns: 2, gap: 10 });
    expect(group.children[1].x).toBeGreaterThan(group.children[0].x);
    app.destroy();
    container.remove();
  });
});

describe('Shapes', () => {
  it('rect contains point', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const app = new App(container, { autoResize: false, renderer: 'html' });
    const rect = app.rect({ width: 100, height: 100 });
    expect(rect.containsPoint(50, 50)).toBe(true);
    expect(rect.containsPoint(150, 50)).toBe(false);
    app.destroy();
    container.remove();
  });

  it('circle contains point', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const app = new App(container, { autoResize: false, renderer: 'html' });
    const circle = app.circle({ radius: 50 });
    expect(circle.containsPoint(50, 50)).toBe(true);
    expect(circle.containsPoint(200, 200)).toBe(false);
    app.destroy();
    container.remove();
  });
});

describe('Animation', () => {
  it('animates node properties', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const app = new App(container, { autoResize: false, renderer: 'html' });
    const rect = app.rect({ x: 0, y: 0, width: 50, height: 50 });

    await new Promise<void>((resolve) => {
      rect.animate({
        x: 100,
        duration: 50,
        onComplete: resolve,
      });
    });

    expect(rect.x).toBe(100);
    app.destroy();
    container.remove();
  });
});

describe('Camera', () => {
  it('converts screen to world coordinates', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const app = new App(container, { width: 800, height: 600, autoResize: false, renderer: 'html' });
    app.camera.setZoom(2);
    const world = app.camera.screenToWorld(400, 300);
    expect(world).toBeDefined();
    app.destroy();
    container.remove();
  });
});
