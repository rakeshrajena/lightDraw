import { describe, it, expect, afterEach } from 'vitest';
import { createDashboardFromJSON } from '../../src/dashboard/registry';
import { updateChartProps } from '../../src/dashboard/charts/core/refresh';
import { syntheticEvent } from '../../src/components/helpers';
import { createTestApp, createTestContainer } from '../helpers';

describe('Chart rebuild performance', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('does not stack hover handlers across rebuilds', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const chart = createDashboardFromJSON(
      'lineChart',
      { width: 240, height: 140, x: 0, y: 0, data: [12, 28, 22, 44] },
      app
    )!;
    app.add(chart);
    app.render();

    let hoverCount = 0;
    chart.on('hover', () => {
      hoverCount += 1;
    });

    updateChartProps(chart, { width: 230 });
    updateChartProps(chart, { width: 231 });
    updateChartProps(chart, { width: 232 });

    chart.emit('mousemove', syntheticEvent('mousemove', chart, { worldX: 120, worldY: 70 }));
    expect(hoverCount).toBe(1);
    app.destroy();
  });
});
