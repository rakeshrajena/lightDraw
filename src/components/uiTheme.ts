/** Programmatic UI theme — customize without writing CSS. Applied as CSS variables on the HTML root. */
import { mixColors, tryParseColor, colorWithAlpha, isCssColorString } from '../utils/color';

export interface UiThemeTokens {
  primary?: string;
  primaryHover?: string;
  primaryActive?: string;
  primarySubtle?: string;
  secondary?: string;
  secondaryHover?: string;
  danger?: string;
  dangerSubtle?: string;
  success?: string;
  successSubtle?: string;
  warning?: string;
  warningSubtle?: string;
  surface?: string;
  surfaceMuted?: string;
  surfaceInset?: string;
  overlay?: string;
  border?: string;
  borderStrong?: string;
  text?: string;
  textSecondary?: string;
  textMuted?: string;
  textInverse?: string;
  placeholder?: string;
  radius?: string;
  radiusSm?: string;
  radiusLg?: string;
  fontFamily?: string;
  /** Base UI / chart label size, e.g. `"12px"` or `"12"`. */
  fontSize?: string;
  fontSizeSm?: string;
  fontSizeLg?: string;
  controlHeight?: string;
  shadowMd?: string;
  statusBarBg?: string;
  statusBarText?: string;
  statusBarBorder?: string;
  tooltipBg?: string;
  spaceXs?: string;
  spaceSm?: string;
  spaceMd?: string;
  spaceLg?: string;
  spaceXl?: string;
  bpSm?: string;
  bpMd?: string;
  bpLg?: string;
}

/** Theme input — optional named preset merged before explicit token overrides. */
export interface UiThemeInput extends UiThemeTokens {
  /**
   * Theme shortcut. Accepts:
   * - Built-in pack name: `dark`, `violet`, `rose`, …
   * - Any CSS color: `#f472b6`, `rgb()`, `hsl()`, `pink`
   * - Image file path (absolute or relative): `./bg.png`, `/images/hero.jpg`, `assets/wall.webp`
   *
   * Image paths set the stage background automatically — no `background` key needed.
   */
  preset?: UiThemePreset | string;
}

export type UiThemePreset = keyof typeof UI_PRESETS;

/** Maps token keys to CSS custom property names on `.lightdraw-html-root`. */
export const UI_THEME_VAR_MAP: Record<keyof UiThemeTokens, string> = {
  primary: '--ld-primary',
  primaryHover: '--ld-primary-hover',
  primaryActive: '--ld-primary-active',
  primarySubtle: '--ld-primary-subtle',
  secondary: '--ld-secondary',
  secondaryHover: '--ld-secondary-hover',
  danger: '--ld-danger',
  dangerSubtle: '--ld-danger-subtle',
  success: '--ld-success',
  successSubtle: '--ld-success-subtle',
  warning: '--ld-warning',
  warningSubtle: '--ld-warning-subtle',
  surface: '--ld-surface',
  surfaceMuted: '--ld-surface-muted',
  surfaceInset: '--ld-surface-inset',
  overlay: '--ld-overlay',
  border: '--ld-border',
  borderStrong: '--ld-border-strong',
  text: '--ld-text',
  textSecondary: '--ld-text-secondary',
  textMuted: '--ld-text-muted',
  textInverse: '--ld-text-inverse',
  placeholder: '--ld-placeholder',
  radius: '--ld-radius',
  radiusSm: '--ld-radius-sm',
  radiusLg: '--ld-radius-lg',
  fontFamily: '--ld-font-family',
  fontSize: '--ld-font-size',
  fontSizeSm: '--ld-font-size-sm',
  fontSizeLg: '--ld-font-size-lg',
  controlHeight: '--ld-control-h',
  shadowMd: '--ld-shadow-md',
  statusBarBg: '--ld-statusbar-bg',
  statusBarText: '--ld-statusbar-text',
  statusBarBorder: '--ld-statusbar-border',
  tooltipBg: '--ld-tooltip-bg',
  spaceXs: '--ld-space-xs',
  spaceSm: '--ld-space-sm',
  spaceMd: '--ld-space-md',
  spaceLg: '--ld-space-lg',
  spaceXl: '--ld-space-xl',
  bpSm: '--ld-bp-sm',
  bpMd: '--ld-bp-md',
  bpLg: '--ld-bp-lg',
};

/** All token keys for completeness checks in tests. */
export const UI_THEME_TOKEN_KEYS = Object.keys(UI_THEME_VAR_MAP) as (keyof UiThemeTokens)[];

/** Apply theme tokens to a LightDraw HTML root (or any container). Clears unset mapped vars. */
export function applyUiTheme(el: HTMLElement, tokens: UiThemeTokens): void {
  // Themes are token-driven; clear legacy data-ld-theme if present.
  el.removeAttribute('data-ld-theme');
  for (const key of UI_THEME_TOKEN_KEYS) {
    const value = tokens[key];
    const cssVar = UI_THEME_VAR_MAP[key];
    if (value !== undefined && value !== '') {
      el.style.setProperty(cssVar, value);
    } else {
      el.style.removeProperty(cssVar);
    }
  }
}

