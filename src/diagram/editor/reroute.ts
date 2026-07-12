import type { App } from '../../App';
import type { Group } from '../../shapes/Group';
import { connectNodes } from '../connectors';
import { getActiveDiagram } from '../theme';
import { collectObstacles } from '../router';
import {
  collectEditableNodes,
  collectEdgesFromLayer,
  findEdgeLayer,
  findNodeByDiagramId,
} from './collect';
import type { DiagramEdge } from '../types';
import type { EditorEdgeRecord } from './types';

/** Rebuild all connectors in the diagram edge layer from stored edge metadata. */
export function rerouteDiagramEdges(app: App, root: Group, edges?: EditorEdgeRecord[]): void {
  const edgeLayer = findEdgeLayer(root);
  if (!edgeLayer) return;

  const records = edges ?? collectEdgesFromLayer(edgeLayer);
  const nodeMap = new Map(collectEditableNodes(root).map((n) => [n.metadata.diagramId as string, n]));

  for (const child of [...edgeLayer.children]) {
    edgeLayer.remove(child);
    child.destroy();
  }

  const obstacles = collectObstacles([...nodeMap.values()]);
  for (const edge of records) {
    const from = findNodeByDiagramId(root, edge.from) ?? nodeMap.get(edge.from);
    const to = findNodeByDiagramId(root, edge.to) ?? nodeMap.get(edge.to);
    if (!from || !to) continue;
    edgeLayer.add(
      connectNodes(app, from, to, obstacles, {
        parent: root,
        stroke: edge.options?.stroke ?? getActiveDiagram().edge,
        glowColor: edge.options?.glowColor ?? getActiveDiagram().edgeGlow,
        strokeWidth: edge.options?.strokeWidth ?? getActiveDiagram().stroke.edge,
        label: edge.label,
        style: edge.options?.style ?? 'smart',
        arrowEnd: edge.options?.arrowEnd ?? 'filled',
        arrowStart: edge.options?.arrowStart ?? 'none',
        dash: edge.options?.dash,
        edgeId: edge.id,
        fromId: edge.from,
        toId: edge.to,
      })
    );
  }
  root.markDirty();
}

/** Persist node positions into diagramState for JSON round-trip. */
export function syncPositionsToState(root: Group): void {
  const state = { ...(root.metadata?.diagramState as Record<string, unknown> | undefined) };
  const type = root.metadata?.diagramType as string | undefined;
  const nodes = collectEditableNodes(root);

  const positions: Record<string, { x: number; y: number; scaleX?: number; scaleY?: number }> = {};
  for (const n of nodes) {
    const id = n.metadata?.diagramId as string;
    if (!id) continue;
    positions[id] = { x: n.x, y: n.y, scaleX: n.scaleX, scaleY: n.scaleY };
  }
  state.editorPositions = positions;

  if (type === 'flowchart' || type === 'networkTopology') {
    const data = state.data as { nodes: Array<{ id: string; x?: number; y?: number }> } | undefined;
    if (data?.nodes) {
      for (const n of data.nodes) {
        const p = positions[n.id];
        if (p) {
          n.x = p.x;
          n.y = p.y;
        }
      }
      state.data = data;
    }
  }

  if (type === 'stateMachine') {
    const data = state.data as {
      states: Array<{ id: string; x?: number; y?: number }>;
    } | undefined;
    if (data?.states) {
      for (const s of data.states) {
        const p = positions[s.id];
        if (p) {
          s.x = p.x;
          s.y = p.y;
        }
      }
      state.data = data;
    }
  }

  if (type === 'processPipeline') {
    const stages = state.stages as Array<{ id: string }> | undefined;
    if (stages) {
      state.stages = stages.map((s) => {
        const p = positions[s.id];
        return p ? { ...s, x: p.x, y: p.y } : s;
      });
    }
  }

  root.metadata.diagramState = state;
}

export function syncEdgesToState(root: Group): void {
  const edgeLayer = findEdgeLayer(root);
  if (!edgeLayer) return;
  const edges = collectEdgesFromLayer(edgeLayer);
  const state = { ...(root.metadata?.diagramState as Record<string, unknown> | undefined) };
  state.editorEdges = edges;

  const type = root.metadata?.diagramType as string | undefined;
  if (type === 'flowchart' || type === 'networkTopology') {
    const data = state.data as { edges: DiagramEdge[] } | undefined;
    if (data) {
      data.edges = edges.map((e) => ({ from: e.from, to: e.to, label: e.label }));
      state.data = data;
    }
  }
  if (type === 'stateMachine') {
    const data = state.data as { transitions: DiagramEdge[] } | undefined;
    if (data) {
      data.transitions = edges.map((e) => ({ from: e.from, to: e.to, label: e.label }));
      state.data = data;
    }
  }

  root.metadata.diagramState = state;
}
