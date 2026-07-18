/**
 * Global-standard network topology icons (Cisco / Visio–style line glyphs).
 * Many device names alias onto a smaller set of canonical kinds.
 */
import type { App } from '../App';
import type { Group } from '../shapes/Group';
import { quadraticToPoints } from './pathUtils';
import { getActiveDiagram } from './theme';

/** Canonical glyph kinds used for drawing. */
export type NetworkIconKind =
  | 'internet'
  | 'cloud'
  | 'router'
  | 'switch'
  | 'hub'
  | 'bridge'
  | 'repeater'
  | 'gateway'
  | 'modem'
  | 'wlc'
  | 'wap'
  | 'mesh'
  | 'extender'
  | 'firewall'
  | 'ngfw'
  | 'waf'
  | 'vpn'
  | 'ids'
  | 'ips'
  | 'proxy'
  | 'reverseProxy'
  | 'swg'
  | 'siem'
  | 'nac'
  | 'server'
  | 'database'
  | 'storage'
  | 'nas'
  | 'san'
  | 'desktop'
  | 'laptop'
  | 'workstation'
  | 'thinClient'
  | 'phone'
  | 'tablet'
  | 'printer'
  | 'scanner'
  | 'ipPhone'
  | 'smartTv'
  | 'vm'
  | 'hypervisor'
  | 'container'
  | 'k8s'
  | 'k8sNode'
  | 'apiGateway'
  | 'loadBalancer'
  | 'cdn'
  | 'serverless'
  | 'vpc'
  | 'subnet'
  | 'nat'
  | 'igw'
  | 'bastion'
  | 'sql'
  | 'nosql'
  | 'redis'
  | 'elasticsearch'
  | 'warehouse'
  | 'queue'
  | 'kafka'
  | 'rabbitmq'
  | 'mqtt'
  | 'eventBus'
  | 'serviceBus'
  | 'monitor'
  | 'logging'
  | 'snmp'
  | 'config'
  | 'nms'
  | 'plc'
  | 'hmi'
  | 'scada'
  | 'rtu'
  | 'opcua'
  | 'modbus'
  | 'canGateway'
  | 'edgeGateway'
  | 'iotGateway'
  | 'esp32'
  | 'raspberryPi'
  | 'sensor'
  | 'actuator'
  | 'industrialSwitch'
  | 'ecu'
  | 'canBus'
  | 'linBus'
  | 'flexray'
  | 'ethGateway'
  | 'telematics'
  | 'infotainment'
  | 'adas'
  | 'gps'
  | 'camera'
  | 'radar'
  | 'lidar'
  | 'isp'
  | 'dnsProvider'
  | 'emailService'
  | 'authProvider'
  | 'payment'
  | 'thirdPartyApi'
  | 'mapsApi'
  | 'sms'
  | 'push'
  | 'ethernet'
  | 'fiber'
  | 'wifi'
  | 'vpnTunnel'
  | 'mpls'
  | 'sdwan'
  | 'serial'
  | 'usb'
  | 'bluetooth'
  | 'zigbee'
  | 'lorawan'
  | 'cellular'
  | 'satellite'
  | 'datacenter'
  | 'office'
  | 'branch'
  | 'dmz'
  | 'lan'
  | 'wan'
  | 'vlan'
  | 'privateNet'
  | 'publicNet'
  | 'cloudRegion'
  | 'default';

export type NetworkIconCategory =
  | 'infra'
  | 'security'
  | 'server'
  | 'storage'
  | 'endpoint'
  | 'cloud'
  | 'data'
  | 'messaging'
  | 'monitor'
  | 'iot'
  | 'auto'
  | 'external'
  | 'link'
  | 'zone';

export interface NetworkIconStyle {
  fill: string;
  stroke: string;
  glyph: string;
  edge: string;
}

export interface NetworkIconMeta {
  kind: NetworkIconKind;
  label: string;
  category: NetworkIconCategory;
  /** True for zone/container shapes (rectangular dashed chrome). */
  container?: boolean;
}

/** Normalize free-form type strings to a lookup key. */
export function slugNetworkType(type: string): string {
  return type
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
}

