/**
 * Network module integrity — kinds ↔ kindMeta ↔ aliases stay consistent.
 */
import { describe, it, expect } from 'vitest';
import {
  NETWORK_ALIASES,
  NETWORK_KIND_META,
  resolveNetworkIconKind,
  listNetworkIconKinds,
  slugNetworkType,
} from '../../../src/diagram/network';
import type { NetworkIconKind } from '../../../src/diagram/network';

describe('Network module structure', () => {
  it('has kindMeta for every listed catalog kind', () => {
    for (const meta of listNetworkIconKinds()) {
      expect(NETWORK_KIND_META[meta.kind], meta.kind).toBeTruthy();
      expect(meta.label.length).toBeGreaterThan(0);
      expect(meta.category.length).toBeGreaterThan(0);
    }
  });

  it('includes default fallback in kindMeta', () => {
    expect(NETWORK_KIND_META.default).toBeTruthy();
  });

  it('points aliases at kinds that exist in kindMeta', () => {
    const kinds = new Set(Object.keys(NETWORK_KIND_META));
    const bad: string[] = [];
    for (const [alias, target] of Object.entries(NETWORK_ALIASES)) {
      if (!kinds.has(target)) bad.push(`${alias} → ${target}`);
    }
    expect(bad, `aliases pointing outside kindMeta: ${bad.join(', ')}`).toEqual([]);
  });

  it('resolves each canonical kind to itself via slug', () => {
    for (const kind of Object.keys(NETWORK_KIND_META) as NetworkIconKind[]) {
      if (kind === 'default') continue;
      expect(resolveNetworkIconKind(kind)).toBe(kind);
      expect(resolveNetworkIconKind(slugNetworkType(kind))).toBe(kind);
    }
  });
});
