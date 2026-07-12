import type { App } from '../App';
import type { Group } from '../shapes/Group';
import { Arc, type Line, type TextNode } from '../shapes/index';
import { colorWithAlpha, mixColors } from '../utils/color';

export interface DialGaugeStyle {
  trackColor: string;
  trackWidth?: number;
  faceColor?: string;
  bezelColor?: string;
  needleColor: string;
  accentColor?: string;
  tickColor?: string;
  tickLabelColor?: string;
  textColor: string;
  textMuted?: string;
  redlineColor?: string;
}

export interface DialColorZone {
  from: number;
  to: number;
  color: string;
}

export interface DialGaugeBuildOptions {
  size: number;
  value: number;
  max: number;
  unit?: string;
  title?: string;
  formatValue?: (v: number) => string;
  formatTickLabel?: (v: number) => string;
  tickCount?: number;
  showTickLabels?: boolean;
  redlineFrom?: number;
  colorZones?: DialColorZone[];
  startAngle?: number;
  sweepAngle?: number;
  ariaLive?: 'polite' | 'assertive' | 'off';
  /** Override value label size (px); default scales with dial size. */
  valueFontSize?: number;
  unitFontSize?: number;
  titleFontSize?: number;
}

export interface DialGaugeParts {
  needle: Line;
  valueArc?: Arc;
  valueText: TextNode;
  unitText?: TextNode;
}

const DEFAULT_START = Math.PI * 0.75;
const DEFAULT_SWEEP = Math.PI * 1.5;

function textTopY(y: number, fontSize: number): number {
  return y - fontSize * 0.5;
}

function withAlpha(color: string, alpha: number): string {
  return colorWithAlpha(color, alpha) ?? color;
}

