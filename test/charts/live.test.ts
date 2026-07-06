import { describe, it, expect, afterEach } from 'vitest';
import { createDashboardFromJSON, pushChartValue, updateChartProps } from '../../src/dashboard/registry';
import { createTestApp, createTestContainer } from '../helpers';

describe('Chart live data', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('lineChart rebuilds when data is pushed', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const chart = createDashboardFromJSON(
      'lineChart',
      { data: [10, 20, 30], width: 200, height: 100, x: 0, y: 0 },
      app
    )!;
    app.add(chart);
    app.render();
    pushChartValue(chart, 42);
    app.render();
    expect((chart.metadata.widgetState as { data: number[] }).data).toContain(42);
    expect(chart.metadata.chartRebuild).toBeTypeOf('function');
    app.destroy();
  });

  it('pieChart rebuilds on updateChartProps', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const pie = createDashboardFromJSON(
      'pieChart',
      { data: [30, 20, 50], size: 120, width: 200, height: 120, x: 0, y: 0 },
      app
    )!;
    app.add(pie);
    app.render();
    updateChartProps(pie, { data: [10, 10, 80] });
    app.render();
    expect((pie.metadata.widgetState as { data: number[] }).data[2]).toBe(80);
    app.destroy();
  });
});
