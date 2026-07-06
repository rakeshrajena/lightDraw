import { describe, it, expect, afterEach } from 'vitest';
import { createDashboardFromJSON } from '../../src/dashboard/registry';
import { CHART_TYPES } from '../../src/dashboard/charts/registerAll';
import { syntheticEvent } from '../../src/components/helpers';
import { createTestApp, createTestContainer } from '../helpers';
import { chartTestProps, NON_INTERACTIVE_CHARTS } from './chartTestProps';

function probeUntilTooltip(chart: import('../../src/shapes/Group').Group): boolean {
  const ox = chart.x;
  const oy = chart.y;
  const probes = [
    [40, 40],
    [80, 60],
    [120, 80],
    [60, 100],
    [140, 50],
    [100, 30],
    [160, 90],
    [50, 70],
    [130, 40],
  ];
  for (const [dx, dy] of probes) {
    chart.emit('mousemove', syntheticEvent('mousemove', chart, { worldX: ox + dx, worldY: oy + dy }));
    const parts = chart.metadata._parts as { tooltip?: { visible?: boolean } } | undefined;
    if (parts?.tooltip?.visible) return true;
  }
  return false;
}

describe('Chart hover tooltips', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  for (const type of CHART_TYPES) {
    if (NON_INTERACTIVE_CHARTS.has(type)) {
      it(`${type} skips hover when minimal`, () => {
        const container = createTestContainer();
        const app = createTestApp(container, { renderer: 'html' });
        const chart = createDashboardFromJSON(type, chartTestProps(type), app)!;
        app.add(chart);
        chart.emit('mousemove', syntheticEvent('mousemove', chart, { worldX: 80, worldY: 60 }));
        const parts = chart.metadata._parts as { tooltip?: { visible?: boolean } } | undefined;
        expect(parts?.tooltip?.visible).not.toBe(true);
        app.destroy();
      });
      continue;
    }

    it(`${type} shows tooltip on hover`, () => {
      const container = createTestContainer();
      const app = createTestApp(container, { renderer: 'html' });
      const props = chartTestProps(type);
      const chart = createDashboardFromJSON(type, props, app)!;
      app.add(chart);
      app.render();

      let hovered: unknown;
      chart.on('hover', (e: unknown) => {
        hovered = e;
      });

      expect(probeUntilTooltip(chart)).toBe(true);
      app.render();

      expect(hovered).toBeDefined();
      const parts = chart.metadata._parts as {
        tooltip?: { visible?: boolean };
        tooltipLabel?: { text?: string };
      };
      expect(parts?.tooltip?.visible).toBe(true);
      expect(parts?.tooltipLabel?.text).toBeTruthy();
      app.destroy();
    });
  }
});
