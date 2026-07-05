import type { App } from '../App';
import type { Group } from '../shapes/Group';
import type { SchematicComponent } from './types';

const SYMBOL_SIZE = 40;

/** Draw a resistor (zigzag) */
function resistor(app: App, x: number, y: number): Group {
  const g = app.group({ x, y });
  const pts = [0, 20, 8, 5, 16, 35, 24, 5, 32, 35, 40, 20];
  g.add(app.polyline({ points: pts, fill: null, stroke: '#334155', strokeWidth: 2 }));
  return g;
}

/** Draw a capacitor (two parallel plates) */
function capacitor(app: App, x: number, y: number): Group {
  const g = app.group({ x, y });
  g.add(app.line({ x: 0, y: 10, x2: 15, y2: 0, stroke: '#334155', strokeWidth: 2 }));
  g.add(app.line({ x: 18, y: 0, y2: 20, stroke: '#334155', strokeWidth: 2 }));
  g.add(app.line({ x: 22, y: 0, y2: 20, stroke: '#334155', strokeWidth: 2 }));
  g.add(app.line({ x: 25, y: 10, x2: 40, y2: 0, stroke: '#334155', strokeWidth: 2 }));
  return g;
}

/** Draw a ground symbol */
function ground(app: App, x: number, y: number): Group {
  const g = app.group({ x, y });
  g.add(app.line({ x: 20, y: 0, x2: 0, y2: 10, stroke: '#334155', strokeWidth: 2 }));
  g.add(app.line({ x: 4, y: 14, x2: 32, y2: 0, stroke: '#334155', strokeWidth: 2 }));
  g.add(app.line({ x: 10, y: 18, x2: 26, y2: 0, stroke: '#334155', strokeWidth: 2 }));
  g.add(app.line({ x: 16, y: 22, x2: 20, y2: 0, stroke: '#334155', strokeWidth: 2 }));
  return g;
}

/** Draw a battery */
function battery(app: App, x: number, y: number): Group {
  const g = app.group({ x, y });
  g.add(app.line({ x: 12, y: 4, x2: 0, y2: 32, stroke: '#334155', strokeWidth: 2 }));
  g.add(app.line({ x: 18, y: 0, x2: 0, y2: 24, stroke: '#334155', strokeWidth: 3 }));
  g.add(app.line({ x: 24, y: 4, x2: 0, y2: 32, stroke: '#334155', strokeWidth: 2 }));
  return g;
}

/** Draw a switch */
function switchSymbol(app: App, x: number, y: number): Group {
  const g = app.group({ x, y });
  g.add(app.line({ x: 0, y: 10, x2: 12, y2: 0, stroke: '#334155', strokeWidth: 2 }));
  g.add(app.line({ x: 12, y: 0, x2: 8, y2: -8, stroke: '#334155', strokeWidth: 2 }));
  g.add(app.circle({ x: 12, y: 8, radius: 2, fill: '#334155' }));
  g.add(app.line({ x: 28, y: 10, x2: -16, y2: 0, stroke: '#334155', strokeWidth: 2 }));
  return g;
}

/** Draw an LED */
function led(app: App, x: number, y: number): Group {
  const g = app.group({ x, y });
  g.add(app.line({ x: 0, y: 10, x2: 10, y2: 0, stroke: '#334155', strokeWidth: 2 }));
  g.add(
    app.polygon({
      points: [10, 0, 30, 10, 10, 20],
      fill: '#fef08a',
      stroke: '#ca8a04',
      strokeWidth: 1,
    })
  );
  g.add(app.line({ x: 30, y: 10, x2: -20, y2: 0, stroke: '#334155', strokeWidth: 2 }));
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
    g.add(app.line({ x: 0, y: 0, x2: 40, y2: 0, stroke: '#334155', strokeWidth: 2 }));
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
    g.add(app.text({ text: label, x: 0, y: SYMBOL_SIZE + 4, fontSize: 10, fill: '#64748b' }));
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
