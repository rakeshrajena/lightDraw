/**
 * Pipeline / process / engineering / manufacturing symbol catalog.
 * Many kind names alias onto a smaller set of shared glyph family drawers.
 */
import type { App } from '../App';
import type { Group } from '../shapes/Group';
import { getActiveDiagram } from './theme';

export type PipelineSymbolCategory =
  | 'flow'
  | 'gateway'
  | 'event'
  | 'io'
  | 'queue'
  | 'data'
  | 'notify'
  | 'integration'
  | 'software'
  | 'cicd'
  | 'security'
  | 'people'
  | 'governance'
  | 'project'
  | 'manufacturing'
  | 'logistics'
  | 'quality'
  | 'industrial'
  | 'cloud'
  | 'ai'
  | 'status'
  | 'layout';

export interface PipelineSymbolMeta {
  kind: string;
  label: string;
  category: PipelineSymbolCategory;
}

const S = 48;
const MID = S / 2;

function stroke(): string {
  return getActiveDiagram().schematicStroke;
}

function fill(): string {
  return getActiveDiagram().schematicFill;
}

function addLine(app: App, g: Group, x: number, y: number, dx: number, dy: number, sw = 2, color?: string): void {
  g.add(app.line({ x, y, x2: dx, y2: dy, stroke: color ?? stroke(), strokeWidth: sw, lineCap: 'round', listening: false }));
}

/** Circle helper — `(x, y)` is the center (library Circle uses top-left). */
function addCircle(app: App, g: Group, x: number, y: number, r: number, fillColor: string | null = null, sw = 1.75): void {
  g.add(
    app.circle({
      x: x - r,
      y: y - r,
      radius: r,
      fill: fillColor,
      stroke: stroke(),
      strokeWidth: sw,
      listening: false,
    })
  );
}

function addText(app: App, g: Group, text: string, x: number, y: number, size = 8): void {
  g.add(
    app.text({
      text,
      x,
      y,
      fontSize: size,
      fontWeight: '700',
      fontFamily: getActiveDiagram().fontFamily,
      fill: stroke(),
      listening: false,
    })
  );
}

function addBox(
  app: App,
  g: Group,
  x: number,
  y: number,
  w: number,
  h: number,
  labelOrRadius?: string | number
): void {
  const radius = typeof labelOrRadius === 'number' ? labelOrRadius : 4;
  const label = typeof labelOrRadius === 'string' ? labelOrRadius : undefined;
  g.add(
    app.roundedRect({
      x,
      y,
      width: w,
      height: h,
      cornerRadius: radius,
      fill: fill(),
      stroke: stroke(),
      strokeWidth: 1.75,
      listening: false,
    })
  );
  if (label) {
    const approx = label.length * 4.2;
    addText(app, g, label, x + Math.max(2, (w - approx) / 2), y + h / 2 + 3, 8);
  }
}

function addPoly(app: App, g: Group, points: number[], sw = 2.1, fillColor: string | null = null): void {
  g.add(
    app.polygon({
      points,
      fill: fillColor,
      stroke: stroke(),
      strokeWidth: sw,
      listening: false,
    })
  );
}

function addEllipse(app: App, g: Group, x: number, y: number, radiusX: number, radiusY: number, fillColor: string | null = null, sw = 1.75): void {
  g.add(
    app.ellipse({
      x: x - radiusX,
      y: y - radiusY,
      radiusX,
      radiusY,
      fill: fillColor,
      stroke: stroke(),
      strokeWidth: sw,
      listening: false,
    })
  );
}

/* ── Shared family drawers (local 48×48 coords) ─────────────────────────── */

function drawCapsuleStart(app: App, g: Group): void {
  // BPMN start event — thin circle
  addCircle(app, g, MID, MID, 14, fill(), 1.6);
}

function drawCapsuleEnd(app: App, g: Group): void {
  // BPMN end event — thick outer ring + filled inner
  addCircle(app, g, MID, MID, 14, fill(), 2.8);
  addCircle(app, g, MID, MID, 8, stroke(), 0);
}

function drawProcess(app: App, g: Group, mark?: string): void {
  addBox(app, g, 7, 12, 34, 24, 5);
  if (mark) addText(app, g, mark, MID - mark.length * 2.6, MID + 3, 9);
}

function drawSubprocess(app: App, g: Group): void {
  // BPMN collapsed subprocess — [+] marker bottom-center
  addBox(app, g, 7, 12, 34, 24, 5);
  addBox(app, g, MID - 4, 28, 8, 6, 1);
  addLine(app, g, MID - 2, 31, 4, 0, 1.4);
  addLine(app, g, MID, 29, 0, 4, 1.4);
}

function drawUserTask(app: App, g: Group): void {
  // BPMN user task — person marker top-left
  addBox(app, g, 7, 12, 34, 24, 5);
  addCircle(app, g, 15, 18, 2.8, null, 1.4);
  addPoly(app, g, [11, 28, 15, 23, 19, 28], 1.4);
}



function drawManualTask(app: App, g: Group): void {
  // BPMN manual task — hand marker top-left
  addBox(app, g, 7, 12, 34, 24, 5);
  addPoly(app, g, [11, 26, 11, 18, 14, 16, 15, 20, 17, 15, 19, 20, 21, 16, 22, 22, 22, 28, 11, 28], 1.35);
}

function drawScriptTask(app: App, g: Group): void {
  // BPMN script task — scroll/code marker top-left
  addBox(app, g, 7, 12, 34, 24, 5);
  addText(app, g, '</>', 10, 22, 8);
}

function drawBusinessRule(app: App, g: Group): void {
  // BPMN business-rule task — table marker top-left
  addBox(app, g, 7, 12, 34, 24, 5);
  addBox(app, g, 11, 15, 12, 10, 1);
  addLine(app, g, 11, 18, 12, 0, 1.2);
  addLine(app, g, 11, 21, 12, 0, 1.2);
  addLine(app, g, 15, 15, 0, 10, 1.2);
}

