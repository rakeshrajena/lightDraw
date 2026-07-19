import type { App } from '../../App';
import type { Group } from '../../shapes/Group';
import { wireOrgCollapseControls } from '../definitions';
import { collectEditableNodes } from './collect';
import { DiagramEditor } from './DiagramEditor';
import { ensureEditableHitTargets, tagEdgeLayer } from './hitTargets';
import type { DiagramEditorHandle, DiagramEditorOptions } from './types';

/** Install draw.io-style editing on a diagram group. */
export function installDiagramEditor(
  app: App,
  root: Group,
  options: DiagramEditorOptions = {}
): DiagramEditorHandle {
  tagEdgeLayer(root);
  ensureEditableHitTargets(app, root);

  const editor = new DiagramEditor(app, root, options);
  for (const node of collectEditableNodes(root)) {
    editor.wireNode(node);
  }
  editor.wireEdges();

  // Org minimize/expand buttons (kept above hit targets)
  if (root.metadata?.diagramType === 'orgChart') {
    wireOrgCollapseControls(app, root);
  }

  root.metadata.diagramEditor = editor;
  return editor;
}

/** Remove diagram editor overlays and listeners. */
export function uninstallDiagramEditor(root: Group): void {
  const editor = root.metadata?.diagramEditor as DiagramEditor | undefined;
  editor?.destroy();
  delete root.metadata.diagramEditor;
}

export { DiagramEditor } from './DiagramEditor';
export type { DiagramEditorHandle, DiagramEditorOptions, DiagramEditorTool } from './types';
export {
  normalizeDegrees,
  pointerAngleDegrees,
  rotatedCardCenter,
  setRotationAroundCenter,
  snapDegrees,
} from './rotate';
