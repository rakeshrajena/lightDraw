/** Automotive widget catalog for demos — all registered types. */
window.LD_AUTO_WIDGET_CATALOG = [
  'absStatus', 'accelerationTimer', 'adaptiveCruiseControl', 'adasStatus', 'airQualityIndex', 'airbagStatus',
  'albumArt', 'altimeter', 'ambientLightingControl', 'androidAuto', 'appleCarPlay', 'autoHoldStatus',
  'automaticEmergencyBraking', 'averageFuelEconomy', 'awdFourWdStatus', 'batteryLevel', 'batteryVoltage',
  'blindSpotMonitoring', 'bluetoothStatus', 'brakeFluidStatus', 'brakePressure', 'brakeWearStatus', 'cabinTemperature',
  'calendar', 'callScreen', 'cameraFeedWidget', 'canBusSignalMonitor', 'canViewer', 'chargingHistory', 'chargingPower',
  'chargingStationFinder', 'chargingStatus', 'chargingTimer', 'checkEngine', 'checkEngineLamp', 'climateControl', 'compass', 'compassHeading', 'contacts',
  'coolantTemperature', 'cruiseControl', 'cruiseControlStatus', 'customWidgetPanel', 'dateDisplay', 'diagnosticTroubleCodes',
  'differentialLock', 'digitalClock', 'digitalInstrumentCluster', 'doorOpenStatus', 'driveModeIndicator', 'driveRecorder',
  'driverProfile', 'electronicStabilityControl', 'energyConsumption', 'engineLoad', 'engineStatus', 'engineTemp', 'engineTemperature',
  'equalizer', 'eta', 'evRemainingRange', 'fanSpeed', 'favoriteDestinations', 'findMyVehicle', 'fogLightStatus',
  'forwardCollisionWarning', 'fuelEconomy', 'fuelGauge', 'gForceMeter', 'gearIndicator', 'gearPositionIndicator',
  'gpsNavigationMap', 'hazardLights', 'headlightStatus', 'headlights', 'highBeamStatus', 'hoodOpenStatus', 'horsepowerMeter',
  'hvacStatus', 'instantFuelEconomy', 'instrumentCluster', 'laneDepartureWarning', 'laneKeepAssist', 'lapTimer',
  'lowBeamStatus', 'maintenanceSchedule', 'mediaPlayer', 'messages', 'microphoneStatus', 'milStatus', 'mobileNetworkSignal', 'musicControls',
  'navigationSearch', 'notificationCenter', 'nowPlaying', 'odometer', 'oilPressure', 'oilTemperature', 'outsideTemperature',
  'parkingAssist', 'parkingBrake', 'parkingBrakeStatus', 'parkingLightStatus', 'parkingSensorDisplay', 'pedestrianDetection', 'performanceTimer', 'phoneStatus',
  'pitchRollIndicator', 'podcastPlayer', 'powerMeter', 'quickSettingsPanel', 'fmRadio', 'rainSensor', 'rearViewCamera',
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
  'parkingBrake', 'parkingBrakeStatus', 'headlights', 'headlightStatus', 'lowBeamStatus', 'parkingLightStatus',
  'highBeamStatus', 'fogLightStatus', 'hazardLights', 'checkEngineLamp', 'milStatus', 'checkEngine', 'engineStatus',
  'absStatus', 'electronicStabilityControl', 'tractionControl', 'airbagStatus', 'seatBeltStatus', 'doorOpenStatus',
  'hoodOpenStatus', 'trunkTailgateStatus', 'windowStatus', 'wiperStatus', 'rainSensor', 'autoHoldStatus', 'awdFourWdStatus',
  'differentialLock', 'trailerMode', 'towAssist', 'laneKeepAssist', 'laneDepartureWarning', 'blindSpotMonitoring',
  'forwardCollisionWarning', 'automaticEmergencyBraking', 'parkingAssist', 'driveModeIndicator', 'steeringWheelHeater',
]);

