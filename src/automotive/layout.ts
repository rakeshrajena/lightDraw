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
  const innerWidth = Math.max(24, width - pad * 2);
  const innerHeight = Math.max(20, height - pad * 2);
  const maxDial = Math.min(innerWidth, innerHeight);
  const explicit = num(props, 'size', 0);
  const dialSize =
    explicit > 0 ? Math.min(explicit, maxDial) : Math.max(28, maxDial);
  return { width, height, pad, innerWidth, innerHeight, dialSize };
}

/** True when widget should use compact LCD layout instead of analog dial. */
export function isCompactBounds(bounds: WidgetBounds): boolean {
  return bounds.innerWidth < 112 || bounds.innerHeight < 76;
}

/** Estimate left-x so text fits inside a box (avoids center-anchor bounds overflow). */
export function fitTextX(text: string, fontSize: number, boxW: number, pad = 0): number {
  const estW = Math.min(boxW - pad * 2, Math.max(fontSize, text.length * fontSize * 0.55));
  return pad + Math.max(0, (boxW - pad * 2 - estW) / 2);
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
  } = {}
) {
  const fontSize = options.fontSize ?? 12;
  return app.text({
    text,
    x: fitTextX(text, fontSize, boxW),
    y,
    fontSize,
    fontWeight: options.fontWeight ?? 'normal',
    fill: options.fill ?? '#fff',
    fontFamily: options.fontFamily,
    textAlign: 'left',
    textBaseline: options.textBaseline ?? 'middle',
    metadata: { textBoxWidth: boxW },
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

/** Proportional instrument-cluster layout — all child widgets scale to cluster bounds. */
export function resolveClusterLayout(w: number, h: number): ClusterSlot[] {
  const tiny = w < 140 || h < 90;
  const margin = Math.max(tiny ? 4 : 6, Math.min(w, h) * (tiny ? 0.014 : 0.018));
  const short = h < 240;
  const bottomBand = Math.max(short ? 22 : 26, Math.round(h * (short ? 0.12 : 0.14)));
  const bottomY = h - bottomBand - margin * 0.5;
  const topSpace = Math.max(36, bottomY - margin);
  const cx = w / 2;

  const dialSize = Math.max(36, Math.min(w * 0.18, topSpace * (short ? 0.38 : 0.44)));
  let dialBox = dialSize + Math.max(6, dialSize * 0.08);
  const maxDialBox = Math.max(40, (w - margin * 3) / 2);
  if (dialBox > maxDialBox) {
    dialBox = maxDialBox;
  }
  const fittedDialSize = Math.max(40, dialBox - Math.max(6, dialBox * 0.08));
  const smallDial = Math.max(28, Math.min(dialSize * 0.48, w * 0.09, topSpace * 0.2));
  const smallBox = smallDial + Math.max(5, smallDial * 0.08);

  const gearW = Math.max(34, w * 0.065);
  const gearH = Math.max(30, Math.min(h * 0.13, topSpace * 0.2));
  const turnW = Math.max(36, w * 0.065);
  const turnH = Math.max(14, h * 0.055);

  const fuelW = Math.max(52, w * 0.13);
  const fuelH = Math.max(26, bottomBand * 0.86);
  const batW = Math.max(44, w * 0.1);
  const batH = Math.max(18, bottomBand * 0.55);
  const tpmsW = Math.max(68, w * 0.17);
  const tpmsH = Math.max(36, Math.min(h * 0.18, topSpace * 0.26));
  let lampSize = Math.max(18, Math.min(bottomBand * 0.75, w * 0.036));
  let cruiseW = Math.max(40, w * 0.085);
  let cruiseH = Math.max(16, bottomBand * 0.48);
  let adasW = Math.max(48, w * 0.1);
  let adasH = Math.max(12, bottomBand * 0.4);

  const dialBottom = margin + dialBox;
  const midGap = Math.max(3, (bottomY - dialBottom - gearH - turnH) / 3);
  const gearY = dialBottom + midGap;
  const turnY = gearY + gearH + Math.max(2, midGap * 0.35);
  const tpmsY = Math.min(turnY + turnH + midGap, bottomY - tpmsH - 2);

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

  const slots: ClusterSlot[] = [
    { type: 'speedometer', x: margin, y: margin, width: dialBox, height: dialBox, size: fittedDialSize },
    { type: 'tachometer', x: w - margin - dialBox, y: margin, width: dialBox, height: dialBox, size: fittedDialSize },
    { type: 'engineTemp', x: cx - smallBox / 2, y: margin + 3, width: smallBox, height: smallBox, size: smallDial },
    { type: 'gearIndicator', x: cx - gearW / 2, y: gearY, width: gearW, height: gearH },
    { type: 'turnIndicators', x: cx - turnW / 2, y: turnY, width: turnW, height: turnH },
    {
      type: 'tpms',
      x: cx - tpmsW / 2,
      y: Math.max(margin + smallBox + 2, tpmsY),
      width: tpmsW,
      height: tpmsH,
    },
    { type: 'fuelGauge', x: margin, y: centerY(fuelH), width: fuelW, height: fuelH },
    { type: 'batteryVoltage', x: margin + fuelW + margin * 0.35, y: centerY(batH), width: batW, height: batH },
    placeRight('adasStatus', adasW, adasH),
    placeRight('warningLamp', lampSize, lampSize),
    placeRight('cruiseControl', cruiseW, cruiseH),
    placeRight('headlights', lampSize, lampSize),
    placeRight('parkingBrake', lampSize, lampSize),
  ];

  return slots.map((slot) => ({
    ...slot,
    x: Math.max(margin, Math.min(slot.x, w - margin - slot.width)),
    y: Math.max(margin, Math.min(slot.y, h - margin - slot.height)),
  }));
}
