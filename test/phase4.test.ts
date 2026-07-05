import { describe, it, expect, afterEach } from 'vitest';
import { createDashboardFromJSON } from '../src/dashboard/registry';
import { createComponentFromJSON } from '../src/components/registry';
import { contrastRatio, meetsWcagAA, toHighContrastColor } from '../src/utils/a11y';
import { collectFocusable } from '../src/utils/focusOrder';
import { createTestApp, createTestContainer, getNativeControl } from './helpers';

function dispatchPointer(
  el: HTMLElement,
  type: string,
  clientX: number,
  clientY: number
): void {
  el.dispatchEvent(
    new MouseEvent(type, { bubbles: true, clientX, clientY, button: 0 })
  );
}

function dispatchKey(el: HTMLElement, key: string, opts: { shiftKey?: boolean } = {}): void {
  el.dispatchEvent(
    new KeyboardEvent('keydown', { bubbles: true, key, shiftKey: opts.shiftKey ?? false })
  );
}

afterEach(() => {
  /* cleanup handled per test */
});

describe('Phase 4 — dblclick', () => {
  it('fires dblclick but not conflated with single click count', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const rect = app.rect({ x: 10, y: 10, width: 40, height: 40, fill: '#f00', listening: true });
    app.add(rect);

    let clicks = 0;
    let dblclicks = 0;
    rect.on('click', () => clicks++);
    rect.on('dblclick', () => dblclicks++);

    const el = app['renderer'].getElement() as HTMLElement;
    dispatchPointer(el, 'dblclick', 30, 30);

    expect(dblclicks).toBe(1);
    expect(clicks).toBe(0);
    app.destroy();
    container.remove();
  });
});

describe('Phase 4 — Drag and drop', () => {
  it('drop target receives event with payload', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const source = app.rect({
      x: 10,
      y: 10,
      width: 30,
      height: 30,
      fill: '#00f',
      draggable: true,
      dragPayload: { id: 'item-1' },
      listening: true,
    });
    const target = app.rect({
      x: 100,
      y: 100,
      width: 60,
      height: 60,
      fill: '#0f0',
      dropTarget: true,
      listening: true,
    });
    app.add(source, target);

    let dropped: unknown;
    target.on('drop', (e) => {
      dropped = e.payload;
    });

    const el = app['renderer'].getElement() as HTMLElement;
    dispatchPointer(el, 'mousedown', 25, 25);
    dispatchPointer(el, 'mousemove', 130, 130);
    dispatchPointer(el, 'mouseup', 130, 130);

    expect(dropped).toEqual({ id: 'item-1' });
    app.destroy();
    container.remove();
  });

  it('dragover fires while dragging over drop target', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const source = app.rect({
      x: 10,
      y: 10,
      width: 30,
      height: 30,
      draggable: true,
      dragPayload: 'data',
      listening: true,
    });
    const target = app.rect({
      x: 80,
      y: 80,
      width: 50,
      height: 50,
      dropTarget: true,
      listening: true,
    });
    app.add(source, target);

    let overs = 0;
    target.on('dragover', () => overs++);

    const el = app['renderer'].getElement() as HTMLElement;
    dispatchPointer(el, 'mousedown', 25, 25);
    dispatchPointer(el, 'mousemove', 105, 105);
    dispatchPointer(el, 'mouseup', 105, 105);

    expect(overs).toBeGreaterThan(0);
    app.destroy();
    container.remove();
  });
});

