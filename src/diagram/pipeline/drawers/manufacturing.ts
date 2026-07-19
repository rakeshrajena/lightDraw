/**
 * Plant-floor, logistics, sensors, and quality-test glyphs.
 */
import type { App } from '../../../App';
import type { Group } from '../../../shapes/Group';
import { MID, stroke, fill, addLine, addCircle, addText, addBox, addPoly, addEllipse } from './drawHelpers';

export function drawMachine(app: App, g: Group): void {
  // Industrial machine — base, hopper, dual gears
  addBox(app, g, 8, 22, 32, 14, 2);
  addBox(app, g, 12, 12, 10, 12, 2);
  addCircle(app, g, 30, 18, 6, null, 1.5);
  addCircle(app, g, 30, 18, 2.5, stroke(), 0);
  addLine(app, g, 30, 12, 0, 3, 1.3);
  addLine(app, g, 30, 21, 0, 3, 1.3);
  addLine(app, g, 24, 18, 3, 0, 1.3);
  addLine(app, g, 33, 18, 3, 0, 1.3);
  addCircle(app, g, 14, 36, 3, null, 1.3);
  addCircle(app, g, 34, 36, 3, null, 1.3);
}

export function drawRobot(app: App, g: Group): void {
  addBox(app, g, 14, 10, 20, 14, 3);
  addCircle(app, g, 20, 16, 2, stroke(), 0);
  addCircle(app, g, 28, 16, 2, stroke(), 0);
  addLine(app, g, MID, 24, 0, 6, 2);
  addLine(app, g, MID, 30, 12, 0, 2);
  addCircle(app, g, 38, 30, 3.5, null, 1.5);
  addLine(app, g, 12, 24, 0, 12, 1.6);
  addLine(app, g, 36, 24, 0, 4, 1.6);
}

export function drawConveyor(app: App, g: Group): void {
  addBox(app, g, 6, 18, 36, 10, 2);
  addCircle(app, g, 14, 34, 4, null, 1.5);
  addCircle(app, g, 34, 34, 4, null, 1.5);
  addLine(app, g, 14, 34, 20, 0, 1.5);
  addLine(app, g, 12, 16, 6, 0, 1.5);
  addLine(app, g, 22, 16, 6, 0, 1.5);
  addLine(app, g, 32, 16, 6, 0, 1.5);
}

export function drawWarehouse(app: App, g: Group): void {
  addPoly(app, g, [8, 20, MID, 8, 40, 20], 1.7);
  addBox(app, g, 10, 20, 28, 20, 2);
  addLine(app, g, 20, 28, 0, 12, 1.5);
  addLine(app, g, 28, 28, 0, 12, 1.5);
}

export function drawInventory(app: App, g: Group): void {
  // VSM inventory — triangle with letter I
  addPoly(app, g, [MID, 8, 42, 40, 6, 40], 1.8, fill());
  addText(app, g, 'I', MID - 2.5, 34, 12);
}

export function drawCrate(app: App, g: Group): void {
  addBox(app, g, 10, 14, 28, 24, 2);
  addLine(app, g, 10, 14, 28, 24, 1.4);
  addLine(app, g, 38, 14, -28, 24, 1.4);
}

export function drawWrench(app: App, g: Group): void {
  addCircle(app, g, 16, 16, 6, null, 1.7);
  addCircle(app, g, 16, 16, 2.5, fill(), 1.2);
  addLine(app, g, 20, 20, 16, 16, 2.4);
}

export function drawTruck(app: App, g: Group): void {
  addBox(app, g, 6, 16, 22, 16, 2);
  addBox(app, g, 28, 20, 12, 12, 2);
  addCircle(app, g, 14, 36, 4, null, 1.5);
  addCircle(app, g, 34, 36, 4, null, 1.5);
}

export function drawForklift(app: App, g: Group): void {
  addBox(app, g, 18, 16, 16, 16, 2);
  addLine(app, g, 18, 18, -10, 0, 2);
  addLine(app, g, 18, 28, -10, 0, 2);
  addCircle(app, g, 24, 36, 4, null, 1.5);
  addCircle(app, g, 34, 36, 3.5, null, 1.5);
}

export function drawCnc(app: App, g: Group): void {
  // CNC bed + spindle
  addBox(app, g, 8, 28, 32, 10, 2);
  addLine(app, g, 12, 28, 0, -10, 1.6);
  addLine(app, g, 36, 28, 0, -10, 1.6);
  addLine(app, g, 12, 18, 24, 0, 1.6);
  addLine(app, g, MID, 18, 0, 8, 2.2);
  addCircle(app, g, MID, 28, 3, null, 1.4);
}

