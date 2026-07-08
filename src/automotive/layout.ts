import { bool, num, str } from './helpers';

export interface WidgetBounds {
  width: number;
  height: number;
  pad: number;
  innerWidth: number;
  innerHeight: number;
  dialSize: number;
}

/** Resolve widget box from props — dials use dialSize, panels use width/height. */
export function resolveBounds(
  props: Record<string, unknown>,
  defaultWidth: number,
  defaultHeight: number,
  pad = 8
): WidgetBounds {
  const width =
    'width' in props && typeof props.width === 'number'
      ? Math.max(24, props.width)
      : Math.max(56, num(props, 'width', defaultWidth));
  const height =
    'height' in props && typeof props.height === 'number'
      ? Math.max(20, props.height)
      : Math.max(44, num(props, 'height', defaultHeight));
  const adaptivePad = Math.min(pad, Math.max(2, Math.round(Math.min(width, height) * 0.1)));
  const innerWidth = Math.max(16, width - adaptivePad * 2);
  const innerHeight = Math.max(12, height - adaptivePad * 2);
  const maxDial = Math.min(innerWidth, innerHeight);
  const explicit = num(props, 'size', 0);
  const dialSize =
    explicit > 0 ? Math.min(explicit, maxDial) : Math.max(28, maxDial);
  return { width, height, pad: adaptivePad, innerWidth, innerHeight, dialSize };
}

/** True when widget should use compact LCD layout instead of analog dial. */
export function isCompactBounds(bounds: WidgetBounds): boolean {
  return bounds.innerWidth < 112 || bounds.innerHeight < 76;
}

/** Estimate rendered text width for automotive monospace/sans labels. */
export function estimateTextWidth(text: string, fontSize: number): number {
  return Math.max(fontSize, text.length * fontSize * 0.55);
}

/** Estimate left-x so text fits inside a box (avoids center-anchor bounds overflow). */
export function fitTextX(text: string, fontSize: number, boxW: number, pad = 0): number {
  const estW = Math.min(boxW - pad * 2, estimateTextWidth(text, fontSize));
  return pad + Math.max(0, (boxW - pad * 2 - estW) / 2);
}

/** Shrink font until text fits inside a box; returns centered left-x. */
export function fitFontSizeToWidth(
  text: string,
  boxW: number,
  maxSize: number,
  minSize = 6,
  pad = 0
): { fontSize: number; x: number } {
  const available = Math.max(8, boxW - pad * 2);
  let fontSize = maxSize;
  while (fontSize > minSize && estimateTextWidth(text, fontSize) > available) {
    fontSize -= 1;
  }
  const estW = Math.min(available, estimateTextWidth(text, fontSize));
  return { fontSize, x: pad + Math.max(0, (available - estW) / 2) };
}

/** Convert a desired anchor y into canvas top-y (renderer uses textBaseline top). */
export function textYForBaseline(y: number, fontSize: number, baseline: CanvasTextBaseline = 'middle'): number {
  if (baseline === 'middle') return y - fontSize * 0.5;
  if (baseline === 'bottom' || baseline === 'ideographic') return y - fontSize;
  return y;
}

/** Centered text with stable box for HTML + bounds. */
export function autoCenteredText(
  app: import('../App').App,
  text: string,
  boxW: number,
  y: number,
  options: {
    fontSize?: number;
    fontWeight?: string;
    fill?: string;
    fontFamily?: string;
    textBaseline?: CanvasTextBaseline;
    insetX?: number;
    insetY?: number;
  } = {}
) {
  const fontSize = options.fontSize ?? 12;
  const insetX = options.insetX ?? 0;
  const insetY = options.insetY ?? 0;
  const baseline = options.textBaseline ?? 'middle';
  return app.text({
    text,
    x: insetX + boxW / 2,
    y: insetY + textYForBaseline(y, fontSize, baseline),
    fontSize,
    fontWeight: options.fontWeight ?? 'normal',
    fill: options.fill ?? '#fff',
    fontFamily: options.fontFamily,
    textAlign: 'center',
    metadata: { textBoxWidth: boxW, textBoxCenterY: insetY + y },
    listening: false,
  });
}

export function fluidFont(base: number, bounds: WidgetBounds, min = 8, max = 24): number {
  const scale = Math.min(bounds.innerWidth, bounds.innerHeight) / 120;
  return Math.round(Math.min(max, Math.max(min, base * scale)));
}

export function centerInBounds(
  bounds: WidgetBounds,
  contentW: number,
  contentH: number
): { x: number; y: number } {
  return {
    x: bounds.pad + Math.max(0, (bounds.innerWidth - contentW) / 2),
    y: bounds.pad + Math.max(0, (bounds.innerHeight - contentH) / 2),
  };
}

