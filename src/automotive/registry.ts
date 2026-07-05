/** Side-effect: register all automotive widgets (Phase 8). */
import './definitions';

export {
  registerAutomotive,
  createAutomotiveFromJSON,
  registry,
} from './registryCore';

export {
  animateAutoValue,
  setAutoValue,
  automotiveToJSON,
} from './helpers';

export { applyDriveState, sampleDriveFrames } from './simulation';
export type { DriveState } from './simulation';
export { getTheme, THEMES } from './themes';
export type { ClusterTheme, ThemePalette } from './themes';
