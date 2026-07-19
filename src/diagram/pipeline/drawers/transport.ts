/**
 * Vehicles and road infrastructure.
 */
import type { App } from '../../../App';
import type { Group } from '../../../shapes/Group';
import { MID, fill, addLine, addCircle, addBox, addPoly, addEllipse } from './drawHelpers';

export function drawCar(app: App, g: Group): void {
  addBox(app, g, 6, 22, 36, 10, 3);
  addPoly(app, g, [14, 22, 18, 12, 30, 12, 34, 22], 1.5);
  addCircle(app, g, 14, 34, 4, null, 1.4);
  addCircle(app, g, 34, 34, 4, null, 1.4);
}

export function drawVan(app: App, g: Group): void {
  addBox(app, g, 6, 14, 28, 18, 2);
  addBox(app, g, 34, 20, 8, 12, 2);
  addCircle(app, g, 14, 36, 4, null, 1.4);
  addCircle(app, g, 34, 36, 4, null, 1.4);
}

export function drawBike(app: App, g: Group): void {
  // Motorcycle
  addCircle(app, g, 14, 32, 6, null, 1.5);
  addCircle(app, g, 36, 32, 6, null, 1.5);
  addLine(app, g, 14, 32, 14, -8, 1.6);
  addLine(app, g, 28, 24, 8, 8, 1.6);
  addLine(app, g, 20, 20, 10, 0, 1.6);
  addLine(app, g, 30, 20, 0, -6, 1.5);
}

export function drawCycle(app: App, g: Group): void {
  // Bicycle
  addCircle(app, g, 12, 32, 7, null, 1.5);
  addCircle(app, g, 36, 32, 7, null, 1.5);
  addLine(app, g, 12, 32, 12, -10, 1.5);
  addLine(app, g, 24, 22, 12, 10, 1.5);
  addLine(app, g, 18, 18, 12, 0, 1.5);
  addLine(app, g, 24, 22, 0, -8, 1.5);
}

export function drawRickshaw(app: App, g: Group): void {
  addCircle(app, g, 12, 34, 5, null, 1.4);
  addCircle(app, g, 28, 34, 5, null, 1.4);
  addCircle(app, g, 38, 34, 4, null, 1.4);
  addBox(app, g, 18, 16, 16, 14, 2);
  addLine(app, g, 12, 34, 8, -10, 1.5);
  addLine(app, g, 18, 22, -6, 0, 1.4);
}

export function drawAutoVehicle(app: App, g: Group): void {
  // Auto-rickshaw / three-wheeler
  addPoly(app, g, [10, 30, 16, 14, 34, 14, 38, 30], 1.5);
  addCircle(app, g, 14, 34, 4.5, null, 1.4);
  addCircle(app, g, 34, 34, 4.5, null, 1.4);
  addLine(app, g, 22, 14, 0, -6, 1.5);
}

export function drawBus(app: App, g: Group): void {
  addBox(app, g, 6, 12, 36, 20, 3);
  addLine(app, g, 6, 20, 36, 0, 1.3);
  addLine(app, g, 16, 12, 0, 8, 1.2);
  addLine(app, g, 26, 12, 0, 8, 1.2);
  addCircle(app, g, 14, 36, 4, null, 1.4);
  addCircle(app, g, 34, 36, 4, null, 1.4);
}

export function drawFlight(app: App, g: Group): void {
  addLine(app, g, 10, MID, 28, 0, 2.2);
  addPoly(app, g, [24, MID, 12, 14, 16, MID, 12, 34], 1.5, fill());
  addPoly(app, g, [36, MID, 42, 18, 42, 30], 1.4, fill());
  addLine(app, g, 14, MID, -4, 6, 1.5);
}

export function drawHelicopter(app: App, g: Group): void {
  addEllipse(app, g, 22, 24, 12, 7, fill(), 1.5);
  addLine(app, g, 8, 16, 28, 0, 1.6);
  addLine(app, g, 34, 24, 8, -6, 1.5);
  addLine(app, g, 14, 30, 0, 6, 1.4);
  addLine(app, g, 28, 30, 0, 6, 1.4);
  addLine(app, g, 12, 36, 18, 0, 1.4);
}

export function drawShip(app: App, g: Group): void {
  addPoly(app, g, [8, 28, 14, 18, 34, 18, 40, 28], 1.6, fill());
  addBox(app, g, 18, 10, 12, 10, 2);
  addLine(app, g, 8, 32, 32, 0, 1.5);
  addLine(app, g, 12, 36, 24, 0, 1.3);
}

export function drawBoat(app: App, g: Group): void {
  addPoly(app, g, [10, 28, 16, 20, 36, 20, 40, 28], 1.6, fill());
  addLine(app, g, 24, 20, 0, -10, 1.6);
  addPoly(app, g, [24, 10, 34, 18, 24, 18], 1.4, fill());
}

export function drawRoad(app: App, g: Group): void {
  addPoly(app, g, [10, 8, 38, 8, 42, 40, 6, 40], 1.6);
  addLine(app, g, MID, 12, 0, 6, 2);
  addLine(app, g, MID, 22, 0, 6, 2);
  addLine(app, g, MID, 32, 0, 4, 2);
}