const DARK_BASE: UiThemeTokens = {
  surface: '#1e293b',
  surfaceMuted: '#0f172a',
  surfaceInset: '#334155',
  border: '#334155',
  borderStrong: '#475569',
  text: '#f1f5f9',
  textSecondary: '#cbd5e1',
  textMuted: '#94a3b8',
  textInverse: '#0f172a',
  placeholder: '#64748b',
  primarySubtle: '#1e3a5f',
  successSubtle: '#14532d',
  warningSubtle: '#422006',
  dangerSubtle: '#450a0a',
  overlay: 'rgba(0, 0, 0, 0.65)',
  statusBarBg: '#0f172a',
  statusBarText: '#94a3b8',
  statusBarBorder: '#334155',
  tooltipBg: '#0f172a',
};

/** Light surface pack — mirrors CSS / canvas UI defaults. */
const LIGHT_BASE: UiThemeTokens = {
  surface: '#ffffff',
  surfaceMuted: '#f8fafc',
  surfaceInset: '#f1f5f9',
  border: '#e2e8f0',
  borderStrong: '#cbd5e1',
  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#64748b',
  textInverse: '#ffffff',
  placeholder: '#94a3b8',
  primarySubtle: '#eff6ff',
  successSubtle: '#ecfdf5',
  warningSubtle: '#fffbeb',
  dangerSubtle: '#fef2f2',
  overlay: 'rgba(15, 23, 42, 0.5)',
  statusBarBg: '#f8fafc',
  statusBarText: '#64748b',
  statusBarBorder: '#e2e8f0',
  tooltipBg: '#0f172a',
};

/** Dark surface pack — used by preset `dark` / `darkViolet`, or spread into custom packs. */
export const UI_DARK_PACK: UiThemeTokens = { ...DARK_BASE };

/** Light surface pack — used by light presets, or spread into custom packs. */
export const UI_LIGHT_PACK: UiThemeTokens = { ...LIGHT_BASE };

/** @deprecated Use `UI_DARK_PACK`. */
export const UI_DARK_MODE_PACK = UI_DARK_PACK;

/** @deprecated Use `UI_LIGHT_PACK`. */
export const UI_LIGHT_MODE_PACK = UI_LIGHT_PACK;

/**
 * Built-in theme presets — each is a **complete** pack for UI + dashboard + diagram.
 * Use `dark` / `darkViolet` for dark chrome; other presets are light packs.
 */
export const UI_PRESETS: Record<string, UiThemeTokens> = {
  /** Full light theme (CSS / canvas defaults). */
  default: { ...LIGHT_BASE },
  /** Full dark theme with blue primary. */
  dark: {
    ...DARK_BASE,
    primary: '#3b82f6',
    primaryHover: '#2563eb',
    primaryActive: '#1d4ed8',
  },
  /** Light theme + purple accent. */
  violet: {
    ...LIGHT_BASE,
    primary: '#7c3aed',
    primaryHover: '#6d28d9',
    primaryActive: '#5b21b6',
    primarySubtle: '#ede9fe',
  },
  /** Light theme + green accent. */
  emerald: {
    ...LIGHT_BASE,
    primary: '#059669',
    primaryHover: '#047857',
    primaryActive: '#065f46',
    primarySubtle: '#d1fae5',
  },
  /** Light theme + slate accent. */
  slate: {
    ...LIGHT_BASE,
    primary: '#334155',
    primaryHover: '#1e293b',
    primaryActive: '#0f172a',
    primarySubtle: '#f1f5f9',
  },
  /** Light theme + sky accent. */
  ocean: {
    ...LIGHT_BASE,
    primary: '#0284c7',
    primaryHover: '#0369a1',
    primaryActive: '#075985',
    primarySubtle: '#e0f2fe',
  },
  /** Light theme + rose accent. */
  rose: {
    ...LIGHT_BASE,
    primary: '#e11d48',
    primaryHover: '#be123c',
    primaryActive: '#9f1239',
    primarySubtle: '#ffe4e6',
  },
  /** Dark theme + violet accent. */
  darkViolet: {
    ...DARK_BASE,
    primary: '#8b5cf6',
    primaryHover: '#7c3aed',
    primaryActive: '#6d28d9',
    primarySubtle: '#2e1065',
  },
};

/** Drop legacy `mode` from raw inputs so old JSON does not stick. */
function stripLegacyMode(input: Record<string, unknown>): Record<string, unknown> {
  const { mode: _drop, ...rest } = input;
  return rest;
}

