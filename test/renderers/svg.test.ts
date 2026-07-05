import { describe, it, expect, afterEach } from 'vitest';
import { createTestApp, createTestContainer, addSmokeScene } from '../helpers';
import { SVGRenderer } from '../../src/renderers/SVGRenderer';

describe('SVGRenderer', () => {
  let container: HTMLDivElement;

  afterEach(() => {
    container?.remove();
  });

  it('initializes and appends svg element', () => {
    container = createTestContainer();
    const app = createTestApp(container, { renderer: 'svg' });
    expect(container.querySelector('svg')).not.toBeNull();
    app.destroy();
  });

  it('renders rect, circle, and text without error', () => {
    container = createTestContainer();
    const app = createTestApp(container, { renderer: 'svg' });
    addSmokeScene(app);
    expect(() => app.render()).not.toThrow();

    const svg = container.querySelector('svg');
    expect(svg?.querySelector('rect')).not.toBeNull();
    expect(svg?.querySelector('circle')).not.toBeNull();
    expect(svg?.querySelector('text')).not.toBeNull();
    app.destroy();
  });

  it('exports toDataURL as svg data uri', () => {
    container = createTestContainer();
    const app = createTestApp(container, { renderer: 'svg' });
    addSmokeScene(app);
    app.render();
    const url = app.toDataURL('image/svg+xml');
    expect(url).toContain('data:image/svg+xml');
    app.destroy();
  });

  it('resize updates svg attributes', () => {
    container = createTestContainer();
    const app = createTestApp(container, { renderer: 'svg', width: 400, height: 300 });
    app.resize(800, 600);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('800');
    expect(svg?.getAttribute('height')).toBe('600');
    app.destroy();
  });

  it('SVGRenderer class smoke test', () => {
    container = createTestContainer();
    const renderer = new SVGRenderer();
    renderer.init(container, {
      width: 200,
      height: 200,
      pixelRatio: 1,
      background: '#eee',
    });
    expect(renderer.getElement().tagName.toLowerCase()).toBe('svg');
    renderer.destroy();
    expect(container.querySelector('svg')).toBeNull();
  });
});
