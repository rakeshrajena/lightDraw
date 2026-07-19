/**
 * Network topology node primitive.
 */
import type { App } from '../../App';
import type { Group } from '../../shapes/Group';
import { addCaptionPill, addCardChrome } from '../chrome';
import { getActiveDiagram } from '../theme';
import {
  drawNetworkIcon,
  getNetworkIconMeta,
  networkStyleForKind,
  resolveNetworkIconKind,
} from '../networkIcons';
import { centerTextX, measureTextWidth } from './measure';

export function createNetworkNode(app: App, label: string, type: string): Group {
  const kind = resolveNetworkIconKind(type);
  const meta = getNetworkIconMeta(kind);
  const style = networkStyleForKind(kind);
  const isContainer = Boolean(meta.container);
  const size = isContainer ? 60 : 52;
  const node = app.group();
  const captionGap = getActiveDiagram().spacing.xs + 2;
  const cardH = size + getActiveDiagram().fontSize.sm + captionGap + 8;
  node.metadata.diagramCardWidth = size;
  node.metadata.diagramCardHeight = cardH;
  node.metadata.networkIconKind = kind;
  node.metadata.networkIconCategory = meta.category;

  const squareKinds = new Set([
    'server',
    'hypervisor',
    'k8sNode',
    'vm',
    'storage',
    'nas',
    'san',
    'container',
    'plc',
    'ecu',
    'modem',
  ]);
  const corner = isContainer
    ? getActiveDiagram().radii.lg
    : squareKinds.has(kind)
      ? getActiveDiagram().radii.md + 2
      : size / 2;

  addCardChrome(app, node, {
    width: size,
    height: size,
    cornerRadius: corner,
    fill: style.fill,
    stroke: style.stroke,
    strokeWidth: getActiveDiagram().stroke.nodeEmphasis,
    shadow: getActiveDiagram().shadowElevated,
    sheen: true,
    ...(isContainer ? {} : { accentColor: style.stroke, accentHeight: 2 }),
  });

  if (isContainer) {
    node.add(
      app.roundedRect({
        x: 4,
        y: 4,
        width: size - 8,
        height: size - 8,
        cornerRadius: getActiveDiagram().radii.sm,
        fill: null,
        stroke: style.glyph,
        strokeWidth: 1.15,
        dash: [4, 3],
        opacity: 0.65,
        listening: false,
      })
    );
  } else {
    // Inner ring for depth (professional tile)
    node.add(
      app.roundedRect({
        x: 3,
        y: 3,
        width: size - 6,
        height: size - 6,
        cornerRadius: Math.max(corner - 3, 4),
        fill: null,
        stroke: style.glyph,
        strokeWidth: 1,
        opacity: 0.18,
        listening: false,
      })
    );
  }

  drawNetworkIcon(app, node, kind, size, style.glyph);

  const fs = getActiveDiagram().fontSize.sm;
  const labelW = Math.max(size + 12, measureTextWidth(label, fs) + 20);
  const tw = measureTextWidth(label, fs);
  const labelX = (size - labelW) / 2 + centerTextX(label, labelW, fs);
  addCaptionPill(app, node, tw, labelX, size + captionGap - 2, style.stroke);
  node.add(
    app.text({
      text: label,
      x: (size - labelW) / 2 + centerTextX(label, labelW, fs),
      y: size + captionGap,
      fontSize: fs,
      fontWeight: '600',
      fontFamily: getActiveDiagram().fontFamily,
      fill: getActiveDiagram().nodeText,
      listening: false,
    })
  );
  return node;
}
