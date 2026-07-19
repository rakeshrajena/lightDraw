/**
 * Resolve kinds, list metadata, style helpers.
 */
import type { NetworkIconKind, NetworkIconMeta, NetworkIconStyle } from './types';
import { NETWORK_ALIASES } from './aliases';
import { NETWORK_KIND_META } from './kindMeta';
import { getActiveDiagram } from '../theme';

export function slugNetworkType(type: string): string {
  return type
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
}

/** Alias map: slug → canonical kind (covers the full requested device list). */
export function resolveNetworkIconKind(type: string): NetworkIconKind {
  const key = slugNetworkType(type);
  if (NETWORK_ALIASES[key]) return NETWORK_ALIASES[key];
  // Match canonical kind names (camelCase → snake_case via slug)
  for (const kind of Object.keys(NETWORK_KIND_META) as NetworkIconKind[]) {
    if (slugNetworkType(kind) === key) return kind;
  }
  return 'default';
}

export function getNetworkIconMeta(kind: NetworkIconKind): NetworkIconMeta {
  const m = NETWORK_KIND_META[kind] ?? NETWORK_KIND_META.default;
  return { kind, ...m };
}

/** Full catalog of canonical icons (one per kind). */
export function listNetworkIconKinds(): NetworkIconMeta[] {
  return (Object.keys(NETWORK_KIND_META) as NetworkIconKind[])
    .filter((k) => k !== 'default')
    .map((kind) => getNetworkIconMeta(kind));
}

/** All accepted type aliases (including friendly names). */
export function listNetworkTypeAliases(): string[] {
  return Object.keys(NETWORK_ALIASES).sort();
}

export function networkStyleForKind(kind: NetworkIconKind): NetworkIconStyle {
  const cat = getNetworkIconMeta(kind).category;
  const d = getActiveDiagram();
  const fromCat = d.networkCategories?.[cat];
  if (fromCat) return { ...fromCat };
  if (kind === 'router') return { ...d.networkRouter };
  if (kind === 'server' || kind === 'vm') return { ...d.networkServer };
  if (kind === 'switch' || kind === 'industrialSwitch') return { ...d.networkSwitch };
  if (kind === 'desktop' || kind === 'laptop' || kind === 'phone') return { ...d.networkClient };
  return { ...d.networkDefault };
}
