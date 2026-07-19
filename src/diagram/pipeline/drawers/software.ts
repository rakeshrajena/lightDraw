/**
 * Software, CI/CD, cloud runtime, and layout chrome glyphs.
 */
import type { App } from '../../../App';
import type { Group } from '../../../shapes/Group';
import { MID, stroke, fill, addLine, addCircle, addText, addBox, addPoly } from './drawHelpers';

export function drawGit(app: App, g: Group): void {
  addCircle(app, g, 16, 16, 4, null, 1.6);
  addCircle(app, g, 16, 32, 4, null, 1.6);
  addCircle(app, g, 34, 24, 4, null, 1.6);
  addLine(app, g, 16, 20, 0, 8, 1.6);
  addLine(app, g, 16, 16, 14, 8, 1.6);
}

export function drawBuild(app: App, g: Group): void {
  addBox(app, g, 10, 22, 12, 12, 2);
  addBox(app, g, 20, 16, 12, 12, 2);
  addBox(app, g, 26, 26, 12, 12, 2);
}

export function drawCompile(app: App, g: Group): void {
  addBox(app, g, 8, 12, 32, 24, 4);
  addText(app, g, '</>', 14, MID + 4, 11);
}

export function drawDeploy(app: App, g: Group): void {
  addCircle(app, g, MID, 16, 8, fill(), 1.5);
  addCircle(app, g, 16, 20, 6, fill(), 1.4);
  addCircle(app, g, 32, 20, 6, fill(), 1.4);
  addLine(app, g, MID, 28, 0, 8, 2);
  addPoly(app, g, [MID, 40, MID - 6, 32, MID + 6, 32], 0, stroke());
}

export function drawRollback(app: App, g: Group): void {
  addCircle(app, g, MID, MID, 12, null, 1.8);
  addLine(app, g, 24, 14, -8, 0, 1.8);
  addPoly(app, g, [16, 14, 22, 10, 22, 18], 0, stroke());
  // open arc hint via partial lines
  addLine(app, g, 14, 20, 0, 10, 1.8);
  addLine(app, g, 14, 30, 12, 4, 1.8);
}

export function drawCicd(app: App, g: Group): void {
  // CI/CD loop: build cubes + recirculating arrow
  addBox(app, g, 10, 20, 10, 10, 2);
  addBox(app, g, 20, 14, 10, 10, 2);
  addBox(app, g, 28, 24, 10, 10, 2);
  addPoly(app, g, [38, 12, 42, 16, 34, 16], 0, stroke());
  addLine(app, g, 38, 16, 0, 18, 1.6);
  addLine(app, g, 38, 34, -8, 0, 1.6);
}

export function drawEnv(app: App, g: Group, mark: string): void {
  addBox(app, g, 7, 12, 34, 24, 5);
  addText(app, g, mark, MID - mark.length * 2.8, MID + 3, 9);
}

export function drawHexService(app: App, g: Group): void {
  addPoly(app, g, [MID, 8, 38, 16, 38, 32, MID, 40, 10, 32, 10, 16], 1.8, fill());
}

export function drawMicroservice(app: App, g: Group): void {
  // Microservice — hex with inner service mark
  addPoly(app, g, [MID, 8, 38, 16, 38, 32, MID, 40, 10, 32, 10, 16], 1.8, fill());
  addCircle(app, g, MID, MID, 5, null, 1.5);
  addLine(app, g, MID, 15, 0, 4, 1.3);
  addLine(app, g, 17, MID, 4, 0, 1.3);
}

export function drawModule(app: App, g: Group): void {
  // Module — puzzle / interlocking block
  addBox(app, g, 10, 14, 20, 20, 2);
  addBox(app, g, 26, 18, 10, 12, 2);
  addLine(app, g, 16, 14, 0, -4, 2);
  addLine(app, g, 10, 24, -4, 0, 2);
}

export function drawPackage(app: App, g: Group): void {
  // Package — npm-style box with ribbon
  addBox(app, g, 10, 14, 28, 24, 2);
  addLine(app, g, MID, 14, 0, 24, 1.5);
  addLine(app, g, 10, 26, 28, 0, 1.5);
  addPoly(app, g, [10, 14, MID, 8, 38, 14], 1.5);
}

export function drawLibrary(app: App, g: Group): void {
  // Library — books
  addBox(app, g, 10, 12, 8, 26, 1);
  addBox(app, g, 20, 10, 8, 28, 1);
  addBox(app, g, 30, 14, 8, 24, 1);
  addLine(app, g, 12, 20, 4, 0, 1.2);
  addLine(app, g, 22, 18, 4, 0, 1.2);
}

