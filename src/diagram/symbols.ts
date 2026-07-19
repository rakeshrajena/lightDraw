import type { App } from '../App';
import type { Group } from '../shapes/Group';
import type { SchematicComponent } from './types';
import { addAccentBar, addCardChrome } from './chrome';
import { getActiveDiagram } from './theme';
import {
  drawSchematicGlyph,
  getSchematicSymbolMeta,
  resolveSchematicSymbolKind,
  SCHEMATIC_SYMBOL_SIZE,
  type SchematicSymbolCategory,
} from './schematicIcons';

const SYMBOL_SIZE = SCHEMATIC_SYMBOL_SIZE;
const ACCENT_H = 4;

/** Top accent stripe by schematic category (catalog / card chrome). */
function categoryAccent(category: SchematicSymbolCategory): string {
  const d = getActiveDiagram();
  switch (category) {
    case 'power':
      return d.schematicBattery;
    case 'passive':
      return d.schematicResistor;
    case 'diode':
      return d.schematicLedStroke;
    case 'transistor':
    case 'thyristor':
      return '#a78bfa';
    case 'logic':
    case 'digital':
      return d.schematicSwitch;
    case 'analog':
      return '#22d3ee';
    case 'sensor':
      return '#34d399';
    case 'actuator':
      return '#fb7185';
    case 'switch':
      return d.schematicSwitch;
    case 'connector':
      return '#94a3b8';
    case 'comms':
      return '#38bdf8';
    case 'protection':
      return '#f97316';
    case 'test':
      return '#eab308';
    case 'mechanical':
      return '#64748b';
    default:
      return d.edgeMuted;
  }
}

/** Create an electrical schematic symbol (full electronic catalog). */
export function createSymbol(
  app: App,
  type: string,
  x: number,
  y: number,
  label?: string
): Group {
  const kind = resolveSchematicSymbolKind(type);
  const meta = getSchematicSymbolMeta(kind);
  const accent = categoryAccent(meta.category);

  if (kind === 'wire') {
    const g = app.group({ x, y });
    drawSchematicGlyph(app, g, kind);
    g.metadata = { symbolType: kind };
    return g;
  }

  // Outer wrapper holds label + accent; inner plate is hard-clipped to the rounded box.
  const wrap = app.group({ x, y });
  const radius = 4;
  const pad = app.group({ listening: false });
  // Rounded clip so strokes cannot leak through square corners past the fill.
  pad.mask = app.roundedRect({
    width: SYMBOL_SIZE,
    height: SYMBOL_SIZE,
    cornerRadius: radius,
    listening: false,
  });
  addCardChrome(app, pad, {
    width: SYMBOL_SIZE,
    height: SYMBOL_SIZE,
    cornerRadius: radius,
    fill: getActiveDiagram().schematicFill,
    stroke: getActiveDiagram().labelPillStroke,
    strokeWidth: 1,
    shadow: null,
    sheen: false,
    // Accent drawn on wrap (below) so it is never masked/clipped away.
    accentColor: undefined,
  });

  const topPad = ACCENT_H + 4;
  const sidePad = 6;
  const bottomPad = 6;
  const availW = SYMBOL_SIZE - sidePad * 2;
  const availH = SYMBOL_SIZE - topPad - bottomPad;
  const scale = Math.min(availW / SYMBOL_SIZE, availH / SYMBOL_SIZE) * 0.9;
  const glyphHost = app.group({
    x: (SYMBOL_SIZE - SYMBOL_SIZE * scale) / 2,
    y: topPad + (availH - SYMBOL_SIZE * scale) / 2,
    scaleX: scale,
    scaleY: scale,
    listening: false,
  });
  drawSchematicGlyph(app, glyphHost, kind);
  pad.add(glyphHost);
  wrap.add(pad);
  // Category strip on the wrapper — always visible for every symbol (fuse, GND, etc.).
  addAccentBar(app, wrap, SYMBOL_SIZE, accent, ACCENT_H);

  wrap.metadata = { symbolType: kind };
  if (label) {
    wrap.add(
      app.text({
        text: label,
        x: centerLabelX(label, SYMBOL_SIZE),
        y: SYMBOL_SIZE + 6,
        fontSize: getActiveDiagram().fontSize.sm,
        fontWeight: '600',
        fontFamily: getActiveDiagram().fontFamily,
        fill: getActiveDiagram().schematicLabel,
        listening: false,
      })
    );
  }
  return wrap;
}

function centerLabelX(label: string, boxWidth: number): number {
  const approx = label.length * getActiveDiagram().fontSize.sm * 0.55;
  // Allow negative X so long labels stay centered under the glyph (not left-clipped).
  return (boxWidth - approx) / 2;
}

function junctionDot(app: App, x: number, y: number): Group {
  const g = app.group({ listening: false });
  g.add(
    app.circle({
      x,
      y,
      radius: 3,
      fill: getActiveDiagram().schematicWire,
      stroke: getActiveDiagram().surface,
      strokeWidth: 1,
      listening: false,
    })
  );
  return g;
}