/** Alias map: slug → canonical kind (covers the full requested device list). */
const ALIASES: Record<string, NetworkIconKind> = {
  // Infrastructure
  internet: 'internet',
  cloud: 'cloud',
  router: 'router',
  core_router: 'router',
  edge_router: 'router',
  switch: 'switch',
  core_switch: 'switch',
  distribution_switch: 'switch',
  access_switch: 'switch',
  hub: 'hub',
  bridge: 'bridge',
  repeater: 'repeater',
  gateway: 'gateway',
  modem: 'modem',
  wireless_controller: 'wlc',
  wlc: 'wlc',
  wireless_access_point: 'wap',
  access_point: 'wap',
  ap: 'wap',
  wap: 'wap',
  mesh_node: 'mesh',
  mesh: 'mesh',
  network_extender: 'extender',
  extender: 'extender',

  // Security
  security: 'firewall',
  firewall: 'firewall',
  next_generation_firewall: 'ngfw',
  ngfw: 'ngfw',
  web_application_firewall: 'waf',
  waf: 'waf',
  vpn_gateway: 'vpn',
  vpn: 'vpn',
  ids: 'ids',
  intrusion_detection_system: 'ids',
  ips: 'ips',
  intrusion_prevention_system: 'ips',
  proxy_server: 'proxy',
  proxy: 'proxy',
  reverse_proxy: 'reverseProxy',
  secure_web_gateway: 'swg',
  swg: 'swg',
  siem: 'siem',
  nac: 'nac',
  network_access_control: 'nac',

  // Servers
  servers: 'server',
  server: 'server',
  physical_server: 'server',
  virtual_server: 'vm',
  web_server: 'server',
  application_server: 'server',
  database_server: 'database',
  file_server: 'server',
  mail_server: 'server',
  ftp_server: 'server',
  dns_server: 'server',
  dhcp_server: 'server',
  ntp_server: 'server',
  authentication_server: 'server',
  domain_controller: 'server',
  print_server: 'server',
  media_server: 'server',
  backup_server: 'server',

  // Storage
  storage: 'storage',
  nas: 'nas',
  san: 'san',
  storage_array: 'storage',
  object_storage: 'storage',
  backup_storage: 'storage',

  // Endpoints
  end_user_devices: 'desktop',
  client: 'desktop',
  desktop: 'desktop',
  desktop_pc: 'desktop',
  pc: 'desktop',
  laptop: 'laptop',
  workstation: 'workstation',
  thin_client: 'thinClient',
  smartphone: 'phone',
  phone: 'phone',
  mobile: 'phone',
  tablet: 'tablet',
  printer: 'printer',
  scanner: 'scanner',
  ip_phone: 'ipPhone',
  voip_phone: 'ipPhone',
  smart_tv: 'smartTv',

  // Cloud & virtualization
  cloud_virtualization: 'cloud',
  virtual_machine: 'vm',
  vm: 'vm',
  hypervisor: 'hypervisor',
  docker_container: 'container',
  docker: 'container',
  container: 'container',
  kubernetes_cluster: 'k8s',
  kubernetes: 'k8s',
  k8s: 'k8s',
  kubernetes_node: 'k8sNode',
  k8s_node: 'k8sNode',
  api_gateway: 'apiGateway',
  load_balancer: 'loadBalancer',
  lb: 'loadBalancer',
  cdn: 'cdn',
  serverless_function: 'serverless',
  serverless: 'serverless',
  lambda: 'serverless',
  vpc: 'vpc',
  subnet: 'subnet',
  nat_gateway: 'nat',
  nat: 'nat',
  internet_gateway: 'igw',
  igw: 'igw',
  bastion_host: 'bastion',
  bastion: 'bastion',

  // Databases
  databases: 'database',
  database: 'database',
  db: 'database',
  sql_database: 'sql',
  sql: 'sql',
  nosql_database: 'nosql',
  nosql: 'nosql',
  redis_cache: 'redis',
  redis: 'redis',
  cache: 'redis',
  elasticsearch: 'elasticsearch',
  elastic: 'elasticsearch',
  data_warehouse: 'warehouse',
  warehouse: 'warehouse',

  // Messaging
  messaging_integration: 'queue',
  message_queue: 'queue',
  queue: 'queue',
  kafka: 'kafka',
  rabbitmq: 'rabbitmq',
  mqtt_broker: 'mqtt',
  mqtt: 'mqtt',
  event_bus: 'eventBus',
  service_bus: 'serviceBus',

  // Monitoring
  monitoring_management: 'monitor',
  monitoring_server: 'monitor',
  monitor: 'monitor',
  logging_server: 'logging',
  logging: 'logging',
  snmp_manager: 'snmp',
  snmp: 'snmp',
  configuration_server: 'config',
  config_server: 'config',
  network_management_system: 'nms',
  nms: 'nms',

  // IoT
  iot_industrial: 'iotGateway',
  plc: 'plc',
  hmi: 'hmi',
  scada_server: 'scada',
  scada: 'scada',
  rtu: 'rtu',
  opc_ua_server: 'opcua',
  opcua: 'opcua',
  modbus_tcp_device: 'modbus',
  modbus_rtu_device: 'modbus',
  modbus: 'modbus',
  can_gateway: 'canGateway',
  edge_gateway: 'edgeGateway',
  iot_gateway: 'iotGateway',
  esp32: 'esp32',
  raspberry_pi: 'raspberryPi',
  rpi: 'raspberryPi',
  sensor: 'sensor',
  actuator: 'actuator',
  industrial_switch: 'industrialSwitch',

  // Automotive
  automotive: 'ecu',
  ecu: 'ecu',
  can_bus: 'canBus',
  lin_bus: 'linBus',
  flexray: 'flexray',
  ethernet_gateway: 'ethGateway',
  telematics_unit: 'telematics',
  telematics: 'telematics',
  infotainment_system: 'infotainment',
  infotainment: 'infotainment',
  adas_ecu: 'adas',
  adas: 'adas',
  gps_module: 'gps',
  gps: 'gps',
  camera: 'camera',
  radar: 'radar',
  lidar: 'lidar',

  // External
  external_services: 'cloud',
  isp: 'isp',
  dns_provider: 'dnsProvider',
  email_service: 'emailService',
  authentication_provider: 'authProvider',
  auth_provider: 'authProvider',
  payment_gateway: 'payment',
  payment: 'payment',
  third_party_api: 'thirdPartyApi',
  api: 'thirdPartyApi',
  maps_api: 'mapsApi',
  sms_gateway: 'sms',
  sms: 'sms',
  push_notification_service: 'push',
  push: 'push',

  // Links (also usable as nodes in catalogs)
  connections: 'ethernet',
  ethernet: 'ethernet',
  fiber_optic: 'fiber',
  fiber: 'fiber',
  wi_fi: 'wifi',
  wifi: 'wifi',
  vpn_tunnel: 'vpnTunnel',
  mpls: 'mpls',
  sd_wan: 'sdwan',
  sdwan: 'sdwan',
  serial_connection: 'serial',
  serial: 'serial',
  usb: 'usb',
  bluetooth: 'bluetooth',
  zigbee: 'zigbee',
  lorawan: 'lorawan',
  lora: 'lorawan',
  cellular_4g_5g: 'cellular',
  cellular: 'cellular',
  '4g': 'cellular',
  '5g': 'cellular',
  satellite_link: 'satellite',
  satellite: 'satellite',

  // Zones / containers
  common_diagram_containers: 'datacenter',
  data_center: 'datacenter',
  datacenter: 'datacenter',
  office: 'office',
  branch_office: 'branch',
  branch: 'branch',
  dmz: 'dmz',
  lan: 'lan',
  wan: 'wan',
  vlan: 'vlan',
  private_network: 'privateNet',
  private_net: 'privateNet',
  public_network: 'publicNet',
  public_net: 'publicNet',
  cloud_region: 'cloudRegion',

  default: 'default',
};

