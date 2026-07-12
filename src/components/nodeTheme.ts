import type { App } from '../App';
import { AUTOMOTIVE_THEME_PRESETS } from '../automotive/themes';
import {
  UI_PRESETS,
  resolveUiTheme,
  type UiThemeInput,
  type UiThemeTokens,
} from './uiTheme';
import { parseCssPx, resolveFontSizeTriple, toCssPxToken } from '../theme/themeUtils';

/**
 * Per-node theme override (Phase 6).
 * - `'inherit'` / omitted → app theme only
 * - preset name (e.g. `'violet'`) → UI_PRESETS
 * - token object → resolveUiTheme input
 *
 * Prefer `uiTheme` on dashboard/diagram/UI nodes.
 * `theme` is accepted for dashboard/diagram only when it is a UI preset or object —
 * never when it is an automotive preset (`classic` | `sport` | `digital`).
 */
export type NodeUiThemeProp = 'inherit' | string | UiThemeInput;

export type NodeTypography = {
  text: string;
  textMuted: string;
  fontSize: number;
  fontSizeSm: number;
  fontSizeLg: number;
};

const AUTOMOTIVE = new Set<string>(AUTOMOTIVE_THEME_PRESETS);

/** Read raw override from props without resolving. */
export function readNodeUiThemeProp(props: Record<string, unknown>): NodeUiThemeProp | undefined {
  if (props.uiTheme !== undefined) return props.uiTheme as NodeUiThemeProp;

  const theme = props.theme;
  if (theme === undefined || theme === null) return undefined;
  if (typeof theme === 'object') return theme as UiThemeInput;
  if (typeof theme === 'string') {
    if (theme === 'inherit') return 'inherit';
    if (AUTOMOTIVE.has(theme)) return undefined; // automotive owns this prop
    if (theme in UI_PRESETS) return theme;
  }
  return undefined;
}

/** Normalize a raw prop into UiThemeInput, or null for inherit. */
export function normalizeNodeUiTheme(raw: NodeUiThemeProp | undefined): UiThemeInput | null {
  if (raw === undefined || raw === 'inherit') return null;
  if (typeof raw === 'string') {
    if (raw in UI_PRESETS) return { preset: raw };
    return null;
  }
  if (typeof raw === 'object' && raw !== null) return raw as UiThemeInput;
  return null;
}

/**
 * Flat component typography props (highest priority).
 * `textColor` preferred; `color` is a label-style alias for text fill.
 */
export function flatTypographyFromProps(props: Record<string, unknown> = {}): UiThemeTokens {
  const out: UiThemeTokens = {};
  const textColor = props.textColor ?? props.color;
  if (textColor != null && textColor !== '') out.text = String(textColor);
  if (props.textMuted != null && props.textMuted !== '') out.textMuted = String(props.textMuted);
  const fontSize = toCssPxToken(props.fontSize);
  if (fontSize) out.fontSize = fontSize;
  const fontSizeSm = toCssPxToken(props.fontSizeSm);
  if (fontSizeSm) out.fontSizeSm = fontSizeSm;
  const fontSizeLg = toCssPxToken(props.fontSizeLg);
  if (fontSizeLg) out.fontSizeLg = fontSizeLg;
  return out;
}

export function hasCustomTextColor(props: Record<string, unknown> = {}): boolean {
  if (
    (props.textColor != null && props.textColor !== '') ||
    (props.color != null && props.color !== '')
  ) {
    return true;
  }
  const node = normalizeNodeUiTheme(readNodeUiThemeProp(props));
  if (node && node.text != null && String(node.text).trim() !== '') return true;
  return false;
}

export function hasCustomFontSize(props: Record<string, unknown> = {}): boolean {
  if (props.fontSize != null && props.fontSize !== '') return true;
  const node = normalizeNodeUiTheme(readNodeUiThemeProp(props));
  if (node && node.fontSize != null && String(node.fontSize).trim() !== '') return true;
  return false;
}

/**
 * Effective tokens for a node: app theme ← node uiTheme ← flat typography props.
 * Component flat props win over uiTheme; uiTheme wins over app.
 */
export function resolveEffectiveUiTokens(
  app: App | null | undefined,
  props: Record<string, unknown> = {}
): UiThemeTokens {
  const appTokens =
    app && typeof app.getResolvedTheme === 'function' ? app.getResolvedTheme() : {};
  const nodeInput = normalizeNodeUiTheme(readNodeUiThemeProp(props));
  const nodeTokens = nodeInput ? resolveUiTheme(nodeInput) : {};
  const flat = flatTypographyFromProps(props);
  return { ...appTokens, ...nodeTokens, ...flat };
}

/**
 * Resolved typography for builders.
 * Priority: flat props → node uiTheme → app tokens → numeric fallbacks.
 */
export function resolveNodeTypography(
  app: App | null | undefined,
  props: Record<string, unknown> = {},
  fallbacks: NodeTypography
): NodeTypography {
  const tokens = resolveEffectiveUiTokens(app, props);
  const sizes = resolveFontSizeTriple(tokens, fallbacks);
  return {
    text: tokens.text ?? fallbacks.text,
    textMuted: tokens.textMuted ?? fallbacks.textMuted,
    ...sizes,
  };
}

/** True when props request a non-inherit node override (uiTheme or flat typography). */
export function hasNodeUiThemeOverride(props: Record<string, unknown>): boolean {
  return (
    normalizeNodeUiTheme(readNodeUiThemeProp(props)) !== null ||
    Object.keys(flatTypographyFromProps(props)).length > 0
  );
}

/** @deprecated Use parseCssPx from theme/themeUtils */
export const parseFontPx = parseCssPx;
