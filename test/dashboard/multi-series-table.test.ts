import { describe, it, expect, afterEach } from 'vitest';
import { createDashboardFromJSON } from '../../src/dashboard/registry';
import { parseSeries } from '../../src/dashboard/charts/core/series';
import { filterTableRows } from '../../src/dashboard/definitions/dataTable';
import { getState } from '../../src/dashboard/helpers';
import { getActiveDashboard } from '../../src/dashboard/theme';
import { syntheticEvent } from '../../src/components/helpers';
import { dataBounds, defaultLayout, barGeometry } from '../../src/dashboard/chartPrimitives';
import { createTestApp, createTestContainer } from '../helpers';

describe('Multi-series colors and grouped bars', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('assigns unique palette colors when series.color is omitted', () => {
    const series = parseSeries({
      series: [
        { name: 'A', data: [1, 2, 3] },
        { name: 'B', data: [3, 2, 1] },
        { name: 'C', data: [2, 2, 2] },
      ],
    });
    const palette = getActiveDashboard().series;
    expect(series[0].color).toBe(palette[0]);
    expect(series[1].color).toBe(palette[1]);
    expect(series[2].color).toBe(palette[2]);
    expect(new Set(series.map((s) => s.color)).size).toBe(3);
  });

  it('keeps user-supplied series colors', () => {
    const series = parseSeries(
      {
        series: [
          { name: 'A', data: [1, 2], color: '#111111' },
          { name: 'B', data: [2, 1], color: '#222222' },
        ],
      },
      [1, 2],
      { keepColors: true }
    );
    expect(series[0].color).toBe('#111111');
    expect(series[1].color).toBe('#222222');
  });

  it('barChart multi-series hover lists all series', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const chart = createDashboardFromJSON(
      'barChart',
      {
        width: 240,
        height: 140,
        x: 0,
        y: 0,
        series: [
          { name: 'North', data: [12, 18, 10] },
          { name: 'South', data: [8, 14, 16] },
        ],
      },
      app
    )!;
    app.add(chart);
    app.render();

    const maxes = [12, 18, 16];
    const layout = defaultLayout(240, 140, 30, 2 * 18 + 8);
    const bounds = dataBounds(maxes);
    const geo = barGeometry(1, 3, maxes[1], layout, bounds, 0.2);
    chart.emit('mousemove', syntheticEvent('mousemove', chart, { worldX: geo.centerX, worldY: layout.plotY + 40 }));
    app.render();

    const parts = chart.metadata._parts as { tooltipLabel?: { text?: string }; tooltip?: { visible?: boolean } };
    expect(parts.tooltip?.visible).toBe(true);
    expect(parts.tooltipLabel?.text).toContain('North:');
    expect(parts.tooltipLabel?.text).toContain('South:');
    app.destroy();
  });

  it('lineChart multi-series without colors still shows multi hover', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const chart = createDashboardFromJSON(
      'lineChart',
      {
        width: 240,
        height: 140,
        x: 0,
        y: 0,
        series: [
          { name: 'A', data: [10, 20, 30, 40] },
          { name: 'B', data: [8, 18, 22, 36] },
        ],
      },
      app
    )!;
    app.add(chart);
    app.render();
    chart.emit('mousemove', syntheticEvent('mousemove', chart, { worldX: 120, worldY: 70 }));
    app.render();
    const parts = chart.metadata._parts as { tooltipLabel?: { text?: string } };
    expect(parts.tooltipLabel?.text).toContain('A:');
    expect(parts.tooltipLabel?.text).toContain('B:');
    app.destroy();
  });
});

describe('Dashboard dataTable', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('filterTableRows matches any cell', () => {
    const rows = [
      ['Alpha', 'OK'],
      ['Beta', 'Warn'],
      ['Gamma', 'OK'],
    ];
    expect(filterTableRows(rows, 'beta')).toEqual([['Beta', 'Warn']]);
    expect(filterTableRows(rows, 'ok')).toHaveLength(2);
    expect(filterTableRows(rows, '')).toHaveLength(3);
  });

  it('creates dataTable with striped defaults and search filter', () => {
    const container = createTestContainer(320, 220);
    const app = createTestApp(container, { renderer: 'html', width: 320, height: 220 });
    const table = createDashboardFromJSON(
      'dataTable',
      {
        width: 300,
        x: 0,
        y: 0,
        columns: ['Name', 'Status'],
        rows: [
          ['Alpha', 'OK'],
          ['Beta', 'Warn'],
          ['Gamma', 'OK'],
        ],
        showSearch: true,
        search: 'Beta',
        striped: true,
      },
      app
    )!;
    app.add(table);
    app.render();

    const state = getState(table);
    expect(state.showSearch).toBe(true);
    expect(state.striped).toBe(true);
    expect(state.search).toBe('Beta');
    expect(table.metadata.widgetType).toBe('dataTable');
    // Filtered view: search bar + header + 1 data row
    expect(table.children.length).toBeGreaterThan(3);
    app.destroy();
  });
});
