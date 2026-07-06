/** Declarative automotive widget catalog — drives bulk registration. */

export interface DialDef {
  kind: 'dial';
  type: string;
  max?: number;
  format?: 'int' | 'rpm' | 'percent' | 'deg';
  unit?: string;
  tickCount?: number;
  redlineFrom?: number;
}

export interface BarDef {
  kind: 'bar';
  type: string;
  label: string;
  unit?: string;
  warnBelow?: number;
}

export interface NumericDef {
  kind: 'numeric';
  type: string;
  title: string;
  unit?: string;
  decimals?: number;
}

export interface LampDef {
  kind: 'lamp';
  type: string;
  symbol: string;
}

export interface BadgeDef {
  kind: 'badge';
  type: string;
  title: string;
}

export interface PanelDef {
  kind: 'panel';
  type: string;
  title: string;
  rows?: string[];
}

export type WidgetDef = DialDef | BarDef | NumericDef | LampDef | BadgeDef | PanelDef;

export const DIAL_WIDGETS: DialDef[] = [
  { kind: 'dial', type: 'speedometer', max: 240, format: 'int', tickCount: 12, redlineFrom: 0.82 },
  { kind: 'dial', type: 'tachometer', max: 8000, format: 'rpm', tickCount: 8, redlineFrom: 0.75 },
  { kind: 'dial', type: 'turboBoostGauge', max: 30, format: 'int', unit: ' PSI' },
  { kind: 'dial', type: 'torqueMeter', max: 500, format: 'int', unit: ' Nm' },
  { kind: 'dial', type: 'horsepowerMeter', max: 600, format: 'int', unit: ' HP' },
  { kind: 'dial', type: 'engineLoad', max: 100, format: 'percent' },
  { kind: 'dial', type: 'throttlePosition', max: 100, format: 'percent' },
  { kind: 'dial', type: 'brakePressure', max: 200, format: 'int', unit: ' bar' },
  { kind: 'dial', type: 'steeringAngle', max: 540, format: 'deg' },
  { kind: 'dial', type: 'yawRate', max: 45, format: 'deg' },
  { kind: 'dial', type: 'altimeter', max: 5000, format: 'int', unit: ' m' },
  { kind: 'dial', type: 'oilPressure', max: 100, format: 'int', unit: ' PSI' },
  { kind: 'dial', type: 'powerMeter', max: 300, format: 'int', unit: ' kW' },
  { kind: 'dial', type: 'gForceMeter', max: 2, format: 'int', unit: ' G' },
];

export const BAR_WIDGETS: BarDef[] = [
  { kind: 'bar', type: 'fuelGauge', label: 'Fuel' },
  { kind: 'bar', type: 'batteryLevel', label: 'Battery', warnBelow: 20 },
  { kind: 'bar', type: 'stateOfCharge', label: 'SoC', warnBelow: 15 },
  { kind: 'bar', type: 'stateOfHealth', label: 'SoH', warnBelow: 70 },
  { kind: 'bar', type: 'energyConsumption', label: 'Energy' },
  { kind: 'bar', type: 'regenerativeBrakingMeter', label: 'Regen' },
  { kind: 'bar', type: 'fanSpeed', label: 'Fan' },
  { kind: 'bar', type: 'seatHeating', label: 'Seat Heat' },
  { kind: 'bar', type: 'seatVentilation', label: 'Seat Vent' },
  { kind: 'bar', type: 'volumeControl', label: 'Volume' },
  { kind: 'bar', type: 'chargingPower', label: 'Charge kW' },
  { kind: 'bar', type: 'suspensionHeight', label: 'Ride Height' },
  { kind: 'bar', type: 'washerFluidLevel', label: 'Washer', warnBelow: 20 },
  { kind: 'bar', type: 'brakeWearStatus', label: 'Brake Wear', warnBelow: 25 },
  { kind: 'bar', type: 'brakeFluidStatus', label: 'Brake Fluid', warnBelow: 25 },
];

