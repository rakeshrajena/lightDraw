import type { App } from '../../App';
import type { Group } from '../../shapes/Group';
import type { RoundedRect, TextNode } from '../../shapes/index';
import type { WidgetBounds } from '../layout';
import { estimateTextWidth, fitFontSizeToWidth, fitTextX, fluidFont, textYForBaseline } from '../layout';
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

function formatCompactDigitalValue(
  value: number,
  unit: string | undefined,
  format: (v: number) => string,
  boxW: number,
  maxFont: number
): string {
  if (!unit) return format(value);
  const rounded = format(value);
  const full = unit === 'RPM' ? `${rounded}${unit}` : `${rounded} ${unit}`;
  if (estimateTextWidth(full, maxFont) <= boxW) return full;
  if (unit === 'RPM' && value >= 1000) {
    const short = `${(value / 1000).toFixed(1)}k`;
    if (estimateTextWidth(short, maxFont) <= boxW) return short;
    return rounded;
  }
  if (unit === 'km/h' || unit === 'mph' || unit === '°C' || unit === '°F') {
    return rounded;
  }
  return full;
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
  const micro = compact && (h < 56 || w < 60);
  const format = opts.formatValue ?? ((v: number) => String(Math.round(v)));
  const pct = Math.min(1, Math.max(0, opts.value / Math.max(opts.max, 1)));

  const abbrev: Record<string, string> = { SPEED: 'SPD', TEMPERATURE: 'TMP', TEMP: 'TMP' };
  const labelText = (micro ? abbrev[opts.label.toUpperCase()] ?? opts.label.slice(0, 3) : opts.label).toUpperCase();

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

  const labelY = micro ? h * 0.2 : compact ? h * 0.22 : h * 0.18;
  const valueY = micro ? h * 0.58 : compact ? h * 0.52 : h * 0.48;
  const unitY = compact ? h * 0.78 : h * 0.68;

  if (!micro) {
    const labelSize = fluidFont(9, bounds, 6, 10);
    group.add(
      app.text({
        text: labelText,
        x: fitTextX(labelText, labelSize, w),
        y: textYForBaseline(labelY, labelSize, 'middle'),
        fontSize: labelSize,
        fontWeight: '600',
        fill: style.labelColor,
        textAlign: 'left',
        listening: false,
      })
    );
  }

  let displayVal = format(opts.value);
  const valueMax = fluidFont(compact ? 20 : 28, bounds, micro ? 8 : 12, 36);
  if (compact && opts.unit) {
    displayVal = formatCompactDigitalValue(opts.value, opts.unit, format, w, valueMax);
  }
  const fitted = fitFontSizeToWidth(displayVal, w, valueMax, micro ? 7 : 9);
  const valueText = app.text({
    text: displayVal,
    x: fitted.x,
    y: textYForBaseline(valueY, fitted.fontSize, 'middle'),
    fontSize: fitted.fontSize,
    fontWeight: 'bold',
    fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
    fill: style.valueColor,
    textAlign: 'left',
    listening: false,
  });
  group.add(valueText);

  if (opts.unit && !compact) {
    const unitSize = fluidFont(10, bounds, 7, 12);
    group.add(
      app.text({
        text: opts.unit,
        x: fitTextX(opts.unit, unitSize, w),
        y: textYForBaseline(unitY, unitSize, 'middle'),
        fontSize: unitSize,
        fontWeight: '600',
        fill: style.unitColor,
        textAlign: 'left',
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