/** Props sized to fill a gallery card — widgets use full card width/height. */
window.ldAutoProps = function ldAutoProps(type, w, h) {
  const width = Math.max(72, Math.floor(w));
  const height = Math.max(56, Math.floor(h));
  const base = { x: 0, y: 0, width, height };

  if (type === 'tpms' || type === 'tirePressureMonitoring') {
    const aspect = 1.65;
    let tw = width;
    let th = Math.max(72, Math.round(tw / aspect));
    if (th > height) {
      th = Math.max(72, height);
      tw = Math.min(width, Math.round(th * aspect));
    }
    return {
      ...base,
      width: tw,
      height: th,
      pressures: [32, 31, 33, 30],
    };
  }
  if (type === 'instrumentCluster') {
    const aspect = 920 / 420;
    let cw = width;
    let ch = Math.round(cw / aspect);
    if (ch > height) {
      ch = height;
      cw = Math.round(ch * aspect);
    }
    return {
      ...base,
      width: Math.max(280, cw),
      height: Math.max(140, ch),
      theme: 'classic',
      display: 'analog',
      speed: 72,
      rpm: 3200,
      fuel: 62,
      engineTemp: 88,
      batteryVoltage: 12.4,
      tpms: [32, 31, 33, 30],
      gear: 'D',
      incomingCall: cw >= 520 && ch >= 240,
      caller: 'Alex Morgan',
      subtitle: 'Mobile',
      callStatus: 'incoming',
      callHint: 'Swipe to answer',
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
    return { ...base, pressures: [32, 31, 22, 33], lowThreshold: 25 };
  }
  if (type === 'canViewer' || type === 'canBusSignalMonitor') {
    const rows = Math.max(4, Math.min(8, Math.floor((height - 12) / 16)));
    return {
      ...base,
      signals: { 'engine.rpm': 2400, 'vehicle.speed': 65, 'battery.voltage': 12.4, 'coolant.temp': 92 },
      maxRows: rows,
    };
  }
  if (type === 'turnIndicators' || type === 'turnIndicator') {
    return { ...base, left: true, right: false };
  }
  if (type === 'gearIndicator' || type === 'gearPositionIndicator') {
    return { ...base, gear: 'D', theme: 'digital' };
  }
  if (type === 'cruiseControl' || type === 'cruiseControlStatus') {
    return { ...base, speed: 65, active: true };
  }
  if (type === 'adasStatus') return { ...base, status: 'active' };
  if (type === 'pedestrianDetection') return { ...base, status: 'detecting' };
  if (type === 'warningLamp') return { ...base, label: 'ABS', active: true };
  if (type === 'checkEngineLamp' || type === 'milStatus' || type === 'checkEngine' || type === 'engineStatus') {
    return { ...base, active: true };
  }
  if (type === 'batteryVoltage') return { ...base, value: 12.4 };
  if (type === 'calendar') {
    const now = new Date();
    return {
      ...base,
      year: now.getFullYear(),
      month: now.getMonth(),
      highlightDay: now.getDate(),
      lines: ['No events today'],
    };
  }
  if (type === 'callScreen') {
    return {
      ...base,
      caller: 'Alex Morgan',
      subtitle: 'Mobile',
      status: 'incoming',
      hint: 'Swipe to answer',
      lines: ['Incoming…', 'Swipe to answer'],
    };
  }
  const PANEL_PROPS = {
    climateControl: { temp: '22°C', fan: 3, mode: 'auto', lines: ['Auto', '22°C', 'Fan 3'] },
    quickSettingsPanel: {},
    compass: { heading: 45, value: 45 },
    gpsNavigationMap: { lat: 51.505, lon: -0.09, zoom: 14, useOsmTiles: true },
    navigationSearch: { query: 'Coffee near me', lat: 51.51, lon: -0.12, useOsmTiles: true },
    routeGuidance: { distance: '12.4 km', eta: '18 min', instruction: 'Turn right onto Main St', useOsmTiles: true },
    warningAlertPanel: { alerts: ['Low tire pressure — FL', 'Service due in 500 km'] },
    nowPlaying: { title: 'Midnight Drive', artist: 'Neon Wave', progress: 0.42 },
    mediaPlayer: { title: 'Midnight Drive', artist: 'Neon Wave', progress: 0.36 },
    musicControls: { playing: true },
    albumArt: { album: 'Night Roads', artist: 'Neon Wave' },
    fmRadio: {
      station: 'FM 98.5',
      frequency: '98.5',
      band: 'FM',
      stationName: 'Classic Hits',
      rds: 'Neon Wave — Midnight Drive',
      stereo: true,
      presets: ['88.1', '92.3', '98.5', '101.2'],
    },
    podcastPlayer: { show: 'Tech Drive', episode: 'Episode 12 — EV Future', progress: 0.58 },
    notificationCenter: {},
    rearViewCamera: { active: true },
    sunriseSunset: { sunrise: '06:12', sunset: '19:45', lines: ['Rise 06:12', 'Set 19:45'] },
  };
  if (type in PANEL_PROPS) {
    return { ...base, ...PANEL_PROPS[type] };
  }
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
  if (BOOL_TYPES.has(type)) return { ...base, active: true };
  return { ...base, value: 42, active: true, status: 'on', gear: 'D' };
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
