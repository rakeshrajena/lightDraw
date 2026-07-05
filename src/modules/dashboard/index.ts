import type { Plugin, LightDrawStatic } from '../../types';
import { registerJSONResolver } from '../../registry/jsonResolvers';
import {
  registerDashboard,
  createDashboardFromJSON,
} from '../../dashboard/registryCore';

import '../../dashboard/definitions';

export const dashboardPlugin: Plugin = {
  name: 'lightdraw-dashboard',
  version: '1.0.0',
  install(LD: LightDrawStatic) {
    registerJSONResolver((type, props, app) => createDashboardFromJSON(type, props, app));
    (LD as LightDrawStatic & { registerDashboard: typeof registerDashboard }).registerDashboard =
      registerDashboard;
  },
};

export { registerDashboard, createDashboardFromJSON };
export { animateLiveValue, setLiveValue, dashboardToJSON } from '../../dashboard/helpers';
export default dashboardPlugin;
