/**
 * Schematic drawers — powerMisc.
 */
import type { App } from '../../../App';
import type { Group } from '../../../shapes/Group';
import { getActiveDiagram } from '../../theme';
import { MID, stroke, batteryAccent, muted, addLeads, addPoly, addLine, addCircle, addText, addBox, arrowHead } from './helpers';

export function drawGround(app: App, g: Group, variant: 'earth' | 'chassis' | 'signal' = 'earth'): void {
  addLine(app, g, MID, 8, 0, 12);
  if (variant === 'signal') {
    g.add(
      app.polygon({
        points: [MID, 38, 14, 20, 34, 20],
        fill: stroke(),
        stroke: null,
        listening: false,
      })
    );
  } else if (variant === 'chassis') {
    addLine(app, g, 14, 22, 20, 0, 2.2);
    addLine(app, g, 16, 22, -4, 10, 1.8);
    addLine(app, g, 24, 22, 0, 12, 1.8);
    addLine(app, g, 32, 22, 4, 10, 1.8);
  } else {
    addLine(app, g, 12, 22, 24, 0, 2.4);
    addLine(app, g, 16, 28, 16, 0, 2);
    addLine(app, g, 20, 34, 8, 0, 1.7);
  }
}

export function drawBattery(app: App, g: Group, cells = 1): void {
  const startX = cells === 1 ? 18 : 11;
  addLine(app, g, 4, MID, startX - 4, 0);
  let x = startX;
  for (let i = 0; i < cells; i++) {
    addLine(app, g, x, 17, 0, 14, 2);
    addLine(app, g, x + 5, 11, 0, 26, 2.6);
    x += 11;
  }
  addLine(app, g, x - 1, MID, Math.max(4, 44 - (x - 1)), 0);
  addText(app, g, '+', Math.min(36, x - 6), 12, 9);
}

export function drawSource(app: App, g: Group, kind: 'dc' | 'ac' | 'voltage' | 'current'): void {
  addLeads(app, g);
  addCircle(app, g, MID, MID, 12, null, 2);
  if (kind === 'ac') {
    addPoly(app, g, [14, MID, 18, MID - 7, 24, MID + 7, 30, MID - 7, 34, MID], 1.8);
  } else if (kind === 'current') {
    addLine(app, g, MID, MID + 8, 0, -16, 2);
    arrowHead(app, g, MID, MID - 8, 0, -1, 4);
  } else if (kind === 'dc') {
    // IEC-style DC: circle with solid / dashed horizontal pair
    addLine(app, g, 16, MID - 4, 16, 0, 2.2);
    addLine(app, g, 16, MID + 4, 16, 0, 1.4);
  } else {
    // Independent voltage source: + / −
    addText(app, g, '+', MID - 4, MID - 4, 11);
    addText(app, g, '-', MID - 3, MID + 14, 14);
  }
}

export function drawFuse(app: App, g: Group, breaker = false): void {
  addLeads(app, g);
  addBox(app, g, 14, MID - 6, 20, 12);
  if (breaker) {
    addCircle(app, g, 18, MID, 2, stroke(), 0);
    addLine(app, g, 18, MID, 12, -8, 1.7);
    addCircle(app, g, 32, MID, 2, null, 1.5);
  } else {
    addLine(app, g, 16, MID, 16, 0, 1.7);
  }
}

export function drawWireStub(app: App, g: Group): void {
  addLine(app, g, 0, MID, 48, 0, 2.25, getActiveDiagram().schematicWire);
}

export function drawJunction(app: App, g: Group): void {
  addCircle(app, g, MID, MID, 3.5, getActiveDiagram().schematicWire, 0);
  addLine(app, g, 8, MID, 32, 0, 1.5, muted());
  addLine(app, g, MID, 8, 0, 32, 1.5, muted());
}

export function drawNoConnect(app: App, g: Group): void {
  addLine(app, g, 16, 16, 16, 16, 2);
  addLine(app, g, 32, 16, -16, 16, 2);
  addLine(app, g, 4, MID, 10, 0);
}

export function drawPowerFlag(app: App, g: Group): void {
  g.add(
    app.polygon({
      points: [8, MID, 20, 12, 40, 12, 40, 36, 20, 36],
      fill: getActiveDiagram().schematicFill,
      stroke: batteryAccent(),
      strokeWidth: 1.8,
      listening: false,
    })
  );
  addText(app, g, 'PWR', 18, MID + 3, 7);
}

export function drawTestPoint(app: App, g: Group): void {
  addCircle(app, g, MID, MID, 5, null, 2);
  addLine(app, g, MID, MID + 5, 0, 14);
  addText(app, g, 'TP', 18, 14, 7);
}

export function drawFan(app: App, g: Group): void {
  addCircle(app, g, MID, MID, 14, null, 1.8);
  addLine(app, g, MID, MID, 10, -4, 1.5);
  addLine(app, g, MID, MID, -8, -8, 1.5);
  addLine(app, g, MID, MID, -2, 10, 1.5);
}

export function drawHeatsink(app: App, g: Group): void {
  for (let i = 0; i < 5; i++) addLine(app, g, 12 + i * 6, 10, 0, 28, 2);
  addLine(app, g, 10, 38, 28, 0, 2);
}

export function drawMountingHole(app: App, g: Group): void {
  addCircle(app, g, MID, MID, 10, null, 1.6);
  addCircle(app, g, MID, MID, 4, null, 1.6);
}

/** Draw glyph into an existing pad group (local coords). */
