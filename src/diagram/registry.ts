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
export { diagramToJSON, fitDiagramToBounds, resolveGridLayout, readCanvasSize } from './helpers';
export { installDiagramEditor, uninstallDiagramEditor, DiagramEditor } from './editor';
export {
  DIAGRAM,
  resolveDiagramTheme,
  getActiveDiagram,
  getDiagramTheme,
  syncActiveDiagramTheme,
  runWithDiagramTheme,
  diagramPackFromApp,
} from './theme';
export type { DiagramTheme } from './theme';
export { refreshDiagram, installDiagramRebuild } from './refresh';

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
