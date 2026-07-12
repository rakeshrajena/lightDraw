/**
 * Component typography cascade: flat props → uiTheme → app → defaults.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestApp, createTestContainer } from '../helpers';
import { createDashboardFromJSON } from '../../src/dashboard/registry';
import { createComponentFromJSON } from '../../src/components/registry';
import { getState as getUiState } from '../../src/components/helpers';
import { getParts as getDashParts } from '../../src/dashboard/helpers';
import {
  resolveEffectiveUiTokens,
  resolveNodeTypography,
  hasCustomFontSize,
  hasCustomTextColor,
} from '../../src/components/nodeTheme';
import { syncActiveCanvasUiTheme } from '../../src/components/resolveCanvasTheme';
import { syncActiveDashboardTheme, DASHBOARD } from '../../src/dashboard/theme';
import { syncActiveDiagramTheme } from '../../src/diagram/theme';
import { UI } from '../../src/components/theme';

describe('component typography cascade', () => {
  beforeEach(() => {
    syncActiveCanvasUiTheme({});
    syncActiveDashboardTheme({});
    syncActiveDiagramTheme({});
  });

  it('flat props beat uiTheme and app tokens', () => {
    const el = createTestContainer();
    const app = createTestApp(el, {
      renderer: 'canvas',
      uiTheme: { text: '#111111', fontSize: '14px' },
    });
    const tokens = resolveEffectiveUiTokens(app, {
      uiTheme: { text: '#222222', fontSize: '16px' },
      textColor: '#ff0000',
      fontSize: 22,
    });
    expect(tokens.text).toBe('#ff0000');
    expect(tokens.fontSize).toBe('22px');
    const typo = resolveNodeTypography(
      app,
      { textColor: '#00ff00', fontSize: 18 },
      {
        text: UI.text,
        textMuted: UI.textMuted,
        fontSize: UI.fontSize,
        fontSizeSm: UI.fontSizeSm,
        fontSizeLg: UI.fontSizeLg,
      }
    );
    expect(typo.text).toBe('#00ff00');
    expect(typo.fontSize).toBe(18);
    expect(hasCustomTextColor({ color: '#abc' })).toBe(true);
    expect(hasCustomFontSize({ fontSize: 12 })).toBe(true);
    app.destroy();
    el.remove();
  });

  it('label color/fontSize survive later global setUiTheme', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'canvas' });
    const label = createComponentFromJSON(
      'label',
      { text: 'Hi', color: '#f43f5e', fontSize: 20 },
      app
    )!;
    app.add(label);
    expect((label as { fill: string }).fill).toBe('#f43f5e');
    expect((label as { fontSize: number }).fontSize).toBe(20);
    expect(getUiState(label).hasCustomColor).toBe(true);
    expect(getUiState(label).hasCustomFontSize).toBe(true);

    app.setUiTheme({ text: '#0ea5e9', fontSize: '10px', fontSizeSm: '8px' });
    expect((label as { fill: string }).fill).toBe('#f43f5e');
    expect((label as { fontSize: number }).fontSize).toBe(20);

    app.destroy();
    el.remove();
  });

  it('gauge flat textColor/fontSize beat app theme and stick across rebuild', () => {
    const el = createTestContainer();
    const app = createTestApp(el, {
      renderer: 'canvas',
      uiTheme: { preset: 'dark', text: '#e2e8f0', fontSize: '12px' },
    });
    const gauge = createDashboardFromJSON(
      'gauge',
      { value: 40, size: 120, textColor: '#fbbf24', fontSize: 18, x: 0, y: 0 },
      app
    )!;
    app.add(gauge);
    const valueText = getDashParts(gauge).valueText as { fill?: string; fontSize?: number };
    expect(valueText.fill).toBe('#fbbf24');
    expect(valueText.fontSize).toBe(18);

    app.setUiTheme({ text: '#22c55e', fontSize: '10px' });
    const after = getDashParts(gauge).valueText as { fill?: string; fontSize?: number };
    expect(after.fill).toBe('#fbbf24');
    expect(after.fontSize).toBe(18);

    app.destroy();
    el.remove();
  });

  it('gauge uiTheme text/fontSize applies when flat props omitted', () => {
    const el = createTestContainer();
    const app = createTestApp(el, {
      renderer: 'canvas',
      uiTheme: { preset: 'dark' },
    });
    const gauge = createDashboardFromJSON(
      'gauge',
      {
        value: 50,
        size: 100,
        uiTheme: { text: '#a78bfa', fontSize: '16px' },
        x: 0,
        y: 0,
      },
      app
    )!;
    app.add(gauge);
    const valueText = getDashParts(gauge).valueText as { fill?: string; fontSize?: number };
    expect(valueText.fill).toBe('#a78bfa');
    expect(valueText.fontSize).toBe(16);
    expect(DASHBOARD.text).not.toBe('#a78bfa');
    app.destroy();
    el.remove();
  });
});