const KIND_META: Record<NetworkIconKind, Omit<NetworkIconMeta, 'kind'>> = {
  internet: { label: 'Internet', category: 'infra' },
  cloud: { label: 'Cloud', category: 'cloud' },
  router: { label: 'Router', category: 'infra' },
  switch: { label: 'Switch', category: 'infra' },
  hub: { label: 'Hub', category: 'infra' },
  bridge: { label: 'Bridge', category: 'infra' },
  repeater: { label: 'Repeater', category: 'infra' },
  gateway: { label: 'Gateway', category: 'infra' },
  modem: { label: 'Modem', category: 'infra' },
  wlc: { label: 'Wireless Controller', category: 'infra' },
  wap: { label: 'Access Point', category: 'infra' },
  mesh: { label: 'Mesh Node', category: 'infra' },
  extender: { label: 'Network Extender', category: 'infra' },
  firewall: { label: 'Firewall', category: 'security' },
  ngfw: { label: 'NGFW', category: 'security' },
  waf: { label: 'WAF', category: 'security' },
  vpn: { label: 'VPN Gateway', category: 'security' },
  ids: { label: 'IDS', category: 'security' },
  ips: { label: 'IPS', category: 'security' },
  proxy: { label: 'Proxy', category: 'security' },
  reverseProxy: { label: 'Reverse Proxy', category: 'security' },
  swg: { label: 'Secure Web Gateway', category: 'security' },
  siem: { label: 'SIEM', category: 'security' },
  nac: { label: 'NAC', category: 'security' },
  server: { label: 'Server', category: 'server' },
  database: { label: 'Database', category: 'data' },
  storage: { label: 'Storage', category: 'storage' },
  nas: { label: 'NAS', category: 'storage' },
  san: { label: 'SAN', category: 'storage' },
  desktop: { label: 'Desktop PC', category: 'endpoint' },
  laptop: { label: 'Laptop', category: 'endpoint' },
  workstation: { label: 'Workstation', category: 'endpoint' },
  thinClient: { label: 'Thin Client', category: 'endpoint' },
  phone: { label: 'Smartphone', category: 'endpoint' },
  tablet: { label: 'Tablet', category: 'endpoint' },
  printer: { label: 'Printer', category: 'endpoint' },
  scanner: { label: 'Scanner', category: 'endpoint' },
  ipPhone: { label: 'IP Phone', category: 'endpoint' },
  smartTv: { label: 'Smart TV', category: 'endpoint' },
  vm: { label: 'Virtual Machine', category: 'cloud' },
  hypervisor: { label: 'Hypervisor', category: 'cloud' },
  container: { label: 'Container', category: 'cloud' },
  k8s: { label: 'Kubernetes', category: 'cloud' },
  k8sNode: { label: 'K8s Node', category: 'cloud' },
  apiGateway: { label: 'API Gateway', category: 'cloud' },
  loadBalancer: { label: 'Load Balancer', category: 'cloud' },
  cdn: { label: 'CDN', category: 'cloud' },
  serverless: { label: 'Serverless', category: 'cloud' },
  vpc: { label: 'VPC', category: 'cloud', container: true },
  subnet: { label: 'Subnet', category: 'cloud', container: true },
  nat: { label: 'NAT Gateway', category: 'cloud' },
  igw: { label: 'Internet Gateway', category: 'cloud' },
  bastion: { label: 'Bastion Host', category: 'security' },
  sql: { label: 'SQL Database', category: 'data' },
  nosql: { label: 'NoSQL Database', category: 'data' },
  redis: { label: 'Redis Cache', category: 'data' },
  elasticsearch: { label: 'Elasticsearch', category: 'data' },
  warehouse: { label: 'Data Warehouse', category: 'data' },
  queue: { label: 'Message Queue', category: 'messaging' },
  kafka: { label: 'Kafka', category: 'messaging' },
  rabbitmq: { label: 'RabbitMQ', category: 'messaging' },
  mqtt: { label: 'MQTT Broker', category: 'messaging' },
  eventBus: { label: 'Event Bus', category: 'messaging' },
  serviceBus: { label: 'Service Bus', category: 'messaging' },
  monitor: { label: 'Monitoring', category: 'monitor' },
  logging: { label: 'Logging', category: 'monitor' },
  snmp: { label: 'SNMP Manager', category: 'monitor' },
  config: { label: 'Config Server', category: 'monitor' },
  nms: { label: 'NMS', category: 'monitor' },
  plc: { label: 'PLC', category: 'iot' },
  hmi: { label: 'HMI', category: 'iot' },
  scada: { label: 'SCADA', category: 'iot' },
  rtu: { label: 'RTU', category: 'iot' },
  opcua: { label: 'OPC UA', category: 'iot' },
  modbus: { label: 'Modbus Device', category: 'iot' },
  canGateway: { label: 'CAN Gateway', category: 'iot' },
  edgeGateway: { label: 'Edge Gateway', category: 'iot' },
  iotGateway: { label: 'IoT Gateway', category: 'iot' },
  esp32: { label: 'ESP32', category: 'iot' },
  raspberryPi: { label: 'Raspberry Pi', category: 'iot' },
  sensor: { label: 'Sensor', category: 'iot' },
  actuator: { label: 'Actuator', category: 'iot' },
  industrialSwitch: { label: 'Industrial Switch', category: 'iot' },
  ecu: { label: 'ECU', category: 'auto' },
  canBus: { label: 'CAN Bus', category: 'auto' },
  linBus: { label: 'LIN Bus', category: 'auto' },
  flexray: { label: 'FlexRay', category: 'auto' },
  ethGateway: { label: 'Ethernet Gateway', category: 'auto' },
  telematics: { label: 'Telematics', category: 'auto' },
  infotainment: { label: 'Infotainment', category: 'auto' },
  adas: { label: 'ADAS ECU', category: 'auto' },
  gps: { label: 'GPS Module', category: 'auto' },
  camera: { label: 'Camera', category: 'auto' },
  radar: { label: 'Radar', category: 'auto' },
  lidar: { label: 'LiDAR', category: 'auto' },
  isp: { label: 'ISP', category: 'external' },
  dnsProvider: { label: 'DNS Provider', category: 'external' },
  emailService: { label: 'Email Service', category: 'external' },
  authProvider: { label: 'Auth Provider', category: 'external' },
  payment: { label: 'Payment Gateway', category: 'external' },
  thirdPartyApi: { label: 'Third-Party API', category: 'external' },
  mapsApi: { label: 'Maps API', category: 'external' },
  sms: { label: 'SMS Gateway', category: 'external' },
  push: { label: 'Push Service', category: 'external' },
  ethernet: { label: 'Ethernet', category: 'link' },
  fiber: { label: 'Fiber Optic', category: 'link' },
  wifi: { label: 'Wi-Fi', category: 'link' },
  vpnTunnel: { label: 'VPN Tunnel', category: 'link' },
  mpls: { label: 'MPLS', category: 'link' },
  sdwan: { label: 'SD-WAN', category: 'link' },
  serial: { label: 'Serial', category: 'link' },
  usb: { label: 'USB', category: 'link' },
  bluetooth: { label: 'Bluetooth', category: 'link' },
  zigbee: { label: 'Zigbee', category: 'link' },
  lorawan: { label: 'LoRaWAN', category: 'link' },
  cellular: { label: 'Cellular', category: 'link' },
  satellite: { label: 'Satellite', category: 'link' },
  datacenter: { label: 'Data Center', category: 'zone', container: true },
  office: { label: 'Office', category: 'zone', container: true },
  branch: { label: 'Branch Office', category: 'zone', container: true },
  dmz: { label: 'DMZ', category: 'zone', container: true },
  lan: { label: 'LAN', category: 'zone', container: true },
  wan: { label: 'WAN', category: 'zone', container: true },
  vlan: { label: 'VLAN', category: 'zone', container: true },
  privateNet: { label: 'Private Network', category: 'zone', container: true },
  publicNet: { label: 'Public Network', category: 'zone', container: true },
  cloudRegion: { label: 'Cloud Region', category: 'zone', container: true },
  default: { label: 'Device', category: 'infra' },
};

