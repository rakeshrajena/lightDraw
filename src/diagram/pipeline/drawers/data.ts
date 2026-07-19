/**
 * Documents, stores, queues, charts, and messaging glyphs.
 */
import type { App } from '../../../App';
import type { Group } from '../../../shapes/Group';
import { MID, stroke, fill, addLine, addCircle, addText, addBox, addPoly, addEllipse } from './drawHelpers';

export function drawStack(app: App, g: Group): void {
  addBox(app, g, 10, 10, 28, 8, 2);
  addBox(app, g, 10, 20, 28, 8, 2);
  addBox(app, g, 10, 30, 28, 8, 2);
}

export function drawDocument(app: App, g: Group): void {
  addPoly(app, g, [12, 8, 30, 8, 36, 14, 36, 40, 12, 40, 12, 8], 1.7);
  addLine(app, g, 30, 8, 0, 6, 1.5);
  addLine(app, g, 30, 14, 6, 0, 1.5);
  addLine(app, g, 16, 22, 16, 0, 1.4);
  addLine(app, g, 16, 28, 16, 0, 1.4);
  addLine(app, g, 16, 34, 12, 0, 1.4);
}

export function drawFolder(app: App, g: Group): void {
  addPoly(app, g, [8, 16, 8, 38, 40, 38, 40, 16, 22, 16, 18, 12, 8, 12, 8, 16], 1.7);
}

export function drawCylinder(app: App, g: Group): void {
  addEllipse(app, g, MID, 14, 14, 5, fill(), 1.7);
  addLine(app, g, 10, 14, 0, 22, 1.7);
  addLine(app, g, 38, 14, 0, 22, 1.7);
  addEllipse(app, g, MID, 36, 14, 5, fill(), 1.7);
}

export function drawChart(app: App, g: Group): void {
  addBox(app, g, 8, 10, 32, 28, 3);
  addLine(app, g, 14, 32, 0, -14, 2.2);
  addLine(app, g, 22, 32, 0, -8, 2.2);
  addLine(app, g, 30, 32, 0, -18, 2.2);
}

export function drawBuffer(app: App, g: Group): void {
  // Buffer — tank / accumulator (not queue stack)
  addBox(app, g, 14, 10, 20, 28, 2);
  addLine(app, g, 14, 20, 20, 0, 1.3);
  addLine(app, g, 14, 28, 20, 0, 1.3);
  addLine(app, g, MID, 8, 0, -4, 1.5);
  addLine(app, g, MID, 38, 0, 4, 1.5);
}

export function drawFile(app: App, g: Group): void {
  // File — single page (no dog-ear lines like report)
  addPoly(app, g, [12, 8, 30, 8, 36, 14, 36, 40, 12, 40], 1.7);
  addLine(app, g, 30, 8, 0, 6, 1.5);
  addLine(app, g, 30, 14, 6, 0, 1.5);
}

export function drawDataObject(app: App, g: Group): void {
  // BPMN data object — page with top fold + bars
  addPoly(app, g, [12, 8, 28, 8, 36, 16, 36, 40, 12, 40], 1.7);
  addLine(app, g, 28, 8, 0, 8, 1.5);
  addLine(app, g, 28, 16, 8, 0, 1.5);
  addLine(app, g, 16, 22, 14, 0, 1.3);
  addLine(app, g, 16, 28, 14, 0, 1.3);
}

export function drawReport(app: App, g: Group): void {
  // Report — document with chart bars
  addPoly(app, g, [12, 8, 30, 8, 36, 14, 36, 40, 12, 40], 1.7);
  addLine(app, g, 30, 8, 0, 6, 1.4);
  addLine(app, g, 30, 14, 6, 0, 1.4);
  addLine(app, g, 16, 34, 0, -8, 2);
  addLine(app, g, 22, 34, 0, -14, 2);
  addLine(app, g, 28, 34, 0, -6, 2);
}

export function drawLog(app: App, g: Group): void {
  // Log — lined list document
  addBox(app, g, 12, 8, 24, 32, 2);
  addLine(app, g, 16, 16, 16, 0, 1.3);
  addLine(app, g, 16, 22, 16, 0, 1.3);
  addLine(app, g, 16, 28, 12, 0, 1.3);
  addLine(app, g, 16, 34, 14, 0, 1.3);
}

export function drawDataset(app: App, g: Group): void {
  // Dataset — stacked cylinders
  addEllipse(app, g, MID, 12, 12, 4, fill(), 1.5);
  addLine(app, g, 12, 12, 0, 8, 1.5);
  addLine(app, g, 36, 12, 0, 8, 1.5);
  addEllipse(app, g, MID, 20, 12, 4, fill(), 1.5);
  addLine(app, g, 12, 20, 0, 8, 1.5);
  addLine(app, g, 36, 20, 0, 8, 1.5);
  addEllipse(app, g, MID, 28, 12, 4, fill(), 1.5);
  addLine(app, g, 12, 28, 0, 8, 1.5);
  addLine(app, g, 36, 28, 0, 8, 1.5);
  addEllipse(app, g, MID, 36, 12, 4, fill(), 1.5);
}

export function drawMetric(app: App, g: Group): void {
  // Metric — sparkline
  addBox(app, g, 8, 12, 32, 24, 3);
  addPoly(app, g, [12, 28, 18, 20, 24, 24, 30, 14, 36, 18], 1.7);
}

export function drawKpi(app: App, g: Group): void {
  // KPI — target / bullseye with value mark
  addCircle(app, g, MID, MID, 14, fill(), 1.7);
  addCircle(app, g, MID, MID, 8, null, 1.5);
  addCircle(app, g, MID, MID, 3, stroke(), 0);
}

