/** Side-effect: register all automotive widgets (Phase 8). */
import './definitions';

export {
  registerAutomotive,
  createAutomotiveFromJSON,
  registry,
} from './registryCore';

import { registry } from './registryCore';

export function listAutomotiveWidgets(): string[] {
  return Object.keys(registry).sort();
}

export {
  animateAutoValue,
  setAutoValue,
  automotiveToJSON,
} from './helpers';

export { applyDriveState, sampleDriveFrames } from './simulation';
export type { DriveState } from './simulation';
export {
  installAutoWidgetResizeObserver,
  detachAutoWidgetResizeObserver,
  fitAutoWidgetToContainer,
} from './responsive';
export { resolveBounds, fluidFont, centerInBounds } from './layout';
export { getTheme, THEMES } from './themes';
export type { ClusterTheme, ThemePalette } from './themes';
