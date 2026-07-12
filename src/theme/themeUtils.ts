/**
 * Shared theme helpers — CSS px parse, luminance, dial/diagram chrome guard.
 */
import { tryParseColor } from '../utils/color';

/** Parse `"14px"` / `"14"` / `14` → number; invalid → fallback. */
export function parseCssPx(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const n = parseFloat(value);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

/** Normalize a size to a CSS length token (`14` → `"14px"`). */
export function toCssPxToken(value: unknown): string | undefined {
  if (value == null || value === '') return undefined;
  if (typeof value === 'number' && Number.isFinite(value)) return `${value}px`;
  if (typeof value === 'string' && value.trim()) {
    const s = value.trim();
    return /^\d+(\.\d+)?$/.test(s) ? `${s}px` : s;
  }
  return undefined;
}

/** Relative luminance 0–1 (simple Rec.601); null if unparsable. */
export function relativeLuminance(color: string): number | null {
  const c = tryParseColor(color);
  if (!c) return null;
  return (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
}

/**
 * Keep dark analytics / diagram chrome when UI pack surfaces are light.
 * Prevents white gauges / washed node fills from light presets.
 */
export function pickChrome(uiColor: string | undefined, fallback: string): string {
  if (!uiColor) return fallback;
  const lum = relativeLuminance(uiColor);
  if (lum != null && lum > 0.55) return fallback;
  return uiColor;
}

/** Ink that contrasts against a background. */
export function contrastingInk(
  bg: string,
  light = '#f1f5f9',
  dark = '#0f172a'
): string {
  const lum = relativeLuminance(bg);
  if (lum == null) return light;
  return lum > 0.55 ? dark : light;
}

export type FontSizeTriple = {
  fontSize: number;
  fontSizeSm: number;
  fontSizeLg: number;
};

/** Resolve base/sm/lg from token strings; derive sm/lg when only base is set. */
export function resolveFontSizeTriple(
  tokens: { fontSize?: string; fontSizeSm?: string; fontSizeLg?: string },
  fallbacks: FontSizeTriple
): FontSizeTriple {
  const hasBase = tokens.fontSize != null && String(tokens.fontSize).trim() !== '';
  const fontSize = parseCssPx(tokens.fontSize, fallbacks.fontSize);
  const fontSizeSm =
    tokens.fontSizeSm != null && String(tokens.fontSizeSm).trim() !== ''
      ? parseCssPx(tokens.fontSizeSm, fallbacks.fontSizeSm)
      : hasBase
        ? Math.round(fontSize * (fallbacks.fontSizeSm / Math.max(1, fallbacks.fontSize)))
        : fallbacks.fontSizeSm;
  const fontSizeLg =
    tokens.fontSizeLg != null && String(tokens.fontSizeLg).trim() !== ''
      ? parseCssPx(tokens.fontSizeLg, fallbacks.fontSizeLg)
      : hasBase
        ? Math.round(fontSize * (fallbacks.fontSizeLg / Math.max(1, fallbacks.fontSize)))
        : fallbacks.fontSizeLg;
  return { fontSize, fontSizeSm, fontSizeLg };
}
