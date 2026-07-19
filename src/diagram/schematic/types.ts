/**
 * Schematic symbol shared types.
 */
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

export type SchematicCatalogRow = [string, string, SchematicSymbolCategory];

/** Local glyph canvas size (px). */
export const SCHEMATIC_GLYPH_SIZE = 48;
