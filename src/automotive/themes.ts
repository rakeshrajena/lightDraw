import { createThemeScope } from '../theme/themeScope';
import { parseCssPx } from '../theme/themeUtils';

export type ClusterTheme = 'classic' | 'sport' | 'digital';

/** Named automotive presets — independent of app `setUiTheme` (Phase 5). */
export const AUTOMOTIVE_THEME_PRESETS: readonly ClusterTheme[] = ['classic', 'sport', 'digital'];

export interface ThemePalette {
  background: string;
  dialStroke: string;
  needleSpeed: string;
  needleTach: string;
  text: string;
  textMuted: string;
  accent: string;
  warning: string;
  ok: string;
  lampOn: string;
  lampOff: string;
  /**
   * Multiplier for fluid / label typography (1 = preset default).
   * Driven by app `fontSize` relative to UI base (14px); colors stay dual-system.
   */
  fontScale: number;
}

/**
 * Automotive HMI palettes.
 * These are **not** driven by `app.setUiTheme()` — change via `props.theme` or
 * `updateAutoWidgetProps(node, { theme: 'sport' })` so clusters keep vehicle-specific look.
 */
export const THEMES: Record<ClusterTheme, ThemePalette> = {
  classic: {
    background: '#0a0a0a',
    dialStroke: '#444444',
    needleSpeed: '#ef4444',
    needleTach: '#22c55e',
    text: '#ffffff',
    textMuted: '#9ca3af',
    accent: '#2563eb',
    warning: '#ef4444',
    ok: '#22c55e',
    lampOn: '#fbbf24',
    lampOff: '#333333',
    fontScale: 1,
  },
  sport: {
    background: '#111827',
    dialStroke: '#1f2937',
    needleSpeed: '#f97316',
    needleTach: '#eab308',
    text: '#f9fafb',
    textMuted: '#6b7280',
    accent: '#dc2626',
    warning: '#dc2626',
    ok: '#84cc16',
    lampOn: '#fde047',
    lampOff: '#374151',
    fontScale: 1,
  },
  digital: {
    background: '#020617',
    dialStroke: '#0ea5e9',
    needleSpeed: '#38bdf8',
    needleTach: '#22d3ee',
    text: '#e0f2fe',
    textMuted: '#64748b',
    accent: '#0ea5e9',
    warning: '#f43f5e',
    ok: '#10b981',
    lampOn: '#22d3ee',
    lampOff: '#1e293b',
    fontScale: 1,
  },
};

const fontScaleScope = createThemeScope<number>(() => 1);
/** Per-widget override stack (component `fontSize` prop). */
const fontScaleStack: number[] = [];
/** Default HMI preset from ThemePack.automotive (App-scoped via sync). */
const presetScope = createThemeScope<ClusterTheme>(() => 'classic');

function clampScale(n: number): number {
  return Math.max(0.5, Math.min(2, n));
}

/** Sync automotive label scale from UI `fontSize` (14px → scale 1). */
export function syncAutomotiveFontScale(
  ui: { fontSize?: string } | undefined,
  app?: object | null,
  basePx = 14
): number {
  let scale = 1;
  if (ui && ui.fontSize != null && String(ui.fontSize).trim() !== '') {
    scale = clampScale(parseCssPx(ui.fontSize, basePx) / basePx);
  }
  return fontScaleScope.sync(scale, app ?? undefined);
}

/** Sync default automotive preset from ThemePack.automotive. */
export function syncAutomotiveDefaultPreset(
  name: ClusterTheme | undefined,
  app?: object | null
): ClusterTheme {
  const next: ClusterTheme =
    name === 'classic' || name === 'sport' || name === 'digital' ? name : 'classic';
  return presetScope.sync(next, app ?? undefined);
}

export function getAutomotiveFontScale(app?: object | null): number {
  if (fontScaleStack.length) return fontScaleStack[fontScaleStack.length - 1]!;
  return fontScaleScope.getActive(app ?? undefined);
}

export function getDefaultAutomotivePreset(app?: object | null): ClusterTheme {
  return presetScope.getActive(app ?? undefined);
}

/** Resolve cluster theme name: props.theme → ThemePack.automotive → classic. */
export function autoThemeName(
  props: Record<string, unknown>,
  app?: object | null
): ClusterTheme {
  const t = props.theme;
  if (t === 'classic' || t === 'sport' || t === 'digital') return t;
  return getDefaultAutomotivePreset(app);
}

/** Run a widget build with a component-level font scale (beats app scale). */
export function runWithAutomotiveFontScale<T>(scale: number, fn: () => T): T {
  fontScaleStack.push(clampScale(scale));
  try {
    return fn();
  } finally {
    fontScaleStack.pop();
  }
}

/** Resolve scale from widget props; null → use app scale. */
export function automotiveFontScaleFromProps(
  props: Record<string, unknown>,
  basePx = 14
): number | null {
  if (props.fontSize == null || props.fontSize === '') return null;
  return clampScale(parseCssPx(props.fontSize, basePx) / basePx);
}

export function getTheme(name: string, app?: object | null): ThemePalette {
  const base = THEMES[name as ClusterTheme] ?? THEMES.classic;
  return { ...base, fontScale: getAutomotiveFontScale(app) };
}

/** Palette from widget props + optional App pack default. */
export function themeFromProps(
  props: Record<string, unknown>,
  app?: object | null
): ThemePalette {
  return getTheme(autoThemeName(props, app), app);
}