export function drawProductionLine(app: App, g: Group): void {
  addBox(app, g, 6, 14, 10, 14, 2);
  addBox(app, g, 19, 14, 10, 14, 2);
  addBox(app, g, 32, 14, 10, 14, 2);
  addLine(app, g, 16, 21, 3, 0, 1.5);
  addLine(app, g, 29, 21, 3, 0, 1.5);
  addCircle(app, g, 14, 36, 3.5, null, 1.4);
  addCircle(app, g, 34, 36, 3.5, null, 1.4);
  addLine(app, g, 14, 36, 20, 0, 1.4);
}

export function drawAssembly(app: App, g: Group): void {
  addBox(app, g, 10, 26, 28, 10, 2);
  addBox(app, g, 16, 14, 8, 12, 2);
  addBox(app, g, 26, 18, 8, 8, 2);
  addLine(app, g, 14, 26, 0, -6, 1.4);
  addLine(app, g, 34, 26, 0, -4, 1.4);
}

export function drawCrane(app: App, g: Group): void {
  addLine(app, g, 12, 40, 0, -28, 2.2);
  addLine(app, g, 12, 12, 28, 0, 2.2);
  addLine(app, g, 40, 12, 0, 10, 1.8);
  addLine(app, g, 40, 22, 0, 6, 1.6);
  addPoly(app, g, [40, 28, 36, 34, 44, 34], 1.4, stroke());
  addLine(app, g, 8, 40, 12, 0, 2);
}

export function drawPallet(app: App, g: Group): void {
  addBox(app, g, 8, 22, 32, 8, 1);
  addLine(app, g, 12, 30, 0, 6, 2.2);
  addLine(app, g, MID, 30, 0, 6, 2.2);
  addLine(app, g, 36, 30, 0, 6, 2.2);
  addLine(app, g, 8, 36, 32, 0, 2);
  addBox(app, g, 14, 12, 20, 10, 2);
}

export function drawCargoContainer(app: App, g: Group): void {
  addBox(app, g, 6, 14, 36, 22, 2);
  addLine(app, g, 14, 14, 0, 22, 1.3);
  addLine(app, g, 22, 14, 0, 22, 1.3);
  addLine(app, g, 30, 14, 0, 22, 1.3);
  addLine(app, g, 6, 25, 36, 0, 1.2);
}

export function drawPackaging(app: App, g: Group): void {
  addBox(app, g, 10, 12, 28, 26, 2);
  addLine(app, g, MID, 12, 0, 26, 1.5);
  addLine(app, g, 10, MID, 28, 0, 1.5);
  addLine(app, g, 16, 18, 16, 0, 1.2);
}

export function drawRawMaterial(app: App, g: Group): void {
  // barrel / drum
  addEllipse(app, g, MID, 12, 12, 4, fill(), 1.6);
  addLine(app, g, 12, 12, 0, 22, 1.6);
  addLine(app, g, 36, 12, 0, 22, 1.6);
  addEllipse(app, g, MID, 34, 12, 4, fill(), 1.6);
  addLine(app, g, 12, 23, 24, 0, 1.3);
}

export function drawWip(app: App, g: Group): void {
  addBox(app, g, 10, 14, 28, 22, 2);
  addLine(app, g, 10, 14, 14, 11, 1.4);
  addLine(app, g, 24, 14, 14, 11, 1.4);
  addLine(app, g, 18, 25, 12, 0, 1.5);
  addText(app, g, 'WIP', 14, 36, 7);
}

export function drawFinishedGoods(app: App, g: Group): void {
  addBox(app, g, 10, 26, 12, 10, 2);
  addBox(app, g, 24, 26, 12, 10, 2);
  addBox(app, g, 17, 14, 12, 10, 2);
  addLine(app, g, 13, 31, 6, 0, 1.2);
  addLine(app, g, 27, 31, 6, 0, 1.2);
  addLine(app, g, 20, 19, 6, 0, 1.2);
}

export function drawScrap(app: App, g: Group): void {
  addBox(app, g, 10, 14, 28, 24, 2);
  addLine(app, g, 16, 18, 16, 16, 2.2);
  addLine(app, g, 32, 18, -16, 16, 2.2);
}

