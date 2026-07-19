/**
 * Shared schematic glyph primitives (48×48 local coords).
 */
import type { App } from '../../../App';
import type { Group } from '../../../shapes/Group';
import { getActiveDiagram } from '../../theme';
import { SCHEMATIC_GLYPH_SIZE } from '../types';

export const S = SCHEMATIC_GLYPH_SIZE;
export const MID = S / 2;

export function stroke(): string {
  return getActiveDiagram().schematicStroke;
}

export function accent(): string {
  return getActiveDiagram().schematicResistor;
}

export function ledStroke(): string {
  return getActiveDiagram().schematicLedStroke;
}

export function ledFill(): string {
  return getActiveDiagram().schematicLedFill;
}

export function batteryAccent(): string {
  return getActiveDiagram().schematicBattery;
}

export function switchAccent(): string {
  return getActiveDiagram().schematicSwitch;
}

export function muted(): string {
  return getActiveDiagram().edgeMuted;
}

/** Shared lead lines left/right into the body. */
export function addLeads(app: App, g: Group, y = MID): void {
  g.add(app.line({ x: 6, y, x2: 6, y2: 0, stroke: stroke(), strokeWidth: 2, lineCap: 'round', listening: false }));
  g.add(app.line({ x: 36, y, x2: 6, y2: 0, stroke: stroke(), strokeWidth: 2, lineCap: 'round', listening: false }));
}

export function addPoly(app: App, g: Group, points: number[], sw = 2.1): void {
  g.add(
    app.polyline({
      points,
      fill: null,
      stroke: stroke(),
      strokeWidth: sw,
      lineCap: 'round',
      lineJoin: 'round',
      listening: false,
    })
  );
}

export function addLine(app: App, g: Group, x: number, y: number, dx: number, dy: number, sw = 2, color?: string): void {
  g.add(app.line({ x, y, x2: dx, y2: dy, stroke: color ?? stroke(), strokeWidth: sw, lineCap: 'round', listening: false }));
}

/** Circle helper — `(x, y)` is the center (library Circle uses top-left). */
export function addCircle(app: App, g: Group, x: number, y: number, r: number, fill: string | null = null, sw = 1.75): void {
  g.add(
    app.circle({
      x: x - r,
      y: y - r,
      radius: r,
      fill,
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

export function addBox(app: App, g: Group, x: number, y: number, w: number, h: number, label?: string): void {
  g.add(
    app.roundedRect({
      x,
      y,
      width: w,
      height: h,
      cornerRadius: 3,
      fill: getActiveDiagram().schematicFill,
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

export function arrowHead(app: App, g: Group, x: number, y: number, dx: number, dy: number, size = 4): void {
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;
  g.add(
    app.polygon({
      points: [
        x,
        y,
        x - ux * size + px * size * 0.55,
        y - uy * size + py * size * 0.55,
        x - ux * size - px * size * 0.55,
        y - uy * size - py * size * 0.55,
      ],
      fill: stroke(),
      stroke: null,
      listening: false,
    })
  );
}