describe('Phase 4 — Focus and keyboard', () => {
  it('Tab moves focus through 5 focusable nodes', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const nodes = Array.from({ length: 5 }, (_, i) =>
      app.rect({
        x: i * 50,
        y: 10,
        width: 40,
        height: 40,
        fill: '#2563eb',
        focusable: true,
        listening: true,
        tabIndex: i,
      })
    );
    app.add(...nodes);
    expect(collectFocusable(app.stage).length).toBe(5);

    const el = app['renderer'].getElement() as HTMLElement;
    const order: string[] = [];
    for (let i = 0; i < 5; i++) {
      dispatchKey(el, 'Tab');
      const focused = app.getFocusedNode();
      if (focused) order.push(focused.id);
    }

    expect(order.length).toBe(5);
    expect(new Set(order).size).toBe(5);
    app.destroy();
    container.remove();
  });

  it('Enter activates focused button node', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const btn = createComponentFromJSON('button', { label: 'Go', x: 10, y: 10 }, app)!;
    app.add(btn);

    let activated = false;
    btn.on('click', () => {
      activated = true;
    });

    app.focusNode(btn);
    const el = app['renderer'].getElement() as HTMLElement;
    dispatchKey(el, 'Enter');

    expect(activated).toBe(true);
    app.destroy();
    container.remove();
  });

  it('focus and blur fire on node', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const a = app.rect({ width: 20, height: 20, focusable: true, listening: true });
    app.add(a);

    let focused = false;
    let blurred = false;
    a.on('focus', () => {
      focused = true;
    });
    a.on('blur', () => {
      blurred = true;
    });

    app.focusNode(a);
    expect(focused).toBe(true);
    app.focusNode(null);
    expect(blurred).toBe(true);
    app.destroy();
    container.remove();
  });
});

describe('Phase 4 — ARIA', () => {
  it('HTML renderer sets role and aria-checked on checkbox', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const box = createComponentFromJSON('checkbox', { checked: true, label: 'Agree' }, app)!;
    app.add(box);
    app.render();

    const el = document.getElementById(box.id);
    expect(el?.getAttribute('role')).toBe('checkbox');
    expect(el?.getAttribute('aria-checked')).toBe('true');
    app.destroy();
    container.remove();
  });

  it('slider has aria-valuenow', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const slider = createComponentFromJSON('slider', { value: 72 }, app)!;
    app.add(slider);
    app.render();

    const el = getNativeControl(slider.id);
    expect(el?.getAttribute('role')).toBe('slider');
    expect(el?.getAttribute('aria-valuenow')).toBe('72');
    app.destroy();
    container.remove();
  });
});

describe('Phase 4 — High contrast', () => {
  it('palette meets WCAG AA contrast ratio', () => {
    expect(meetsWcagAA('#ffffff', '#000000')).toBe(true);
    expect(contrastRatio('#ffffff', '#000000')).toBeGreaterThanOrEqual(4.5);
  });

  it('App highContrast mode toggles', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html', highContrast: true });
    expect(app.isHighContrast()).toBe(true);
    app.setHighContrast(false);
    expect(app.isHighContrast()).toBe(false);
    app.destroy();
    container.remove();
  });

  it('toHighContrastColor maps fill, stroke, and text', () => {
    expect(toHighContrastColor('#333', 'fill')).toBeTruthy();
    expect(toHighContrastColor('#333', 'stroke')).toBeTruthy();
    expect(toHighContrastColor('#333', 'text')).toBeTruthy();
    expect(toHighContrastColor(null, 'fill')).toBeTruthy();
  });
});

describe('Phase 4 — Event propagation', () => {
  it('stopPropagation prevents parent handlers', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const parent = app.group({ listening: true });
    const child = app.rect({ x: 5, y: 5, width: 20, height: 20, fill: '#f00', listening: true });
    parent.add(child);
    app.add(parent);

    let parentClicks = 0;
    let childClicks = 0;
    parent.on('click', () => parentClicks++);
    child.on('click', (e) => {
      childClicks++;
      e.stopPropagation();
    });

    const el = app['renderer'].getElement() as HTMLElement;
    dispatchPointer(el, 'click', 15, 15);

    expect(childClicks).toBe(1);
    expect(parentClicks).toBe(0);
    app.destroy();
    container.remove();
  });
});