function wireBetween(app: App, x1: number, y1: number, x2: number, y2: number): Group {
  const g = app.group({ listening: false });
  g.add(
    app.line({
      x: x1,
      y: y1,
      x2: x2 - x1,
      y2: y2 - y1,
      stroke: getActiveDiagram().schematicWireGlow,
      strokeWidth: 5,
      lineCap: 'round',
      opacity: 0.5,
      listening: false,
    })
  );
  g.add(
    app.line({
      x: x1,
      y: y1,
      x2: x2 - x1,
      y2: y2 - y1,
      stroke: getActiveDiagram().schematicWire,
      strokeWidth: 2.25,
      lineCap: 'round',
      listening: false,
    })
  );
  return g;
}

/** Build a schematic from component list */
export function buildSchematic(app: App, components: SchematicComponent[]): Group {
  const group = app.group({ name: 'schematic' });
  const wireLayer = app.group({ zIndex: -10, listening: false }) as Group;
  wireLayer.metadata.diagramEdgeLayer = true;
  layoutSchematicWires(app, wireLayer, components);
  group.add(wireLayer);
  for (const comp of components) {
    const sym = createSymbol(app, comp.type, comp.x, comp.y, comp.label);
    sym.metadata.diagramId = comp.id;
    sym.metadata.diagramCardWidth = SYMBOL_SIZE;
    sym.metadata.diagramCardHeight = SYMBOL_SIZE;
    if (comp.rotation) sym.rotation = comp.rotation;
    group.add(sym);
  }
  return group;
}

/** Rebuild schematic wires from current symbol positions (live drag). */
export function rewireSchematic(app: App, root: Group): void {
  let wireLayer = root.children.find((c) => c.metadata?.diagramEdgeLayer) as Group | undefined;
  if (!wireLayer) {
    wireLayer = app.group({ zIndex: -10, listening: false }) as Group;
    wireLayer.metadata.diagramEdgeLayer = true;
    root.add(wireLayer);
  } else {
    for (const child of [...wireLayer.children]) {
      wireLayer.remove(child);
      child.destroy();
    }
  }

  const comps = root.children
    .filter((c) => c.metadata?.symbolType && c.metadata?.diagramId)
    .map((c) => ({
      id: c.metadata.diagramId as string,
      type: String(c.metadata.symbolType),
      x: c.x,
      y: c.y,
      rotation: c.rotation || 0,
    }));
  layoutSchematicWires(app, wireLayer, comps);
  root.markDirty();
}

function schematicPort(
  c: { x: number; y: number; rotation?: number },
  side: 'left' | 'right'
): { x: number; y: number } {
  const lx = side === 'right' ? SYMBOL_SIZE : 0;
  const ly = SYMBOL_SIZE / 2;
  const rad = (((c.rotation || 0) * Math.PI) / 180);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: c.x + lx * cos - ly * sin,
    y: c.y + lx * sin + ly * cos,
  };
}

function layoutSchematicWires(
  app: App,
  wireLayer: Group,
  components: Array<{ type: string; x: number; y: number; rotation?: number }>
): void {
  const sorted = [...components].sort((a, b) => a.x - b.x);
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (resolveSchematicSymbolKind(a.type) === 'wire' || resolveSchematicSymbolKind(b.type) === 'wire') {
      continue;
    }
    const p1 = schematicPort(a, 'right');
    const p2 = schematicPort(b, 'left');
    const x1 = p1.x;
    const y1 = p1.y;
    const x2 = p2.x;
    const y2 = p2.y;
    if (x2 <= x1 - 2 && Math.abs(y2 - y1) < 1) continue;
    if (Math.abs(y1 - y2) < 1.5) {
      if (x2 > x1) {
        wireLayer.add(wireBetween(app, x1, y1, x2, y2));
        wireLayer.add(junctionDot(app, x1, y1));
        wireLayer.add(junctionDot(app, x2, y2));
      }
    } else {
      const midX = (x1 + x2) / 2;
      wireLayer.add(wireBetween(app, x1, y1, midX, y1));
      wireLayer.add(wireBetween(app, midX, y1, midX, y2));
      wireLayer.add(wireBetween(app, midX, y2, x2, y2));
      wireLayer.add(junctionDot(app, x1, y1));
      wireLayer.add(junctionDot(app, midX, y1));
      wireLayer.add(junctionDot(app, midX, y2));
      wireLayer.add(junctionDot(app, x2, y2));
    }
  }
}

/** Legacy named factories kept for Symbols namespace compatibility. */
function resistor(app: App, x: number, y: number): Group {
  return createSymbol(app, 'resistor', x, y);
}
function capacitor(app: App, x: number, y: number): Group {
  return createSymbol(app, 'capacitor', x, y);
}
function ground(app: App, x: number, y: number): Group {
  return createSymbol(app, 'ground', x, y);
}
function battery(app: App, x: number, y: number): Group {
  return createSymbol(app, 'battery', x, y);
}
function switchSymbol(app: App, x: number, y: number): Group {
  return createSymbol(app, 'switch', x, y);
}
function led(app: App, x: number, y: number): Group {
  return createSymbol(app, 'led', x, y);
}

export const Symbols = {
  resistor,
  capacitor,
  ground,
  battery,
  switch: switchSymbol,
  led,
  create: createSymbol,
  build: buildSchematic,
  meta: getSchematicSymbolMeta,
};
