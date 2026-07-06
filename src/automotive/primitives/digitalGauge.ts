import type { App } from '../../App';
import type { Group } from '../../shapes/Group';
import type { RoundedRect, TextNode } from '../../shapes/index';
import type { WidgetBounds } from '../layout';
import { fluidFont } from '../layout';
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
  const format = opts.formatValue ?? ((v: number) => String(Math.round(v)));
  const pct = Math.min(1, Math.max(0, opts.value / Math.max(opts.max, 1)));

  group.add(
    app.roundedRect({
      width: w,
      height: h,
      cornerRadius: Math.min(10, h * 0.12),
      fill: style.panelFill,
      stroke: style.panelStroke,
      strokeWidth: 1.5,
      listening: false,
    })
  );

  group.add(
    app.text({
      text: opts.label.toUpperCase(),
      x: w / 2,
      y: h * 0.18,
      fontSize: fluidFont(9, bounds, 7, 10),
      fontWeight: '600',
      fill: style.labelColor,
      textAlign: 'center',
      textBaseline: 'middle',
      listening: false,
    })
  );

  const valueText = app.text({
    text: format(opts.value),
    x: w / 2,
    y: h * 0.48,
    fontSize: fluidFont(28, bounds, 18, 36),
    fontWeight: 'bold',
    fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
    fill: style.valueColor,
    textAlign: 'center',
    textBaseline: 'middle',
    listening: false,
  });
  group.add(valueText);

  if (opts.unit) {
    group.add(
      app.text({
        text: opts.unit,
        x: w / 2,
        y: h * 0.68,
        fontSize: fluidFont(10, bounds, 8, 12),
        fontWeight: '600',
        fill: style.unitColor,
        textAlign: 'center',
        textBaseline: 'middle',
        listening: false,
      })
    );
  }

  let barFill: RoundedRect | undefined;
  if (opts.showBar !== false) {
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
  if (opts.showSegments) {
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
