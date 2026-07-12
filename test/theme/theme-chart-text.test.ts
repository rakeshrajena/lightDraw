/**
 * Chart text stays readable when applying image presets + dashboard overrides.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestApp, createTestContainer } from '../helpers';
import { syncActiveCanvasUiTheme } from '../../src/components/resolveCanvasTheme';
import {
  getActiveDashboard,
  syncActiveDashboardTheme,
  resolveDashboardTheme,
} from '../../src/dashboard/theme';
import { createDashboardFromJSON } from '../../src/dashboard/registry';
import type { Group } from '../../src/shapes/Group';
import type { Node } from '../../src/Node';

function findTextFills(node: Node, out: string[] = []): string[] {
  const n = node as Node & { fill?: string; text?: string };
  if (typeof n.text === 'string' && typeof n.fill === 'string') {
    out.push(n.fill);
  }
  if ('children' in node) {
    for (const c of (node as Group).children) findTextFills(c, out);
  }
  return out;
}

describe('theme text + fontSize for charts', () => {
  beforeEach(() => {
    syncActiveCanvasUiTheme({});
    syncActiveDashboardTheme({});
  });

  it('image preset pairs with dark chrome text', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'canvas' });
    app.applyTheme({
      preset:
        'https://example.com/bg.jpg',
      primary: 'pink',
      series: ['#0ea5e9', '#f43f5e'],
      dashboard: { chartGrid: '#1e293b' },
    });

    const d = getActiveDashboard(app);
    expect(d.text).toMatch(/^#|^rgb/i);
    // Must be light ink on dark chart chrome
    expect(d.text.toLowerCase()).not.toBe('#000000');
    expect(d.text.toLowerCase()).not.toBe('#0f172a');
    expect(d.fontSize).toBeGreaterThanOrEqual(10);

    app.destroy();
    el.remove();
  });

  it('accepts text + fontSize in theme pack', () => {
    const resolved = resolveDashboardTheme(
      { text: '#fef3c7', textMuted: '#fde68a', fontSize: '14px', fontSizeSm: '11' },
      { chartGrid: '#1e293b' }
    );
    expect(resolved.text).toBe('#fef3c7');
    expect(resolved.textMuted).toBe('#fde68a');
    expect(resolved.fontSize).toBe(14);
    expect(resolved.fontSizeSm).toBe(11);
  });

  it('line chart labels use themed text after applyTheme', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'canvas' });
    app.applyTheme({
      preset: 'https://example.com/photo.jpg',
      primary: 'pink',
      text: '#f8fafc',
      textMuted: '#cbd5e1',
      fontSize: '13px',
      dashboard: { chartGrid: '#1e293b', chartBg: '#0f172a' },
    });

    const chart = createDashboardFromJSON(
      'lineChart',
      { data: [10, 20, 30, 40], width: 200, height: 120, x: 0, y: 0, title: 'Line' },
      app
    ) as Group;
    app.add(chart);

    const fills = findTextFills(chart);
    expect(fills.length).toBeGreaterThan(0);
    for (const f of fills) {
      expect(f.toLowerCase()).not.toBe('#000000');
      expect(f.toLowerCase()).not.toBe('#0f172a');
    }

    app.destroy();
    el.remove();
  });
});
