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
export { createSymbol, buildSchematic, rewireSchematic, Symbols } from './symbols';
export { diagramToJSON, fitDiagramToBounds, resolveGridLayout, readCanvasSize } from './helpers';
export { installDiagramEditor, uninstallDiagramEditor, DiagramEditor } from './editor';

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
import { routeConnector } from './router';
import { listNetworkIconKinds, resolveNetworkIconKind } from './networkIcons';
import { listSchematicSymbols, resolveSchematicSymbolKind } from './schematicIcons';
import { listPipelineSymbols, resolvePipelineSymbolKind } from './pipelineIcons';
import { createDiagramFromJSON } from './registryCore';

export { createDiagramFromJSON } from './registryCore';

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
  layout: layoutDiagram,
  route: routeConnector,
  forceLayout: forceDirectedLayout,
  toggleCollapse: toggleOrgCollapse,
  wireOrgCollapse: wireOrgCollapseControls,
  fitToBounds: fitDiagramToBounds,
  installEditor: installDiagramEditor,
  uninstallEditor: uninstallDiagramEditor,
  listNetworkIcons: listNetworkIconKinds,
  resolveNetworkIcon: resolveNetworkIconKind,
  listSchematicSymbols,
  resolveSchematicSymbol: resolveSchematicSymbolKind,
  listPipelineSymbols,
  resolvePipelineSymbol: resolvePipelineSymbolKind,
  /** Serialize a diagram root to `{ type, props }` JSON. */
  toJSON: diagramToJSON,
  /** Build a diagram from type + props JSON. */
  fromJSON: createDiagramFromJSON,
  fromProps: createDiagramFromProps,
};
