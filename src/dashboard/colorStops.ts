import { getActiveDashboard } from './theme';
import { isCssColorString } from '../utils/color';

/**
 * Value → color mapping for gauges, meters, and charts.
 *
 * Stops are evaluated in order; first matching `upTo` wins.
 * The last stop may omit `upTo` (catch-all).
 *
 * @example
 * colorStops: [
 *   { upTo: 40, color: 'success' },
 *   { upTo: 75, color: 'warning' },
 *   { color: 'danger' },
 * ]
 */
export interface ValueColorStop {
  /** Inclusive upper bound. Omit on the final stop for “everything else”. */
  upTo?: number;
  /** Any CSS color (`#22c55e`, `rgb()`, `hsl()`, named) or semantic: primary | success | warning | danger | secondary */
  color: string;
}

/** Arc zones on dials — `from`/`to` are 0–1 fractions of max (or absolute if > 1). */
export interface DialZoneInput {
  from: number;
  to: number;
  color: string;
}

const SEMANTIC = new Set(['primary', 'success', 'warning', 'danger', 'secondary']);

/** Resolve semantic color names against the active dashboard palette. */
export function resolveSemanticColor(color: string, fallback?: string): string {
  if (!color) return fallback ?? getActiveDashboard().primary;
  if (isCssColorString(color)) return color;
  if (!SEMANTIC.has(color)) return color;
  const d = getActiveDashboard();
  switch (color) {
    case 'success':
      return d.success;
    case 'warning':
      return d.warning;
    case 'danger':
      return d.danger;
    case 'secondary':
      return d.secondary;
    case 'primary':
    default:
      return d.primary;
  }
}

/**
 * Pick a color for `value` from ordered stops.
 * Falls back to `fallback` (or theme primary) when stops are empty.
 */
export function resolveValueColor(
  value: number,
  stops: ValueColorStop[] | undefined,
  fallback?: string
): string {
  const fb = fallback ?? getActiveDashboard().primary;
  if (!stops?.length) return fb;
  for (const stop of stops) {
    if (stop.upTo === undefined || value <= stop.upTo) {
      return resolveSemanticColor(stop.color, fb);
    }
  }
  const last = stops[stops.length - 1];
  return resolveSemanticColor(last.color, fb);
}

/** Normalize dial zone inputs to 0–1 fractions with resolved colors. */
export function normalizeDialZones(
  zones: DialZoneInput[] | undefined,
  max: number
): { from: number; to: number; color: string }[] {
  if (!zones?.length) return [];
  const m = Math.max(max, 1);
  return zones.map((z) => {
    const from = z.from > 1 ? z.from / m : z.from;
    const to = z.to > 1 ? z.to / m : z.to;
    return {
      from: Math.min(1, Math.max(0, from)),
      to: Math.min(1, Math.max(0, to)),
      color: resolveSemanticColor(z.color),
    };
  });
}

/** Read colorStops from widget props (supports alias `thresholds`). */
export function readColorStops(props: Record<string, unknown>): ValueColorStop[] | undefined {
  const raw = props.colorStops ?? props.thresholds;
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  return raw
    .map((s) => {
      if (!s || typeof s !== 'object') return null;
      const o = s as Record<string, unknown>;
      const color = typeof o.color === 'string' ? o.color : '';
      if (!color) return null;
      const stop: ValueColorStop = { color };
      if (typeof o.upTo === 'number') stop.upTo = o.upTo;
      else if (typeof o.max === 'number') stop.upTo = o.max;
      return stop;
    })
    .filter((s): s is ValueColorStop => s !== null);
}

export function readDialZones(props: Record<string, unknown>): DialZoneInput[] | undefined {
  const raw = props.colorZones ?? props.zones;
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  return raw
    .map((z) => {
      if (!z || typeof z !== 'object') return null;
      const o = z as Record<string, unknown>;
      if (typeof o.from !== 'number' || typeof o.to !== 'number' || typeof o.color !== 'string') {
        return null;
      }
      return { from: o.from, to: o.to, color: o.color };
    })
    .filter((z): z is DialZoneInput => z !== null);
}
