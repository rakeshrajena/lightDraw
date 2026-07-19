/**
 * Automotive custom widgets — gauges.
 */
import { TextNode } from '../../../shapes/index';
import { registerAutomotive } from '../../registryCore';
import {
  clamp,
  createAutoGroup,
  num,
  setParts,
  setRefresh,
  setState,
} from '../../helpers';
import { themeFromProps } from '../../themes';
import { autoCenteredText, centerInBounds, fitFontSizeToWidth, fluidFont, isCompactBounds, resolveBounds, resolveDisplay, textYForBaseline } from '../../layout';
import { buildDialGauge, updateDialNeedle } from '../../../primitives/dialGauge';
import { buildDigitalGauge, digitalGaugeStyle, updateDigitalGauge } from '../../primitives/digitalGauge';
import { themedDial } from './shared';

registerAutomotive('speedometer', (props, app) => {
  const theme = themeFromProps(props);
  return themedDial(app, 'speedometer', { ...props, needleColor: props.needleColor ?? theme.needleSpeed }, 240, 'int', 'needleSpeed', {
    redlineFrom: 0.82,
    tickCount: 12,
    unit: ' km/h',
  });
});

registerAutomotive('tachometer', (props, app) => {
  const theme = themeFromProps(props);
  return themedDial(app, 'tachometer', { ...props, needleColor: props.needleColor ?? theme.needleTach }, 8000, 'rpm', 'needleTach', {
    redlineFrom: 0.75,
    tickCount: 8,
  });
});

registerAutomotive('engineTemp', (props, app) => {
  const theme = themeFromProps(props);
  const bounds = resolveBounds(props, 140, 140);
  const value = num(props, 'value', 90);
  const max = num(props, 'max', 130);
  const display = resolveDisplay(props, 'analog');
  const useDigital = display === 'digital' || isCompactBounds(bounds);

  if (useDigital) {
    const group = createAutoGroup(app, 'engineTemp', { ...props, width: bounds.width, height: bounds.height, display: 'digital' }, 'engineTemp');
    const style = digitalGaugeStyle(theme);
    const parts = buildDigitalGauge(app, group, bounds, style, {
      label: 'Temp',
      value,
      max,
      unit: '°C',
      formatValue: (v) => String(Math.round(v)),
      showBar: true,
      showSegments: false,
    });
    const barW = bounds.innerWidth - bounds.pad;
    setParts(group, { valueText: parts.valueText });
    group.metadata._digitalParts = parts;
    setRefresh(group, (v) => updateDigitalGauge(parts, v, max, (x) => String(Math.round(x)), barW));
    setState(group, { width: bounds.width, height: bounds.height, value, max, display: 'digital' });
    return group;
  }

  const size = Math.min(bounds.dialSize, Math.min(bounds.innerWidth, bounds.innerHeight) - 6);
  const group = createAutoGroup(app, 'engineTemp', { ...props, width: bounds.width, height: bounds.height, size, display: 'analog' }, 'engineTemp');
  const origin = centerInBounds(bounds, size, size);
  const inner = app.group({ x: origin.x, y: origin.y, listening: false });
  group.add(inner);
  const cx = size / 2;
  const inset = Math.max(4, Math.min(12, size * 0.1));
  const r = size / 2 - inset;

  const parts = buildDialGauge(
    app,
    inner,
    {
      trackColor: theme.dialStroke,
      needleColor: theme.text,
      accentColor: theme.ok,
      textColor: theme.text,
      textMuted: theme.textMuted,
      faceColor: '#0a0a0a',
      bezelColor: theme.dialStroke,
      tickColor: theme.textMuted,
    },
    {
      size,
      value,
      max,
      title: 'TEMP',
      unit: '°C',
      formatValue: (v) => String(Math.round(v)),
      tickCount: size < 100 ? 5 : 8,
      showTickLabels: size >= 96,
      colorZones: [
        { from: 0, to: 0.4, color: '#3b82f6' },
        { from: 0.4, to: 0.75, color: theme.ok },
        { from: 0.75, to: 1, color: theme.warning },
      ],
    }
  );

  setParts(group, { needle: parts.needle, label: parts.valueText, inner });
  setRefresh(group, (v) => {
    updateDialNeedle(parts.needle, cx, v, max, r, undefined, undefined, undefined, parts.valueArc);
    parts.valueText.text = `${Math.round(v)}`;
  });
  setState(group, { width: bounds.width, height: bounds.height, size, value, max, display: 'analog' });
  return group;
});


function voltageFillLevel(value: number): number {
  return clamp((value - 11.0) / (14.2 - 11.0), 0, 1);
}


