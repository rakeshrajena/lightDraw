import type { App } from '../App';
import type { Group } from '../shapes/Group';
import { Arc, type Line, type TextNode } from '../shapes/index';

export interface DialGaugeStyle {
  trackColor: string;
  trackWidth?: number;
  faceColor?: string;
  bezelColor?: string;
  needleColor: string;
  tickColor?: string;
  tickLabelColor?: string;
  textColor: string;
  textMuted?: string;
  redlineColor?: string;
}

export interface DialGaugeBuildOptions {
  size: number;
  value: number;
  max: number;
  unit?: string;
  formatValue?: (v: number) => string;
  tickCount?: number;
  showTickLabels?: boolean;
  redlineFrom?: number;
  startAngle?: number;
  sweepAngle?: number;
  ariaLive?: 'polite' | 'assertive' | 'off';
}

export interface DialGaugeParts {
  needle: Line;
  valueText: TextNode;
  unitText?: TextNode;
}

const DEFAULT_START = Math.PI * 0.75;
const DEFAULT_SWEEP = Math.PI * 1.5;

/** Professional semicircular dial — bezel, ticks, layered needle hub */
export function buildDialGauge(
  app: App,
  group: Group,
  style: DialGaugeStyle,
  opts: DialGaugeBuildOptions
): DialGaugeParts {
  const size = opts.size;
  const cx = size / 2;
  const r = size / 2 - 14;
  const startAngle = opts.startAngle ?? DEFAULT_START;
  const sweep = opts.sweepAngle ?? DEFAULT_SWEEP;
  const endAngle = startAngle + sweep;
  const trackW = style.trackWidth ?? 10;
  const tickColor = style.tickColor ?? style.bezelColor ?? style.trackColor;
  const format = opts.formatValue ?? ((v: number) => String(Math.round(v)));
  const tickCount = opts.tickCount ?? 8;

  const shadow =
    size >= 130
      ? { color: 'rgba(0,0,0,0.4)', blur: Math.min(10, size / 14), offsetX: 0, offsetY: Math.min(3, size / 36) }
      : undefined;

  group.add(
    app.circle({
      x: cx - r - 6,
      y: cx - r - 6,
      radius: r + 6,
      fill: style.faceColor ?? '#111827',
      stroke: style.bezelColor ?? style.trackColor,
      strokeWidth: 2,
      shadow,
      listening: false,
    })
  );

  if (opts.redlineFrom !== undefined && opts.redlineFrom < 1) {
    group.add(
      new Arc({
        x: cx - r,
        y: cx - r,
        radius: r,
        startAngle: startAngle + sweep * opts.redlineFrom,
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
      endAngle: opts.redlineFrom !== undefined ? startAngle + sweep * opts.redlineFrom : endAngle,
      fill: null,
      stroke: style.trackColor,
      strokeWidth: trackW,
      listening: false,
    })
  );

  for (let i = 0; i <= tickCount; i++) {
    const t = i / tickCount;
    const a = startAngle + sweep * t;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    const major = i % 2 === 0;
    const inner = r - (major ? 16 : 12);
    const outer = r - 4;
    group.add(
      app.line({
        x: cx + inner * cos,
        y: cx + inner * sin,
        x2: (outer - inner) * cos,
        y2: (outer - inner) * sin,
        stroke: tickColor,
        strokeWidth: major ? 2 : 1,
        lineCap: 'round',
        listening: false,
      })
    );
    if (opts.showTickLabels && major) {
      const labelVal = Math.round(opts.max * t);
      const lr = r - 28;
      group.add(
        app.text({
          text: String(labelVal),
          x: cx + lr * cos,
          y: cx + lr * sin,
          fontSize: 9,
          fontWeight: '500',
          fill: style.tickLabelColor ?? style.textMuted ?? style.textColor,
          textAlign: 'center',
          textBaseline: 'middle',
          listening: false,
        })
      );
    }
  }

  const angle = startAngle + (opts.value / Math.max(opts.max, 1)) * sweep;
  const needleLen = r * 0.78;
  const needle = app.line({
    x: cx,
    y: cx,
    x2: needleLen * Math.cos(angle),
    y2: needleLen * Math.sin(angle),
    stroke: style.needleColor,
    strokeWidth: 3,
    lineCap: 'round',
    shadow: { color: 'rgba(0,0,0,0.35)', blur: 4, offsetX: 1, offsetY: 2 },
    listening: false,
  });

  group.add(
    app.circle({
      x: cx - 8,
      y: cx - 8,
      radius: 8,
      fill: style.bezelColor ?? '#374151',
      stroke: style.trackColor,
      strokeWidth: 1,
      listening: false,
    }),
    app.circle({
      x: cx - 4,
      y: cx - 4,
      radius: 4,
      fill: style.needleColor,
      listening: false,
    }),
    needle
  );

  const valueText = app.text({
    text: format(opts.value),
    x: cx,
    y: cx + r * 0.38,
    fontSize: Math.max(16, size * 0.11),
    fontWeight: 'bold',
    fill: style.textColor,
    textAlign: 'center',
    textBaseline: 'middle',
    ...(opts.ariaLive ? { ariaLive: opts.ariaLive } : {}),
    listening: false,
  });
  group.add(valueText);

  let unitText: TextNode | undefined;
  if (opts.unit) {
    unitText = app.text({
      text: opts.unit,
      x: cx,
      y: cx + r * 0.55,
      fontSize: 10,
      fontWeight: '500',
      fill: style.textMuted ?? style.textColor,
      textAlign: 'center',
      textBaseline: 'middle',
      listening: false,
    });
    group.add(unitText);
  }

  return { needle, valueText, unitText };
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
  sweep = DEFAULT_SWEEP
): void {
  const angle = dialNeedleAngle(value, max, start, sweep);
  const len = r * 0.78;
  (needle as { x2: number; y2: number }).x2 = len * Math.cos(angle);
  (needle as { y2: number }).y2 = len * Math.sin(angle);
}
