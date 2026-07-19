/**
 * CAN bus ECU node primitive.
 */
import type { App } from '../../App';
import type { Group } from '../../shapes/Group';
import { addCardChrome } from '../chrome';
import { getActiveDiagram } from '../theme';

export function createCanEcuNode(
  app: App,
  label: string,
  address: string | undefined,
  color: string,
  strokeWidth: number = getActiveDiagram().stroke.node
): Group {
  const width = 96;
  const height = 62;
  const ecuGroup = app.group();
  ecuGroup.metadata.diagramCardWidth = width;
  ecuGroup.metadata.diagramCardHeight = height;
  ecuGroup.metadata.diagramTapPad = 22;

  addCardChrome(app, ecuGroup, {
    width,
    height,
    cornerRadius: getActiveDiagram().radii.md,
    fill: getActiveDiagram().nodeFill,
    stroke: color,
    strokeWidth,
    shadow: getActiveDiagram().shadowElevated,
    accentColor: color,
  });

  // IC chip glyph
  ecuGroup.add(
    app.roundedRect({
      x: width - 28,
      y: 10,
      width: 16,
      height: 20,
      cornerRadius: 2,
      fill: null,
      stroke: color,
      strokeWidth: 1.2,
      opacity: 0.85,
      listening: false,
    })
  );
  for (const side of [0, 1]) {
    for (let i = 0; i < 3; i++) {
      ecuGroup.add(
        app.line({
          x: side === 0 ? width - 28 : width - 12,
          y: 13 + i * 6,
          x2: side === 0 ? -4 : 4,
          y2: 0,
          stroke: color,
          strokeWidth: 1.1,
          lineCap: 'round',
          opacity: 0.75,
          listening: false,
        })
      );
    }
  }

  ecuGroup.add(
    app.text({
      text: label,
      x: getActiveDiagram().spacing.sm,
      y: 12,
      fontSize: getActiveDiagram().fontSize.md,
      fill: getActiveDiagram().nodeText,
      fontWeight: 'bold',
      fontFamily: getActiveDiagram().fontFamily,
      listening: false,
    })
  );
  if (address) {
    ecuGroup.add(
      app.text({
        text: address,
        x: getActiveDiagram().spacing.sm,
        y: 32,
        fontSize: getActiveDiagram().fontSize.xs,
        fontFamily: getActiveDiagram().fontMono,
        fill: getActiveDiagram().edgeLabel,
        listening: false,
      })
    );
  }
  // Bus tap: reaches dual-line midline when ECU.y = busY + 18 (tap to local y = -18)
  const tapLen = 18;
  ecuGroup.add(
    app.line({
      x: width / 2,
      y: 0,
      x2: 0,
      y2: -tapLen,
      stroke: color,
      strokeWidth: 2.25,
      lineCap: 'round',
      listening: false,
    })
  );
  // Bridge across CAN-H / CAN-L at the junction
  ecuGroup.add(
    app.line({
      x: width / 2,
      y: -tapLen - 4,
      x2: 0,
      y2: 8,
      stroke: color,
      strokeWidth: 2,
      lineCap: 'round',
      listening: false,
    })
  );
  ecuGroup.add(
    app.circle({
      x: width / 2 - 3.5,
      y: -tapLen - 3.5,
      radius: 3.5,
      fill: color,
      stroke: getActiveDiagram().surface,
      strokeWidth: 1.5,
      listening: false,
    })
  );
  return ecuGroup;
}
