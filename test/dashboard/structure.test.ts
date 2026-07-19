/**
 * Dashboard widget registration integrity (non-chart widgets).
 */
import { describe, it, expect } from 'vitest';
import { registry } from '../../src/dashboard/registry';
import { CHART_TYPES } from '../../src/dashboard/charts/registerAll';

/** Factories from `dashboard/definitions/` (bespoke widgets, not chart registerAll). */
const DASHBOARD_WIDGETS = [
  'gauge',
  'speedometer',
  'legend',
  'thermometer',
  'compass',
  'calendar',
  'signalStrength',
  'knob',
  'meter',
  'battery',
  'clock',
  'chartPanel',
] as const;

describe('Dashboard definitions structure', () => {
  it('registers every non-chart dashboard widget', () => {
    const missing = DASHBOARD_WIDGETS.filter((id) => !(id in registry));
    expect(missing, `missing widgets: ${missing.join(', ')}`).toEqual([]);
  });

  it('still registers the chart catalog via registerAll', () => {
    expect(CHART_TYPES.length).toBeGreaterThanOrEqual(80);
    const missingCharts = CHART_TYPES.filter((id) => !(id in registry));
    expect(missingCharts.slice(0, 10), `sample missing charts: ${missingCharts.slice(0, 10).join(', ')}`).toEqual(
      []
    );
  });
});
