import { describe, it, expect, afterEach } from 'vitest';
import { createDashboardFromJSON } from '../../src/dashboard/registry';
import { syntheticEvent } from '../../src/components/helpers';
import { barGeometry, dataBounds, defaultLayout } from '../../src/dashboard/chartPrimitives';
import { createTestApp, createTestContainer } from '../helpers';

describe('Bar chart hover alignment', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('highlight rect matches drawn bar band position', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const data = [34, 52, 41, 68, 55];
    const width = 200;
    const height = 120;
    const chart = createDashboardFromJSON(
      'barChart',
      { data, width, height, x: 0, y: 0 },
      app
    )!;
    app.add(chart);
    app.render();

    const state = chart.metadata.widgetState as {
      data: number[];
      width: number;
      height: number;
    };
    const layout = defaultLayout(width, height, 30, 26);
    const bounds = dataBounds(data);
    const targetIndex = 2;
    const geo = barGeometry(targetIndex, data.length, data[targetIndex], layout, bounds, 0.2);
    const probeX = geo.centerX;
    const probeY = layout.plotY + layout.plotHeight / 2;

    chart.emit('mousemove', syntheticEvent('mousemove', chart, { worldX: probeX, worldY: probeY }));
    app.render();

    const parts = chart.metadata._parts as {
      highlight?: { x: number; y: number; width: number; height: number; visible?: boolean };
      tooltip?: { visible?: boolean };
    };
    expect(parts.highlight?.visible).toBe(true);
    expect(parts.highlight?.x).toBeCloseTo(geo.x, 0);
    expect(parts.highlight?.width).toBeCloseTo(geo.width, 0);
    expect(parts.tooltip?.visible).toBe(true);
    expect(state.data[targetIndex]).toBe(data[targetIndex]);
    app.destroy();
  });
});
