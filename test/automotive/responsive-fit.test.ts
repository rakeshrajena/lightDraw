import { describe, it, expect, afterEach } from 'vitest';
import type { Group } from '../../src/shapes/Group';
import {
  createAutomotiveFromJSON,
  listAutomotiveWidgets,
  updateAutoWidgetProps,
  fitAutoWidgetToContainer,
} from '../../src/automotive/registry';
import { getState, num } from '../../src/automotive/helpers';
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
      [400, 200],
      [800, 400],
      [320, 240],
      [960, 320],
    ];
    for (const [width, height] of sizes) {
      const container = createTestContainer(width, height);
      const app = createTestApp(container, { renderer: 'html', width, height, autoResize: false });
      const cluster = createAutomotiveFromJSON(
        'instrumentCluster',
        { x: 0, y: 0, width, height, speed: 50, rpm: 2000, fuel: 60 },
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