/** Resolve any type string to a canonical icon kind. */
export function resolveNetworkIconKind(type: string): NetworkIconKind {
  const key = slugNetworkType(type);
  if (ALIASES[key]) return ALIASES[key];
  // Match canonical kind names (camelCase → snake_case via slug)
  for (const kind of Object.keys(KIND_META) as NetworkIconKind[]) {
    if (slugNetworkType(kind) === key) return kind;
  }
  return 'default';
}

export function getNetworkIconMeta(kind: NetworkIconKind): NetworkIconMeta {
  const m = KIND_META[kind] ?? KIND_META.default;
  return { kind, ...m };
}

/** Full catalog of canonical icons (one per kind). */
export function listNetworkIconKinds(): NetworkIconMeta[] {
  return (Object.keys(KIND_META) as NetworkIconKind[])
    .filter((k) => k !== 'default')
    .map((kind) => getNetworkIconMeta(kind));
}

/** All accepted type aliases (including friendly names). */
export function listNetworkTypeAliases(): string[] {
  return Object.keys(ALIASES).sort();
}

export function networkStyleForKind(kind: NetworkIconKind): NetworkIconStyle {
  const cat = getNetworkIconMeta(kind).category;
  const d = getActiveDiagram();
  const fromCat = d.networkCategories?.[cat];
  if (fromCat) return { ...fromCat };
  if (kind === 'router') return { ...d.networkRouter };
  if (kind === 'server' || kind === 'vm') return { ...d.networkServer };
  if (kind === 'switch' || kind === 'industrialSwitch') return { ...d.networkSwitch };
  if (kind === 'desktop' || kind === 'laptop' || kind === 'phone') return { ...d.networkClient };
  return { ...d.networkDefault };
}

const SW = 1.7;

/** Line from (x,y) with delta (dx,dy). */
function L(
  app: App,
  parent: Group,
  x: number,
  y: number,
  dx: number,
  dy: number,
  color: string,
  sw = SW
): void {
  parent.add(
    app.line({
      x,
      y,
      x2: dx,
      y2: dy,
      stroke: color,
      strokeWidth: sw,
      lineCap: 'round',
      lineJoin: 'round',
      listening: false,
    })
  );
}

