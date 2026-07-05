import type { Plugin, LightDrawStatic } from '../../types';
import { registerJSONResolver } from '../../registry/jsonResolvers';
import {
  registerAutomotive,
  createAutomotiveFromJSON,
} from '../../automotive/registryCore';

import '../../automotive/definitions';

export const automotivePlugin: Plugin = {
  name: 'lightdraw-automotive',
  version: '1.0.0',
  install(LD: LightDrawStatic) {
    registerJSONResolver((type, props, app) => createAutomotiveFromJSON(type, props, app));
    (LD as LightDrawStatic & { registerAutomotive: typeof registerAutomotive }).registerAutomotive =
      registerAutomotive;
  },
};

export { registerAutomotive, createAutomotiveFromJSON };
export { applyDriveState, sampleDriveFrames } from '../../automotive/simulation';
export { animateAutoValue, setAutoValue } from '../../automotive/helpers';
export type { DriveState } from '../../automotive/simulation';
export default automotivePlugin;