export const NUMERIC_WIDGETS: NumericDef[] = [
  { kind: 'numeric', type: 'odometer', title: 'Odometer', unit: ' km' },
  { kind: 'numeric', type: 'tripMeter', title: 'Trip', unit: ' km' },
  { kind: 'numeric', type: 'batteryVoltage', title: 'Battery', unit: 'V', decimals: 1 },
  { kind: 'numeric', type: 'fuelEconomy', title: 'Fuel Econ', unit: ' L/100' },
  { kind: 'numeric', type: 'averageFuelEconomy', title: 'Avg Econ', unit: ' L/100' },
  { kind: 'numeric', type: 'instantFuelEconomy', title: 'Inst Econ', unit: ' L/100' },
  { kind: 'numeric', type: 'remainingFuelRange', title: 'Fuel Range', unit: ' km' },
  { kind: 'numeric', type: 'evRemainingRange', title: 'EV Range', unit: ' km' },
  { kind: 'numeric', type: 'outsideTemperature', title: 'Outside', unit: '°C' },
  { kind: 'numeric', type: 'cabinTemperature', title: 'Cabin', unit: '°C' },
  { kind: 'numeric', type: 'oilTemperature', title: 'Oil Temp', unit: '°C' },
  { kind: 'numeric', type: 'coolantTemperature', title: 'Coolant', unit: '°C' },
  { kind: 'numeric', type: 'engineTemperature', title: 'Engine', unit: '°C' },
  { kind: 'numeric', type: 'tireTemperature', title: 'Tire Temp', unit: '°C' },
  { kind: 'numeric', type: 'eta', title: 'ETA', unit: '' },
  { kind: 'numeric', type: 'chargingTimer', title: 'Charge Timer', unit: ' min' },
  { kind: 'numeric', type: 'performanceTimer', title: 'Perf Timer', unit: ' s' },
  { kind: 'numeric', type: 'lapTimer', title: 'Lap Timer', unit: ' s', decimals: 2 },
  { kind: 'numeric', type: 'accelerationTimer', title: '0-100', unit: ' s', decimals: 1 },
  { kind: 'numeric', type: 'compassHeading', title: 'Heading', unit: '°' },
  { kind: 'numeric', type: 'pitchRollIndicator', title: 'Pitch/Roll', unit: '°' },
  { kind: 'numeric', type: 'airQualityIndex', title: 'AQI', unit: '' },
  { kind: 'numeric', type: 'speedLimitRecognition', title: 'Speed Limit', unit: '' },
  { kind: 'numeric', type: 'digitalClock', title: 'Clock', unit: '' },
  { kind: 'numeric', type: 'dateDisplay', title: 'Date', unit: '' },
];

export const LAMP_WIDGETS: LampDef[] = [
  { kind: 'lamp', type: 'parkingBrake', symbol: 'P' },
  { kind: 'lamp', type: 'parkingBrakeStatus', symbol: 'P' },
  { kind: 'lamp', type: 'headlights', symbol: 'HL' },
  { kind: 'lamp', type: 'headlightStatus', symbol: 'HL' },
  { kind: 'lamp', type: 'highBeamStatus', symbol: 'HB' },
  { kind: 'lamp', type: 'fogLightStatus', symbol: 'FG' },
  { kind: 'lamp', type: 'hazardLights', symbol: 'HZ' },
  { kind: 'lamp', type: 'absStatus', symbol: 'ABS' },
  { kind: 'lamp', type: 'electronicStabilityControl', symbol: 'ESC' },
  { kind: 'lamp', type: 'tractionControl', symbol: 'TC' },
  { kind: 'lamp', type: 'airbagStatus', symbol: 'AIR' },
  { kind: 'lamp', type: 'seatBeltStatus', symbol: 'BELT' },
  { kind: 'lamp', type: 'doorOpenStatus', symbol: 'DOOR' },
  { kind: 'lamp', type: 'hoodOpenStatus', symbol: 'HOOD' },
  { kind: 'lamp', type: 'trunkTailgateStatus', symbol: 'TRK' },
  { kind: 'lamp', type: 'windowStatus', symbol: 'WIN' },
  { kind: 'lamp', type: 'wiperStatus', symbol: 'WIP' },
  { kind: 'lamp', type: 'rainSensor', symbol: 'RAIN' },
  { kind: 'lamp', type: 'autoHoldStatus', symbol: 'HOLD' },
  { kind: 'lamp', type: 'awdFourWdStatus', symbol: 'AWD' },
  { kind: 'lamp', type: 'differentialLock', symbol: 'DIFF' },
  { kind: 'lamp', type: 'trailerMode', symbol: 'TOW' },
  { kind: 'lamp', type: 'towAssist', symbol: 'TOW+' },
  { kind: 'lamp', type: 'laneKeepAssist', symbol: 'LKA' },
  { kind: 'lamp', type: 'laneDepartureWarning', symbol: 'LDW' },
  { kind: 'lamp', type: 'blindSpotMonitoring', symbol: 'BSM' },
  { kind: 'lamp', type: 'forwardCollisionWarning', symbol: 'FCW' },
  { kind: 'lamp', type: 'automaticEmergencyBraking', symbol: 'AEB' },
  { kind: 'lamp', type: 'parkingAssist', symbol: 'PARK' },
  { kind: 'lamp', type: 'driveModeIndicator', symbol: 'MODE' },
  { kind: 'lamp', type: 'steeringWheelHeater', symbol: 'STR' },
];

