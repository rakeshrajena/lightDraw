/**
 * Diagram builders integrity — public factory exports remain available.
 */
import { describe, it, expect } from 'vitest';
import * as defs from '../../src/diagram/definitions';
import { createTestApp, createTestContainer } from '../helpers';

const BUILDERS = [
  'createFlowchart',
  'createStateMachine',
  'createClassDiagram',
  'createMindMap',
  'createNetworkDiagram',
  'createNetworkIconCatalog',
  'createOrgChart',
  'createSchematic',
  'createSchematicSymbolCatalog',
  'createCanNetwork',
  'createPipeline',
  'createPipelineSymbolCatalog',
  'toggleOrgCollapse',
  'applyForceLayout',
  'wireOrgCollapseControls',
  'createDiagramFromProps',
] as const;

describe('Diagram definitions structure', () => {
  it('exports every diagram builder', () => {
    const missing = BUILDERS.filter((name) => typeof (defs as Record<string, unknown>)[name] !== 'function');
    expect(missing, `missing: ${missing.join(', ')}`).toEqual([]);
  });

  it('dispatches createDiagramFromProps for known types', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'canvas' });
    const flow = defs.createDiagramFromProps(
      'flowchart',
      {
        data: {
          nodes: [{ id: 'a', label: 'A', type: 'process', x: 0, y: 0 }],
          edges: [],
        },
      },
      app
    );
    expect(flow).toBeTruthy();
    expect(flow!.children.length).toBeGreaterThan(0);
    expect(defs.createDiagramFromProps('unknownType', {}, app)).toBeNull();
    app.destroy();
  });
});
