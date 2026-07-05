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
  relations: Array<{ from: string; to: string; type?: 'inheritance' | 'implements' | 'association' }>;
}

export interface OrgChartNode {
  name: string;
  collapsed?: boolean;
  children?: OrgChartNode[];
}

export interface PipelineStage {
  id: string;
  label: string;
  status?: 'pending' | 'active' | 'done' | 'error';
}

export interface CanNetworkData {
  busLabel?: string;
  ecus: Array<{ id: string; label: string; address?: string }>;
}

export interface SchematicComponent {
  id: string;
  type: 'resistor' | 'capacitor' | 'ground' | 'battery' | 'switch' | 'led' | 'wire';
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
