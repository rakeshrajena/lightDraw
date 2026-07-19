/**
 * Nature marks and consumer/device glyphs.
 */
import type { App } from '../../../App';
import type { Group } from '../../../shapes/Group';
import { MID, stroke, fill, addLine, addCircle, addBox, addPoly, addEllipse } from './drawHelpers';

export function drawEarth(app: App, g: Group): void {
  addCircle(app, g, MID, MID, 14, fill(), 1.8);
  addEllipse(app, g, MID, MID, 7, 14, null, 1.4);
  addLine(app, g, 10, MID, 28, 0, 1.4);
  addLine(app, g, 12, 16, 24, 0, 1.2);
  addLine(app, g, 12, 32, 24, 0, 1.2);
}

export function drawStarMark(app: App, g: Group): void {
  addPoly(app, g, [MID, 8, 28, 18, 40, 18, 30, 28, 34, 40, MID, 32, 14, 40, 18, 28, 8, 18, 20, 18], 1.5, fill());
}

export function drawSun(app: App, g: Group): void {
  addCircle(app, g, MID, MID, 8, fill(), 1.7);
  for (const [dx, dy] of [[0, -14], [0, 14], [-14, 0], [14, 0], [-10, -10], [10, -10], [-10, 10], [10, 10]]) {
    addLine(app, g, MID + dx * 0.55, MID + dy * 0.55, dx * 0.35, dy * 0.35, 1.5);
  }
}

export function drawPlant(app: App, g: Group): void {
  addLine(app, g, MID, 38, 0, -16, 2);
  addPoly(app, g, [MID, 22, 14, 14, MID, 18], 1.4, fill());
  addPoly(app, g, [MID, 20, 34, 10, MID, 16], 1.4, fill());
  addBox(app, g, 16, 34, 16, 6, 2);
}

export function drawForest(app: App, g: Group): void {
  addPoly(app, g, [12, 32, 12, 18, 4, 18, 12, 8, 20, 18, 12, 18], 1.4, fill());
  addPoly(app, g, [28, 36, 28, 16, 18, 16, 28, 6, 38, 16, 28, 16], 1.4, fill());
  addLine(app, g, 8, 38, 32, 0, 1.5);
}

export function drawHillStation(app: App, g: Group): void {
  addPoly(app, g, [6, 36, 16, 16, 24, 28, 32, 12, 42, 36], 1.6);
  addBox(app, g, 18, 26, 10, 10, 1);
  addPoly(app, g, [18, 26, 23, 20, 28, 26], 1.4);
}

export function drawSolarPanel(app: App, g: Group): void {
  addPoly(app, g, [8, 30, 18, 12, 40, 12, 30, 30], 1.6, fill());
  addLine(app, g, 13, 21, 22, 0, 1.2);
  addLine(app, g, 16, 27, 18, 0, 1.2);
  addLine(app, g, 20, 12, -5, 18, 1.2);
  addLine(app, g, 28, 12, -5, 18, 1.2);
  addLine(app, g, 20, 34, 0, 4, 1.5);
  addLine(app, g, 14, 38, 12, 0, 1.5);
}

export function drawMap(app: App, g: Group): void {
  addPoly(app, g, [8, 12, 18, 10, 30, 14, 40, 10, 40, 36, 30, 40, 18, 36, 8, 40], 1.6, fill());
  addLine(app, g, 18, 10, 0, 26, 1.3);
  addLine(app, g, 30, 14, 0, 26, 1.3);
  addCircle(app, g, 24, 22, 2.5, stroke(), 0);
}

export function drawUmbrella(app: App, g: Group): void {
  addPoly(app, g, [8, 22, MID, 10, 40, 22], 1.6, fill());
  addLine(app, g, MID, 22, 0, 14, 2);
  addLine(app, g, MID, 36, 6, 2, 1.6);
}

export function drawLaptop(app: App, g: Group): void {
  addBox(app, g, 10, 12, 28, 18, 2);
  addLine(app, g, 8, 32, 32, 0, 2.2);
  addLine(app, g, 14, 20, 20, 0, 1.2);
}

export function drawGps(app: App, g: Group): void {
  addCircle(app, g, MID, 18, 8, fill(), 1.7);
  addPoly(app, g, [MID, 40, 18, 24, 30, 24], 1.6, fill());
  addCircle(app, g, MID, 18, 3, stroke(), 0);
  addLine(app, g, 34, 12, 6, -4, 1.3);
  addLine(app, g, 34, 16, 8, 0, 1.3);
}

export function drawPhoneTower(app: App, g: Group): void {
  addLine(app, g, MID, 40, -10, -28, 1.6);
  addLine(app, g, MID, 40, 10, -28, 1.6);
  addLine(app, g, 16, 24, 16, 0, 1.4);
  addLine(app, g, 18, 16, 12, 0, 1.4);
  addLine(app, g, MID, 12, 0, -4, 1.5);
  addLine(app, g, 34, 10, 6, -4, 1.3);
  addLine(app, g, 34, 14, 8, 0, 1.3);
  addLine(app, g, 34, 18, 6, 4, 1.3);
}

export function drawWifi(app: App, g: Group): void {
  addCircle(app, g, MID, 34, 2.5, stroke(), 0);
  addPoly(app, g, [16, 28, MID, 34, 32, 28], 1.4);
  addPoly(app, g, [12, 22, MID, 30, 36, 22], 1.4);
  addPoly(app, g, [8, 16, MID, 26, 40, 16], 1.4);
}

export function drawLight(app: App, g: Group): void {
  addCircle(app, g, MID, 18, 10, fill(), 1.6);
  addBox(app, g, 20, 28, 8, 6, 1);
  addLine(app, g, 18, 36, 12, 0, 1.5);
  addLine(app, g, MID, 8, 0, -4, 1.3);
  addLine(app, g, 14, 12, -4, -4, 1.3);
  addLine(app, g, 34, 12, 4, -4, 1.3);
}

export function drawBluetooth(app: App, g: Group): void {
  addLine(app, g, MID, 8, 0, 32, 2);
  addPoly(app, g, [MID, 8, 34, 16, MID, 24], 1.6);
  addPoly(app, g, [MID, 24, 34, 32, MID, 40], 1.6);
  addLine(app, g, MID, 24, -10, -8, 1.6);
  addLine(app, g, MID, 24, -10, 8, 1.6);
}

