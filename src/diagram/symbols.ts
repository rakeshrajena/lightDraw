import type { App } from '../App';
import type { Group } from '../shapes/Group';
import type { SchematicComponent } from './types';
import { DIAGRAM } from './theme';

const SYMBOL_SIZE = 44;
const STROKE = DIAGRAM.schematicStroke;

function symbolPad(app: App, w: number, h: number): Group {
  const g = app.group();
  g.add(
    app.roundedRect({
      width: w,
      height: h,
      cornerRadius: DIAGRAM.radii.sm,
      fill: DIAGRAM.schematicFill,
      stroke: DIAGRAM.labelPillStroke,
      strokeWidth: 1,
      shadow: DIAGRAM.shadowSoft,
      listening: false,
    })
  );
  return g;
}

/** Draw a resistor (zigzag) */
function resistor(app: App, x: number, y: number): Group {
  const g = symbolPad(app, SYMBOL_SIZE, SYMBOL_SIZE);
  g.x = x;
  g.y = y;
  const pts = [4, 22, 12, 8, 20, 36, 28, 8, 36, 36, 40, 22];
  g.add(app.polyline({ points: pts, fill: null, stroke: STROKE, strokeWidth: 2, lineCap: 'round', listening: false }));
  return g;
}

/** Draw a capacitor (two parallel plates) */
function capacitor(app: App, x: number, y: number): Group {
  const g = symbolPad(app, SYMBOL_SIZE, SYMBOL_SIZE);
  g.x = x;
  g.y = y;
  g.add(app.line({ x: 4, y: 22, x2: 16, y2: 0, stroke: STROKE, strokeWidth: 2, lineCap: 'round', listening: false }));
  g.add(app.line({ x: 18, y: 10, x2: 0, y2: 24, stroke: STROKE, strokeWidth: 2.5, listening: false }));
  g.add(app.line({ x: 24, y: 10, x2: 0, y2: 24, stroke: STROKE, strokeWidth: 2.5, listening: false }));
  g.add(app.line({ x: 26, y: 22, x2: 16, y2: 0, stroke: STROKE, strokeWidth: 2, lineCap: 'round', listening: false }));
  return g;
}

/** Draw a ground symbol */
function ground(app: App, x: number, y: number): Group {
  const g = symbolPad(app, SYMBOL_SIZE, SYMBOL_SIZE);
  g.x = x;
  g.y = y;
  g.add(app.line({ x: 22, y: 8, x2: 0, y2: 12, stroke: STROKE, strokeWidth: 2, lineCap: 'round', listening: false }));
  g.add(app.line({ x: 8, y: 24, x2: 28, y2: 0, stroke: STROKE, strokeWidth: 2, lineCap: 'round', listening: false }));
  g.add(app.line({ x: 14, y: 30, x2: 20, y2: 0, stroke: STROKE, strokeWidth: 2, lineCap: 'round', listening: false }));
  g.add(app.line({ x: 18, y: 36, x2: 4, y2: 0, stroke: STROKE, strokeWidth: 2, lineCap: 'round', listening: false }));
  return g;
}

/** Draw a battery */
function battery(app: App, x: number, y: number): Group {
  const g = symbolPad(app, SYMBOL_SIZE, SYMBOL_SIZE);
  g.x = x;
  g.y = y;
  g.add(app.line({ x: 14, y: 10, x2: 0, y2: 28, stroke: STROKE, strokeWidth: 2, lineCap: 'round', listening: false }));
  g.add(app.line({ x: 22, y: 6, x2: 0, y2: 32, stroke: STROKE, strokeWidth: 3, lineCap: 'round', listening: false }));
  g.add(app.line({ x: 30, y: 10, x2: 0, y2: 28, stroke: STROKE, strokeWidth: 2, lineCap: 'round', listening: false }));
  return g;
}

/** Draw a switch */
function switchSymbol(app: App, x: number, y: number): Group {
  const g = symbolPad(app, SYMBOL_SIZE, SYMBOL_SIZE);
  g.x = x;
  g.y = y;
  g.add(app.line({ x: 4, y: 22, x2: 14, y2: 0, stroke: STROKE, strokeWidth: 2, lineCap: 'round', listening: false }));
  g.add(app.line({ x: 14, y: 22, x2: 4, y2: -10, stroke: STROKE, strokeWidth: 2, lineCap: 'round', listening: false }));
  g.add(app.circle({ x: 14, y: 22, radius: 2.5, fill: STROKE, listening: false }));
  g.add(app.line({ x: 30, y: 22, x2: -12, y2: 0, stroke: STROKE, strokeWidth: 2, lineCap: 'round', listening: false }));
  return g;
}

/** Draw an LED */
function led(app: App, x: number, y: number): Group {
  const g = symbolPad(app, SYMBOL_SIZE, SYMBOL_SIZE);
  g.x = x;
  g.y = y;
  g.add(app.line({ x: 4, y: 22, x2: 12, y2: 0, stroke: STROKE, strokeWidth: 2, lineCap: 'round', listening: false }));
  g.add(
    app.polygon({
      points: [12, 14, 32, 22, 12, 30],
      fill: DIAGRAM.schematicLedFill,
      stroke: DIAGRAM.schematicLedStroke,
      strokeWidth: 1.5,
      listening: false,
    })
  );
  g.add(app.line({ x: 32, y: 22, x2: -8, y2: 0, stroke: STROKE, strokeWidth: 2, lineCap: 'round', listening: false }));
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
        stroke: STROKE,
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
        x: 0,
        y: SYMBOL_SIZE + 6,
        fontSize: DIAGRAM.fontSize.sm,
        fontFamily: DIAGRAM.fontFamily,
        fill: DIAGRAM.schematicLabel,
        listening: false,
      })
    );
  }
  return g;
}

/** Build a schematic from component list */
export function buildSchematic(app: App, components: SchematicComponent[]): Group {
  const group = app.group({ name: 'schematic' });
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
