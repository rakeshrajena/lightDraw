import type { App } from '../App';
import type { Group } from '../shapes/Group';
import { DIAGRAM, getActiveDiagram } from './theme';

export interface CardChromeOptions {
  width: number;
  height: number;
  cornerRadius?: number;
  fill: string;
  stroke: string;
  strokeWidth?: number;
  shadow?: typeof DIAGRAM.shadow | typeof DIAGRAM.shadowSoft | typeof DIAGRAM.shadowElevated | null;
  accentColor?: string;
  accentHeight?: number;
  sheen?: boolean;
}

/** Top edge highlight for depth on dark cards. */
export function addTopSheen(
  app: App,
  parent: Group,
  width: number,
  cornerRadius: number = getActiveDiagram().radii.md
): void {
  if (cornerRadius >= getActiveDiagram().radii.pill) return;
  const inset = Math.min(10, cornerRadius + 2);
  parent.add(
    app.line({
      x: inset,
      y: 1,
      x2: width - inset,
      y2: 1,
      stroke: getActiveDiagram().sheen,
      strokeWidth: 1,
      lineCap: 'round',
      listening: false,
    })
  );
}

/** Colored accent strip along the top of a card. */
export function addAccentBar(
  app: App,
  parent: Group,
  width: number,
  color: string,
  height = 3
): void {
  parent.add(
    app.rect({
      x: 0,
      y: 0,
      width,
      height,
      fill: color,
      stroke: null,
      listening: false,
    })
  );
}

/** Left status or tier stripe on pipeline / org cards. */
export function addLeftStripe(
  app: App,
  parent: Group,
  height: number,
  color: string,
  width = 4
): void {
  parent.add(
    app.rect({
      x: 0,
      y: 0,
      width,
      height,
      fill: color,
      stroke: null,
      listening: false,
    })
  );
}

/** Shared card body: rounded rect, optional accent, top sheen. */
export function addCardChrome(app: App, parent: Group, opts: CardChromeOptions): void {
  const radius = opts.cornerRadius ?? getActiveDiagram().radii.md;
  const strokeWidth = opts.strokeWidth ?? getActiveDiagram().stroke.node;

  parent.add(
    app.roundedRect({
      width: opts.width,
      height: opts.height,
      cornerRadius: radius,
      fill: opts.fill,
      stroke: opts.stroke,
      strokeWidth,
      ...(opts.shadow !== null && (opts.shadow ?? getActiveDiagram().shadowSoft)
        ? { shadow: opts.shadow ?? getActiveDiagram().shadowSoft }
        : {}),
      listening: false,
    })
  );

  // Square accent bar clips badly on pill radii — skip for capsules / state pills.
  if (opts.accentColor && radius < getActiveDiagram().radii.pill) {
    addAccentBar(app, parent, opts.width, opts.accentColor, opts.accentHeight ?? 3);
  }
  if (opts.sheen !== false) {
    addTopSheen(app, parent, opts.width, radius);
  }
}

/** Caption pill behind network / schematic labels. */
export function addCaptionPill(
  app: App,
  parent: Group,
  textWidth: number,
  x: number,
  y: number,
  accent: string = getActiveDiagram().labelPillStroke
): void {
  const fontSize = getActiveDiagram().fontSize.sm;
  const padX = 6;
  const pw = Math.max(textWidth + padX * 2, 24);
  const ph = fontSize + 6;
  parent.add(
    app.roundedRect({
      x: x + (textWidth - pw) / 2,
      y: y - 2,
      width: pw,
      height: ph,
      cornerRadius: getActiveDiagram().radii.sm,
      fill: getActiveDiagram().labelPillFill,
      stroke: accent,
      strokeWidth: getActiveDiagram().stroke.label,
      opacity: 0.92,
      listening: false,
    })
  );
}

/** Soft outer glow ring for emphasis (active pipeline, final state, etc.). */
export function addEmphasisRing(
  app: App,
  parent: Group,
  width: number,
  height: number,
  color: string,
  cornerRadius?: number
): void {
  const radius = cornerRadius ?? getActiveDiagram().radii.md;
  parent.add(
    app.roundedRect({
      x: -3,
      y: -3,
      width: width + 6,
      height: height + 6,
      cornerRadius: radius + 3,
      fill: null,
      stroke: color,
      strokeWidth: 1.5,
      opacity: 0.4,
      listening: false,
    })
  );
}
