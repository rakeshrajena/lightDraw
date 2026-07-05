import { describe, it, expect, afterEach } from 'vitest';
import {
  createDashboardFromJSON,
  animateLiveValue,
  dashboardToJSON,
} from '../src/dashboard/registry';
import { setLiveValue } from '../src/dashboard/helpers';
import { computeTicks, dataBounds } from '../src/dashboard/chartPrimitives';
import { toJSON } from '../src/io/json';
import { syntheticEvent } from '../src/components/helpers';
import { createTestApp, createTestContainer, measureAverageMs } from './helpers';

const PHASE7_WIDGETS = [
  'gauge',
  'speedometer',
  'lineChart',
  'areaChart',
  'barChart',
  'pieChart',
  'legend',
  'thermometer',
  'compass',
  'calendar',
  'timeline',
  'signalStrength',
  'knob',
  'meter',
  'battery',
  'clock',
] as const;

describe('Phase 7 — Dashboard Module', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  for (const type of PHASE7_WIDGETS) {
    it(`${type} renders without error`, () => {
      const container = createTestContainer();
      const app = createTestApp(container, { renderer: 'html' });
      const node = createDashboardFromJSON(type, { x: 10, y: 10 }, app);
      expect(node).toBeTruthy();
      app.add(node!);
      expect(() => app.render()).not.toThrow();
      app.destroy();
    });
  }

  it('computeTicks returns correct count for range', () => {
    const ticks = computeTicks(0, 100, 5);
    expect(ticks).toHaveLength(5);
    expect(ticks[0]).toBe(0);
    expect(ticks[4]).toBe(100);
    expect(computeTicks(0, 10, 1)).toEqual([0]);
  });

  it('dataBounds handles flat data', () => {
    const b = dataBounds([5, 5, 5]);
    expect(b.max).toBeGreaterThan(b.min);
  });

  it('areaChart includes filled path and axes', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const chart = createDashboardFromJSON(
      'areaChart',
      { data: [10, 40, 30, 60], width: 280, height: 140, x: 0, y: 0 },
      app
    )!;
    app.add(chart);
    app.render();
    expect(chart.children.length).toBeGreaterThan(3);
    app.destroy();
  });

  it('lineChart JSON round-trip preserves widget type', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const chart = createDashboardFromJSON(
      'lineChart',
      { data: [1, 2, 3], width: 200, height: 100 },
      app
    )!;
    app.add(chart);
    const json = toJSON(chart);
    expect(json.type).toBe('lineChart');
    expect(json.props?.data).toEqual([1, 2, 3]);
    app.destroy();
  });

  it('dashboardToJSON exports widget state', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const gauge = createDashboardFromJSON('gauge', { value: 55, size: 100 }, app)!;
    const json = dashboardToJSON(gauge);
    expect(json.type).toBe('gauge');
    expect(json.props?.value).toBe(55);
    app.destroy();
  });

  it('animateLiveValue updates gauge from 0 toward 100', async () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const gauge = createDashboardFromJSON('gauge', { value: 0, max: 100, size: 100, x: 0, y: 0 }, app)!;
    app.add(gauge);
    animateLiveValue(gauge, 'value', 100, 200);
    await new Promise((r) => setTimeout(r, 250));
    const state = gauge.metadata.widgetState as { value: number };
    expect(state.value).toBeGreaterThan(50);
    app.destroy();
  });

  it('lineChart hover emits hover event', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const chart = createDashboardFromJSON(
      'lineChart',
      { data: [10, 20, 30, 40], width: 200, height: 100, x: 10, y: 10 },
      app
    )!;
    app.add(chart);
    let hovered: unknown;
    chart.on('hover', (e: { index?: number }) => {
      hovered = e.index;
    });
    chart.emit('mousemove', syntheticEvent('mousemove', chart, { worldX: 80, worldY: 50 }));
    expect(hovered).toBeDefined();
    app.destroy();
  });

  it('knob click emits change', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const knob = createDashboardFromJSON('knob', { value: 0, x: 10, y: 10 }, app)!;
    app.add(knob);
    let changed: unknown;
    knob.on('change', (e: { value?: unknown }) => {
      changed = e.value;
    });
    knob.emit('click', syntheticEvent('click', knob));
    expect(changed).toBe(10);
    app.destroy();
  });

  it('8-widget dashboard renders within performance budget', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'canvas' });
    const widgets = [
      ['gauge', { value: 40, size: 80, x: 0, y: 0 }],
      ['speedometer', { value: 60, size: 100, x: 90, y: 0 }],
      ['lineChart', { data: [1, 2, 3], width: 120, height: 80, x: 0, y: 90 }],
      ['thermometer', { value: 70, x: 130, y: 90 }],
      ['compass', { heading: 45, size: 80, x: 170, y: 0 }],
      ['battery', { value: 80, x: 260, y: 0 }],
      ['meter', { value: 55, width: 100, x: 260, y: 30 }],
      ['signalStrength', { value: 4, x: 260, y: 60 }],
    ] as const;
    for (const [type, props] of widgets) {
      app.add(createDashboardFromJSON(type, props, app)!);
    }
    app.render();
    const avg = measureAverageMs(() => app.render(), 5);
    expect(avg).toBeLessThan(24);
    app.destroy();
  });

  it('vertical meter and chart click select', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    app.add(createDashboardFromJSON('meter', { vertical: true, value: 40, x: 0, y: 0 }, app)!);
    const chart = createDashboardFromJSON(
      'lineChart',
      { data: [5, 15, 25], width: 150, height: 80, x: 10, y: 10 },
      app
    )!;
    app.add(chart);
    let selected: unknown;
    chart.on('select', (e: { index?: number }) => { selected = e.index; });
    chart.emit('click', syntheticEvent('click', chart, { worldX: 60 }));
    expect(selected).toBeDefined();
    app.render();
    app.destroy();
  });

  it('setLiveValue updates thermometer immediately', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const thermo = createDashboardFromJSON('thermometer', { value: 20, x: 0, y: 0 }, app)!;
    app.add(thermo);
    setLiveValue(thermo, 'value', 90);
    expect((thermo.metadata.widgetState as { value: number }).value).toBe(90);
    app.destroy();
  });

  it('line chart with 1000 data points renders within budget', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'canvas' });
    const data = Array.from({ length: 1000 }, (_, i) => Math.sin(i / 20) * 50 + 50);
    app.add(
      createDashboardFromJSON(
        'lineChart',
        { data, width: 400, height: 200, interactive: false, showLegend: false, x: 0, y: 0 },
        app
      )!
    );
    app.render();
    const avg = measureAverageMs(() => app.render(), 3);
    expect(avg).toBeLessThan(32);
    app.destroy();
  });
});
