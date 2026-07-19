/**
 * Diagram primitives integrity — public factories remain exported.
 */
import { describe, it, expect } from 'vitest';
import * as primitives from '../../src/diagram/primitives';
import { createTestApp, createTestContainer } from '../helpers';

const FACTORIES = [
  'createLabeledBox',
  'createFlowchartNode',
  'createClassNode',
  'createNetworkNode',
  'createOrgNode',
  'createPipelineStage',
  'createStateNode',
  'createCanEcuNode',
  'createEdgeLabel',
] as const;

describe('Diagram primitives structure', () => {
  it('exports every node factory', () => {
    const missing = FACTORIES.filter((name) => typeof (primitives as Record<string, unknown>)[name] !== 'function');
    expect(missing, `missing factories: ${missing.join(', ')}`).toEqual([]);
  });

  it('exports measure helpers and org utilities', () => {
    expect(typeof primitives.measureTextWidth).toBe('function');
    expect(typeof primitives.centerTextX).toBe('function');
    expect(typeof primitives.hashOrgBranchSeed).toBe('function');
    expect(typeof primitives.buildDistinctOrgBranchPalette).toBe('function');
    expect(typeof primitives.resolveOrgBranchStyle).toBe('function');
    expect(typeof primitives.countOrgDescendants).toBe('function');
    expect(typeof primitives.updateOrgCollapseButton).toBe('function');
    expect(typeof primitives.orgInitialsAvatarDataUri).toBe('function');
  });

  it('builds representative nodes without error', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'canvas' });
    const box = primitives.createLabeledBox(app, 'Box', 100, 40);
    const flow = primitives.createFlowchartNode(app, 'Start', 'start');
    const net = primitives.createNetworkNode(app, 'Router', 'router');
    const stage = primitives.createPipelineStage(app, 'Build', 'active', 'build');
    const state = primitives.createStateNode(app, 'Idle', 'normal');
    const ecu = primitives.createCanEcuNode(app, 'ECU', '0x01', '#2563eb');
    const edge = primitives.createEdgeLabel(app, 'ok', 10, 10);
    const org = primitives.createOrgNode(app, { name: 'Ada', role: 'CEO' });
    expect(box.children.length).toBeGreaterThan(0);
    expect(flow.children.length).toBeGreaterThan(0);
    expect(net.children.length).toBeGreaterThan(0);
    expect(stage.children.length).toBeGreaterThan(0);
    expect(state.children.length).toBeGreaterThan(0);
    expect(ecu.children.length).toBeGreaterThan(0);
    expect(edge.children.length).toBeGreaterThan(0);
    expect(org.node.children.length).toBeGreaterThan(0);
    app.destroy();
  });
});
