/**
 * Live theme must retint chart series (not bake colors into widgetState).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestApp, createTestContainer } from '../helpers';
import { createDashboardFromJSON } from '../../src/dashboard/registry';
import { getParts } from '../../src/dashboard/helpers';
import { syncActiveDashboardTheme } from '../../src/dashboard/theme';
import type { Group } from '../../src/shapes/Group';
import type { Node } from '../../src/Node';

function walkFind(node: Node, pred: (n: Node) => boolean): Node | null {
  if (pred(node)) return node;
  if ('children' in node) {
    for (const child of (node as Group).children) {
      const hit = walkFind(child, pred);
      if (hit) return hit;
    }
  }
  return null;
}

function findStroke(node: Node, color: string): boolean {
  const n = node as Node & { stroke?: string | null; fill?: string };
  if (n.stroke === color || n.fill === color) return true;
  if ('children' in node) {
    return (node as Group).children.some((c) => findStroke(c, color));
  }
  return false;
}

describe('Dashboard live theme series retint', () => {
  beforeEach(() => {
    syncActiveDashboardTheme({});
  });

  it('lineChart polyline stroke follows setUiTheme primary', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'canvas' });
    const chart = createDashboardFromJSON(
      'lineChart',
      { data: [10, 20, 30, 25, 40], width: 240, height: 120, x: 0, y: 0 },
      app
    )! as Group;
    app.add(chart);

    app.setUiTheme({ primary: '#7c3aed' }, { replace: true });
    expect(findStroke(chart, '#7c3aed')).toBe(true);

    app.setUiTheme({ primary: '#e11d48' }, { replace: true });
    expect(findStroke(chart, '#e11d48')).toBe(true);
    expect(findStroke(chart, '#7c3aed')).toBe(false);

    app.destroy();
    el.remove();
  });

  it('pieChart slice fill follows theme series after setUiTheme', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'canvas' });
    const pie = createDashboardFromJSON(
      'pieChart',
      { data: [30, 25, 20, 25], size: 120, x: 0, y: 0, showLabels: false },
      app
    )! as Group;
    app.add(pie);

    app.setUiTheme({ primary: '#059669' }, { replace: true });
    expect(findStroke(pie, '#059669')).toBe(true);

    app.destroy();
    el.remove();
  });

  it('heatmap cells use themed primary ramp after setUiTheme', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'canvas' });
    const heat = createDashboardFromJSON(
      'heatmap',
      {
        matrix: [
          [1, 4],
          [2, 8],
        ],
        width: 120,
        height: 80,
        x: 0,
        y: 0,
      },
      app
    )! as Group;
    app.add(heat);

    app.setUiTheme({ primary: '#0284c7' }, { replace: true });
    // heatmapHigh resolves to primary — high-intensity cell should contain themed rgb
    const hasThemed = walkFind(heat, (n) => {
      const fill = (n as Node & { fill?: string }).fill ?? '';
      return fill.includes('2') && fill.includes('132') && fill.includes('199'); // #0284c7 → rgb(2,132,199)
    });
    expect(hasThemed).toBeTruthy();

    app.destroy();
    el.remove();
  });

  it('gauge needle still retints (registry rebuild path)', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'canvas' });
    const gauge = createDashboardFromJSON('gauge', { value: 40, diameter: 100, x: 0, y: 0 }, app)!;
    app.add(gauge);
    app.setUiTheme({ primary: '#7c3aed' }, { replace: true });
    const needle = getParts(gauge).needle as { stroke?: string; fill?: string };
    expect(needle.stroke ?? needle.fill).toBe('#7c3aed');
    app.destroy();
    el.remove();
  });

  it('user-supplied series.color is preserved across setUiTheme', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'canvas' });
    const chart = createDashboardFromJSON(
      'lineChart',
      {
        series: [{ name: 'Custom', data: [1, 2, 3, 4], color: '#111111' }],
        width: 200,
        height: 100,
        x: 0,
        y: 0,
      },
      app
    )! as Group;
    app.add(chart);

    app.setUiTheme({ primary: '#7c3aed' }, { replace: true });
    // User series stroke stays; chrome may use theme primary (grid/tooltip) — that's OK
    expect(findStroke(chart, '#111111')).toBe(true);

    app.destroy();
    el.remove();
  });
});
