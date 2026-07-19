/**
 * State machine node primitive.
 */
import type { App } from '../../App';
import type { Group } from '../../shapes/Group';
import { addCardChrome } from '../chrome';
import { getActiveDiagram } from '../theme';
import { centerTextX } from './measure';

export function createStateNode(
  app: App,
  label: string,
  type: 'initial' | 'final' | 'normal' | string
): Group {
  const node = app.group();
  const isFinal = type === 'final';
  const isInitial = type === 'initial';

  if (isInitial) {
    // UML initial pseudostate — solid circle; card size = glyph for correct anchors
    const r = 9;
    const size = r * 2;
    node.metadata.diagramCardWidth = size;
    node.metadata.diagramCardHeight = size;
    node.add(
      app.circle({
        x: 0,
        y: 0,
        radius: r,
        fill: getActiveDiagram().stateInitialStroke,
        stroke: null,
        listening: false,
      })
    );
    return node;
  }

  if (isFinal) {
    // UML final: double ring with label centered inside (not below — keeps anchors tight)
    const radius = 20;
    const size = radius * 2;
    node.metadata.diagramCardWidth = size;
    node.metadata.diagramCardHeight = size;
    node.add(
      app.circle({
        x: 0,
        y: 0,
        radius,
        fill: getActiveDiagram().stateFinalFill,
        stroke: getActiveDiagram().stateFinalStroke,
        strokeWidth: getActiveDiagram().stroke.nodeEmphasis,
        listening: false,
      })
    );
    node.add(
      app.circle({
        x: 6,
        y: 6,
        radius: radius - 6,
        fill: null,
        stroke: getActiveDiagram().stateFinalStroke,
        strokeWidth: getActiveDiagram().stroke.nodeEmphasis,
        listening: false,
      })
    );
    if (label) {
      const fs = getActiveDiagram().fontSize.sm;
      node.add(
        app.text({
          text: label,
          x: centerTextX(label, size, fs),
          y: size / 2 - fs / 2 - 1,
          fontSize: fs,
          fontWeight: '600',
          fontFamily: getActiveDiagram().fontFamily,
          fill: getActiveDiagram().stateFinalStroke,
          listening: false,
        })
      );
    }
    return node;
  }

  const w = 112;
  const h = 42;
  node.metadata.diagramCardWidth = w;
  node.metadata.diagramCardHeight = h;
  // Clean Mermaid-style pill — stroke only, no accent bar / sheen artifacts
  addCardChrome(app, node, {
    width: w,
    height: h,
    cornerRadius: getActiveDiagram().radii.pill,
    fill: getActiveDiagram().stateFill,
    stroke: getActiveDiagram().stateStroke,
    strokeWidth: getActiveDiagram().stroke.nodeEmphasis,
    shadow: null,
    sheen: false,
  });

  const fs = getActiveDiagram().fontSize.md;
  node.add(
    app.text({
      text: label,
      x: centerTextX(label, w, fs),
      y: h / 2 - fs / 2 - 1,
      fontSize: fs,
      fontWeight: '600',
      fontFamily: getActiveDiagram().fontFamily,
      fill: getActiveDiagram().nodeText,
      listening: false,
    })
  );
  return node;
}
