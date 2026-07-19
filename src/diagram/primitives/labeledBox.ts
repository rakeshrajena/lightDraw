/**
 * Shared labeled card chrome for diagram nodes.
 */
import type { App } from '../../App';
import type { Group } from '../../shapes/Group';
import { addCardChrome } from '../chrome';
import { DIAGRAM, getActiveDiagram } from '../theme';
import { centerTextX } from './measure';

export interface BoxStyle {
  fill?: string;
  stroke?: string;
  cornerRadius?: number;
  strokeWidth?: number;
  shadow?: typeof DIAGRAM.shadow | typeof DIAGRAM.shadowSoft | null;
  accentColor?: string;
  sheen?: boolean;
}

const defaultBoxStyle = (): Required<Pick<BoxStyle, 'strokeWidth' | 'shadow'>> => ({
  strokeWidth: getActiveDiagram().stroke.node,
  shadow: getActiveDiagram().shadowSoft,
});

/** Labeled rounded rectangle — shared node chrome for all diagram types. */
export function createLabeledBox(
  app: App,
  label: string,
  width: number,
  height: number,
  style: BoxStyle = {},
  textOpts: { fontSize?: number; fontWeight?: string; fill?: string; y?: number } = {}
): Group {
  const { strokeWidth, shadow } = defaultBoxStyle();
  const node = app.group();
  node.metadata.diagramCardWidth = width;
  node.metadata.diagramCardHeight = height;
  const fontSize = textOpts.fontSize ?? getActiveDiagram().fontSize.base;
  const radius = style.cornerRadius ?? getActiveDiagram().radii.md;

  addCardChrome(app, node, {
    width,
    height,
    cornerRadius: radius,
    fill: style.fill ?? getActiveDiagram().nodeFill,
    stroke: style.stroke ?? getActiveDiagram().nodeStroke,
    strokeWidth: style.strokeWidth ?? strokeWidth,
    shadow: style.shadow !== null ? (style.shadow ?? shadow) : null,
    accentColor: style.accentColor,
    sheen: style.sheen,
  });

  node.add(
    app.text({
      text: label,
      x: centerTextX(label, width, fontSize, textOpts.fontWeight ?? '600'),
      y: textOpts.y ?? height / 2 - fontSize / 2 - 1,
      fontSize,
      fontWeight: textOpts.fontWeight ?? '600',
      fontFamily: getActiveDiagram().fontFamily,
      fill: textOpts.fill ?? getActiveDiagram().nodeText,
      listening: false,
    })
  );
  return node;
}