export function drawBranch(app: App, g: Group): void {
  // Git branch — fork from trunk
  addCircle(app, g, 16, 14, 4, null, 1.6);
  addCircle(app, g, 16, 34, 4, null, 1.6);
  addCircle(app, g, 34, 24, 4, null, 1.6);
  addLine(app, g, 16, 18, 0, 12, 1.6);
  addLine(app, g, 16, 24, 14, 0, 1.6);
}

export function drawMergeRequest(app: App, g: Group): void {
  // MR / PR — branch merging back
  addCircle(app, g, 14, 14, 3.5, null, 1.5);
  addCircle(app, g, 14, 34, 3.5, null, 1.5);
  addCircle(app, g, 34, 14, 3.5, null, 1.5);
  addLine(app, g, 14, 18, 0, 12, 1.5);
  addLine(app, g, 14, 14, 16, 0, 1.5);
  addPoly(app, g, [34, 34, 28, 28, 34, 28, 28, 34], 1.4);
  addLine(app, g, 30, 30, -12, 0, 1.5);
}

export function drawArtifact(app: App, g: Group): void {
  // Artifact — sealed package with tag
  addBox(app, g, 10, 16, 24, 20, 2);
  addLine(app, g, 10, 16, 24, 20, 1.3);
  addLine(app, g, 34, 16, -24, 20, 1.3);
  addPoly(app, g, [34, 14, 42, 18, 34, 22], 1.4, fill());
}

export function drawRelease(app: App, g: Group): void {
  // Release — rocket / ship arrow
  addPoly(app, g, [MID, 8, 32, 28, 24, 28, 24, 36, 20, 36, 20, 28, 16, 28], 1.6, fill());
  addLine(app, g, 18, 32, -4, 6, 1.5);
  addLine(app, g, 30, 32, 4, 6, 1.5);
}

export function drawMonitoring(app: App, g: Group): void {
  // Monitoring — screen with pulse
  addBox(app, g, 8, 10, 32, 22, 3);
  addLine(app, g, MID, 32, 0, 4, 1.5);
  addLine(app, g, 16, 36, 16, 0, 1.5);
  addPoly(app, g, [12, 24, 18, 16, 22, 22, 28, 14, 36, 20], 1.6);
}

export function drawAppContainer(app: App, g: Group): void {
  // container / pod — rounded capsule stack (not rack LEDs)
  addBox(app, g, 12, 10, 24, 10, 5);
  addBox(app, g, 12, 19, 24, 10, 5);
  addBox(app, g, 12, 28, 24, 10, 5);
  addLine(app, g, 18, 15, 12, 0, 1.3);
  addLine(app, g, 18, 24, 12, 0, 1.3);
  addLine(app, g, 18, 33, 12, 0, 1.3);
}

export function drawK8s(app: App, g: Group): void {
  // hex cluster
  addPoly(app, g, [MID, 8, 38, 16, 38, 32, MID, 40, 10, 32, 10, 16], 1.8, fill());
  addCircle(app, g, MID, MID, 5, null, 1.5);
  addLine(app, g, MID, 13, 0, 6, 1.3);
  addLine(app, g, MID, 29, 0, 6, 1.3);
  addLine(app, g, 15, MID, 6, 0, 1.3);
  addLine(app, g, 27, MID, 6, 0, 1.3);
}

export function drawVm(app: App, g: Group): void {
  addBox(app, g, 8, 10, 32, 22, 3);
  addLine(app, g, MID, 32, 0, 4, 1.6);
  addLine(app, g, 16, 36, 16, 0, 1.6);
  addText(app, g, 'VM', MID - 7, 24, 9);
}

export function drawServer(app: App, g: Group): void {
  addBox(app, g, 10, 8, 28, 10, 2);
  addBox(app, g, 10, 19, 28, 10, 2);
  addBox(app, g, 10, 30, 28, 10, 2);
  addCircle(app, g, 16, 13, 1.8, stroke(), 0);
  addCircle(app, g, 16, 24, 1.8, stroke(), 0);
  addCircle(app, g, 16, 35, 1.8, stroke(), 0);
}

export function drawCloud(app: App, g: Group): void {
  addCircle(app, g, 18, 24, 8, fill(), 1.6);
  addCircle(app, g, 28, 20, 10, fill(), 1.6);
  addCircle(app, g, 34, 26, 7, fill(), 1.6);
  addLine(app, g, 12, 30, 26, 0, 1.6);
}

