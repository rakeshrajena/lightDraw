import { describe, it, expect } from 'vitest';
import {
  createSchematic,
  createSchematicSymbolCatalog,
  createSymbol,
  listSchematicSymbols,
  listSchematicSymbolCategories,
  resolveSchematicSymbolKind,
  getSchematicSymbolMeta,
} from '../src/diagram/index';
import { createTestApp, createTestContainer } from './helpers';

describe('Schematic electronic symbol catalog', () => {
  it('lists a full multi-category catalog', () => {
    const all = listSchematicSymbols();
    expect(all.length).toBeGreaterThanOrEqual(150);
    const cats = listSchematicSymbolCategories();
    expect(cats).toEqual(
      expect.arrayContaining([
        'power',
        'passive',
        'diode',
        'transistor',
        'logic',
        'analog',
        'digital',
        'sensor',
        'actuator',
        'switch',
        'connector',
        'comms',
      ])
    );
    expect(listSchematicSymbols('diode').every((m) => m.category === 'diode')).toBe(true);
  });

  it('resolves legacy and alias names', () => {
    expect(resolveSchematicSymbolKind('switch')).toBe('spst');
    expect(resolveSchematicSymbolKind('op_amp')).toBe('opAmp');
    expect(resolveSchematicSymbolKind('n_channel_mosfet')).toBe('nmos');
    expect(resolveSchematicSymbolKind('ldr')).toBe('photoresistor');
    expect(getSchematicSymbolMeta('led').label).toMatch(/LED/i);
  });

  it('creates symbols for representative families without error', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'canvas' });
    const kinds = [
      'battery',
      'resistor',
      'electrolyticCap',
      'inductor',
      'transformer',
      'diode',
      'zener',
      'led',
      'npn',
      'nmos',
      'scr',
      'andGate',
      'opAmp',
      'mcu',
      'tempSensor',
      'relay',
      'spdt',
      'usbConnector',
      'i2c',
      'testPoint',
      'junction',
    ];
    for (const kind of kinds) {
      const sym = createSymbol(app, kind, 0, 0, kind);
      expect(sym.metadata.symbolType).toBe(resolveSchematicSymbolKind(kind));
      expect(sym.children.length).toBeGreaterThan(0);
    }
    app.destroy();
  });

  it('builds a mixed electronic schematic with auto-wiring', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'canvas' });
    const sch = createSchematic(app, [
      { id: 'b1', type: 'battery', x: 20, y: 40, label: 'VCC' },
      { id: 'u1', type: 'mcu', x: 120, y: 40, label: 'MCU' },
      { id: 'q1', type: 'nmos', x: 220, y: 40, label: 'Q1' },
      { id: 'd1', type: 'led', x: 320, y: 40, label: 'LED' },
      { id: 'g1', type: 'ground', x: 420, y: 40 },
    ]);
    app.add(sch);
    app.render();
    expect(sch.children.length).toBe(6); // wire layer + 5 symbols
    expect(sch.children.some((c) => c.zIndex === -10)).toBe(true);
    app.destroy();
  });

  it('renders schematic catalog grid', () => {
    const container = createTestContainer(1200, 900);
    const app = createTestApp(container, { renderer: 'canvas', width: 1200, height: 900 });
    const cat = createSchematicSymbolCatalog(app, { columns: 8, width: 1200, height: 900 });
    app.add(cat);
    app.render();
    expect(cat.children.length).toBe(listSchematicSymbols().length);
    expect(cat.metadata.diagramType).toBe('schematicSymbolCatalog');
    app.destroy();
  });
});
