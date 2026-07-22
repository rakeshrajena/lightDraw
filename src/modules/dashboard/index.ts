import type { Plugin, LightDrawStatic } from '../../types';
import { registerJSONResolver } from '../../registry/jsonResolvers';
import {
  registerDashboard,
  createDashboardFromJSON,
} from '../../dashboard/registryCore';

import '../../dashboard/definitions';

export const dashboardPlugin: Plugin = {
  name: 'lightdraw-dashboard',
  version: '1.2.1',
  install(LD: LightDrawStatic) {
    registerJSONResolver((type, props, app) => createDashboardFromJSON(type, props, app));
    (LD as LightDrawStatic & { registerDashboard: typeof registerDashboard }).registerDashboard =
      registerDashboard;
  },
};

export { registerDashboard, createDashboardFromJSON };
export { animateLiveValue, setLiveValue, dashboardToJSON } from '../../dashboard/helpers';
export { updateChartProps, pushChartValue, pushChartOhlc } from '../../dashboard/charts/core/refresh';
export {
  installChartResizeObserver,
  detachChartResizeObserver,
} from '../../dashboard/charts/core/responsive';
export {
  DASHBOARD,
  resolveDashboardTheme,
  getActiveDashboard,
  getDashboardTheme,
  syncActiveDashboardTheme,
  runWithDashboardTheme,
  refreshDashboard,
} from '../../dashboard/theme';
export type { DashboardTheme } from '../../dashboard/theme';
export {
  resolveValueColor,
  resolveSemanticColor,
  readColorStops,
  readDialZones,
  normalizeDialZones,
} from '../../dashboard/colorStops';
export type { ValueColorStop, DialZoneInput } from '../../dashboard/colorStops';
export default dashboardPlugin;