describe('Phase 4 — Hit test performance', () => {
  it('hit test on event stays under 4ms average with spatial index', () => {
    const container = createTestContainer(800, 600);
    const app = createTestApp(container, {
      renderer: 'html',
      performance: { spatialIndex: true, spatialIndexThreshold: 50 },
    });
    for (let i = 0; i < 500; i++) {
      app.add(
        app.rect({
          x: (i % 25) * 15,
          y: Math.floor(i / 25) * 15,
          width: 10,
          height: 10,
          fill: '#000',
        })
      );
    }
    app.render();

    const start = performance.now();
    for (let i = 0; i < 30; i++) {
      app.hitTest(100, 100);
    }
    const avg = (performance.now() - start) / 30;
    expect(avg).toBeLessThan(4);

    app.destroy();
    container.remove();
  });
});

describe('Phase 4 — Canvas focus ring', () => {
  it('renders focused node with canvas renderer', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'canvas' });
    const rect = app.rect({ x: 20, y: 20, width: 40, height: 40, fill: '#f00', focusable: true });
    app.add(rect);
    app.focusNode(rect);
    app.render();
    expect(app.getFocusedNode()?.id).toBe(rect.id);
    app.destroy();
    container.remove();
  });
});

describe('Phase 4 — Component roles', () => {
  it('button component has button role in HTML', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const btn = createComponentFromJSON('button', { label: 'Save' }, app)!;
    app.add(btn);
    app.render();
    expect(document.getElementById(btn.id)?.getAttribute('role')).toBe('button');
    app.destroy();
    container.remove();
  });

  it('toggle component exposes switch role', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const toggle = createComponentFromJSON('toggle', { value: true }, app)!;
    app.add(toggle);
    app.render();
    const el = document.getElementById(toggle.id);
    expect(el?.getAttribute('role')).toBe('switch');
    expect(el?.getAttribute('aria-checked')).toBe('true');
    app.destroy();
    container.remove();
  });

  it('progressBar exposes progressbar role and value', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const bar = createComponentFromJSON('progressBar', { value: 42 }, app)!;
    app.add(bar);
    app.render();
    const el = document.getElementById(bar.id);
    expect(el?.getAttribute('role')).toBe('progressbar');
    expect(el?.getAttribute('aria-valuenow')).toBe('42');
    app.destroy();
    container.remove();
  });
});

describe('Phase 4 — App focus API', () => {
  it('getFocusableNodes returns focusable nodes in tab order', () => {
    const container = createTestContainer();
    const app = createTestApp(container);
    const a = app.rect({ focusable: true, tabIndex: 2, listening: true });
    const b = app.rect({ focusable: true, tabIndex: 1, listening: true });
    app.add(a, b);
    const nodes = app.getFocusableNodes();
    expect(nodes.length).toBe(2);
    expect(nodes[0].tabIndex).toBeLessThanOrEqual(nodes[1].tabIndex);
    app.destroy();
    container.remove();
  });

  it('EventManager destroy removes listeners without error', () => {
    const container = createTestContainer();
    const app = createTestApp(container);
    app.destroy();
    container.remove();
  });
});

describe('Phase 4 — Dashboard aria-live', () => {
  it('gauge value text uses aria-live polite', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const gauge = createDashboardFromJSON('gauge', { value: 55, size: 100 }, app)!;
    app.add(gauge);
    app.render();

    const liveEl = gauge.children.find((c) => c.ariaLive === 'polite');
    expect(liveEl).toBeDefined();
    app.destroy();
    container.remove();
  });
});

describe('Phase 4 — Hover events', () => {
  it('mouseenter and mouseleave fire on pointer move', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const rect = app.rect({ x: 50, y: 50, width: 40, height: 40, listening: true });
    app.add(rect);

    let entered = false;
    let left = false;
    rect.on('mouseenter', () => {
      entered = true;
    });
    rect.on('mouseleave', () => {
      left = true;
    });

    const el = app['renderer'].getElement() as HTMLElement;
    dispatchPointer(el, 'mousemove', 10, 10);
    dispatchPointer(el, 'mousemove', 70, 70);
    dispatchPointer(el, 'mousemove', 10, 10);

    expect(entered).toBe(true);
    expect(left).toBe(true);
    app.destroy();
    container.remove();
  });
});
