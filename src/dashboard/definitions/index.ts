/**
 * Dashboard widget registrations (non-chart) + chart registerAll side-effect.
 * @see docs/repo-modularity.md
 */
import '../charts/registerAll';

import './gauges';
import './indicators';
import './calendar';
import './clock';
import './chartPanel';

export { animateLiveValue, setLiveValue, dashboardToJSON } from '../helpers';
export { CHART_TYPES } from '../charts/registerAll';
