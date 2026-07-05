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
}

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

    if (part === 'speedometer' && state.speed !== undefined) {
      setAutoValue(node, 'value', state.speed);
    }
    if (part === 'tachometer' && state.rpm !== undefined) {
      setAutoValue(node, 'value', state.rpm);
    }
    if (part === 'fuelGauge' && state.fuel !== undefined) {
      setAutoValue(node, 'value', state.fuel);
    }
    if (part === 'engineTemp' && state.engineTemp !== undefined) {
      setAutoValue(node, 'value', state.engineTemp);
    }
    if (part === 'batteryVoltage' && state.batteryVoltage !== undefined) {
      setAutoValue(node, 'value', state.batteryVoltage);
    }
    if (part === 'tpms' && state.tpms) {
      setState(node, { pressures: state.tpms });
      (node.metadata.refresh as ((v: number[]) => void) | undefined)?.(state.tpms);
    }
    if (part === 'parkingBrake' && state.parkingBrake !== undefined) {
      setState(node, { active: state.parkingBrake });
      (node.metadata.boolRefresh as ((v: boolean) => void) | undefined)?.(state.parkingBrake);
    }
    if (part === 'headlights' && state.headlights !== undefined) {
      setState(node, { active: state.headlights });
      (node.metadata.boolRefresh as ((v: boolean) => void) | undefined)?.(state.headlights);
    }
    if (part === 'cruiseControl' && state.cruiseSpeed !== undefined) {
      setState(node, { speed: state.cruiseSpeed, active: state.cruiseSpeed > 0 });
      (node.metadata.refresh as RefreshFn | undefined)?.(state.cruiseSpeed);
    }
    if (part === 'gearIndicator' && state.gear !== undefined) {
      setState(node, { gear: state.gear });
      const label = getParts(node).label as TextNode | undefined;
      if (label) label.text = state.gear;
    }
    if (part === 'turnIndicators') {
      if (state.turnLeft !== undefined || state.turnRight !== undefined) {
        setState(node, { left: state.turnLeft ?? false, right: state.turnRight ?? false });
        (node.metadata.refresh as ((l: boolean, r: boolean) => void) | undefined)?.(
          state.turnLeft ?? false,
          state.turnRight ?? false
        );
      }
    }
    if (part === 'canViewer' && state.signals) {
      setState(node, { signals: state.signals });
      (node.metadata.refresh as ((s: Record<string, number | string>) => void) | undefined)?.(
        state.signals
      );
    }
  });
  root.getApp()?.requestRender();
}

type RefreshFn = (v: number) => void;

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
      tpms: [32, 31, 33, 32].map((p, j) => (i > 40 && j === 2 ? 22 : p)),
      parkingBrake: i < 5,
      headlights: i > 10,
      cruiseSpeed: i > 20 && i < 50 ? 65 : 0,
      gear: i < 5 ? 'P' : i < 10 ? 'D' : 'D',
      turnLeft: i % 30 < 5,
      turnRight: i % 30 > 25,
      signals: {
        'engine.rpm': Math.round(1500 + t * 3000),
        'vehicle.speed': Math.round(30 + t * 60),
        'battery.voltage': 12.4,
      },
    });
  }
  return frames;
}
