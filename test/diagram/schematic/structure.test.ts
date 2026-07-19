/**
 * Schematic module integrity — catalog ↔ aliases stay consistent.
 */
import { describe, it, expect } from 'vitest';
import {
  SCHEMATIC_CATALOG,
  SCHEMATIC_ALIASES,
  resolveSchematicSymbolKind,
  listSchematicSymbols,
} from '../../../src/diagram/schematic';
import { createTestApp, createTestContainer } from '../../helpers';
import { drawSchematicGlyph } from '../../../src/diagram/schematic';

describe('Schematic module structure', () => {
  it('has unique catalog kinds', () => {
    const kinds = SCHEMATIC_CATALOG.map(([k]) => k);
    expect(new Set(kinds).size).toBe(kinds.length);
  });

  it('points aliases at catalog kinds', () => {
    const kinds = new Set(SCHEMATIC_CATALOG.map(([k]) => k));
    const bad: string[] = [];
    for (const [alias, target] of Object.entries(SCHEMATIC_ALIASES)) {
      if (!kinds.has(target)) bad.push(`${alias} → ${target}`);
    }
    expect(bad, `aliases pointing outside catalog: ${bad.join(', ')}`).toEqual([]);
  });

  it('resolve never invents kinds outside the catalog (except fallback resistor)', () => {
    const kinds = new Set(SCHEMATIC_CATALOG.map(([k]) => k));
    expect(kinds.has('resistor')).toBe(true);
    expect(resolveSchematicSymbolKind('___not_a_real_symbol___')).toBe('resistor');
    for (const [kind] of SCHEMATIC_CATALOG.slice(0, 40)) {
      expect(resolveSchematicSymbolKind(kind)).toBe(kind);
    }
  });

  it('draws every catalog kind with at least one child shape', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'canvas' });
    const missing: string[] = [];
    for (const meta of listSchematicSymbols()) {
      const g = app.group();
      drawSchematicGlyph(app, g, meta.kind);
      if (g.children.length === 0) missing.push(meta.kind);
    }
    expect(missing, `empty glyphs: ${missing.join(', ')}`).toEqual([]);
    app.destroy();
  });
});
