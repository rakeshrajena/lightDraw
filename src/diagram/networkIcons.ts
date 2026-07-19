/**
 * Network topology icon public façade.
 * Implementation: `./network/`
 */
export type {
  NetworkIconKind,
  NetworkIconCategory,
  NetworkIconMeta,
  NetworkIconStyle,
} from './network';
export {
  slugNetworkType,
  resolveNetworkIconKind,
  getNetworkIconMeta,
  listNetworkIconKinds,
  listNetworkTypeAliases,
  networkStyleForKind,
  drawNetworkIcon,
  __networkAliasCount,
} from './network';
