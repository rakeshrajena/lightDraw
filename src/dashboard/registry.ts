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

/** Side-effect: register all dashboard widgets (Phase 7). */
import './definitions';
