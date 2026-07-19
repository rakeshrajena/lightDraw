/**
 * Schematic drawers — semiconductors.
 */
import type { App } from '../../../App';
import type { Group } from '../../../shapes/Group';
import { MID, stroke, ledStroke, ledFill, addLeads, addLine, addCircle, addText, arrowHead } from './helpers';

export function drawDiode(
  app: App,
  g: Group,
  variant:
    | 'std'
    | 'schottky'
    | 'zener'
    | 'tvs'
    | 'led'
    | 'ir'
    | 'laser'
    | 'photo'
    | 'tunnel'
    | 'varicap'
    | 'bridge' = 'std'
): void {
  if (variant === 'bridge') {
    addLine(app, g, MID, 8, 0, -4);
    addLine(app, g, MID, 40, 0, 4);
    addLine(app, g, 8, MID, -4, 0);
    addLine(app, g, 40, MID, 4, 0);
    g.add(
      app.polygon({
        points: [MID, 12, 36, MID, MID, 36, 12, MID],
        fill: null,
        stroke: stroke(),
        strokeWidth: 1.7,
        listening: false,
      })
    );
    return;
  }
  addLeads(app, g);
  const filled = variant === 'led' || variant === 'ir' || variant === 'laser';
  g.add(
    app.polygon({
      points: [14, MID - 9, 30, MID, 14, MID + 9],
      fill: filled ? ledFill() : null,
      stroke: filled ? ledStroke() : stroke(),
      strokeWidth: 1.8,
      listening: false,
    })
  );
  const bar = filled ? ledStroke() : stroke();
  addLine(app, g, 30, MID - 10, 0, 20, 2, bar);
  if (variant === 'schottky') {
    addLine(app, g, 30, MID - 10, 5, 3, 1.5);
    addLine(app, g, 30, MID + 10, 5, -3, 1.5);
  }
  if (variant === 'zener') {
    addLine(app, g, 30, MID - 10, -5, 0, 1.5);
    addLine(app, g, 30, MID + 10, 5, 0, 1.5);
  }
  if (variant === 'tvs') {
    addLine(app, g, 30, MID - 10, -4, 0, 1.4);
    addLine(app, g, 30, MID + 10, 4, 0, 1.4);
    addLine(app, g, 34, MID - 8, 0, 16, 1.5);
  }
  if (variant === 'led' || variant === 'ir' || variant === 'laser') {
    // Keep emission arrows inside the 48×48 plate
    addLine(app, g, 26, MID - 10, 6, -5, 1.3, ledStroke());
    addLine(app, g, 30, MID - 8, 5, -4, 1.3, ledStroke());
    arrowHead(app, g, 32, MID - 15, 1, -1, 2.5);
    arrowHead(app, g, 35, MID - 12, 1, -1, 2.5);
    if (variant === 'ir') addText(app, g, 'IR', 8, 12, 7);
    if (variant === 'laser') addText(app, g, 'L', 8, 12, 8);
  }
  if (variant === 'photo') {
    addLine(app, g, 8, 8, 8, 8, 1.3);
    addLine(app, g, 12, 6, 8, 8, 1.3);
    arrowHead(app, g, 16, 16, 1, 1, 2.5);
    arrowHead(app, g, 20, 14, 1, 1, 2.5);
  }
  if (variant === 'tunnel') {
    addLine(app, g, 30, MID - 6, -5, 0, 1.5);
    addLine(app, g, 30, MID + 6, -5, 0, 1.5);
  }
  if (variant === 'varicap') addLine(app, g, 34, 12, 0, 24, 2);
}

export function drawBjt(app: App, g: Group, pnp = false, photo = false): void {
  addCircle(app, g, MID, MID, 13, null, 1.6);
  addLine(app, g, 6, MID, 12, 0);
  addLine(app, g, 18, MID - 9, 0, 18, 2.4);
  addLine(app, g, 18, MID - 4, 11, -8, 1.7);
  addLine(app, g, 18, MID + 4, 11, 8, 1.7);
  addLine(app, g, 29, 12, 0, -4);
  addLine(app, g, 29, 36, 0, 4);
  if (pnp) arrowHead(app, g, 22, MID - 7, -1, 0.7, 3.5);
  else arrowHead(app, g, 27, MID + 10, 0.7, 1, 3.5);
  if (photo) {
    addLine(app, g, 8, 10, 6, 6, 1.2);
    addLine(app, g, 12, 8, 6, 6, 1.2);
    arrowHead(app, g, 14, 16, 1, 1, 2.5);
    arrowHead(app, g, 18, 14, 1, 1, 2.5);
  }
}

