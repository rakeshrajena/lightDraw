/** Automotive widget catalog for demos — all registered types. */
window.LD_AUTO_WIDGET_CATALOG = [
  'absStatus', 'accelerationTimer', 'adaptiveCruiseControl', 'adasStatus', 'airQualityIndex', 'airbagStatus',
  'albumArt', 'altimeter', 'ambientLightingControl', 'androidAuto', 'appleCarPlay', 'autoHoldStatus',
  'automaticEmergencyBraking', 'averageFuelEconomy', 'awdFourWdStatus', 'batteryLevel', 'batteryVoltage',
  'blindSpotMonitoring', 'bluetoothStatus', 'brakeFluidStatus', 'brakePressure', 'brakeWearStatus', 'cabinTemperature',
  'calendar', 'callScreen', 'cameraFeedWidget', 'canBusSignalMonitor', 'canViewer', 'chargingHistory', 'chargingPower',
  'chargingStationFinder', 'chargingStatus', 'chargingTimer', 'climateControl', 'compass', 'compassHeading', 'contacts',
  'coolantTemperature', 'cruiseControl', 'cruiseControlStatus', 'customWidgetPanel', 'dateDisplay', 'diagnosticTroubleCodes',
  'differentialLock', 'digitalClock', 'digitalInstrumentCluster', 'doorOpenStatus', 'driveModeIndicator', 'driveRecorder',
  'driverProfile', 'electronicStabilityControl', 'energyConsumption', 'engineLoad', 'engineTemp', 'engineTemperature',
  'equalizer', 'eta', 'evRemainingRange', 'fanSpeed', 'favoriteDestinations', 'findMyVehicle', 'fogLightStatus',
  'forwardCollisionWarning', 'fuelEconomy', 'fuelGauge', 'gForceMeter', 'gearIndicator', 'gearPositionIndicator',
  'gpsNavigationMap', 'hazardLights', 'headlightStatus', 'headlights', 'highBeamStatus', 'hoodOpenStatus', 'horsepowerMeter',
  'hvacStatus', 'instantFuelEconomy', 'instrumentCluster', 'laneDepartureWarning', 'laneKeepAssist', 'lapTimer',
  'maintenanceSchedule', 'mediaPlayer', 'messages', 'microphoneStatus', 'mobileNetworkSignal', 'musicControls',
  'navigationSearch', 'notificationCenter', 'nowPlaying', 'odometer', 'oilPressure', 'oilTemperature', 'outsideTemperature',
  'parkingAssist', 'parkingBrake', 'parkingBrakeStatus', 'parkingSensorDisplay', 'performanceTimer', 'phoneStatus',
  'pitchRollIndicator', 'podcastPlayer', 'powerMeter', 'quickSettingsPanel', 'radio', 'rainSensor', 'rearViewCamera',
  'regenerativeBrakingMeter', 'remainingFuelRange', 'remoteClimateControl', 'remoteHornLights', 'remoteLockUnlock',
  'remoteStart', 'routeGuidance', 'seatBeltStatus', 'seatHeating', 'seatVentilation', 'sensorDashboard', 'serviceReminder',
  'speedLimitRecognition', 'speedometer', 'splitScreenView', 'stateOfCharge', 'stateOfHealth', 'statusIndicatorIcons',
  'steeringAngle', 'steeringWheelHeater', 'sunriseSunset', 'surroundViewCamera', 'suspensionHeight', 'suspensionMode',
  'tachometer', 'throttlePosition', 'tirePressureMonitoring', 'tireTemperature', 'torqueMeter', 'towAssist', 'tpms',
  'tractionControl', 'trafficInformation', 'trailerMode', 'tripMeter', 'trunkTailgateStatus', 'turboBoostGauge',
  'turnByTurnNavigation', 'turnIndicator', 'turnIndicators', 'usbStatus', 'userLogin', 'vehicleAnimation',
  'vehicleCanLogger', 'vehicleHealthMonitor', 'vehicleLocation', 'voiceAssistant', 'volumeControl', 'warningAlertPanel',
  'warningLamp', 'washerFluidLevel', 'weatherWidget', 'wifiStatus', 'windowStatus', 'wiperStatus', 'yawRate',
];

const DIAL_TYPES = new Set([
  'speedometer', 'tachometer', 'turboBoostGauge', 'torqueMeter', 'horsepowerMeter', 'engineLoad', 'throttlePosition',
  'brakePressure', 'steeringAngle', 'yawRate', 'altimeter', 'oilPressure', 'powerMeter', 'gForceMeter', 'engineTemp',
]);

const DIGITAL_NUMERIC_TYPES = new Set([
  'digitalClock', 'dateDisplay', 'odometer', 'tripMeter', 'eta', 'lapTimer', 'accelerationTimer', 'performanceTimer',
  'compassHeading', 'outsideTemperature', 'cabinTemperature', 'evRemainingRange', 'remainingFuelRange',
]);

const BAR_TYPES = new Set([
  'fuelGauge', 'batteryLevel', 'stateOfCharge', 'stateOfHealth', 'energyConsumption', 'regenerativeBrakingMeter',
  'fanSpeed', 'seatHeating', 'seatVentilation', 'volumeControl', 'chargingPower', 'suspensionHeight', 'washerFluidLevel',
  'brakeWearStatus', 'brakeFluidStatus',
]);

