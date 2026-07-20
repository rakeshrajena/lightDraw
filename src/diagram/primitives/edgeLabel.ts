/**
 * Connector edge label pill.
 */
import type { App } from '../../App';
import type { Group } from '../../shapes/Group';
import { getActiveDiagram } from '../theme';
import { measureTextWidth } from './measure';

export function createEdgeLabel(
  app: App,
  text: string,
  x: number,
  y: number,
  accentStroke: string = getActiveDiagram().edge
): Group {
  const fontSize = Math.max(getActiveDiagram().fontSize.sm, 12);
  const tw = measureTextWidth(text, fontSize, '700');
  const padX = 10;
  const padY = 5;
  const pw = Math.max(tw + padX * 2, 28);
  const ph = fontSize + padY * 2;
  const g = app.group({ listening: false, zIndex: 8 });
  g.add(
    app.roundedRect({
      x: x - pw / 2,
      y: y - ph / 2,
      width: pw,
      height: ph,
      cornerRadius: getActiveDiagram().radii.sm,
      fill: getActiveDiagram().labelPillFill,
      stroke: accentStroke,
      strokeWidth: Math.max(getActiveDiagram().stroke.label, 1.25),
      shadow: getActiveDiagram().shadowSoft,
      listening: false,
    })
  );
  g.add(
    app.text({
      text,
      x: x - tw / 2,
      y: y - fontSize / 2 - 1,
      fontSize,
      fontWeight: '700',
      fontFamily: getActiveDiagram().fontFamily,
      fill: getActiveDiagram().edgeLabel,
      listening: false,
    })
  );
  return g;
}
