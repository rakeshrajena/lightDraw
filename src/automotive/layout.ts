import { bool, num, str } from './helpers';

export interface WidgetBounds {
  width: number;
  height: number;
  pad: number;
  innerWidth: number;
  innerHeight: number;
  dialSize: number;
}

/** Resolve widget box from props — dials use dialSize, panels use width/height. */
export function resolveBounds(
  props: Record<string, unknown>,
  defaultWidth: number,
  defaultHeight: number,
  pad = 8
): WidgetBounds {
  const width = Math.max(56, num(props, 'width', defaultWidth));
  const height = Math.max(44, num(props, 'height', defaultHeight));
  const innerWidth = Math.max(40, width - pad * 2);
  const innerHeight = Math.max(36, height - pad * 2);
  const explicit = num(props, 'size', 0);
  const dialSize =
    explicit > 0 ? explicit : Math.max(52, Math.min(innerWidth, innerHeight));
  return { width, height, pad, innerWidth, innerHeight, dialSize };
}

export function fluidFont(base: number, bounds: WidgetBounds, min = 8, max = 24): number {
  const scale = Math.min(bounds.innerWidth, bounds.innerHeight) / 120;
  return Math.round(Math.min(max, Math.max(min, base * scale)));
}

export function centerInBounds(
  bounds: WidgetBounds,
  contentW: number,
  contentH: number
): { x: number; y: number } {
  return {
    x: bounds.pad + Math.max(0, (bounds.innerWidth - contentW) / 2),
    y: bounds.pad + Math.max(0, (bounds.innerHeight - contentH) / 2),
  };
}

export type GaugeDisplay = 'analog' | 'digital';

/** Resolve analog needle dial vs digital LCD readout. */
export function resolveDisplay(
  props: Record<string, unknown>,
  fallback: GaugeDisplay = 'analog'
): GaugeDisplay {
  const mode = str(props, 'display', '').toLowerCase();
  if (mode === 'digital' || mode === 'lcd') return 'digital';
  if (mode === 'analog') return 'analog';
  if (str(props, 'theme', '') === 'digital' && bool(props, 'digitalGauges', false)) {
    return 'digital';
  }
  return fallback;
}
