/**
 * UML class node primitive.
 */
import type { App } from '../../App';
import type { Group } from '../../shapes/Group';
import { addCardChrome, addTopSheen } from '../chrome';
import { getActiveDiagram } from '../theme';

export function createClassNode(
  app: App,
  name: string,
  attributes: string[],
  methods: string[]
): Group {
  const width = 176;
  const lineH = 17;
  const headerH = 32;
  const bodyLines = attributes.length + methods.length;
  const height = headerH + bodyLines * lineH + (methods.length > 0 && attributes.length > 0 ? 8 : 4) + 6;
  const node = app.group();
  node.metadata.diagramCardWidth = width;
  node.metadata.diagramCardHeight = height;
  const radius = getActiveDiagram().radii.md;

  addCardChrome(app, node, {
    width,
    height,
    cornerRadius: radius,
    fill: getActiveDiagram().classFill,
    stroke: getActiveDiagram().classStroke,
    strokeWidth: getActiveDiagram().stroke.node,
    shadow: getActiveDiagram().shadowSoft,
    accentColor: getActiveDiagram().umlInheritance,
    sheen: false,
  });
  // Header band inset so square corners sit inside the rounded card stroke
  node.add(
    app.rect({
      x: Math.max(2, radius * 0.35),
      y: 3,
      width: width - Math.max(4, radius * 0.7),
      height: headerH - 4,
      fill: getActiveDiagram().classHeaderBg,
      stroke: null,
      listening: false,
    })
  );
  addTopSheen(app, node, width, radius);
  node.add(
    app.text({
      text: name,
      x: getActiveDiagram().spacing.sm,
      y: 10,
      fontSize: getActiveDiagram().fontSize.lg,
      fontWeight: 'bold',
      fontStyle: 'italic',
      fontFamily: getActiveDiagram().fontFamily,
      fill: getActiveDiagram().classHeader,
      listening: false,
    })
  );
  node.add(
    app.line({
      x: 0,
      y: headerH,
      x2: width,
      y2: 0,
      stroke: getActiveDiagram().classDivider,
      strokeWidth: getActiveDiagram().stroke.label,
      listening: false,
    })
  );

  let y = headerH + 4;
  for (const attr of attributes) {
    node.add(
      app.text({
        text: attr,
        x: getActiveDiagram().spacing.sm,
        y,
        fontSize: getActiveDiagram().fontSize.md,
        fontFamily: getActiveDiagram().fontMono,
        fill: getActiveDiagram().classBody,
        listening: false,
      })
    );
    y += lineH;
  }
  if (methods.length > 0 && attributes.length > 0) {
    node.add(
      app.line({
        x: 0,
        y: y - 2,
        x2: width,
        y2: 0,
        stroke: getActiveDiagram().classDivider,
        strokeWidth: getActiveDiagram().stroke.label,
        listening: false,
      })
    );
    y += 4;
  }
  for (const method of methods) {
    node.add(
      app.text({
        text: method,
        x: getActiveDiagram().spacing.sm,
        y,
        fontSize: getActiveDiagram().fontSize.md,
        fontFamily: getActiveDiagram().fontMono,
        fill: getActiveDiagram().classBody,
        listening: false,
      })
    );
    y += lineH;
  }
  return node;
}
