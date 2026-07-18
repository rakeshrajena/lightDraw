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

function L(
  app: App,
  parent: Group,
  x: number,
  y: number,
  x2: number,
  y2: number,
  color: string,
  sw = 1.5
): void {
  parent.add(
    app.line({
      x,
      y,
      x2,
      y2,
      stroke: color,
      strokeWidth: sw,
      lineCap: 'round',
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
  sw = 1.5,
  cr = 2,
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

function C(
  app: App,
  parent: Group,
  x: number,
  y: number,
  r: number,
  color: string,
  sw = 1.5,
  fill: string | null = null
): void {
  parent.add(
    app.circle({ x, y, radius: r, fill, stroke: color, strokeWidth: sw, listening: false })
  );
}

function poly(
  app: App,
  parent: Group,
  points: number[],
  color: string,
  sw = 1.5
): void {
  parent.add(
    app.polygon({ points, fill: null, stroke: color, strokeWidth: sw, listening: false })
  );
}

function drawCloudShape(app: App, parent: Group, cx: number, cy: number, color: string): void {
  C(app, parent, cx - 7, cy + 2, 7, color);
  C(app, parent, cx + 6, cy + 1, 8, color);
  C(app, parent, cx, cy - 5, 6.5, color);
}

function drawRouterHex(app: App, parent: Group, cx: number, cy: number, size: number, color: string): void {
  const r = size * 0.28;
  const hex: number[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    hex.push(cx + r * Math.cos(a), cy + 4 + r * Math.sin(a));
  }
  poly(app, parent, hex, color);
  C(app, parent, cx, cy + 4, 3, color, 1, color);
  for (const sign of [-1, 1] as const) {
    parent.add(
      app.polyline({
        points: quadraticToPoints(cx + sign * 6, cy - 6, cx + sign * 14, cy - 14, cx + sign * 4, cy - 18, 6),
        fill: null,
        stroke: color,
        strokeWidth: 1.4,
        lineCap: 'round',
        lineJoin: 'round',
        listening: false,
      })
    );
  }
}

function drawServerRack(app: App, parent: Group, cx: number, cy: number, color: string): void {
  R(app, parent, cx - 14, cy - 14, 28, 28, color, 1.6, 3);
  for (let i = 0; i < 3; i++) {
    const y = cy - 10 + i * 8;
    R(app, parent, cx - 10, y, 16, 5, color, 1.1, 1);
    C(app, parent, cx + 9, y + 2.5, 1.4, color, 1, i === 0 ? color : null);
  }
}

function drawSwitchBody(app: App, parent: Group, cx: number, cy: number, color: string): void {
  R(app, parent, cx - 16, cy - 8, 32, 16, color, 1.6, 3);
  for (let i = 0; i < 6; i++) {
    R(app, parent, cx - 13 + i * 4.4, cy - 3, 3.2, 6, color, 0.9, 0.6, i % 2 === 0 ? color : null);
  }
  L(app, parent, cx - 14, cy - 11, 28, 0, color, 1.2);
}

function drawMonitor(app: App, parent: Group, cx: number, cy: number, color: string): void {
  R(app, parent, cx - 13, cy - 12, 26, 18, color, 1.6, 2.5);
  R(app, parent, cx - 10, cy - 9, 20, 12, color, 1, 1.5);
  L(app, parent, cx, cy + 6, 0, 5, color);
  L(app, parent, cx - 7, cy + 12, 14, 0, color);
}

function drawShield(app: App, parent: Group, cx: number, cy: number, color: string): void {
  poly(app, parent, [cx, cy - 14, cx + 12, cy - 8, cx + 12, cy + 4, cx, cy + 14, cx - 12, cy + 4, cx - 12, cy - 8], color);
  L(app, parent, cx - 5, cy, 5, 5, color, 1.4);
  L(app, parent, cx, cy + 5, 6, -8, color, 1.4);
}

function drawCylinder(app: App, parent: Group, cx: number, cy: number, color: string): void {
  R(app, parent, cx - 10, cy - 6, 20, 14, color, 1.5, 2);
  R(app, parent, cx - 10, cy - 12, 20, 8, color, 1.3, 8);
  R(app, parent, cx - 10, cy + 4, 20, 8, color, 1.3, 8);
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
      C(app, parent, cx, cy, 12, color);
      L(app, parent, cx - 12, cy, 24, 0, color, 1.2);
      L(app, parent, cx, cy - 12, 0, 24, color, 1.2);
      C(app, parent, cx, cy, 7, color, 1.2);
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
      drawRouterHex(app, parent, cx, cy - 2, size, color);
      break;
    case 'switch':
    case 'industrialSwitch':
      drawSwitchBody(app, parent, cx, cy, color);
      break;
    case 'hub':
      C(app, parent, cx, cy, 5, color, 1.5, color);
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i;
        L(app, parent, cx + Math.cos(a) * 6, cy + Math.sin(a) * 6, Math.cos(a) * 10, Math.sin(a) * 10, color, 1.3);
        C(app, parent, cx + Math.cos(a) * 16, cy + Math.sin(a) * 16, 2.2, color, 1, color);
      }
      break;
    case 'bridge':
      R(app, parent, cx - 16, cy - 4, 12, 8, color, 1.4, 2);
      R(app, parent, cx + 4, cy - 4, 12, 8, color, 1.4, 2);
      L(app, parent, cx - 4, cy, 8, 0, color, 2);
      break;
    case 'repeater':
    case 'extender':
      C(app, parent, cx - 8, cy, 5, color);
      C(app, parent, cx + 8, cy, 5, color);
      L(app, parent, cx - 3, cy, 6, 0, color, 1.5);
      break;
    case 'modem':
      R(app, parent, cx - 14, cy - 6, 28, 14, color, 1.5, 3);
      for (let i = 0; i < 3; i++) C(app, parent, cx - 6 + i * 6, cy, 1.8, color, 1, color);
      L(app, parent, cx, cy - 10, 0, -4, color, 1.4);
      break;
    case 'wlc':
    case 'wap':
    case 'mesh':
    case 'wifi':
      C(app, parent, cx, cy + 6, 2.5, color, 1, color);
      for (const r of [6, 10, 14]) {
        parent.add(
          app.polyline({
            points: quadraticToPoints(cx - r, cy + 2, cx, cy - r * 0.6, cx + r, cy + 2, 8),
            fill: null,
            stroke: color,
            strokeWidth: 1.3,
            lineCap: 'round',
            listening: false,
          })
        );
      }
      break;
    case 'firewall':
    case 'ngfw':
    case 'waf':
    case 'swg':
    case 'bastion':
      drawShield(app, parent, cx, cy, color);
      break;
    case 'vpn':
    case 'vpnTunnel':
      R(app, parent, cx - 12, cy - 6, 24, 14, color, 1.5, 3);
      L(app, parent, cx - 6, cy, 4, 0, color);
      L(app, parent, cx + 2, cy, 4, 0, color);
      C(app, parent, cx, cy, 3, color);
      break;
    case 'ids':
    case 'ips':
    case 'siem':
    case 'nac':
      drawShield(app, parent, cx, cy, color);
      C(app, parent, cx, cy - 1, 3.5, color);
      break;
    case 'proxy':
    case 'reverseProxy':
    case 'apiGateway':
    case 'loadBalancer':
      R(app, parent, cx - 4, cy - 10, 8, 8, color, 1.4, 2);
      L(app, parent, cx, cy - 2, 0, 6, color);
      L(app, parent, cx - 10, cy + 8, 20, 0, color);
      L(app, parent, cx - 10, cy + 8, 0, 6, color);
      L(app, parent, cx, cy + 8, 0, 6, color);
      L(app, parent, cx + 10, cy + 8, 0, 6, color);
      break;
    case 'server':
    case 'hypervisor':
    case 'k8sNode':
      drawServerRack(app, parent, cx, cy, color);
      break;
    case 'vm':
      drawServerRack(app, parent, cx, cy, color);
      R(app, parent, cx - 6, cy - 6, 12, 10, color, 1.2, 1);
      break;
    case 'container':
      R(app, parent, cx - 12, cy - 8, 24, 16, color, 1.5, 2);
      L(app, parent, cx - 12, cy, 24, 0, color, 1.2);
      L(app, parent, cx, cy - 8, 0, 16, color, 1.2);
      break;
    case 'k8s':
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        L(app, parent, cx, cy, Math.cos(a) * 12, Math.sin(a) * 12, color, 1.4);
      }
      C(app, parent, cx, cy, 4, color, 1.4, color);
      break;
    case 'serverless':
      poly(app, parent, [cx + 2, cy - 12, cx - 6, cy + 2, cx + 1, cy + 2, cx - 2, cy + 12, cx + 6, cy - 2, cx - 1, cy - 2], color);
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
      R(app, parent, cx - 14, cy - 12, 28, 24, color, 1.5, 3);
      for (let i = 0; i < 3; i++) L(app, parent, cx - 10, cy - 6 + i * 6, 20, 0, color, 1.2);
      break;
    case 'desktop':
    case 'workstation':
    case 'thinClient':
      drawMonitor(app, parent, cx, cy, color);
      break;
    case 'laptop':
      R(app, parent, cx - 14, cy - 10, 28, 16, color, 1.5, 2);
      R(app, parent, cx - 16, cy + 6, 32, 5, color, 1.4, 1);
      break;
    case 'phone':
      R(app, parent, cx - 7, cy - 14, 14, 26, color, 1.5, 3);
      C(app, parent, cx, cy + 9, 1.5, color, 1, color);
      break;
    case 'tablet':
      R(app, parent, cx - 11, cy - 14, 22, 28, color, 1.5, 3);
      C(app, parent, cx, cy + 11, 1.3, color, 1, color);
      break;
    case 'printer':
      R(app, parent, cx - 12, cy - 4, 24, 12, color, 1.5, 2);
      R(app, parent, cx - 8, cy - 12, 16, 10, color, 1.3, 1);
      R(app, parent, cx - 8, cy + 6, 16, 6, color, 1.3, 1);
      break;
    case 'scanner':
      R(app, parent, cx - 14, cy - 4, 28, 10, color, 1.5, 2);
      L(app, parent, cx - 10, cy, 20, 0, color, 1.2);
      break;
    case 'ipPhone':
      R(app, parent, cx - 10, cy - 8, 20, 16, color, 1.5, 2);
      L(app, parent, cx + 10, cy - 2, 6, -6, color, 1.4);
      break;
    case 'smartTv':
      R(app, parent, cx - 16, cy - 10, 32, 18, color, 1.5, 2);
      L(app, parent, cx, cy + 8, 0, 4, color);
      L(app, parent, cx - 8, cy + 12, 16, 0, color);
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
      R(app, parent, cx - 14, cy - 10, 28, 20, color, 1.4, 3);
      parent.add(
        app.roundedRect({
          x: cx - 14,
          y: cy - 10,
          width: 28,
          height: 20,
          cornerRadius: 3,
          fill: null,
          stroke: color,
          strokeWidth: 1.2,
          dash: [3, 2],
          listening: false,
        })
      );
      break;
    case 'queue':
    case 'kafka':
    case 'rabbitmq':
    case 'mqtt':
    case 'eventBus':
    case 'serviceBus':
      for (let i = 0; i < 3; i++) R(app, parent, cx - 12, cy - 10 + i * 8, 24, 6, color, 1.3, 1);
      break;
    case 'monitor':
    case 'logging':
    case 'snmp':
    case 'config':
    case 'nms':
      drawMonitor(app, parent, cx, cy - 2, color);
      L(app, parent, cx - 6, cy - 4, 12, 0, color, 1.2);
      break;
    case 'plc':
    case 'rtu':
    case 'modbus':
    case 'esp32':
    case 'raspberryPi':
      R(app, parent, cx - 12, cy - 10, 24, 20, color, 1.5, 2);
      for (let i = 0; i < 4; i++) C(app, parent, cx - 6 + (i % 2) * 12, cy - 4 + Math.floor(i / 2) * 10, 2, color, 1, i < 2 ? color : null);
      break;
    case 'hmi':
    case 'scada':
    case 'infotainment':
      drawMonitor(app, parent, cx, cy, color);
      break;
    case 'opcua':
    case 'sensor':
      C(app, parent, cx, cy, 8, color);
      C(app, parent, cx, cy, 3, color, 1, color);
      L(app, parent, cx, cy + 8, 0, 6, color);
      break;
    case 'actuator':
      R(app, parent, cx - 4, cy - 12, 8, 16, color, 1.4, 1);
      C(app, parent, cx, cy + 8, 6, color);
      break;
    case 'ecu':
    case 'adas':
    case 'telematics':
      R(app, parent, cx - 12, cy - 8, 24, 16, color, 1.5, 2);
      for (let i = 0; i < 3; i++) {
        L(app, parent, cx - 12, cy - 4 + i * 4, -4, 0, color, 1.2);
        L(app, parent, cx + 12, cy - 4 + i * 4, 4, 0, color, 1.2);
      }
      break;
    case 'canBus':
    case 'linBus':
    case 'flexray':
      L(app, parent, cx - 14, cy, 28, 0, color, 2);
      for (const x of [-8, 0, 8]) C(app, parent, cx + x, cy, 3, color, 1.2);
      break;
    case 'gps':
    case 'satellite':
      C(app, parent, cx, cy + 4, 4, color, 1.4, color);
      poly(app, parent, [cx, cy - 12, cx + 8, cy + 2, cx - 8, cy + 2], color);
      break;
    case 'camera':
      R(app, parent, cx - 12, cy - 8, 24, 16, color, 1.5, 3);
      C(app, parent, cx, cy, 5, color);
      C(app, parent, cx, cy, 2, color, 1, color);
      break;
    case 'radar':
    case 'lidar':
      C(app, parent, cx, cy, 4, color, 1, color);
      for (const r of [8, 12]) C(app, parent, cx, cy, r, color, 1.2);
      L(app, parent, cx, cy, 10, -8, color, 1.3);
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
      drawCloudShape(app, parent, cx, cy - 2, color);
      R(app, parent, cx - 6, cy + 6, 12, 6, color, 1.2, 1);
      break;
    case 'ethernet':
    case 'fiber':
    case 'mpls':
    case 'sdwan':
    case 'serial':
    case 'usb':
      L(app, parent, cx - 14, cy, 28, 0, color, 2);
      R(app, parent, cx - 16, cy - 4, 6, 8, color, 1.3, 1);
      R(app, parent, cx + 10, cy - 4, 6, 8, color, 1.3, 1);
      break;
    case 'bluetooth':
    case 'zigbee':
    case 'lorawan':
    case 'cellular':
      L(app, parent, cx, cy - 10, 0, 20, color, 1.6);
      for (const sign of [-1, 1] as const) {
        parent.add(
          app.polyline({
            points: quadraticToPoints(cx, cy - 4, cx + sign * 8, cy, cx, cy + 4, 6),
            fill: null,
            stroke: color,
            strokeWidth: 1.3,
            listening: false,
          })
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