const BOOL_TYPES = new Set([
  'parkingBrake', 'parkingBrakeStatus', 'headlights', 'headlightStatus', 'highBeamStatus', 'fogLightStatus', 'hazardLights',
  'absStatus', 'electronicStabilityControl', 'tractionControl', 'airbagStatus', 'seatBeltStatus', 'doorOpenStatus',
  'hoodOpenStatus', 'trunkTailgateStatus', 'windowStatus', 'wiperStatus', 'rainSensor', 'autoHoldStatus', 'awdFourWdStatus',
  'differentialLock', 'trailerMode', 'towAssist', 'laneKeepAssist', 'laneDepartureWarning', 'blindSpotMonitoring',
  'forwardCollisionWarning', 'automaticEmergencyBraking', 'parkingAssist', 'driveModeIndicator', 'steeringWheelHeater',
]);

const COMPACT_TYPES = new Set([
  'gearIndicator', 'gearPositionIndicator', 'turnIndicators', 'turnIndicator', 'cruiseControl', 'cruiseControlStatus',
  'warningLamp', 'adasStatus', 'batteryVoltage',
]);

/** Props sized to fill a gallery card or cluster slot. */
window.ldAutoProps = function ldAutoProps(type, w, h) {
  const width = Math.max(72, Math.floor(w));
  const height = Math.max(56, Math.floor(h));
  const base = { x: 0, y: 0, width, height };

  if (type === 'instrumentCluster') {
    return {
      ...base,
      theme: 'classic',
      display: 'analog',
      speed: 72,
      rpm: 3200,
      fuel: 62,
      engineTemp: 88,
      batteryVoltage: 12.4,
      tpms: [32, 31, 33, 30],
      gear: 'D',
    };
  }
  if (type === 'digitalInstrumentCluster') {
    return {
      ...base,
      theme: 'digital',
      display: 'digital',
      speed: 55,
      rpm: 2800,
      fuel: 62,
      engineTemp: 88,
      batteryVoltage: 12.4,
      tpms: [32, 31, 33, 30],
      gear: 'D',
    };
  }
  if (type === 'tpms' || type === 'tirePressureMonitoring') {
    return { ...base, width: Math.min(width, 180), height: Math.min(height, 110), pressures: [32, 31, 22, 33], lowThreshold: 25 };
  }
  if (type === 'canViewer' || type === 'canBusSignalMonitor') {
    const rows = Math.max(3, Math.min(6, Math.floor((height - 12) / 16)));
    return {
      ...base,
      signals: { 'engine.rpm': 2400, 'vehicle.speed': 65, 'battery.voltage': 12.4, 'coolant.temp': 92 },
      maxRows: rows,
    };
  }
  if (type === 'turnIndicators' || type === 'turnIndicator') {
    return { ...base, width: Math.min(width, 72), height: Math.min(height, 36), left: true, right: false };
  }
  if (type === 'gearIndicator' || type === 'gearPositionIndicator') {
    return { ...base, width: Math.min(width, 64), height: Math.min(height, 68), gear: 'D', theme: 'digital' };
  }
  if (type === 'cruiseControl' || type === 'cruiseControlStatus') {
    return { ...base, width: Math.min(width, 96), height: Math.min(height, 36), speed: 65, active: true };
  }
  if (type === 'adasStatus') return { ...base, width: Math.min(width, 120), height: Math.min(height, 32), status: 'active' };
  if (type === 'warningLamp') return { ...base, width: Math.min(width, 40), height: Math.min(height, 40), label: 'ABS', active: true };
  if (type === 'batteryVoltage') return { ...base, width: Math.min(width, 110), height: Math.min(height, 40), value: 12.4 };
  if (type === 'digitalClock') {
    return { ...base, theme: 'digital', display: 'digital', text: '14:32', value: 0 };
  }
  if (type === 'dateDisplay') {
    return { ...base, theme: 'digital', display: 'digital', text: 'Mon 6 Jul', value: 0 };
  }
  if (type === 'odometer') {
    return { ...base, theme: 'digital', display: 'digital', value: 48216, unit: ' km' };
  }
  if (type === 'tripMeter') {
    return { ...base, theme: 'digital', display: 'digital', value: 128.4, unit: ' km', decimals: 1 };
  }
  if (DIAL_TYPES.has(type)) {
    const size = Math.min(width, height);
    const useDigital = size < 110;
    return {
      ...base,
      value: type === 'tachometer' ? 3200 : type === 'speedometer' ? 72 : 42,
      size,
      display: useDigital ? 'digital' : 'analog',
      theme: useDigital ? 'digital' : 'classic',
    };
  }
  if (DIGITAL_NUMERIC_TYPES.has(type)) {
    return { ...base, theme: 'digital', display: 'digital', value: 42 };
  }
  if (BAR_TYPES.has(type)) return { ...base, value: 68 };
  if (BOOL_TYPES.has(type)) {
    const side = Math.min(width, height, 40);
    return { ...base, width: side, height: side, active: true };
  }
  if (COMPACT_TYPES.has(type)) return base;
  return base;
};

/** Prefer live registry list when the full bundle is loaded. */
function syncAutoCatalog() {
  if (typeof window !== 'undefined' && window.LightDraw?.listAutomotiveWidgets) {
    const live = window.LightDraw.listAutomotiveWidgets();
    if (live?.length) window.LD_AUTO_WIDGET_CATALOG = live;
  }
}
window.syncAutoCatalog = syncAutoCatalog;
syncAutoCatalog();
