/**
 * Diagram text measurement helpers.
 */
import { getActiveDiagram } from '../theme';

let measureCtx: CanvasRenderingContext2D | null = null;

function getMeasureCtx(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null;
  if (!measureCtx) {
    const canvas = document.createElement('canvas');
    measureCtx = canvas.getContext('2d');
  }
  return measureCtx;
}

/** Measure label width using canvas text metrics (falls back to heuristic in Node). */
export function measureTextWidth(
  text: string,
  fontSize: number,
  fontWeight: string | number = '600',
  fontFamily = getActiveDiagram().fontFamily
): number {
  const ctx = getMeasureCtx();
  if (!ctx) return text.length * fontSize * 0.55;
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  return ctx.measureText(text).width;
}

export function centerTextX(
  label: string,
  boxWidth: number,
  fontSize: number = getActiveDiagram().fontSize.base,
  fontWeight: string | number = '600',
  fontFamily = getActiveDiagram().fontFamily
): number {
  const w = measureTextWidth(label, fontSize, fontWeight, fontFamily);
  return Math.max(getActiveDiagram().spacing.sm, (boxWidth - w) / 2);
}
