import { describe, it, expect, afterEach } from 'vitest';
import { createDashboardFromJSON } from '../../src/dashboard/registry';
import { installChartResizeObserver, detachChartResizeObserver } from '../../src/dashboard/charts/core/responsive';
import { createTestApp, createTestContainer } from '../helpers';

describe('responsive charts', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('calendar scales cells to fit width and height', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const cal = createDashboardFromJSON(
      'calendar',
      { width: 180, height: 160, x: 0, y: 0, highlightDay: 5 },
      app
    )!;
    app.add(cal);
    app.render();
    const state = cal.metadata.widgetState as { cell?: number; height?: number };
    expect(state.cell).toBeGreaterThan(0);
    expect(state.cell).toBeLessThanOrEqual(26);
    expect(state.height).toBeLessThanOrEqual(164);
    app.destroy();
  });

  it('calendarHeatmap cells fit inside bounds', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const chart = createDashboardFromJSON(
      'calendarHeatmap',
      { width: 140, height: 80, x: 0, y: 0 },
      app
    )!;
    app.add(chart);
    app.render();
    const rects = chart.children.filter((c) => c.type === 'rect' && (c as { cornerRadius?: number }).cornerRadius) as {
      x: number;
      y: number;
      width: number;
      height: number;
    }[];
    expect(rects.length).toBeGreaterThan(0);
    for (const r of rects) {
      expect(r.x + r.width).toBeLessThanOrEqual(140);
      expect(r.y + r.height).toBeLessThanOrEqual(80);
    }
    app.destroy();
  });

  it('installChartResizeObserver attaches without throwing', () => {
    const wrap = document.createElement('div');
    wrap.style.width = '200px';
    wrap.style.height = '120px';
    document.body.appendChild(wrap);
    const app = createTestApp(wrap, { renderer: 'html', width: 200, height: 120, autoResize: false });
    const chart = createDashboardFromJSON('lineChart', { width: 200, height: 120, data: [1, 2, 3], x: 0, y: 0 }, app)!;
    app.add(chart);
    app.render();
    expect(() => installChartResizeObserver(chart, wrap)).not.toThrow();
    expect(chart.metadata.resizeObserverAttached).toBe(true);
    detachChartResizeObserver(chart);
    app.destroy();
    wrap.remove();
  });

  it('multi-series legend stays inside chart height', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const height = 140;
    const width = 240;
    const chart = createDashboardFromJSON(
      'stackedColumnChart',
      {
        width,
        height,
        x: 0,
        y: 0,
        series: [
          { name: 'A', data: [12, 18, 10] },
          { name: 'B', data: [8, 14, 16] },
          { name: 'C', data: [6, 9, 7] },
        ],
      },
      app
    )!;
    app.add(chart);
    app.render();
    const texts = chart.children.filter((c) => c.type === 'text') as { y: number; fontSize?: number }[];
    const legendTexts = texts.filter((t) => String((t as { text?: string }).text ?? '').length > 0);
    for (const t of legendTexts) {
      expect(t.y + (t.fontSize ?? 11)).toBeLessThanOrEqual(height);
    }
    app.destroy();
  });
});
