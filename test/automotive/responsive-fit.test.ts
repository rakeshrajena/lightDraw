import { describe, it, expect, afterEach } from 'vitest';
import type { Group } from '../../src/shapes/Group';
import {
  createAutomotiveFromJSON,
  listAutomotiveWidgets,
  updateAutoWidgetProps,
  fitAutoWidgetToContainer,
} from '../../src/automotive/registry';
import { getState, num } from '../../src/automotive/helpers';
import { resolveClusterLayout } from '../../src/automotive/layout';
import { createTestApp, createTestContainer } from '../helpers';

const WIDGETS = listAutomotiveWidgets();

function maxChildExtent(group: Group): { w: number; h: number } {
  let maxR = 0;
  let maxB = 0;
  for (const child of group.children) {
    const bounds = child.getBounds();
    const right = child.x + bounds.width;
    const bottom = child.y + bounds.height;
    if (right > maxR) maxR = right;
    if (bottom > maxB) maxB = bottom;
  }
  return { w: maxR, h: maxB };
}

function maxClusterSlotExtent(cluster: Group): { w: number; h: number } {
  let maxR = 0;
  let maxB = 0;
  for (const child of cluster.children) {
    const state = getState(child);
    const cw = num(state, 'width', child.getBounds().width);
    const ch = num(state, 'height', child.getBounds().height);
    if (cw <= 0 && ch <= 0) continue;
    const right = child.x + (cw || child.getBounds().width);
    const bottom = child.y + (ch || child.getBounds().height);
    if (right > maxR) maxR = right;
    if (bottom > maxB) maxB = bottom;
  }
  return { w: maxR, h: maxB };
}

function baseProps(type: string): Record<string, unknown> {
  return {
    x: 0,
    y: 0,
    width: 120,
    height: 80,
    value: 42,
    active: true,
    gear: 'D',
    pressures: [32, 32, 32, 32],
    signals: { 'ecu.rpm': 1200, 'ecu.speed': 55 },
    lines: ['Row A', 'Row B'],
    status: 'on',
    theme: 'classic',
    ...(type.includes('Cluster') ? { speed: 60, rpm: 2500, fuel: 70, engineTemp: 90 } : {}),
  };
}

