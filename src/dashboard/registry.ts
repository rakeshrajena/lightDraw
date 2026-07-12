export {
  registerDashboard,
  createDashboardFromJSON,
  registry,
} from './registryCore';

export {
  animateLiveValue,
  setLiveValue,
  dashboardToJSON,
} from './helpers';

export { updateChartProps, pushChartValue, pushChartOhlc } from './charts/core/refresh';
export {
  installChartResizeObserver,
  detachChartResizeObserver,
} from './charts/core/responsive';

export { DASHBOARD, resolveDashboardTheme, getActiveDashboard, getDashboardTheme, syncActiveDashboardTheme, runWithDashboardTheme, refreshDashboard, dashboardPackFromApp } from './theme';
export type { DashboardTheme } from './theme';

/** Side-effect: register all dashboard widgets (Phase 7). */
import './definitions';
