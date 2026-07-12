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
    app.loadJSON({ type: 'button', props: { label: 'Submit', x: 10, y: 10, width: 120 } });
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

  it('applies dark preset via uiTheme tokens', () => {
    container = createTestContainer();
    const app = createTestApp(container, {
      renderer: 'html',
      uiTheme: { preset: 'dark', primary: '#8b5cf6' },
    });
    app.render();
    const root = container.querySelector('.lightdraw-html-root') as HTMLElement;
    expect(root.hasAttribute('data-ld-theme')).toBe(false);
    expect(root.style.getPropertyValue('--ld-primary')).toBe('#8b5cf6');
    expect(root.style.getPropertyValue('--ld-surface')).toBe('#1e293b');
    app.destroy();
  });

  it('applies preset via uiTheme input', () => {
    container = createTestContainer();
    const app = createTestApp(container, {
      renderer: 'html',
      uiTheme: { preset: 'violet' },
    });
    app.render();
    const root = container.querySelector('.lightdraw-html-root') as HTMLElement;
    expect(root.style.getPropertyValue('--ld-primary')).toBe('#7c3aed');
    app.destroy();
  });

  it('persists theme across render and resize', () => {
    container = createTestContainer();
    const app = createTestApp(container, {
      renderer: 'html',
      width: 400,
      height: 300,
      uiTheme: { preset: 'emerald' },
    });
    app.render();
    const root = () => container.querySelector('.lightdraw-html-root') as HTMLElement;
    expect(root().style.getPropertyValue('--ld-primary')).toBe('#059669');
    app.render();
    expect(root().style.getPropertyValue('--ld-primary')).toBe('#059669');
    app.resize(640, 480);
    expect(root().style.getPropertyValue('--ld-primary')).toBe('#059669');
    app.setUiTheme({ preset: 'rose' });
    expect(root().style.getPropertyValue('--ld-primary')).toBe('#e11d48');
    app.destroy();
  });

  it('form controls apply size and state modifier classes', () => {
    container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    app.loadJSON({
      type: 'group',
      children: [
        { type: 'checkbox', props: { label: 'Opt in', checked: true, disabled: true, size: 'sm', x: 10, y: 10 } },
        { type: 'toggle', props: { label: 'Alerts', value: false, size: 'sm', x: 10, y: 40 } },
        { type: 'slider', props: { value: 30, width: 180, disabled: true, x: 10, y: 80 } },
        { type: 'progressBar', props: { value: 55, label: 'Done', size: 'lg', variant: 'success', x: 10, y: 140, width: 200 } },
      ],
    });
    app.render();
    expect(container.querySelector('.lightdraw-checkbox--sm.lightdraw-checkbox--disabled')).not.toBeNull();
    expect(container.querySelector('.lightdraw-switch-wrap--sm')).not.toBeNull();
    expect(container.querySelector('.lightdraw-field--slider.lightdraw-field--disabled')).not.toBeNull();
    expect(container.querySelector('.lightdraw-progress-wrap--lg')).not.toBeNull();
    expect(container.querySelector('.lightdraw-progress--success')).not.toBeNull();
    app.destroy();
  });

  it('setHighContrast applies data-ld-high-contrast on HTML root', () => {
    container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    app.loadJSON({ type: 'button', props: { label: 'A11y', x: 10, y: 10 } });
    app.render();
    const root = container.querySelector('.lightdraw-html-root') as HTMLElement;
    expect(root?.hasAttribute('data-ld-high-contrast')).toBe(false);
    app.setHighContrast(true);
    app.render();
    expect(root?.getAttribute('data-ld-high-contrast')).toBe('true');
    expect(root?.classList.contains('lightdraw-high-contrast')).toBe(true);
    app.destroy();
  });

  it('setUiTheme preset applies CSS variables on root', () => {
    container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html', uiTheme: { preset: 'violet' } });
    app.render();
    const root = container.querySelector('.lightdraw-html-root') as HTMLElement;
    expect(root?.style.getPropertyValue('--ld-primary').length).toBeGreaterThan(0);
    app.setUiTheme({ preset: 'emerald' });
    app.render();
    const emerald = root.style.getPropertyValue('--ld-primary');
    expect(emerald.length).toBeGreaterThan(0);
    app.destroy();
  });
});
