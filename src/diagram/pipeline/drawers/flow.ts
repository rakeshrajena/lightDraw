/**
 * BPMN-ish flow, tasks, gateways, events, and path glyphs.
 */
import type { App } from '../../../App';
import type { Group } from '../../../shapes/Group';
import { MID, stroke, fill, addLine, addCircle, addText, addBox, addPoly, addEllipse } from './drawHelpers';

export function drawCapsuleStart(app: App, g: Group): void {
  // BPMN start event — thin circle
  addCircle(app, g, MID, MID, 14, fill(), 1.6);
}

export function drawCapsuleEnd(app: App, g: Group): void {
  // BPMN end event — thick outer ring + filled inner
  addCircle(app, g, MID, MID, 14, fill(), 2.8);
  addCircle(app, g, MID, MID, 8, stroke(), 0);
}

export function drawProcess(app: App, g: Group, mark?: string): void {
  addBox(app, g, 7, 12, 34, 24, 5);
  if (mark) addText(app, g, mark, MID - mark.length * 2.6, MID + 3, 9);
}

export function drawSubprocess(app: App, g: Group): void {
  // BPMN collapsed subprocess — [+] marker bottom-center
  addBox(app, g, 7, 12, 34, 24, 5);
  addBox(app, g, MID - 4, 28, 8, 6, 1);
  addLine(app, g, MID - 2, 31, 4, 0, 1.4);
  addLine(app, g, MID, 29, 0, 4, 1.4);
}

export function drawUserTask(app: App, g: Group): void {
  // BPMN user task — person marker top-left
  addBox(app, g, 7, 12, 34, 24, 5);
  addCircle(app, g, 15, 18, 2.8, null, 1.4);
  addPoly(app, g, [11, 28, 15, 23, 19, 28], 1.4);
}

export function drawManualTask(app: App, g: Group): void {
  // BPMN manual task — hand marker top-left
  addBox(app, g, 7, 12, 34, 24, 5);
  addPoly(app, g, [11, 26, 11, 18, 14, 16, 15, 20, 17, 15, 19, 20, 21, 16, 22, 22, 22, 28, 11, 28], 1.35);
}

export function drawScriptTask(app: App, g: Group): void {
  // BPMN script task — scroll/code marker top-left
  addBox(app, g, 7, 12, 34, 24, 5);
  addText(app, g, '</>', 10, 22, 8);
}

export function drawBusinessRule(app: App, g: Group): void {
  // BPMN business-rule task — table marker top-left
  addBox(app, g, 7, 12, 34, 24, 5);
  addBox(app, g, 11, 15, 12, 10, 1);
  addLine(app, g, 11, 18, 12, 0, 1.2);
  addLine(app, g, 11, 21, 12, 0, 1.2);
  addLine(app, g, 15, 15, 0, 10, 1.2);
}

export function drawServiceTask(app: App, g: Group): void {
  // BPMN service task — gear marker top-left
  addBox(app, g, 7, 12, 34, 24, 5);
  addCircle(app, g, 16, 20, 4.2, null, 1.5);
  addLine(app, g, 16, 14.5, 0, 2.2, 1.8);
  addLine(app, g, 16, 23.5, 0, 2.2, 1.8);
  addLine(app, g, 10.5, 20, 2.2, 0, 1.8);
  addLine(app, g, 19.5, 20, 2.2, 0, 1.8);
}

export function drawDiamond(app: App, g: Group): void {
  g.add(
    app.polygon({
      points: [MID, 7, 41, MID, MID, 41, 7, MID],
      fill: fill(),
      stroke: stroke(),
      strokeWidth: 1.8,
      listening: false,
    })
  );
}

export function drawGatewayPlus(app: App, g: Group): void {
  drawDiamond(app, g);
  addLine(app, g, MID, 15, 0, 18, 2.2);
  addLine(app, g, 15, MID, 18, 0, 2.2);
}

export function drawGatewayX(app: App, g: Group): void {
  drawDiamond(app, g);
  addLine(app, g, 17, 17, 14, 14, 2.2);
  addLine(app, g, 31, 17, -14, 14, 2.2);
}

export function drawGatewayCircle(app: App, g: Group): void {
  drawDiamond(app, g);
  addCircle(app, g, MID, MID, 7, null, 1.9);
}

export function drawGatewayMerge(app: App, g: Group): void {
  drawDiamond(app, g);
  addPoly(app, g, [16, 17, MID, 31, 32, 17], 1.9);
}

export function drawCircleEvent(app: App, g: Group, mark?: string): void {
  addCircle(app, g, MID, MID, 14, fill(), 1.9);
  if (mark) addText(app, g, mark, MID - mark.length * 2.6, MID + 3, 9);
}

