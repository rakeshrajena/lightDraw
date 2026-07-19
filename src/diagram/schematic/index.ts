/**
 * Schematic symbol module — catalog data + glyph drawers.
 * @see docs/diagram-pipeline-structure.md (same pattern)
 */
export type { SchematicSymbolCategory, SchematicSymbolKind, SchematicSymbolMeta, SchematicCatalogRow } from './types';
export { SCHEMATIC_GLYPH_SIZE } from './types';
export { SCHEMATIC_CATALOG } from './catalog';
export { SCHEMATIC_ALIASES } from './aliases';
export {
  resolveSchematicSymbolKind,
  listSchematicSymbols,
  listSchematicSymbolCategories,
  getSchematicSymbolMeta,
} from './resolve';
export { drawSchematicGlyph } from './drawers';
