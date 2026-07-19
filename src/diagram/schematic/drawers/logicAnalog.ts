/**
 * Schematic drawers — logicAnalog.
 */
import type { App } from '../../../App';
import type { Group } from '../../../shapes/Group';
import { getActiveDiagram } from '../../theme';
import { MID, stroke, addLeads, addPoly, addLine, addCircle, addText, addBox } from './helpers';

export function drawLogic(app: App, g: Group, kind: string): void {
  const labels: Record<string, string> = {
    not: '1',
    buffer: '1',
    and: '&',
    nand: '&',
    or: '≥1',
    nor: '≥1',
    xor: '=1',
    xnor: '=1',
    schmitt: 'ST',
  };
  addBox(app, g, 10, 10, 28, 28, labels[kind] ?? kind.toUpperCase());
  addLine(app, g, 4, MID, 6, 0);
  addLine(app, g, 38, MID, 6, 0);
  if (kind === 'nand' || kind === 'nor' || kind === 'xnor' || kind === 'not') {
    addCircle(app, g, 40, MID, 2.5, getActiveDiagram().schematicFill, 1.4);
  }
  if (kind === 'and' || kind === 'nand' || kind === 'or' || kind === 'nor' || kind === 'xor' || kind === 'xnor') {
    addLine(app, g, 4, MID - 8, 6, 0);
    addLine(app, g, 4, MID + 8, 6, 0);
  }
  if (kind === 'schmitt') addPoly(app, g, [16, 30, 22, 30, 26, 18, 32, 18], 1.4);
}

export function drawOpAmp(app: App, g: Group, kind: 'op' | 'inst' | 'comp' = 'op'): void {
  g.add(
    app.polygon({
      points: [10, 8, 38, MID, 10, 40],
      fill: getActiveDiagram().schematicFill,
      stroke: stroke(),
      strokeWidth: 1.8,
      listening: false,
    })
  );
  addLine(app, g, 4, 16, 6, 0);
  addLine(app, g, 4, 32, 6, 0);
  addLine(app, g, 38, MID, 6, 0);
  addText(app, g, '+', 12, 20, 9);
  addText(app, g, '−', 12, 36, 10);
  if (kind === 'inst') addText(app, g, 'INA', 18, 28, 7);
  if (kind === 'comp') addText(app, g, 'CMP', 18, 28, 7);
}

export function drawIcBox(app: App, g: Group, label: string, pins = 2): void {
  addBox(app, g, 10, 12, 28, 24, label);
  if (pins >= 2) {
    addLine(app, g, 4, 18, 6, 0);
    addLine(app, g, 4, 30, 6, 0);
    addLine(app, g, 38, 18, 6, 0);
    addLine(app, g, 38, 30, 6, 0);
  } else {
    addLeads(app, g);
  }
}
