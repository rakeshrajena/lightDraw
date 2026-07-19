/**
 * Automotive widget registration integrity.
 */
import { describe, it, expect } from 'vitest';
import { registry, listAutomotiveWidgets } from '../../src/automotive/registry';

/** Custom overrides from `widgets/custom/` (bespoke UI beyond catalog defaults). */
const CUSTOM_WIDGETS = [
  'speedometer',
  'tachometer',
  'engineTemp',
  'calendar',
  'callScreen',
  'batteryVoltage',
  'tpms',
  'fuelGauge',
  'gearIndicator',
  'turnIndicators',
  'parkingBrake',
  'headlights',
  'cruiseControl',
  'canViewer',
  'warningLamp',
  'adasStatus',
  'instrumentCluster',
  'digitalInstrumentCluster',
] as const;

/** Panel widgets from `widgets/panels/`. */
const PANEL_WIDGETS = [
  'climateControl',
  'quickSettingsPanel',
  'compass',
  'gpsNavigationMap',
  'navigationSearch',
  'routeGuidance',
  'warningAlertPanel',
  'nowPlaying',
  'mediaPlayer',
  'musicControls',
  'albumArt',
  'fmRadio',
  'podcastPlayer',
  'notificationCenter',
  'rearViewCamera',
  'sunriseSunset',
] as const;

describe('Automotive widgets structure', () => {
  it('registers every custom override widget', () => {
    const missing = CUSTOM_WIDGETS.filter((id) => !(id in registry));
    expect(missing, `missing custom: ${missing.join(', ')}`).toEqual([]);
  });

  it('registers every panel widget', () => {
    const missing = PANEL_WIDGETS.filter((id) => !(id in registry));
    expect(missing, `missing panels: ${missing.join(', ')}`).toEqual([]);
  });

  it('lists a large combined catalog', () => {
    expect(listAutomotiveWidgets().length).toBeGreaterThan(40);
  });
});