function drawDiamond(app: App, g: Group): void {
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

function drawGatewayPlus(app: App, g: Group): void {
  drawDiamond(app, g);
  addLine(app, g, MID, 15, 0, 18, 2.2);
  addLine(app, g, 15, MID, 18, 0, 2.2);
}

function drawGatewayX(app: App, g: Group): void {
  drawDiamond(app, g);
  addLine(app, g, 17, 17, 14, 14, 2.2);
  addLine(app, g, 31, 17, -14, 14, 2.2);
}

function drawGatewayCircle(app: App, g: Group): void {
  drawDiamond(app, g);
  addCircle(app, g, MID, MID, 7, null, 1.9);
}

function drawGatewayMerge(app: App, g: Group): void {
  drawDiamond(app, g);
  addPoly(app, g, [16, 17, MID, 31, 32, 17], 1.9);
}

function drawCircleEvent(app: App, g: Group, mark?: string): void {
  addCircle(app, g, MID, MID, 14, fill(), 1.9);
  if (mark) addText(app, g, mark, MID - mark.length * 2.6, MID + 3, 9);
}

function drawSignal(app: App, g: Group): void {
  // BPMN signal — triangle in circle
  addCircle(app, g, MID, MID, 14, fill(), 1.9);
  addPoly(app, g, [MID, 14, 34, 34, 14, 34], 1.7);
}

function drawEscalation(app: App, g: Group): void {
  // BPMN escalation — upward chevron in circle
  addCircle(app, g, MID, MID, 14, fill(), 1.9);
  addPoly(app, g, [MID, 12, 34, 26, 28, 26, MID, 18, 20, 26, 14, 26], 1.6, stroke());
}

function drawTimer(app: App, g: Group): void {
  addCircle(app, g, MID, MID, 14, fill(), 1.9);
  addCircle(app, g, MID, MID, 10, null, 1.5);
  addLine(app, g, MID, MID, 0, -7, 1.8);
  addLine(app, g, MID, MID, 6, 4, 1.8);
  addCircle(app, g, MID, MID, 1.6, stroke(), 0);
}

function drawMessage(app: App, g: Group): void {
  // BPMN message — envelope in circle
  addCircle(app, g, MID, MID, 14, fill(), 1.9);
  addBox(app, g, 14, 18, 20, 12, 1);
  addPoly(app, g, [14, 18, MID, 26, 34, 18], 1.4);
}

function drawError(app: App, g: Group): void {
  // BPMN error — lightning bolt in circle
  addCircle(app, g, MID, MID, 14, fill(), 1.9);
  addPoly(app, g, [28, 12, 18, 24, 24, 24, 20, 36, 30, 22, 24, 22], 1.5, stroke());
}

function drawWarning(app: App, g: Group): void {
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

function drawInfo(app: App, g: Group): void {
  addCircle(app, g, MID, MID, 14, fill(), 1.9);
  addText(app, g, 'i', MID - 2, MID + 4, 14);
}

function drawComment(app: App, g: Group): void {
  addBox(app, g, 8, 12, 32, 20, 6);
  addPoly(app, g, [16, 32, 20, 32, 14, 40], 1.5, fill());
  addLine(app, g, 14, 20, 16, 0, 1.3);
  addLine(app, g, 14, 26, 12, 0, 1.3);
}

function drawChevronIn(app: App, g: Group): void {
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

function drawChevronOut(app: App, g: Group): void {
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

function drawArrow(app: App, g: Group): void {
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

function drawPipelineFlow(app: App, g: Group): void {
  // linked stage capsules
  addBox(app, g, 6, 18, 12, 12, 6);
  addBox(app, g, 18, 18, 12, 12, 6);
  addBox(app, g, 30, 18, 12, 12, 6);
  addLine(app, g, 18, MID, -2, 0, 1.5);
  addLine(app, g, 30, MID, -2, 0, 1.5);
}

function drawValueStream(app: App, g: Group): void {
  addPoly(app, g, [6, 14, 18, 14, 24, MID, 18, 34, 6, 34, 12, MID], 1.6, fill());
  addPoly(app, g, [20, 14, 32, 14, 38, MID, 32, 34, 20, 34, 26, MID], 1.6, fill());
}

function drawStack(app: App, g: Group): void {
  addBox(app, g, 10, 10, 28, 8, 2);
  addBox(app, g, 10, 20, 28, 8, 2);
  addBox(app, g, 10, 30, 28, 8, 2);
}

function drawDocument(app: App, g: Group): void {
  addPoly(app, g, [12, 8, 30, 8, 36, 14, 36, 40, 12, 40, 12, 8], 1.7);
  addLine(app, g, 30, 8, 0, 6, 1.5);
  addLine(app, g, 30, 14, 6, 0, 1.5);
  addLine(app, g, 16, 22, 16, 0, 1.4);
  addLine(app, g, 16, 28, 16, 0, 1.4);
  addLine(app, g, 16, 34, 12, 0, 1.4);
}

function drawFolder(app: App, g: Group): void {
  addPoly(app, g, [8, 16, 8, 38, 40, 38, 40, 16, 22, 16, 18, 12, 8, 12, 8, 16], 1.7);
}

function drawCylinder(app: App, g: Group): void {
  addEllipse(app, g, MID, 14, 14, 5, fill(), 1.7);
  addLine(app, g, 10, 14, 0, 22, 1.7);
  addLine(app, g, 38, 14, 0, 22, 1.7);
  addEllipse(app, g, MID, 36, 14, 5, fill(), 1.7);
}

function drawChart(app: App, g: Group): void {
  addBox(app, g, 8, 10, 32, 28, 3);
  addLine(app, g, 14, 32, 0, -14, 2.2);
  addLine(app, g, 22, 32, 0, -8, 2.2);
  addLine(app, g, 30, 32, 0, -18, 2.2);
}

function drawPhone(app: App, g: Group): void {
  addBox(app, g, 16, 8, 16, 32, 4);
  addLine(app, g, 20, 12, 8, 0, 1.4);
  addCircle(app, g, MID, 34, 2, null, 1.3);
}

function drawApi(app: App, g: Group): void {
  addBox(app, g, 8, 14, 32, 20, 4);
  addText(app, g, '{ }', 16, MID + 4, 11);
}

function drawGlobe(app: App, g: Group): void {
  addCircle(app, g, MID, MID, 14, fill(), 1.8);
  addEllipse(app, g, MID, MID, 7, 14, null, 1.4);
  addLine(app, g, 10, MID, 28, 0, 1.4);
  addLine(app, g, 12, 16, 24, 0, 1.2);
  addLine(app, g, 12, 32, 24, 0, 1.2);
}

function drawGit(app: App, g: Group): void {
  addCircle(app, g, 16, 16, 4, null, 1.6);
  addCircle(app, g, 16, 32, 4, null, 1.6);
  addCircle(app, g, 34, 24, 4, null, 1.6);
  addLine(app, g, 16, 20, 0, 8, 1.6);
  addLine(app, g, 16, 16, 14, 8, 1.6);
}

function drawBuild(app: App, g: Group): void {
  addBox(app, g, 10, 22, 12, 12, 2);
  addBox(app, g, 20, 16, 12, 12, 2);
  addBox(app, g, 26, 26, 12, 12, 2);
}

function drawCompile(app: App, g: Group): void {
  addBox(app, g, 8, 12, 32, 24, 4);
  addText(app, g, '</>', 14, MID + 4, 11);
}

function drawException(app: App, g: Group): void {
  // Distinct from error: lightning in hexagon
  addPoly(app, g, [MID, 8, 38, 16, 38, 32, MID, 40, 10, 32, 10, 16], 1.8, fill());
  addPoly(app, g, [28, 14, 18, 24, 24, 24, 20, 34, 30, 24, 24, 24], 1.4, stroke());
}

function drawInventory(app: App, g: Group): void {
  // VSM inventory — triangle with letter I
  addPoly(app, g, [MID, 8, 42, 40, 6, 40], 1.8, fill());
  addText(app, g, 'I', MID - 2.5, 34, 12);
}

function drawServiceTask(app: App, g: Group): void {
  // BPMN service task — gear marker top-left
  addBox(app, g, 7, 12, 34, 24, 5);
  addCircle(app, g, 16, 20, 4.2, null, 1.5);
  addLine(app, g, 16, 14.5, 0, 2.2, 1.8);
  addLine(app, g, 16, 23.5, 0, 2.2, 1.8);
  addLine(app, g, 10.5, 20, 2.2, 0, 1.8);
  addLine(app, g, 19.5, 20, 2.2, 0, 1.8);
}

function drawTrigger(app: App, g: Group): void {
  // Instant / trigger — play triangle (distinct from error bolt)
  addCircle(app, g, MID, MID, 14, fill(), 1.6);
  addPoly(app, g, [20, 16, 20, 32, 34, MID], 1.5, stroke());
}

function drawDeploy(app: App, g: Group): void {
  addCircle(app, g, MID, 16, 8, fill(), 1.5);
  addCircle(app, g, 16, 20, 6, fill(), 1.4);
  addCircle(app, g, 32, 20, 6, fill(), 1.4);
  addLine(app, g, MID, 28, 0, 8, 2);
  addPoly(app, g, [MID, 40, MID - 6, 32, MID + 6, 32], 0, stroke());
}

function drawRollback(app: App, g: Group): void {
  addCircle(app, g, MID, MID, 12, null, 1.8);
  addLine(app, g, 24, 14, -8, 0, 1.8);
  addPoly(app, g, [16, 14, 22, 10, 22, 18], 0, stroke());
  // open arc hint via partial lines
  addLine(app, g, 14, 20, 0, 10, 1.8);
  addLine(app, g, 14, 30, 12, 4, 1.8);
}

function drawCicd(app: App, g: Group): void {
  // CI/CD loop: build cubes + recirculating arrow
  addBox(app, g, 10, 20, 10, 10, 2);
  addBox(app, g, 20, 14, 10, 10, 2);
  addBox(app, g, 28, 24, 10, 10, 2);
  addPoly(app, g, [38, 12, 42, 16, 34, 16], 0, stroke());
  addLine(app, g, 38, 16, 0, 18, 1.6);
  addLine(app, g, 38, 34, -8, 0, 1.6);
}

function drawEnv(app: App, g: Group, mark: string): void {
  addBox(app, g, 7, 12, 34, 24, 5);
  addText(app, g, mark, MID - mark.length * 2.8, MID + 3, 9);
}

function drawShield(app: App, g: Group): void {
  addPoly(app, g, [MID, 8, 38, 14, 38, 28, MID, 40, 10, 28, 10, 14, MID, 8], 1.8);
  addLine(app, g, 18, 24, 6, 6, 1.9);
  addLine(app, g, 24, 30, 8, -10, 1.9);
}

function drawPerson(app: App, g: Group): void {
  addCircle(app, g, MID, 15, 6, null, 1.7);
  addPoly(app, g, [12, 40, 16, 26, 32, 26, 36, 40], 1.7);
}

function drawPeople(app: App, g: Group): void {
  addCircle(app, g, 16, 15, 4.5, null, 1.5);
  addCircle(app, g, 32, 15, 4.5, null, 1.5);
  addPoly(app, g, [8, 38, 12, 26, 20, 26, 24, 38], 1.5);
  addPoly(app, g, [24, 38, 28, 26, 36, 26, 40, 38], 1.5);
}

function drawCheck(app: App, g: Group): void {
  addCircle(app, g, MID, MID, 14, fill(), 1.8);
  addPoly(app, g, [15, 24, 22, 31, 34, 15], 2.4);
}

function drawFlag(app: App, g: Group): void {
  addLine(app, g, 14, 8, 0, 32, 2.1);
  g.add(
    app.polygon({
      points: [14, 10, 38, 17, 14, 24],
      fill: fill(),
      stroke: stroke(),
      strokeWidth: 1.5,
      listening: false,
    })
  );
}

function drawCoin(app: App, g: Group): void {
  addCircle(app, g, MID, MID, 14, fill(), 1.8);
  addText(app, g, '$', MID - 4, MID + 4, 14);
}

function drawChange(app: App, g: Group): void {
  addBox(app, g, 10, 10, 28, 28, 4);
  addPoly(app, g, [18, 20, 24, 14, 30, 20], 1.7);
  addPoly(app, g, [18, 28, 24, 34, 30, 28], 1.7);
}

function drawMachine(app: App, g: Group): void {
  addBox(app, g, 8, 16, 32, 20, 3);
  addBox(app, g, 14, 10, 8, 6, 2);
  addCircle(app, g, 30, 26, 5.5, null, 1.6);
  addLine(app, g, 30, 20.5, 0, 11, 1.4);
  addLine(app, g, 24.5, 26, 11, 0, 1.4);
}

function drawRobot(app: App, g: Group): void {
  addBox(app, g, 14, 10, 20, 14, 3);
  addCircle(app, g, 20, 16, 2, stroke(), 0);
  addCircle(app, g, 28, 16, 2, stroke(), 0);
  addLine(app, g, MID, 24, 0, 6, 2);
  addLine(app, g, MID, 30, 12, 0, 2);
  addCircle(app, g, 38, 30, 3.5, null, 1.5);
  addLine(app, g, 12, 24, 0, 12, 1.6);
  addLine(app, g, 36, 24, 0, 4, 1.6);
}

function drawConveyor(app: App, g: Group): void {
  addBox(app, g, 6, 18, 36, 10, 2);
  addCircle(app, g, 14, 34, 4, null, 1.5);
  addCircle(app, g, 34, 34, 4, null, 1.5);
  addLine(app, g, 14, 34, 20, 0, 1.5);
  addLine(app, g, 12, 16, 6, 0, 1.5);
  addLine(app, g, 22, 16, 6, 0, 1.5);
  addLine(app, g, 32, 16, 6, 0, 1.5);
}

function drawWarehouse(app: App, g: Group): void {
  addPoly(app, g, [8, 20, MID, 8, 40, 20], 1.7);
  addBox(app, g, 10, 20, 28, 20, 2);
  addLine(app, g, 20, 28, 0, 12, 1.5);
  addLine(app, g, 28, 28, 0, 12, 1.5);
}



function drawCrate(app: App, g: Group): void {
  addBox(app, g, 10, 14, 28, 24, 2);
  addLine(app, g, 10, 14, 28, 24, 1.4);
  addLine(app, g, 38, 14, -28, 24, 1.4);
}

function drawWrench(app: App, g: Group): void {
  addCircle(app, g, 16, 16, 6, null, 1.7);
  addCircle(app, g, 16, 16, 2.5, fill(), 1.2);
  addLine(app, g, 20, 20, 16, 16, 2.4);
}

function drawTruck(app: App, g: Group): void {
  addBox(app, g, 6, 16, 22, 16, 2);
  addBox(app, g, 28, 20, 12, 12, 2);
  addCircle(app, g, 14, 36, 4, null, 1.5);
  addCircle(app, g, 34, 36, 4, null, 1.5);
}

function drawForklift(app: App, g: Group): void {
  addBox(app, g, 18, 16, 16, 16, 2);
  addLine(app, g, 18, 18, -10, 0, 2);
  addLine(app, g, 18, 28, -10, 0, 2);
  addCircle(app, g, 24, 36, 4, null, 1.5);
  addCircle(app, g, 34, 36, 3.5, null, 1.5);
}

function drawHexService(app: App, g: Group): void {
  addPoly(app, g, [MID, 8, 38, 16, 38, 32, MID, 40, 10, 32, 10, 16], 1.8, fill());
}

function drawSystem(app: App, g: Group, mark: string): void {
  addBox(app, g, 6, 12, 36, 24, 4);
  addText(app, g, mark, MID - mark.length * 2.8, MID + 3, 9);
}

function drawSensor(app: App, g: Group): void {
  addCircle(app, g, MID, MID, 10, fill(), 1.7);
  addLine(app, g, MID, 8, 0, -4, 1.6);
  addLine(app, g, 8, MID, -4, 0, 1.6);
  addLine(app, g, 40, MID, 4, 0, 1.6);
  addLine(app, g, MID, 40, 0, 4, 1.6);
  addCircle(app, g, MID, MID, 3, stroke(), 0);
}

function drawCloud(app: App, g: Group): void {
  addCircle(app, g, 18, 24, 8, fill(), 1.6);
  addCircle(app, g, 28, 20, 10, fill(), 1.6);
  addCircle(app, g, 34, 26, 7, fill(), 1.6);
  addLine(app, g, 12, 30, 26, 0, 1.6);
}

function drawServer(app: App, g: Group): void {
  addBox(app, g, 10, 8, 28, 10, 2);
  addBox(app, g, 10, 19, 28, 10, 2);
  addBox(app, g, 10, 30, 28, 10, 2);
  addCircle(app, g, 16, 13, 1.8, stroke(), 0);
  addCircle(app, g, 16, 24, 1.8, stroke(), 0);
  addCircle(app, g, 16, 35, 1.8, stroke(), 0);
}

function drawAi(app: App, g: Group): void {
  addBox(app, g, 10, 12, 28, 24, 6);
  addCircle(app, g, 18, 22, 3, null, 1.4);
  addCircle(app, g, 30, 22, 3, null, 1.4);
  addLine(app, g, 18, 30, 12, 0, 1.5);
  addLine(app, g, MID, 8, 0, 4, 1.4);
}

function drawTag(app: App, g: Group): void {
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

function drawLane(app: App, g: Group): void {
  addBox(app, g, 6, 8, 36, 32, 3);
  addLine(app, g, 6, MID, 36, 0, 1.6);
  addLine(app, g, 14, 8, 0, 32, 1.3);
}

function drawPin(app: App, g: Group): void {
  addCircle(app, g, MID, 18, 8, fill(), 1.7);
  addPoly(app, g, [MID, 40, 18, 24, 30, 24], 1.6, fill());
  addCircle(app, g, MID, 18, 2.5, stroke(), 0);
}

function drawLoopMark(app: App, g: Group): void {
  addCircle(app, g, MID, MID, 12, null, 2);
  addPoly(app, g, [34, 16, 40, 20, 32, 22], 0, stroke());
}

function drawRetry(app: App, g: Group): void {
  // Retry — two opposing recirculation arrows (distinct from single loop)
  addCircle(app, g, MID, MID, 12, null, 2);
  addPoly(app, g, [14, 32, 8, 28, 16, 26], 0, stroke());
  addPoly(app, g, [34, 16, 40, 20, 32, 22], 0, stroke());
  addLine(app, g, 14, 28, 0, -8, 1.8);
  addLine(app, g, 34, 20, 0, 8, 1.8);
}


function drawCnc(app: App, g: Group): void {
  // CNC bed + spindle
  addBox(app, g, 8, 28, 32, 10, 2);
  addLine(app, g, 12, 28, 0, -10, 1.6);
  addLine(app, g, 36, 28, 0, -10, 1.6);
  addLine(app, g, 12, 18, 24, 0, 1.6);
  addLine(app, g, MID, 18, 0, 8, 2.2);
  addCircle(app, g, MID, 28, 3, null, 1.4);
}

function drawProductionLine(app: App, g: Group): void {
  addBox(app, g, 6, 14, 10, 14, 2);
  addBox(app, g, 19, 14, 10, 14, 2);
  addBox(app, g, 32, 14, 10, 14, 2);
  addLine(app, g, 16, 21, 3, 0, 1.5);
  addLine(app, g, 29, 21, 3, 0, 1.5);
  addCircle(app, g, 14, 36, 3.5, null, 1.4);
  addCircle(app, g, 34, 36, 3.5, null, 1.4);
  addLine(app, g, 14, 36, 20, 0, 1.4);
}

function drawAssembly(app: App, g: Group): void {
  addBox(app, g, 10, 26, 28, 10, 2);
  addBox(app, g, 16, 14, 8, 12, 2);
  addBox(app, g, 26, 18, 8, 8, 2);
  addLine(app, g, 14, 26, 0, -6, 1.4);
  addLine(app, g, 34, 26, 0, -4, 1.4);
}

function drawCrane(app: App, g: Group): void {
  addLine(app, g, 12, 40, 0, -28, 2.2);
  addLine(app, g, 12, 12, 28, 0, 2.2);
  addLine(app, g, 40, 12, 0, 10, 1.8);
  addLine(app, g, 40, 22, 0, 6, 1.6);
  addPoly(app, g, [40, 28, 36, 34, 44, 34], 1.4, stroke());
  addLine(app, g, 8, 40, 12, 0, 2);
}

function drawPallet(app: App, g: Group): void {
  addBox(app, g, 8, 22, 32, 8, 1);
  addLine(app, g, 12, 30, 0, 6, 2.2);
  addLine(app, g, MID, 30, 0, 6, 2.2);
  addLine(app, g, 36, 30, 0, 6, 2.2);
  addLine(app, g, 8, 36, 32, 0, 2);
  addBox(app, g, 14, 12, 20, 10, 2);
}

function drawCargoContainer(app: App, g: Group): void {
  addBox(app, g, 6, 14, 36, 22, 2);
  addLine(app, g, 14, 14, 0, 22, 1.3);
  addLine(app, g, 22, 14, 0, 22, 1.3);
  addLine(app, g, 30, 14, 0, 22, 1.3);
  addLine(app, g, 6, 25, 36, 0, 1.2);
}

function drawPackaging(app: App, g: Group): void {
  addBox(app, g, 10, 12, 28, 26, 2);
  addLine(app, g, MID, 12, 0, 26, 1.5);
  addLine(app, g, 10, MID, 28, 0, 1.5);
  addLine(app, g, 16, 18, 16, 0, 1.2);
}

function drawRawMaterial(app: App, g: Group): void {
  // barrel / drum
  addEllipse(app, g, MID, 12, 12, 4, fill(), 1.6);
  addLine(app, g, 12, 12, 0, 22, 1.6);
  addLine(app, g, 36, 12, 0, 22, 1.6);
  addEllipse(app, g, MID, 34, 12, 4, fill(), 1.6);
  addLine(app, g, 12, 23, 24, 0, 1.3);
}

function drawWip(app: App, g: Group): void {
  addBox(app, g, 10, 14, 28, 22, 2);
  addLine(app, g, 10, 14, 14, 11, 1.4);
  addLine(app, g, 24, 14, 14, 11, 1.4);
  addLine(app, g, 18, 25, 12, 0, 1.5);
  addText(app, g, 'WIP', 14, 36, 7);
}

function drawFinishedGoods(app: App, g: Group): void {
  addBox(app, g, 10, 26, 12, 10, 2);
  addBox(app, g, 24, 26, 12, 10, 2);
  addBox(app, g, 17, 14, 12, 10, 2);
  addLine(app, g, 13, 31, 6, 0, 1.2);
  addLine(app, g, 27, 31, 6, 0, 1.2);
  addLine(app, g, 20, 19, 6, 0, 1.2);
}

function drawScrap(app: App, g: Group): void {
  addBox(app, g, 10, 14, 28, 24, 2);
  addLine(app, g, 16, 18, 16, 16, 2.2);
  addLine(app, g, 32, 18, -16, 16, 2.2);
}

function drawAppContainer(app: App, g: Group): void {
  // container / pod — rounded capsule stack (not rack LEDs)
  addBox(app, g, 12, 10, 24, 10, 5);
  addBox(app, g, 12, 19, 24, 10, 5);
  addBox(app, g, 12, 28, 24, 10, 5);
  addLine(app, g, 18, 15, 12, 0, 1.3);
  addLine(app, g, 18, 24, 12, 0, 1.3);
  addLine(app, g, 18, 33, 12, 0, 1.3);
}

function drawCamera(app: App, g: Group): void {
  addBox(app, g, 8, 16, 26, 18, 3);
  addCircle(app, g, 21, 25, 6, null, 1.6);
  addCircle(app, g, 21, 25, 2.5, stroke(), 0);
  addBox(app, g, 34, 20, 6, 10, 1);
  addBox(app, g, 14, 12, 8, 4, 1);
}

function drawBarcode(app: App, g: Group): void {
  addBox(app, g, 8, 12, 32, 24, 2);
  const bars = [12, 15, 17, 20, 22, 25, 28, 31, 34];
  const widths = [1.5, 1, 2, 1, 1.5, 1, 2, 1, 1.5];
  for (let i = 0; i < bars.length; i++) {
    addLine(app, g, bars[i], 16, 0, 16, widths[i]);
  }
}

function drawRfid(app: App, g: Group): void {
  addBox(app, g, 14, 18, 20, 14, 2);
  addCircle(app, g, MID, 25, 3, stroke(), 0);
  // radio arcs
  addLine(app, g, 34, 16, 6, -4, 1.4);
  addLine(app, g, 34, 20, 8, 0, 1.4);
  addLine(app, g, 34, 24, 6, 4, 1.4);
}

function drawIot(app: App, g: Group): void {
  addBox(app, g, 12, 18, 24, 18, 3);
  addCircle(app, g, 18, 27, 2.5, null, 1.3);
  addLine(app, g, MID, 18, 0, -8, 1.6);
  addCircle(app, g, MID, 8, 2.5, null, 1.3);
  addLine(app, g, 28, 22, 8, -4, 1.3);
  addLine(app, g, 28, 28, 8, 4, 1.3);
}

function drawCalendar(app: App, g: Group): void {
  addBox(app, g, 10, 14, 28, 26, 3);
  addLine(app, g, 10, 22, 28, 0, 1.5);
  addLine(app, g, 16, 10, 0, 8, 1.6);
  addLine(app, g, 32, 10, 0, 8, 1.6);
  addLine(app, g, 19, 22, 0, 18, 1.2);
  addLine(app, g, 28, 22, 0, 18, 1.2);
  addLine(app, g, 10, 30, 28, 0, 1.2);
}

function drawChat(app: App, g: Group): void {
  addBox(app, g, 8, 10, 24, 16, 5);
  addPoly(app, g, [14, 26, 18, 26, 12, 32], 1.4, fill());
  addBox(app, g, 18, 22, 22, 14, 5);
  addPoly(app, g, [34, 36, 30, 36, 36, 42], 1.4, fill());
}

function drawK8s(app: App, g: Group): void {
  // hex cluster
  addPoly(app, g, [MID, 8, 38, 16, 38, 32, MID, 40, 10, 32, 10, 16], 1.8, fill());
  addCircle(app, g, MID, MID, 5, null, 1.5);
  addLine(app, g, MID, 13, 0, 6, 1.3);
  addLine(app, g, MID, 29, 0, 6, 1.3);
  addLine(app, g, 15, MID, 6, 0, 1.3);
  addLine(app, g, 27, MID, 6, 0, 1.3);
}

function drawVm(app: App, g: Group): void {
  addBox(app, g, 8, 10, 32, 22, 3);
  addLine(app, g, MID, 32, 0, 4, 1.6);
  addLine(app, g, 16, 36, 16, 0, 1.6);
  addText(app, g, 'VM', MID - 7, 24, 9);
}

function drawWorkstation(app: App, g: Group): void {
  addBox(app, g, 10, 10, 28, 18, 2);
  addLine(app, g, MID, 28, 0, 4, 1.5);
  addLine(app, g, 14, 36, 20, 0, 2);
  addCircle(app, g, 18, 19, 2, stroke(), 0);
}

function drawLoadingDock(app: App, g: Group): void {
  addBox(app, g, 8, 10, 20, 28, 2);
  addLine(app, g, 8, 24, 20, 0, 1.4);
  addBox(app, g, 28, 20, 12, 14, 2);
  addCircle(app, g, 34, 38, 3.5, null, 1.4);
  addLine(app, g, 28, 18, -4, 0, 1.5);
}


function drawWaste(app: App, g: Group): void {
  // trash bin
  addLine(app, g, 14, 14, 20, 0, 1.6);
  addLine(app, g, MID, 10, 0, 4, 1.6);
  addBox(app, g, 14, 16, 20, 22, 2);
  addLine(app, g, 20, 20, 0, 12, 1.3);
  addLine(app, g, 28, 20, 0, 12, 1.3);
}

function drawManufacturingCell(app: App, g: Group): void {
  // enclosed cell with stations
  addBox(app, g, 8, 10, 32, 28, 3);
  addBox(app, g, 12, 16, 8, 8, 1);
  addBox(app, g, 28, 16, 8, 8, 1);
  addLine(app, g, 20, 20, 8, 0, 1.3);
  addCircle(app, g, MID, 32, 2.5, null, 1.2);
}

function drawBackup(app: App, g: Group): void {
  drawCylinder(app, g);
  addPoly(app, g, [34, 14, 40, 18, 34, 22], 0, stroke());
  addLine(app, g, 34, 18, -6, 0, 1.5);
}

function drawArchiveStorage(app: App, g: Group): void {
  // tape reel / archive media
  addCircle(app, g, MID, MID, 12, fill(), 1.7);
  addCircle(app, g, MID, MID, 4, null, 1.5);
  addBox(app, g, 34, 20, 6, 10, 1);
}

function drawCustomerDelivery(app: App, g: Group): void {
  addBox(app, g, 8, 18, 18, 12, 2);
  addBox(app, g, 26, 22, 10, 8, 2);
  addCircle(app, g, 14, 34, 3.5, null, 1.4);
  addCircle(app, g, 30, 34, 3.5, null, 1.4);
  addPoly(app, g, [18, 12, 22, 16, 14, 16], 0, stroke());
}

function drawAgv(app: App, g: Group): void {
  // AGV — low chassis + sensor mast (not conveyor)
  addBox(app, g, 10, 20, 28, 12, 3);
  addCircle(app, g, 16, 36, 3.5, null, 1.4);
  addCircle(app, g, 32, 36, 3.5, null, 1.4);
  addLine(app, g, MID, 20, 0, -8, 1.6);
  addCircle(app, g, MID, 10, 3, null, 1.4);
  addLine(app, g, 14, 24, 6, 0, 1.3);
}

type Family =
  | 'capsuleStart'
  | 'capsuleEnd'
  | 'process'
  | 'subprocess'
  | 'userTask'
  | 'serviceTask'
  | 'manualTask'
  | 'scriptTask'
  | 'businessRule'
  | 'diamond'
  | 'gatewayPlus'
  | 'gatewayX'
  | 'gatewayCircle'
  | 'gatewayMerge'
  | 'circleEvent'
  | 'signal'
  | 'escalation'
  | 'timer'
  | 'message'
  | 'error'
  | 'warning'
  | 'info'
  | 'comment'
  | 'chevronIn'
  | 'chevronOut'
  | 'arrow'
  | 'pipelineFlow'
  | 'valueStream'
  | 'stack'
  | 'document'
  | 'folder'
  | 'cylinder'
  | 'chart'
  | 'phone'
  | 'api'
  | 'globe'
  | 'git'
  | 'build'
  | 'compile'
  | 'deploy'
  | 'rollback'
  | 'cicd'
  | 'env'
  | 'shield'
  | 'person'
  | 'people'
  | 'check'
  | 'flag'
  | 'coin'
  | 'change'
  | 'machine'
  | 'robot'
  | 'conveyor'
  | 'warehouse'
  | 'inventory'
  | 'crate'
  | 'wrench'
  | 'truck'
  | 'forklift'
  | 'hexService'
  | 'system'
  | 'sensor'
  | 'cloud'
  | 'server'
  | 'ai'
  | 'tag'
  | 'lane'
  | 'pin'
  | 'loop'
  | 'retry'
  | 'exception'
  | 'trigger'
  | 'cnc'
  | 'productionLine'
  | 'assembly'
  | 'crane'
  | 'pallet'
  | 'cargoContainer'
  | 'packaging'
  | 'rawMaterial'
  | 'wip'
  | 'finishedGoods'
  | 'scrap'
  | 'appContainer'
  | 'camera'
  | 'barcode'
  | 'rfid'
  | 'iot'
  | 'calendar'
  | 'chat'
  | 'k8s'
  | 'vm'
  | 'workstation'
  | 'loadingDock'
  | 'waste'
  | 'manufacturingCell'
  | 'backup'
  | 'archiveStorage'
  | 'customerDelivery'
  | 'agv';

/* ── Catalog metadata ───────────────────────────────────────────────────── */

type Row = [string, string, PipelineSymbolCategory];

const CATALOG: Row[] = [
  // flow
  ['start', 'Start', 'flow'],
  ['end', 'End', 'flow'],
  ['process', 'Process', 'flow'],
  ['subprocess', 'Subprocess', 'flow'],
  ['activity', 'Activity', 'flow'],
  ['operation', 'Operation', 'flow'],
  ['task', 'Task', 'flow'],
  ['serviceTask', 'Service Task', 'flow'],
  ['userTask', 'User Task', 'flow'],
  ['manualTask', 'Manual Task', 'flow'],
  ['scriptTask', 'Script Task', 'flow'],
  ['businessRule', 'Business Rule', 'flow'],
  ['connector', 'Connector', 'flow'],
  ['arrow', 'Arrow', 'flow'],
  ['flow', 'Flow', 'flow'],
  ['pipeline', 'Pipeline', 'flow'],
  ['loop', 'Loop', 'flow'],
  ['retry', 'Retry', 'flow'],
  ['delay', 'Delay', 'flow'],
  ['wait', 'Wait', 'flow'],
  ['synchronization', 'Synchronization', 'flow'],
  ['dependency', 'Dependency', 'flow'],
  ['reference', 'Reference', 'flow'],
  ['link', 'Link', 'flow'],
  ['annotation', 'Annotation', 'flow'],
  ['comment', 'Comment', 'flow'],
  ['workflow', 'Workflow', 'flow'],
  ['businessProcess', 'Business Process', 'flow'],
  ['manufacturingProcess', 'Manufacturing Process', 'flow'],
  ['engineeringProcess', 'Engineering Process', 'flow'],
  ['softwareProcess', 'Software Process', 'flow'],
  ['valueStream', 'Value Stream', 'flow'],
  ['automation', 'Automation', 'flow'],
  // gateway
  ['decision', 'Decision', 'gateway'],
  ['gateway', 'Gateway', 'gateway'],
  ['exclusiveGateway', 'Exclusive Gateway', 'gateway'],
  ['parallelGateway', 'Parallel Gateway', 'gateway'],
  ['inclusiveGateway', 'Inclusive Gateway', 'gateway'],
  ['merge', 'Merge', 'gateway'],
  ['fork', 'Fork', 'gateway'],
  ['join', 'Join', 'gateway'],
  ['split', 'Split', 'gateway'],
  ['decisionPoint', 'Decision Point', 'gateway'],
  // event
  ['event', 'Event', 'event'],
  ['timer', 'Timer', 'event'],
  ['message', 'Message', 'event'],
  ['signal', 'Signal', 'event'],
  ['error', 'Error', 'event'],
  ['exception', 'Exception', 'event'],
  ['trigger', 'Trigger', 'event'],
  ['escalation', 'Escalation', 'event'],
  // io
  ['input', 'Input', 'io'],
  ['output', 'Output', 'io'],
  ['source', 'Source', 'io'],
  ['destination', 'Destination', 'io'],
  // queue
  ['queue', 'Queue', 'queue'],
  ['buffer', 'Buffer', 'queue'],
  // data
  ['document', 'Document', 'data'],
  ['folder', 'Folder', 'data'],
  ['file', 'File', 'data'],
  ['database', 'Database', 'data'],
  ['dataStore', 'Data Store', 'data'],
  ['dataObject', 'Data Object', 'data'],
  ['dataset', 'Dataset', 'data'],
  ['report', 'Report', 'data'],
  ['dashboard', 'Dashboard', 'data'],
  ['log', 'Log', 'data'],
  ['metric', 'Metric', 'data'],
  ['kpi', 'KPI', 'data'],
  ['analytics', 'Analytics', 'data'],
  // notify
  ['alert', 'Alert', 'notify'],
  ['notification', 'Notification', 'notify'],
  ['email', 'Email', 'notify'],
  ['phone', 'Phone', 'notify'],
  ['chat', 'Chat', 'notify'],
  // integration
  ['api', 'API', 'integration'],
  ['webhook', 'Webhook', 'integration'],
  ['eventBus', 'Event Bus', 'integration'],
  ['messageQueue', 'Message Queue', 'integration'],
  ['broker', 'Broker', 'integration'],
  ['externalSystem', 'External System', 'integration'],
  ['thirdPartyService', 'Third-Party Service', 'integration'],
  ['internet', 'Internet', 'integration'],
  // software
  ['service', 'Service', 'software'],
  ['microservice', 'Microservice', 'software'],
  ['module', 'Module', 'software'],
  ['package', 'Package', 'software'],
  ['library', 'Library', 'software'],
  ['repository', 'Repository', 'software'],
  ['branch', 'Branch', 'software'],
  ['mergeRequest', 'Merge Request', 'software'],
  ['pullRequest', 'Pull Request', 'software'],
  // cicd
  ['build', 'Build', 'cicd'],
  ['compile', 'Compile', 'cicd'],
  ['artifact', 'Artifact', 'cicd'],
  ['deploy', 'Deploy', 'cicd'],
  ['release', 'Release', 'cicd'],
  ['rollback', 'Rollback', 'cicd'],
  ['environment', 'Environment', 'cicd'],
  ['development', 'Development', 'cicd'],
  ['testing', 'Testing', 'cicd'],
  ['qa', 'QA', 'cicd'],
  ['staging', 'Staging', 'cicd'],
  ['production', 'Production', 'cicd'],
  ['monitoring', 'Monitoring', 'cicd'],
  // security
  ['authentication', 'Authentication', 'security'],
  ['authorization', 'Authorization', 'security'],
  ['encryption', 'Encryption', 'security'],
  ['firewall', 'Firewall', 'security'],
  ['security', 'Security', 'security'],
  ['secretVault', 'Secret Vault', 'security'],
  // people
  ['user', 'User', 'people'],
  ['customer', 'Customer', 'people'],
  ['client', 'Client', 'people'],
  ['operator', 'Operator', 'people'],
  ['engineer', 'Engineer', 'people'],
  ['technician', 'Technician', 'people'],
  ['manager', 'Manager', 'people'],
  ['team', 'Team', 'people'],
  ['department', 'Department', 'people'],
  ['vendor', 'Vendor', 'people'],
  ['supplier', 'Supplier', 'people'],
  ['stakeholder', 'Stakeholder', 'people'],
  // governance
  ['approval', 'Approval', 'governance'],
  ['review', 'Review', 'governance'],
  ['validation', 'Validation', 'governance'],
  ['verification', 'Verification', 'governance'],
  ['inspection', 'Inspection', 'governance'],
  ['audit', 'Audit', 'governance'],
  ['signOff', 'Sign-off', 'governance'],
  ['requirement', 'Requirement', 'governance'],
  ['specification', 'Specification', 'governance'],
  ['standard', 'Standard', 'governance'],
  ['policy', 'Policy', 'governance'],
  ['compliance', 'Compliance', 'governance'],
  ['certification', 'Certification', 'governance'],
  // project
  ['goal', 'Goal', 'project'],
  ['objective', 'Objective', 'project'],
  ['scope', 'Scope', 'project'],
  ['charter', 'Charter', 'project'],
  ['milestone', 'Milestone', 'project'],
  ['phase', 'Phase', 'project'],
  ['sprint', 'Sprint', 'project'],
  ['timeline', 'Timeline', 'project'],
  ['calendar', 'Calendar', 'project'],
  ['schedule', 'Schedule', 'project'],
  ['project', 'Project', 'project'],
  ['program', 'Program', 'project'],
  ['portfolio', 'Portfolio', 'project'],
  ['budget', 'Budget', 'project'],
  ['cost', 'Cost', 'project'],
  ['expense', 'Expense', 'project'],
  ['invoice', 'Invoice', 'project'],
  ['payment', 'Payment', 'project'],
  ['risk', 'Risk', 'project'],
  ['issue', 'Issue', 'project'],
  ['blocker', 'Blocker', 'project'],
  ['changeRequest', 'Change Request', 'project'],
  ['changeOrder', 'Change Order', 'project'],
  ['version', 'Version', 'project'],
  ['revision', 'Revision', 'project'],
  ['configuration', 'Configuration', 'project'],
  ['asset', 'Asset', 'project'],
  ['resource', 'Resource', 'project'],
  // manufacturing
  ['machine', 'Machine', 'manufacturing'],
  ['workstation', 'Workstation', 'manufacturing'],
  ['robot', 'Robot', 'manufacturing'],
  ['conveyor', 'Conveyor', 'manufacturing'],
  ['assemblyStation', 'Assembly Station', 'manufacturing'],
  ['cncMachine', 'CNC Machine', 'manufacturing'],
  ['productionLine', 'Production Line', 'manufacturing'],
  ['manufacturingCell', 'Manufacturing Cell', 'manufacturing'],
  ['warehouse', 'Warehouse', 'manufacturing'],
  ['inventory', 'Inventory', 'manufacturing'],
  ['storage', 'Storage', 'manufacturing'],
  ['rawMaterial', 'Raw Material', 'manufacturing'],
  ['workInProgress', 'Work In Progress (WIP)', 'manufacturing'],
  ['finishedGoods', 'Finished Goods', 'manufacturing'],
  ['scrap', 'Scrap', 'manufacturing'],
  ['waste', 'Waste', 'manufacturing'],
  ['rework', 'Rework', 'manufacturing'],
  ['packaging', 'Packaging', 'manufacturing'],
  ['pallet', 'Pallet', 'manufacturing'],
  ['cargoContainer', 'Container', 'manufacturing'],
  // logistics
  ['truck', 'Truck', 'logistics'],
  ['loadingDock', 'Loading Dock', 'logistics'],
  ['forklift', 'Forklift', 'logistics'],
  ['agv', 'AGV', 'logistics'],
  ['crane', 'Crane', 'logistics'],
  ['customerDelivery', 'Customer Delivery', 'logistics'],
  ['handover', 'Handover', 'logistics'],
  ['closure', 'Closure', 'logistics'],
  // quality
  ['maintenance', 'Maintenance', 'quality'],
  ['repair', 'Repair', 'quality'],
  ['calibration', 'Calibration', 'quality'],
  ['measurement', 'Measurement', 'quality'],
  ['qualityControl', 'Quality Control', 'quality'],
  ['qualityAssurance', 'Quality Assurance', 'quality'],
  ['testBench', 'Test Bench', 'quality'],
  ['functionalTest', 'Functional Test', 'quality'],
  ['integrationTest', 'Integration Test', 'quality'],
  ['unitTest', 'Unit Test', 'quality'],
  ['performanceTest', 'Performance Test', 'quality'],
  ['reliabilityTest', 'Reliability Test', 'quality'],
  ['acceptanceTest', 'Acceptance Test', 'quality'],
  ['prototype', 'Prototype', 'quality'],
  ['simulation', 'Simulation', 'quality'],
  ['cadModel', 'CAD Model', 'quality'],
  ['schematic', 'Schematic', 'quality'],
  ['blockDiagram', 'Block Diagram', 'quality'],
  ['bom', 'BOM', 'quality'],
  // industrial
  ['plc', 'PLC', 'industrial'],
  ['hmi', 'HMI', 'industrial'],
  ['scada', 'SCADA', 'industrial'],
  ['mes', 'MES', 'industrial'],
  ['erp', 'ERP', 'industrial'],
  ['crm', 'CRM', 'industrial'],
  ['hrms', 'HRMS', 'industrial'],
  ['sensor', 'Sensor', 'industrial'],
  ['camera', 'Camera', 'industrial'],
  ['scanner', 'Scanner', 'industrial'],
  ['barcodeReader', 'Barcode Reader', 'industrial'],
  ['rfidReader', 'RFID Reader', 'industrial'],
  ['iotDevice', 'IoT Device', 'industrial'],
  // cloud
  ['cloud', 'Cloud', 'cloud'],
  ['server', 'Server', 'cloud'],
  ['virtualMachine', 'Virtual Machine', 'cloud'],
  ['appContainer', 'App Container', 'cloud'],
  ['kubernetesCluster', 'Kubernetes Cluster', 'cloud'],
  ['edgeDevice', 'Edge Device', 'cloud'],
  ['storageSystem', 'Storage System', 'cloud'],
  ['backup', 'Backup', 'cloud'],
  ['archive', 'Archive', 'cloud'],
  ['archiveStorage', 'Archive Storage', 'cloud'],
  // ai
  ['aiAgent', 'AI Agent', 'ai'],
  // status
  ['controlPoint', 'Control Point', 'status'],
  ['checkpoint', 'Checkpoint', 'status'],
  ['success', 'Success', 'status'],
  ['failure', 'Failure', 'status'],
  ['warning', 'Warning', 'status'],
  ['information', 'Information', 'status'],
  ['priority', 'Priority', 'status'],
  // layout
  ['tag', 'Tag', 'layout'],
  ['label', 'Label', 'layout'],
  ['group', 'Group', 'layout'],
  ['swimlane', 'Swimlane', 'layout'],
  ['lane', 'Lane', 'layout'],
  ['pool', 'Pool', 'layout'],
  ['region', 'Region', 'layout'],
  ['zone', 'Zone', 'layout'],
];

/** kind → drawer family */
const FAMILY: Record<string, Family> = {
  start: 'capsuleStart',
  end: 'capsuleEnd',
  process: 'process',
  subprocess: 'subprocess',
  activity: 'process',
  operation: 'process',
  task: 'process',
  serviceTask: 'serviceTask',
  userTask: 'userTask',
  manualTask: 'manualTask',
  scriptTask: 'scriptTask',
  businessRule: 'businessRule',
  decision: 'diamond',
  gateway: 'diamond',
  exclusiveGateway: 'gatewayX',
  parallelGateway: 'gatewayPlus',
  inclusiveGateway: 'gatewayCircle',
  event: 'circleEvent',
  timer: 'timer',
  message: 'message',
  signal: 'signal',
  error: 'error',
  exception: 'exception',
  trigger: 'trigger',
  input: 'chevronIn',
  output: 'chevronOut',
  source: 'chevronIn',
  destination: 'chevronOut',
  connector: 'arrow',
  arrow: 'arrow',
  flow: 'pipelineFlow',
  pipeline: 'pipelineFlow',
  queue: 'stack',
  buffer: 'stack',
  merge: 'gatewayMerge',
  fork: 'gatewayPlus',
  join: 'gatewayMerge',
  split: 'gatewayPlus',
  loop: 'loop',
  retry: 'retry',
  delay: 'timer',
  wait: 'timer',
  synchronization: 'gatewayMerge',
  dependency: 'arrow',
  reference: 'document',
  link: 'arrow',
  annotation: 'comment',
  comment: 'comment',
  document: 'document',
  folder: 'folder',
  file: 'document',
  database: 'cylinder',
  dataStore: 'cylinder',
  dataObject: 'document',
  dataset: 'cylinder',
  report: 'document',
  dashboard: 'chart',
  log: 'document',
  metric: 'chart',
  kpi: 'chart',
  analytics: 'chart',
  alert: 'warning',
  notification: 'message',
  email: 'message',
  phone: 'phone',
  chat: 'chat',
  api: 'api',
  webhook: 'api',
  eventBus: 'stack',
  messageQueue: 'stack',
  broker: 'stack',
  service: 'hexService',
  microservice: 'hexService',
  module: 'process',
  package: 'crate',
  library: 'folder',
  repository: 'git',
  branch: 'git',
  mergeRequest: 'git',
  pullRequest: 'git',
  build: 'build',
  compile: 'compile',
  artifact: 'crate',
  deploy: 'deploy',
  release: 'flag',
  rollback: 'rollback',
  environment: 'env',
  development: 'env',
  testing: 'env',
  qa: 'env',
  staging: 'env',
  production: 'env',
  monitoring: 'chart',
  authentication: 'shield',
  authorization: 'shield',
  encryption: 'shield',
  firewall: 'shield',
  security: 'shield',
  secretVault: 'shield',
  user: 'person',
  customer: 'person',
  client: 'person',
  operator: 'person',
  engineer: 'person',
  technician: 'person',
  manager: 'person',
  team: 'people',
  department: 'people',
  vendor: 'person',
  supplier: 'person',
  stakeholder: 'person',
  approval: 'check',
  review: 'check',
  validation: 'check',
  verification: 'check',
  inspection: 'check',
  audit: 'document',
  signOff: 'check',
  requirement: 'document',
  specification: 'document',
  standard: 'document',
  policy: 'document',
  goal: 'flag',
  objective: 'flag',
  scope: 'document',
  charter: 'document',
  milestone: 'flag',
  phase: 'flag',
  sprint: 'flag',
  timeline: 'chart',
  calendar: 'calendar',
  schedule: 'calendar',
  project: 'folder',
  program: 'folder',
  portfolio: 'folder',
  budget: 'coin',
  cost: 'coin',
  expense: 'coin',
  invoice: 'document',
  payment: 'coin',
  risk: 'warning',
  issue: 'warning',
  blocker: 'error',
  changeRequest: 'change',
  changeOrder: 'change',
  version: 'tag',
  revision: 'tag',
  configuration: 'wrench',
  asset: 'crate',
  resource: 'crate',
  machine: 'machine',
  workstation: 'workstation',
  robot: 'robot',
  conveyor: 'conveyor',
  assemblyStation: 'assembly',
  cncMachine: 'cnc',
  productionLine: 'productionLine',
  manufacturingCell: 'manufacturingCell',
  warehouse: 'warehouse',
  inventory: 'inventory',
  storage: 'pallet',
  rawMaterial: 'rawMaterial',
  workInProgress: 'wip',
  finishedGoods: 'finishedGoods',
  scrap: 'scrap',
  waste: 'waste',
  rework: 'change',
  packaging: 'packaging',
  pallet: 'pallet',
  cargoContainer: 'cargoContainer',
  truck: 'truck',
  loadingDock: 'loadingDock',
  forklift: 'forklift',
  agv: 'agv',
  crane: 'crane',
  maintenance: 'wrench',
  repair: 'wrench',
  calibration: 'wrench',
  measurement: 'sensor',
  qualityControl: 'check',
  qualityAssurance: 'check',
  testBench: 'machine',
  functionalTest: 'check',
  integrationTest: 'check',
  unitTest: 'check',
  performanceTest: 'chart',
  reliabilityTest: 'check',
  acceptanceTest: 'check',
  prototype: 'process',
  simulation: 'process',
  cadModel: 'document',
  schematic: 'document',
  blockDiagram: 'document',
  bom: 'document',
  plc: 'system',
  hmi: 'system',
  scada: 'system',
  mes: 'system',
  erp: 'system',
  crm: 'system',
  hrms: 'system',
  sensor: 'sensor',
  camera: 'camera',
  scanner: 'sensor',
  barcodeReader: 'barcode',
  rfidReader: 'rfid',
  iotDevice: 'iot',
  cloud: 'cloud',
  server: 'server',
  virtualMachine: 'vm',
  appContainer: 'appContainer',
  kubernetesCluster: 'k8s',
  edgeDevice: 'iot',
  storageSystem: 'cylinder',
  backup: 'backup',
  archive: 'folder',
  aiAgent: 'ai',
  automation: 'ai',
  workflow: 'process',
  businessProcess: 'process',
  manufacturingProcess: 'process',
  engineeringProcess: 'process',
  softwareProcess: 'process',
  valueStream: 'valueStream',
  controlPoint: 'pin',
  checkpoint: 'pin',
  decisionPoint: 'diamond',
  escalation: 'escalation',
  compliance: 'shield',
  certification: 'check',
  customerDelivery: 'customerDelivery',
  handover: 'arrow',
  closure: 'capsuleEnd',
  success: 'check',
  failure: 'error',
  warning: 'warning',
  information: 'info',
  priority: 'flag',
  tag: 'tag',
  label: 'tag',
  group: 'lane',
  swimlane: 'lane',
  lane: 'lane',
  pool: 'lane',
  region: 'lane',
  zone: 'lane',
  externalSystem: 'globe',
  thirdPartyService: 'globe',
  internet: 'globe',
  archiveStorage: 'archiveStorage',
};

const ENV_MARK: Record<string, string> = {
  environment: 'ENV',
  development: 'DEV',
  testing: 'TEST',
  qa: 'QA',
  staging: 'STG',
  production: 'PROD',
};

const SYSTEM_MARK: Record<string, string> = {
  plc: 'PLC',
  hmi: 'HMI',
  scada: 'SCADA',
  mes: 'MES',
  erp: 'ERP',
  crm: 'CRM',
  hrms: 'HR',
};

const ALIASES: Record<string, string> = {
  // snake_case & common shorts
  service_task: 'serviceTask',
  user_task: 'userTask',
  manual_task: 'manualTask',
  script_task: 'scriptTask',
  business_rule: 'businessRule',
  exclusive_gateway: 'exclusiveGateway',
  xor_gateway: 'exclusiveGateway',
  xor: 'exclusiveGateway',
  parallel_gateway: 'parallelGateway',
  and_gateway: 'parallelGateway',
  inclusive_gateway: 'inclusiveGateway',
  or_gateway: 'inclusiveGateway',
  data_store: 'dataStore',
  data_object: 'dataObject',
  event_bus: 'eventBus',
  message_queue: 'messageQueue',
  mq: 'messageQueue',
  merge_request: 'mergeRequest',
  mr: 'mergeRequest',
  pull_request: 'pullRequest',
  pr: 'pullRequest',
  secret_vault: 'secretVault',
  vault: 'secretVault',
  sign_off: 'signOff',
  signoff: 'signOff',
  change_request: 'changeRequest',
  cr: 'changeRequest',
  change_order: 'changeOrder',
  assembly_station: 'assemblyStation',
  cnc_machine: 'cncMachine',
  cnc: 'cncMachine',
  production_line: 'productionLine',
  manufacturing_cell: 'manufacturingCell',
  raw_material: 'rawMaterial',
  work_in_progress: 'workInProgress',
  wip: 'workInProgress',
  finished_goods: 'finishedGoods',
  cargo_container: 'cargoContainer',
  shipping_container: 'cargoContainer',
  loading_dock: 'loadingDock',
  quality_control: 'qualityControl',
  qc: 'qualityControl',
  quality_assurance: 'qualityAssurance',
  qa_process: 'qualityAssurance',
  test_bench: 'testBench',
  functional_test: 'functionalTest',
  integration_test: 'integrationTest',
  unit_test: 'unitTest',
  performance_test: 'performanceTest',
  reliability_test: 'reliabilityTest',
  acceptance_test: 'acceptanceTest',
  cad_model: 'cadModel',
  block_diagram: 'blockDiagram',
  barcode_reader: 'barcodeReader',
  rfid_reader: 'rfidReader',
  iot_device: 'iotDevice',
  iot: 'iotDevice',
  virtual_machine: 'virtualMachine',
  vm: 'virtualMachine',
  container: 'appContainer',
  app_container: 'appContainer',
  kubernetes_cluster: 'kubernetesCluster',
  k8s: 'kubernetesCluster',
  kubernetes: 'kubernetesCluster',
  edge_device: 'edgeDevice',
  storage_system: 'storageSystem',
  ai_agent: 'aiAgent',
  ai: 'aiAgent',
  business_process: 'businessProcess',
  manufacturing_process: 'manufacturingProcess',
  engineering_process: 'engineeringProcess',
  software_process: 'softwareProcess',
  value_stream: 'valueStream',
  control_point: 'controlPoint',
  decision_point: 'decisionPoint',
  customer_delivery: 'customerDelivery',
  third_party_service: 'thirdPartyService',
  thirdparty: 'thirdPartyService',
  archive_storage: 'archiveStorage',
  db: 'database',
  database: 'database',
  kpi: 'kpi',
  api: 'api',
  mes: 'mes',
  erp: 'erp',
  crm: 'crm',
  hrms: 'hrms',
  hr: 'hrms',
  plc: 'plc',
  hmi: 'hmi',
  scada: 'scada',
  bom: 'bom',
  agv: 'agv',
  devops: 'cicd',
  ci_cd: 'build',
  cicd: 'build',
  auth: 'authentication',
  authn: 'authentication',
  authz: 'authorization',
  encrypt: 'encryption',
  fw: 'firewall',
  notify: 'notification',
  mail: 'email',
  sms: 'phone',
  docs: 'document',
  doc: 'document',
  dir: 'folder',
  repo: 'repository',
  git: 'repository',
  build_job: 'build',
  deploy_job: 'deploy',
  prod: 'production',
  stg: 'staging',
  stage: 'staging',
  dev: 'development',
  test_env: 'testing',
  eng: 'engineer',
  tech: 'technician',
  mgr: 'manager',
  ops: 'operator',
  vendor_org: 'vendor',
  supplier_org: 'supplier',
  ok: 'success',
  fail: 'failure',
  warn: 'warning',
  info: 'information',
  prio: 'priority',
  swim_lane: 'swimlane',
  ext: 'externalSystem',
  www: 'internet',
  web: 'internet',
};

const KIND_SET = new Set(CATALOG.map((r) => r[0]));

export function resolvePipelineSymbolKind(input: string): string {
  const raw = String(input || '')
    .trim()
    .replace(/[\s-]+/g, '_');
  const lower = raw.toLowerCase();
  if (KIND_SET.has(raw)) return raw;
  if (ALIASES[raw]) return ALIASES[raw];
  if (ALIASES[lower]) return ALIASES[lower];
  if (KIND_SET.has(lower)) return lower;
  const camel = lower.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
  if (KIND_SET.has(camel)) return camel;
  if (ALIASES[camel]) return ALIASES[camel];
  return 'process';
}

export function drawPipelineGlyph(app: App, g: Group, kind: string): void {
  const k = resolvePipelineSymbolKind(kind);
  const family = FAMILY[k] ?? 'process';

  switch (family) {
    case 'capsuleStart':
      drawCapsuleStart(app, g);
      break;
    case 'capsuleEnd':
      drawCapsuleEnd(app, g);
      break;
    case 'process':
      drawProcess(app, g);
      break;
    case 'subprocess':
      drawSubprocess(app, g);
      break;
    case 'userTask':
      drawUserTask(app, g);
      break;
    case 'serviceTask':
      drawServiceTask(app, g);
      break;
    case 'manualTask':
      drawManualTask(app, g);
      break;
    case 'scriptTask':
      drawScriptTask(app, g);
      break;
    case 'businessRule':
      drawBusinessRule(app, g);
      break;
    case 'diamond':
      drawDiamond(app, g);
      break;
    case 'gatewayPlus':
      drawGatewayPlus(app, g);
      break;
    case 'gatewayX':
      drawGatewayX(app, g);
      break;
    case 'gatewayCircle':
      drawGatewayCircle(app, g);
      break;
    case 'gatewayMerge':
      drawGatewayMerge(app, g);
      break;
    case 'circleEvent':
      drawCircleEvent(app, g);
      break;
    case 'signal':
      drawSignal(app, g);
      break;
    case 'escalation':
      drawEscalation(app, g);
      break;
    case 'timer':
      drawTimer(app, g);
      break;
    case 'message':
      drawMessage(app, g);
      break;
    case 'error':
      drawError(app, g);
      break;
    case 'exception':
      drawException(app, g);
      break;
    case 'trigger':
      drawTrigger(app, g);
      break;
    case 'warning':
      drawWarning(app, g);
      break;
    case 'info':
      drawInfo(app, g);
      break;
    case 'comment':
      drawComment(app, g);
      break;
    case 'chevronIn':
      drawChevronIn(app, g);
      break;
    case 'chevronOut':
      drawChevronOut(app, g);
      break;
    case 'arrow':
      drawArrow(app, g);
      break;
    case 'pipelineFlow':
      drawPipelineFlow(app, g);
      break;
    case 'valueStream':
      drawValueStream(app, g);
      break;
    case 'stack':
      drawStack(app, g);
      break;
    case 'document':
      drawDocument(app, g);
      break;
    case 'folder':
      drawFolder(app, g);
      break;
    case 'cylinder':
      drawCylinder(app, g);
      break;
    case 'chart':
      drawChart(app, g);
      break;
    case 'phone':
      drawPhone(app, g);
      break;
    case 'api':
      drawApi(app, g);
      break;
    case 'globe':
      drawGlobe(app, g);
      break;
    case 'git':
      drawGit(app, g);
      break;
    case 'build':
      drawBuild(app, g);
      break;
    case 'compile':
      drawCompile(app, g);
      break;
    case 'deploy':
      drawDeploy(app, g);
      break;
    case 'rollback':
      drawRollback(app, g);
      break;
    case 'cicd':
      drawCicd(app, g);
      break;
    case 'env':
      drawEnv(app, g, ENV_MARK[k] ?? 'ENV');
      break;
    case 'shield':
      drawShield(app, g);
      break;
    case 'person':
      drawPerson(app, g);
      break;
    case 'people':
      drawPeople(app, g);
      break;
    case 'check':
      drawCheck(app, g);
      break;
    case 'flag':
      drawFlag(app, g);
      break;
    case 'coin':
      drawCoin(app, g);
      break;
    case 'change':
      drawChange(app, g);
      break;
    case 'machine':
      drawMachine(app, g);
      break;
    case 'robot':
      drawRobot(app, g);
      break;
    case 'conveyor':
      drawConveyor(app, g);
      break;
    case 'warehouse':
      drawWarehouse(app, g);
      break;
    case 'inventory':
      drawInventory(app, g);
      break;
    case 'crate':
      drawCrate(app, g);
      break;
    case 'wrench':
      drawWrench(app, g);
      break;
    case 'truck':
      drawTruck(app, g);
      break;
    case 'forklift':
      drawForklift(app, g);
      break;
    case 'hexService':
      drawHexService(app, g);
      break;
    case 'system':
      drawSystem(app, g, SYSTEM_MARK[k] ?? 'SYS');
      break;
    case 'sensor':
      drawSensor(app, g);
      break;
    case 'cloud':
      drawCloud(app, g);
      break;
    case 'server':
      drawServer(app, g);
      break;
    case 'ai':
      drawAi(app, g);
      break;
    case 'tag':
      drawTag(app, g);
      break;
    case 'lane':
      drawLane(app, g);
      break;
    case 'pin':
      drawPin(app, g);
      break;
    case 'loop':
      drawLoopMark(app, g);
      break;
    case 'retry':
      drawRetry(app, g);
      break;
    case 'cnc':
      drawCnc(app, g);
      break;
    case 'productionLine':
      drawProductionLine(app, g);
      break;
    case 'assembly':
      drawAssembly(app, g);
      break;
    case 'crane':
      drawCrane(app, g);
      break;
    case 'pallet':
      drawPallet(app, g);
      break;
    case 'cargoContainer':
      drawCargoContainer(app, g);
      break;
    case 'packaging':
      drawPackaging(app, g);
      break;
    case 'rawMaterial':
      drawRawMaterial(app, g);
      break;
    case 'wip':
      drawWip(app, g);
      break;
    case 'finishedGoods':
      drawFinishedGoods(app, g);
      break;
    case 'scrap':
      drawScrap(app, g);
      break;
    case 'appContainer':
      drawAppContainer(app, g);
      break;
    case 'camera':
      drawCamera(app, g);
      break;
    case 'barcode':
      drawBarcode(app, g);
      break;
    case 'rfid':
      drawRfid(app, g);
      break;
    case 'iot':
      drawIot(app, g);
      break;
    case 'calendar':
      drawCalendar(app, g);
      break;
    case 'chat':
      drawChat(app, g);
      break;
    case 'k8s':
      drawK8s(app, g);
      break;
    case 'vm':
      drawVm(app, g);
      break;
    case 'workstation':
      drawWorkstation(app, g);
      break;
    case 'loadingDock':
      drawLoadingDock(app, g);
      break;
    case 'waste':
      drawWaste(app, g);
      break;
    case 'manufacturingCell':
      drawManufacturingCell(app, g);
      break;
    case 'backup':
      drawBackup(app, g);
      break;
    case 'archiveStorage':
      drawArchiveStorage(app, g);
      break;
    case 'customerDelivery':
      drawCustomerDelivery(app, g);
      break;
    case 'agv':
      drawAgv(app, g);
      break;
    default:
      drawProcess(app, g);
      break;
  }
}

export function listPipelineSymbols(category?: PipelineSymbolCategory): PipelineSymbolMeta[] {
  return CATALOG.filter(([, , cat]) => !category || cat === category).map(([kind, label, cat]) => ({
    kind,
    label,
    category: cat,
  }));
}

export function listPipelineSymbolCategories(): PipelineSymbolCategory[] {
  const seen = new Set<PipelineSymbolCategory>();
  const out: PipelineSymbolCategory[] = [];
  for (const [, , cat] of CATALOG) {
    if (!seen.has(cat)) {
      seen.add(cat);
      out.push(cat);
    }
  }
  return out;
}

export function getPipelineSymbolMeta(kind: string): PipelineSymbolMeta {
  const resolved = resolvePipelineSymbolKind(kind);
  const row = CATALOG.find(([k]) => k === resolved);
  if (row) return { kind: row[0], label: row[1], category: row[2] };
  return { kind: resolved, label: resolved, category: 'flow' };
}

export const PIPELINE_SYMBOL_SIZE = S;
