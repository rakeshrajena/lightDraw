export interface DiagramNode {
  id: string;
  label: string;
  type?: string;
  x?: number;
  y?: number;
  /** Network / UML / schematic subtype */
  subtype?: string;
  attributes?: string[];
  methods?: string[];
  collapsed?: boolean;
  children?: DiagramNode[];
}

export interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
  type?: 'default' | 'inheritance' | 'association' | 'transition';
}

export interface DiagramData {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

export interface StateMachineData {
  states: Array<{ id: string; label: string; type?: 'initial' | 'final' | 'normal'; x?: number; y?: number }>;
  transitions: Array<{ from: string; to: string; label?: string }>;
}

export interface ClassDiagramData {
  classes: Array<{
    id: string;
    name: string;
    attributes?: string[];
    methods?: string[];
    x?: number;
    y?: number;
  }>;
  relations: Array<{
    from: string;
    to: string;
    type?: 'inheritance' | 'implements' | 'association' | 'composition';
  }>;
}

export interface OrgChartNode {
  name: string;
  /** Job title shown under the name */
  role?: string;
  /** Optional avatar image URL or data URI */
  image?: string;
  /** Optional department / team line under the role */
  department?: string;
  collapsed?: boolean;
  children?: OrgChartNode[];
}

export interface PipelineStage {
  id: string;
  label: string;
  status?: 'pending' | 'active' | 'done' | 'error';
  /** Optional catalog symbol kind (e.g. `deploy`, `database`, `exclusiveGateway`). */
  type?: string;
}

export interface CanNetworkData {
  busLabel?: string;
  ecus: Array<{ id: string; label: string; address?: string }>;
}

export interface SchematicComponent {
  id: string;
  /** Any catalog kind or alias (resistor, nmos, opAmp, …). */
  type: string;
  x: number;
  y: number;
  label?: string;
  rotation?: number;
}

export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
}
