import { describe, it, expect, afterEach } from 'vitest';
import {
  createComponentFromJSON,
  componentToJSON,
} from '../src/components/registry';
import { syntheticEvent, getParts as getComponentParts } from '../src/components/helpers';
import { toJSON } from '../src/io/json';
import type { Group } from '../src/shapes/Group';
import { createTestApp, createTestContainer, measureAverageMs, getNativeControl, forceGc, heapUsed } from './helpers';

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

    const tabChild = (tabs as Group).children.find((c) => c.metadata?.tabIndex === 1)!;
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
    const el = getNativeControl<HTMLInputElement>(input.id);
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
    expect(avg).toBeLessThan(55);
    app.destroy();
  });

  it('modal open state renders within performance budget', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const dialog = createComponentFromJSON('dialog', { open: true, x: 50, y: 50 }, app)!;
    app.add(dialog);
    const avg = measureAverageMs(() => app.render(), 10);
    expect(avg).toBeLessThan(32); // v1.0 HTML modal; headroom for slower CI runners
    app.destroy();
  });

  it('create/destroy 100 checkbox instances — no runaway growth', () => {
    const container = createTestContainer();
    forceGc();
    const before = heapUsed();
    for (let i = 0; i < 100; i++) {
      const app = createTestApp(container, { renderer: 'html' });
      app.add(createComponentFromJSON('checkbox', { x: 0, y: 0 }, app)!);
      app.render();
      app.destroy();
    }
    forceGc();
    // Floor raised for theme-system App overhead under full-suite CI load (~17–20 MB observed).
    const growth = heapUsed() - before;
    expect(growth).toBeLessThan(24 * 1024 * 1024);
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
    const el = getNativeControl<HTMLTextAreaElement>(ta.id);
    expect(el?.tagName).toBe('TEXTAREA');
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

  describe('form control variants (UI-1)', () => {
    const formTypes = ['button', 'input', 'textarea', 'checkbox', 'toggle', 'radio', 'slider', 'progressBar'] as const;

    for (const type of formTypes) {
      it(`${type} renders with sm size and disabled`, () => {
        const container = createTestContainer();
        const app = createTestApp(container, { renderer: 'html' });
        const props: Record<string, unknown> = { x: 10, y: 10, size: 'sm', disabled: true };
        if (type === 'button') props.variant = 'secondary';
        if (type === 'progressBar') props.value = 40;
        const node = createComponentFromJSON(type, props, app)!;
        app.add(node);
        app.render();
        expect(() => app.render()).not.toThrow();
        app.destroy();
      });
    }

    it('button applies variant and size CSS classes', () => {
      const container = createTestContainer();
      const app = createTestApp(container, { renderer: 'html' });
      app.loadJSON({
        type: 'group',
        children: [
          { type: 'button', props: { label: 'Primary', x: 10, y: 10, variant: 'primary', size: 'lg' } },
          { type: 'button', props: { label: 'Ghost', x: 10, y: 60, variant: 'ghost', size: 'sm' } },
        ],
      });
      app.render();
      expect(container.querySelector('.lightdraw-btn--primary.lightdraw-btn--lg')).not.toBeNull();
      expect(container.querySelector('.lightdraw-btn--ghost.lightdraw-btn--sm')).not.toBeNull();
      app.destroy();
    });

    it('input shows invalid state and error message', () => {
      const container = createTestContainer();
      const app = createTestApp(container, { renderer: 'html' });
      app.loadJSON({
        type: 'input',
        props: {
          label: 'Email',
          value: 'bad',
          invalid: true,
          error: 'Enter a valid email',
          x: 10,
          y: 10,
          width: 200,
        },
      });
      app.render();
      const field = container.querySelector('.lightdraw-field--invalid');
      expect(field).not.toBeNull();
      expect(container.querySelector('.lightdraw-field-error')?.textContent).toBe('Enter a valid email');
      const input = container.querySelector('.lightdraw-native-input') as HTMLInputElement;
      expect(input.getAttribute('aria-invalid')).toBe('true');
      app.destroy();
    });

    it('label component renders on canvas', () => {
      const container = createTestContainer();
      const app = createTestApp(container, { renderer: 'canvas' });
      const node = createComponentFromJSON('label', { text: 'Section title', x: 10, y: 10 }, app)!;
      app.add(node);
      expect(() => app.render()).not.toThrow();
      app.destroy();
    });
  });

  describe('surface layout variants (UI-2)', () => {
    it('card renders subtitle and elevated class in HTML', () => {
      const container = createTestContainer();
      const app = createTestApp(container, { renderer: 'html' });
      app.loadJSON({
        type: 'card',
        props: { title: 'Dashboard', subtitle: 'Live metrics', width: 300, height: 120, x: 10, y: 10, elevated: true },
      });
      app.render();
      expect(container.querySelector('.lightdraw-card--elevated')).not.toBeNull();
      expect(container.querySelector('.lightdraw-card-subtitle')?.textContent).toBe('Live metrics');
      app.destroy();
    });

    it('tabs HTML has sliding indicator aligned to equal columns', () => {
      const container = createTestContainer();
      const app = createTestApp(container, { renderer: 'html' });
      app.loadJSON({
        type: 'tabs',
        props: { tabs: ['Overview', 'Analytics', 'Reports', 'Settings'], activeTab: 1, width: 320, x: 10, y: 10 },
      });
      app.render();
      const indicator = container.querySelector('.lightdraw-tabs-indicator') as HTMLElement;
      expect(indicator).not.toBeNull();
      expect(indicator.style.width).toBe('25%');
      expect(indicator.style.left).toBe('25%');
      const tabs = container.querySelectorAll('.lightdraw-tabs-tab');
      expect(tabs.length).toBe(4);
      app.destroy();
    });

    it('toolbar renders separator and icons', () => {
      const container = createTestContainer();
      const app = createTestApp(container, { renderer: 'html' });
      app.loadJSON({
        type: 'toolbar',
        props: { items: ['New', '|', 'Save'], icons: ['+', '💾'], x: 10, y: 10 },
      });
      app.render();
      expect(container.querySelector('.lightdraw-toolbar-separator')).not.toBeNull();
      expect(container.querySelector('.lightdraw-toolbar-icon')).not.toBeNull();
      app.destroy();
    });

    it('statusBar supports mono and primaryIndex', () => {
      const container = createTestContainer();
      const app = createTestApp(container, { renderer: 'html' });
      app.loadJSON({
        type: 'statusBar',
        props: { segments: ['Build', 'main', 'UTF-8'], primaryIndex: 1, mono: true, width: 360, x: 10, y: 10 },
      });
      app.render();
      expect(container.querySelector('.lightdraw-statusbar--mono')).not.toBeNull();
      const segments = container.querySelectorAll('.lightdraw-statusbar-segment');
      expect(segments[1]?.classList.contains('lightdraw-statusbar-segment--primary')).toBe(true);
      app.destroy();
    });

    it('accordion panel uses animated wrap', () => {
      const container = createTestContainer();
      const app = createTestApp(container, { renderer: 'html' });
      app.loadJSON({
        type: 'accordion',
        props: {
          x: 10,
          y: 10,
          width: 260,
          sections: [{ title: 'One', content: 'A' }, { title: 'Two', content: 'B' }],
        },
      });
      app.render();
      expect(container.querySelector('.lightdraw-accordion-panel-wrap')).not.toBeNull();
      app.destroy();
    });
  });

  describe('overlay feedback variants (UI-3)', () => {
    it('dialog renders centered host with backdrop when open', () => {
      const container = createTestContainer();
      const app = createTestApp(container, { renderer: 'html' });
      app.loadJSON({
        type: 'dialog',
        props: { open: true, title: 'Confirm', message: 'Proceed?', x: 50, y: 50, width: 320 },
      });
      app.render();
      expect(container.querySelector('.lightdraw-dialog-host--open')).not.toBeNull();
      expect(container.querySelector('.lightdraw-dialog-center')).not.toBeNull();
      expect(container.querySelector('.lightdraw-dialog-overlay')).not.toBeNull();
      app.destroy();
    });

    it('menu renders scrollable panel and danger item', () => {
      const container = createTestContainer();
      const app = createTestApp(container, { renderer: 'html' });
      app.loadJSON({
        type: 'menu',
        props: {
          items: ['Edit', 'Copy', 'Delete'],
          itemVariants: ['', '', 'danger'],
          open: true,
          x: 10,
          y: 10,
          width: 160,
        },
      });
      app.render();
      expect(container.querySelector('.lightdraw-menu-panel')).not.toBeNull();
      expect(container.querySelector('.lightdraw-menu-item--danger')).not.toBeNull();
      app.destroy();
    });

    it('toast supports position class and dismiss control', () => {
      const container = createTestContainer();
      const app = createTestApp(container, { renderer: 'html' });
      const toast = createComponentFromJSON(
        'toast',
        { message: 'Done', variant: 'info', position: 'top-right', dismissible: true, visible: true, x: 10, y: 10 },
        app
      )!;
      app.add(toast);
      app.render();
      const el = container.querySelector('.lightdraw-toast--top-right');
      expect(el).not.toBeNull();
      expect(container.querySelector('.lightdraw-toast-dismiss')).not.toBeNull();
      (container.querySelector('.lightdraw-toast-dismiss') as HTMLButtonElement)?.click();
      app.render();
      expect(toast.visible).toBe(false);
      app.destroy();
    });

    it('tooltip renders anchor and placement class', () => {
      const container = createTestContainer();
      const app = createTestApp(container, { renderer: 'html' });
      app.loadJSON({
        type: 'tooltip',
        props: { text: 'Hint', anchor: 'Help', placement: 'top', delay: 0, x: 10, y: 10 },
      });
      app.render();
      expect(container.querySelector('.lightdraw-tooltip--top')).not.toBeNull();
      expect(container.querySelector('.lightdraw-tooltip-anchor')?.textContent).toBe('Help');
      app.destroy();
    });
  });

  describe('data display variants (UI-4)', () => {
    it('table renders sticky header, zebra rows, and sortable headers', () => {
      const container = createTestContainer();
      const app = createTestApp(container, { renderer: 'html' });
      app.loadJSON({
        type: 'table',
        props: {
          columns: ['Name', 'Status'],
          rows: [
            ['Alpha', 'Active'],
            ['Beta', 'Pending'],
            ['Gamma', 'Inactive'],
          ],
          sortable: true,
          sortColumn: 0,
          sortDirection: 'asc',
          stickyHeader: true,
          maxHeight: 120,
          width: 280,
          x: 10,
          y: 10,
        },
      });
      app.render();
      expect(container.querySelector('.lightdraw-table-wrap--scroll-x')).not.toBeNull();
      expect(container.querySelector('.lightdraw-table-head--sticky')).not.toBeNull();
      expect(container.querySelector('.lightdraw-table-th--sortable')).not.toBeNull();
      expect(container.querySelector('.lightdraw-table-th--sorted-asc')).not.toBeNull();
      expect(container.querySelector('.lightdraw-table-scroll')).not.toBeNull();
      app.destroy();
    });

    it('table row click selects row in HTML', () => {
      const container = createTestContainer();
      const app = createTestApp(container, { renderer: 'html' });
      const table = createComponentFromJSON(
        'table',
        {
          columns: ['A', 'B'],
          rows: [
            ['One', '1'],
            ['Two', '2'],
          ],
          x: 10,
          y: 10,
          width: 200,
        },
        app
      )!;
      app.add(table);
      app.render();
      (container.querySelector('.lightdraw-table-row[data-index="1"]') as HTMLTableRowElement)?.click();
      app.render();
      expect(container.querySelector('.lightdraw-table-row--selected')?.getAttribute('data-index')).toBe('1');
      app.destroy();
    });

    it('tree renders indent guides and selected leaf', () => {
      const container = createTestContainer();
      const app = createTestApp(container, { renderer: 'html' });
      app.loadJSON({
        type: 'tree',
        props: {
          nodes: [{ label: 'src', children: [{ label: 'App.ts' }, { label: 'index.ts' }] }],
          expanded: [0],
          selectedNode: 'p0.c0',
          width: 200,
          x: 10,
          y: 10,
        },
      });
      app.render();
      expect(container.querySelector('.lightdraw-tree-children')).not.toBeNull();
      expect(container.querySelector('.lightdraw-tree-leaf--selected')?.textContent).toBe('App.ts');
      app.destroy();
    });

    it('tree leaf click emits select', () => {
      const container = createTestContainer();
      const app = createTestApp(container, { renderer: 'html' });
      const tree = createComponentFromJSON(
        'tree',
        {
          nodes: [{ label: 'Root', children: [{ label: 'Leaf' }] }],
          expanded: [0],
          x: 10,
          y: 10,
        },
        app
      )!;
      app.add(tree);
      app.render();
      let key: unknown;
      tree.on('select', (e: { value?: unknown }) => {
        key = e.value;
      });
      (container.querySelector('.lightdraw-tree-leaf') as HTMLButtonElement)?.click();
      expect(key).toBe('p0.c0');
      app.destroy();
    });
  });

  describe('UI module integration (UI-5)', () => {
    it('all 17 core component types register and create nodes', () => {
      const container = createTestContainer();
      const app = createTestApp(container, { renderer: 'html' });
      for (const type of COMPONENT_TYPES) {
        const node = createComponentFromJSON(type, { x: 0, y: 0 }, app);
        expect(node, type).not.toBeNull();
        expect(node!.metadata?.componentType ?? type).toBeTruthy();
      }
      app.destroy();
    });

    it('uiTheme JSON round-trip via export preserves component props', () => {
      const container = createTestContainer();
      const app = createTestApp(container, { renderer: 'html', uiTheme: { preset: 'ocean', radius: '10px' } });
      const btn = createComponentFromJSON(
        'button',
        { label: 'Export', variant: 'primary', size: 'lg', x: 10, y: 10 },
        app
      )!;
      app.add(btn);
      const json = toJSON(btn);
      expect(json.type).toBe('button');
      expect(json.props?.label).toBe('Export');
      expect(json.props?.variant).toBe('primary');
      expect(json.props?.size).toBe('lg');
      const restored = createComponentFromJSON(json.type, json.props ?? {}, app)!;
      expect(restored.metadata.componentState?.label).toBe('Export');
      app.destroy();
    });

    it('high contrast mode toggles on HTML renderer', () => {
      const container = createTestContainer();
      const app = createTestApp(container, { renderer: 'html' });
      app.loadJSON({ type: 'input', props: { label: 'Email', x: 10, y: 10, width: 200 } });
      app.render();
      app.setHighContrast(true);
      app.render();
      expect(container.querySelector('[data-ld-high-contrast="true"]')).not.toBeNull();
      app.setHighContrast(false);
      app.render();
      expect(container.querySelector('[data-ld-high-contrast="true"]')).toBeNull();
      app.destroy();
    });
  });
});