export function drawSignal(app: App, g: Group): void {
  // BPMN signal — triangle in circle
  addCircle(app, g, MID, MID, 14, fill(), 1.9);
  addPoly(app, g, [MID, 14, 34, 34, 14, 34], 1.7);
}

export function drawEscalation(app: App, g: Group): void {
  // BPMN escalation — upward chevron in circle
  addCircle(app, g, MID, MID, 14, fill(), 1.9);
  addPoly(app, g, [MID, 12, 34, 26, 28, 26, MID, 18, 20, 26, 14, 26], 1.6, stroke());
}

export function drawTimer(app: App, g: Group): void {
  addCircle(app, g, MID, MID, 14, fill(), 1.9);
  addCircle(app, g, MID, MID, 10, null, 1.5);
  addLine(app, g, MID, MID, 0, -7, 1.8);
  addLine(app, g, MID, MID, 6, 4, 1.8);
  addCircle(app, g, MID, MID, 1.6, stroke(), 0);
}

export function drawMessage(app: App, g: Group): void {
  // BPMN message — envelope in circle
  addCircle(app, g, MID, MID, 14, fill(), 1.9);
  addBox(app, g, 14, 18, 20, 12, 1);
  addPoly(app, g, [14, 18, MID, 26, 34, 18], 1.4);
}

export function drawError(app: App, g: Group): void {
  // Error — X in circle (clear “fault”, not a thunderbolt)
  addCircle(app, g, MID, MID, 14, fill(), 1.9);
  addLine(app, g, 17, 17, 14, 14, 2.4);
  addLine(app, g, 31, 17, -14, 14, 2.4);
}

export function drawException(app: App, g: Group): void {
  // Exception — lightning in hexagon (distinct from error X)
  addPoly(app, g, [MID, 8, 38, 16, 38, 32, MID, 40, 10, 32, 10, 16], 1.8, fill());
  addPoly(app, g, [28, 14, 18, 24, 24, 24, 20, 34, 30, 24, 24, 24], 1.4, stroke());
}

export function drawTrigger(app: App, g: Group): void {
  // Instant / trigger — play triangle (distinct from error bolt)
  addCircle(app, g, MID, MID, 14, fill(), 1.6);
  addPoly(app, g, [20, 16, 20, 32, 34, MID], 1.5, stroke());
}

export function drawWarning(app: App, g: Group): void {
  g.add(
    app.polygon({
      points: [MID, 8, 42, 40, 6, 40],
      fill: fill(),
      stroke: stroke(),
      strokeWidth: 1.8,
      listening: false,
    })
  );
  addLine(app, g, MID, 18, 0, 10, 2.2);
  addCircle(app, g, MID, 34, 1.8, stroke(), 0);
}

export function drawInfo(app: App, g: Group): void {
  addCircle(app, g, MID, MID, 14, fill(), 1.9);
  addText(app, g, 'i', MID - 2, MID + 4, 14);
}

export function drawComment(app: App, g: Group): void {
  addBox(app, g, 8, 12, 32, 20, 6);
  addPoly(app, g, [16, 32, 20, 32, 14, 40], 1.5, fill());
  addLine(app, g, 14, 20, 16, 0, 1.3);
  addLine(app, g, 14, 26, 12, 0, 1.3);
}

export function drawChevronIn(app: App, g: Group): void {
  g.add(
    app.polygon({
      points: [8, 12, 30, 12, 40, MID, 30, 36, 8, 36],
      fill: fill(),
      stroke: stroke(),
      strokeWidth: 1.8,
      listening: false,
    })
  );
}

export function drawChevronOut(app: App, g: Group): void {
  g.add(
    app.polygon({
      points: [8, MID, 18, 12, 40, 12, 40, 36, 18, 36],
      fill: fill(),
      stroke: stroke(),
      strokeWidth: 1.8,
      listening: false,
    })
  );
}

export function drawArrow(app: App, g: Group): void {
  addLine(app, g, 8, MID, 26, 0, 2.4);
  g.add(
    app.polygon({
      points: [38, MID, 28, MID - 7, 28, MID + 7],
      fill: stroke(),
      stroke: null,
      listening: false,
    })
  );
}

export function drawPipelineFlow(app: App, g: Group): void {
  // linked stage capsules
  addBox(app, g, 6, 18, 12, 12, 6);
  addBox(app, g, 18, 18, 12, 12, 6);
  addBox(app, g, 30, 18, 12, 12, 6);
  addLine(app, g, 18, MID, -2, 0, 1.5);
  addLine(app, g, 30, MID, -2, 0, 1.5);
}

