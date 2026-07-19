/**
 * IEC-style electronic schematic symbol catalog.
 * Many part names alias onto a smaller set of professional glyph drawers.
 */
import type { App } from '../App';
import type { Group } from '../shapes/Group';
import { getActiveDiagram } from './theme';

export type SchematicSymbolCategory =
  | 'power'
  | 'passive'
  | 'diode'
  | 'transistor'
  | 'thyristor'
  | 'logic'
  | 'analog'
  | 'digital'
  | 'sensor'
  | 'actuator'
  | 'switch'
  | 'connector'
  | 'comms'
  | 'protection'
  | 'test'
  | 'mechanical'
  | 'misc';

export type SchematicSymbolKind = string;

export interface SchematicSymbolMeta {
  kind: string;
  label: string;
  category: SchematicSymbolCategory;
}

const S = 48;
const MID = S / 2;

function stroke(): string {
  return getActiveDiagram().schematicStroke;
}

function accent(): string {
  return getActiveDiagram().schematicResistor;
}

function ledStroke(): string {
  return getActiveDiagram().schematicLedStroke;
}

function ledFill(): string {
  return getActiveDiagram().schematicLedFill;
}

function batteryAccent(): string {
  return getActiveDiagram().schematicBattery;
}

function switchAccent(): string {
  return getActiveDiagram().schematicSwitch;
}

function muted(): string {
  return getActiveDiagram().edgeMuted;
}

/** Shared lead lines left/right into the body. */
function addLeads(app: App, g: Group, y = MID): void {
  g.add(app.line({ x: 6, y, x2: 6, y2: 0, stroke: stroke(), strokeWidth: 2, lineCap: 'round', listening: false }));
  g.add(app.line({ x: 36, y, x2: 6, y2: 0, stroke: stroke(), strokeWidth: 2, lineCap: 'round', listening: false }));
}

function addPoly(app: App, g: Group, points: number[], sw = 2.1): void {
  g.add(
    app.polyline({
      points,
      fill: null,
      stroke: stroke(),
      strokeWidth: sw,
      lineCap: 'round',
      lineJoin: 'round',
      listening: false,
    })
  );
}

function addLine(app: App, g: Group, x: number, y: number, dx: number, dy: number, sw = 2, color?: string): void {
  g.add(app.line({ x, y, x2: dx, y2: dy, stroke: color ?? stroke(), strokeWidth: sw, lineCap: 'round', listening: false }));
}

