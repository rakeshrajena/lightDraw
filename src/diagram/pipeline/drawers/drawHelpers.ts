/**
 * Shared 48×48 glyph drawing primitives for pipeline symbols.
 */
import type { App } from '../../../App';
import type { Group } from '../../../shapes/Group';
import { getActiveDiagram } from '../../theme';
import { PIPELINE_GLYPH_SIZE } from '../types';

export const S = PIPELINE_GLYPH_SIZE;
export const MID = S / 2;

export function stroke(): string {
  return getActiveDiagram().schematicStroke;
}

export function fill(): string {
  return getActiveDiagram().schematicFill;
}

export function addLine(app: App, g: Group, x: number, y: number, dx: number, dy: number, sw = 2, color?: string): void {
  g.add(app.line({ x, y, x2: dx, y2: dy, stroke: color ?? stroke(), strokeWidth: sw, lineCap: 'round', listening: false }));
}

/** Circle helper — `(x, y)` is the center (library Circle uses top-left). */

export function addCircle(app: App, g: Group, x: number, y: number, r: number, fillColor: string | null = null, sw = 1.75): void {
  g.add(
    app.circle({
      x: x - r,
      y: y - r,
      radius: r,
      fill: fillColor,
      stroke: stroke(),
      strokeWidth: sw,
      listening: false,
    })
  );
}

export function addText(app: App, g: Group, text: string, x: number, y: number, size = 8): void {
  g.add(
    app.text({
      text,
      x,
      y,
      fontSize: size,
      fontWeight: '700',
      fontFamily: getActiveDiagram().fontFamily,
      fill: stroke(),
      listening: false,
    })
  );
}

export function addBox(
  app: App,
  g: Group,
  x: number,
  y: number,
  w: number,
  h: number,
  labelOrRadius?: string | number
): void {
  const radius = typeof labelOrRadius === 'number' ? labelOrRadius : 4;
  const label = typeof labelOrRadius === 'string' ? labelOrRadius : undefined;
  g.add(
    app.roundedRect({
      x,
      y,
      width: w,
      height: h,
      cornerRadius: radius,
      fill: fill(),
      stroke: stroke(),
      strokeWidth: 1.75,
      listening: false,
    })
  );
  if (label) {
    const approx = label.length * 4.2;
    addText(app, g, label, x + Math.max(2, (w - approx) / 2), y + h / 2 + 3, 8);
  }
}

export function addPoly(app: App, g: Group, points: number[], sw = 2.1, fillColor: string | null = null): void {
  g.add(
    app.polygon({
      points,
      fill: fillColor,
      stroke: stroke(),
      strokeWidth: sw,
      listening: false,
    })
  );
}

export function addEllipse(app: App, g: Group, x: number, y: number, radiusX: number, radiusY: number, fillColor: string | null = null, sw = 1.75): void {
  g.add(
    app.ellipse({
      x: x - radiusX,
      y: y - radiusY,
      radiusX,
      radiusY,
      fill: fillColor,
      stroke: stroke(),
      strokeWidth: sw,
      listening: false,
    })
  );
}

/* ── Shared family drawers (local 48×48 coords) ─────────────────────────── */

