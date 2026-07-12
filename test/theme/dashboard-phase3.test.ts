/**
 * Phase 3 — dashboard widgets/charts follow app theme and refresh on setUiTheme.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestApp, createTestContainer } from '../helpers';
import { createDashboardFromJSON } from '../../src/dashboard/registry';
import { getParts } from '../../src/dashboard/helpers';
import {
  DASHBOARD,
  resolveDashboardTheme,
  getActiveDashboard,
  syncActiveDashboardTheme,
} from '../../src/dashboard/theme';

describe('Phase 3 — dashboard theme', () => {
  beforeEach(() => {
    syncActiveDashboardTheme({});
  });

  it('empty resolveDashboardTheme matches DASHBOARD defaults', () => {
    const theme = resolveDashboardTheme();
    expect(theme.primary).toBe(DASHBOARD.primary);
    expect(theme.gaugeNeedle).toBe(DASHBOARD.gaugeNeedle);
    expect(theme.chartLine).toBe(DASHBOARD.chartLine);
    expect(theme.series[0]).toBe(DASHBOARD.series[0]);
  });

  it('resolveDashboardTheme maps primary into needles and series[0]', () => {
    const theme = resolveDashboardTheme({ primary: '#7c3aed' });
    expect(theme.primary).toBe('#7c3aed');
    expect(theme.gaugeNeedle).toBe('#7c3aed');
    expect(theme.chartLine).toBe('#7c3aed');
    expect(theme.barFill).toBe('#7c3aed');
    expect(theme.series[0]).toBe('#7c3aed');
    expect(theme.panel).toBe(DASHBOARD.panel);
  });

  it('light UI packs keep dark dial chrome (no white gauges)', () => {
    const theme = resolveDashboardTheme({
      primary: '#7c3aed',
      surface: '#ffffff',
      surfaceMuted: '#f8fafc',
      surfaceInset: '#f1f5f9',
      border: '#e2e8f0',
      text: '#0f172a',
      textMuted: '#64748b',
    });
    expect(theme.gaugeNeedle).toBe('#7c3aed');
    expect(theme.face).toBe(DASHBOARD.face);
    expect(theme.chartPlot).toBe(DASHBOARD.chartPlot);
    expect(theme.gaugeTrack).toBe(DASHBOARD.gaugeTrack);
  });

  it('dark UI packs still remap dial face', () => {
    const theme = resolveDashboardTheme({
      primary: '#38bdf8',
      surface: '#1e293b',
      surfaceMuted: '#0f172a',
      surfaceInset: '#334155',
      border: '#334155',
      text: '#f1f5f9',
    });
    expect(theme.face).toBe('#0f172a');
    expect(theme.gaugeNeedle).toBe('#38bdf8');
  });

  it('gauge created with uiTheme uses themed needle color', () => {
    const el = createTestContainer();
    const app = createTestApp(el, {
      renderer: 'canvas',
      uiTheme: { preset: 'violet' },
    });
    const gauge = createDashboardFromJSON('gauge', { value: 40, size: 120, x: 0, y: 0 }, app)!;
    app.add(gauge);
    const needle = getParts(gauge).needle as { stroke?: string; fill?: string };
    const color = needle.stroke ?? needle.fill;
    expect(color).toBe('#7c3aed');
    app.destroy();
    el.remove();
  });

  it('setUiTheme rebuilds gauge needle to new primary', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'canvas' });
    const gauge = createDashboardFromJSON('gauge', { value: 55, size: 100, x: 0, y: 0 }, app)!;
    app.add(gauge);

    expect(getActiveDashboard().gaugeNeedle).toBe(DASHBOARD.gaugeNeedle);

    app.setUiTheme({ primary: '#059669' });
    expect(getActiveDashboard().primary).toBe('#059669');
    const needle = getParts(gauge).needle as { stroke?: string; fill?: string };
    expect(needle.stroke ?? needle.fill).toBe('#059669');

    app.destroy();
    el.remove();
  });

  it('lineChart series color follows theme primary after setUiTheme', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'canvas' });
    const chart = createDashboardFromJSON(
      'lineChart',
      { data: [10, 20, 30, 25], width: 240, height: 120, x: 0, y: 0 },
      app
    )!;
    app.add(chart);

    app.setUiTheme({ preset: 'rose' });
    expect(getActiveDashboard().chartLine).toBe('#e11d48');
    expect(getActiveDashboard().series[0]).toBe('#e11d48');
    // Rebuild keeps widget on stage
    expect(chart.metadata?.widgetType).toBe('lineChart');
    expect((chart as { children: unknown[] }).children.length).toBeGreaterThan(0);

    app.destroy();
    el.remove();
  });
});
