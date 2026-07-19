/**
 * Diagram builder — schematic.
 */
import type { App } from '../../App';
import type { Group } from '../../shapes/Group';
import type { NodeOptions } from '../../types';
import {
  createDiagramGroup,
} from '../helpers';
import { buildSchematic, createSymbol } from '../symbols';
import { listSchematicSymbols, type SchematicSymbolCategory } from '../schematicIcons';
import type { SchematicComponent } from '../types';

/** Create electrical schematic */
export function createSchematic(
  app: App,
  components: SchematicComponent[],
  options: NodeOptions = {}
): Group {
  const group = buildSchematic(app, components);
  group.metadata = {
    ...group.metadata,
    diagramType: 'electricalSchematic',
    diagramState: { ...options, components },
  };
  return group;
}

/** Grid catalog of IEC electronic schematic symbols (optional category filter). */
export function createSchematicSymbolCatalog(
  app: App,
  options: NodeOptions & { category?: SchematicSymbolCategory | string; columns?: number } = {}
): Group {
  const category = options.category as SchematicSymbolCategory | undefined;
  const kinds = listSchematicSymbols(category);
  const columns = Math.max(4, options.columns ?? 8);
  const group = createDiagramGroup(
    app,
    'schematicSymbolCatalog',
    { ...options, category },
    { name: 'schematicCatalog' }
  );
  const gapX = 120;
  const gapY = 102;
  const startX = 16;
  const startY = 12;
  kinds.forEach((meta, i) => {
    const col = i % columns;
    const row = Math.floor(i / columns);
    const node = createSymbol(app, meta.kind, startX + col * gapX, startY + row * gapY, meta.label);
    node.metadata = { ...node.metadata, diagramId: meta.kind };
    group.add(node);
  });
  return group;
}
