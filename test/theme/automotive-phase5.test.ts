/**
 * Phase 5 — automotive presets stay independent of app setUiTheme.
 */
import { describe, it, expect } from 'vitest';
import { createTestApp, createTestContainer } from '../helpers';
import { createAutomotiveFromJSON } from '../../src/automotive/registry';
import { updateAutoWidgetProps } from '../../src/automotive/refresh';
import { getState } from '../../src/automotive/helpers';
import {
  THEMES,
  getTheme,
  AUTOMOTIVE_THEME_PRESETS,
} from '../../src/automotive/themes';

describe('Phase 5 — automotive dual theme system', () => {
  it('exposes classic/sport/digital presets', () => {
    expect(AUTOMOTIVE_THEME_PRESETS).toEqual(['classic', 'sport', 'digital']);
    expect(getTheme('classic').needleSpeed).toBe(THEMES.classic.needleSpeed);
    expect(getTheme('sport').accent).toBe(THEMES.sport.accent);
    expect(getTheme('digital').dialStroke).toBe(THEMES.digital.dialStroke);
  });

  it('setUiTheme does not change automotive theme state or force rebuild to app primary', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'canvas' });
    const cluster = createAutomotiveFromJSON(
      'instrumentCluster',
      { theme: 'sport', speed: 80, rpm: 2500, width: 800, height: 400, x: 0, y: 0 },
      app
    )!;
    app.add(cluster);

    expect(getState(cluster).theme).toBe('sport');
    const childCountBefore = (cluster as { children: unknown[] }).children.length;

    app.setUiTheme({ preset: 'violet', primary: '#7c3aed' });

    expect(getState(cluster).theme).toBe('sport');
    expect((cluster as { children: unknown[] }).children.length).toBe(childCountBefore);
    // Sport palette remains the automotive source of truth
    expect(getTheme(String(getState(cluster).theme)).accent).toBe(THEMES.sport.accent);
    expect(getTheme(String(getState(cluster).theme)).accent).not.toBe('#7c3aed');

    app.destroy();
    el.remove();
  });

  it('updateAutoWidgetProps can switch automotive theme independently', () => {
    const el = createTestContainer();
    const app = createTestApp(el, {
      renderer: 'canvas',
      uiTheme: { preset: 'emerald' },
    });
    const gauge = createAutomotiveFromJSON(
      'speedometer',
      { theme: 'classic', value: 60, size: 160, x: 0, y: 0 },
      app
    )!;
    app.add(gauge);

    expect(getState(gauge).theme).toBe('classic');
    updateAutoWidgetProps(gauge, { theme: 'digital' });
    expect(getState(gauge).theme).toBe('digital');
    expect(getTheme('digital').dialStroke).toBe(THEMES.digital.dialStroke);

    // App brand theme still emerald; automotive stayed on digital preset
    expect(app.getResolvedTheme().primary).toBe('#059669');
    expect(getState(gauge).theme).toBe('digital');

    app.destroy();
    el.remove();
  });
});