export type GaugeDisplay = 'analog' | 'digital';

/** Resolve analog needle dial vs digital LCD readout. */
export function resolveDisplay(
  props: Record<string, unknown>,
  fallback: GaugeDisplay = 'analog'
): GaugeDisplay {
  const mode = str(props, 'display', '').toLowerCase();
  if (mode === 'digital' || mode === 'lcd') return 'digital';
  if (mode === 'analog') return 'analog';
  if (str(props, 'theme', '') === 'digital' && bool(props, 'digitalGauges', false)) {
    return 'digital';
  }
  return fallback;
}

export interface ClusterSlot {
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  size?: number;
}

export interface ClusterLayoutOptions {
  callScreen?: boolean;
}

/** Proportional instrument-cluster layout — all child widgets scale to cluster bounds. */
export function resolveClusterLayout(w: number, h: number, options: ClusterLayoutOptions = {}): ClusterSlot[] {
  const tiny = w < 140 || h < 90;
  const compact = h < 200;
  const margin = Math.max(tiny ? 4 : 6, Math.min(w, h) * (tiny ? 0.014 : 0.018));
  const short = h < 240;
  const bottomBand = Math.max(short ? 22 : 26, Math.round(h * (short ? 0.12 : 0.14)));
  const bottomY = h - bottomBand - margin * 0.5;
  const topSpace = Math.max(36, bottomY - margin);
  const cx = w / 2;

  const dialSize = Math.max(compact ? 32 : 36, Math.min(w * 0.18, topSpace * (short ? 0.36 : 0.44)));
  let dialBox = dialSize + Math.max(compact ? 4 : 6, dialSize * 0.08);
  const maxDialBox = Math.max(compact ? 36 : 40, (w - margin * 3) / 2);
  if (dialBox > maxDialBox) {
    dialBox = maxDialBox;
  }
  const fittedDialSize = Math.max(compact ? 28 : 40, dialBox - Math.max(compact ? 4 : 6, dialBox * 0.08));
  const smallDial = Math.max(compact ? 22 : 28, Math.min(dialSize * 0.48, w * 0.09, topSpace * 0.2));
  const smallBox = smallDial + Math.max(compact ? 4 : 5, smallDial * 0.08);

  const gearW = Math.max(compact ? 30 : 34, w * 0.065);
  let gearH = compact
    ? Math.max(20, Math.min(24, h * 0.11))
    : Math.max(30, Math.min(h * 0.13, topSpace * 0.2));
  const turnW = Math.max(compact ? 32 : 36, w * 0.065);
  let turnH = compact ? Math.max(11, h * 0.042) : Math.max(14, h * 0.055);

  const fuelW = Math.max(52, w * 0.13);
  const fuelH = Math.max(compact ? 22 : 26, bottomBand * 0.86);
  const batW = Math.max(44, w * 0.1);
  const batH = Math.max(16, bottomBand * 0.55);
  const tpmsW = Math.max(compact ? 64 : 68, w * 0.17);
  let tpmsH = compact
    ? Math.max(22, Math.min(28, h * 0.14))
    : Math.max(36, Math.min(h * 0.18, topSpace * 0.26));
  let lampSize = Math.max(compact ? 14 : 18, Math.min(bottomBand * 0.75, w * 0.036));
  let cruiseW = Math.max(36, w * 0.085);
  let cruiseH = Math.max(compact ? 13 : 16, bottomBand * 0.48);
  let adasW = Math.max(40, w * 0.1);
  let adasH = Math.max(10, bottomBand * 0.4);

  const centerTop = margin + smallBox + (compact ? 2 : 4);
  const centerBottom = bottomY - (compact ? 2 : 4);
  const centerGap = compact ? 3 : 4;
  let centerNeed = gearH + turnH + tpmsH + centerGap * 2;
  const centerAvail = Math.max(24, centerBottom - centerTop);
  if (centerNeed > centerAvail) {
    const scale = centerAvail / centerNeed;
    gearH = Math.max(18, gearH * scale);
    turnH = Math.max(10, turnH * scale);
    tpmsH = Math.max(18, tpmsH * scale);
    centerNeed = gearH + turnH + tpmsH + centerGap * 2;
  }
  const centerSlack = Math.max(0, centerAvail - centerNeed);
  const gearY = centerTop + centerSlack * 0.12;
  const turnY = gearY + gearH + centerGap;
  const tpmsY = turnY + turnH + centerGap;

  const centerY = (boxH: number) =>
    Math.min(bottomY + (bottomBand - boxH) / 2, h - margin - boxH);

  const leftUsed = margin + fuelW + margin * 0.35 + batW + margin;
  const rightNeeded = lampSize * 3 + cruiseW + adasW + margin * 1.4;
  const rightAvail = Math.max(40, w - leftUsed - margin - tpmsW * 0.35);
  if (rightNeeded > rightAvail) {
    const scale = rightAvail / rightNeeded;
    lampSize = Math.max(16, lampSize * scale);
    cruiseW = Math.max(36, cruiseW * scale);
    cruiseH = Math.max(14, cruiseH * scale);
    adasW = Math.max(40, adasW * scale);
    adasH = Math.max(10, adasH * scale);
  }

  let rx = w - margin;
  const placeRight = (type: string, rw: number, rh: number): ClusterSlot => {
    rx -= rw;
    const x = Math.max(margin, rx);
    const slot = { type, x, y: centerY(rh), width: rw, height: rh };
    rx = x - margin * 0.28;
    return slot;
  };

  const compactRight = compact && w < 320;
  const rightSlots: ClusterSlot[] = compactRight
    ? [placeRight('cruiseControl', cruiseW, cruiseH), placeRight('adasStatus', adasW, adasH)]
    : [
        placeRight('adasStatus', adasW, adasH),
        placeRight('warningLamp', lampSize, lampSize),
        placeRight('cruiseControl', cruiseW, cruiseH),
        placeRight('headlights', lampSize, lampSize),
        placeRight('parkingBrake', lampSize, lampSize),
      ];

  const interGap = Math.max(6, margin * 0.45);
  const callBandW = w - margin * 2 - dialBox * 2 - interGap * 2;
  const showCall = !!options.callScreen && w >= 520 && h >= 220 && callBandW >= 120;

  const centerSlots: ClusterSlot[] = [];
  if (showCall) {
    const callH = Math.max(72, Math.min(h * 0.36, dialBox * 1.02, topSpace * 0.58));
    const callY =
      margin +
      Math.max(0, (dialBox - callH) * 0.42) +
      (compact && h < 176 ? 0 : smallBox * 0.12);
    centerSlots.push({
      type: 'callScreen',
      x: margin + dialBox + interGap,
      y: callY,
      width: callBandW,
      height: callH,
    });
    const bottomGearY = bottomY + (bottomBand - gearH) / 2;
    const gearX = Math.max(margin + dialBox + interGap, cx - gearW - turnW / 2 - 4);
    centerSlots.push(
      { type: 'gearIndicator', x: gearX, y: bottomGearY, width: gearW, height: gearH },
      {
        type: 'turnIndicators',
        x: Math.min(w - margin - dialBox - interGap - turnW, cx - turnW / 2),
        y: bottomGearY + (gearH - turnH) / 2,
        width: turnW,
        height: turnH,
      }
    );
    if (h >= 340) {
      const tpmsStripH = Math.max(22, Math.min(30, tpmsH));
      const tpmsY2 = callY + callH + 6;
      if (tpmsY2 + tpmsStripH <= bottomY - 4) {
        centerSlots.push({ type: 'tpms', x: cx - tpmsW / 2, y: tpmsY2, width: tpmsW, height: tpmsStripH });
      }
    }
  } else {
    centerSlots.push(
      { type: 'gearIndicator', x: cx - gearW / 2, y: gearY, width: gearW, height: gearH },
      { type: 'turnIndicators', x: cx - turnW / 2, y: turnY, width: turnW, height: turnH },
      { type: 'tpms', x: cx - tpmsW / 2, y: tpmsY, width: tpmsW, height: tpmsH }
    );
  }

  const slots: ClusterSlot[] = [
    { type: 'speedometer', x: margin, y: margin, width: dialBox, height: dialBox, size: fittedDialSize },
    { type: 'tachometer', x: w - margin - dialBox, y: margin, width: dialBox, height: dialBox, size: fittedDialSize },
    ...(compact && h < 176 || showCall
      ? []
      : [{ type: 'engineTemp', x: cx - smallBox / 2, y: margin + 3, width: smallBox, height: smallBox, size: smallDial }]),
    ...centerSlots,
    { type: 'fuelGauge', x: margin, y: centerY(fuelH), width: fuelW, height: fuelH },
    { type: 'batteryVoltage', x: margin + fuelW + margin * 0.35, y: centerY(batH), width: batW, height: batH },
    ...rightSlots,
  ];

  return slots.map((slot) => ({
    ...slot,
    x: Math.max(margin, Math.min(slot.x, w - margin - slot.width)),
    y: Math.max(margin, Math.min(slot.y, h - margin - slot.height)),
  }));
}
