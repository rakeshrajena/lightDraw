/**
 * Resolve kinds, list catalog entries, look up metadata.
 */
import { SCHEMATIC_CATALOG } from './catalog';
import { SCHEMATIC_ALIASES } from './aliases';
import type { SchematicSymbolCategory, SchematicSymbolMeta } from './types';

const KIND_SET = new Set(SCHEMATIC_CATALOG.map((r) => r[0]));

export function resolveSchematicSymbolKind(input: string): string {
  const raw = String(input || '')
    .trim()
    .replace(/[\s-]+/g, '_');
  const lower = raw.toLowerCase();
  if (KIND_SET.has(raw)) return raw;
  if (SCHEMATIC_ALIASES[raw]) return SCHEMATIC_ALIASES[raw];
  if (SCHEMATIC_ALIASES[lower]) return SCHEMATIC_ALIASES[lower];
  if (KIND_SET.has(lower)) return lower;
  const camel = lower.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
  if (KIND_SET.has(camel)) return camel;
  if (SCHEMATIC_ALIASES[camel]) return SCHEMATIC_ALIASES[camel];
  return 'resistor';
}

export function listSchematicSymbols(category?: SchematicSymbolCategory): SchematicSymbolMeta[] {
  return SCHEMATIC_CATALOG.filter(([, , cat]) => !category || cat === category).map(([kind, label, cat]) => ({
    kind,
    label,
    category: cat,
  }));
}

export function listSchematicSymbolCategories(): SchematicSymbolCategory[] {
  const seen = new Set<SchematicSymbolCategory>();
  const out: SchematicSymbolCategory[] = [];
  for (const [, , cat] of SCHEMATIC_CATALOG) {
    if (!seen.has(cat)) {
      seen.add(cat);
      out.push(cat);
    }
  }
  return out;
}

export function getSchematicSymbolMeta(kind: string): SchematicSymbolMeta {
  const resolved = resolveSchematicSymbolKind(kind);
  const row = SCHEMATIC_CATALOG.find(([k]) => k === resolved);
  if (row) return { kind: row[0], label: row[1], category: row[2] };
  return { kind: resolved, label: resolved, category: 'misc' };
}
