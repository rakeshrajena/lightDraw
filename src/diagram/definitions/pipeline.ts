/**
 * Diagram builder — pipeline.
 */
import type { App } from '../../App';
import type { Group } from '../../shapes/Group';
import type { Node } from '../../Node';
import type { NodeOptions } from '../../types';
import { resolveStrokeWidth, strokeContextForCanvas, getActiveDiagram } from '../theme';
import {
  createDiagramGroup,
  readCanvasSize,
} from '../helpers';
import {
  createPipelineStage,
} from '../primitives';
import { pipelineLayout } from '../layouts';
import { connectNodes } from '../connectors';
import { createPipelineSymbol } from '../pipelineSymbols';
import { listPipelineSymbols, type PipelineSymbolCategory } from '../pipelineIcons';
import type { PipelineStage } from '../types';
import { maybeApplyDiagramFlow } from '../flow';

/** Create horizontal process pipeline */
export function createPipeline(
  app: App,
  stages: PipelineStage[],
  options: NodeOptions = {}
): Group {
  const group = createDiagramGroup(app, 'processPipeline', { ...options, stages }, { name: 'pipeline' });
  const canvas = readCanvasSize(options as Record<string, unknown>);
  const strokeCtx = strokeContextForCanvas(canvas.width, canvas.height);
  const edgeWidth = resolveStrokeWidth(getActiveDiagram().stroke.edge, strokeCtx);

  const stageNodes: Node[] = [];
  for (const stage of stages) {
    const node = createPipelineStage(app, stage.label, stage.status ?? 'pending', stage.type);
    node.metadata = {
      ...node.metadata,
      diagramId: stage.id,
      pipelineStatus: stage.status,
      ...(stage.type ? { pipelineSymbolKind: stage.type } : {}),
    };
    group.add(node);
    stageNodes.push(node);
  }

  pipelineLayout(group, Math.max(8, Math.floor((canvas.width - 48) / Math.max(stages.length, 1) / 3)), 12, canvas.height);

  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i];
    const node = stageNodes[i];
    if (typeof stage.x === 'number') node.x = stage.x;
    if (typeof stage.y === 'number') node.y = stage.y;
    if (typeof stage.rotation === 'number') node.rotation = stage.rotation;
  }

  const edgeLayer = app.group({ zIndex: -10, listening: false }) as Group;
  edgeLayer.metadata.diagramEdgeLayer = true;
  for (let i = 0; i < stageNodes.length - 1; i++) {
    edgeLayer.add(
      connectNodes(app, stageNodes[i], stageNodes[i + 1], [], {
        parent: group,
        style: 'straight',
        stroke: getActiveDiagram().edge,
        glowColor: getActiveDiagram().edgeGlow,
        strokeWidth: edgeWidth,
        arrowEnd: 'filled',
      })
    );
  }
  group.add(edgeLayer);

  maybeApplyDiagramFlow(app, group, options as Record<string, unknown>);
  return group;
}

/** Grid catalog of pipeline / process / manufacturing symbols. */
export function createPipelineSymbolCatalog(
  app: App,
  options: NodeOptions & { category?: PipelineSymbolCategory | string; columns?: number } = {}
): Group {
  const category = options.category as PipelineSymbolCategory | undefined;
  const kinds = listPipelineSymbols(category);
  const columns = Math.max(4, options.columns ?? 8);
  const group = createDiagramGroup(
    app,
    'pipelineSymbolCatalog',
    { ...options, category },
    { name: 'pipelineCatalog' }
  );
  const gapX = 120;
  const gapY = 102;
  const startX = 16;
  const startY = 12;
  kinds.forEach((meta, i) => {
    const col = i % columns;
    const row = Math.floor(i / columns);
    const node = createPipelineSymbol(app, meta.kind, startX + col * gapX, startY + row * gapY, meta.label);
    node.metadata = { ...node.metadata, diagramId: meta.kind };
    group.add(node);
  });
  return group;
}
