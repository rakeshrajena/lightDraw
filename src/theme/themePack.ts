/**
 * JSON-first theme pack — one config object themes UI, dashboard, and diagram.
 *
 * @example Scene JSON
 * ```json
 * {
 *   "theme": {
 *     "preset": "dark",
 *     "primary": "#0ea5e9",
 *     "series": ["#0ea5e9", "#f43f5e", "#22c55e", "#f59e0b"],
 *     "dashboard": { "chartGrid": "#1e293b" }
 *   },
 *   "type": "group",
 *   "children": [ ... ]
 * }
 * ```
 */
import type { UiThemeInput, UiThemeTokens } from '../components/uiTheme';
import type { DashboardTheme } from '../dashboard/theme';

/** Flat diagram overrides commonly set from JSON (top-level DIAGRAM keys). */
export interface DiagramThemePack {
  canvasBg?: string;
  surface?: string;
  surfaceElevated?: string;
  nodeFill?: string;
  nodeStroke?: string;
  nodeText?: string;
  nodeTextMuted?: string;
  edge?: string;
  edgeMuted?: string;
  [key: string]: unknown;
}

/**
 * Full theme pack — preset + brand tokens + optional module packs.
 * Flat brand keys (`primary`, `surface`, …) match `UiThemeInput` for drop-in use.
 */
export interface ThemePack extends UiThemeInput {
  /**
   * Chart series palette (2–8 colors). Applied to dashboard `series`
   * (and series[0] still tracks `primary` when omitted).
   */
  series?: string[];
  /** Dashboard token overrides after UI→dashboard remap. */
  dashboard?: Partial<DashboardTheme>;
  /** Diagram top-level color overrides after UI→diagram remap. */
  diagram?: DiagramThemePack;
  /**
   * Default automotive HMI preset for widgets that omit `props.theme`.
   * Does not retint existing clusters — use `updateAutoWidgetProps`.
   */
  automotive?: 'classic' | 'sport' | 'digital';
  /**
   * Optional stage background override (solid color). Prefer putting image paths
   * in `preset` instead — e.g. `{ preset: './bg.png' }`.
   */
  background?: string;
}

const MODULE_KEYS = new Set(['series', 'dashboard', 'diagram', 'automotive', 'mode', 'background']);

/** Split a theme pack into UI input + module packs. */
export function splitThemePack(pack: ThemePack | UiThemeInput | Record<string, unknown>): {
  ui: UiThemeInput;
  series?: string[];
  dashboard?: Partial<DashboardTheme>;
  diagram?: DiagramThemePack;
  automotive?: 'classic' | 'sport' | 'digital';
  background?: string;
} {
  const ui: Record<string, unknown> = {};
  let series: string[] | undefined;
  let dashboard: Partial<DashboardTheme> | undefined;
  let diagram: DiagramThemePack | undefined;
  let automotive: 'classic' | 'sport' | 'digital' | undefined;
  let background: string | undefined;

  for (const [key, value] of Object.entries(pack ?? {})) {
    if (value === undefined) continue;
    if (key === 'series' && Array.isArray(value)) {
      series = value.filter((c): c is string => typeof c === 'string');
      continue;
    }
    if (key === 'dashboard' && value && typeof value === 'object' && !Array.isArray(value)) {
      dashboard = value as Partial<DashboardTheme>;
      continue;
    }
    if (key === 'diagram' && value && typeof value === 'object' && !Array.isArray(value)) {
      diagram = value as DiagramThemePack;
      continue;
    }
    if (key === 'automotive' && (value === 'classic' || value === 'sport' || value === 'digital')) {
      automotive = value;
      continue;
    }
    if (key === 'background' && typeof value === 'string') {
      background = value;
      continue;
    }
    if (!MODULE_KEYS.has(key)) {
      ui[key] = value;
    }
  }

  return { ui: ui as UiThemeInput, series, dashboard, diagram, automotive, background };
}

/** Shallow-merge theme packs (module objects merge; series replaces when provided). */
export function mergeThemePacks(base: ThemePack, patch: ThemePack): ThemePack {
  const a = splitThemePack(base);
  const b = splitThemePack(patch);
  const next: ThemePack = {
    ...a.ui,
    ...b.ui,
  };
  const series = b.series ?? a.series;
  if (series?.length) next.series = series;
  if (a.dashboard || b.dashboard) {
    next.dashboard = { ...a.dashboard, ...b.dashboard };
  }
  if (a.diagram || b.diagram) {
    next.diagram = { ...a.diagram, ...b.diagram };
  }
  if (b.automotive ?? a.automotive) {
    next.automotive = b.automotive ?? a.automotive;
  }
  if (b.background ?? a.background) {
    next.background = b.background ?? a.background;
  }
  return next;
}

/** Normalize unknown JSON into a ThemePack (accepts nested `tokens` object). */
export function normalizeThemePack(raw: unknown): ThemePack {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const o = raw as Record<string, unknown>;
  const pack: ThemePack = {};

  // Nested tokens: { preset, tokens: { primary } }
  if (o.tokens && typeof o.tokens === 'object' && !Array.isArray(o.tokens)) {
    Object.assign(pack, o.tokens);
  }

  for (const [key, value] of Object.entries(o)) {
    if (key === 'tokens' || key === 'mode' || value === undefined) continue;
    (pack as Record<string, unknown>)[key] = value;
  }

  return pack;
}

/**
 * Extract `theme` from scene JSON and return the scene without it.
 * Supports root `{ theme, type, children }` or `{ theme, children }`.
 */
export function extractSceneTheme(data: Record<string, unknown>): {
  theme: ThemePack | null;
  scene: Record<string, unknown>;
} {
  if (!('theme' in data) || data.theme === undefined || data.theme === null) {
    return { theme: null, scene: data };
  }
  const theme = normalizeThemePack(data.theme);
  const { theme: _drop, ...rest } = data;
  return { theme, scene: rest };
}

/** Build stored pack from split parts (for getTheme / export). */
export function composeThemePack(
  ui: UiThemeInput,
  modules: {
    series?: string[];
    dashboard?: Partial<DashboardTheme>;
    diagram?: DiagramThemePack;
    automotive?: 'classic' | 'sport' | 'digital';
    background?: string;
  } = {}
): ThemePack {
  const pack: ThemePack = { ...ui };
  if (modules.series?.length) pack.series = modules.series;
  if (modules.dashboard && Object.keys(modules.dashboard).length) {
    pack.dashboard = { ...modules.dashboard };
  }
  if (modules.diagram && Object.keys(modules.diagram).length) {
    pack.diagram = { ...modules.diagram };
  }
  if (modules.automotive) pack.automotive = modules.automotive;
  if (modules.background) pack.background = modules.background;
  return pack;
}

/** True when pack has any user intent (not empty). */
export function isThemePackEmpty(pack: ThemePack): boolean {
  return Object.keys(pack).length === 0;
}

export type { UiThemeTokens };
