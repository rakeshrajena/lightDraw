/**
 * Pipeline stage node primitive.
 */
import type { App } from '../../App';
import type { Group } from '../../shapes/Group';
import { addCardChrome, addEmphasisRing, addLeftStripe } from '../chrome';
import { getActiveDiagram } from '../theme';
import { drawPipelineStageGlyph } from '../pipelineSymbols';

export function createPipelineStage(
  app: App,
  label: string,
  status: 'pending' | 'active' | 'done' | 'error' | string,
  symbolType?: string
): Group {
  const colors: Record<string, { fill: string; stroke: string }> = {
    pending: { fill: getActiveDiagram().pipelinePendingFill, stroke: getActiveDiagram().pipelinePending },
    active: { fill: getActiveDiagram().pipelineActiveFill, stroke: getActiveDiagram().pipelineActive },
    done: { fill: getActiveDiagram().pipelineDoneFill, stroke: getActiveDiagram().pipelineDone },
    error: { fill: getActiveDiagram().pipelineErrorFill, stroke: getActiveDiagram().pipelineErrorStroke },
  };
  const c = colors[status] ?? colors.pending;
  const width = 118;
  const height = 50;
  const node = app.group();
  node.metadata.diagramCardWidth = width;
  node.metadata.diagramCardHeight = height;
  const statusLabels: Record<string, string> = {
    pending: 'WAIT',
    active: 'RUN',
    done: 'DONE',
    error: 'FAIL',
  };

  if (status === 'active') {
    addEmphasisRing(app, node, width, height, c.stroke, getActiveDiagram().radii.md);
  }

  addCardChrome(app, node, {
    width,
    height,
    cornerRadius: getActiveDiagram().radii.md,
    fill: c.fill,
    stroke: c.stroke,
    strokeWidth: getActiveDiagram().stroke.node,
    shadow: status === 'active' ? getActiveDiagram().shadowElevated : getActiveDiagram().shadowSoft,
    sheen: false,
  });
  addLeftStripe(app, node, height, c.stroke, 4);

  const hasGlyph = Boolean(symbolType?.trim());
  let contentX = getActiveDiagram().spacing.sm + 4;
  if (hasGlyph) {
    drawPipelineStageGlyph(app, node, symbolType!, contentX, height / 2 - 11, 22);
    contentX += 26;
  } else {
    const badgeW = 34;
    node.add(
      app.roundedRect({
        x: contentX,
        y: height / 2 - 9,
        width: badgeW,
        height: 18,
        cornerRadius: getActiveDiagram().radii.sm,
        fill: c.stroke,
        stroke: null,
        opacity: status === 'pending' ? 0.35 : 0.9,
        listening: false,
      })
    );
    node.add(
      app.text({
        text: statusLabels[status] ?? 'WAIT',
        x: contentX + 5,
        y: height / 2 - 7,
        fontSize: getActiveDiagram().fontSize.xs,
        fontWeight: '700',
        letterSpacing: 0.04,
        fontFamily: getActiveDiagram().fontFamily,
        fill: status === 'pending' ? getActiveDiagram().nodeTextMuted : '#fff',
        listening: false,
      })
    );
    contentX += badgeW + 6;
  }

  node.add(
    app.text({
      text: label,
      x: contentX,
      y: height / 2 - 7,
      fontSize: getActiveDiagram().fontSize.base,
      fontWeight: '600',
      fontFamily: getActiveDiagram().fontFamily,
      fill: getActiveDiagram().nodeText,
      listening: false,
    })
  );
  if (hasGlyph) {
    node.metadata.pipelineSymbolKind = symbolType;
  }
  return node;
}
