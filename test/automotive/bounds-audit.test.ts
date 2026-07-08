import { describe, it, expect, afterEach } from 'vitest';
import type { Group } from '../../src/shapes/Group';
import type { Node } from '../../src/Node';
import { createAutomotiveFromJSON, listAutomotiveWidgets, updateAutoWidgetProps } from '../../src/automotive/registry';
import { getState, num } from '../../src/automotive/helpers';
import { createTestApp, createTestContainer } from '../helpers';

const WIDGETS = listAutomotiveWidgets();
const SIZES: [number, number][] = [
  [260, 168],
  [180, 120],
  [120, 80],
  [72, 56],
];

function measureExtent(node: Node): { w: number; h: number } {
  const rootState = getState(node);
  const rootW = num(rootState, 'width', Infinity);
  const rootH = num(rootState, 'height', Infinity);
  let maxR = 0;
  let maxB = 0;
  const walk = (parent: Node, ox: number, oy: number, clipR: number, clipB: number) => {
    if (!('children' in parent)) return;
    const state = getState(parent);
    const ownW = num(state, 'width', 0);
    const ownH = num(state, 'height', 0);
    let nextClipR = clipR;
    let nextClipB = clipB;
    if (parent.clip && ownW > 0 && ownH > 0) {
      nextClipR = Math.min(clipR, ox + ownW);
      nextClipB = Math.min(clipB, oy + ownH);
      maxR = Math.max(maxR, nextClipR);
      maxB = Math.max(maxB, nextClipB);
    }
    for (const child of (parent as Group).children) {
      const cx = ox + child.x;
      const cy = oy + child.y;
      const b = child.getBounds();
      const right = Math.min(nextClipR, cx + b.width);
      const bottom = Math.min(nextClipB, cy + b.height);
      if (right > maxR) maxR = right;
      if (bottom > maxB) maxB = bottom;
      if ('children' in child) walk(child, cx, cy, nextClipR, nextClipB);
    }
  };
  walk(node, 0, 0, rootW, rootH);
  return { w: maxR, h: maxB };
}

function galleryProps(type: string, w: number, h: number): Record<string, unknown> {
  const base: Record<string, unknown> = {
    x: 0,
    y: 0,
    width: w,
    height: h,
    value: 42,
    active: true,
    gear: 'D',
    pressures: [32, 31, 22, 33],
    signals: { 'ecu.rpm': 2400, 'ecu.speed': 65 },
    lines: ['Row A', 'Row B'],
    status: 'on',
    theme: 'classic',
  };
  if (type.includes('Cluster')) {
    return { ...base, speed: 60, rpm: 2500, fuel: 70, engineTemp: 90 };
  }
  if (type === 'tachometer' || type === 'speedometer') {
    const size = Math.min(w, h);
    return { ...base, value: type === 'tachometer' ? 3200 : 72, size, display: size < 110 ? 'digital' : 'analog' };
  }
  return base;
}

describe('automotive widget bounds audit', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  for (const type of WIDGETS) {
    for (const [w, h] of SIZES) {
      it(`${type} content fits ${w}x${h} box`, () => {
        const container = createTestContainer(w + 20, h + 20);
        const app = createTestApp(container, { renderer: 'html', width: w, height: h, autoResize: false });
        const node = createAutomotiveFromJSON(type, galleryProps(type, w, h), app)!;
        expect(node).toBeTruthy();
        app.add(node);
        app.render();

        const state = getState(node);
        const boxW = num(state, 'width', w);
        const boxH = num(state, 'height', h);
        const extent = measureExtent(node);
        const tol = type.includes('Cluster') ? 2 : 1;
        expect(extent.w, `${type}@${w}x${h} width`).toBeLessThanOrEqual(boxW + tol);
        expect(extent.h, `${type}@${w}x${h} height`).toBeLessThanOrEqual(boxH + tol);

        updateAutoWidgetProps(node, { width: w + 40, height: h + 30 });
        app.render();
        const extent2 = measureExtent(node);
        const boxW2 = num(getState(node), 'width', w + 40);
        const boxH2 = num(getState(node), 'height', h + 30);
        expect(extent2.w).toBeLessThanOrEqual(boxW2 + tol);
        expect(extent2.h).toBeLessThanOrEqual(boxH2 + tol);

        app.destroy();
      });
    }
  }
});