/** Circle helper — `(x, y)` is the center (library Circle uses top-left). */
function addCircle(app: App, g: Group, x: number, y: number, r: number, fill: string | null = null, sw = 1.75): void {
  g.add(
    app.circle({
      x: x - r,
      y: y - r,
      radius: r,
      fill,
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

function addBox(app: App, g: Group, x: number, y: number, w: number, h: number, label?: string): void {
  g.add(
    app.roundedRect({
      x,
      y,
      width: w,
      height: h,
      cornerRadius: 3,
      fill: getActiveDiagram().schematicFill,
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

/* ── Glyph drawers (local 48×48 coords) — IEEE / IEC oriented ───────────── */

function arrowHead(app: App, g: Group, x: number, y: number, dx: number, dy: number, size = 4): void {
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;
  g.add(
    app.polygon({
      points: [
        x,
        y,
        x - ux * size + px * size * 0.55,
        y - uy * size + py * size * 0.55,
        x - ux * size - px * size * 0.55,
        y - uy * size - py * size * 0.55,
      ],
      fill: stroke(),
      stroke: null,
      listening: false,
    })
  );
}

function drawResistor(
  app: App,
  g: Group,
  variant: 'fixed' | 'variable' | 'pot' | 'thermNtc' | 'thermPtc' | 'ldr' | 'mov' = 'fixed'
): void {
  addLeads(app, g);
  addPoly(app, g, [12, MID, 15, MID - 8, 21, MID + 8, 27, MID - 8, 33, MID + 8, 36, MID], 2);
  if (variant === 'variable' || variant === 'pot') {
    // Keep arrow fully inside the 48×48 plate
    addLine(app, g, 24, 36, 0, -20, 1.5);
    arrowHead(app, g, 24, 16, 0, -1, 3.5);
    if (variant === 'pot') addLine(app, g, 24, 36, 0, 4, 1.5);
  }
  if (variant === 'thermNtc') {
    addLine(app, g, 16, 34, 14, -16, 1.4);
    addLine(app, g, 28, 20, 4, 0, 1.4);
    addText(app, g, '-t', 31, 16, 8);
  }
  if (variant === 'thermPtc') {
    addLine(app, g, 16, 34, 14, -16, 1.4);
    addLine(app, g, 28, 20, 4, 0, 1.4);
    addText(app, g, '+t', 31, 16, 8);
  }
  if (variant === 'ldr') {
    addLine(app, g, 30, 12, 5, 5, 1.3);
    addLine(app, g, 34, 10, 5, 5, 1.3);
    arrowHead(app, g, 35, 17, 1, 1, 2.5);
    arrowHead(app, g, 39, 15, 1, 1, 2.5);
  }
  if (variant === 'mov') {
    addLine(app, g, 16, 34, 14, -16, 1.4);
    addLine(app, g, 28, 20, 4, 0, 1.4);
  }
}

function drawCapacitor(app: App, g: Group, variant: 'np' | 'electrolytic' | 'variable' = 'np'): void {
  addLine(app, g, 6, MID, 12, 0);
  addLine(app, g, 20, 14, 0, 20, 2.5);
  if (variant === 'electrolytic') {
    addLine(app, g, 28, 16, 0, 16, 2.5);
    addText(app, g, '+', 30, 18, 9);
  } else {
    addLine(app, g, 28, 14, 0, 20, 2.5);
  }
  addLine(app, g, 30, MID, 12, 0);
  if (variant === 'variable') {
    addLine(app, g, 18, 34, 12, -20, 1.4);
    arrowHead(app, g, 30, 14, 1, -1, 3);
  }
}

function drawInductor(app: App, g: Group, variant: 'fixed' | 'variable' | 'ferrite' | 'rf' = 'fixed'): void {
  addLeads(app, g);
  for (let i = 0; i < 4; i++) {
    const x0 = 12 + i * 6;
    addPoly(app, g, [x0, MID, x0 + 1.5, MID - 7, x0 + 3, MID - 8, x0 + 4.5, MID - 7, x0 + 6, MID], 2);
  }
  if (variant === 'variable') {
    addLine(app, g, 24, 40, 0, -28, 1.4);
    arrowHead(app, g, 24, 12, 0, -1, 3.5);
  }
  if (variant === 'ferrite') {
    addLine(app, g, 14, MID + 9, 20, 0, 2);
    addLine(app, g, 14, MID + 12, 20, 0, 2);
  }
  if (variant === 'rf') addText(app, g, 'RF', 18, 12, 7);
}

function drawGround(app: App, g: Group, variant: 'earth' | 'chassis' | 'signal' = 'earth'): void {
  addLine(app, g, MID, 8, 0, 12);
  if (variant === 'signal') {
    g.add(
      app.polygon({
        points: [MID, 38, 14, 20, 34, 20],
        fill: stroke(),
        stroke: null,
        listening: false,
      })
    );
  } else if (variant === 'chassis') {
    addLine(app, g, 14, 22, 20, 0, 2.2);
    addLine(app, g, 16, 22, -4, 10, 1.8);
    addLine(app, g, 24, 22, 0, 12, 1.8);
    addLine(app, g, 32, 22, 4, 10, 1.8);
  } else {
    addLine(app, g, 12, 22, 24, 0, 2.4);
    addLine(app, g, 16, 28, 16, 0, 2);
    addLine(app, g, 20, 34, 8, 0, 1.7);
  }
}

function drawBattery(app: App, g: Group, cells = 1): void {
  const startX = cells === 1 ? 18 : 11;
  addLine(app, g, 4, MID, startX - 4, 0);
  let x = startX;
  for (let i = 0; i < cells; i++) {
    addLine(app, g, x, 17, 0, 14, 2);
    addLine(app, g, x + 5, 11, 0, 26, 2.6);
    x += 11;
  }
  addLine(app, g, x - 1, MID, Math.max(4, 44 - (x - 1)), 0);
  addText(app, g, '+', Math.min(36, x - 6), 12, 9);
}

function drawSource(app: App, g: Group, kind: 'dc' | 'ac' | 'voltage' | 'current'): void {
  addLeads(app, g);
  addCircle(app, g, MID, MID, 12, null, 2);
  if (kind === 'ac') {
    addPoly(app, g, [14, MID, 18, MID - 7, 24, MID + 7, 30, MID - 7, 34, MID], 1.8);
  } else if (kind === 'current') {
    addLine(app, g, MID, MID + 8, 0, -16, 2);
    arrowHead(app, g, MID, MID - 8, 0, -1, 4);
  } else if (kind === 'dc') {
    // IEC-style DC: circle with solid / dashed horizontal pair
    addLine(app, g, 16, MID - 4, 16, 0, 2.2);
    addLine(app, g, 16, MID + 4, 16, 0, 1.4);
  } else {
    // Independent voltage source: + / −
    addText(app, g, '+', MID - 4, MID - 4, 11);
    addText(app, g, '-', MID - 3, MID + 14, 14);
  }
}

function drawFuse(app: App, g: Group, breaker = false): void {
  addLeads(app, g);
  addBox(app, g, 14, MID - 6, 20, 12);
  if (breaker) {
    addCircle(app, g, 18, MID, 2, stroke(), 0);
    addLine(app, g, 18, MID, 12, -8, 1.7);
    addCircle(app, g, 32, MID, 2, null, 1.5);
  } else {
    addLine(app, g, 16, MID, 16, 0, 1.7);
  }
}

function drawDiode(
  app: App,
  g: Group,
  variant:
    | 'std'
    | 'schottky'
    | 'zener'
    | 'tvs'
    | 'led'
    | 'ir'
    | 'laser'
    | 'photo'
    | 'tunnel'
    | 'varicap'
    | 'bridge' = 'std'
): void {
  if (variant === 'bridge') {
    addLine(app, g, MID, 8, 0, -4);
    addLine(app, g, MID, 40, 0, 4);
    addLine(app, g, 8, MID, -4, 0);
    addLine(app, g, 40, MID, 4, 0);
    g.add(
      app.polygon({
        points: [MID, 12, 36, MID, MID, 36, 12, MID],
        fill: null,
        stroke: stroke(),
        strokeWidth: 1.7,
        listening: false,
      })
    );
    return;
  }
  addLeads(app, g);
  const filled = variant === 'led' || variant === 'ir' || variant === 'laser';
  g.add(
    app.polygon({
      points: [14, MID - 9, 30, MID, 14, MID + 9],
      fill: filled ? ledFill() : null,
      stroke: filled ? ledStroke() : stroke(),
      strokeWidth: 1.8,
      listening: false,
    })
  );
  const bar = filled ? ledStroke() : stroke();
  addLine(app, g, 30, MID - 10, 0, 20, 2, bar);
  if (variant === 'schottky') {
    addLine(app, g, 30, MID - 10, 5, 3, 1.5);
    addLine(app, g, 30, MID + 10, 5, -3, 1.5);
  }
  if (variant === 'zener') {
    addLine(app, g, 30, MID - 10, -5, 0, 1.5);
    addLine(app, g, 30, MID + 10, 5, 0, 1.5);
  }
  if (variant === 'tvs') {
    addLine(app, g, 30, MID - 10, -4, 0, 1.4);
    addLine(app, g, 30, MID + 10, 4, 0, 1.4);
    addLine(app, g, 34, MID - 8, 0, 16, 1.5);
  }
  if (variant === 'led' || variant === 'ir' || variant === 'laser') {
    // Keep emission arrows inside the 48×48 plate
    addLine(app, g, 26, MID - 10, 6, -5, 1.3, ledStroke());
    addLine(app, g, 30, MID - 8, 5, -4, 1.3, ledStroke());
    arrowHead(app, g, 32, MID - 15, 1, -1, 2.5);
    arrowHead(app, g, 35, MID - 12, 1, -1, 2.5);
    if (variant === 'ir') addText(app, g, 'IR', 8, 12, 7);
    if (variant === 'laser') addText(app, g, 'L', 8, 12, 8);
  }
  if (variant === 'photo') {
    addLine(app, g, 8, 8, 8, 8, 1.3);
    addLine(app, g, 12, 6, 8, 8, 1.3);
    arrowHead(app, g, 16, 16, 1, 1, 2.5);
    arrowHead(app, g, 20, 14, 1, 1, 2.5);
  }
  if (variant === 'tunnel') {
    addLine(app, g, 30, MID - 6, -5, 0, 1.5);
    addLine(app, g, 30, MID + 6, -5, 0, 1.5);
  }
  if (variant === 'varicap') addLine(app, g, 34, 12, 0, 24, 2);
}

function drawBjt(app: App, g: Group, pnp = false, photo = false): void {
  addCircle(app, g, MID, MID, 13, null, 1.6);
  addLine(app, g, 6, MID, 12, 0);
  addLine(app, g, 18, MID - 9, 0, 18, 2.4);
  addLine(app, g, 18, MID - 4, 11, -8, 1.7);
  addLine(app, g, 18, MID + 4, 11, 8, 1.7);
  addLine(app, g, 29, 12, 0, -4);
  addLine(app, g, 29, 36, 0, 4);
  if (pnp) arrowHead(app, g, 22, MID - 7, -1, 0.7, 3.5);
  else arrowHead(app, g, 27, MID + 10, 0.7, 1, 3.5);
  if (photo) {
    addLine(app, g, 8, 10, 6, 6, 1.2);
    addLine(app, g, 12, 8, 6, 6, 1.2);
    arrowHead(app, g, 14, 16, 1, 1, 2.5);
    arrowHead(app, g, 18, 14, 1, 1, 2.5);
  }
}

function drawMosfet(app: App, g: Group, pchan = false): void {
  addLine(app, g, 6, MID, 10, 0);
  addLine(app, g, 16, MID - 10, 0, 20, 2);
  addLine(app, g, 20, MID - 10, 0, 6, 2);
  addLine(app, g, 20, MID - 2, 0, 4, 2);
  addLine(app, g, 20, MID + 4, 0, 6, 2);
  addLine(app, g, 20, MID - 7, 10, 0);
  addLine(app, g, 20, MID + 7, 10, 0);
  addLine(app, g, 30, 12, 0, 5);
  addLine(app, g, 30, 31, 0, 5);
  addLine(app, g, 30, 12, 0, -4);
  addLine(app, g, 30, 36, 0, 4);
  addLine(app, g, 20, MID, 10, 0, 1.4);
  if (pchan) arrowHead(app, g, 24, MID, -1, 0, 3.2);
  else arrowHead(app, g, 26, MID, 1, 0, 3.2);
}

function drawJfet(app: App, g: Group, pchan = false): void {
  addCircle(app, g, MID, MID, 13, null, 1.6);
  addLine(app, g, 6, MID, 12, 0);
  addLine(app, g, 18, MID - 9, 0, 18, 2.2);
  addLine(app, g, 18, MID - 7, 11, 0);
  addLine(app, g, 18, MID + 7, 11, 0);
  addLine(app, g, 29, 13, 0, -5);
  addLine(app, g, 29, 35, 0, 5);
  addLine(app, g, 18, MID, 8, 0, 1.5);
  if (pchan) arrowHead(app, g, 18, MID, 1, 0, 3.2);
  else arrowHead(app, g, 22, MID, -1, 0, 3.2);
}

function drawUjt(app: App, g: Group): void {
  addCircle(app, g, MID, MID, 13, null, 1.6);
  addLine(app, g, MID, 8, 0, 6);
  addLine(app, g, MID, 34, 0, 6);
  addLine(app, g, MID - 5, 17, 0, 14, 2.2);
  addLine(app, g, 6, MID + 4, 12, -5, 1.7);
  arrowHead(app, g, 18, MID - 1, 1, -0.5, 3.2);
}

function drawDarlington(app: App, g: Group): void {
  addCircle(app, g, MID, MID, 13, null, 1.5);
  addLine(app, g, 6, MID, 10, 0);
  addLine(app, g, 16, MID - 8, 0, 16, 2);
  addLine(app, g, 16, MID - 4, 8, -6, 1.5);
  addLine(app, g, 16, MID + 4, 8, 6, 1.5);
  addLine(app, g, 24, MID - 6, 0, 12, 1.8);
  addLine(app, g, 24, MID - 3, 7, -6, 1.5);
  addLine(app, g, 24, MID + 3, 7, 6, 1.5);
  addLine(app, g, 31, 12, 0, -4);
  addLine(app, g, 31, 36, 0, 4);
  arrowHead(app, g, 29, MID + 8, 0.6, 1, 3.2);
}

function drawIgbt(app: App, g: Group): void {
  drawMosfet(app, g, false);
  arrowHead(app, g, 30, 38, 0, 1, 3.5);
}

function drawThyristor(app: App, g: Group, kind: 'scr' | 'triac' | 'diac' | 'gto' = 'scr'): void {
  addLeads(app, g);
  if (kind === 'diac') {
    g.add(
      app.polygon({
        points: [14, MID - 8, 24, MID, 14, MID + 8],
        fill: null,
        stroke: stroke(),
        strokeWidth: 1.7,
        listening: false,
      })
    );
    g.add(
      app.polygon({
        points: [34, MID - 8, 24, MID, 34, MID + 8],
        fill: null,
        stroke: stroke(),
        strokeWidth: 1.7,
        listening: false,
      })
    );
    addLine(app, g, 24, MID - 10, 0, 20, 1.8);
    return;
  }
  if (kind === 'triac') {
    // Bidirectional SCR pair + gate (IEC-style TRIAC)
    g.add(
      app.polygon({
        points: [12, MID - 8, 22, MID, 12, MID + 8],
        fill: null,
        stroke: stroke(),
        strokeWidth: 1.7,
        listening: false,
      })
    );
    g.add(
      app.polygon({
        points: [36, MID - 8, 26, MID, 36, MID + 8],
        fill: null,
        stroke: stroke(),
        strokeWidth: 1.7,
        listening: false,
      })
    );
    addLine(app, g, 22, MID - 9, 0, 18, 1.7);
    addLine(app, g, 26, MID - 9, 0, 18, 1.7);
    addLine(app, g, 24, MID + 8, 0, 10, 1.7);
    addLine(app, g, 24, 42, 6, 0, 1.7);
    return;
  }
  g.add(
    app.polygon({
      points: [14, MID - 9, 30, MID, 14, MID + 9],
      fill: null,
      stroke: stroke(),
      strokeWidth: 1.8,
      listening: false,
    })
  );
  addLine(app, g, 30, MID - 10, 0, 20, 2);
  addLine(app, g, 22, MID + 6, 0, 12, 1.6);
  if (kind === 'gto') {
    // Gate with turn-off bar (GTO)
    addLine(app, g, 18, 40, 8, 0, 1.6);
    addLine(app, g, 20, 38, 0, 4, 1.4);
    addLine(app, g, 24, 38, 0, 4, 1.4);
  }
}

function drawLogic(app: App, g: Group, kind: string): void {
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

function drawOpAmp(app: App, g: Group, kind: 'op' | 'inst' | 'comp' = 'op'): void {
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

function drawIcBox(app: App, g: Group, label: string, pins = 2): void {
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

function drawCrystal(app: App, g: Group, ceramic = false): void {
  addLeads(app, g);
  addLine(app, g, 18, 12, 0, 24, 2.4);
  addBox(app, g, 20, 16, 8, 16);
  addLine(app, g, 30, 12, 0, 24, 2.4);
  if (ceramic) {
    // Ceramic resonator: crystal + parallel load caps (simplified)
    addLine(app, g, 14, 14, 0, 8, 1.5);
    addLine(app, g, 16, 14, 0, 8, 1.5);
    addLine(app, g, 32, 26, 0, 8, 1.5);
    addLine(app, g, 34, 26, 0, 8, 1.5);
  }
}

function drawTransformer(app: App, g: Group, auto = false): void {
  for (let i = 0; i < 3; i++) {
    const y = 14 + i * 7;
    addPoly(app, g, [12, y, 15, y - 3, 18, y, 15, y + 3, 12, y], 1.6);
    if (!auto) addPoly(app, g, [30, y, 33, y - 3, 36, y, 33, y + 3, 30, y], 1.6);
  }
  addLine(app, g, 22, 12, 0, 24, 1.5, muted());
  if (!auto) addLine(app, g, 26, 12, 0, 24, 1.5, muted());
  addLine(app, g, 10, 10, 0, -2);
  addLine(app, g, 10, 38, 0, 2);
  if (!auto) {
    addLine(app, g, 38, 10, 0, -2);
    addLine(app, g, 38, 38, 0, 2);
  }
}

function drawSwitch(app: App, g: Group, kind: 'spst' | 'spdt' | 'dpst' | 'dpdt' | 'push' | 'toggle' | 'slide' | 'dip' | 'rotary' | 'reed' | 'limit' | 'key' | 'estop' | 'nc' = 'spst'): void {
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

function drawRelay(app: App, g: Group): void {
  addBox(app, g, 12, 8, 24, 32);
  addPoly(app, g, [16, 28, 18, 22, 22, 30, 26, 22, 28, 28], 1.5);
  addLine(app, g, 18, 14, 12, 0, 1.6, switchAccent());
  addCircle(app, g, 18, 14, 2, switchAccent(), 0);
  addCircle(app, g, 30, 14, 2, null, 1.4);
  addLine(app, g, 4, 28, 8, 0);
  addLine(app, g, 36, 28, 8, 0);
}

function drawMotor(app: App, g: Group, label: string): void {
  addCircle(app, g, MID, MID, 14, null, 2);
  addText(app, g, label, MID - label.length * 2.4, MID + 3, 9);
  addLine(app, g, 4, MID, 6, 0);
  addLine(app, g, 38, MID, 6, 0);
}

function drawConnector(app: App, g: Group, label: string): void {
  addBox(app, g, 12, 14, 24, 20, label);
  addLine(app, g, MID, 8, 0, 6);
  addLine(app, g, MID, 34, 0, 6);
}

function drawSensor(app: App, g: Group, label: string): void {
  addBox(app, g, 8, 12, 32, 24, label);
  addLine(app, g, 4, MID, 4, 0);
  addLine(app, g, 40, MID, 4, 0);
}

function drawMeter(app: App, g: Group, label: string): void {
  addCircle(app, g, MID, MID, 14, null, 2);
  addText(app, g, label, MID - 3, MID + 3, 10);
  addLine(app, g, MID, MID, 8, -8, 1.5, accent());
  addLeads(app, g);
}

function drawWireStub(app: App, g: Group): void {
  addLine(app, g, 0, MID, 48, 0, 2.25, getActiveDiagram().schematicWire);
}

function drawJunction(app: App, g: Group): void {
  addCircle(app, g, MID, MID, 3.5, getActiveDiagram().schematicWire, 0);
  addLine(app, g, 8, MID, 32, 0, 1.5, muted());
  addLine(app, g, MID, 8, 0, 32, 1.5, muted());
}

function drawNoConnect(app: App, g: Group): void {
  addLine(app, g, 16, 16, 16, 16, 2);
  addLine(app, g, 32, 16, -16, 16, 2);
  addLine(app, g, 4, MID, 10, 0);
}

function drawPowerFlag(app: App, g: Group): void {
  g.add(
    app.polygon({
      points: [8, MID, 20, 12, 40, 12, 40, 36, 20, 36],
      fill: getActiveDiagram().schematicFill,
      stroke: batteryAccent(),
      strokeWidth: 1.8,
      listening: false,
    })
  );
  addText(app, g, 'PWR', 18, MID + 3, 7);
}

function drawTestPoint(app: App, g: Group): void {
  addCircle(app, g, MID, MID, 5, null, 2);
  addLine(app, g, MID, MID + 5, 0, 14);
  addText(app, g, 'TP', 18, 14, 7);
}

function drawFan(app: App, g: Group): void {
  addCircle(app, g, MID, MID, 14, null, 1.8);
  addLine(app, g, MID, MID, 10, -4, 1.5);
  addLine(app, g, MID, MID, -8, -8, 1.5);
  addLine(app, g, MID, MID, -2, 10, 1.5);
}

function drawHeatsink(app: App, g: Group): void {
  for (let i = 0; i < 5; i++) addLine(app, g, 12 + i * 6, 10, 0, 28, 2);
  addLine(app, g, 10, 38, 28, 0, 2);
}

function drawMountingHole(app: App, g: Group): void {
  addCircle(app, g, MID, MID, 10, null, 1.6);
  addCircle(app, g, MID, MID, 4, null, 1.6);
}

/** Draw glyph into an existing pad group (local coords). */
export function drawSchematicGlyph(app: App, g: Group, kind: string): void {
  const k = resolveSchematicSymbolKind(kind);
  switch (k) {
    case 'resistor':
      drawResistor(app, g, 'fixed');
      break;
    case 'variableResistor':
      drawResistor(app, g, 'variable');
      break;
    case 'potentiometer':
      drawResistor(app, g, 'pot');
      break;
    case 'trimmer':
      drawResistor(app, g, 'variable');
      addLine(app, g, 20, 12, 8, 0, 1.5);
      break;
    case 'thermistorNtc':
      drawResistor(app, g, 'thermNtc');
      break;
    case 'thermistorPtc':
      drawResistor(app, g, 'thermPtc');
      break;
    case 'photoresistor':
      drawResistor(app, g, 'ldr');
      break;
    case 'varistor':
      drawResistor(app, g, 'mov');
      break;
    case 'capacitor':
      drawCapacitor(app, g, 'np');
      break;
    case 'electrolyticCap':
      drawCapacitor(app, g, 'electrolytic');
      break;
    case 'variableCap':
      drawCapacitor(app, g, 'variable');
      break;
    case 'inductor':
      drawInductor(app, g, 'fixed');
      break;
    case 'variableInductor':
      drawInductor(app, g, 'variable');
      break;
    case 'ferriteBead':
      drawInductor(app, g, 'ferrite');
      break;
    case 'rfCoil':
      drawInductor(app, g, 'rf');
      break;
    case 'transformer':
      drawTransformer(app, g, false);
      break;
    case 'autotransformer':
      drawTransformer(app, g, true);
      break;
    case 'crystal':
      drawCrystal(app, g, false);
      break;
    case 'ceramicResonator':
      drawCrystal(app, g, true);
      break;
    case 'battery':
      drawBattery(app, g, 2);
      break;
    case 'cell':
      drawBattery(app, g, 1);
      break;
    case 'dcSupply':
      drawSource(app, g, 'dc');
      break;
    case 'acSupply':
      drawSource(app, g, 'ac');
      break;
    case 'voltageSource':
      drawSource(app, g, 'voltage');
      break;
    case 'currentSource':
      drawSource(app, g, 'current');
      break;
    case 'ground':
    case 'earthGround':
      drawGround(app, g, 'earth');
      break;
    case 'chassisGround':
      drawGround(app, g, 'chassis');
      break;
    case 'signalGround':
      drawGround(app, g, 'signal');
      break;
    case 'powerFlag':
      drawPowerFlag(app, g);
      break;
    case 'fuse':
      drawFuse(app, g, false);
      break;
    case 'circuitBreaker':
    case 'polyfuse':
      drawFuse(app, g, true);
      break;
    case 'diode':
      drawDiode(app, g, 'std');
      break;
    case 'schottky':
      drawDiode(app, g, 'schottky');
      break;
    case 'zener':
      drawDiode(app, g, 'zener');
      break;
    case 'tvs':
      drawDiode(app, g, 'tvs');
      break;
    case 'led':
    case 'indicatorLed':
      drawDiode(app, g, 'led');
      break;
    case 'infraredLed':
      drawDiode(app, g, 'ir');
      break;
    case 'laserDiode':
      drawDiode(app, g, 'laser');
      break;
    case 'photodiode':
      drawDiode(app, g, 'photo');
      break;
    case 'bridgeRectifier':
      drawDiode(app, g, 'bridge');
      break;
    case 'tunnelDiode':
      drawDiode(app, g, 'tunnel');
      break;
    case 'varicap':
      drawDiode(app, g, 'varicap');
      break;
    case 'npn':
      drawBjt(app, g, false);
      break;
    case 'darlington':
      drawDarlington(app, g);
      break;
    case 'phototransistor':
      drawBjt(app, g, false, true);
      break;
    case 'pnp':
      drawBjt(app, g, true);
      break;
    case 'nmos':
      drawMosfet(app, g, false);
      break;
    case 'pmos':
      drawMosfet(app, g, true);
      break;
    case 'njfet':
      drawJfet(app, g, false);
      break;
    case 'pjfet':
      drawJfet(app, g, true);
      break;
    case 'ujt':
      drawUjt(app, g);
      break;
    case 'igbt':
      drawIgbt(app, g);
      break;
    case 'scr':
    case 'thyristor':
      drawThyristor(app, g, 'scr');
      break;
    case 'triac':
      drawThyristor(app, g, 'triac');
      break;
    case 'diac':
      drawThyristor(app, g, 'diac');
      break;
    case 'gto':
      drawThyristor(app, g, 'gto');
      break;
    case 'notGate':
      drawLogic(app, g, 'not');
      break;
    case 'buffer':
      drawLogic(app, g, 'buffer');
      break;
    case 'andGate':
      drawLogic(app, g, 'and');
      break;
    case 'nandGate':
      drawLogic(app, g, 'nand');
      break;
    case 'orGate':
      drawLogic(app, g, 'or');
      break;
    case 'norGate':
      drawLogic(app, g, 'nor');
      break;
    case 'xorGate':
      drawLogic(app, g, 'xor');
      break;
    case 'xnorGate':
      drawLogic(app, g, 'xnor');
      break;
    case 'schmittTrigger':
      drawLogic(app, g, 'schmitt');
      break;
    case 'comparator':
    case 'voltageComparator':
      drawOpAmp(app, g, 'comp');
      break;
    case 'opAmp':
      drawOpAmp(app, g, 'op');
      break;
    case 'instrumentationAmp':
      drawOpAmp(app, g, 'inst');
      break;
    case 'voltageReference':
      drawIcBox(app, g, 'VREF');
      break;
    case 'voltageRegulator':
      drawIcBox(app, g, 'REG');
      break;
    case 'ldo':
      drawIcBox(app, g, 'LDO');
      break;
    case 'buck':
      drawIcBox(app, g, 'BUCK');
      break;
    case 'boost':
      drawIcBox(app, g, 'BOOST');
      break;
    case 'buckBoost':
      drawIcBox(app, g, 'BB');
      break;
    case 'chargePump':
      drawIcBox(app, g, 'CP');
      break;
    case 'dac':
      drawIcBox(app, g, 'DAC');
      break;
    case 'adc':
      drawIcBox(app, g, 'ADC');
      break;
    case 'pll':
      drawIcBox(app, g, 'PLL');
      break;
    case 'mcu':
      drawIcBox(app, g, 'MCU');
      break;
    case 'mpu':
      drawIcBox(app, g, 'MPU');
      break;
    case 'dsp':
      drawIcBox(app, g, 'DSP');
      break;
    case 'fpga':
      drawIcBox(app, g, 'FPGA');
      break;
    case 'cpld':
      drawIcBox(app, g, 'CPLD');
      break;
    case 'rom':
      drawIcBox(app, g, 'ROM');
      break;
    case 'eeprom':
      drawIcBox(app, g, 'EEPROM');
      break;
    case 'flash':
      drawIcBox(app, g, 'FLASH');
      break;
    case 'sram':
      drawIcBox(app, g, 'SRAM');
      break;
    case 'dram':
      drawIcBox(app, g, 'DRAM');
      break;
    case 'rtc':
      drawIcBox(app, g, 'RTC');
      break;
    case 'timerIc':
      drawIcBox(app, g, '555');
      break;
    case 'counter':
      drawIcBox(app, g, 'CNT');
      break;
    case 'shiftRegister':
      drawIcBox(app, g, 'SR');
      break;
    case 'mux':
      drawIcBox(app, g, 'MUX');
      break;
    case 'demux':
      drawIcBox(app, g, 'DEMUX');
      break;
    case 'encoder':
      drawIcBox(app, g, 'ENC');
      break;
    case 'decoder':
      drawIcBox(app, g, 'DEC');
      break;
    case 'latch':
      drawIcBox(app, g, 'LATCH');
      break;
    case 'flipFlop':
      drawIcBox(app, g, 'FF');
      break;
    case 'tempSensor':
      drawSensor(app, g, 'TEMP');
      break;
    case 'humiditySensor':
      drawSensor(app, g, 'HUM');
      break;
    case 'pressureSensor':
      drawSensor(app, g, 'PRES');
      break;
    case 'lightSensor':
      drawSensor(app, g, 'LIGHT');
      break;
    case 'hallSensor':
      drawSensor(app, g, 'HALL');
      break;
    case 'currentSensor':
      drawSensor(app, g, 'I-SENS');
      break;
    case 'voltageSensor':
      drawSensor(app, g, 'V-SENS');
      break;
    case 'gasSensor':
      drawSensor(app, g, 'GAS');
      break;
    case 'accelerometer':
      drawSensor(app, g, 'ACC');
      break;
    case 'gyroscope':
      drawSensor(app, g, 'GYRO');
      break;
    case 'magnetometer':
      drawSensor(app, g, 'MAG');
      break;
    case 'ultrasonicSensor':
      drawSensor(app, g, 'US');
      break;
    case 'proximitySensor':
      drawSensor(app, g, 'PROX');
      break;
    case 'pirSensor':
      drawSensor(app, g, 'PIR');
      break;
    case 'touchSensor':
      drawSensor(app, g, 'TOUCH');
      break;
    case 'microphone':
      drawSensor(app, g, 'MIC');
      break;
    case 'relay':
    case 'reedRelay':
      drawRelay(app, g);
      break;
    case 'solenoid':
      drawMotor(app, g, 'SOL');
      break;
    case 'dcMotor':
      drawMotor(app, g, 'M');
      break;
    case 'acMotor':
      drawMotor(app, g, 'AC');
      break;
    case 'stepperMotor':
      drawMotor(app, g, 'STEP');
      break;
    case 'servoMotor':
      drawMotor(app, g, 'SERVO');
      break;
    case 'buzzer':
    case 'piezoBuzzer':
      drawMotor(app, g, 'BZ');
      break;
    case 'speaker':
      drawMotor(app, g, 'SPK');
      break;
    case 'lamp':
      drawMotor(app, g, 'LAMP');
      break;
    case 'sevenSegment':
      drawIcBox(app, g, '7SEG');
      break;
    case 'lcd':
      drawIcBox(app, g, 'LCD');
      break;
    case 'oled':
      drawIcBox(app, g, 'OLED');
      break;
    case 'switch':
    case 'spst':
    case 'toggleSwitch':
      drawSwitch(app, g, 'spst');
      break;
    case 'spdt':
      drawSwitch(app, g, 'spdt');
      break;
    case 'dpst':
      drawSwitch(app, g, 'dpst');
      break;
    case 'dpdt':
      drawSwitch(app, g, 'dpdt');
      break;
    case 'pushButtonNo':
      drawSwitch(app, g, 'push');
      break;
    case 'pushButtonNc':
      drawSwitch(app, g, 'nc');
      break;
    case 'slideSwitch':
    case 'dipSwitch':
      drawSwitch(app, g, 'slide');
      break;
    case 'rotarySwitch':
      drawSwitch(app, g, 'rotary');
      break;
    case 'reedSwitch':
      drawSwitch(app, g, 'reed');
      break;
    case 'limitSwitch':
      drawSwitch(app, g, 'limit');
      break;
    case 'keySwitch':
      drawSwitch(app, g, 'key');
      break;
    case 'eStop':
      drawSwitch(app, g, 'estop');
      break;
    case 'connector':
      drawConnector(app, g, 'CONN');
      break;
    case 'terminalBlock':
      drawConnector(app, g, 'TB');
      break;
    case 'header':
      drawConnector(app, g, 'HDR');
      break;
    case 'socket':
      drawConnector(app, g, 'SKT');
      break;
    case 'jumper':
      drawConnector(app, g, 'JMP');
      break;
    case 'usbConnector':
    case 'usb':
      drawConnector(app, g, 'USB');
      break;
    case 'rj45':
      drawConnector(app, g, 'RJ45');
      break;
    case 'hdmi':
      drawConnector(app, g, 'HDMI');
      break;
    case 'db9':
      drawConnector(app, g, 'DB9');
      break;
    case 'barrelJack':
      drawConnector(app, g, 'DCJ');
      break;
    case 'coax':
    case 'sma':
    case 'bnc':
      drawConnector(app, g, 'RF');
      break;
    case 'uart':
      drawIcBox(app, g, 'UART');
      break;
    case 'spi':
      drawIcBox(app, g, 'SPI');
      break;
    case 'i2c':
      drawIcBox(app, g, 'I²C');
      break;
    case 'canBus':
      drawIcBox(app, g, 'CAN');
      break;
    case 'linBus':
      drawIcBox(app, g, 'LIN');
      break;
    case 'rs232':
      drawIcBox(app, g, 'RS232');
      break;
    case 'rs485':
      drawIcBox(app, g, 'RS485');
      break;
    case 'ethernetPhy':
      drawIcBox(app, g, 'PHY');
      break;
    case 'bluetooth':
      drawIcBox(app, g, 'BT');
      break;
    case 'wifi':
      drawIcBox(app, g, 'WiFi');
      break;
    case 'nfc':
      drawIcBox(app, g, 'NFC');
      break;
    case 'zigbee':
      drawIcBox(app, g, 'ZB');
      break;
    case 'lora':
      drawIcBox(app, g, 'LoRa');
      break;
    case 'gps':
      drawIcBox(app, g, 'GPS');
      break;
    case 'esdProtection':
    case 'reversePolarity':
      drawDiode(app, g, 'tvs');
      break;
    case 'sparkGap':
    case 'gdt':
      addLeads(app, g);
      addLine(app, g, 18, 14, 0, 20, 2);
      addLine(app, g, 30, 14, 0, 20, 2);
      addCircle(app, g, MID, MID, 3, null, 1.4);
      break;
    case 'mov':
      drawResistor(app, g, 'mov');
      break;
    case 'testPoint':
      drawTestPoint(app, g);
      break;
    case 'probe':
    case 'scopeProbe':
      drawMeter(app, g, 'P');
      break;
    case 'ammeter':
      drawMeter(app, g, 'A');
      break;
    case 'voltmeter':
      drawMeter(app, g, 'V');
      break;
    case 'currentShunt':
      drawResistor(app, g, 'fixed');
      addText(app, g, 'SH', 18, 12, 7);
      break;
    case 'fan':
      drawFan(app, g);
      break;
    case 'heatsink':
      drawHeatsink(app, g);
      break;
    case 'connectorShield':
    case 'chassis':
    case 'enclosure':
      addBox(app, g, 8, 10, 32, 28, k === 'enclosure' ? 'ENC' : 'CHS');
      break;
    case 'mountingHole':
    case 'mountingPad':
      drawMountingHole(app, g);
      break;
    case 'netLabel':
      addBox(app, g, 8, 16, 32, 16, 'NET');
      break;
    case 'bus':
      addLine(app, g, 8, MID - 4, 32, 0, 3);
      addLine(app, g, 8, MID + 4, 32, 0, 3);
      break;
    case 'junction':
      drawJunction(app, g);
      break;
    case 'noConnect':
      drawNoConnect(app, g);
      break;
    case 'wire':
      drawWireStub(app, g);
      break;
    case 'shield':
      addBox(app, g, 10, 10, 28, 28);
      addLine(app, g, 14, 14, 20, 20, 1.4, muted());
      break;
    case 'offPageConnector':
    case 'sheetConnector':
      g.add(
        app.polygon({
          points: [8, MID, 20, 14, 40, 14, 40, 34, 20, 34],
          fill: getActiveDiagram().schematicFill,
          stroke: stroke(),
          strokeWidth: 1.7,
          listening: false,
        })
      );
      break;
    case 'harness':
    case 'cable':
      addLine(app, g, 8, MID - 4, 32, 0, 2);
      addLine(app, g, 8, MID, 32, 0, 2);
      addLine(app, g, 8, MID + 4, 32, 0, 2);
      break;
    case 'terminal':
    case 'pin':
      addCircle(app, g, MID, MID, 4, null, 2);
      addLine(app, g, 4, MID, 16, 0);
      break;
    default:
      drawResistor(app, g, 'fixed');
      break;
  }
}

/* ── Catalog metadata ───────────────────────────────────────────────────── */

type Row = [string, string, SchematicSymbolCategory];

const CATALOG: Row[] = [
  // Power
  ['battery', 'Battery', 'power'],
  ['cell', 'Cell', 'power'],
  ['dcSupply', 'DC Supply', 'power'],
  ['acSupply', 'AC Supply', 'power'],
  ['ground', 'Ground (GND)', 'power'],
  ['earthGround', 'Earth Ground', 'power'],
  ['chassisGround', 'Chassis Ground', 'power'],
  ['signalGround', 'Signal Ground', 'power'],
  ['powerFlag', 'Power Flag', 'power'],
  ['voltageSource', 'Voltage Source', 'power'],
  ['currentSource', 'Current Source', 'power'],
  ['fuse', 'Fuse', 'power'],
  ['circuitBreaker', 'Circuit Breaker', 'power'],
  // Passive
  ['resistor', 'Resistor', 'passive'],
  ['variableResistor', 'Variable Resistor', 'passive'],
  ['potentiometer', 'Potentiometer', 'passive'],
  ['trimmer', 'Trimmer', 'passive'],
  ['thermistorNtc', 'NTC Thermistor', 'passive'],
  ['thermistorPtc', 'PTC Thermistor', 'passive'],
  ['photoresistor', 'Photoresistor (LDR)', 'passive'],
  ['varistor', 'Varistor (MOV)', 'passive'],
  ['capacitor', 'Capacitor', 'passive'],
  ['electrolyticCap', 'Electrolytic Capacitor', 'passive'],
  ['variableCap', 'Var. Capacitor', 'passive'],
  ['inductor', 'Inductor', 'passive'],
  ['variableInductor', 'Variable Inductor', 'passive'],
  ['ferriteBead', 'Ferrite Bead', 'passive'],
  ['transformer', 'Transformer', 'passive'],
  ['autotransformer', 'Autotransformer', 'passive'],
  ['rfCoil', 'RF Coil', 'passive'],
  ['crystal', 'Crystal', 'passive'],
  ['ceramicResonator', 'Ceramic Resonator', 'passive'],
  // Diodes
  ['diode', 'Diode', 'diode'],
  ['schottky', 'Schottky Diode', 'diode'],
  ['zener', 'Zener Diode', 'diode'],
  ['tvs', 'TVS Diode', 'diode'],
  ['led', 'LED', 'diode'],
  ['infraredLed', 'Infrared LED', 'diode'],
  ['laserDiode', 'Laser Diode', 'diode'],
  ['photodiode', 'Photodiode', 'diode'],
  ['bridgeRectifier', 'Bridge Rectifier', 'diode'],
  ['tunnelDiode', 'Tunnel Diode', 'diode'],
  ['varicap', 'Varicap (Varactor)', 'diode'],
  // Transistors
  ['npn', 'NPN BJT', 'transistor'],
  ['pnp', 'PNP BJT', 'transistor'],
  ['nmos', 'N-Channel MOSFET', 'transistor'],
  ['pmos', 'P-Channel MOSFET', 'transistor'],
  ['njfet', 'N-Channel JFET', 'transistor'],
  ['pjfet', 'P-Channel JFET', 'transistor'],
  ['igbt', 'IGBT', 'transistor'],
  ['darlington', 'Darlington', 'transistor'],
  ['phototransistor', 'Phototransistor', 'transistor'],
  ['ujt', 'UJT', 'transistor'],
  // Thyristors
  ['scr', 'SCR', 'thyristor'],
  ['triac', 'TRIAC', 'thyristor'],
  ['diac', 'DIAC', 'thyristor'],
  ['gto', 'GTO', 'thyristor'],
  ['thyristor', 'Thyristor', 'thyristor'],
  // Logic
  ['notGate', 'NOT Gate', 'logic'],
  ['buffer', 'Buffer', 'logic'],
  ['andGate', 'AND Gate', 'logic'],
  ['nandGate', 'NAND Gate', 'logic'],
  ['orGate', 'OR Gate', 'logic'],
  ['norGate', 'NOR Gate', 'logic'],
  ['xorGate', 'XOR Gate', 'logic'],
  ['xnorGate', 'XNOR Gate', 'logic'],
  ['schmittTrigger', 'Schmitt Trigger', 'logic'],
  ['comparator', 'Comparator', 'logic'],
  // Analog
  ['opAmp', 'Operational Amplifier', 'analog'],
  ['instrumentationAmp', 'Instrumentation Amp', 'analog'],
  ['voltageComparator', 'Voltage Comparator', 'analog'],
  ['voltageReference', 'Voltage Reference', 'analog'],
  ['voltageRegulator', 'Voltage Regulator', 'analog'],
  ['ldo', 'LDO Regulator', 'analog'],
  ['buck', 'Buck Converter', 'analog'],
  ['boost', 'Boost Converter', 'analog'],
  ['buckBoost', 'Buck-Boost Converter', 'analog'],
  ['chargePump', 'Charge Pump', 'analog'],
  ['dac', 'DAC', 'analog'],
  ['adc', 'ADC', 'analog'],
  ['pll', 'PLL', 'analog'],
  // Digital
  ['mcu', 'Microcontroller', 'digital'],
  ['mpu', 'Microprocessor', 'digital'],
  ['dsp', 'DSP', 'digital'],
  ['fpga', 'FPGA', 'digital'],
  ['cpld', 'CPLD', 'digital'],
  ['rom', 'ROM', 'digital'],
  ['eeprom', 'EEPROM', 'digital'],
  ['flash', 'Flash Memory', 'digital'],
  ['sram', 'SRAM', 'digital'],
  ['dram', 'DRAM', 'digital'],
  ['rtc', 'Real-Time Clock', 'digital'],
  ['timerIc', 'Timer IC', 'digital'],
  ['counter', 'Counter', 'digital'],
  ['shiftRegister', 'Shift Register', 'digital'],
  ['mux', 'Multiplexer', 'digital'],
  ['demux', 'Demultiplexer', 'digital'],
  ['encoder', 'Encoder', 'digital'],
  ['decoder', 'Decoder', 'digital'],
  ['latch', 'Latch', 'digital'],
  ['flipFlop', 'Flip-Flop', 'digital'],
  // Sensors
  ['tempSensor', 'Temperature Sensor', 'sensor'],
  ['humiditySensor', 'Humidity Sensor', 'sensor'],
  ['pressureSensor', 'Pressure Sensor', 'sensor'],
  ['lightSensor', 'Light Sensor', 'sensor'],
  ['hallSensor', 'Hall Effect Sensor', 'sensor'],
  ['currentSensor', 'Current Sensor', 'sensor'],
  ['voltageSensor', 'Voltage Sensor', 'sensor'],
  ['gasSensor', 'Gas Sensor', 'sensor'],
  ['accelerometer', 'Accelerometer', 'sensor'],
  ['gyroscope', 'Gyroscope', 'sensor'],
  ['magnetometer', 'Magnetometer', 'sensor'],
  ['ultrasonicSensor', 'Ultrasonic Sensor', 'sensor'],
  ['proximitySensor', 'Proximity Sensor', 'sensor'],
  ['pirSensor', 'PIR Sensor', 'sensor'],
  ['touchSensor', 'Touch Sensor', 'sensor'],
  ['microphone', 'Microphone', 'sensor'],
  // Actuators
  ['relay', 'Relay', 'actuator'],
  ['reedRelay', 'Reed Relay', 'actuator'],
  ['solenoid', 'Solenoid', 'actuator'],
  ['dcMotor', 'DC Motor', 'actuator'],
  ['acMotor', 'AC Motor', 'actuator'],
  ['stepperMotor', 'Stepper Motor', 'actuator'],
  ['servoMotor', 'Servo Motor', 'actuator'],
  ['buzzer', 'Buzzer', 'actuator'],
  ['speaker', 'Speaker', 'actuator'],
  ['piezoBuzzer', 'Piezo Buzzer', 'actuator'],
  ['lamp', 'Lamp', 'actuator'],
  ['indicatorLed', 'Indicator LED', 'actuator'],
  ['sevenSegment', 'Seven Segment Display', 'actuator'],
  ['lcd', 'LCD', 'actuator'],
  ['oled', 'OLED Display', 'actuator'],
  // Switches
  ['spst', 'SPST Switch', 'switch'],
  ['spdt', 'SPDT Switch', 'switch'],
  ['dpst', 'DPST Switch', 'switch'],
  ['dpdt', 'DPDT Switch', 'switch'],
  ['pushButtonNo', 'Push Button (NO)', 'switch'],
  ['pushButtonNc', 'Push Button (NC)', 'switch'],
  ['toggleSwitch', 'Toggle Switch', 'switch'],
  ['slideSwitch', 'Slide Switch', 'switch'],
  ['dipSwitch', 'DIP Switch', 'switch'],
  ['rotarySwitch', 'Rotary Switch', 'switch'],
  ['reedSwitch', 'Reed Switch', 'switch'],
  ['limitSwitch', 'Limit Switch', 'switch'],
  ['keySwitch', 'Key Switch', 'switch'],
  ['eStop', 'Emergency Stop', 'switch'],
  // Connectors
  ['connector', 'Connector', 'connector'],
  ['terminalBlock', 'Terminal Block', 'connector'],
  ['header', 'Header', 'connector'],
  ['socket', 'Socket', 'connector'],
  ['jumper', 'Jumper', 'connector'],
  ['usbConnector', 'USB Connector', 'connector'],
  ['rj45', 'RJ45 Connector', 'connector'],
  ['hdmi', 'HDMI Connector', 'connector'],
  ['db9', 'DB9 Connector', 'connector'],
  ['barrelJack', 'Barrel Jack', 'connector'],
  ['coax', 'Coaxial Connector', 'connector'],
  ['sma', 'SMA Connector', 'connector'],
  ['bnc', 'BNC Connector', 'connector'],
  // Comms
  ['uart', 'UART', 'comms'],
  ['spi', 'SPI', 'comms'],
  ['i2c', 'I²C', 'comms'],
  ['canBus', 'CAN Bus', 'comms'],
  ['linBus', 'LIN Bus', 'comms'],
  ['rs232', 'RS-232', 'comms'],
  ['rs485', 'RS-485', 'comms'],
  ['usb', 'USB', 'comms'],
  ['ethernetPhy', 'Ethernet PHY', 'comms'],
  ['bluetooth', 'Bluetooth Module', 'comms'],
  ['wifi', 'Wi-Fi Module', 'comms'],
  ['nfc', 'NFC Module', 'comms'],
  ['zigbee', 'Zigbee Module', 'comms'],
  ['lora', 'LoRa Module', 'comms'],
  ['gps', 'GPS Module', 'comms'],
  // Protection
  ['esdProtection', 'ESD Protection', 'protection'],
  ['polyfuse', 'Polyfuse (PTC)', 'protection'],
  ['mov', 'MOV', 'protection'],
  ['sparkGap', 'Spark Gap', 'protection'],
  ['gdt', 'Gas Discharge Tube', 'protection'],
  ['reversePolarity', 'Reverse Polarity Protection', 'protection'],
  // Test
  ['testPoint', 'Test Point', 'test'],
  ['probe', 'Probe', 'test'],
  ['scopeProbe', 'Oscilloscope Probe', 'test'],
  ['ammeter', 'Ammeter', 'test'],
  ['voltmeter', 'Voltmeter', 'test'],
  ['currentShunt', 'Current Shunt', 'test'],
  // Mechanical
  ['fan', 'Fan', 'mechanical'],
  ['heatsink', 'Heatsink', 'mechanical'],
  ['connectorShield', 'Connector Shield', 'mechanical'],
  ['chassis', 'Chassis', 'mechanical'],
  ['enclosure', 'Enclosure', 'mechanical'],
  ['mountingHole', 'Mounting Hole', 'mechanical'],
  // Misc
  ['netLabel', 'Net Label', 'misc'],
  ['bus', 'Bus', 'misc'],
  ['junction', 'Junction', 'misc'],
  ['noConnect', 'No Connect (NC)', 'misc'],
  ['wire', 'Wire', 'misc'],
  ['shield', 'Shield', 'misc'],
  ['offPageConnector', 'Off-Page Connector', 'misc'],
  ['sheetConnector', 'Sheet Connector', 'misc'],
  ['harness', 'Harness', 'misc'],
  ['cable', 'Cable', 'misc'],
  ['terminal', 'Terminal', 'misc'],
  ['pin', 'Pin', 'misc'],
  ['mountingPad', 'Mounting Pad', 'misc'],
];

const ALIASES: Record<string, string> = {
  // legacy
  switch: 'spst',
  // common synonyms
  gnd: 'ground',
  earth: 'earthGround',
  earth_ground: 'earthGround',
  chassis_ground: 'chassisGround',
  signal_ground: 'signalGround',
  dc_supply: 'dcSupply',
  ac_supply: 'acSupply',
  voltage_source: 'voltageSource',
  current_source: 'currentSource',
  circuit_breaker: 'circuitBreaker',
  variable_resistor: 'variableResistor',
  pot: 'potentiometer',
  trimmer_potentiometer: 'trimmer',
  thermistor_ntc: 'thermistorNtc',
  thermistor_ptc: 'thermistorPtc',
  ntc: 'thermistorNtc',
  ptc: 'thermistorPtc',
  ldr: 'photoresistor',
  mov_varistor: 'varistor',
  electrolytic: 'electrolyticCap',
  electrolytic_capacitor: 'electrolyticCap',
  variable_capacitor: 'variableCap',
  variable_inductor: 'variableInductor',
  ferrite_bead: 'ferriteBead',
  rf_coil: 'rfCoil',
  ceramic_resonator: 'ceramicResonator',
  schottky_diode: 'schottky',
  zener_diode: 'zener',
  tvs_diode: 'tvs',
  ir_led: 'infraredLed',
  infrared_led: 'infraredLed',
  laser_diode: 'laserDiode',
  bridge_rectifier: 'bridgeRectifier',
  tunnel_diode: 'tunnelDiode',
  varactor: 'varicap',
  npn_bjt: 'npn',
  pnp_bjt: 'pnp',
  n_channel_mosfet: 'nmos',
  p_channel_mosfet: 'pmos',
  nmosfet: 'nmos',
  pmosfet: 'pmos',
  n_channel_jfet: 'njfet',
  p_channel_jfet: 'pjfet',
  darlington_transistor: 'darlington',
  not: 'notGate',
  and: 'andGate',
  nand: 'nandGate',
  or: 'orGate',
  nor: 'norGate',
  xor: 'xorGate',
  xnor: 'xnorGate',
  schmitt: 'schmittTrigger',
  opamp: 'opAmp',
  op_amp: 'opAmp',
  instrumentation_amplifier: 'instrumentationAmp',
  voltage_comparator: 'voltageComparator',
  voltage_reference: 'voltageReference',
  voltage_regulator: 'voltageRegulator',
  ldo_regulator: 'ldo',
  buck_converter: 'buck',
  boost_converter: 'boost',
  microcontroller: 'mcu',
  microprocessor: 'mpu',
  flash_memory: 'flash',
  real_time_clock: 'rtc',
  timer_ic: 'timerIc',
  shift_register: 'shiftRegister',
  multiplexer: 'mux',
  demultiplexer: 'demux',
  flip_flop: 'flipFlop',
  temperature_sensor: 'tempSensor',
  humidity_sensor: 'humiditySensor',
  pressure_sensor: 'pressureSensor',
  light_sensor: 'lightSensor',
  hall_effect_sensor: 'hallSensor',
  current_sensor: 'currentSensor',
  voltage_sensor: 'voltageSensor',
  gas_sensor: 'gasSensor',
  ultrasonic_sensor: 'ultrasonicSensor',
  proximity_sensor: 'proximitySensor',
  pir_sensor: 'pirSensor',
  touch_sensor: 'touchSensor',
  reed_relay: 'reedRelay',
  dc_motor: 'dcMotor',
  ac_motor: 'acMotor',
  stepper_motor: 'stepperMotor',
  servo_motor: 'servoMotor',
  piezo_buzzer: 'piezoBuzzer',
  indicator_led: 'indicatorLed',
  seven_segment: 'sevenSegment',
  seven_segment_display: 'sevenSegment',
  oled_display: 'oled',
  spst_switch: 'spst',
  spdt_switch: 'spdt',
  dpst_switch: 'dpst',
  dpdt_switch: 'dpdt',
  push_button: 'pushButtonNo',
  push_button_no: 'pushButtonNo',
  push_button_nc: 'pushButtonNc',
  toggle_switch: 'toggleSwitch',
  slide_switch: 'slideSwitch',
  dip_switch: 'dipSwitch',
  rotary_switch: 'rotarySwitch',
  reed_switch: 'reedSwitch',
  limit_switch: 'limitSwitch',
  key_switch: 'keySwitch',
  emergency_stop: 'eStop',
  emergency_stop_switch: 'eStop',
  terminal_block: 'terminalBlock',
  usb_connector: 'usbConnector',
  rj45_connector: 'rj45',
  hdmi_connector: 'hdmi',
  db9_connector: 'db9',
  barrel_jack: 'barrelJack',
  coaxial_connector: 'coax',
  sma_connector: 'sma',
  bnc_connector: 'bnc',
  can_bus: 'canBus',
  lin_bus: 'linBus',
  rs_232: 'rs232',
  rs_485: 'rs485',
  ethernet_phy: 'ethernetPhy',
  bluetooth_module: 'bluetooth',
  wifi_module: 'wifi',
  nfc_module: 'nfc',
  zigbee_module: 'zigbee',
  lora_module: 'lora',
  gps_module: 'gps',
  esd: 'esdProtection',
  esd_protection: 'esdProtection',
  gas_discharge_tube: 'gdt',
  spark_gap: 'sparkGap',
  reverse_polarity: 'reversePolarity',
  test_point: 'testPoint',
  oscilloscope_probe: 'scopeProbe',
  current_shunt: 'currentShunt',
  connector_shield: 'connectorShield',
  mounting_hole: 'mountingHole',
  mounting_pad: 'mountingPad',
  net_label: 'netLabel',
  no_connect: 'noConnect',
  nc: 'noConnect',
  off_page_connector: 'offPageConnector',
  sheet_connector: 'sheetConnector',
};

const KIND_SET = new Set(CATALOG.map((r) => r[0]));

export function resolveSchematicSymbolKind(input: string): string {
  const raw = String(input || '')
    .trim()
    .replace(/[\s-]+/g, '_')
    .replace(/²/g, '2');
  const lower = raw.toLowerCase();
  if (KIND_SET.has(raw)) return raw;
  if (ALIASES[raw]) return ALIASES[raw];
  if (ALIASES[lower]) return ALIASES[lower];
  // camelCase already
  if (KIND_SET.has(lower)) return lower;
  // snake to camel attempt
  const camel = lower.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
  if (KIND_SET.has(camel)) return camel;
  if (ALIASES[camel]) return ALIASES[camel];
  return 'resistor';
}

export function listSchematicSymbols(category?: SchematicSymbolCategory): SchematicSymbolMeta[] {
  return CATALOG.filter(([, , cat]) => !category || cat === category).map(([kind, label, cat]) => ({
    kind,
    label,
    category: cat,
  }));
}

export function listSchematicSymbolCategories(): SchematicSymbolCategory[] {
  const seen = new Set<SchematicSymbolCategory>();
  const out: SchematicSymbolCategory[] = [];
  for (const [, , cat] of CATALOG) {
    if (!seen.has(cat)) {
      seen.add(cat);
      out.push(cat);
    }
  }
  return out;
}

export function getSchematicSymbolMeta(kind: string): SchematicSymbolMeta {
  const resolved = resolveSchematicSymbolKind(kind);
  const row = CATALOG.find(([k]) => k === resolved);
  if (row) return { kind: row[0], label: row[1], category: row[2] };
  return { kind: resolved, label: resolved, category: 'misc' };
}

export const SCHEMATIC_SYMBOL_SIZE = S;
