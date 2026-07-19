import type { App } from '../App';
import type { Group } from '../shapes/Group';
import type { SchematicComponent } from './types';
import { addCardChrome } from './chrome';
import { getActiveDiagram } from './theme';

const SYMBOL_SIZE = 48;

function schematicStroke(): string {
  return getActiveDiagram().schematicStroke;
}

function symbolAccent(type: SchematicComponent['type']): string | undefined {
  const d = getActiveDiagram();
  const map: Partial<Record<SchematicComponent['type'], string>> = {
    battery: d.schematicBattery,
    resistor: d.schematicResistor,
    switch: d.schematicSwitch,
    led: d.schematicLedStroke,
  };
  return map[type];
}

function symbolPad(app: App, w: number, h: number, accent?: string): Group {
  const g = app.group();
  addCardChrome(app, g, {
    width: w,
    height: h,
    cornerRadius: getActiveDiagram().radii.sm,
    fill: getActiveDiagram().schematicFill,
    stroke: getActiveDiagram().labelPillStroke,
    strokeWidth: getActiveDiagram().stroke.label,
    shadow: getActiveDiagram().shadowSoft,
    accentColor: accent,
  });
  return g;
}

/** IEC-style zigzag resistor */
function resistor(app: App, x: number, y: number): Group {
  const g = symbolPad(app, SYMBOL_SIZE, SYMBOL_SIZE, symbolAccent('resistor'));
  g.x = x;
  g.y = y;
  const mid = SYMBOL_SIZE / 2;
  const pts = [
    4, mid,
    10, mid,
    14, mid - 10,
    20, mid + 10,
    26, mid - 10,
    32, mid + 10,
    38, mid,
    44, mid,
  ];
  g.add(
    app.polyline({
      points: pts,
      fill: null,
      stroke: schematicStroke(),
      strokeWidth: 2.25,
      lineCap: 'round',
      lineJoin: 'round',
      listening: false,
    })
  );
  return g;
}

/** Parallel-plate capacitor */
function capacitor(app: App, x: number, y: number): Group {
  const g = symbolPad(app, SYMBOL_SIZE, SYMBOL_SIZE);
  g.x = x;
  g.y = y;
  const mid = SYMBOL_SIZE / 2;
  g.add(app.line({ x: 4, y: mid, x2: 16, y2: 0, stroke: schematicStroke(), strokeWidth: 2, lineCap: 'round', listening: false }));
  g.add(app.line({ x: 18, y: 10, x2: 0, y2: 28, stroke: schematicStroke(), strokeWidth: 2.75, lineCap: 'round', listening: false }));
  g.add(app.line({ x: 26, y: 10, x2: 0, y2: 28, stroke: schematicStroke(), strokeWidth: 2.75, lineCap: 'round', listening: false }));
  g.add(app.line({ x: 28, y: mid, x2: 16, y2: 0, stroke: schematicStroke(), strokeWidth: 2, lineCap: 'round', listening: false }));
  return g;
}

/** Earth / ground */
function ground(app: App, x: number, y: number): Group {
  const g = symbolPad(app, SYMBOL_SIZE, SYMBOL_SIZE, getActiveDiagram().edgeMuted);
  g.x = x;
  g.y = y;
  g.add(app.line({ x: 24, y: 6, x2: 0, y2: 14, stroke: schematicStroke(), strokeWidth: 2, lineCap: 'round', listening: false }));
  g.add(app.line({ x: 10, y: 22, x2: 28, y2: 0, stroke: schematicStroke(), strokeWidth: 2.25, lineCap: 'round', listening: false }));
  g.add(app.line({ x: 14, y: 28, x2: 20, y2: 0, stroke: schematicStroke(), strokeWidth: 2, lineCap: 'round', listening: false }));
  g.add(app.line({ x: 18, y: 34, x2: 12, y2: 0, stroke: schematicStroke(), strokeWidth: 1.75, lineCap: 'round', listening: false }));
  return g;
}

/** Battery cell (long = positive) */
function battery(app: App, x: number, y: number): Group {
  const g = symbolPad(app, SYMBOL_SIZE, SYMBOL_SIZE, symbolAccent('battery'));
  g.x = x;
  g.y = y;
  g.add(app.line({ x: 8, y: 24, x2: 8, y2: 0, stroke: schematicStroke(), strokeWidth: 2, lineCap: 'round', listening: false }));
  g.add(app.line({ x: 18, y: 12, x2: 0, y2: 24, stroke: schematicStroke(), strokeWidth: 2, lineCap: 'round', listening: false }));
  g.add(app.line({ x: 26, y: 8, x2: 0, y2: 32, stroke: getActiveDiagram().schematicBattery, strokeWidth: 3.25, lineCap: 'round', listening: false }));
  g.add(app.line({ x: 34, y: 12, x2: 0, y2: 24, stroke: schematicStroke(), strokeWidth: 2, lineCap: 'round', listening: false }));
  g.add(app.line({ x: 40, y: 24, x2: 4, y2: 0, stroke: schematicStroke(), strokeWidth: 2, lineCap: 'round', listening: false }));
  return g;
}

