export {
  createFlowchart,
  createStateMachine,
  createClassDiagram,
  createMindMap,
  createNetworkDiagram,
  createNetworkIconCatalog,
  createOrgChart,
  createSchematic,
  createSchematicSymbolCatalog,
  createCanNetwork,
  createPipeline,
  createPipelineSymbolCatalog,
  toggleOrgCollapse,
  applyForceLayout,
  wireOrgCollapseControls,
  createDiagramFromProps,
} from './definitions';

export {
  resolveNetworkIconKind,
  listNetworkIconKinds,
  listNetworkTypeAliases,
  drawNetworkIcon,
  getNetworkIconMeta,
} from './networkIcons';
export type { NetworkIconKind, NetworkIconCategory, NetworkIconMeta } from './networkIcons';

export {
  resolveSchematicSymbolKind,
  listSchematicSymbols,
  listSchematicSymbolCategories,
  drawSchematicGlyph,
  getSchematicSymbolMeta,
} from './schematicIcons';
export type { SchematicSymbolCategory, SchematicSymbolMeta } from './schematicIcons';

export {
  resolvePipelineSymbolKind,
  listPipelineSymbols,
  listPipelineSymbolCategories,
  drawPipelineGlyph,
  getPipelineSymbolMeta,
} from './pipelineIcons';
export type { PipelineSymbolCategory, PipelineSymbolMeta } from './pipelineIcons';
export { createPipelineSymbol } from './pipelineSymbols';

export {
  forceDirectedLayout,
  layoutDiagram,
  radialLayout,
  mindMapLayout,
  pipelineLayout,
  layoutNodesForce,
} from './layouts';

export { routeConnector, collectObstacles, collectObstaclesInParent, getAnchor } from './router';
export type { RouteStyle } from './router';
export { canBusHopPoints, ensureCanNetworkFlowEdges, CAN_BUS_TAP } from './canFlow';
export { createSymbol, buildSchematic, rewireSchematic, Symbols } from './symbols';
export { diagramToJSON, fitDiagramToBounds, resolveGridLayout, readCanvasSize, separateOverlappingNodes } from './helpers';
export { installDiagramEditor, uninstallDiagramEditor, DiagramEditor } from './editor';

export type {
  DiagramFlowOptions,
  DiagramFlowMode,
  DiagramFlowHighlight,
  DiagramFlowPlayback,
  DiagramFlowHop,
  DiagramFlowNodeStatus,
  DiagramFlowStatusColors,
} from './flow';
export {
  applyDiagramFlow,
  stopDiagramFlow,
  refreshDiagramFlow,
  pauseDiagramFlow,
  resumeDiagramFlow,
  toggleDiagramFlowPause,
  replayDiagramFlow,
  isDiagramFlowPlaying,
  edgePointsToPathD,
  getEdgeStrokePolyline,
  DEFAULT_FLOW_STATUS_COLORS,
  resolveFlowStatusColors,
  createFlowStatusMap,
  nodeIdsFromHops,
  flowEdgeKey,
  sanitizeStatusOverrides,
  isDiagramFlowNodeStatus,
} from './flow';

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

export type { OrgNodeOptions } from './primitives';
export { orgInitialsAvatarDataUri } from './primitives';

export type { ForceLayoutOptions, ForceNode, ForceEdge } from './layouts';

import {
  createFlowchart,
  createStateMachine,
  createClassDiagram,
  createMindMap,
  createNetworkDiagram,
  createNetworkIconCatalog,
  createOrgChart,
  createSchematic,
  createSchematicSymbolCatalog,
  createCanNetwork,
  createPipeline,
  createPipelineSymbolCatalog,
  toggleOrgCollapse,
  wireOrgCollapseControls,
  createDiagramFromProps,
} from './definitions';
import { forceDirectedLayout, layoutDiagram } from './layouts';
import { fitDiagramToBounds, diagramToJSON } from './helpers';
import { installDiagramEditor, uninstallDiagramEditor } from './editor';
import {
  applyDiagramFlow,
  stopDiagramFlow,
  refreshDiagramFlow,
  pauseDiagramFlow,
  resumeDiagramFlow,
  toggleDiagramFlowPause,
  replayDiagramFlow,
  isDiagramFlowPlaying,
} from './flow';
import { routeConnector } from './router';
import { listNetworkIconKinds, resolveNetworkIconKind } from './networkIcons';
import { listSchematicSymbols, resolveSchematicSymbolKind, listSchematicSymbolCategories } from './schematicIcons';
import { listPipelineSymbols, resolvePipelineSymbolKind, listPipelineSymbolCategories } from './pipelineIcons';
import { createPipelineSymbol } from './pipelineSymbols';
import { createSymbol } from './symbols';
import { createNetworkNode } from './primitives';
import { createDiagramFromJSON } from './registryCore';

export { createDiagramFromJSON } from './registryCore';
export { createNetworkNode } from './primitives';

/** Diagram module namespace for plugin install */
export const Diagram = {
  flowchart: createFlowchart,
  stateMachine: createStateMachine,
  classDiagram: createClassDiagram,
  mindMap: createMindMap,
  network: createNetworkDiagram,
  networkCatalog: createNetworkIconCatalog,
  orgChart: createOrgChart,
  schematic: createSchematic,
  schematicCatalog: createSchematicSymbolCatalog,
  canNetwork: createCanNetwork,
  pipeline: createPipeline,
  pipelineCatalog: createPipelineSymbolCatalog,
  /** Single pipeline / process symbol tile. */
  pipelineSymbol: createPipelineSymbol,
  /** Single IEC-style electronic schematic symbol. */
  schematicSymbol: createSymbol,
  /** Single network topology device node. */
  networkNode: createNetworkNode,
  layout: layoutDiagram,
  route: routeConnector,
  forceLayout: forceDirectedLayout,
  toggleCollapse: toggleOrgCollapse,
  wireOrgCollapse: wireOrgCollapseControls,
  fitToBounds: fitDiagramToBounds,
  installEditor: installDiagramEditor,
  uninstallEditor: uninstallDiagramEditor,
  /** Animate wire flow (dashes / packets) + node highlight. */
  applyFlow: applyDiagramFlow,
  /** Stop flow animations on a diagram root. */
  stopFlow: stopDiagramFlow,
  /** Re-apply `diagramState.flow` after rebuild/reroute. */
  refreshFlow: refreshDiagramFlow,
  pauseFlow: pauseDiagramFlow,
  resumeFlow: resumeDiagramFlow,
  toggleFlowPause: toggleDiagramFlowPause,
  replayFlow: replayDiagramFlow,
  isFlowPlaying: isDiagramFlowPlaying,
  listNetworkIcons: listNetworkIconKinds,
  resolveNetworkIcon: resolveNetworkIconKind,
  listSchematicSymbols,
  listSchematicCategories: listSchematicSymbolCategories,
  resolveSchematicSymbol: resolveSchematicSymbolKind,
  listPipelineSymbols,
  listPipelineCategories: listPipelineSymbolCategories,
  resolvePipelineSymbol: resolvePipelineSymbolKind,
  /** Serialize a diagram root to `{ type, props }` JSON. */
  toJSON: diagramToJSON,
  /** Build a diagram from type + props JSON. */
  fromJSON: createDiagramFromJSON,
  fromProps: createDiagramFromProps,
};
