/**
 * Flowchart node primitives.
 */
import type { App } from '../../App';
import type { Group } from '../../shapes/Group';
import { addAccentBar, addTopSheen } from '../chrome';
import { getActiveDiagram } from '../theme';
import { centerTextX } from './measure';

export function createFlowchartNode(
  app: App,
  label: string,
  type: 'start' | 'end' | 'decision' | 'process' | string
): Group {
  const width = 132;
  const height = 46;
  const isStart = type === 'start';
  const isEnd = type === 'end';
  const isTerminal = isStart || isEnd;
  const isDecision = type === 'decision';
  const node = app.group();
  node.metadata.diagramCardWidth = width;
  node.metadata.diagramCardHeight = height;

  const palette = isStart
    ? getActiveDiagram().flowchartStart
    : isEnd
      ? getActiveDiagram().flowchartEnd
      : isDecision
        ? getActiveDiagram().flowchartDecision
        : getActiveDiagram().flowchartProcess;

  if (isDecision) {
    node.add(
      app.polygon({
        points: [66, 2, 130, 23, 66, 44, 2, 23],
        fill: palette.stroke,
        stroke: null,
        opacity: 0.12,
        listening: false,
      })
    );
    node.add(
      app.polygon({
        points: [66, 2, 130, 23, 66, 44, 2, 23],
        fill: palette.fill,
        stroke: palette.stroke,
        strokeWidth: getActiveDiagram().stroke.nodeEmphasis,
        shadow: getActiveDiagram().shadowElevated,
        listening: false,
      })
    );
    const fs = getActiveDiagram().fontSize.sm;
    node.add(
      app.text({
        text: label,
        x: centerTextX(label, width, fs),
        y: 23 - fs / 2 - 1,
        fontSize: fs,
        fontWeight: '600',
        fontFamily: getActiveDiagram().fontFamily,
        fill: getActiveDiagram().nodeText,
        listening: false,
      })
    );
    return node;
  }

  node.add(
    app.roundedRect({
      width,
      height,
      cornerRadius: isTerminal ? getActiveDiagram().radii.pill : getActiveDiagram().radii.md,
      fill: palette.fill,
      stroke: palette.stroke,
      strokeWidth: getActiveDiagram().stroke.nodeEmphasis,
      shadow: isTerminal ? getActiveDiagram().shadowElevated : getActiveDiagram().shadowSoft,
      listening: false,
    })
  );
  if (!isTerminal) {
    addAccentBar(app, node, width, palette.accent, 3);
    addTopSheen(app, node, width, getActiveDiagram().radii.md);
  } else {
    node.add(
      app.roundedRect({
        x: 2,
        y: 2,
        width: width - 4,
        height: height - 4,
        cornerRadius: isTerminal ? getActiveDiagram().radii.pill - 2 : getActiveDiagram().radii.md,
        fill: null,
        stroke: palette.accent,
        strokeWidth: 1,
        opacity: 0.35,
        listening: false,
      })
    );
  }
  if (isTerminal) {
    node.add(
      app.text({
        text: label.toUpperCase(),
        x: centerTextX(label, width, getActiveDiagram().fontSize.sm),
        y: height / 2 - 6,
        fontSize: getActiveDiagram().fontSize.sm,
        fontWeight: '700',
        letterSpacing: 0.06,
        fontFamily: getActiveDiagram().fontFamily,
        fill: isStart ? palette.accent : getActiveDiagram().nodeText,
        listening: false,
      })
    );
  } else {
    node.add(
      app.text({
        text: label,
        x: centerTextX(label, width),
        y: height / 2 - 6,
        fontSize: getActiveDiagram().fontSize.base,
        fontWeight: '600',
        fontFamily: getActiveDiagram().fontFamily,
        fill: getActiveDiagram().nodeText,
        listening: false,
      })
    );
  }
  return node;
}