function R(
  app: App,
  parent: Group,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  sw = SW,
  cr = 2.5,
  fill: string | null = null
): void {
  parent.add(
    app.roundedRect({
      x,
      y,
      width: w,
      height: h,
      cornerRadius: cr,
      fill,
      stroke: color,
      strokeWidth: sw,
      listening: false,
    })
  );
}

/** Circle centered at (cx, cy) — compensates for top-left circle origin. */
function C(
  app: App,
  parent: Group,
  cx: number,
  cy: number,
  r: number,
  color: string,
  sw = SW,
  fill: string | null = null
): void {
  parent.add(
    app.circle({
      x: cx - r,
      y: cy - r,
      radius: r,
      fill,
      stroke: fill ? null : color,
      strokeWidth: fill ? 0 : sw,
      listening: false,
    })
  );
}

function E(
  app: App,
  parent: Group,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: string,
  sw = SW
): void {
  parent.add(
    app.ellipse({
      x: cx - rx,
      y: cy - ry,
      radiusX: rx,
      radiusY: ry,
      fill: null,
      stroke: color,
      strokeWidth: sw,
      listening: false,
    })
  );
}

function poly(
  app: App,
  parent: Group,
  points: number[],
  color: string,
  sw = SW,
  fill: string | null = null
): void {
  parent.add(
    app.polygon({ points, fill, stroke: color, strokeWidth: sw, listening: false })
  );
}

function pline(
  app: App,
  parent: Group,
  points: number[],
  color: string,
  sw = SW
): void {
  parent.add(
    app.polyline({
      points,
      fill: null,
      stroke: color,
      strokeWidth: sw,
      lineCap: 'round',
      lineJoin: 'round',
      listening: false,
    })
  );
}

/** Continuous cloud outline (Visio-style). */
function drawCloudShape(app: App, parent: Group, cx: number, cy: number, color: string): void {
  const bumps = [
    { x: cx - 10, y: cy + 3, r: 6.5 },
    { x: cx - 2, y: cy - 5, r: 7.5 },
    { x: cx + 9, y: cy - 2, r: 7 },
    { x: cx + 11, y: cy + 5, r: 5.5 },
    { x: cx, y: cy + 7, r: 6 },
  ];
  for (const b of bumps) C(app, parent, b.x, b.y, b.r, color, 1.55);
}

function drawGlobe(app: App, parent: Group, cx: number, cy: number, color: string): void {
  C(app, parent, cx, cy, 13, color, 1.75);
  E(app, parent, cx, cy, 6, 13, color, 1.35);
  L(app, parent, cx - 13, cy, 26, 0, color, 1.35);
  L(app, parent, cx - 11, cy - 6, 22, 0, color, 1.15);
  L(app, parent, cx - 11, cy + 6, 22, 0, color, 1.15);
}

function drawRouterHex(app: App, parent: Group, cx: number, cy: number, size: number, color: string): void {
  const r = size * 0.3;
  const hex: number[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    hex.push(cx + r * Math.cos(a), cy + 2 + r * Math.sin(a));
  }
  poly(app, parent, hex, color, 1.85);
  C(app, parent, cx, cy + 2, 3.4, color, 1, color);
  for (const sign of [-1, 1] as const) {
    pline(
      app,
      parent,
      quadraticToPoints(cx + sign * 5, cy - 8, cx + sign * 13, cy - 16, cx + sign * 3, cy - 19, 7),
      color,
      1.45
    );
  }
}

function drawServerRack(app: App, parent: Group, cx: number, cy: number, color: string): void {
  R(app, parent, cx - 13, cy - 15, 26, 30, color, 1.75, 3.5);
  for (let i = 0; i < 3; i++) {
    const y = cy - 11 + i * 8.5;
    R(app, parent, cx - 9, y, 14, 5.5, color, 1.15, 1.2);
    C(app, parent, cx + 8.5, y + 2.75, 1.5, color, 1, i === 0 ? color : null);
  }
}

function drawSwitchBody(app: App, parent: Group, cx: number, cy: number, color: string): void {
  R(app, parent, cx - 16, cy - 9, 32, 18, color, 1.75, 3.5);
  for (let i = 0; i < 8; i++) {
    R(
      app,
      parent,
      cx - 14 + i * 3.6,
      cy - 3,
      2.6,
      7,
      color,
      0.95,
      0.5,
      i % 2 === 0 ? color : null
    );
  }
  L(app, parent, cx - 13, cy - 12, 26, 0, color, 1.25);
  C(app, parent, cx + 12, cy - 12, 1.4, color, 1, color);
}

function drawMonitor(app: App, parent: Group, cx: number, cy: number, color: string): void {
  R(app, parent, cx - 14, cy - 13, 28, 18, color, 1.75, 3);
  R(app, parent, cx - 11, cy - 10, 22, 12, color, 1.15, 1.5);
  L(app, parent, cx, cy + 5, 0, 5, color, 1.7);
  L(app, parent, cx - 8, cy + 11, 16, 0, color, 1.7);
}