export function drawWaste(app: App, g: Group): void {
  // trash bin
  addLine(app, g, 14, 14, 20, 0, 1.6);
  addLine(app, g, MID, 10, 0, 4, 1.6);
  addBox(app, g, 14, 16, 20, 22, 2);
  addLine(app, g, 20, 20, 0, 12, 1.3);
  addLine(app, g, 28, 20, 0, 12, 1.3);
}

export function drawAgv(app: App, g: Group): void {
  // AGV — low chassis + sensor mast (not conveyor)
  addBox(app, g, 10, 20, 28, 12, 3);
  addCircle(app, g, 16, 36, 3.5, null, 1.4);
  addCircle(app, g, 32, 36, 3.5, null, 1.4);
  addLine(app, g, MID, 20, 0, -8, 1.6);
  addCircle(app, g, MID, 10, 3, null, 1.4);
  addLine(app, g, 14, 24, 6, 0, 1.3);
}

export function drawLoadingDock(app: App, g: Group): void {
  addBox(app, g, 8, 10, 20, 28, 2);
  addLine(app, g, 8, 24, 20, 0, 1.4);
  addBox(app, g, 28, 20, 12, 14, 2);
  addCircle(app, g, 34, 38, 3.5, null, 1.4);
  addLine(app, g, 28, 18, -4, 0, 1.5);
}

export function drawCustomerDelivery(app: App, g: Group): void {
  addBox(app, g, 8, 18, 18, 12, 2);
  addBox(app, g, 26, 22, 10, 8, 2);
  addCircle(app, g, 14, 34, 3.5, null, 1.4);
  addCircle(app, g, 30, 34, 3.5, null, 1.4);
  addPoly(app, g, [18, 12, 22, 16, 14, 16], 0, stroke());
}

export function drawManufacturingCell(app: App, g: Group): void {
  // enclosed cell with stations
  addBox(app, g, 8, 10, 32, 28, 3);
  addBox(app, g, 12, 16, 8, 8, 1);
  addBox(app, g, 28, 16, 8, 8, 1);
  addLine(app, g, 20, 20, 8, 0, 1.3);
  addCircle(app, g, MID, 32, 2.5, null, 1.2);
}

export function drawSensor(app: App, g: Group): void {
  addCircle(app, g, MID, MID, 10, fill(), 1.7);
  addLine(app, g, MID, 8, 0, -4, 1.6);
  addLine(app, g, 8, MID, -4, 0, 1.6);
  addLine(app, g, 40, MID, 4, 0, 1.6);
  addLine(app, g, MID, 40, 0, 4, 1.6);
  addCircle(app, g, MID, MID, 3, stroke(), 0);
}

export function drawCamera(app: App, g: Group): void {
  addBox(app, g, 8, 16, 26, 18, 3);
  addCircle(app, g, 21, 25, 6, null, 1.6);
  addCircle(app, g, 21, 25, 2.5, stroke(), 0);
  addBox(app, g, 34, 20, 6, 10, 1);
  addBox(app, g, 14, 12, 8, 4, 1);
}

export function drawBarcode(app: App, g: Group): void {
  addBox(app, g, 8, 12, 32, 24, 2);
  const bars = [12, 15, 17, 20, 22, 25, 28, 31, 34];
  const widths = [1.5, 1, 2, 1, 1.5, 1, 2, 1, 1.5];
  for (let i = 0; i < bars.length; i++) {
    addLine(app, g, bars[i], 16, 0, 16, widths[i]);
  }
}

export function drawRfid(app: App, g: Group): void {
  addBox(app, g, 14, 18, 20, 14, 2);
  addCircle(app, g, MID, 25, 3, stroke(), 0);
  // radio arcs
  addLine(app, g, 34, 16, 6, -4, 1.4);
  addLine(app, g, 34, 20, 8, 0, 1.4);
  addLine(app, g, 34, 24, 6, 4, 1.4);
}

export function drawIot(app: App, g: Group): void {
  addBox(app, g, 12, 18, 24, 18, 3);
  addCircle(app, g, 18, 27, 2.5, null, 1.3);
  addLine(app, g, MID, 18, 0, -8, 1.6);
  addCircle(app, g, MID, 8, 2.5, null, 1.3);
  addLine(app, g, 28, 22, 8, -4, 1.3);
  addLine(app, g, 28, 28, 8, 4, 1.3);
}

