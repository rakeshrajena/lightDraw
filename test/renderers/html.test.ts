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

  it('renders line and polyline connectors via SVG', () => {
    container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html', width: 400, height: 300 });
    app.add(
      app.line({ x: 10, y: 10, x2: 100, y2: 80, stroke: '#2563eb', strokeWidth: 2 }),
      app.polyline({
        points: [20, 120, 60, 160, 140, 140, 200, 200],
        fill: null,
        stroke: '#64748b',
        strokeWidth: 2,
      })
    );
    app.render();
    expect(container.querySelectorAll('.lightdraw-html-root svg line').length).toBe(1);
    expect(container.querySelectorAll('.lightdraw-html-root svg polyline').length).toBe(1);
    app.destroy();
  });

  it('renders native button element for button component', () => {
    container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const btn = app.loadJSON({ type: 'button', props: { label: 'Submit', x: 10, y: 10, width: 120 } });
    app.render();
    const el = container.querySelector('.lightdraw-btn');
    expect(el).not.toBeNull();
    expect(el?.textContent).toBe('Submit');
    expect(container.querySelector('.lightdraw-btn--primary')).not.toBeNull();
    app.destroy();
  });

  it('renders native checkbox and progress elements', () => {
    container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    app.loadJSON({
      type: 'group',
      children: [
        { type: 'checkbox', props: { label: 'Agree', checked: true, x: 10, y: 10 } },
        { type: 'progressBar', props: { value: 50, x: 10, y: 50, width: 200 } },
      ],
    });
    app.render();
    expect(container.querySelector('.lightdraw-checkbox-input')).not.toBeNull();
    expect(container.querySelector('.lightdraw-progress-bar')).not.toBeNull();
    app.destroy();
  });

  it('renders native composite UI elements', () => {
    container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    app.loadJSON({
      type: 'group',
      children: [
        { type: 'tabs', props: { tabs: ['A', 'B'], x: 10, y: 10, width: 200 } },
        { type: 'table', props: { rows: [['X', '1']], x: 10, y: 60 } },
        { type: 'toast', props: { message: 'Done', x: 10, y: 120 } },
      ],
    });
    app.render();
    expect(container.querySelector('.lightdraw-tabs')).not.toBeNull();
    expect(container.querySelector('.lightdraw-table')).not.toBeNull();
    expect(container.querySelector('.lightdraw-toast')).not.toBeNull();
    app.destroy();
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

  it('applies uiTheme tokens to HTML root on init', () => {
    container = createTestContainer();
    const app = createTestApp(container, {
      renderer: 'html',
      uiTheme: { primary: '#7c3aed', radius: '10px' },
    });
    app.render();
    const root = container.querySelector('.lightdraw-html-root') as HTMLElement;
    expect(root.style.getPropertyValue('--ld-primary')).toBe('#7c3aed');
    expect(root.style.getPropertyValue('--ld-radius')).toBe('10px');
    app.setUiTheme({ primary: '#059669' });
    expect(root.style.getPropertyValue('--ld-primary')).toBe('#059669');
    app.destroy();
  });

  it('applies dark theme mode via uiTheme', () => {
    container = createTestContainer();
    const app = createTestApp(container, {
      renderer: 'html',
      uiTheme: { mode: 'dark', primary: '#8b5cf6' },
    });
    app.render();
    const root = container.querySelector('.lightdraw-html-root') as HTMLElement;
    expect(root.getAttribute('data-ld-theme')).toBe('dark');
    expect(root.style.getPropertyValue('--ld-primary')).toBe('#8b5cf6');
    app.destroy();
  });
});