/** SPST switch */
function switchSymbol(app: App, x: number, y: number): Group {
  const g = symbolPad(app, SYMBOL_SIZE, SYMBOL_SIZE, symbolAccent('switch'));
  g.x = x;
  g.y = y;
  const mid = SYMBOL_SIZE / 2;
  g.add(app.line({ x: 4, y: mid, x2: 14, y2: 0, stroke: schematicStroke(), strokeWidth: 2, lineCap: 'round', listening: false }));
  g.add(app.circle({ x: 16, y: mid, radius: 2.75, fill: getActiveDiagram().schematicSwitch, listening: false }));
  g.add(
    app.line({
      x: 16,
      y: mid,
      x2: 14,
      y2: -12,
      stroke: getActiveDiagram().schematicSwitch,
      strokeWidth: 2.25,
      lineCap: 'round',
      listening: false,
    })
  );
  g.add(app.circle({ x: 34, y: mid, radius: 2.75, fill: null, stroke: schematicStroke(), strokeWidth: 1.75, listening: false }));
  g.add(app.line({ x: 36, y: mid, x2: 8, y2: 0, stroke: schematicStroke(), strokeWidth: 2, lineCap: 'round', listening: false }));
  return g;
}

/** LED (diode triangle + emission arrows) */
function led(app: App, x: number, y: number): Group {
  const g = symbolPad(app, SYMBOL_SIZE, SYMBOL_SIZE, symbolAccent('led'));
  g.x = x;
  g.y = y;
  const mid = SYMBOL_SIZE / 2;
  g.add(app.line({ x: 4, y: mid, x2: 12, y2: 0, stroke: schematicStroke(), strokeWidth: 2, lineCap: 'round', listening: false }));
  g.add(
    app.polygon({
      points: [14, mid - 9, 32, mid, 14, mid + 9],
      fill: getActiveDiagram().schematicLedFill,
      stroke: getActiveDiagram().schematicLedStroke,
      strokeWidth: getActiveDiagram().stroke.node,
      listening: false,
    })
  );
  g.add(app.line({ x: 32, y: mid - 10, x2: 0, y2: 20, stroke: getActiveDiagram().schematicLedStroke, strokeWidth: 2, listening: false }));
  g.add(app.line({ x: 34, y: mid, x2: 10, y2: 0, stroke: schematicStroke(), strokeWidth: 2, lineCap: 'round', listening: false }));
  // Emission arrows
  g.add(
    app.line({
      x: 28,
      y: mid - 14,
      x2: 8,
      y2: -6,
      stroke: getActiveDiagram().schematicLedStroke,
      strokeWidth: 1.4,
      lineCap: 'round',
      listening: false,
    })
  );
  g.add(
    app.line({
      x: 34,
      y: mid - 12,
      x2: 6,
      y2: -6,
      stroke: getActiveDiagram().schematicLedStroke,
      strokeWidth: 1.4,
      lineCap: 'round',
      listening: false,
    })
  );
  return g;
}

const SYMBOL_FACTORIES: Record<
  SchematicComponent['type'],
  (app: App, x: number, y: number) => Group
> = {
  resistor,
  capacitor,
  ground,
  battery,
  switch: switchSymbol,
  led,
  wire: (app, x, y) => {
    const g = app.group({ x, y });
    g.add(
      app.line({
        x: 0,
        y: 0,
        x2: 48,
        y2: 0,
        stroke: getActiveDiagram().schematicWireGlow,
        strokeWidth: 5,
        lineCap: 'round',
        opacity: 0.55,
        listening: false,
      })
    );
    g.add(
      app.line({
        x: 0,
        y: 0,
        x2: 48,
        y2: 0,
        stroke: getActiveDiagram().schematicWire,
        strokeWidth: 2.25,
        lineCap: 'round',
        listening: false,
      })
    );
    return g;
  },
};

/** Create an electrical schematic symbol */
export function createSymbol(
  app: App,
  type: SchematicComponent['type'],
  x: number,
  y: number,
  label?: string
): Group {
  const factory = SYMBOL_FACTORIES[type] ?? SYMBOL_FACTORIES.resistor;
  const g = factory(app, x, y);
  g.metadata = { symbolType: type };
  if (label) {
    g.add(
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
  return g;
}

function centerLabelX(label: string, boxWidth: number): number {
  const approx = label.length * getActiveDiagram().fontSize.sm * 0.55;
  return Math.max(0, (boxWidth - approx) / 2);
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
      type: c.metadata.symbolType as SchematicComponent['type'],
      x: c.x,
      y: c.y,
    }));
  layoutSchematicWires(app, wireLayer, comps);
  root.markDirty();
}

function layoutSchematicWires(
  app: App,
  wireLayer: Group,
  components: Array<{ type: SchematicComponent['type']; x: number; y: number }>
): void {
  const sorted = [...components].sort((a, b) => a.x - b.x);
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (a.type === 'wire' || b.type === 'wire') continue;
    const y1 = a.y + SYMBOL_SIZE / 2;
    const y2 = b.y + SYMBOL_SIZE / 2;
    const x1 = a.x + SYMBOL_SIZE;
    const x2 = b.x;
    if (x2 <= x1 && Math.abs(y2 - y1) < 1) continue;
    // Orthogonal flexible wire when components are offset vertically
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

export const Symbols = {
  resistor,
  capacitor,
  ground,
  battery,
  switch: switchSymbol,
  led,
  create: createSymbol,
  build: buildSchematic,
};
