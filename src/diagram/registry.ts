/** Side-effect: register all diagram types (Phase 9). */
import './definitions';

export {
  registerDiagram,
  createDiagramFromJSON,
  registry,
} from './registryCore';

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
