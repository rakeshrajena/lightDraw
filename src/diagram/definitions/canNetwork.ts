/**
 * Diagram builder — canNetwork.
 */
import type { App } from '../../App';
import type { Group } from '../../shapes/Group';
import type { NodeOptions } from '../../types';
import { resolveStrokeWidth, strokeContextForCanvas, getActiveDiagram } from '../theme';
import {
  createDiagramGroup,
  measureTextWidth,
  readCanvasSize,
  setDiagramState,
} from '../helpers';
import {
  createCanEcuNode,
} from '../primitives';
import type { CanNetworkData } from '../types';
import { maybeApplyDiagramFlow } from '../flow';

/** Create CAN network diagram */
export function createCanNetwork(
  app: App,
  data: CanNetworkData,
  options: NodeOptions = {}
): Group {
  const group = createDiagramGroup(app, 'canNetwork', { ...options, data }, { name: 'canNetwork' });
  const canvas = readCanvasSize(options as Record<string, unknown>);
  const strokeCtx = strokeContextForCanvas(canvas.width, canvas.height);
  const nodeStroke = resolveStrokeWidth(getActiveDiagram().stroke.node, strokeCtx);
  const busY = 72;
  const ecuW = 96;
  const margin = 36;
  const n = Math.max(1, data.ecus.length);
  // Stretch bus across the canvas so every ECU is fully visible with even gaps
  const busWidth = Math.max(280, canvas.width - margin * 2);
  const busLabel = data.busLabel ?? 'CAN Bus';

  // Persist for flow hop geometry (packet rides this rail)
  setDiagramState(group, { canBusY: busY });
  const busGlow = getActiveDiagram().canBusGlow;
  const busFill = getActiveDiagram().canBus;
  group.add(
    app.roundedRect({
      x: margin - 4,
      y: busY - 11,
      width: busWidth + 8,
      height: 22,
      cornerRadius: 6,
      fill: busGlow,
      stroke: null,
      opacity: 0.35,
      listening: false,
    })
  );
  // CAN-H (upper) / CAN-L (lower) — distinct opacity for dual-line bus
  group.add(
    app.line({
      x: margin,
      y: busY - 4,
      x2: busWidth,
      y2: 0,
      stroke: busFill,
      strokeWidth: 2.5,
      lineCap: 'round',
      listening: false,
    })
  );
  group.add(
    app.line({
      x: margin,
      y: busY + 4,
      x2: busWidth,
      y2: 0,
      stroke: busFill,
      strokeWidth: 2.5,
      lineCap: 'round',
      opacity: 0.55,
      listening: false,
    })
  );
  // Termination: twin vertical bars (schematic-style resistors), not status dots
  const termColor = getActiveDiagram().canTermination;
  for (const tx of [margin, margin + busWidth]) {
    group.add(
      app.line({
        x: tx,
        y: busY - 10,
        x2: 0,
        y2: 20,
        stroke: termColor,
        strokeWidth: 2.5,
        lineCap: 'round',
        listening: false,
      })
    );
    group.add(
      app.line({
        x: tx + (tx === margin ? 5 : -5),
        y: busY - 10,
        x2: 0,
        y2: 20,
        stroke: termColor,
        strokeWidth: 2.5,
        lineCap: 'round',
        listening: false,
      })
    );
  }
  const labelW = measureTextWidth(busLabel, getActiveDiagram().fontSize.base, 'bold');
  group.add(
    app.text({
      text: busLabel,
      x: margin + busWidth / 2 - labelW / 2,
      y: busY - 30,
      fontSize: getActiveDiagram().fontSize.base,
      fill: getActiveDiagram().edge,
      fontWeight: 'bold',
      fontFamily: getActiveDiagram().fontFamily,
      listening: false,
    })
  );

  const spacing = busWidth / (n + 1);
  for (let i = 0; i < data.ecus.length; i++) {
    const ecu = data.ecus[i];
    const ecuColor = getActiveDiagram().canEcuPalette[i % getActiveDiagram().canEcuPalette.length];
    const x = margin + spacing * (i + 1) - ecuW / 2;
    const ecuGroup = createCanEcuNode(app, ecu.label, ecu.address, ecuColor, nodeStroke);
    ecuGroup.x = x;
    // Top of card sits 18px below bus midline → tap of 18 meets CAN-H/L center
    ecuGroup.y = busY + 18;
    ecuGroup.metadata = {
      ...ecuGroup.metadata,
      diagramId: ecu.id,
    };
    group.add(ecuGroup);
  }

  maybeApplyDiagramFlow(app, group, options as Record<string, unknown>);
  return group;
}
