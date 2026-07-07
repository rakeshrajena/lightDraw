import type { Group } from '../../shapes/Group';
import type { ConnectorOptions } from '../connectors';

export type DiagramEditorTool = 'select' | 'connect';

export interface EditorEdgeRecord {
  id: string;
  from: string;
  to: string;
  label?: string;
  options?: Partial<ConnectorOptions>;
}

export interface EditorNodeRecord {
  id: string;
  label: string;
}

export interface DiagramEditorOptions {
  /** Enable drag, resize, label edit, and rewiring */
  enabled?: boolean;
  /** Initial tool */
  tool?: DiagramEditorTool;
  /** Snap dragged nodes to grid */
  gridSize?: number;
  /** Show port handles when a node is selected */
  showPorts?: boolean;
  /** Callback when model changes */
  onChange?: (state: Record<string, unknown>) => void;
}

export interface DiagramEditorHandle {
  root: Group;
  setTool(tool: DiagramEditorTool): void;
  getTool(): DiagramEditorTool;
  selectNode(id: string | null): void;
  getSelectedNodeId(): string | null;
  selectEdge(id: string | null): void;
  getSelectedEdgeId(): string | null;
  deleteSelectedEdge(): void;
  reroute(): void;
  destroy(): void;
}