/** Professional semicircular dial — layered bezel, ticks, value arc, needle hub */
export function buildDialGauge(
  app: App,
  group: Group,
  style: DialGaugeStyle,
  opts: DialGaugeBuildOptions
): DialGaugeParts {
  const size = opts.size;
  const cx = size / 2;
  const inset = Math.max(4, Math.min(14, size * 0.1));
  const r = size / 2 - inset;
  const tickOutset = Math.max(3, size * 0.035);
  const majorLen = Math.max(5, size * 0.085);
  const minorLen = Math.max(3, size * 0.05);
  const startAngle = opts.startAngle ?? DEFAULT_START;
  const sweep = opts.sweepAngle ?? DEFAULT_SWEEP;
  const endAngle = startAngle + sweep;
  const trackW = style.trackWidth ?? Math.max(6, size * 0.055);
  const tickColor = style.tickColor ?? style.textMuted ?? '#cbd5e1';
  const face = style.faceColor ?? '#0a0a0a';
  const bezel = style.bezelColor ?? style.trackColor;
  const accent = style.accentColor ?? style.needleColor;
  const shell = mixColors(face, '#000000', 0.55) ?? '#050505';
  const trackUnderlay = mixColors(face, '#000000', 0.35) ?? '#1a1f2e';
  const hubFill = mixColors(face, '#ffffff', 0.12) ?? '#1f2937';
  const format = opts.formatValue ?? ((v: number) => String(Math.round(v)));
  const formatTick = opts.formatTickLabel ?? ((v: number) => String(Math.round(v)));
  const tickCount = opts.tickCount ?? 8;
  const hubOuter = Math.max(5, size * 0.065);
  const hubInner = Math.max(2.5, size * 0.032);
  const needleW = Math.max(2, size * 0.014);

  const shadow =
    size >= 120
      ? { color: 'rgba(0,0,0,0.45)', blur: Math.min(12, size / 12), offsetX: 0, offsetY: Math.min(4, size / 30) }
      : undefined;

  group.add(
    app.circle({
      x: cx - r - tickOutset - 2,
      y: cx - r - tickOutset - 2,
      radius: r + tickOutset + 2,
      fill: shell,
      stroke: bezel,
      strokeWidth: Math.max(1.5, size * 0.018),
      shadow,
      listening: false,
    }),
    app.circle({
      x: cx - r - tickOutset + 1,
      y: cx - r - tickOutset + 1,
      radius: r + tickOutset - 1,
      fill: face,
      stroke: withAlpha(bezel, 0.55),
      strokeWidth: 1,
      listening: false,
    })
  );

  group.add(
    new Arc({
      x: cx - r,
      y: cx - r,
      radius: r,
      startAngle,
      endAngle,
      fill: null,
      stroke: trackUnderlay,
      strokeWidth: trackW + 2,
      listening: false,
    })
  );

  if (opts.colorZones?.length) {
    for (const zone of opts.colorZones) {
      group.add(
        new Arc({
          x: cx - r,
          y: cx - r,
          radius: r,
          startAngle: startAngle + sweep * zone.from,
          endAngle: startAngle + sweep * zone.to,
          fill: null,
          stroke: zone.color,
          strokeWidth: trackW,
          listening: false,
        })
      );
    }
  } else {
    const redlineStart = opts.redlineFrom;
    if (redlineStart !== undefined && redlineStart < 1) {
      group.add(
        new Arc({
          x: cx - r,
          y: cx - r,
          radius: r,
          startAngle: startAngle + sweep * redlineStart,
          endAngle,
          fill: null,
          stroke: style.redlineColor ?? '#ef4444',
          strokeWidth: trackW,
          listening: false,
        })
      );
    }
    group.add(
      new Arc({
        x: cx - r,
        y: cx - r,
        radius: r,
        startAngle,
        endAngle: redlineStart !== undefined ? startAngle + sweep * redlineStart : endAngle,
        fill: null,
        stroke: style.trackColor,
        strokeWidth: trackW,
        listening: false,
      })
    );
  }

  const valueAngle = startAngle + (opts.value / Math.max(opts.max, 1)) * sweep;
  const valueArc =
    opts.value > 0 && size >= 96
      ? new Arc({
          x: cx - r,
          y: cx - r,
          radius: r,
          startAngle,
          endAngle: valueAngle,
          fill: null,
          stroke: withAlpha(accent, 0.32),
          strokeWidth: Math.max(2, trackW * 0.38),
          listening: false,
        })
      : undefined;
  if (valueArc) group.add(valueArc);

  for (let i = 0; i <= tickCount; i++) {
    const t = i / tickCount;
    const a = startAngle + sweep * t;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    const major = i % 2 === 0;
    const outer = r - tickOutset * 0.35;
    const inner = outer - (major ? majorLen : minorLen);
    const dx = (outer - inner) * cos;
    const dy = (outer - inner) * sin;
    group.add(
      app.line({
        x: cx + inner * cos,
        y: cx + inner * sin,
        x2: dx,
        y2: dy,
        stroke: major ? tickColor : withAlpha(tickColor, 0.55),
        strokeWidth: major ? Math.max(1.5, size * 0.016) : 1,
        lineCap: 'round',
        listening: false,
      })
    );
    if (opts.showTickLabels && major && size >= 96) {
      const labelVal = formatTick(opts.max * t);
      const lr = r - Math.max(majorLen + 6, size * 0.16);
      const lx = cx + lr * cos;
      const ly = cx + lr * sin;
      const skipTop = sin < -0.35 && Math.abs(cos) < 0.55;
      if (skipTop) continue;
      const labelSize = Math.max(7, size * 0.085);
      group.add(
        app.text({
          text: labelVal,
          x: lx,
          y: textTopY(ly, labelSize),
          fontSize: labelSize,
          fontWeight: '500',
          fill: style.tickLabelColor ?? style.textMuted ?? style.textColor,
          textAlign: 'center',
          metadata: { textBoxWidth: Math.max(18, size * 0.22), textBoxCenterY: ly },
          listening: false,
        })
      );
    }
  }

  if (opts.title && size >= 72) {
    const titleSize = opts.titleFontSize ?? Math.max(7, size * 0.068);
    const titleY = cx - r * 0.5;
    group.add(
      app.text({
        text: opts.title.toUpperCase(),
        x: cx,
        y: textTopY(titleY, titleSize),
        fontSize: titleSize,
        fontWeight: '600',
        fill: style.textMuted ?? style.tickLabelColor ?? style.textColor,
        textAlign: 'center',
        metadata: { textBoxWidth: size, textBoxCenterY: titleY },
        listening: false,
      })
    );
  }

  const angle = valueAngle;
  const needleLen = r * 0.76;
  const needle = app.line({
    x: cx,
    y: cx,
    x2: needleLen * Math.cos(angle),
    y2: needleLen * Math.sin(angle),
    stroke: style.needleColor,
    strokeWidth: needleW,
    lineCap: 'round',
    shadow: { color: 'rgba(0,0,0,0.4)', blur: 4, offsetX: 1, offsetY: 2 },
    listening: false,
  });

  group.add(needle);
  group.add(
    app.circle({
      x: cx - hubOuter,
      y: cx - hubOuter,
      radius: hubOuter,
      fill: hubFill,
      stroke: bezel,
      strokeWidth: 1,
      listening: false,
    }),
    app.circle({
      x: cx - hubInner,
      y: cx - hubInner,
      radius: hubInner,
      fill: style.needleColor,
      listening: false,
    }),
  );

  const valueSize = opts.valueFontSize ?? Math.max(11, size * 0.115);
  const valueY = cx + r * 0.08;
  const valueText = app.text({
    text: format(opts.value),
    x: cx,
    y: textTopY(valueY, valueSize),
    fontSize: valueSize,
    fontWeight: 'bold',
    fill: style.textColor,
    textAlign: 'center',
    metadata: { textBoxWidth: size, textBoxCenterY: valueY },
    ...(opts.ariaLive ? { ariaLive: opts.ariaLive } : {}),
    listening: false,
  });
  group.add(valueText);

  let unitText: TextNode | undefined;
  if (opts.unit) {
    const unitSize = opts.unitFontSize ?? Math.max(8, size * 0.072);
    const unitY = cx + r * 0.26;
    unitText = app.text({
      text: opts.unit.trim(),
      x: cx,
      y: textTopY(unitY, unitSize),
      fontSize: unitSize,
      fontWeight: '500',
      fill: style.textMuted ?? style.textColor,
      textAlign: 'center',
      metadata: { textBoxWidth: size, textBoxCenterY: unitY },
      listening: false,
    });
    group.add(unitText);
  }

  return { needle, valueArc, valueText, unitText };
}

export function dialNeedleAngle(value: number, max: number, start = DEFAULT_START, sweep = DEFAULT_SWEEP): number {
  return start + (value / Math.max(max, 1)) * sweep;
}

export function updateDialNeedle(
  needle: Line,
  _cx: number,
  value: number,
  max: number,
  r: number,
  start = DEFAULT_START,
  sweep = DEFAULT_SWEEP,
  counterweight?: Line,
  valueArc?: Arc
): void {
  const angle = dialNeedleAngle(value, max, start, sweep);
  const len = r * 0.76;
  (needle as { x2: number; y2: number }).x2 = len * Math.cos(angle);
  (needle as { y2: number }).y2 = len * Math.sin(angle);
  if (counterweight) {
    const counterLen = r * 0.11;
    (counterweight as { x2: number; y2: number }).x2 = -counterLen * Math.cos(angle);
    (counterweight as { y2: number }).y2 = -counterLen * Math.sin(angle);
  }
  if (valueArc) {
    valueArc.endAngle = angle;
    valueArc.visible = value > 0;
  }
}
