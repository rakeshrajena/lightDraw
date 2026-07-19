/**
 * Value-based colorStops for gauges, meters, and bar charts.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestApp, createTestContainer } from '../helpers';
import { createDashboardFromJSON } from '../../src/dashboard/registry';
import { getParts, setLiveValue } from '../../src/dashboard/helpers';
import {
  resolveValueColor,
  resolveSemanticColor,
  normalizeDialZones,
  readColorStops,
} from '../../src/dashboard/colorStops';
import { syncActiveDashboardTheme, getActiveDashboard } from '../../src/dashboard/theme';
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

describe('resolveValueColor', () => {
  beforeEach(() => {
    syncActiveDashboardTheme({});
  });

  it('picks the first matching stop and resolves semantic tokens', () => {
    const d = getActiveDashboard();
    const stops = [
      { upTo: 40, color: 'success' },
      { upTo: 75, color: 'warning' },
      { color: 'danger' },
    ];
    expect(resolveValueColor(20, stops)).toBe(d.success);
    expect(resolveValueColor(40, stops)).toBe(d.success);
    expect(resolveValueColor(50, stops)).toBe(d.warning);
    expect(resolveValueColor(90, stops)).toBe(d.danger);
  });

  it('passes hex through and falls back when stops are empty', () => {
    expect(resolveSemanticColor('#abc123')).toBe('#abc123');
    expect(resolveValueColor(10, undefined, '#111111')).toBe('#111111');
  });

  it('normalizes absolute dial zones by max', () => {
    const zones = normalizeDialZones(
      [
        { from: 0, to: 55, color: 'success' },
        { from: 55, to: 100, color: 'danger' },
      ],
      100
    );
    expect(zones[0].from).toBe(0);
    expect(zones[0].to).toBe(0.55);
    expect(zones[1].color).toBe(getActiveDashboard().danger);
  });

  it('reads thresholds alias', () => {
    const stops = readColorStops({
      thresholds: [{ upTo: 10, color: 'primary' }, { color: '#ff0000' }],
    });
    expect(stops).toHaveLength(2);
    expect(stops![1].color).toBe('#ff0000');
  });
});

describe('Widgets apply colorStops live', () => {
  beforeEach(() => {
    syncActiveDashboardTheme({});
  });

  it('gauge needle stroke follows value stops', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'canvas' });
    const gauge = createDashboardFromJSON(
      'gauge',
      {
        value: 30,
        max: 100,
        size: 100,
        colorStops: [
          { upTo: 40, color: 'success' },
          { upTo: 75, color: 'warning' },
          { color: 'danger' },
        ],
      },
      app
    )! as Group;
    app.add(gauge);

    const d = getActiveDashboard();
    const needle = getParts(gauge).needle as { stroke: string };
    expect(needle.stroke).toBe(d.success);

    setLiveValue(gauge, 'value', 90);
    expect(needle.stroke).toBe(d.danger);

    app.destroy();
    el.remove();
  });

  it('meter fill follows colorStops', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'canvas' });
    const meter = createDashboardFromJSON(
      'meter',
      {
        value: 20,
        width: 120,
        height: 16,
        colorStops: [
          { upTo: 40, color: 'success' },
          { color: 'danger' },
        ],
      },
      app
    )! as Group;
    app.add(meter);

    const d = getActiveDashboard();
    const fill = walkFind(meter, (n) => (n as { fill?: string }).fill === d.success);
    expect(fill).toBeTruthy();

    setLiveValue(meter, 'value', 80);
    const danger = walkFind(meter, (n) => (n as { fill?: string }).fill === d.danger);
    expect(danger).toBeTruthy();

    app.destroy();
    el.remove();
  });

  it('barChart bars use per-value colorStops', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'canvas' });
    const chart = createDashboardFromJSON(
      'barChart',
      {
        data: [20, 50, 90],
        width: 200,
        height: 120,
        colorStops: [
          { upTo: 30, color: 'success' },
          { upTo: 60, color: 'warning' },
          { color: 'danger' },
        ],
      },
      app
    )! as Group;
    app.add(chart);

    const d = getActiveDashboard();
    expect(walkFind(chart, (n) => (n as { fill?: string }).fill === d.success)).toBeTruthy();
    expect(walkFind(chart, (n) => (n as { fill?: string }).fill === d.warning)).toBeTruthy();
    expect(walkFind(chart, (n) => (n as { fill?: string }).fill === d.danger)).toBeTruthy();

    app.destroy();
    el.remove();
  });

  it('battery scale multiplies geometry only — does not set Node.scale (no double-scale overflow)', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'canvas' });
    const battery = createDashboardFromJSON(
      'battery',
      { value: 78, scale: 1.6, x: 0, y: 0 },
      app
    )! as Group;
    app.add(battery);

    expect(battery.scaleX).toBe(1);
    expect(battery.scaleY).toBe(1);
    const bounds = battery.getBounds();
    // body 40*1.6 + tip ≈ 70; must stay near that, not ~112 from double scale
    expect(bounds.width).toBeGreaterThan(60);
    expect(bounds.width).toBeLessThan(85);

    app.destroy();
    el.remove();
  });
});
