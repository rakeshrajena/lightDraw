import { describe, it, expect, afterEach } from 'vitest';
import {
  createAutomotiveFromJSON,
  applyDriveState,
  listAutomotiveWidgets,
} from '../../src/automotive/registry';
import { getState } from '../../src/automotive/helpers';
import { createTestApp, createTestContainer } from '../helpers';

describe('P0 automotive telltales', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('registers MIL, low beam, parking light, and pedestrian detection', () => {
    const types = listAutomotiveWidgets();
    expect(types).toContain('checkEngineLamp');
    expect(types).toContain('milStatus');
    expect(types).toContain('lowBeamStatus');
    expect(types).toContain('parkingLightStatus');
    expect(types).toContain('pedestrianDetection');
  });

  it('creates check-engine lamp with amber active state', () => {
    const container = createTestContainer(80, 80);
    const app = createTestApp(container, { renderer: 'html', width: 80, height: 80 });
    const lamp = createAutomotiveFromJSON('checkEngineLamp', { active: true, width: 40, height: 40 }, app)!;
    expect(lamp).toBeTruthy();
    expect(getState(lamp).active).toBe(true);
    expect(lamp.metadata.autoPart).toBe('checkEngineLamp');
  });

  it('alias milStatus builds the same check-engine lamp', () => {
    const container = createTestContainer(80, 80);
    const app = createTestApp(container, { renderer: 'html', width: 80, height: 80 });
    const lamp = createAutomotiveFromJSON('milStatus', { active: true, width: 36, height: 36 }, app)!;
    expect(lamp).toBeTruthy();
    expect(getState(lamp).active).toBe(true);
  });

  it('applyDriveState updates P0 telltales on a composed group', () => {
    const container = createTestContainer(400, 200);
    const app = createTestApp(container, { renderer: 'html', width: 400, height: 200 });
    app.loadJSON({
      type: 'group',
      children: [
        { type: 'checkEngineLamp', props: { active: false, width: 36, height: 36, x: 8, y: 8 } },
        { type: 'lowBeamStatus', props: { active: false, width: 36, height: 36, x: 52, y: 8 } },
        { type: 'parkingLightStatus', props: { active: false, width: 36, height: 36, x: 96, y: 8 } },
        { type: 'pedestrianDetection', props: { status: 'clear', width: 100, height: 32, x: 140, y: 8 } },
      ],
    });

    applyDriveState(app.stage, {
      checkEngine: true,
      lowBeam: true,
      parkingLight: true,
      pedestrian: 'warning',
    });

    const parts = new Map<string, ReturnType<typeof getState>>();
    const walk = (node: { metadata?: { autoPart?: string }; children?: unknown[] }) => {
      const part = node.metadata?.autoPart;
      if (part) parts.set(part, getState(node as Parameters<typeof getState>[0]));
      for (const child of node.children ?? []) walk(child as typeof node);
    };
    walk(app.stage as { metadata?: { autoPart?: string }; children?: unknown[] });

    expect(parts.get('checkEngineLamp')?.active).toBe(true);
    expect(parts.get('lowBeamStatus')?.active).toBe(true);
    expect(parts.get('parkingLightStatus')?.active).toBe(true);
    expect(parts.get('pedestrianDetection')?.status).toBe('warning');
  });
});