export function drawAnalytics(app: App, g: Group): void {
  // Analytics — magnifier over bars
  addLine(app, g, 12, 34, 0, -12, 2);
  addLine(app, g, 18, 34, 0, -18, 2);
  addLine(app, g, 24, 34, 0, -8, 2);
  addCircle(app, g, 32, 18, 7, null, 1.6);
  addLine(app, g, 37, 23, 6, 6, 2);
}

export function drawBackup(app: App, g: Group): void {
  drawCylinder(app, g);
  addPoly(app, g, [34, 14, 40, 18, 34, 22], 0, stroke());
  addLine(app, g, 34, 18, -6, 0, 1.5);
}

export function drawArchiveStorage(app: App, g: Group): void {
  // tape reel / archive media
  addCircle(app, g, MID, MID, 12, fill(), 1.7);
  addCircle(app, g, MID, MID, 4, null, 1.5);
  addBox(app, g, 34, 20, 6, 10, 1);
}

export function drawMessageQueue(app: App, g: Group): void {
  // Message queue — stacked envelopes
  addBox(app, g, 10, 10, 28, 10, 2);
  addPoly(app, g, [10, 10, MID, 16, 38, 10], 1.3);
  addBox(app, g, 10, 20, 28, 10, 2);
  addPoly(app, g, [10, 20, MID, 26, 38, 20], 1.3);
  addBox(app, g, 10, 30, 28, 10, 2);
  addPoly(app, g, [10, 30, MID, 36, 38, 30], 1.3);
}

export function drawEventBus(app: App, g: Group): void {
  // Event bus — horizontal bus with taps
  addLine(app, g, 8, MID, 32, 0, 2.4);
  addLine(app, g, 14, MID, 0, -10, 1.6);
  addLine(app, g, 24, MID, 0, 10, 1.6);
  addLine(app, g, 34, MID, 0, -8, 1.6);
  addCircle(app, g, 14, 14, 2.5, stroke(), 0);
  addCircle(app, g, 24, 34, 2.5, stroke(), 0);
  addCircle(app, g, 34, 16, 2.5, stroke(), 0);
}

export function drawBroker(app: App, g: Group): void {
  // Broker — hub with spokes
  addCircle(app, g, MID, MID, 6, fill(), 1.6);
  addLine(app, g, MID, 10, 0, 8, 1.5);
  addLine(app, g, MID, 30, 0, 8, 1.5);
  addLine(app, g, 10, MID, 8, 0, 1.5);
  addLine(app, g, 30, MID, 8, 0, 1.5);
  addCircle(app, g, MID, 8, 2.5, null, 1.3);
  addCircle(app, g, MID, 40, 2.5, null, 1.3);
  addCircle(app, g, 8, MID, 2.5, null, 1.3);
  addCircle(app, g, 40, MID, 2.5, null, 1.3);
}

export function drawPhone(app: App, g: Group): void {
  addBox(app, g, 16, 8, 16, 32, 4);
  addLine(app, g, 20, 12, 8, 0, 1.4);
  addCircle(app, g, MID, 34, 2, null, 1.3);
}

export function drawApi(app: App, g: Group): void {
  addBox(app, g, 8, 14, 32, 20, 4);
  addText(app, g, '{ }', 16, MID + 4, 11);
}

export function drawWebhook(app: App, g: Group): void {
  // Webhook — hook / curved arrow into API box
  addBox(app, g, 18, 16, 22, 16, 3);
  addText(app, g, '{}', 24, 28, 9);
  addCircle(app, g, 14, 14, 5, null, 1.6);
  addLine(app, g, 14, 19, 0, 10, 1.6);
  addLine(app, g, 14, 29, 6, 0, 1.6);
}

export function drawGlobe(app: App, g: Group): void {
  addCircle(app, g, MID, MID, 14, fill(), 1.8);
  addEllipse(app, g, MID, MID, 7, 14, null, 1.4);
  addLine(app, g, 10, MID, 28, 0, 1.4);
  addLine(app, g, 12, 16, 24, 0, 1.2);
  addLine(app, g, 12, 32, 24, 0, 1.2);
}

export function drawEmail(app: App, g: Group): void {
  // Email — envelope only (message event stays circle+envelope)
  addBox(app, g, 8, 14, 32, 20, 3);
  addPoly(app, g, [8, 14, MID, 26, 40, 14], 1.6);
  addLine(app, g, 8, 34, 10, -8, 1.3);
  addLine(app, g, 40, 34, -10, -8, 1.3);
}

export function drawNotification(app: App, g: Group): void {
  // Notification — bell
  addPoly(app, g, [MID, 10, 34, 18, 34, 28, 14, 28, 14, 18], 1.7);
  addLine(app, g, 14, 28, 20, 0, 1.7);
  addCircle(app, g, MID, 32, 3, null, 1.5);
  addLine(app, g, MID, 8, 0, 2, 1.5);
}

export function drawEnvelope(app: App, g: Group): void {
  addBox(app, g, 8, 14, 32, 20, 3);
  addPoly(app, g, [8, 14, MID, 26, 40, 14], 1.6);
}

export function drawChat(app: App, g: Group): void {
  addBox(app, g, 8, 10, 24, 16, 5);
  addPoly(app, g, [14, 26, 18, 26, 12, 32], 1.4, fill());
  addBox(app, g, 18, 22, 22, 14, 5);
  addPoly(app, g, [34, 36, 30, 36, 36, 42], 1.4, fill());
}

