/**
 * Theme stability hardening — App-scoped palettes, replace/clear, multi-app isolation.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestApp, createTestContainer } from '../helpers';
import { createDashboardFromJSON } from '../../src/dashboard/registry';
import { getParts } from '../../src/dashboard/helpers';
import {
  getActiveDashboard,
  syncActiveDashboardTheme,
} from '../../src/dashboard/theme';
import { getActiveDiagram, syncActiveDiagramTheme } from '../../src/diagram/theme';
import { getActiveUi, syncActiveCanvasUiTheme } from '../../src/components/resolveCanvasTheme';
import { applyUiTheme, UI_THEME_VAR_MAP } from '../../src/components/uiTheme';

describe('Theme stability hardening', () => {
  beforeEach(() => {
    syncActiveCanvasUiTheme({});
    syncActiveDashboardTheme({});
    syncActiveDiagramTheme({});
  });

  it('sticky merge keeps explicit tokens; replace clears them', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'canvas' });

    app.setUiTheme({ primary: '#111111' });
    app.setUiTheme({ preset: 'violet' });
    expect(app.getUiTheme()).toEqual({ primary: '#111111', preset: 'violet' });
    expect(app.getResolvedTheme().primary).toBe('#111111'); // sticky override wins over violet
    expect(app.getResolvedTheme().surface).toBe('#ffffff'); // from violet light pack

    app.setUiTheme({ preset: 'violet' }, { replace: true });
    expect(app.getUiTheme()).toEqual({ preset: 'violet' });
    expect(app.getResolvedTheme().primary).toBe('#7c3aed');
    expect(app.getResolvedTheme().surface).toBe('#ffffff');

    app.destroy();
    el.remove();
  });

  it('clearUiTheme resets config to empty defaults', () => {
    const el = createTestContainer();
    const app = createTestApp(el, {
      renderer: 'canvas',
      uiTheme: { preset: 'emerald', primary: '#111111' },
    });

    app.clearUiTheme();
    expect(app.getUiTheme()).toEqual({});
    expect(app.getResolvedTheme()).toEqual({});

    app.destroy();
    el.remove();
  });

  it('two App instances keep independent WeakMap theme snapshots', () => {
    const elA = createTestContainer();
    const elB = createTestContainer();
    const appA = createTestApp(elA, {
      renderer: 'canvas',
      uiTheme: { preset: 'violet' },
    });
    const appB = createTestApp(elB, {
      renderer: 'canvas',
      uiTheme: { preset: 'emerald' },
    });

    expect(getActiveDashboard(appA).primary).toBe('#7c3aed');
    expect(getActiveDashboard(appB).primary).toBe('#059669');
    expect(getActiveUi(appA).primary).toBe('#7c3aed');
    expect(getActiveUi(appB).primary).toBe('#059669');
    expect(getActiveDiagram(appA).edge).toBe('#7c3aed');
    expect(getActiveDiagram(appB).edge).toBe('#059669');

    appA.destroy();
    appB.destroy();
    elA.remove();
    elB.remove();
  });

  it('creating gauges on two apps does not cross-contaminate needle colors', () => {
    const elA = createTestContainer();
    const elB = createTestContainer();
    const appA = createTestApp(elA, {
      renderer: 'canvas',
      uiTheme: { preset: 'violet' },
    });
    const appB = createTestApp(elB, {
      renderer: 'canvas',
      uiTheme: { preset: 'emerald' },
    });

    const gaugeA = createDashboardFromJSON('gauge', { value: 40, size: 100, x: 0, y: 0 }, appA)!;
    const gaugeB = createDashboardFromJSON('gauge', { value: 40, diameter: 100, x: 0, y: 0 }, appB)!;
    appA.add(gaugeA);
    appB.add(gaugeB);

    const needleA = getParts(gaugeA).needle as { stroke?: string; fill?: string };
    const needleB = getParts(gaugeB).needle as { stroke?: string; fill?: string };
    expect(needleA.stroke ?? needleA.fill).toBe('#7c3aed');
    expect(needleB.stroke ?? needleB.fill).toBe('#059669');

    // After both builds, App-scoped lookups still match each app
    expect(getActiveDashboard(appA).primary).toBe('#7c3aed');
    expect(getActiveDashboard(appB).primary).toBe('#059669');

    appA.destroy();
    appB.destroy();
    elA.remove();
    elB.remove();
  });

  it('applyUiTheme clears unset CSS vars and legacy data-ld-theme', () => {
    const el = document.createElement('div');
    el.setAttribute('data-ld-theme', 'dark');
    applyUiTheme(el, { primary: '#3b82f6', surface: '#1e293b' });
    expect(el.hasAttribute('data-ld-theme')).toBe(false);
    expect(el.style.getPropertyValue(UI_THEME_VAR_MAP.primary)).toBe('#3b82f6');
    expect(el.style.getPropertyValue(UI_THEME_VAR_MAP.surface)).toBe('#1e293b');

    applyUiTheme(el, { primary: '#7c3aed' });
    expect(el.hasAttribute('data-ld-theme')).toBe(false);
    expect(el.style.getPropertyValue(UI_THEME_VAR_MAP.primary)).toBe('#7c3aed');
    expect(el.style.getPropertyValue(UI_THEME_VAR_MAP.surface)).toBe('');
  });
});
