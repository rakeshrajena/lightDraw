/**
 * Resolve kinds, list catalog entries, and look up metadata.
 */
import { PIPELINE_CATALOG } from './catalog';
import { PIPELINE_ALIASES } from './aliases';
import type { PipelineSymbolCategory, PipelineSymbolMeta } from './types';

const KIND_SET = new Set(PIPELINE_CATALOG.map((r) => r[0]));

export function resolvePipelineSymbolKind(input: string): string {
  const raw = String(input || '')
    .trim()
    .replace(/[\s-]+/g, '_');
  const lower = raw.toLowerCase();
  if (KIND_SET.has(raw)) return raw;
  if (PIPELINE_ALIASES[raw]) return PIPELINE_ALIASES[raw];
  if (PIPELINE_ALIASES[lower]) return PIPELINE_ALIASES[lower];
  if (KIND_SET.has(lower)) return lower;
  const camel = lower.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
  if (KIND_SET.has(camel)) return camel;
  if (PIPELINE_ALIASES[camel]) return PIPELINE_ALIASES[camel];
  return 'process';
}

export function listPipelineSymbols(category?: PipelineSymbolCategory): PipelineSymbolMeta[] {
  return PIPELINE_CATALOG.filter(([, , cat]) => !category || cat === category).map(([kind, label, cat]) => ({
    kind,
    label,
    category: cat,
  }));
}

export function listPipelineSymbolCategories(): PipelineSymbolCategory[] {
  const seen = new Set<PipelineSymbolCategory>();
  const out: PipelineSymbolCategory[] = [];
  for (const [, , cat] of PIPELINE_CATALOG) {
    if (!seen.has(cat)) {
      seen.add(cat);
      out.push(cat);
    }
  }
  return out;
}

export function getPipelineSymbolMeta(kind: string): PipelineSymbolMeta {
  const resolved = resolvePipelineSymbolKind(kind);
  const row = PIPELINE_CATALOG.find(([k]) => k === resolved);
  if (row) return { kind: row[0], label: row[1], category: row[2] };
  return { kind: resolved, label: resolved, category: 'flow' };
}
