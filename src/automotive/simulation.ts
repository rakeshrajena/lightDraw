import type { Node } from '../Node';
import type { Group } from '../shapes/Group';
import { TextNode } from '../shapes/index';
import { getParts, setAutoValue, setState } from './helpers';

export interface DriveState {
  speed?: number;
  rpm?: number;
  fuel?: number;
  engineTemp?: number;
  batteryVoltage?: number;
  tpms?: number[];
  parkingBrake?: boolean;
  headlights?: boolean;
  cruiseSpeed?: number;
  gear?: string;
  turnLeft?: boolean;
  turnRight?: boolean;
  signals?: Record<string, number | string>;
  [key: string]: unknown;
}

const VALUE_KEY: Record<string, string> = {
  speedometer: 'speed',
  tachometer: 'rpm',
  fuelGauge: 'fuel',
  engineTemp: 'engineTemp',
  batteryVoltage: 'batteryVoltage',
  cruiseControl: 'cruiseSpeed',
  gearIndicator: 'gear',
};

type RefreshFn = (v: number) => void;

function walkParts(node: Node, fn: (part: Node) => void): void {
  fn(node);
  if ('children' in node) {
    for (const child of (node as Group).children) {
      walkParts(child, fn);
    }
  }
}

/** Apply a JSON drive feed to all autoPart nodes in a cluster tree. */
export function applyDriveState(root: Node, state: DriveState): void {
  walkParts(root, (node) => {
    const part = node.metadata?.autoPart as string | undefined;
    if (!part) return;

    if (part === 'tpms' && state.tpms) {
      setState(node, { pressures: state.tpms });
      (node.metadata.refresh as ((v: number[]) => void) | undefined)?.(state.tpms);
      return;
    }

    if ((part === 'canViewer' || part === 'canBusSignalMonitor') && state.signals) {
      setState(node, { signals: state.signals });
      (node.metadata.refresh as ((s: Record<string, number | string>) => void) | undefined)?.(state.signals);
      return;
    }

    if (part === 'turnIndicators' && (state.turnLeft !== undefined || state.turnRight !== undefined)) {
      const left = state.turnLeft ?? false;
      const right = state.turnRight ?? false;
      setState(node, { left, right });
      (node.metadata.refresh as ((l: boolean, r: boolean) => void) | undefined)?.(left, right);
      return;
    }

    const mapped = VALUE_KEY[part] ?? part;
    const raw = state[mapped] ?? state[part];

    if (typeof raw === 'number' && typeof node.metadata.refresh === 'function') {
      if (part === 'cruiseControl') {
        setState(node, { speed: raw, active: raw > 0 });
      } else {
        setAutoValue(node, 'value', raw);
      }
      (node.metadata.refresh as RefreshFn)(raw);
      return;
    }

    if (typeof raw === 'boolean') {
      setState(node, { active: raw });
      (node.metadata.boolRefresh as ((v: boolean) => void) | undefined)?.(raw);
      return;
    }

    if (typeof raw === 'string') {
      setState(node, { gear: raw, status: raw, text: raw });
      (node.metadata.textRefresh as ((t: string) => void) | undefined)?.(raw);
      if (part === 'gearIndicator') {
        const label = getParts(node).label as TextNode | undefined;
        if (label) label.text = raw;
      }
    }
  });
  root.getApp()?.requestRender();
}

/** Sample drive frames for simulation demos. */
export function sampleDriveFrames(count = 60): DriveState[] {
  const frames: DriveState[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / count;
    frames.push({
      speed: Math.round(30 + Math.sin(t * Math.PI * 2) * 40 + t * 30),
      rpm: Math.round(1500 + Math.sin(t * Math.PI * 4) * 2000 + t * 1500),
      fuel: Math.max(5, Math.round(80 - t * 40)),
      engineTemp: Math.round(70 + t * 40 + Math.sin(t * 10) * 5),
      batteryVoltage: Math.round((12.2 + Math.sin(t * 5) * 0.3) * 10) / 10,
      stateOfCharge: Math.max(10, Math.round(85 - t * 30)),
      tpms: [32, 31, 33, 32].map((p, j) => (i > 40 && j === 2 ? 22 : p)),
      parkingBrake: i < 5,
      headlights: i > 10,
      cruiseSpeed: i > 20 && i < 50 ? 65 : 0,
      gear: i < 5 ? 'P' : 'D',
      turnLeft: i % 30 < 5,
      turnRight: i % 30 > 25,
      adasStatus: i > 30 ? 'active' : 'standby',
      signals: {
        'engine.rpm': Math.round(1500 + t * 3000),
        'vehicle.speed': Math.round(30 + t * 60),
        'battery.voltage': 12.4,
      },
    });
  }
  return frames;
}
