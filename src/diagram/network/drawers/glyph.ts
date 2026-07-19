/**
 * Network icon glyph dispatch.
 */
import type { App } from '../../../App';
import type { Group } from '../../../shapes/Group';
import type { NetworkIconKind } from '../types';
import { NETWORK_ALIASES } from '../aliases';
import { quadraticToPoints } from '../../pathUtils';
import {
  C,
  L,
  R,
  drawCloudShape,
  drawCylinder,
  drawGlobe,
  drawLoadBalancer,
  drawMonitor,
  drawRouterHex,
  drawServerRack,
  drawShield,
  drawSwitchBody,
  drawWifiArcs,
  drawZoneBox,
  pline,
  poly,
} from './helpers';

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
  return Object.keys(NETWORK_ALIASES).length;
}
