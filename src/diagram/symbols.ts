import type { App } from '../App';
import type { Group } from '../shapes/Group';
import type { SchematicComponent } from './types';
import { addCardChrome } from './chrome';
import { getActiveDiagram } from './theme';

const SYMBOL_SIZE = 44;

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

/** Draw a resistor (zigzag) */
function resistor(app: App, x: number, y: number): Group {
  const g = symbolPad(app, SYMBOL_SIZE, SYMBOL_SIZE, symbolAccent('resistor'));
  g.x = x;
  g.y = y;
  const pts = [4, 22, 12, 8, 20, 36, 28, 8, 36, 36, 40, 22];
  g.add(app.polyline({ points: pts, fill: null, stroke: schematicStroke(), strokeWidth: 2, lineCap: 'round', listening: false }));
  return g;
}

/** Draw a capacitor (two parallel plates) */
function capacitor(app: App, x: number, y: number): Group {
  const g = symbolPad(app, SYMBOL_SIZE, SYMBOL_SIZE);
  g.x = x;
  g.y = y;
  g.add(app.line({ x: 4, y: 22, x2: 16, y2: 0, stroke: schematicStroke(), strokeWidth: 2, lineCap: 'round', listening: false }));
  g.add(app.line({ x: 18, y: 10, x2: 0, y2: 24, stroke: schematicStroke(), strokeWidth: 2.5, listening: false }));
  g.add(app.line({ x: 24, y: 10, x2: 0, y2: 24, stroke: schematicStroke(), strokeWidth: 2.5, listening: false }));
  g.add(app.line({ x: 26, y: 22, x2: 16, y2: 0, stroke: schematicStroke(), strokeWidth: 2, lineCap: 'round', listening: false }));
  return g;
}

/** Draw a ground symbol */
function ground(app: App, x: number, y: number): Group {
  const g = symbolPad(app, SYMBOL_SIZE, SYMBOL_SIZE, getActiveDiagram().edgeMuted);
  g.x = x;
  g.y = y;
  g.add(app.line({ x: 22, y: 8, x2: 0, y2: 12, stroke: schematicStroke(), strokeWidth: 2, lineCap: 'round', listening: false }));
  g.add(app.line({ x: 8, y: 24, x2: 28, y2: 0, stroke: schematicStroke(), strokeWidth: 2, lineCap: 'round', listening: false }));
  g.add(app.line({ x: 14, y: 30, x2: 20, y2: 0, stroke: schematicStroke(), strokeWidth: 2, lineCap: 'round', listening: false }));
  g.add(app.line({ x: 18, y: 36, x2: 4, y2: 0, stroke: schematicStroke(), strokeWidth: 2, lineCap: 'round', listening: false }));
  return g;
}

/** Draw a battery */
function battery(app: App, x: number, y: number): Group {
  const g = symbolPad(app, SYMBOL_SIZE, SYMBOL_SIZE, symbolAccent('battery'));
  g.x = x;
  g.y = y;
  g.add(app.line({ x: 14, y: 10, x2: 0, y2: 28, stroke: schematicStroke(), strokeWidth: 2, lineCap: 'round', listening: false }));
  g.add(app.line({ x: 22, y: 6, x2: 0, y2: 32, stroke: getActiveDiagram().schematicBattery, strokeWidth: 3, lineCap: 'round', listening: false }));
  g.add(app.line({ x: 30, y: 10, x2: 0, y2: 28, stroke: schematicStroke(), strokeWidth: 2, lineCap: 'round', listening: false }));
  return g;
}

/** Draw a switch */
function switchSymbol(app: App, x: number, y: number): Group {
  const g = symbolPad(app, SYMBOL_SIZE, SYMBOL_SIZE, symbolAccent('switch'));
  g.x = x;
  g.y = y;
  g.add(app.line({ x: 4, y: 22, x2: 14, y2: 0, stroke: schematicStroke(), strokeWidth: 2, lineCap: 'round', listening: false }));
  g.add(app.line({ x: 14, y: 22, x2: 4, y2: -10, stroke: getActiveDiagram().schematicSwitch, strokeWidth: 2, lineCap: 'round', listening: false }));
  g.add(app.circle({ x: 14, y: 22, radius: 2.5, fill: getActiveDiagram().schematicSwitch, listening: false }));
  g.add(app.line({ x: 30, y: 22, x2: -12, y2: 0, stroke: schematicStroke(), strokeWidth: 2, lineCap: 'round', listening: false }));
  return g;
}

/** Draw an LED */
function led(app: App, x: number, y: number): Group {
  const g = symbolPad(app, SYMBOL_SIZE, SYMBOL_SIZE, symbolAccent('led'));
  g.x = x;
  g.y = y;
  g.add(app.line({ x: 4, y: 22, x2: 12, y2: 0, stroke: schematicStroke(), strokeWidth: 2, lineCap: 'round', listening: false }));
  g.add(
    app.polygon({
      points: [12, 14, 32, 22, 12, 30],
      fill: getActiveDiagram().schematicLedFill,
      stroke: getActiveDiagram().schematicLedStroke,
      strokeWidth: getActiveDiagram().stroke.node,
      listening: false,
    })
  );
  g.add(app.line({ x: 32, y: 22, x2: -8, y2: 0, stroke: schematicStroke(), strokeWidth: 2, lineCap: 'round', listening: false }));
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
        strokeWidth: 6,
        lineCap: 'round',
        opacity: 0.85,
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
        strokeWidth: 2.5,
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

function wireBetween(app: App, x1: number, y1: number, x2: number, y2: number): Group {
  const g = app.group({ listening: false });
  g.add(
    app.line({
      x: x1,
      y: y1,
      x2: x2,
      y2: y2,
      stroke: getActiveDiagram().schematicWireGlow,
      strokeWidth: 6,
      lineCap: 'round',
      opacity: 0.85,
      listening: false,
    })
  );
  g.add(
    app.line({
      x: x1,
      y: y1,
      x2: x2,
      y2: y2,
      stroke: getActiveDiagram().schematicWire,
      strokeWidth: 2.5,
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
  const sorted = [...components].sort((a, b) => a.x - b.x);
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (a.type === 'wire' || b.type === 'wire') continue;
    const y = a.y + SYMBOL_SIZE / 2;
    const x1 = a.x + SYMBOL_SIZE;
    const x2 = b.x;
    if (x2 > x1) {
      wireLayer.add(wireBetween(app, x1, y, x2, y));
    }
  }
  group.add(wireLayer);
  for (const comp of components) {
    const sym = createSymbol(app, comp.type, comp.x, comp.y, comp.label);
    sym.metadata.diagramId = comp.id;
    if (comp.rotation) sym.rotation = comp.rotation;
    group.add(sym);
  }
  return group;
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
