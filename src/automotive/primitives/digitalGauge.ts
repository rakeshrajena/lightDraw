import type { App } from '../../App';
import type { Group } from '../../shapes/Group';
import type { RoundedRect, TextNode } from '../../shapes/index';
import type { WidgetBounds } from '../layout';
import { fitTextX, fluidFont } from '../layout';
import type { ThemePalette } from '../themes';

export interface DigitalGaugeStyle {
  panelFill: string;
  panelStroke: string;
  labelColor: string;
  valueColor: string;
  unitColor: string;
  barTrack: string;
  barFill: string;
  segmentOn: string;
  segmentOff: string;
}

export function digitalGaugeStyle(theme: ThemePalette): DigitalGaugeStyle {
  const isDigital = theme.background === '#020617';
  return {
    panelFill: isDigital ? '#041018' : '#111827',
    panelStroke: theme.dialStroke,
    labelColor: theme.textMuted,
    valueColor: theme.text,
    unitColor: theme.accent,
    barTrack: theme.lampOff,
    barFill: theme.accent,
    segmentOn: theme.accent,
    segmentOff: '#1e293b',
  };
}

export interface DigitalGaugeOptions {
  label: string;
  value: number;
  max: number;
  unit?: string;
  formatValue?: (v: number) => string;
  showBar?: boolean;
  showSegments?: boolean;
  segmentCount?: number;
}

export interface DigitalGaugeParts {
  valueText: TextNode;
  barFill?: RoundedRect;
  segments?: RoundedRect[];
  segmentOn: string;
  segmentOff: string;
}

/** LCD-style digital gauge — large readout, label, optional bar/segments. */
export function buildDigitalGauge(
  app: App,
  group: Group,
  bounds: WidgetBounds,
  style: DigitalGaugeStyle,
  opts: DigitalGaugeOptions
): DigitalGaugeParts {
  const w = bounds.innerWidth;
  const h = bounds.innerHeight;
  const compact = h < 72 || w < 96;
  const format = opts.formatValue ?? ((v: number) => String(Math.round(v)));
  const pct = Math.min(1, Math.max(0, opts.value / Math.max(opts.max, 1)));

  group.add(
    app.roundedRect({
      width: w,
      height: h,
      cornerRadius: Math.min(10, h * 0.12),
      fill: style.panelFill,
      stroke: style.panelStroke,
      strokeWidth: compact ? 1 : 1.5,
      listening: false,
    })
  );

  const labelY = compact ? h * 0.22 : h * 0.18;
  const valueY = compact ? h * 0.52 : h * 0.48;
  const unitY = compact ? h * 0.78 : h * 0.68;

  group.add(
    app.text({
      text: opts.label.toUpperCase(),
      x: fitTextX(opts.label.toUpperCase(), fluidFont(9, bounds, 6, 10), w),
      y: labelY,
      fontSize: fluidFont(9, bounds, 6, 10),
      fontWeight: '600',
      fill: style.labelColor,
      textAlign: 'left',
      textBaseline: 'middle',
      listening: false,
    })
  );

  const displayVal = compact && opts.unit ? `${format(opts.value)}${opts.unit}` : format(opts.value);
  const valueSize = fluidFont(compact ? 20 : 28, bounds, 12, 36);
  const valueText = app.text({
    text: displayVal,
    x: fitTextX(displayVal, valueSize, w),
    y: valueY,
    fontSize: valueSize,
    fontWeight: 'bold',
    fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
    fill: style.valueColor,
    textAlign: 'left',
    textBaseline: 'middle',
    listening: false,
  });
  group.add(valueText);

  if (opts.unit && !compact) {
    const unitSize = fluidFont(10, bounds, 7, 12);
    group.add(
      app.text({
        text: opts.unit,
        x: fitTextX(opts.unit, unitSize, w),
        y: unitY,
        fontSize: unitSize,
        fontWeight: '600',
        fill: style.unitColor,
        textAlign: 'left',
        textBaseline: 'middle',
        listening: false,
      })
    );
  }

  let barFill: RoundedRect | undefined;
  if (opts.showBar !== false && !compact) {
    const barH = Math.max(4, Math.round(h * 0.06));
    const barY = h - barH - Math.max(6, bounds.pad * 0.4);
    const barW = w - bounds.pad;
    const barX = bounds.pad * 0.5;
    group.add(
      app.roundedRect({
        x: barX,
        y: barY,
        width: barW,
        height: barH,
        fill: style.barTrack,
        cornerRadius: barH / 2,
        listening: false,
      })
    );
    barFill = app.roundedRect({
      x: barX,
      y: barY,
      width: barW * pct,
      height: barH,
      fill: style.barFill,
      cornerRadius: barH / 2,
      listening: false,
    });
    group.add(barFill);
  }

  const segments: RoundedRect[] = [];
  if (opts.showSegments && !compact) {
    const count = opts.segmentCount ?? 12;
    const segW = Math.max(3, (w - bounds.pad * 2 - (count - 1) * 2) / count);
    const segH = Math.max(4, h * 0.05);
    const segY = h - segH - Math.max(8, bounds.pad * 0.5);
    const lit = Math.round(pct * count);
    for (let i = 0; i < count; i++) {
      const seg = app.roundedRect({
        x: bounds.pad * 0.5 + i * (segW + 2),
        y: segY,
        width: segW,
        height: segH,
        fill: i < lit ? style.segmentOn : style.segmentOff,
        cornerRadius: 1,
        listening: false,
      });
      segments.push(seg);
      group.add(seg);
    }
  }

  return { valueText, barFill, segments, segmentOn: style.segmentOn, segmentOff: style.segmentOff };
}

export function updateDigitalGauge(
  parts: DigitalGaugeParts,
  value: number,
  max: number,
  format: (v: number) => string,
  barWidth: number,
  segmentCount?: number
): void {
  const pct = Math.min(1, Math.max(0, value / Math.max(max, 1)));
  parts.valueText.text = format(value);
  if (parts.barFill) {
    parts.barFill.width = barWidth * pct;
  }
  if (parts.segments && segmentCount) {
    const lit = Math.round(pct * segmentCount);
    parts.segments.forEach((seg, i) => {
      (seg as RoundedRect & { fill: string }).fill = i < lit ? parts.segmentOn : parts.segmentOff;
    });
  }
}
