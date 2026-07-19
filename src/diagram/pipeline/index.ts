/**
 * Pipeline symbol data module (catalog + resolve).
 * Glyph drawers: `./drawers/` (Phase 2).
 *
 * @see docs/diagram-pipeline-structure.md
 */
export type {
  PipelineSymbolCategory,
  PipelineSymbolMeta,
  PipelineGlyphFamily,
  PipelineCatalogRow,
} from './types';
export { PIPELINE_GLYPH_SIZE } from './types';
export { PIPELINE_CATALOG } from './catalog';
export { PIPELINE_FAMILY, ENV_MARK, SYSTEM_MARK } from './familyMap';
export { PIPELINE_ALIASES } from './aliases';
export {
  resolvePipelineSymbolKind,
  listPipelineSymbols,
  listPipelineSymbolCategories,
  getPipelineSymbolMeta,
} from './resolve';
