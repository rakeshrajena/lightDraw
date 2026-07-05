import type { Plugin, LightDrawStatic } from '../../types';
import { registerJSONResolver } from '../../registry/jsonResolvers';
import {
  registerComponent,
  createComponentFromJSON,
} from '../../components/registry';

export const uiPlugin: Plugin = {
  name: 'lightdraw-ui',
  version: '1.0.0',
  install(LD: LightDrawStatic) {
    registerJSONResolver((type, props, app) => createComponentFromJSON(type, props, app));
    (LD as LightDrawStatic & { registerComponent: typeof registerComponent }).registerComponent =
      registerComponent;
  },
};

export { registerComponent, createComponentFromJSON };
export default uiPlugin;