export function drawScanner(app: App, g: Group): void {
  addBox(app, g, 10, 18, 28, 14, 3);
  addLine(app, g, 14, 16, 20, 0, 1.5);
  addLine(app, g, 18, 12, 0, 4, 1.5);
  addLine(app, g, MID, 25, 14, 0, 2);
}

export function drawCalibration(app: App, g: Group): void {
  // Calibration — dial
  addCircle(app, g, MID, MID, 14, fill(), 1.7);
  addLine(app, g, MID, MID, 8, -8, 2);
  addCircle(app, g, MID, MID, 2, stroke(), 0);
  addLine(app, g, 14, 34, 4, 4, 1.3);
  addLine(app, g, 34, 34, -4, 4, 1.3);
}

export function drawRepair(app: App, g: Group): void {
  // Repair — hammer / tool
  addLine(app, g, 16, 12, 16, 16, 2.4);
  addBox(app, g, 12, 10, 16, 8, 2);
  addLine(app, g, 28, 18, 8, 14, 2.4);
}

export function drawTestBench(app: App, g: Group): void {
  addBox(app, g, 8, 20, 32, 14, 2);
  addBox(app, g, 14, 10, 20, 12, 2);
  addCircle(app, g, 20, 16, 2, stroke(), 0);
  addCircle(app, g, 28, 16, 2, stroke(), 0);
  addLine(app, g, 12, 34, 0, 4, 1.5);
  addLine(app, g, 36, 34, 0, 4, 1.5);
}

export function drawCadModel(app: App, g: Group): void {
  // CAD — isometric cube
  addPoly(app, g, [MID, 10, 38, 18, 38, 34, MID, 42, 10, 34, 10, 18], 1.6);
  addLine(app, g, MID, 10, 0, 16, 1.4);
  addLine(app, g, 10, 18, 28, 0, 1.4);
  addLine(app, g, 10, 18, 14, 8, 1.4);
}

export function drawSchematicDoc(app: App, g: Group): void {
  // Schematic doc — page with circuit mark
  addPoly(app, g, [12, 8, 30, 8, 36, 14, 36, 40, 12, 40], 1.7);
  addLine(app, g, 30, 8, 0, 6, 1.4);
  addLine(app, g, 30, 14, 6, 0, 1.4);
  addLine(app, g, 16, 24, 8, 0, 1.5);
  addCircle(app, g, 28, 24, 4, null, 1.4);
  addLine(app, g, 32, 24, 4, 0, 1.5);
}

export function drawBlockDiagram(app: App, g: Group): void {
  addBox(app, g, 8, 16, 12, 16, 2);
  addBox(app, g, 28, 16, 12, 16, 2);
  addLine(app, g, 20, MID, 8, 0, 1.6);
}

export function drawBom(app: App, g: Group): void {
  // BOM — parts list
  addBox(app, g, 10, 8, 28, 32, 2);
  addText(app, g, 'BOM', 16, 20, 8);
  addLine(app, g, 14, 26, 20, 0, 1.3);
  addLine(app, g, 14, 32, 16, 0, 1.3);
}

export function drawUnitTest(app: App, g: Group): void {
  addBox(app, g, 10, 12, 28, 24, 3);
  addText(app, g, 'UT', 16, MID + 4, 11);
}

export function drawIntegrationTest(app: App, g: Group): void {
  addBox(app, g, 10, 12, 28, 24, 3);
  addText(app, g, 'IT', 17, MID + 4, 11);
}

export function drawFunctionalTest(app: App, g: Group): void {
  addBox(app, g, 10, 12, 28, 24, 3);
  addText(app, g, 'FT', 16, MID + 4, 11);
}

export function drawAcceptanceTest(app: App, g: Group): void {
  addBox(app, g, 10, 12, 28, 24, 3);
  addText(app, g, 'AT', 16, MID + 4, 11);
}

export function drawReliabilityTest(app: App, g: Group): void {
  addBox(app, g, 10, 12, 28, 24, 3);
  addText(app, g, 'RT', 16, MID + 4, 11);
}

export function drawQualityControl(app: App, g: Group): void {
  addCircle(app, g, MID, MID, 14, fill(), 1.7);
  addText(app, g, 'QC', MID - 8, MID + 4, 11);
}

export function drawQualityAssurance(app: App, g: Group): void {
  addCircle(app, g, MID, MID, 14, fill(), 1.7);
  addText(app, g, 'QA', MID - 8, MID + 4, 11);
}