/** Common raster/vector image extensions. */
const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|svg|avif|bmp|ico)(\?|#|$)/i;

/**
 * True when a string looks like an image file / URL / data URI
 * (not a solid color or named pack).
 *
 * Requires an image signal: extension, `url(...)`, `data:image/`, or http(s)/blob/file URL.
 * Absolute paths without an image extension are not treated as images.
 */
export function isThemeImageValue(value: string): boolean {
  const s = value.trim();
  if (!s) return false;
  if (/^url\(/i.test(s)) return true;
  if (/^data:image\//i.test(s)) return true;
  if (/^(https?:|blob:|file:)/i.test(s)) return true;
  if (IMAGE_EXT_RE.test(s)) return true;
  return false;
}

/** Normalize a theme image value to a CSS `url(...)` fragment. */
export function toThemeBackgroundCss(value: string): string {
  const s = value.trim();
  if (/^url\(/i.test(s)) return s;
  if (/^data:image\//i.test(s)) return `url(${JSON.stringify(s)})`;
  if (isThemeImageValue(s)) return `url(${JSON.stringify(s)})`;
  return s;
}

/** Unwrap `url("…")` / path / data URI to a loadable image `src`. */
export function unwrapThemeBackgroundSrc(value: string): string | null {
  const s = value.trim();
  if (!s) return null;
  const m = s.match(/^url\(\s*(['"]?)([\s\S]*?)\1\s*\)$/i);
  if (m) return m[2];
  if (isThemeImageValue(s)) return s;
  return null;
}

/** CSS `background` value for a stage (solid color or cover image). */
export function cssStageBackground(value: string): string {
  if (!value || value === 'transparent') return 'transparent';
  if (isThemeImageValue(value) || /^url\(/i.test(value)) {
    return `center / cover no-repeat ${toThemeBackgroundCss(value)}`;
  }
  return value;
}

function derivePrimaryVariants(
  primary: string,
  target: UiThemeTokens,
  locked: Set<string>,
  replaceMissingOnly: boolean
): void {
  if (!tryParseColor(primary)) return;
  const canWrite = (key: 'primaryHover' | 'primaryActive' | 'primarySubtle') =>
    !locked.has(key) && (!replaceMissingOnly || target[key] == null);

  if (canWrite('primaryHover')) {
    target.primaryHover = mixColors(primary, '#000000', 0.14);
  }
  if (canWrite('primaryActive')) {
    target.primaryActive = mixColors(primary, '#000000', 0.28);
  }
  if (canWrite('primarySubtle')) {
    target.primarySubtle =
      colorWithAlpha(primary, 0.14) ?? mixColors(primary, '#ffffff', 0.85);
  }
}

/**
 * Expand a flexible `preset` string into brand tokens (and optional stage background).
 * Named packs win; then CSS colors; then image URLs.
 */
export function expandPreset(
  preset: string | undefined
): { tokens: UiThemeTokens; background?: string; kind: 'pack' | 'color' | 'image' | 'none' } {
  if (!preset || typeof preset !== 'string') return { tokens: {}, kind: 'none' };
  const key = preset.trim();
  if (!key) return { tokens: {}, kind: 'none' };

  if (UI_PRESETS[key]) {
    return { tokens: { ...UI_PRESETS[key] }, kind: 'pack' };
  }

  if (isThemeImageValue(key)) {
    // Pair wallpaper with dark chrome so charts/UI stay readable over photos.
    return {
      tokens: { ...DARK_BASE },
      background: toThemeBackgroundCss(key),
      kind: 'image',
    };
  }

  if (isCssColorString(key) || tryParseColor(key)) {
    return { tokens: { primary: key }, kind: 'color' };
  }

  return { tokens: {}, kind: 'none' };
}

/**
 * Resolve preset + overrides into a flat token object (no `preset` field).
 * `preset` may be a built-in pack name, any CSS color, or an image URL.
 * When `primary` is set without hover/active/subtle, those are derived automatically.
 */
export function resolveUiTheme(input: UiThemeInput): UiThemeTokens {
  const cleaned = stripLegacyMode(input as Record<string, unknown>) as UiThemeInput;
  const { preset, ...overrides } = cleaned;
  const expanded = expandPreset(typeof preset === 'string' ? preset : undefined);
  const merged: UiThemeTokens = { ...expanded.tokens, ...overrides };

  const locked = new Set(
    Object.keys(overrides).filter((k) => (overrides as Record<string, unknown>)[k] !== undefined)
  );
  if (merged.primary) {
    // Color preset or explicit primary override → retint hover/active.
    // Named pack alone → only fill missing variant slots.
    const replaceMissingOnly = expanded.kind === 'pack' && !locked.has('primary');
    derivePrimaryVariants(merged.primary, merged, locked, replaceMissingOnly);
  }

  return merged;
}

/** Resolve stage background from a theme input (image preset or explicit `background`). */
export function resolveThemeBackground(
  input: UiThemeInput & { background?: string }
): string | undefined {
  if (input.background != null && String(input.background).trim() !== '') {
    const bg = String(input.background).trim();
    return isThemeImageValue(bg) ? toThemeBackgroundCss(bg) : bg;
  }
  const preset = typeof input.preset === 'string' ? input.preset.trim() : '';
  if (preset && !UI_PRESETS[preset] && isThemeImageValue(preset)) {
    return toThemeBackgroundCss(preset);
  }
  return undefined;
}
