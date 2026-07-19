/**
 * Buildings and site facilities.
 */
import type { App } from '../../../App';
import type { Group } from '../../../shapes/Group';
import { MID, fill, addLine, addCircle, addBox, addPoly, addEllipse } from './drawHelpers';

export function drawFactory(app: App, g: Group): void {
  addBox(app, g, 8, 22, 32, 16, 2);
  addBox(app, g, 12, 12, 8, 12, 1);
  addBox(app, g, 24, 16, 6, 8, 1);
  addLine(app, g, 14, 12, 0, -6, 2);
  addLine(app, g, 18, 12, 0, -4, 2);
  addLine(app, g, 14, 6, 4, 0, 1.5);
  addLine(app, g, 18, 8, 3, 0, 1.5);
  addLine(app, g, 14, 28, 6, 0, 1.2);
  addLine(app, g, 28, 28, 6, 0, 1.2);
}

export function drawBuilding(app: App, g: Group): void {
  addBox(app, g, 12, 8, 24, 32, 2);
  for (const y of [14, 22, 30]) {
    addLine(app, g, 16, y, 4, 0, 1.3);
    addLine(app, g, 28, y, 4, 0, 1.3);
  }
  addBox(app, g, 20, 32, 8, 8, 1);
}

export function drawHome(app: App, g: Group): void {
  addPoly(app, g, [8, 22, MID, 8, 40, 22], 1.7);
  addBox(app, g, 12, 22, 24, 16, 2);
  addBox(app, g, 20, 28, 8, 10, 1);
}

export function drawSchool(app: App, g: Group): void {
  addBox(app, g, 8, 18, 32, 20, 2);
  addPoly(app, g, [8, 18, MID, 8, 40, 18], 1.6);
  addBox(app, g, 20, 28, 8, 10, 1);
  addLine(app, g, MID, 8, 0, -4, 1.5);
}

export function drawStadium(app: App, g: Group): void {
  addEllipse(app, g, MID, MID, 16, 10, fill(), 1.6);
  addEllipse(app, g, MID, MID, 10, 6, null, 1.3);
  addLine(app, g, 12, 18, 4, -6, 1.3);
  addLine(app, g, 36, 18, -4, -6, 1.3);
}

export function drawShop(app: App, g: Group): void {
  addBox(app, g, 10, 18, 28, 20, 2);
  addPoly(app, g, [8, 18, 14, 10, 34, 10, 40, 18], 1.6);
  addBox(app, g, 20, 26, 8, 12, 1);
}

export function drawMarket(app: App, g: Group): void {
  addBox(app, g, 8, 20, 12, 16, 2);
  addBox(app, g, 18, 16, 12, 20, 2);
  addBox(app, g, 28, 22, 12, 14, 2);
  addLine(app, g, 8, 20, 4, -6, 1.3);
  addLine(app, g, 18, 16, 4, -6, 1.3);
  addLine(app, g, 28, 22, 4, -6, 1.3);
}

export function drawPark(app: App, g: Group): void {
  addPoly(app, g, [MID, 8, 34, 28, 14, 28], 1.5, fill());
  addLine(app, g, MID, 28, 0, 8, 1.6);
  addLine(app, g, 10, 38, 28, 0, 1.5);
  addCircle(app, g, 36, 14, 4, null, 1.3);
}

export function drawParking(app: App, g: Group): void {
  addBox(app, g, 10, 8, 28, 32, 3);
  // Drawn "P" (more reliable than text at glyph scale)
  addLine(app, g, 18, 14, 0, 20, 2.4);
  addLine(app, g, 18, 14, 10, 0, 2.4);
  addLine(app, g, 28, 14, 0, 8, 2.4);
  addLine(app, g, 18, 22, 10, 0, 2.4);
}

export function drawTemple(app: App, g: Group): void {
  addBox(app, g, 10, 24, 28, 14, 2);
  addPoly(app, g, [8, 24, MID, 8, 40, 24], 1.6);
  addLine(app, g, MID, 8, 0, -4, 1.5);
  addBox(app, g, 20, 28, 8, 10, 1);
  addLine(app, g, 14, 20, 4, 0, 1.2);
  addLine(app, g, 30, 20, 4, 0, 1.2);
}

export function drawStaircase(app: App, g: Group): void {
  addLine(app, g, 10, 36, 8, 0, 2);
  addLine(app, g, 18, 36, 0, -8, 2);
  addLine(app, g, 18, 28, 8, 0, 2);
  addLine(app, g, 26, 28, 0, -8, 2);
  addLine(app, g, 26, 20, 8, 0, 2);
  addLine(app, g, 34, 20, 0, -8, 2);
  addLine(app, g, 34, 12, 6, 0, 2);
}

export function drawLift(app: App, g: Group): void {
  addBox(app, g, 12, 8, 24, 32, 2);
  addLine(app, g, MID, 8, 0, 32, 1.4);
  addPoly(app, g, [18, 18, 24, 12, 30, 18], 1.5);
  addPoly(app, g, [18, 30, 24, 36, 30, 30], 1.5);
}

export function drawWindow(app: App, g: Group): void {
  addBox(app, g, 10, 10, 28, 28, 2);
  addLine(app, g, MID, 10, 0, 28, 1.5);
  addLine(app, g, 10, MID, 28, 0, 1.5);
}