function drawShield(
  app: App,
  parent: Group,
  cx: number,
  cy: number,
  color: string,
  mark: 'check' | 'eye' | 'lock' | 'none' = 'check'
): void {
  poly(
    app,
    parent,
    [cx, cy - 15, cx + 12, cy - 9, cx + 11, cy + 3, cx, cy + 15, cx - 11, cy + 3, cx - 12, cy - 9],
    color,
    1.8
  );
  if (mark === 'check') {
    pline(app, parent, [cx - 5, cy + 1, cx - 1, cy + 6, cx + 7, cy - 5], color, 1.7);
  } else if (mark === 'eye') {
    E(app, parent, cx, cy, 5, 3.2, color, 1.35);
    C(app, parent, cx, cy, 1.8, color, 1, color);
  } else if (mark === 'lock') {
    R(app, parent, cx - 4, cy - 1, 8, 7, color, 1.35, 1.2);
    pline(app, parent, [cx - 3, cy - 1, cx - 3, cy - 5, cx + 3, cy - 5, cx + 3, cy - 1], color, 1.35);
  }
}

function drawCylinder(app: App, parent: Group, cx: number, cy: number, color: string): void {
  const w = 22;
  const h = 16;
  const rx = w / 2;
  const ry = 4.5;
  E(app, parent, cx, cy - h / 2, rx, ry, color, 1.55);
  L(app, parent, cx - rx, cy - h / 2, 0, h, color, 1.55);
  L(app, parent, cx + rx, cy - h / 2, 0, h, color, 1.55);
  E(app, parent, cx, cy + h / 2, rx, ry, color, 1.55);
  E(app, parent, cx, cy - 1, rx, ry * 0.85, color, 1.15);
}

function drawWifiArcs(app: App, parent: Group, cx: number, cy: number, color: string): void {
  C(app, parent, cx, cy + 8, 2.4, color, 1, color);
  for (const r of [7, 11, 15]) {
    pline(
      app,
      parent,
      quadraticToPoints(cx - r, cy + 4, cx, cy + 4 - r * 0.85, cx + r, cy + 4, 10),
      color,
      1.55
    );
  }
}

function drawLoadBalancer(app: App, parent: Group, cx: number, cy: number, color: string): void {
  R(app, parent, cx - 5, cy - 13, 10, 9, color, 1.6, 2);
  L(app, parent, cx, cy - 4, 0, 5, color, 1.55);
  L(app, parent, cx - 11, cy + 2, 22, 0, color, 1.55);
  for (const ox of [-11, 0, 11]) {
    L(app, parent, cx + ox, cy + 2, 0, 8, color, 1.45);
    C(app, parent, cx + ox, cy + 12, 2.2, color, 1.2);
  }
}

function drawZoneBox(app: App, parent: Group, cx: number, cy: number, color: string): void {
  R(app, parent, cx - 15, cy - 11, 30, 22, color, 1.55, 4);
  parent.add(
    app.roundedRect({
      x: cx - 11,
      y: cy - 7,
      width: 22,
      height: 14,
      cornerRadius: 2.5,
      fill: null,
      stroke: color,
      strokeWidth: 1.2,
      dash: [3.5, 2.5],
      listening: false,
    })
  );
}