export const BADGE_WIDGETS: BadgeDef[] = [
  { kind: 'badge', type: 'cruiseControl', title: 'Cruise' },
  { kind: 'badge', type: 'cruiseControlStatus', title: 'Cruise' },
  { kind: 'badge', type: 'adaptiveCruiseControl', title: 'ACC' },
  { kind: 'badge', type: 'adasStatus', title: 'ADAS' },
  { kind: 'badge', type: 'chargingStatus', title: 'Charging' },
  { kind: 'badge', type: 'bluetoothStatus', title: 'Bluetooth' },
  { kind: 'badge', type: 'wifiStatus', title: 'Wi-Fi' },
  { kind: 'badge', type: 'mobileNetworkSignal', title: 'Mobile' },
  { kind: 'badge', type: 'phoneStatus', title: 'Phone' },
  { kind: 'badge', type: 'voiceAssistant', title: 'Voice' },
  { kind: 'badge', type: 'microphoneStatus', title: 'Mic' },
  { kind: 'badge', type: 'usbStatus', title: 'USB' },
  { kind: 'badge', type: 'appleCarPlay', title: 'CarPlay' },
  { kind: 'badge', type: 'androidAuto', title: 'Android Auto' },
  { kind: 'badge', type: 'remoteLockUnlock', title: 'Remote Lock' },
  { kind: 'badge', type: 'remoteStart', title: 'Remote Start' },
  { kind: 'badge', type: 'remoteClimateControl', title: 'Remote HVAC' },
  { kind: 'badge', type: 'remoteHornLights', title: 'Horn/Lights' },
  { kind: 'badge', type: 'suspensionMode', title: 'Suspension' },
  { kind: 'badge', type: 'ambientLightingControl', title: 'Ambient' },
  { kind: 'badge', type: 'driverProfile', title: 'Profile' },
  { kind: 'badge', type: 'userLogin', title: 'User' },
  { kind: 'badge', type: 'serviceReminder', title: 'Service' },
  { kind: 'badge', type: 'maintenanceSchedule', title: 'Maint' },
  { kind: 'badge', type: 'findMyVehicle', title: 'Find Car' },
  { kind: 'badge', type: 'vehicleLocation', title: 'Location' },
];

