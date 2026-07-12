/**
 * Verify applyTheme accepts hex / rgb / rgba / hsl color strings end-to-end.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestApp, createTestContainer } from '../helpers';
import { getActiveDashboard, syncActiveDashboardTheme } from '../../src/dashboard/theme';
import { getActiveUi, syncActiveCanvasUiTheme } from '../../src/components/resolveCanvasTheme';
import { createDashboardFromJSON } from '../../src/dashboard/registry';
import { resolveValueColor } from '../../src/dashboard/colorStops';
import { colorWithAlpha, tryParseColor } from '../../src/utils/color';
import type { Group } from '../../src/shapes/Group';
import type { Node } from '../../src/Node';

function findFill(node: Node, color: string): boolean {
  const n = node as Node & { fill?: string; stroke?: string };
  if (n.fill === color || n.stroke === color) return true;
  if ('children' in node) {
    return (node as Group).children.some((c) => findFill(c, color));
  }
  return false;
}

describe('color parser', () => {
  it('parses hex, rgb, rgba, hsl, hsla, named', () => {
    expect(tryParseColor('#0ea5e9')).toEqual({ r: 14, g: 165, b: 233, a: 1 });
    expect(tryParseColor('#0ea')).toEqual({ r: 0, g: 238, b: 170, a: 1 });
    expect(tryParseColor('#0ea5e980')?.a).toBeCloseTo(128 / 255, 2);
    expect(tryParseColor('rgb(14, 165, 233)')).toEqual({ r: 14, g: 165, b: 233, a: 1 });
    expect(tryParseColor('rgba(14, 165, 233, 0.5)')).toEqual({ r: 14, g: 165, b: 233, a: 0.5 });
    expect(tryParseColor('rgb(14 165 233 / 40%)')?.a).toBeCloseTo(0.4, 5);
    expect(tryParseColor('hsl(199, 89%, 48%)')).toMatchObject({
      r: expect.any(Number),
      g: expect.any(Number),
      b: expect.any(Number),
      a: 1,
    });
    const hsl = tryParseColor('hsl(199, 89%, 48%)')!;
    expect(hsl.r).toBeGreaterThan(10);
    expect(hsl.g).toBeGreaterThan(150);
    expect(hsl.b).toBeGreaterThan(220);
    expect(tryParseColor('hsla(199 89% 48% / 0.35)')?.a).toBeCloseTo(0.35, 5);
    expect(tryParseColor('steelblue')).toEqual({ r: 70, g: 130, b: 180, a: 1 });
    expect(tryParseColor('not-a-color')).toBeNull();
  });

  it('derives translucent rgba from any parseable color', () => {
    expect(colorWithAlpha('rgb(14, 165, 233)', 0.35)).toBe('rgba(14, 165, 233, 0.35)');
    expect(colorWithAlpha('hsl(199, 89%, 48%)', 0.35)).toMatch(/^rgba\(\d+, \d+, \d+, 0\.35\)$/);
    expect(colorWithAlpha('dodgerblue', 0.2)).toBe('rgba(30, 144, 255, 0.2)');
  });
});

describe('applyTheme color formats', () => {
  beforeEach(() => {
    syncActiveCanvasUiTheme({});
    syncActiveDashboardTheme({});
  });

  it('accepts hex primary and remaps dashboard/canvas', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'canvas' });
    app.applyTheme({ preset: 'dark', primary: '#0ea5e9' });

    expect(app.getResolvedTheme().primary).toBe('#0ea5e9');
    expect(getActiveDashboard(app).primary).toBe('#0ea5e9');
    expect(getActiveDashboard(app).chartLine).toBe('#0ea5e9');
    expect(getActiveUi(app).primary).toBe('#0ea5e9');
    expect(getActiveDashboard(app).chartArea).toBe('rgba(14, 165, 233, 0.35)');

    app.destroy();
    el.remove();
  });

  it('accepts rgb() and rgba() surface/text/primary', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'canvas' });
    app.applyTheme({
      preset: 'dark',
      primary: 'rgb(14, 165, 233)',
      surface: 'rgb(30, 41, 59)',
      text: 'rgba(241, 245, 249, 1)',
      overlay: 'rgba(0, 0, 0, 0.5)',
    });

    const resolved = app.getResolvedTheme();
    expect(resolved.primary).toBe('rgb(14, 165, 233)');
    expect(resolved.surface).toBe('rgb(30, 41, 59)');
    expect(resolved.text).toBe('rgba(241, 245, 249, 1)');
    expect(resolved.overlay).toBe('rgba(0, 0, 0, 0.5)');

    expect(getActiveDashboard(app).primary).toBe('rgb(14, 165, 233)');
    expect(getActiveDashboard(app).panel).toBe('rgb(30, 41, 59)');
    expect(getActiveDashboard(app).text).toBe('rgba(241, 245, 249, 1)');
    expect(getActiveDashboard(app).chartArea).toBe('rgba(14, 165, 233, 0.35)');
    expect(getActiveUi(app).primary).toBe('rgb(14, 165, 233)');
    expect(getActiveUi(app).surface).toBe('rgb(30, 41, 59)');
    expect(getActiveUi(app).shadowPrimary.color).toBe('rgba(14, 165, 233, 0.28)');

    app.destroy();
    el.remove();
  });

  it('accepts hsl() primary and derives chart soft fills', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'canvas' });
    app.applyTheme({ preset: 'dark', primary: 'hsl(199, 89%, 48%)' });

    expect(app.getResolvedTheme().primary).toBe('hsl(199, 89%, 48%)');
    expect(getActiveDashboard(app).chartLine).toBe('hsl(199, 89%, 48%)');
    expect(getActiveDashboard(app).chartArea).toBe(colorWithAlpha('hsl(199, 89%, 48%)', 0.35));

    app.destroy();
    el.remove();
  });

  it('accepts named pink and rgba primary', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'canvas' });

    app.applyTheme({ primary: 'pink' });
    expect(app.getResolvedTheme().primary).toBe('pink');
    expect(app.getResolvedTheme().primaryHover).toMatch(/^rgb\(/);
    expect(getActiveDashboard(app).chartLine).toBe('pink');
    expect(getActiveDashboard(app).chartArea).toBe(colorWithAlpha('pink', 0.35));

    app.applyTheme({ primary: 'rgba(244, 114, 182, 1)' });
    expect(app.getResolvedTheme().primary).toBe('rgba(244, 114, 182, 1)');
    expect(getActiveDashboard(app).chartArea).toBe('rgba(244, 114, 182, 0.35)');

    app.destroy();
    el.remove();
  });

  it('accepts color strings as preset shortcuts', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'canvas' });

    app.applyTheme({ preset: 'pink' });
    expect(app.getResolvedTheme().primary).toBe('pink');
    expect(getActiveDashboard(app).chartLine).toBe('pink');

    app.applyTheme({ preset: '#0ea5e9' });
    expect(app.getResolvedTheme().primary).toBe('#0ea5e9');
    expect(getActiveDashboard(app).chartArea).toBe('rgba(14, 165, 233, 0.35)');

    app.applyTheme({ preset: 'dark' });
    expect(app.getResolvedTheme().primary).toBe('#3b82f6');
    expect(app.getResolvedTheme().surface).toBe('#1e293b');

    app.destroy();
    el.remove();
  });

  it('applies rgb primary onto a live bar chart', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'canvas' });
    app.applyTheme({ primary: 'rgb(220, 38, 38)' });

    const chart = createDashboardFromJSON(
      'barChart',
      { data: [10, 20, 30], width: 200, height: 120, x: 0, y: 0 },
      app
    )! as Group;
    app.add(chart);

    expect(findFill(chart, 'rgb(220, 38, 38)')).toBe(true);

    app.destroy();
    el.remove();
  });

  it('colorStops accept hex, rgb, and hsl', () => {
    expect(
      resolveValueColor(10, [{ upTo: 50, color: '#22c55e' }, { color: 'rgb(239, 68, 68)' }])
    ).toBe('#22c55e');
    expect(
      resolveValueColor(90, [{ upTo: 50, color: '#22c55e' }, { color: 'rgb(239, 68, 68)' }])
    ).toBe('rgb(239, 68, 68)');
    expect(
      resolveValueColor(90, [{ upTo: 50, color: 'success' }, { color: 'hsl(0, 84%, 60%)' }])
    ).toBe('hsl(0, 84%, 60%)');
  });

  it('HTML renderer applies rgb CSS vars', () => {
    const el = createTestContainer();
    const app = createTestApp(el, {
      renderer: 'html',
      uiTheme: { primary: 'rgb(124, 58, 237)', surface: 'rgba(255, 255, 255, 1)' },
    });
    app.render();
    const root = el.querySelector('.lightdraw-html-root') as HTMLElement;
    expect(root.style.getPropertyValue('--ld-primary')).toBe('rgb(124, 58, 237)');
    expect(root.style.getPropertyValue('--ld-surface')).toBe('rgba(255, 255, 255, 1)');
    app.destroy();
    el.remove();
  });
});
