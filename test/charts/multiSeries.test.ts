import { describe, it, expect, afterEach } from 'vitest';
import { createDashboardFromJSON } from '../../src/dashboard/registry';
import { syntheticEvent } from '../../src/components/helpers';
import { dataBounds, defaultLayout, seriesToPoints, barGeometry, stackedHorizontalBarGeometry } from '../../src/dashboard/chartPrimitives';
import { createTestApp, createTestContainer } from '../helpers';

describe('Multi-series chart interactions', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('ribbonChart tooltip lists all series at index', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const chart = createDashboardFromJSON(
      'ribbonChart',
      {
        width: 240,
        height: 140,
        x: 0,
        y: 0,
        series: [
          { name: 'A', data: [12, 28, 18, 42] },
          { name: 'B', data: [8, 22, 30, 26] },
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

  it('lineChart with same-color series in chartPanel shows all values on hover', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const panel = createDashboardFromJSON(
      'chartPanel',
      {
        width: 260,
        height: 160,
        x: 40,
        y: 30,
        chartType: 'lineChart',
        series: [
          { name: 'North', data: [10, 20, 30, 40], color: '#60a5fa' },
          { name: 'South', data: [8, 18, 22, 36], color: '#60a5fa' },
        ],
      },
      app
    )!;
    app.add(panel);
    app.render();

    const chart = (panel.metadata._parts as { chart?: import('../../src/shapes/Group').Group }).chart!;
    const innerW = 260 - 16;
    const innerH = 160 - 26 - 8;
    const layout = defaultLayout(innerW, innerH, 30, 2 * 18 + 8);
    const bounds = dataBounds([10, 20, 30, 40, 8, 18, 22, 36]);
    const pts = seriesToPoints([10, 20, 30, 40], layout, bounds);
    const idx = 2;
    const worldX = panel.x + chart.x + pts[idx * 2];
    const worldY = panel.y + chart.y + layout.plotY + layout.plotHeight / 2;
    chart.emit('mousemove', syntheticEvent('mousemove', panel, { worldX, worldY }));
    app.render();

    const parts = chart.metadata._parts as { tooltipLabel?: { text?: string }; tooltip?: { visible?: boolean } };
    expect(parts.tooltip?.visible).toBe(true);
    expect(parts.tooltipLabel?.text).toContain('North:');
    expect(parts.tooltipLabel?.text).toContain('South:');
    app.destroy();
  });

  it('horizonChart with multiple series shows all values on hover', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const chart = createDashboardFromJSON(
      'horizonChart',
      {
        width: 240,
        height: 140,
        x: 0,
        y: 0,
        series: [
          { name: 'Alpha', data: [4, 8, 6, 12] },
          { name: 'Beta', data: [2, 5, 9, 7] },
        ],
      },
      app
    )!;
    app.add(chart);
    app.render();
    chart.emit('mousemove', syntheticEvent('mousemove', chart, { worldX: 140, worldY: 70 }));
    app.render();
    const parts = chart.metadata._parts as { tooltipLabel?: { text?: string } };
    expect(parts.tooltipLabel?.text).toContain('Alpha:');
    expect(parts.tooltipLabel?.text).toContain('Beta:');
    app.destroy();
  });

  it('stackedColumnChart tooltip lists each series segment', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const chart = createDashboardFromJSON(
      'stackedColumnChart',
      {
        width: 240,
        height: 140,
        x: 0,
        y: 0,
        series: [
          { name: 'Alpha', data: [12, 18, 10] },
          { name: 'Beta', data: [8, 14, 16] },
          { name: 'Gamma', data: [6, 9, 7] },
        ],
      },
      app
    )!;
    app.add(chart);
    app.render();

    const totals = [26, 41, 33];
    const layout = defaultLayout(240, 140, 30, 3 * 18 + 8);
    const bounds = dataBounds(totals);
    const geo = barGeometry(1, 3, totals[1], layout, bounds, 0.2);
    chart.emit('mousemove', syntheticEvent('mousemove', chart, { worldX: geo.centerX, worldY: layout.plotY + 40 }));
    app.render();

    const parts = chart.metadata._parts as { tooltipLabel?: { text?: string }; tooltip?: { visible?: boolean } };
    expect(parts.tooltip?.visible).toBe(true);
    expect(parts.tooltipLabel?.text).toContain('Alpha:');
    expect(parts.tooltipLabel?.text).toContain('Beta:');
    expect(parts.tooltipLabel?.text).toContain('Gamma:');
    app.destroy();
  });

  it('stackedBarChart tooltip lists each series segment', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const chart = createDashboardFromJSON(
      'stackedBarChart',
      {
        width: 240,
        height: 140,
        x: 0,
        y: 0,
        series: [
          { name: 'Alpha', data: [12, 18, 10] },
          { name: 'Beta', data: [8, 14, 16] },
          { name: 'Gamma', data: [6, 9, 7] },
        ],
      },
      app
    )!;
    app.add(chart);
    app.render();

    const totals = [26, 41, 33];
    const layout = defaultLayout(240, 140, 30, 3 * 18 + 8);
    const bounds = dataBounds(totals);
    const geo = stackedHorizontalBarGeometry(1, 3, totals[1], layout, bounds, 0.2);

    chart.emit('mousemove', syntheticEvent('mousemove', chart, { worldX: layout.plotX + geo.width / 2, worldY: geo.centerY }));
    app.render();

    const parts = chart.metadata._parts as { tooltipLabel?: { text?: string }; tooltip?: { visible?: boolean } };
    expect(parts.tooltip?.visible).toBe(true);
    expect(parts.tooltipLabel?.text).toContain('Alpha:');
    expect(parts.tooltipLabel?.text).toContain('Beta:');
    expect(parts.tooltipLabel?.text).toContain('Gamma:');
    app.destroy();
  });

  it('streamgraph tooltip lists each layer value', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const chart = createDashboardFromJSON(
      'streamgraph',
      {
        width: 240,
        height: 140,
        x: 0,
        y: 0,
        series: [
          [10, 12, 8],
          [8, 10, 12],
          [6, 7, 9],
        ],
      },
      app
    )!;
    app.add(chart);
    app.render();
    chart.emit('mousemove', syntheticEvent('mousemove', chart, { worldX: 120, worldY: 70 }));
    app.render();
    const parts = chart.metadata._parts as { tooltipLabel?: { text?: string } };
    expect(parts.tooltipLabel?.text).toContain('S1:');
    expect(parts.tooltipLabel?.text).toContain('S2:');
    expect(parts.tooltipLabel?.text).toContain('S3:');
    app.destroy();
  });
});
