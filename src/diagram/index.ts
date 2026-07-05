export {
  createFlowchart,
  createStateMachine,
  createClassDiagram,
  createMindMap,
  createNetworkDiagram,
  createOrgChart,
  createSchematic,
  createCanNetwork,
  createPipeline,
  toggleOrgCollapse,
  applyForceLayout,
} from './definitions';

export {
  forceDirectedLayout,
  layoutDiagram,
  radialLayout,
  pipelineLayout,
  layoutNodesForce,
} from './layouts';

export { routeConnector, collectObstacles, getAnchor } from './router';
export type { RouteStyle } from './router';
export { createSymbol, buildSchematic, Symbols } from './symbols';
export { diagramToJSON } from './helpers';

export type {
  DiagramNode,
  DiagramEdge,
  DiagramData,
  StateMachineData,
  ClassDiagramData,
  OrgChartNode,
  PipelineStage,
  CanNetworkData,
  SchematicComponent,
  Obstacle,
} from './types';

export type { ForceLayoutOptions, ForceNode, ForceEdge } from './layouts';

import {
  createFlowchart,
  createStateMachine,
  createClassDiagram,
  createMindMap,
  createNetworkDiagram,
  createOrgChart,
  createSchematic,
  createCanNetwork,
  createPipeline,
  toggleOrgCollapse,
} from './definitions';
import { forceDirectedLayout, layoutDiagram } from './layouts';
import { routeConnector } from './router';

/** Diagram module namespace for plugin install */
export const Diagram = {
  flowchart: createFlowchart,
  stateMachine: createStateMachine,
  classDiagram: createClassDiagram,
  mindMap: createMindMap,
  network: createNetworkDiagram,
  orgChart: createOrgChart,
  schematic: createSchematic,
  canNetwork: createCanNetwork,
  pipeline: createPipeline,
  layout: layoutDiagram,
  route: routeConnector,
  forceLayout: forceDirectedLayout,
  toggleCollapse: toggleOrgCollapse,
};