describe('automotive responsive auto-fit', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  for (const type of WIDGETS) {
    it(`${type} rebuilds to new width/height on updateAutoWidgetProps`, () => {
      const container = createTestContainer(140, 100);
      const app = createTestApp(container, { renderer: 'html', width: 140, height: 100, autoResize: false });
      const node = createAutomotiveFromJSON(type, baseProps(type), app)!;
      expect(node).toBeTruthy();
      app.add(node);
      app.render();

      updateAutoWidgetProps(node, { width: 220, height: 160 });
      app.render();

      const state = getState(node);
      expect(num(state, 'width', 0)).toBe(220);
      expect(num(state, 'height', 0)).toBe(160);
      expect(node.metadata.chartWidth).toBe(220);
      expect(node.metadata.chartHeight).toBe(160);

      const extent = maxChildExtent(node as Group);
      const tol = type.includes('Cluster') ? 24 : 4;
      expect(extent.w).toBeLessThanOrEqual(220 + tol);
      expect(extent.h).toBeLessThanOrEqual(160 + tol);

      app.destroy();
    });
  }

  it('fitAutoWidgetToContainer returns width/height for every widget', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    for (const type of WIDGETS) {
      const node = createAutomotiveFromJSON(type, baseProps(type), app)!;
      const patch = fitAutoWidgetToContainer(node, 180, 120, 8);
      expect(patch.width, type).toBe(180);
      expect(patch.height, type).toBe(120);
    }
    app.destroy();
  });

  it('instrumentCluster children stay inside bounds at multiple aspect ratios', () => {
    const sizes: [number, number][] = [
      [260, 168],
      [400, 200],
      [800, 400],
      [320, 240],
      [960, 320],
      [1062, 420],
    ];
    for (const [width, height] of sizes) {
      const container = createTestContainer(width, height);
      const app = createTestApp(container, { renderer: 'html', width, height, autoResize: false });
      const cluster = createAutomotiveFromJSON(
        'instrumentCluster',
        { x: 0, y: 0, width, height, speed: 72, rpm: 3200, fuel: 75 },
        app
      )!;
      app.add(cluster);
      updateAutoWidgetProps(cluster, { width, height });
      app.render();
      const extent = maxClusterSlotExtent(cluster as Group);
      expect(extent.w, `${width}x${height} w`).toBeLessThanOrEqual(width + 2);
      expect(extent.h, `${width}x${height} h`).toBeLessThanOrEqual(height + 2);
      app.destroy();
    }
  });

  it('instrumentCluster slot layout has no overlapping regions', () => {
    const overlaps = (w: number, h: number) => {
      const slots = resolveClusterLayout(w, h);
      const hits: string[] = [];
      for (let i = 0; i < slots.length; i++) {
        for (let j = i + 1; j < slots.length; j++) {
          const a = slots[i];
          const b = slots[j];
          if (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
          ) {
            hits.push(`${a.type}/${b.type}`);
          }
        }
      }
      return hits;
    };
    for (const [w, h] of [
      [260, 168],
      [800, 400],
      [1062, 420],
    ] as const) {
      expect(overlaps(w, h), `${w}x${h}`).toEqual([]);
    }
    for (const [w, h] of [
      [920, 420],
      [1062, 420],
    ] as const) {
      const slots = resolveClusterLayout(w, h, { callScreen: true });
      const hits: string[] = [];
      for (let i = 0; i < slots.length; i++) {
        for (let j = i + 1; j < slots.length; j++) {
          const a = slots[i];
          const b = slots[j];
          if (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
          ) {
            hits.push(`${a.type}/${b.type}`);
          }
        }
      }
      expect(hits, `call ${w}x${h}`).toEqual([]);
      expect(slots.some((s) => s.type === 'callScreen'), `call slot ${w}x${h}`).toBe(true);
    }
  });

  it('instrumentCluster shows call overlay when incomingCall is set', () => {
    const container = createTestContainer(920, 420);
    const app = createTestApp(container, { renderer: 'html', width: 920, height: 420, autoResize: false });
    const cluster = createAutomotiveFromJSON(
      'instrumentCluster',
      {
        x: 0,
        y: 0,
        width: 920,
        height: 420,
        incomingCall: true,
        caller: 'Alex Morgan',
        speed: 65,
        rpm: 2400,
      },
      app
    )!;
    app.add(cluster);
    app.render();
    const slotTypes = cluster.children
      .filter((c) => c.metadata?.autoSlot)
      .map((c) => String(c.metadata.autoSlot));
    expect(slotTypes).toContain('callScreen');
    app.destroy();
  });

  it('gearIndicator letter is vertically centered in its panel', () => {
    const container = createTestContainer(120, 80);
    const app = createTestApp(container, { renderer: 'html', width: 120, height: 80, autoResize: false });
    const gear = createAutomotiveFromJSON('gearIndicator', { x: 0, y: 0, width: 120, height: 80, gear: 'D' }, app)!;
    app.add(gear);
    app.render();
    const label = gear.children.find((c) => c.type === 'text') as { y: number; fontSize: number; metadata?: { textBoxCenterY?: number } };
    const bounds = gear.children.find((c) => c.type === 'roundedRect') as { y: number; height: number };
    expect(label).toBeDefined();
    expect(bounds).toBeDefined();
    const panelCenter = bounds.y + bounds.height / 2;
    expect(label.metadata?.textBoxCenterY ?? label.y + label.fontSize / 2).toBeCloseTo(panelCenter, 0);
    app.destroy();
  });

  it('turnIndicators arrows stay inside panel bounds', () => {
    const container = createTestContainer(80, 32);
    const app = createTestApp(container, { renderer: 'html', width: 80, height: 32, autoResize: false });
    const turn = createAutomotiveFromJSON('turnIndicators', { x: 0, y: 0, width: 80, height: 32, left: true, right: false }, app)!;
    app.add(turn);
    app.render();
    const extent = maxChildExtent(turn as Group);
    expect(extent.w).toBeLessThanOrEqual(80 + 1);
    expect(extent.h).toBeLessThanOrEqual(32 + 1);
    app.destroy();
  });

  it('calendar fits gallery card and uses automotive widget', () => {
    const container = createTestContainer(260, 168);
    const app = createTestApp(container, { renderer: 'html', width: 260, height: 168, autoResize: false });
    const cal = createAutomotiveFromJSON(
      'calendar',
      { x: 0, y: 0, width: 260, height: 168, year: 2026, month: 6, highlightDay: 7 },
      app
    )!;
    app.add(cal);
    app.render();
    expect(cal.metadata.autoType).toBe('calendar');
    expect(cal.metadata.widgetType).toBeUndefined();
    const extent = maxChildExtent(cal as Group);
    expect(extent.w).toBeLessThanOrEqual(261);
    expect(extent.h).toBeLessThanOrEqual(169);
    const dayTexts = cal.children.filter((c) => c.type === 'text' && /^\d+$/.test(String((c as { text?: string }).text ?? '')));
    expect(dayTexts.length).toBeGreaterThanOrEqual(28);
    app.destroy();
  });

  it('callScreen fits gallery card and uses automotive widget', () => {
    const container = createTestContainer(260, 168);
    const app = createTestApp(container, { renderer: 'html', width: 260, height: 168, autoResize: false });
    const call = createAutomotiveFromJSON(
      'callScreen',
      {
        x: 0,
        y: 0,
        width: 260,
        height: 168,
        caller: 'Alex Morgan',
        subtitle: 'Mobile',
        status: 'incoming',
        hint: 'Swipe to answer',
      },
      app
    )!;
    app.add(call);
    app.render();
    expect(call.metadata.autoType).toBe('callScreen');
    expect(call.metadata.widgetType).toBeUndefined();
    const extent = maxChildExtent(call as Group);
    expect(extent.w).toBeLessThanOrEqual(261);
    expect(extent.h).toBeLessThanOrEqual(169);
    const texts = call.children.filter((c) => c.type === 'text').map((c) => String((c as { text?: string }).text ?? ''));
    expect(texts.some((t) => t.includes('Alex'))).toBe(true);
    expect(texts.some((t) => t.includes('INCOMING') || t.includes('Incoming'))).toBe(true);
    expect(texts.some((t) => t.includes('Answer') || t.includes('Ans'))).toBe(true);
    app.destroy();
  });

  it('batteryVoltage fits compact cluster slot sizes', () => {
    const sizes: [number, number][] = [
      [44, 18],
      [80, 32],
      [100, 36],
    ];
    for (const [width, height] of sizes) {
      const container = createTestContainer(width, height);
      const app = createTestApp(container, { renderer: 'html', width, height, autoResize: false });
      const bat = createAutomotiveFromJSON('batteryVoltage', { x: 0, y: 0, width, height, value: 12.4 }, app)!;
      app.add(bat);
      app.render();
      const extent = maxChildExtent(bat as Group);
      expect(extent.w, `${width}x${height} w`).toBeLessThanOrEqual(width + 1);
      expect(extent.h, `${width}x${height} h`).toBeLessThanOrEqual(height + 1);
      app.destroy();
    }
  });

  it('dial widgets auto-fit from size-only props', () => {
    const container = createTestContainer(160, 160);
    const app = createTestApp(container, { renderer: 'html', width: 160, height: 160, autoResize: false });
    const speedo = createAutomotiveFromJSON('speedometer', { x: 0, y: 0, size: 120, value: 55 }, app)!;
    app.add(speedo);
    updateAutoWidgetProps(speedo, { width: 200, height: 150 });
    const state = getState(speedo);
    expect(num(state, 'width', 0)).toBe(200);
    expect(num(state, 'height', 0)).toBe(150);
    expect(num(state, 'size', 0)).toBeGreaterThan(0);
    expect(num(state, 'size', 0)).toBeLessThanOrEqual(134);
    app.destroy();
  });
});