export const PANEL_WIDGETS: PanelDef[] = [
  { kind: 'panel', type: 'climateControl', title: 'Climate', rows: ['Auto', '22°C', 'Fan 3'] },
  { kind: 'panel', type: 'hvacStatus', title: 'HVAC', rows: ['Mode: Auto', 'Sync: On'] },
  { kind: 'panel', type: 'compass', title: 'Compass', rows: ['N 000°'] },
  { kind: 'panel', type: 'gpsNavigationMap', title: 'Navigation', rows: ['Map preview', 'Searching GPS…'] },
  { kind: 'panel', type: 'turnByTurnNavigation', title: 'Turn-by-Turn', rows: ['In 200 m', 'Turn right'] },
  { kind: 'panel', type: 'routeGuidance', title: 'Route', rows: ['12.4 km', '18 min'] },
  { kind: 'panel', type: 'trafficInformation', title: 'Traffic', rows: ['Moderate ahead'] },
  { kind: 'panel', type: 'calendar', title: 'Calendar', rows: ['Mon 6 Jul', 'No events'] },
  { kind: 'panel', type: 'notificationCenter', title: 'Notifications', rows: ['3 new alerts'] },
  { kind: 'panel', type: 'callScreen', title: 'Call', rows: ['Incoming…', 'Swipe to answer'] },
  { kind: 'panel', type: 'contacts', title: 'Contacts', rows: ['Recent', 'Favorites'] },
  { kind: 'panel', type: 'messages', title: 'Messages', rows: ['2 unread'] },
  { kind: 'panel', type: 'mediaPlayer', title: 'Media', rows: ['Now playing', 'Track — Artist'] },
  { kind: 'panel', type: 'musicControls', title: 'Music', rows: ['⏮  ▶  ⏭'] },
  { kind: 'panel', type: 'albumArt', title: 'Album', rows: ['[ Artwork ]'] },
  { kind: 'panel', type: 'radio', title: 'Radio', rows: ['FM 98.5'] },
  { kind: 'panel', type: 'podcastPlayer', title: 'Podcast', rows: ['Episode 12'] },
  { kind: 'panel', type: 'equalizer', title: 'EQ', rows: ['Bass +2', 'Treble 0'] },
  { kind: 'panel', type: 'nowPlaying', title: 'Now Playing', rows: ['Song Title', 'Artist'] },
  { kind: 'panel', type: 'navigationSearch', title: 'Nav Search', rows: ['Search…'] },
  { kind: 'panel', type: 'favoriteDestinations', title: 'Favorites', rows: ['Home', 'Work'] },
  { kind: 'panel', type: 'weatherWidget', title: 'Weather', rows: ['22°C Sunny'] },
  { kind: 'panel', type: 'sunriseSunset', title: 'Sun', rows: ['Rise 06:12', 'Set 19:45'] },
  { kind: 'panel', type: 'vehicleHealthMonitor', title: 'Health', rows: ['All systems OK'] },
  { kind: 'panel', type: 'diagnosticTroubleCodes', title: 'DTC', rows: ['No codes'] },
  { kind: 'panel', type: 'chargingHistory', title: 'Charge History', rows: ['Last: 42 kWh'] },
  { kind: 'panel', type: 'chargingStationFinder', title: 'Chargers', rows: ['3 nearby'] },
  { kind: 'panel', type: 'driveRecorder', title: 'Dashcam', rows: ['Recording'] },
  { kind: 'panel', type: 'surroundViewCamera', title: '360° View', rows: ['Cameras active'] },
  { kind: 'panel', type: 'rearViewCamera', title: 'Rear Cam', rows: ['Reverse view'] },
  { kind: 'panel', type: 'parkingSensorDisplay', title: 'Parking Sensors', rows: ['FL ■■■', 'FR ■■□'] },
  { kind: 'panel', type: 'cameraFeedWidget', title: 'Camera', rows: ['Live feed'] },
  { kind: 'panel', type: 'warningAlertPanel', title: 'Warnings', rows: ['No warnings'] },
  { kind: 'panel', type: 'sensorDashboard', title: 'Sensors', rows: ['IMU OK', 'GPS OK'] },
  { kind: 'panel', type: 'canBusSignalMonitor', title: 'CAN Bus', rows: ['engine.rpm: 0', 'vehicle.speed: 0'] },
  { kind: 'panel', type: 'vehicleCanLogger', title: 'CAN Logger', rows: ['Logging…'] },
  { kind: 'panel', type: 'customWidgetPanel', title: 'Custom', rows: ['Add widgets'] },
  { kind: 'panel', type: 'splitScreenView', title: 'Split View', rows: ['Left | Right'] },
  { kind: 'panel', type: 'quickSettingsPanel', title: 'Quick Settings', rows: ['Wi-Fi', 'BT', 'HVAC'] },
  { kind: 'panel', type: 'vehicleAnimation', title: 'Vehicle', rows: ['3D model'] },
  { kind: 'panel', type: 'statusIndicatorIcons', title: 'Status Icons', rows: ['● ● ● ●'] },
];

export const ALL_CATALOG_WIDGETS: WidgetDef[] = [
  ...DIAL_WIDGETS,
  ...BAR_WIDGETS,
  ...NUMERIC_WIDGETS,
  ...LAMP_WIDGETS,
  ...BADGE_WIDGETS,
  ...PANEL_WIDGETS,
];

export const WIDGET_ALIASES: Record<string, string> = {
  gearPositionIndicator: 'gearIndicator',
  tirePressureMonitoring: 'tpms',
  turnIndicator: 'turnIndicators',
};