export function drawFlowPath(app: App, g: Group): void {
  // Flow — open path with bends (distinct from pipeline capsules)
  addLine(app, g, 8, 16, 12, 0, 2);
  addLine(app, g, 20, 16, 0, 16, 2);
  addLine(app, g, 20, 32, 12, 0, 2);
  addPoly(app, g, [40, 32, 32, 26, 32, 38], 0, stroke());
  addCircle(app, g, 8, 16, 3, stroke(), 0);
}

export function drawValueStream(app: App, g: Group): void {
  addPoly(app, g, [6, 14, 18, 14, 24, MID, 18, 34, 6, 34, 12, MID], 1.6, fill());
  addPoly(app, g, [20, 14, 32, 14, 38, MID, 32, 34, 20, 34, 26, MID], 1.6, fill());
}

export function drawActivity(app: App, g: Group): void {
  // Activity — rounded task with play marker
  addBox(app, g, 7, 12, 34, 24, 8);
  addPoly(app, g, [18, 18, 18, 30, 30, 24], 1.5, stroke());
}

export function drawOperation(app: App, g: Group): void {
  // Operation — gear inside process box
  addBox(app, g, 7, 12, 34, 24, 5);
  addCircle(app, g, MID, MID, 6, null, 1.6);
  addLine(app, g, MID, MID - 9, 0, 3, 1.8);
  addLine(app, g, MID, MID + 6, 0, 3, 1.8);
  addLine(app, g, MID - 9, MID, 3, 0, 1.8);
  addLine(app, g, MID + 6, MID, 3, 0, 1.8);
}

export function drawTaskBox(app: App, g: Group): void {
  // Generic task — checkbox marker
  addBox(app, g, 7, 12, 34, 24, 5);
  addBox(app, g, 12, 18, 10, 10, 1);
  addPoly(app, g, [14, 23, 16, 26, 21, 19], 1.6);
}

export function drawWorkflow(app: App, g: Group): void {
  // Workflow — linked mini-steps with branch
  addBox(app, g, 6, 18, 10, 10, 3);
  addBox(app, g, 19, 10, 10, 10, 3);
  addBox(app, g, 19, 28, 10, 10, 3);
  addBox(app, g, 32, 18, 10, 10, 3);
  addLine(app, g, 16, 23, 3, 0, 1.4);
  addLine(app, g, 24, 20, 0, 8, 1.4);
  addLine(app, g, 29, 23, 3, 0, 1.4);
}

export function drawBusinessProcess(app: App, g: Group): void {
  // Business process — briefcase
  addBox(app, g, 10, 18, 28, 18, 3);
  addBox(app, g, 18, 12, 12, 8, 2);
  addLine(app, g, 10, 26, 28, 0, 1.4);
  addLine(app, g, MID, 22, 0, 8, 1.5);
}

export function drawManufacturingProcess(app: App, g: Group): void {
  // Manufacturing process — machine + flow arrow
  addBox(app, g, 8, 14, 18, 20, 3);
  addCircle(app, g, 17, 24, 5, null, 1.5);
  addLine(app, g, 17, 19, 0, 10, 1.3);
  addLine(app, g, 12, 24, 10, 0, 1.3);
  addLine(app, g, 28, MID, 8, 0, 2);
  addPoly(app, g, [40, MID, 34, MID - 5, 34, MID + 5], 0, stroke());
}

export function drawEngineeringProcess(app: App, g: Group): void {
  // Engineering process — blueprint / set-square
  addBox(app, g, 8, 10, 32, 28, 3);
  addPoly(app, g, [12, 34, 12, 16, 30, 34], 1.6);
  addLine(app, g, 12, 34, 18, 0, 1.5);
  addLine(app, g, 28, 14, 8, 0, 1.3);
  addLine(app, g, 28, 18, 8, 0, 1.3);
}

export function drawSoftwareProcess(app: App, g: Group): void {
  // Software process — terminal / code window
  addBox(app, g, 8, 10, 32, 28, 4);
  addLine(app, g, 8, 18, 32, 0, 1.5);
  addCircle(app, g, 13, 14, 1.6, stroke(), 0);
  addCircle(app, g, 18, 14, 1.6, stroke(), 0);
  addText(app, g, '</>', 16, 32, 10);
}

export function drawWait(app: App, g: Group): void {
  // Wait — pause bars in circle (distinct from timer clock)
  addCircle(app, g, MID, MID, 14, fill(), 1.9);
  addLine(app, g, 19, 16, 0, 16, 2.6);
  addLine(app, g, 29, 16, 0, 16, 2.6);
}