/** Draw a standard network glyph centered in a size×size box. */
export function drawNetworkIcon(
  app: App,
  parent: Group,
  kind: NetworkIconKind,
  size: number,
  color: string
): void {
  const cx = size / 2;
  const cy = size / 2;

  switch (kind) {
    case 'internet':
      drawGlobe(app, parent, cx, cy, color);
      break;
    case 'cloud':
    case 'cdn':
    case 'cloudRegion':
      drawCloudShape(app, parent, cx, cy, color);
      break;
    case 'router':
    case 'gateway':
    case 'nat':
    case 'igw':
    case 'edgeGateway':
    case 'iotGateway':
    case 'canGateway':
    case 'ethGateway':
      drawRouterHex(app, parent, cx, cy - 1, size, color);
      break;
    case 'switch':
    case 'industrialSwitch':
      drawSwitchBody(app, parent, cx, cy, color);
      break;
    case 'hub':
      C(app, parent, cx, cy, 4.5, color, 1, color);
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        L(app, parent, cx + Math.cos(a) * 5, cy + Math.sin(a) * 5, Math.cos(a) * 9, Math.sin(a) * 9, color, 1.4);
        C(app, parent, cx + Math.cos(a) * 15, cy + Math.sin(a) * 15, 2.3, color, 1, color);
      }
      break;
    case 'bridge':
      R(app, parent, cx - 17, cy - 5, 13, 10, color, 1.6, 2.5);
      R(app, parent, cx + 4, cy - 5, 13, 10, color, 1.6, 2.5);
      L(app, parent, cx - 4, cy, 8, 0, color, 2.2);
      C(app, parent, cx, cy, 2.2, color, 1, color);
      break;
    case 'repeater':
    case 'extender':
      C(app, parent, cx - 9, cy, 5.5, color);
      C(app, parent, cx + 9, cy, 5.5, color);
      L(app, parent, cx - 3.5, cy, 7, 0, color, 1.8);
      C(app, parent, cx, cy, 2, color, 1, color);
      break;
    case 'modem':
      R(app, parent, cx - 15, cy - 7, 30, 15, color, 1.7, 3.5);
      for (let i = 0; i < 4; i++) C(app, parent, cx - 8 + i * 5.5, cy + 1, 1.7, color, 1, color);
      L(app, parent, cx + 2, cy - 11, 0, -5, color, 1.5);
      L(app, parent, cx - 2, cy - 14, 8, 0, color, 1.35);
      break;
    case 'wlc':
    case 'wap':
    case 'mesh':
    case 'wifi':
      drawWifiArcs(app, parent, cx, cy, color);
      break;
    case 'firewall':
      drawShield(app, parent, cx, cy, color, 'check');
      break;
    case 'ngfw':
    case 'waf':
    case 'swg':
      drawShield(app, parent, cx, cy, color, 'lock');
      break;
    case 'bastion':
      drawShield(app, parent, cx, cy, color, 'lock');
      break;
    case 'vpn':
    case 'vpnTunnel':
      R(app, parent, cx - 13, cy - 7, 26, 14, color, 1.7, 4);
      pline(app, parent, [cx - 7, cy, cx - 3, cy, cx - 1, cy - 3, cx + 1, cy + 3, cx + 3, cy, cx + 7, cy], color, 1.6);
      break;
    case 'ids':
    case 'ips':
    case 'siem':
    case 'nac':
      drawShield(app, parent, cx, cy, color, 'eye');
      break;
    case 'proxy':
    case 'reverseProxy':
    case 'apiGateway':
    case 'loadBalancer':
      drawLoadBalancer(app, parent, cx, cy, color);
      break;
    case 'server':
    case 'hypervisor':
    case 'k8sNode':
      drawServerRack(app, parent, cx, cy, color);
      break;
    case 'vm':
      drawServerRack(app, parent, cx, cy, color);
      R(app, parent, cx - 7, cy - 7, 14, 11, color, 1.25, 1.5);
      break;
    case 'container':
      R(app, parent, cx - 13, cy - 9, 26, 18, color, 1.7, 2.5);
      L(app, parent, cx - 13, cy, 26, 0, color, 1.25);
      L(app, parent, cx - 4, cy - 9, 0, 18, color, 1.25);
      L(app, parent, cx + 4, cy - 9, 0, 18, color, 1.25);
      break;
    case 'k8s': {
      const arm = 13;
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        L(app, parent, cx, cy, Math.cos(a) * arm, Math.sin(a) * arm, color, 1.55);
        C(app, parent, cx + Math.cos(a) * arm, cy + Math.sin(a) * arm, 2.2, color, 1, color);
      }
      C(app, parent, cx, cy, 4.2, color, 1.5, color);
      break;
    }
    case 'serverless':
      poly(
        app,
        parent,
        [cx + 3, cy - 14, cx - 8, cy + 1, cx + 1, cy + 1, cx - 3, cy + 14, cx + 8, cy - 1, cx - 1, cy - 1],
        color,
        1.7
      );
      break;
    case 'database':
    case 'sql':
    case 'nosql':
    case 'redis':
    case 'elasticsearch':
    case 'warehouse':
      drawCylinder(app, parent, cx, cy, color);
      break;
    case 'storage':
    case 'nas':
    case 'san':
      R(app, parent, cx - 14, cy - 13, 28, 26, color, 1.7, 3.5);
      for (let i = 0; i < 3; i++) {
        L(app, parent, cx - 10, cy - 7 + i * 7, 20, 0, color, 1.3);
        C(app, parent, cx + 9, cy - 7 + i * 7, 1.3, color, 1, i === 0 ? color : null);
      }
      break;
    case 'desktop':
    case 'workstation':
    case 'thinClient':
      drawMonitor(app, parent, cx, cy, color);
      break;
    case 'laptop':
      R(app, parent, cx - 14, cy - 11, 28, 16, color, 1.7, 2.5);
      R(app, parent, cx - 11, cy - 8, 22, 10, color, 1.15, 1.2);
      R(app, parent, cx - 17, cy + 6, 34, 5, color, 1.55, 1.5);
      break;
    case 'phone':
      R(app, parent, cx - 7, cy - 15, 14, 28, color, 1.7, 3.5);
      R(app, parent, cx - 5, cy - 12, 10, 20, color, 1.1, 1.5);
      C(app, parent, cx, cy + 10, 1.4, color, 1, color);
      break;
    case 'tablet':
      R(app, parent, cx - 12, cy - 15, 24, 30, color, 1.7, 3.5);
      R(app, parent, cx - 9, cy - 12, 18, 22, color, 1.1, 1.5);
      C(app, parent, cx, cy + 12, 1.3, color, 1, color);
      break;
    case 'printer':
      R(app, parent, cx - 13, cy - 3, 26, 12, color, 1.65, 2.5);
      R(app, parent, cx - 9, cy - 12, 18, 10, color, 1.4, 1.5);
      R(app, parent, cx - 9, cy + 7, 18, 7, color, 1.35, 1.2);
      L(app, parent, cx - 6, cy + 10, 12, 0, color, 1.1);
      break;
    case 'scanner':
      R(app, parent, cx - 15, cy - 5, 30, 12, color, 1.65, 3);
      L(app, parent, cx - 11, cy, 22, 0, color, 1.35);
      R(app, parent, cx - 8, cy - 12, 16, 6, color, 1.3, 1);
      break;
    case 'ipPhone':
      R(app, parent, cx - 11, cy - 8, 20, 16, color, 1.65, 2.5);
      for (let r = 0; r < 2; r++)
        for (let c = 0; c < 3; c++)
          C(app, parent, cx - 5 + c * 5, cy - 3 + r * 5, 1.2, color, 1, color);
      pline(app, parent, [cx + 10, cy - 2, cx + 15, cy - 8, cx + 15, cy + 2], color, 1.45);
      break;
    case 'smartTv':
      R(app, parent, cx - 17, cy - 11, 34, 20, color, 1.7, 3);
      R(app, parent, cx - 14, cy - 8, 28, 14, color, 1.15, 1.5);
      L(app, parent, cx, cy + 9, 0, 4, color, 1.6);
      L(app, parent, cx - 9, cy + 13, 18, 0, color, 1.6);
      break;
    case 'vpc':
    case 'subnet':
    case 'datacenter':
    case 'office':
    case 'branch':
    case 'dmz':
    case 'lan':
    case 'wan':
    case 'vlan':
    case 'privateNet':
    case 'publicNet':
      drawZoneBox(app, parent, cx, cy, color);
      break;
    case 'queue':
    case 'kafka':
    case 'rabbitmq':
    case 'mqtt':
    case 'eventBus':
    case 'serviceBus':
      for (let i = 0; i < 3; i++) {
        R(app, parent, cx - 13, cy - 12 + i * 9, 26, 7, color, 1.45, 2);
        L(app, parent, cx + 8, cy - 8.5 + i * 9, 5, 0, color, 1.3);
      }
      break;
    case 'monitor':
    case 'logging':
    case 'snmp':
    case 'config':
    case 'nms':
      drawMonitor(app, parent, cx, cy - 1, color);
      pline(app, parent, [cx - 7, cy - 5, cx - 2, cy, cx + 2, cy - 4, cx + 7, cy + 1], color, 1.35);
      break;
    case 'plc':
    case 'rtu':
    case 'modbus':
    case 'esp32':
    case 'raspberryPi':
      R(app, parent, cx - 13, cy - 11, 26, 22, color, 1.7, 2.5);
      for (let i = 0; i < 4; i++) {
        C(
          app,
          parent,
          cx - 6 + (i % 2) * 12,
          cy - 4 + Math.floor(i / 2) * 10,
          2.2,
          color,
          1,
          i < 2 ? color : null
        );
      }
      break;
    case 'hmi':
    case 'scada':
    case 'infotainment':
      drawMonitor(app, parent, cx, cy, color);
      break;
    case 'opcua':
    case 'sensor':
      C(app, parent, cx, cy - 1, 8.5, color);
      C(app, parent, cx, cy - 1, 3.2, color, 1, color);
      L(app, parent, cx, cy + 7.5, 0, 7, color, 1.6);
      C(app, parent, cx, cy + 15, 1.8, color, 1, color);
      break;
    case 'actuator':
      R(app, parent, cx - 4.5, cy - 13, 9, 14, color, 1.55, 1.5);
      C(app, parent, cx, cy + 7, 7, color);
      C(app, parent, cx, cy + 7, 3, color, 1, color);
      break;
    case 'ecu':
    case 'adas':
    case 'telematics':
      R(app, parent, cx - 13, cy - 9, 26, 18, color, 1.7, 2.5);
      for (let i = 0; i < 3; i++) {
        L(app, parent, cx - 13, cy - 4 + i * 5, -5, 0, color, 1.3);
        L(app, parent, cx + 13, cy - 4 + i * 5, 5, 0, color, 1.3);
      }
      R(app, parent, cx - 5, cy - 4, 10, 8, color, 1.2, 1);
      break;
    case 'canBus':
    case 'linBus':
    case 'flexray':
      L(app, parent, cx - 15, cy, 30, 0, color, 2.2);
      for (const x of [-9, 0, 9]) {
        C(app, parent, cx + x, cy, 3.2, color);
        L(app, parent, cx + x, cy + 3.2, 0, 5, color, 1.3);
      }
      break;
    case 'gps':
    case 'satellite':
      poly(app, parent, [cx, cy - 13, cx + 9, cy + 4, cx - 9, cy + 4], color, 1.7);
      C(app, parent, cx, cy + 8, 3.5, color, 1.4, color);
      C(app, parent, cx, cy + 8, 7, color, 1.2);
      break;
    case 'camera':
      R(app, parent, cx - 13, cy - 8, 26, 16, color, 1.7, 4);
      C(app, parent, cx, cy, 5.5, color);
      C(app, parent, cx, cy, 2.4, color, 1, color);
      R(app, parent, cx + 8, cy - 11, 5, 4, color, 1.2, 1);
      break;
    case 'radar':
    case 'lidar':
      C(app, parent, cx, cy, 3.5, color, 1, color);
      for (const r of [8, 12, 16]) C(app, parent, cx, cy, r, color, 1.25);
      L(app, parent, cx, cy, 12, -9, color, 1.45);
      break;
    case 'isp':
    case 'dnsProvider':
    case 'emailService':
    case 'authProvider':
    case 'payment':
    case 'thirdPartyApi':
    case 'mapsApi':
    case 'sms':
    case 'push':
      drawCloudShape(app, parent, cx, cy - 3, color);
      R(app, parent, cx - 8, cy + 8, 16, 7, color, 1.35, 2);
      break;
    case 'ethernet':
    case 'fiber':
    case 'mpls':
    case 'sdwan':
    case 'serial':
    case 'usb':
      L(app, parent, cx - 14, cy, 28, 0, color, 2.1);
      R(app, parent, cx - 17, cy - 5, 7, 10, color, 1.45, 1.5);
      R(app, parent, cx + 10, cy - 5, 7, 10, color, 1.45, 1.5);
      if (kind === 'fiber') {
        C(app, parent, cx, cy - 6, 2, color, 1, color);
      }
      break;
    case 'bluetooth':
    case 'zigbee':
    case 'lorawan':
    case 'cellular':
      L(app, parent, cx, cy - 12, 0, 24, color, 1.75);
      for (const sign of [-1, 1] as const) {
        pline(
          app,
          parent,
          quadraticToPoints(cx, cy - 5, cx + sign * 9, cy, cx, cy + 5, 8),
          color,
          1.45
        );
        pline(
          app,
          parent,
          quadraticToPoints(cx, cy - 2, cx + sign * 5, cy, cx, cy + 2, 5),
          color,
          1.25
        );
      }
      break;
    default:
      drawCloudShape(app, parent, cx, cy, color);
      break;
  }
}

/** @deprecated internal helper for tests */
export function __networkAliasCount(): number {
  return Object.keys(ALIASES).length;
}