registerAutomotive('batteryVoltage', (props, app) => {
  const value = num(props, 'value', 12.4);
  const lowThreshold = num(props, 'lowThreshold', 11.5);
  const theme = themeFromProps(props);
  const bounds = resolveBounds(props, 100, 36);
  const group = createAutoGroup(app, 'batteryVoltage', { ...props, width: bounds.width, height: bounds.height }, 'batteryVoltage');
  const pad = bounds.pad;
  const panelW = bounds.innerWidth;
  const panelH = bounds.innerHeight;
  const compact = panelW < 56 || panelH < 22;
  const low = value < lowThreshold;
  const levelColor = low ? theme.warning : theme.ok;

  group.add(
    app.roundedRect({
      x: pad,
      y: pad,
      width: panelW,
      height: panelH,
      cornerRadius: Math.min(6, panelH * 0.2),
      fill: '#111827',
      stroke: theme.dialStroke,
      strokeWidth: compact ? 1 : 1.5,
      listening: false,
    })
  );

  const bodyW = Math.max(compact ? 10 : 18, Math.min(panelW * 0.28, panelH * 0.65));
  const bodyH = Math.max(compact ? 7 : 11, Math.min(panelH * 0.5, bodyW * 0.48));
  const nubW = Math.max(2, bodyW * 0.12);
  const iconX = pad + Math.max(compact ? 3 : 6, panelW * 0.05);
  const iconY = pad + (panelH - bodyH) / 2;
  const inset = Math.max(1.5, bodyW * 0.1);
  const innerFillW = Math.max(0, bodyW - inset * 2);

  group.add(
    app.roundedRect({
      x: iconX,
      y: iconY,
      width: bodyW,
      height: bodyH,
      cornerRadius: Math.min(2, bodyH * 0.2),
      fill: null,
      stroke: theme.textMuted,
      strokeWidth: compact ? 1 : 1.5,
      listening: false,
    })
  );
  const fill = app.roundedRect({
    x: iconX + inset,
    y: iconY + inset,
    width: innerFillW * voltageFillLevel(value),
    height: bodyH - inset * 2,
    cornerRadius: 1,
    fill: levelColor,
    listening: false,
  });
  group.add(
    fill,
    app.rect({
      x: iconX + bodyW,
      y: iconY + bodyH * 0.22,
      width: nubW,
      height: bodyH * 0.56,
      fill: theme.textMuted,
      listening: false,
    })
  );

  const textGap = Math.max(3, panelW * 0.04);
  const textX0 = iconX + bodyW + nubW + textGap;
  const textW = Math.max(18, pad + panelW + pad - textX0 - (compact ? 2 : 4));
  const val = `${value.toFixed(1)}V`;
  const maxFs = fluidFont(14, bounds, compact ? 8 : 10, 16);
  const fitted = fitFontSizeToWidth(val, textW, maxFs, compact ? 7 : 8);
  const label = app.text({
    text: val,
    x: textX0 + fitted.x,
    y: pad + textYForBaseline(panelH / 2, fitted.fontSize),
    fontSize: fitted.fontSize,
    fontWeight: 'bold',
    fill: levelColor,
    textAlign: 'left',
    listening: false,
  });
  group.add(label);

  setParts(group, { label, fill });
  setRefresh(group, (v) => {
    const isLow = v < lowThreshold;
    const color = isLow ? theme.warning : theme.ok;
    const next = `${v.toFixed(1)}V`;
    const nextFit = fitFontSizeToWidth(next, textW, maxFs, compact ? 7 : 8);
    (label as TextNode).text = next;
    (label as TextNode).fontSize = nextFit.fontSize;
    (label as TextNode).x = textX0 + nextFit.x;
    (label as TextNode).y = pad + textYForBaseline(panelH / 2, nextFit.fontSize);
    (label as TextNode).fill = color;
    (fill as { width: number; fill: string }).width = innerFillW * voltageFillLevel(v);
    (fill as { fill: string }).fill = color;
  });
  setState(group, { value, lowThreshold, width: bounds.width, height: bounds.height });
  return group;
});

registerAutomotive('fuelGauge', (props, app) => {
  const value = clamp(num(props, 'value', 50), 0, 100);
  const theme = themeFromProps(props);
  const bounds = resolveBounds(props, 120, 56);
  const group = createAutoGroup(app, 'fuelGauge', { ...props, width: bounds.width, height: bounds.height }, 'fuelGauge');
  const w = bounds.innerWidth;
  const h = bounds.innerHeight;
  const trackH = Math.max(6, Math.round(h * 0.14));
  const trackY = h - trackH - 8;
  const trackW = w - 16;
  group.add(
    app.roundedRect({ width: w, height: h, cornerRadius: 8, fill: '#111827', stroke: theme.dialStroke, strokeWidth: 1, listening: false }),
    app.text({ text: 'FUEL', fontSize: fluidFont(9, bounds, 7, 11), fontWeight: '600', fill: theme.textMuted, x: 8, y: 6, listening: false })
  );
  const fill = app.roundedRect({
    x: 8,
    y: trackY,
    width: (trackW * value) / 100,
    height: trackH,
    fill: value < 15 ? theme.warning : theme.ok,
    cornerRadius: trackH / 2,
    listening: false,
  });
  const label = autoCenteredText(app, `${value}%`, w, h * 0.4, {
    fontSize: fluidFont(14, bounds, 10, 16),
    fontWeight: 'bold',
    fill: theme.text,
  });
  group.add(fill, label);
  setParts(group, { fill, label });
  setRefresh(group, (v) => {
    const lv = clamp(v, 0, 100);
    (fill as { width: number; fill: string }).width = (trackW * lv) / 100;
    (fill as { fill: string }).fill = lv < 15 ? theme.warning : theme.ok;
    (label as TextNode).text = `${Math.round(lv)}%`;
  });
  setState(group, { value, width: bounds.width, height: bounds.height });
  return group;
});
