/**
 * Diagram JSON / props dispatcher.
 */
import type { App } from '../../App';
import type { Group } from '../../shapes/Group';
import type {
  CanNetworkData,
  ClassDiagramData,
  DiagramData,
  OrgChartNode,
  PipelineStage,
  SchematicComponent,
  StateMachineData,
} from '../types';
import { createFlowchart } from './flowchart';
import { createStateMachine } from './stateMachine';
import { createClassDiagram } from './classDiagram';
import { createMindMap } from './mindMap';
import { createNetworkDiagram } from './network';
import { createOrgChart } from './org';
import { createSchematic, createSchematicSymbolCatalog } from './schematic';
import { createCanNetwork } from './canNetwork';
import { createPipeline, createPipelineSymbolCatalog } from './pipeline';

/** JSON factory dispatcher */
export function createDiagramFromProps(
  type: string,
  props: Record<string, unknown>,
  app: App
): Group | null {
  switch (type) {
    case 'flowchart':
      return createFlowchart(app, props.data as DiagramData, props);
    case 'stateMachine':
      return createStateMachine(app, props.data as StateMachineData, props);
    case 'classDiagram':
      return createClassDiagram(app, props.data as ClassDiagramData, props);
    case 'mindMap':
      return createMindMap(
        app,
        (props.center as string) ?? 'Topic',
        (props.branches as Array<{ label: string; children?: string[] }>) ?? [],
        props
      );
    case 'networkTopology':
      return createNetworkDiagram(app, props.data as DiagramData, props);
    case 'orgChart':
      return createOrgChart(app, props.root as OrgChartNode, props);
    case 'electricalSchematic':
      return createSchematic(app, (props.components as SchematicComponent[]) ?? [], props);
    case 'schematicSymbolCatalog':
      return createSchematicSymbolCatalog(app, props);
    case 'canNetwork':
      return createCanNetwork(app, props.data as CanNetworkData, props);
    case 'processPipeline':
      return createPipeline(app, (props.stages as PipelineStage[]) ?? [], props);
    case 'pipelineSymbolCatalog':
      return createPipelineSymbolCatalog(app, props);
    default:
      return null;
  }
}
