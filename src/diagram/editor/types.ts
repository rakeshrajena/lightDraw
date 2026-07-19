import type { Group } from '../../shapes/Group';
import type { ConnectorOptions } from '../connectors';

export type DiagramEditorTool = 'select' | 'connect';

export interface EditorEdgeRecord {
  id: string;
  from: string;
  to: string;
  label?: string;
  /** Manual bend points in diagram-local space */
  waypoints?: Array<{ x: number; y: number }>;
  options?: Partial<ConnectorOptions>;
}

export interface EditorNodeRecord {
  id: string;
  label: string;
}

export interface DiagramEditorOptions {
  /** Enable drag, resize, label edit, and rewiring */
  enabled?: boolean;
  /**
   * Interaction mode:
   * - `edit` — full editor (labels, resize, connect, edge delete)
   * - `arrange` — drag + resize nodes; wires follow; no label/connect editing
   */
  mode?: 'edit' | 'arrange';
  /** Allow double-click label editing (default: true unless mode is arrange) */
  allowLabelEdit?: boolean;
  /**
   * Show 8 resize handles (4 edges + 4 corners). Drag outward/inward to grow/shrink.
   * Default: true
   */
  allowResize?: boolean;
  /** Allow connect tool / edge rewiring / delete (default: true unless mode is arrange) */
  allowConnect?: boolean;
  /**
   * Double-click a wire to add bend points, then drag handles to reshape.
   * Default: true
   */
  allowBendPoints?: boolean;
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
  /** Clear stale selection chrome after collapse/expand/relayout. */
  afterStructureChange(): void;
  destroy(): void;
}
