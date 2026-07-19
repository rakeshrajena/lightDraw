/**
 * Schematic drawers — passives.
 */
import type { App } from '../../../App';
import type { Group } from '../../../shapes/Group';
import { MID, muted, addLeads, addPoly, addLine, addText, addBox, arrowHead } from './helpers';

export function drawResistor(
  app: App,
  g: Group,
  variant: 'fixed' | 'variable' | 'pot' | 'thermNtc' | 'thermPtc' | 'ldr' | 'mov' = 'fixed'
): void {
  addLeads(app, g);
  addPoly(app, g, [12, MID, 15, MID - 8, 21, MID + 8, 27, MID - 8, 33, MID + 8, 36, MID], 2);
  if (variant === 'variable' || variant === 'pot') {
    // Keep arrow fully inside the 48×48 plate
    addLine(app, g, 24, 36, 0, -20, 1.5);
    arrowHead(app, g, 24, 16, 0, -1, 3.5);
    if (variant === 'pot') addLine(app, g, 24, 36, 0, 4, 1.5);
  }
  if (variant === 'thermNtc') {
    addLine(app, g, 16, 34, 14, -16, 1.4);
    addLine(app, g, 28, 20, 4, 0, 1.4);
    addText(app, g, '-t', 31, 16, 8);
  }
  if (variant === 'thermPtc') {
    addLine(app, g, 16, 34, 14, -16, 1.4);
    addLine(app, g, 28, 20, 4, 0, 1.4);
    addText(app, g, '+t', 31, 16, 8);
  }
  if (variant === 'ldr') {
    addLine(app, g, 30, 12, 5, 5, 1.3);
    addLine(app, g, 34, 10, 5, 5, 1.3);
    arrowHead(app, g, 35, 17, 1, 1, 2.5);
    arrowHead(app, g, 39, 15, 1, 1, 2.5);
  }
  if (variant === 'mov') {
    addLine(app, g, 16, 34, 14, -16, 1.4);
    addLine(app, g, 28, 20, 4, 0, 1.4);
  }
}

export function drawCapacitor(app: App, g: Group, variant: 'np' | 'electrolytic' | 'variable' = 'np'): void {
  addLine(app, g, 6, MID, 12, 0);
  addLine(app, g, 20, 14, 0, 20, 2.5);
  if (variant === 'electrolytic') {
    addLine(app, g, 28, 16, 0, 16, 2.5);
    addText(app, g, '+', 30, 18, 9);
  } else {
    addLine(app, g, 28, 14, 0, 20, 2.5);
  }
  addLine(app, g, 30, MID, 12, 0);
  if (variant === 'variable') {
    addLine(app, g, 18, 34, 12, -20, 1.4);
    arrowHead(app, g, 30, 14, 1, -1, 3);
  }
}

export function drawInductor(app: App, g: Group, variant: 'fixed' | 'variable' | 'ferrite' | 'rf' = 'fixed'): void {
  addLeads(app, g);
  for (let i = 0; i < 4; i++) {
    const x0 = 12 + i * 6;
    addPoly(app, g, [x0, MID, x0 + 1.5, MID - 7, x0 + 3, MID - 8, x0 + 4.5, MID - 7, x0 + 6, MID], 2);
  }
  if (variant === 'variable') {
    addLine(app, g, 24, 40, 0, -28, 1.4);
    arrowHead(app, g, 24, 12, 0, -1, 3.5);
  }
  if (variant === 'ferrite') {
    addLine(app, g, 14, MID + 9, 20, 0, 2);
    addLine(app, g, 14, MID + 12, 20, 0, 2);
  }
  if (variant === 'rf') addText(app, g, 'RF', 18, 12, 7);
}

export function drawCrystal(app: App, g: Group, ceramic = false): void {
  addLeads(app, g);
  addLine(app, g, 18, 12, 0, 24, 2.4);
  addBox(app, g, 20, 16, 8, 16);
  addLine(app, g, 30, 12, 0, 24, 2.4);
  if (ceramic) {
    // Ceramic resonator: crystal + parallel load caps (simplified)
    addLine(app, g, 14, 14, 0, 8, 1.5);
    addLine(app, g, 16, 14, 0, 8, 1.5);
    addLine(app, g, 32, 26, 0, 8, 1.5);
    addLine(app, g, 34, 26, 0, 8, 1.5);
  }
}

export function drawTransformer(app: App, g: Group, auto = false): void {
  for (let i = 0; i < 3; i++) {
    const y = 14 + i * 7;
    addPoly(app, g, [12, y, 15, y - 3, 18, y, 15, y + 3, 12, y], 1.6);
    if (!auto) addPoly(app, g, [30, y, 33, y - 3, 36, y, 33, y + 3, 30, y], 1.6);
  }
  addLine(app, g, 22, 12, 0, 24, 1.5, muted());
  if (!auto) addLine(app, g, 26, 12, 0, 24, 1.5, muted());
  addLine(app, g, 10, 10, 0, -2);
  addLine(app, g, 10, 38, 0, 2);
  if (!auto) {
    addLine(app, g, 38, 10, 0, -2);
    addLine(app, g, 38, 38, 0, 2);
  }
}
