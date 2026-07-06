import { describe, it, expect, afterEach } from 'vitest';
import { createTestApp, createTestContainer, addSmokeScene } from '../helpers';
import { createComponentFromJSON } from '../../src/components/registry';
import { CanvasRenderer } from '../../src/renderers/CanvasRenderer';
import { detectBestRenderer } from '../../src/utils';

/** All UI module component factories (canvas/SVG fallback path) */
const UI_CANVAS_COMPONENTS: [string, Record<string, unknown>][] = [
  ['button', { label: 'Save', width: 100 }],
  ['label', { text: 'Section' }],
  ['input', { label: 'Name', value: 'A', width: 160 }],
  ['textarea', { label: 'Notes', width: 160, height: 48 }],
  ['checkbox', { label: 'On', checked: true }],
  ['toggle', { label: 'Mode', value: true }],
  ['radio', { label: 'A', group: 'g', selected: true }],
  ['slider', { value: 50, width: 140 }],
  ['progressBar', { value: 60, width: 140, variant: 'success' }],
  ['card', { title: 'Card', width: 180, height: 80, elevated: true }],
  ['tabs', { tabs: ['A', 'B'], width: 180 }],
  ['accordion', { width: 180, sections: [{ title: 'S1', content: 'X' }] }],
  ['toolbar', { items: ['New', 'Save'], width: 180 }],
  ['statusBar', { segments: ['OK', 'UTF-8'], width: 180 }],
  ['menu', { items: ['Edit'], open: true, width: 120 }],
  ['dialog', { open: false, title: 'Modal', width: 200, height: 120 }],
  ['tooltip', { text: 'Tip', anchor: 'Hover', visible: false }],
  ['toast', { message: 'Done', variant: 'success' }],
  ['table', { columns: ['A', 'B'], rows: [['1', '2']], width: 180 }],
  ['tree', { width: 160, nodes: [{ label: 'Root', children: [{ label: 'Leaf' }] }] }],
];

describe('CanvasRenderer', () => {
  let container: HTMLDivElement;

  afterEach(() => {
    container?.remove();
  });

  it('detectBestRenderer returns canvas with mock installed', () => {
    expect(detectBestRenderer()).toBe('canvas');
  });

  it('initializes and appends canvas element', () => {
    container = createTestContainer();
    const app = createTestApp(container, { renderer: 'canvas' });
    expect(container.querySelector('canvas')).not.toBeNull();
    app.destroy();
  });

  it('renders rect, circle, and text without error', () => {
    container = createTestContainer();
    const app = createTestApp(container, { renderer: 'canvas' });
    addSmokeScene(app);
    expect(() => app.render()).not.toThrow();
    app.destroy();
  });

  it('toDataURL returns a string', () => {
    container = createTestContainer();
    const app = createTestApp(container, { renderer: 'canvas' });
    addSmokeScene(app);
    app.render();
    const url = app.toDataURL('image/png');
    expect(typeof url).toBe('string');
    expect(url.length).toBeGreaterThan(0);
    app.destroy();
  });

  it('resize updates canvas dimensions', () => {
    container = createTestContainer();
    const app = createTestApp(container, { renderer: 'canvas', width: 400, height: 300 });
    app.resize(640, 480);
    expect(app.getSize()).toEqual({ width: 640, height: 480 });
    const canvas = container.querySelector('canvas');
    expect(canvas?.style.width).toBe('640px');
    app.destroy();
  });

  it('CanvasRenderer class smoke test', () => {
    container = createTestContainer();
    const renderer = new CanvasRenderer();
    renderer.init(container, {
      width: 200,
      height: 200,
      pixelRatio: 1,
      background: '#000',
    });
    expect(renderer.getElement().tagName.toLowerCase()).toBe('canvas');
    renderer.destroy();
    expect(container.querySelector('canvas')).toBeNull();
  });

  it('draws nested groups', () => {
    container = createTestContainer();
    const app = createTestApp(container, { renderer: 'canvas' });
    const group = app.group({ x: 10, y: 10 });
    group.add(app.rect({ width: 30, height: 30, fill: '#f00' }));
    group.add(app.circle({ x: 50, y: 15, radius: 10, fill: '#0f0' }));
    app.add(group);
    expect(() => app.render()).not.toThrow();
    app.destroy();
  });

  it('renders all UI module components on canvas without error', () => {
    container = createTestContainer(400, 1400);
    const app = createTestApp(container, { renderer: 'canvas' });
    let y = 8;
    for (const [type, props] of UI_CANVAS_COMPONENTS) {
      const node = createComponentFromJSON(type, { ...props, x: 8, y }, app);
      expect(node, `createComponentFromJSON(${type})`).not.toBeNull();
      app.add(node!);
      y += 56;
    }
    expect(() => app.render()).not.toThrow();
    expect(container.querySelector('canvas')).not.toBeNull();
    app.destroy();
  });

  it('renders UI components in high-contrast canvas mode', () => {
    container = createTestContainer();
    const app = createTestApp(container, { renderer: 'canvas' });
    app.add(createComponentFromJSON('button', { label: 'HC', x: 10, y: 10 }, app)!);
    app.setHighContrast(true);
    expect(() => app.render()).not.toThrow();
    expect(app.isHighContrast()).toBe(true);
    app.destroy();
  });
});
