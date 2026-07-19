/**
 * Pipeline module integrity — catalog ↔ familyMap ↔ drawers stay in sync.
 */
import { describe, it, expect } from 'vitest';
import {
  PIPELINE_CATALOG,
  PIPELINE_FAMILY,
  PIPELINE_ALIASES,
  ENV_MARK,
  SYSTEM_MARK,
} from '../../../src/diagram/pipeline';
import { PIPELINE_DRAWERS } from '../../../src/diagram/pipeline/drawers';

/** Families dispatched via ENV_MARK / SYSTEM_MARK, not PIPELINE_DRAWERS. */
const MARK_FAMILIES = new Set(['env', 'system']);

describe('Pipeline module structure', () => {
  it('has unique catalog kinds', () => {
    const kinds = PIPELINE_CATALOG.map(([k]) => k);
    expect(new Set(kinds).size).toBe(kinds.length);
  });

  it('maps every catalog kind to a glyph family', () => {
    const missing: string[] = [];
    for (const [kind] of PIPELINE_CATALOG) {
      if (!PIPELINE_FAMILY[kind]) missing.push(kind);
    }
    expect(missing, `catalog kinds missing from familyMap: ${missing.join(', ')}`).toEqual([]);
  });

  it('registers a drawer for every used family (except env/system marks)', () => {
    const used = new Set(Object.values(PIPELINE_FAMILY));
    const missing: string[] = [];
    for (const family of used) {
      if (MARK_FAMILIES.has(family)) continue;
      if (!PIPELINE_DRAWERS[family]) missing.push(family);
    }
    expect(missing, `families missing from PIPELINE_DRAWERS: ${missing.join(', ')}`).toEqual([]);
  });

  it('points aliases at catalog kinds', () => {
    const kinds = new Set(PIPELINE_CATALOG.map(([k]) => k));
    const bad: string[] = [];
    for (const [alias, target] of Object.entries(PIPELINE_ALIASES)) {
      if (!kinds.has(target)) bad.push(`${alias} → ${target}`);
    }
    expect(bad, `aliases pointing outside catalog: ${bad.join(', ')}`).toEqual([]);
  });

  it('covers env/system marks for those family kinds', () => {
    for (const [kind, family] of Object.entries(PIPELINE_FAMILY)) {
      if (family === 'env') {
        expect(ENV_MARK[kind], `ENV_MARK missing for ${kind}`).toBeTruthy();
      }
      if (family === 'system') {
        expect(SYSTEM_MARK[kind], `SYSTEM_MARK missing for ${kind}`).toBeTruthy();
      }
    }
  });
});
