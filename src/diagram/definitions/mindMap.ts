/**
 * Diagram builder — mindMap.
 */
import type { App } from '../../App';
import type { Group } from '../../shapes/Group';
import type { NodeOptions } from '../../types';
import { getActiveDiagram } from '../theme';
import {
  createDiagramGroup,
  readCanvasSize,
} from '../helpers';
import {
  createLabeledBox,
} from '../primitives';
import { mindMapLayout } from '../layouts';
import { wireMindMapConnectors } from '../connectors';

/** Create mind map — Mermaid-style left/right tree with smooth horizontal links */
export function createMindMap(
  app: App,
  center: string,
  branches: Array<{ label: string; children?: string[] }>,
  options: NodeOptions = {}
): Group {
  const group = createDiagramGroup(app, 'mindMap', { ...options, center, branches }, { name: 'mindMap' });
  const canvas = readCanvasSize(options as Record<string, unknown>);

  const centerNode = createLabeledBox(
    app,
    center,
    140,
    52,
    {
      fill: getActiveDiagram().mindCenter.fill,
      stroke: getActiveDiagram().mindCenter.stroke,
      cornerRadius: 26,
      strokeWidth: 2,
      shadow: null,
      sheen: false,
    },
    { fontSize: getActiveDiagram().fontSize.lg, fontWeight: '700' }
  );
  centerNode.metadata.diagramId = 'center';
  centerNode.metadata.diagramCardWidth = 140;
  centerNode.metadata.diagramCardHeight = 52;
  group.add(centerNode);

  branches.forEach((branch, bi) => {
    const palette = getActiveDiagram().mindBranchPalette[bi % getActiveDiagram().mindBranchPalette.length];
    const branchNode = createLabeledBox(
      app,
      branch.label,
      112,
      40,
      {
        fill: palette.fill,
        stroke: palette.stroke,
        cornerRadius: 20,
        strokeWidth: 1.75,
        shadow: null,
        sheen: false,
      },
      { fontSize: getActiveDiagram().fontSize.base, fontWeight: '600' }
    );
    branchNode.metadata = {
      diagramId: `branch_${bi}`,
      mindBranchColor: palette.stroke,
      mindBranchGlow: palette.glow,
      diagramCardWidth: 112,
      diagramCardHeight: 40,
    };
    group.add(branchNode);

    if (branch.children) {
      branch.children.forEach((child, ci) => {
        const childNode = createLabeledBox(
          app,
          child,
          96,
          30,
          {
            fill: getActiveDiagram().mindLeaf.fill,
            stroke: palette.stroke,
            cornerRadius: 15,
            strokeWidth: 1.5,
            shadow: null,
            sheen: false,
          },
          { fontSize: getActiveDiagram().fontSize.sm, fontWeight: '500' }
        );
        childNode.metadata.diagramId = `branch_${bi}_leaf_${ci}`;
        childNode.metadata.diagramCardWidth = 96;
        childNode.metadata.diagramCardHeight = 30;
        branchNode.add(childNode);
      });
    }
  });

  mindMapLayout(group, canvas.width, canvas.height);
  wireMindMapConnectors(app, group);
  return group;
}