export function drawSystem(app: App, g: Group, mark: string): void {
  addBox(app, g, 6, 12, 36, 24, 4);
  addText(app, g, mark, MID - mark.length * 2.8, MID + 3, 9);
}

export function drawAi(app: App, g: Group): void {
  addBox(app, g, 10, 12, 28, 24, 6);
  addCircle(app, g, 18, 22, 3, null, 1.4);
  addCircle(app, g, 30, 22, 3, null, 1.4);
  addLine(app, g, 18, 30, 12, 0, 1.5);
  addLine(app, g, MID, 8, 0, 4, 1.4);
}

export function drawTag(app: App, g: Group): void {
  g.add(
    app.polygon({
      points: [8, 18, 28, 10, 40, MID, 28, 38, 8, 30],
      fill: fill(),
      stroke: stroke(),
      strokeWidth: 1.6,
      listening: false,
    })
  );
  addCircle(app, g, 16, MID, 2.5, null, 1.3);
}

export function drawLane(app: App, g: Group): void {
  addBox(app, g, 6, 8, 36, 32, 3);
  addLine(app, g, 6, MID, 36, 0, 1.6);
  addLine(app, g, 14, 8, 0, 32, 1.3);
}

export function drawPool(app: App, g: Group): void {
  // BPMN pool — outer frame with header
  addBox(app, g, 6, 8, 36, 32, 2);
  addLine(app, g, 14, 8, 0, 32, 1.5);
  addLine(app, g, 6, 8, 8, 0, 1.2);
}

export function drawPin(app: App, g: Group): void {
  addCircle(app, g, MID, 18, 8, fill(), 1.7);
  addPoly(app, g, [MID, 40, 18, 24, 30, 24], 1.6, fill());
  addCircle(app, g, MID, 18, 2.5, stroke(), 0);
}

export function drawCheckpoint(app: App, g: Group): void {
  addCircle(app, g, MID, 16, 8, fill(), 1.7);
  addPoly(app, g, [MID, 40, 18, 24, 30, 24], 1.6, fill());
  addPoly(app, g, [MID - 4, 16, MID - 1, 19, MID + 5, 12], 1.6);
}

export function drawPrototype(app: App, g: Group): void {
  // Prototype — dashed outline box
  addLine(app, g, 10, 12, 10, 0, 1.5);
  addLine(app, g, 24, 12, 10, 0, 1.5);
  addLine(app, g, 10, 36, 10, 0, 1.5);
  addLine(app, g, 24, 36, 10, 0, 1.5);
  addLine(app, g, 8, 14, 0, 8, 1.5);
  addLine(app, g, 8, 26, 0, 8, 1.5);
  addLine(app, g, 40, 14, 0, 8, 1.5);
  addLine(app, g, 40, 26, 0, 8, 1.5);
  addText(app, g, 'P', MID - 3, MID + 4, 12);
}

export function drawSimulation(app: App, g: Group): void {
  // Simulation — play + waveform
  addBox(app, g, 8, 12, 32, 24, 4);
  addPoly(app, g, [14, 18, 14, 30, 24, 24], 1.4, stroke());
  addLine(app, g, 28, 20, 4, -4, 1.5);
  addLine(app, g, 32, 16, 4, 8, 1.5);
  addLine(app, g, 36, 24, 2, -4, 1.5);
}

export function drawCalendar(app: App, g: Group): void {
  addBox(app, g, 10, 14, 28, 26, 3);
  addLine(app, g, 10, 22, 28, 0, 1.5);
  addLine(app, g, 16, 10, 0, 8, 1.6);
  addLine(app, g, 32, 10, 0, 8, 1.6);
  addLine(app, g, 19, 22, 0, 18, 1.2);
  addLine(app, g, 28, 22, 0, 18, 1.2);
  addLine(app, g, 10, 30, 28, 0, 1.2);
}

export function drawVersion(app: App, g: Group): void {
  // Version — tag with vN
  addPoly(app, g, [8, 18, 28, 10, 40, MID, 28, 38, 8, 30], 1.6, fill());
  addCircle(app, g, 16, MID, 2.5, null, 1.3);
  addText(app, g, 'v2', 22, MID + 3, 9);
}

export function drawWorkstation(app: App, g: Group): void {
  addBox(app, g, 10, 10, 28, 18, 2);
  addLine(app, g, MID, 28, 0, 4, 1.5);
  addLine(app, g, 14, 36, 20, 0, 2);
  addCircle(app, g, 18, 19, 2, stroke(), 0);
}

