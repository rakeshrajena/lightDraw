/**
 * Phase 0 — lock default module palettes so theme work cannot silently change look.
 */
import { describe, it, expect } from 'vitest';
import { UI } from '../../src/components/theme';
import { UI_PRESETS, resolveUiTheme } from '../../src/components/uiTheme';
import { DASHBOARD, resolveDashboardTheme } from '../../src/dashboard/theme';
import { DIAGRAM } from '../../src/diagram/theme';
import { THEMES, getTheme } from '../../src/automotive/themes';

describe('Phase 0 — baseline default colors', () => {
  it('UI canvas tokens stay at light defaults', () => {
    expect(UI.primary).toBe('#2563eb');
    expect(UI.surface).toBe('#ffffff');
    expect(UI.text).toBe('#0f172a');
    expect(UI.danger).toBe('#dc2626');
    expect(UI.radius).toBe(8);
  });

  it('empty uiTheme resolves to empty token object (CSS file defaults)', () => {
    expect(resolveUiTheme({})).toEqual({});
  });

  it('preset default is a full light pack for all modules', () => {
    const resolved = resolveUiTheme({ preset: 'default' });
    expect(resolved.surface).toBe('#ffffff');
    expect(resolved.text).toBe('#0f172a');
  });

  it('core UI presets keep documented primaries', () => {
    expect(UI_PRESETS.violet.primary).toBe('#7c3aed');
    expect(UI_PRESETS.emerald.primary).toBe('#059669');
    expect(UI_PRESETS.slate.primary).toBe('#334155');
    expect(UI_PRESETS.ocean.primary).toBe('#0284c7');
    expect(UI_PRESETS.rose.primary).toBe('#e11d48');
    expect(UI_PRESETS.dark.primary).toBe('#3b82f6');
    expect(UI_PRESETS.dark.surface).toBe('#1e293b');
  });

  it('DASHBOARD palette stays at dark analytics defaults', () => {
    expect(DASHBOARD.primary).toBe('#3b82f6');
    expect(DASHBOARD.panel).toBe('#151d2e');
    expect(DASHBOARD.chartLine).toBe('#3b82f6');
    expect(DASHBOARD.gaugeNeedle).toBe('#3b82f6');
    expect(DASHBOARD.text).toBe('#e2e8f0');
    expect(DASHBOARD.series).toEqual([
      '#3b82f6',
      '#ef4444',
      '#22c55e',
      '#f59e0b',
      '#a855f7',
      '#06b6d4',
      '#f97316',
      '#ec4899',
    ]);
  });

  it('resolveDashboardTheme() with no UI input equals DASHBOARD', () => {
    const theme = resolveDashboardTheme();
    expect(theme.primary).toBe(DASHBOARD.primary);
    expect(theme.panel).toBe(DASHBOARD.panel);
    expect(theme.chartLine).toBe(DASHBOARD.chartLine);
  });

  it('DIAGRAM tokens stay at dark diagram defaults', () => {
    expect(DIAGRAM.canvasBg).toBe('#0d1322');
    expect(DIAGRAM.nodeStroke).toBe('#3b82f6');
    expect(DIAGRAM.edge).toBe('#60a5fa');
    expect(DIAGRAM.flowchartProcess.stroke).toBe('#3b82f6');
    expect(DIAGRAM.networkRouter.stroke).toBe('#3b82f6');
  });

  it('automotive classic/sport/digital palettes stay locked', () => {
    expect(THEMES.classic.needleSpeed).toBe('#ef4444');
    expect(THEMES.classic.background).toBe('#0a0a0a');
    expect(THEMES.sport.accent).toBe('#dc2626');
    expect(THEMES.digital.dialStroke).toBe('#0ea5e9');
    expect(getTheme('unknown').background).toBe(THEMES.classic.background);
  });
});