export function drawMosfet(app: App, g: Group, pchan = false): void {
  addLine(app, g, 6, MID, 10, 0);
  addLine(app, g, 16, MID - 10, 0, 20, 2);
  addLine(app, g, 20, MID - 10, 0, 6, 2);
  addLine(app, g, 20, MID - 2, 0, 4, 2);
  addLine(app, g, 20, MID + 4, 0, 6, 2);
  addLine(app, g, 20, MID - 7, 10, 0);
  addLine(app, g, 20, MID + 7, 10, 0);
  addLine(app, g, 30, 12, 0, 5);
  addLine(app, g, 30, 31, 0, 5);
  addLine(app, g, 30, 12, 0, -4);
  addLine(app, g, 30, 36, 0, 4);
  addLine(app, g, 20, MID, 10, 0, 1.4);
  if (pchan) arrowHead(app, g, 24, MID, -1, 0, 3.2);
  else arrowHead(app, g, 26, MID, 1, 0, 3.2);
}

export function drawJfet(app: App, g: Group, pchan = false): void {
  addCircle(app, g, MID, MID, 13, null, 1.6);
  addLine(app, g, 6, MID, 12, 0);
  addLine(app, g, 18, MID - 9, 0, 18, 2.2);
  addLine(app, g, 18, MID - 7, 11, 0);
  addLine(app, g, 18, MID + 7, 11, 0);
  addLine(app, g, 29, 13, 0, -5);
  addLine(app, g, 29, 35, 0, 5);
  addLine(app, g, 18, MID, 8, 0, 1.5);
  if (pchan) arrowHead(app, g, 18, MID, 1, 0, 3.2);
  else arrowHead(app, g, 22, MID, -1, 0, 3.2);
}

export function drawUjt(app: App, g: Group): void {
  addCircle(app, g, MID, MID, 13, null, 1.6);
  addLine(app, g, MID, 8, 0, 6);
  addLine(app, g, MID, 34, 0, 6);
  addLine(app, g, MID - 5, 17, 0, 14, 2.2);
  addLine(app, g, 6, MID + 4, 12, -5, 1.7);
  arrowHead(app, g, 18, MID - 1, 1, -0.5, 3.2);
}

export function drawDarlington(app: App, g: Group): void {
  addCircle(app, g, MID, MID, 13, null, 1.5);
  addLine(app, g, 6, MID, 10, 0);
  addLine(app, g, 16, MID - 8, 0, 16, 2);
  addLine(app, g, 16, MID - 4, 8, -6, 1.5);
  addLine(app, g, 16, MID + 4, 8, 6, 1.5);
  addLine(app, g, 24, MID - 6, 0, 12, 1.8);
  addLine(app, g, 24, MID - 3, 7, -6, 1.5);
  addLine(app, g, 24, MID + 3, 7, 6, 1.5);
  addLine(app, g, 31, 12, 0, -4);
  addLine(app, g, 31, 36, 0, 4);
  arrowHead(app, g, 29, MID + 8, 0.6, 1, 3.2);
}

export function drawIgbt(app: App, g: Group): void {
  drawMosfet(app, g, false);
  arrowHead(app, g, 30, 38, 0, 1, 3.5);
}

export function drawThyristor(app: App, g: Group, kind: 'scr' | 'triac' | 'diac' | 'gto' = 'scr'): void {
  addLeads(app, g);
  if (kind === 'diac') {
    g.add(
      app.polygon({
        points: [14, MID - 8, 24, MID, 14, MID + 8],
        fill: null,
        stroke: stroke(),
        strokeWidth: 1.7,
        listening: false,
      })
    );
    g.add(
      app.polygon({
        points: [34, MID - 8, 24, MID, 34, MID + 8],
        fill: null,
        stroke: stroke(),
        strokeWidth: 1.7,
        listening: false,
      })
    );
    addLine(app, g, 24, MID - 10, 0, 20, 1.8);
    return;
  }
  if (kind === 'triac') {
    // Bidirectional SCR pair + gate (IEC-style TRIAC)
    g.add(
      app.polygon({
        points: [12, MID - 8, 22, MID, 12, MID + 8],
        fill: null,
        stroke: stroke(),
        strokeWidth: 1.7,
        listening: false,
      })
    );
    g.add(
      app.polygon({
        points: [36, MID - 8, 26, MID, 36, MID + 8],
        fill: null,
        stroke: stroke(),
        strokeWidth: 1.7,
        listening: false,
      })
    );
    addLine(app, g, 22, MID - 9, 0, 18, 1.7);
    addLine(app, g, 26, MID - 9, 0, 18, 1.7);
    addLine(app, g, 24, MID + 8, 0, 10, 1.7);
    addLine(app, g, 24, 42, 6, 0, 1.7);
    return;
  }
  g.add(
    app.polygon({
      points: [14, MID - 9, 30, MID, 14, MID + 9],
      fill: null,
      stroke: stroke(),
      strokeWidth: 1.8,
      listening: false,
    })
  );
  addLine(app, g, 30, MID - 10, 0, 20, 2);
  addLine(app, g, 22, MID + 6, 0, 12, 1.6);
  if (kind === 'gto') {
    // Gate with turn-off bar (GTO)
    addLine(app, g, 18, 40, 8, 0, 1.6);
    addLine(app, g, 20, 38, 0, 4, 1.4);
    addLine(app, g, 24, 38, 0, 4, 1.4);
  }
}
