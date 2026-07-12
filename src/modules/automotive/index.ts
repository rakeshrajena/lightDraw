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
export { listAutomotiveWidgets } from '../../automotive/registry';
export {
  installAutoWidgetResizeObserver,
  detachAutoWidgetResizeObserver,
  fitAutoWidgetToContainer,
} from '../../automotive/responsive';
export { updateAutoWidgetProps, installAutoWidgetRebuild } from '../../automotive/refresh';
export { applyDriveState, sampleDriveFrames } from '../../automotive/simulation';
export { animateAutoValue, setAutoValue } from '../../automotive/helpers';
export { THEMES, getTheme, AUTOMOTIVE_THEME_PRESETS } from '../../automotive/themes';
export type { ClusterTheme, ThemePalette } from '../../automotive/themes';
export type { DriveState } from '../../automotive/simulation';
export default automotivePlugin;