export function drawLinkChain(app: App, g: Group): void {
  // Link — chain links
  addEllipse(app, g, 18, MID, 8, 6, null, 1.8);
  addEllipse(app, g, 30, MID, 8, 6, null, 1.8);
}

export function drawDependency(app: App, g: Group): void {
  // Dependency — dashed arrow
  addLine(app, g, 8, MID, 6, 0, 2);
  addLine(app, g, 18, MID, 6, 0, 2);
  addLine(app, g, 28, MID, 4, 0, 2);
  addPoly(app, g, [40, MID, 32, MID - 6, 32, MID + 6], 0, stroke());
}

export function drawAnnotation(app: App, g: Group): void {
  // BPMN text annotation — open bracket
  addLine(app, g, 14, 10, 0, 28, 2);
  addLine(app, g, 14, 10, 8, 0, 2);
  addLine(app, g, 14, 38, 8, 0, 2);
  addLine(app, g, 26, 18, 12, 0, 1.3);
  addLine(app, g, 26, 24, 12, 0, 1.3);
  addLine(app, g, 26, 30, 8, 0, 1.3);
}

export function drawFork(app: App, g: Group): void {
  // Fork — one-to-many branch (not parallel +)
  addLine(app, g, 8, MID, 14, 0, 2);
  addLine(app, g, 22, MID, 10, -12, 2);
  addLine(app, g, 22, MID, 10, 12, 2);
  addPoly(app, g, [40, 12, 32, 8, 32, 16], 0, stroke());
  addPoly(app, g, [40, 36, 32, 32, 32, 40], 0, stroke());
}

export function drawJoin(app: App, g: Group): void {
  // Join — many-to-one converge
  addLine(app, g, 8, 12, 14, 12, 2);
  addLine(app, g, 8, 36, 14, -12, 2);
  addLine(app, g, 22, MID, 12, 0, 2);
  addPoly(app, g, [40, MID, 32, MID - 6, 32, MID + 6], 0, stroke());
}

export function drawSplit(app: App, g: Group): void {
  // Split — vertical divider into two paths
  addBox(app, g, 8, 12, 14, 24, 3);
  addLine(app, g, 22, MID, 6, 0, 2);
  addBox(app, g, 28, 10, 12, 12, 3);
  addBox(app, g, 28, 26, 12, 12, 3);
}

export function drawLoopMark(app: App, g: Group): void {
  addCircle(app, g, MID, MID, 12, null, 2);
  addPoly(app, g, [34, 16, 40, 20, 32, 22], 0, stroke());
}

export function drawRetry(app: App, g: Group): void {
  // Retry — two opposing recirculation arrows (distinct from single loop)
  addCircle(app, g, MID, MID, 12, null, 2);
  addPoly(app, g, [14, 32, 8, 28, 16, 26], 0, stroke());
  addPoly(app, g, [34, 16, 40, 20, 32, 22], 0, stroke());
  addLine(app, g, 14, 28, 0, -8, 1.8);
  addLine(app, g, 34, 20, 0, 8, 1.8);
}

export function drawSource(app: App, g: Group): void {
  // Source — circle feeding chevron
  addCircle(app, g, 14, MID, 8, fill(), 1.6);
  addPoly(app, g, [24, 14, 40, MID, 24, 34], 1.6, fill());
}

export function drawDestination(app: App, g: Group): void {
  // Destination — chevron into target
  addPoly(app, g, [8, 14, 24, MID, 8, 34], 1.6, fill());
  addCircle(app, g, 34, MID, 8, fill(), 1.6);
  addCircle(app, g, 34, MID, 3, stroke(), 0);
}


/* ── Facilities / transport / nature / devices ──────────────────────────── */

export function drawDecisionPoint(app: App, g: Group): void {
  drawDiamond(app, g);
  addCircle(app, g, MID, MID, 3, stroke(), 0);
}

export function drawSynchronization(app: App, g: Group): void {
  // Synchronization — barrier / double bar
  addLine(app, g, 8, 14, 0, 20, 2.4);
  addLine(app, g, 14, 14, 0, 20, 2.4);
  addLine(app, g, 8, MID, 12, 0, 1.5);
  addLine(app, g, 26, MID, 14, 0, 1.5);
  addPoly(app, g, [40, MID, 32, MID - 6, 32, MID + 6], 0, stroke());
}

export function drawHandover(app: App, g: Group): void {
  // Handover — two hands / exchange
  addPoly(app, g, [10, 28, 10, 20, 18, 18, 20, 26], 1.5);
  addPoly(app, g, [38, 20, 38, 28, 30, 30, 28, 22], 1.5);
  addLine(app, g, 20, MID, 8, 0, 1.8);
}

