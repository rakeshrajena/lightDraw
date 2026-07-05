import { describe, it, expect, afterEach } from 'vitest';
import { createTestApp, createTestContainer, addSmokeScene } from '../helpers';
import { CanvasRenderer } from '../../src/renderers/CanvasRenderer';
import { detectBestRenderer } from '../../src/utils';

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
});
