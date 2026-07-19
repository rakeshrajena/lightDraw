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
  const fontSize = getActiveDiagram().fontSize.sm;
  const tw = measureTextWidth(text, fontSize, '600');
  const padX = 8;
  const padY = 4;
  const pw = tw + padX * 2;
  const ph = fontSize + padY * 2;
  const g = app.group({ listening: false });
  g.add(
    app.roundedRect({
      x: x - pw / 2,
      y: y - ph / 2,
      width: pw,
      height: ph,
      cornerRadius: getActiveDiagram().radii.sm,
      fill: getActiveDiagram().labelPillFill,
      stroke: accentStroke,
      strokeWidth: getActiveDiagram().stroke.label,
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
      fontWeight: '600',
      fontFamily: getActiveDiagram().fontFamily,
      fill: getActiveDiagram().edgeLabel,
      listening: false,
    })
  );
  return g;
}
