import { describe, it, expect, afterEach } from 'vitest';
import { createDashboardFromJSON } from '../../src/dashboard/registry';
import { CHART_TYPES } from '../../src/dashboard/charts/registerAll';
import { toHeikinAshi, toRenko } from '../../src/dashboard/charts/core/financial';
import { histogramBins } from '../../src/dashboard/charts/core/stats';
import { createTestApp, createTestContainer } from '../helpers';

describe('Chart catalog', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('exports 85 chart type ids', () => {
    expect(CHART_TYPES.length).toBe(85);
  });

  for (const type of CHART_TYPES) {
    it(`${type} renders on html renderer`, () => {
      const container = createTestContainer();
      const app = createTestApp(container, { renderer: 'html' });
      const node = createDashboardFromJSON(type, { x: 0, y: 0, width: 200, height: 120 }, app);
      expect(node).toBeTruthy();
      app.add(node!);
      expect(() => app.render()).not.toThrow();
      app.destroy();
    });
  }

  it('financial transforms produce valid OHLC output', () => {
    const bars = [
      { time: '1', open: 10, high: 12, low: 9, close: 11 },
      { time: '2', open: 11, high: 13, low: 10, close: 12 },
    ];
    expect(toHeikinAshi(bars).length).toBe(2);
    expect(toRenko(bars, 1).length).toBeGreaterThan(0);
  });

  it('histogram bins cover input range', () => {
    const bins = histogramBins([1, 2, 3, 4, 5], 5);
    expect(bins.length).toBe(5);
    expect(bins.reduce((a, b) => a + b.count, 0)).toBe(5);
  });
});
