/**
 * ThemePack — JSON-first design system (mode expansion, module packs, scene.theme).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestApp, createTestContainer } from '../helpers';
import { resolveUiTheme } from '../../src/components/uiTheme';
import {
  normalizeThemePack,
  extractSceneTheme,
  mergeThemePacks,
} from '../../src/theme/themePack';
import { resolveDashboardTheme, getActiveDashboard, syncActiveDashboardTheme, DASHBOARD } from '../../src/dashboard/theme';
import type { Group } from '../../src/shapes/Group';
import type { Node } from '../../src/Node';

function findStroke(node: Node, color: string): boolean {
  const n = node as Node & { stroke?: string | null; fill?: string };
  if (n.stroke === color || n.fill === color) return true;
  if ('children' in node) {
    return (node as Group).children.some((c) => findStroke(c, color));
  }
  return false;
}

describe('resolveUiTheme complete presets', () => {
  it('dark preset includes dark surfaces for all modules', () => {
    const resolved = resolveUiTheme({ preset: 'dark' });
    expect(resolved.primary).toBe('#3b82f6');
    expect(resolved.surface).toBe('#1e293b');
    expect(resolved.text).toBe('#f1f5f9');
  });

  it('violet preset is a full light pack', () => {
    const resolved = resolveUiTheme({ preset: 'violet' });
    expect(resolved.primary).toBe('#7c3aed');
    expect(resolved.surface).toBe('#ffffff');
    expect(resolved.text).toBe('#0f172a');
  });

  it('strips legacy mode from resolved tokens', () => {
    const resolved = resolveUiTheme({ preset: 'violet', mode: 'dark' } as never);
    expect(resolved.surface).toBe('#ffffff');
    expect((resolved as { mode?: string }).mode).toBeUndefined();
  });

  it('keeps empty resolve empty (baseline defaults)', () => {
    expect(resolveUiTheme({})).toEqual({});
  });
});

describe('ThemePack helpers', () => {
  it('normalizes nested tokens object', () => {
    const pack = normalizeThemePack({
      preset: 'ocean',
      tokens: { primary: '#0ea5e9' },
      series: ['#0ea5e9', '#f43f5e'],
    });
    expect(pack.preset).toBe('ocean');
    expect(pack.primary).toBe('#0ea5e9');
    expect(pack.series).toEqual(['#0ea5e9', '#f43f5e']);
  });

  it('extracts theme from scene JSON', () => {
    const { theme, scene } = extractSceneTheme({
      theme: { preset: 'rose' },
      type: 'group',
      children: [],
    });
    expect(theme?.preset).toBe('rose');
    expect(scene.type).toBe('group');
    expect('theme' in scene).toBe(false);
  });

  it('merges packs and replaces series', () => {
    const merged = mergeThemePacks(
      { preset: 'slate', series: ['#111', '#222'], dashboard: { chartGrid: '#333' } },
      { primary: '#ff00aa', series: ['#aaa', '#bbb'] }
    );
    expect(merged.preset).toBe('slate');
    expect(merged.primary).toBe('#ff00aa');
    expect(merged.series).toEqual(['#aaa', '#bbb']);
    expect(merged.dashboard?.chartGrid).toBe('#333');
  });
});

describe('App applyTheme + loadJSON theme', () => {
  beforeEach(() => {
    syncActiveDashboardTheme({});
  });

  it('applyTheme sets series and dashboard pack', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'canvas' });

    app.applyTheme({
      preset: 'dark',
      series: ['#0ea5e9', '#f43f5e', '#22c55e', '#f59e0b'],
      dashboard: { chartGrid: '#1e293b', heatmapLow: '#0c4a6e' },
    });

    const theme = app.getTheme();
    expect(theme.preset).toBe('dark');
    expect(theme.series?.[0]).toBe('#0ea5e9');
    expect(app.getResolvedTheme().surface).toBe('#1e293b');

    const dash = getActiveDashboard(app);
    expect(dash.series[0]).toBe('#0ea5e9');
    expect(dash.series[1]).toBe('#f43f5e');
    expect(dash.chartGrid).toBe('#1e293b');
    expect(dash.heatmapLow).toBe('#0c4a6e');

    app.destroy();
    el.remove();
  });

  it('loadJSON applies root theme before mounting widgets', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'canvas' });

    app.loadJSON({
      theme: {
        preset: 'emerald',
        primary: '#10b981',
      },
      type: 'group',
      props: { x: 0, y: 0 },
      children: [
        {
          type: 'lineChart',
          props: { data: [10, 20, 30, 25], width: 200, height: 100, x: 0, y: 0 },
        },
      ],
    });

    expect(app.getTheme().preset).toBe('emerald');
    expect(app.getResolvedTheme().primary).toBe('#10b981');
    expect(findStroke(app.stage, '#10b981')).toBe(true);

    const exported = app.exportJSON({ includeTheme: true });
    expect(exported.theme?.preset).toBe('emerald');

    app.destroy();
    el.remove();
  });

  it('resolveDashboardTheme pack overrides series', () => {
    const dash = resolveDashboardTheme(
      { primary: '#111111' },
      { series: ['#aaaaaa', '#bbbbbb', '#cccccc', '#dddddd'], chartGrid: '#eeeeee' }
    );
    expect(dash.series[0]).toBe('#aaaaaa');
    expect(dash.chartGrid).toBe('#eeeeee');
    expect(dash.primary).toBe('#111111');
  });

  it('preset themes remap accents; light packs keep dark dial/chart chrome', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'canvas' });

    app.applyTheme({ preset: 'ocean' });
    const light = getActiveDashboard(app);
    // Light UI surfaces must not wash gauges/charts white
    expect(light.chartBg).toBe(DASHBOARD.chartBg);
    expect(light.panel).toBe(DASHBOARD.panel);
    expect(light.primary).toBe('#0284c7');
    // Dark chrome + light UI text → ensureReadableChartText flips ink light for contrast
    expect(light.text).toBe('#f1f5f9');

    app.applyTheme({ preset: 'dark' });
    const dark = getActiveDashboard(app);
    expect(dark.chartBg).toBe('#0f172a');
    expect(dark.panel).toBe('#1e293b');
    expect(dark.text).toBe('#f1f5f9');

    app.destroy();
    el.remove();
  });
});
