import { describe, it, expect, afterEach } from 'vitest';
import { createTestApp, createTestContainer, addSmokeScene } from '../helpers';
import { HTMLRenderer } from '../../src/renderers/HTMLRenderer';

describe('HTMLRenderer', () => {
  let container: HTMLDivElement;

  afterEach(() => {
    container?.remove();
  });

  it('initializes and appends root element', () => {
    container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    expect(container.querySelector('.lightdraw-html-root')).not.toBeNull();
    app.destroy();
  });

  it('renders rect, circle, and text without error', () => {
    container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    addSmokeScene(app);
    expect(() => app.render()).not.toThrow();
    expect(container.querySelectorAll('.lightdraw-html-root [role="img"]').length).toBeGreaterThan(0);
    app.destroy();
  });

  it('sets aria-label on shape elements', () => {
    container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const rect = app.rect({ width: 50, height: 50, name: 'box' });
    app.add(rect);
    app.render();
    const el = container.querySelector(`#${rect.id}`);
    expect(el?.getAttribute('aria-label')).toBe('box');
    app.destroy();
  });

  it('resize updates root dimensions', () => {
    container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html', width: 400, height: 300 });
    app.resize(640, 480);
    expect(app.getSize()).toEqual({ width: 640, height: 480 });
    app.destroy();
  });

  it('destroy removes root from DOM', () => {
    container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    addSmokeScene(app);
    app.render();
    app.destroy();
    expect(container.querySelector('.lightdraw-html-root')).toBeNull();
  });

  it('HTMLRenderer class renders group standalone', () => {
    container = createTestContainer();
    const renderer = new HTMLRenderer();
    renderer.init(container, {
      width: 200,
      height: 200,
      pixelRatio: 1,
      background: '#fff',
    });
    expect(renderer.getElement()).toBeDefined();
    renderer.destroy();
  });
});
