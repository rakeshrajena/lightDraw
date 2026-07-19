/**
 * Schematic drawers — electromechanical.
 */
import type { App } from '../../../App';
import type { Group } from '../../../shapes/Group';
import { MID, accent, ledFill, switchAccent, addLeads, addPoly, addLine, addCircle, addText, addBox } from './helpers';

export function drawSwitch(app: App, g: Group, kind: 'spst' | 'spdt' | 'dpst' | 'dpdt' | 'push' | 'toggle' | 'slide' | 'dip' | 'rotary' | 'reed' | 'limit' | 'key' | 'estop' | 'nc' = 'spst'): void {
  addLine(app, g, 4, MID, 12, 0);
  addCircle(app, g, 16, MID, 2.5, switchAccent(), 0);
  if (kind === 'push' || kind === 'nc') {
    addLine(app, g, 16, MID - 8, 16, 0, 2, switchAccent());
    addCircle(app, g, 32, MID, 2.5, null, 1.5);
    if (kind === 'nc') addLine(app, g, 18, MID, 12, 0, 1.5);
  } else if (kind === 'rotary') {
    addCircle(app, g, MID, MID, 10, null, 1.6);
    addLine(app, g, MID, MID, 8, -8, 1.8, switchAccent());
  } else if (kind === 'estop') {
    addCircle(app, g, MID, MID, 12, ledFill(), 2);
    addText(app, g, 'STOP', 14, MID + 3, 6);
  } else {
    addLine(app, g, 16, MID, 14, kind === 'spdt' ? -10 : -12, 2.2, switchAccent());
    addCircle(app, g, 34, MID, 2.5, null, 1.5);
    if (kind === 'spdt' || kind === 'dpdt') addCircle(app, g, 34, MID - 12, 2.5, null, 1.5);
  }
  addLine(app, g, 36, MID, 8, 0);
  if (kind === 'dpst' || kind === 'dpdt') {
    addLine(app, g, 4, MID + 12, 12, 0);
    addCircle(app, g, 16, MID + 12, 2.2, switchAccent(), 0);
    addLine(app, g, 16, MID + 12, 14, -10, 1.8, switchAccent());
    addCircle(app, g, 34, MID + 12, 2.2, null, 1.5);
    addLine(app, g, 36, MID + 12, 8, 0);
  }
}

export function drawRelay(app: App, g: Group): void {
  addBox(app, g, 12, 8, 24, 32);
  addPoly(app, g, [16, 28, 18, 22, 22, 30, 26, 22, 28, 28], 1.5);
  addLine(app, g, 18, 14, 12, 0, 1.6, switchAccent());
  addCircle(app, g, 18, 14, 2, switchAccent(), 0);
  addCircle(app, g, 30, 14, 2, null, 1.4);
  addLine(app, g, 4, 28, 8, 0);
  addLine(app, g, 36, 28, 8, 0);
}

export function drawMotor(app: App, g: Group, label: string): void {
  addCircle(app, g, MID, MID, 14, null, 2);
  addText(app, g, label, MID - label.length * 2.4, MID + 3, 9);
  addLine(app, g, 4, MID, 6, 0);
  addLine(app, g, 38, MID, 6, 0);
}

export function drawConnector(app: App, g: Group, label: string): void {
  addBox(app, g, 12, 14, 24, 20, label);
  addLine(app, g, MID, 8, 0, 6);
  addLine(app, g, MID, 34, 0, 6);
}

export function drawSensor(app: App, g: Group, label: string): void {
  addBox(app, g, 8, 12, 32, 24, label);
  addLine(app, g, 4, MID, 4, 0);
  addLine(app, g, 40, MID, 4, 0);
}

export function drawMeter(app: App, g: Group, label: string): void {
  addCircle(app, g, MID, MID, 14, null, 2);
  addText(app, g, label, MID - 3, MID + 3, 10);
  addLine(app, g, MID, MID, 8, -8, 1.5, accent());
  addLeads(app, g);
}
