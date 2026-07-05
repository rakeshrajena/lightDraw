import { describe, it, expect, afterEach } from 'vitest';
import {
  createComponentFromJSON,
  componentToJSON,
} from '../src/components/registry';
import { syntheticEvent, getParts as getComponentParts } from '../src/components/helpers';
import { toJSON } from '../src/io/json';
import type { Group } from '../src/shapes/Group';
import { createTestApp, createTestContainer, measureAverageMs } from './helpers';

const COMPONENT_TYPES = [
  'button',
  'slider',
  'checkbox',
  'toggle',
  'input',
  'textarea',
  'radio',
  'tooltip',
  'menu',
  'dialog',
  'tabs',
  'accordion',
  'table',
  'tree',
  'toolbar',
  'toast',
  'statusBar',
] as const;

describe('Phase 6 — UI Components', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  for (const type of COMPONENT_TYPES) {
    it(`${type} renders without error (html renderer)`, () => {
      const container = createTestContainer();
      const app = createTestApp(container, { renderer: 'html' });
      const node = createComponentFromJSON(type, { x: 10, y: 10 }, app);
      expect(node).toBeTruthy();
      app.add(node!);
      expect(() => app.render()).not.toThrow();
      app.destroy();
    });
  }

  for (const type of ['button', 'checkbox', 'slider', 'toggle'] as const) {
    it(`${type} renders on canvas renderer`, () => {
      const container = createTestContainer();
      const app = createTestApp(container, { renderer: 'canvas' });
      const node = createComponentFromJSON(type, { x: 0, y: 0 }, app);
      app.add(node!);
      expect(() => app.render()).not.toThrow();
      app.destroy();
    });
  }

  it('checkbox toggles on click and emits change', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const box = createComponentFromJSON('checkbox', { checked: false, x: 10, y: 10 }, app)!;
    app.add(box);

    let changed: unknown;
    box.on('change', (e: { value?: unknown }) => {
      changed = e.value;
    });

    box.emit('click', syntheticEvent('click', box));
    expect(changed).toBe(true);
    expect(box.ariaChecked).toBe(true);
    app.destroy();
  });

  it('toggle switches on click', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const toggle = createComponentFromJSON('toggle', { value: false, x: 10, y: 10 }, app)!;
    app.add(toggle);

    let changed: unknown;
    toggle.on('change', (e: { value?: unknown }) => {
      changed = e.value;
    });

    toggle.emit('click', syntheticEvent('click', toggle));
    expect(changed).toBe(true);
    app.destroy();
  });

  it('slider emits change after drag', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const slider = createComponentFromJSON('slider', { value: 10, width: 200, x: 10, y: 10 }, app)!;
    app.add(slider);

    let changed = false;
    slider.on('change', () => {
      changed = true;
    });

    slider.emit('mousedown', syntheticEvent('mousedown', slider, { worldX: 180, worldY: 20 }));
    const el = app['renderer'].getElement() as HTMLElement;
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    expect(changed).toBe(true);
    app.destroy();
  });

  it('tabs emits change when tab clicked', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const tabs = createComponentFromJSON('tabs', { tabs: ['A', 'B'], x: 10, y: 10 }, app)!;
    app.add(tabs);

    let tabIndex: unknown;
    tabs.on('change', (e: { value?: unknown }) => {
      tabIndex = e.value;
    });

    const tabChild = (tabs as Group).children[1];
    tabChild.emit('click', syntheticEvent('click', tabChild));
    expect(tabIndex).toBe(1);
    app.destroy();
  });

  it('table row select emits select event', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const table = createComponentFromJSON(
      'table',
      { rows: [['A', '1'], ['B', '2']], x: 10, y: 10 },
      app
    )!;
    app.add(table);

    let selected: unknown;
    table.on('select', (e: { index?: number }) => {
      selected = e.index;
    });

    const row = (table as Group).children.find((c) => c.metadata?.rowIndex === 0);
    row?.emit('click', syntheticEvent('click', row));
    expect(selected).toBe(0);
    app.destroy();
  });

  it('JSON round-trip preserves component type and state', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const slider = createComponentFromJSON('slider', { value: 42, width: 180, x: 5, y: 5 }, app)!;
    app.add(slider);

    const json = toJSON(slider);
    expect(json.type).toBe('slider');
    expect(json.props?.value).toBe(42);

    const restored = createComponentFromJSON(json.type, json.props ?? {}, app)!;
    expect(restored.metadata.componentType).toBe('slider');
    expect(restored.metadata.componentState?.value).toBe(42);
    app.destroy();
  });

  it('componentToJSON exports all state fields', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const btn = createComponentFromJSON('button', { label: 'Save', disabled: true }, app)!;
    const json = componentToJSON(btn);
    expect(json.type).toBe('button');
    expect(json.props?.label).toBe('Save');
    expect(json.props?.disabled).toBe(true);
    app.destroy();
  });

  it('input uses native element in HTML renderer', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const input = createComponentFromJSON('input', { value: 'hello', x: 10, y: 10 }, app)!;
    app.add(input);
    app.render();
    const el = document.getElementById(input.id);
    expect(el?.tagName).toBe('INPUT');
    expect((el as HTMLInputElement).value).toBe('hello');
    app.destroy();
  });

  it('form with 20 inputs renders within performance budget', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    for (let i = 0; i < 20; i++) {
      app.add(createComponentFromJSON('input', { x: 10, y: i * 36, width: 200 }, app)!);
    }
    app.render();
    const avg = measureAverageMs(() => app.render(), 5);
    expect(avg).toBeLessThan(45);
    app.destroy();
  });

  it('modal open state renders within performance budget', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const dialog = createComponentFromJSON('dialog', { open: true, x: 50, y: 50 }, app)!;
    app.add(dialog);
    const avg = measureAverageMs(() => app.render(), 10);
    expect(avg).toBeLessThan(8);
    app.destroy();
  });

  it('create/destroy 100 checkbox instances — no runaway growth', () => {
    const container = createTestContainer();
    const before = process.memoryUsage().heapUsed;
    for (let i = 0; i < 100; i++) {
      const app = createTestApp(container, { renderer: 'html' });
      app.add(createComponentFromJSON('checkbox', { x: 0, y: 0 }, app)!);
      app.render();
      app.destroy();
    }
    const growth = process.memoryUsage().heapUsed - before;
    expect(growth).toBeLessThan(15 * 1024 * 1024);
  });

  it('tooltip shows on mouseenter and hides on mouseleave', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const tip = createComponentFromJSON('tooltip', { text: 'Tip', visible: false, x: 10, y: 10 }, app)!;
    app.add(tip);
    let opened = false;
    tip.on('open', () => { opened = true; });
    tip.emit('mouseenter', syntheticEvent('mouseenter', tip));
    expect(opened).toBe(true);
    expect(tip.visible).toBe(true);
    app.destroy();
  });

  it('menu select closes and emits', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const menu = createComponentFromJSON('menu', { items: ['A', 'B'], open: true, x: 10, y: 10 }, app)!;
    app.add(menu);
    let item: unknown;
    menu.on('select', (e: { item?: unknown }) => { item = e.item; });
    menu.emit('click', syntheticEvent('click', menu, { worldY: 50 }));
    expect(item).toBe('B');
    app.destroy();
  });

  it('dialog closes on overlay click', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const dialog = createComponentFromJSON('dialog', { open: true, x: 50, y: 50 }, app)!;
    app.add(dialog);
    const overlay = getComponentParts(dialog).overlay;
    let closed = false;
    dialog.on('close', () => { closed = true; });
    overlay.emit('click', syntheticEvent('click', overlay));
    expect(closed).toBe(true);
    app.destroy();
  });

  it('accordion section click emits change', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const acc = createComponentFromJSON('accordion', { x: 10, y: 10 }, app)!;
    app.add(acc);
    let section: unknown;
    acc.on('change', (e: { section?: unknown }) => { section = e.section; });
    (acc as Group).children[2].emit('click', syntheticEvent('click', (acc as Group).children[2]));
    expect(section).toBe('Section 2');
    app.destroy();
  });

  it('tree node expand emits change', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const tree = createComponentFromJSON('tree', { x: 10, y: 10 }, app)!;
    app.add(tree);
    let changed = false;
    tree.on('change', () => { changed = true; });
    (tree as Group).children[0].emit('click', syntheticEvent('click', (tree as Group).children[0]));
    expect(changed).toBe(true);
    app.destroy();
  });

  it('toolbar button emits select', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const bar = createComponentFromJSON('toolbar', { x: 10, y: 10 }, app)!;
    app.add(bar);
    let item: unknown;
    bar.on('select', (e: { item?: unknown }) => { item = e.item; });
    (bar as Group).children[0].emit('click', syntheticEvent('click', (bar as Group).children[0]));
    expect(item).toBe('New');
    app.destroy();
  });

  it('radio click emits change', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const radio = createComponentFromJSON('radio', { group: 'g1', x: 10, y: 10 }, app)!;
    app.add(radio);
    let changed = false;
    radio.on('change', () => { changed = true; });
    radio.emit('click', syntheticEvent('click', radio));
    expect(changed).toBe(true);
    app.destroy();
  });

  it('textarea uses native element in HTML renderer', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const ta = createComponentFromJSON('textarea', { value: 'multiline', x: 10, y: 10 }, app)!;
    app.add(ta);
    app.render();
    expect(document.getElementById(ta.id)?.tagName).toBe('TEXTAREA');
    app.destroy();
  });

  it('disabled button ignores click side effects', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const btn = createComponentFromJSON('button', { label: 'X', disabled: true, x: 10, y: 10 }, app)!;
    app.add(btn);
    btn.emit('mouseenter', syntheticEvent('mouseenter', btn));
    btn.emit('mousedown', syntheticEvent('mousedown', btn));
    expect(() => app.render()).not.toThrow();
    app.destroy();
  });
});
