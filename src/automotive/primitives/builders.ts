import type { App } from '../../App';
import type { Node } from '../../Node';
import { TextNode } from '../../shapes/index';
import {
  bool,
  clamp,
  createAutoGroup,
  num,
  setBoolRefresh,
  setParts,
  setRefresh,
  setState,
  str,
} from '../helpers';
import { autoCenteredText, centerInBounds, fitTextX, fluidFont, isCompactBounds, resolveBounds, resolveDisplay } from '../layout';
import { getTheme } from '../themes';
import { buildDialGauge, updateDialNeedle } from '../../primitives/dialGauge';
import {
  buildDigitalGauge,
  digitalGaugeStyle,
  updateDigitalGauge,
} from './digitalGauge';

export type ValueFormat = 'int' | 'rpm' | 'percent' | 'deg' | 'volt' | 'psi' | 'text';

const DIAL_LABELS: Record<string, string> = {
  speedometer: 'Speed',
  tachometer: 'RPM',
  turboBoostGauge: 'Boost',
  torqueMeter: 'Torque',
  horsepowerMeter: 'HP',
  engineLoad: 'Load',
  throttlePosition: 'Throttle',
  brakePressure: 'Brake',
  steeringAngle: 'Steer',
  yawRate: 'Yaw',
  altimeter: 'Alt',
  oilPressure: 'Oil',
  powerMeter: 'kW',
  gForceMeter: 'G',
  engineTemp: 'Temp',
  engineTemperature: 'Engine',
  coolantTemperature: 'Coolant',
  oilTemperature: 'Oil',
};

function dialLabel(type: string): string {
  if (DIAL_LABELS[type]) return DIAL_LABELS[type];
  const words = type.replace(/([A-Z])/g, ' $1').trim().split(/\s+/);
  if (words.length <= 2) return words.join(' ');
  return words.map((w) => w[0]?.toUpperCase() ?? '').join('');
}

export function formatValue(v: number, format: ValueFormat, unit = ''): string {
  switch (format) {
    case 'rpm':
      return `${Math.round(v / 1000)}k`;
    case 'percent':
      return `${Math.round(v)}%`;
    case 'deg':
      return `${Math.round(v)}°`;
    case 'volt':
      return `${v.toFixed(1)}V`;
    case 'psi':
      return `${Math.round(v)} PSI`;
    case 'text':
      return String(v);
    default:
      return unit ? `${Math.round(v)}${unit}` : String(Math.round(v));
  }
}

export function buildDialWidget(
  app: App,
  type: string,
  autoPart: string,
  props: Record<string, unknown>,
  options: {
    max: number;
    format: ValueFormat;
    unit?: string;
    tickCount?: number;
    redlineFrom?: number;
    needleColor?: string;
  }
): Node {
  const theme = getTheme(str(props, 'theme', 'classic'));
  const bounds = resolveBounds(props, 160, 160);
  const value = num(props, 'value', 0);
  const max = num(props, 'max', options.max);
  const fmt = (v: number) => formatValue(v, options.format);
  let display = resolveDisplay(props, 'analog');
  if (display === 'analog' && isCompactBounds(bounds)) display = 'digital';

  if (display === 'digital') {
    const group = createAutoGroup(
      app,
      type,
      { ...props, width: bounds.width, height: bounds.height, display: 'digital' },
      autoPart
    );
    const style = digitalGaugeStyle(theme);
    const digitalFmt =
      options.format === 'rpm'
        ? (v: number) => String(Math.round(v))
        : (v: number) => String(Math.round(v));
    const digitalUnit = options.format === 'rpm' ? 'RPM' : options.unit;
    const parts = buildDigitalGauge(app, group, bounds, style, {
      label: dialLabel(autoPart),
      value,
      max,
      unit: digitalUnit,
      formatValue: digitalFmt,
      showBar: !isCompactBounds(bounds),
      showSegments: !isCompactBounds(bounds) && (autoPart === 'tachometer' || options.format === 'rpm'),
      segmentCount: 10,
    });
    const barW = bounds.innerWidth - bounds.pad;
    setParts(group, { valueText: parts.valueText });
    group.metadata._digitalParts = parts;
    setRefresh(group, (v) => {
      updateDigitalGauge(parts, v, max, digitalFmt, barW, parts.segments?.length);
    });
    setState(group, { width: bounds.width, height: bounds.height, value, max, display: 'digital' });
    return group;
  }

  const maxFit = Math.min(bounds.innerWidth, bounds.innerHeight) - 6;
  const size = Math.min(bounds.dialSize, maxFit);
  const needleColor = str(props, 'needleColor', options.needleColor ?? theme.accent);
  const group = createAutoGroup(
    app,
    type,
    { ...props, width: bounds.width, height: bounds.height, size, display: 'analog' },
    autoPart
  );
  const cx = size / 2;
  const inset = Math.max(4, Math.min(12, size * 0.1));
  const r = size / 2 - inset;
  const origin = centerInBounds(bounds, size, size);
  const inner = app.group({ x: origin.x, y: origin.y, listening: false });
  group.add(inner);

  const parts = buildDialGauge(
    app,
    inner,
    {
      trackColor: theme.dialStroke,
      needleColor,
      accentColor: needleColor,
      textColor: theme.text,
      textMuted: theme.textMuted,
      faceColor: '#0a0a0a',
      bezelColor: theme.dialStroke,
      redlineColor: theme.warning,
      tickColor: theme.textMuted,
      tickLabelColor: theme.textMuted,
    },
    {
      size,
      value,
      max,
      title: dialLabel(autoPart),
      formatValue: fmt,
      formatTickLabel:
        options.format === 'rpm'
          ? (v) => String(Math.round(v / 1000))
          : options.format === 'percent'
            ? (v) => String(Math.round(v))
            : (v) => String(Math.round(v)),
      unit: options.unit,
      tickCount: options.tickCount ?? (size < 100 ? 5 : 10),
      showTickLabels: size >= 96,
      redlineFrom: options.redlineFrom,
    }
  );

  setParts(group, { needle: parts.needle, label: parts.valueText, inner });
  setRefresh(group, (v) => {
    updateDialNeedle(parts.needle, cx, v, max, r, undefined, undefined, undefined, parts.valueArc);
    parts.valueText.text = fmt(v);
  });
  setState(group, { width: bounds.width, height: bounds.height, size, value, max, display: 'analog' });
  return group;
}

export function buildBarWidget(
  app: App,
  type: string,
  autoPart: string,
  props: Record<string, unknown>,
  options: { label: string; unit?: string; warnBelow?: number }
): Node {
  const theme = getTheme(str(props, 'theme', 'classic'));
  const value = clamp(num(props, 'value', 50), 0, 100);
  const bounds = resolveBounds(props, 120, 56);
  const group = createAutoGroup(app, type, { ...props, width: bounds.width, height: bounds.height }, autoPart);
  const w = bounds.innerWidth;
  const h = bounds.innerHeight;
  const titleSize = fluidFont(9, bounds, 7, 11);
  const valueSize = fluidFont(14, bounds, 11, 18);
  const trackH = Math.max(6, Math.round(h * 0.14));
  const trackY = h - trackH - Math.max(6, bounds.pad * 0.5);
  const trackW = w - bounds.pad;

  group.add(
    app.roundedRect({
      width: w,
      height: h,
      cornerRadius: Math.min(10, h * 0.15),
      fill: '#111827',
      stroke: theme.dialStroke,
      strokeWidth: 1,
      listening: false,
    }),
    app.text({
      text: options.label.toUpperCase(),
      fontSize: titleSize,
      fontWeight: '600',
      fill: theme.textMuted,
      x: bounds.pad * 0.5,
      y: bounds.pad * 0.4,
      listening: false,
    })
  );
  const track = app.roundedRect({
    x: bounds.pad * 0.5,
    y: trackY,
    width: trackW,
    height: trackH,
    fill: theme.lampOff,
    cornerRadius: trackH / 2,
    listening: false,
  });
  const fill = app.roundedRect({
    x: bounds.pad * 0.5,
    y: trackY,
    width: (trackW * value) / 100,
    height: trackH,
    fill: options.warnBelow !== undefined && value < options.warnBelow ? theme.warning : theme.ok,
    cornerRadius: trackH / 2,
    listening: false,
  });
  const label = autoCenteredText(app, `${value}${options.unit ?? '%'}`, w, h * 0.4, {
    fontSize: valueSize,
    fontWeight: 'bold',
    fill: theme.text,
  });
  group.add(track, fill, label);
  setParts(group, { fill, label, track });
  setRefresh(group, (v) => {
    const lv = clamp(v, 0, 100);
    (fill as { width: number; fill: string }).width = (trackW * lv) / 100;
    (fill as { fill: string }).fill =
      options.warnBelow !== undefined && lv < options.warnBelow ? theme.warning : theme.ok;
    (label as TextNode).text = `${Math.round(lv)}${options.unit ?? '%'}`;
  });
  setState(group, { value, width: bounds.width, height: bounds.height });
  return group;
}

export function buildNumericWidget(
  app: App,
  type: string,
  autoPart: string,
  props: Record<string, unknown>,
  options: { title: string; unit?: string; decimals?: number; width?: number }
): Node {
  const theme = getTheme(str(props, 'theme', 'classic'));
  const value = num(props, 'value', 0);
  const text = str(props, 'text', '');
  const bounds = resolveBounds(props, options.width ?? 128, 60);
  const group = createAutoGroup(app, type, { ...props, width: bounds.width, height: bounds.height }, autoPart);
  const dec = options.decimals ?? (options.unit === 'V' ? 1 : 0);
  const isLcd =
    resolveDisplay(props, 'analog') === 'digital' ||
    ['digitalClock', 'dateDisplay', 'odometer', 'tripMeter', 'eta', 'lapTimer', 'accelerationTimer'].includes(
      type
    );

  if (isLcd) {
    const style = digitalGaugeStyle(theme);
    const displayText = text || `${value.toFixed(dec)}`;
    const parts = buildDigitalGauge(app, group, bounds, style, {
      label: options.title,
      value,
      max: Math.pow(10, Math.max(3, displayText.length)) - 1,
      unit: options.unit,
      formatValue: (v) => (text ? text : `${v.toFixed(dec)}`),
      showBar: false,
      showSegments: false,
    });
    if (text) parts.valueText.text = text;
    setParts(group, { valueText: parts.valueText });
    setRefresh(group, (v) => {
      (parts.valueText as TextNode).text = `${v.toFixed(dec)}${options.unit ?? ''}`;
    });
    group.metadata.textRefresh = (t: string) => {
      (parts.valueText as TextNode).text = t;
    };
    setState(group, { value, text, width: bounds.width, height: bounds.height, display: 'digital' });
    return group;
  }

  const w = bounds.innerWidth;
  const h = bounds.innerHeight;
  const titleSize = fluidFont(8, bounds, 7, 10);
  const valueSize = fluidFont(18, bounds, 13, 22);

  group.add(
    app.roundedRect({
      width: w,
      height: h,
      cornerRadius: Math.min(10, h * 0.14),
      fill: '#111827',
      stroke: theme.dialStroke,
      strokeWidth: 1,
      listening: false,
    }),
    app.text({
      text: options.title.toUpperCase(),
      x: bounds.pad * 0.5,
      y: bounds.pad * 0.35,
      fontSize: titleSize,
      fontWeight: 'bold',
      fill: theme.textMuted,
      listening: false,
    })
  );
  const label = autoCenteredText(
    app,
    text || `${value.toFixed(dec)}${options.unit ?? ''}`,
    w,
    h * 0.58,
    { fontSize: valueSize, fontWeight: 'bold', fill: theme.text }
  );
  group.add(label);
  setParts(group, { label });
  setRefresh(group, (v) => {
    (label as TextNode).text = `${v.toFixed(dec)}${options.unit ?? ''}`;
  });
  group.metadata.textRefresh = (t: string) => {
    (label as TextNode).text = t;
  };
  setState(group, { value, text, width: bounds.width, height: bounds.height });
  return group;
}

export function buildLampWidget(
  app: App,
  type: string,
  autoPart: string,
  props: Record<string, unknown>,
  symbol: string
): Node {
  const active = bool(props, 'active', false);
  const theme = getTheme(str(props, 'theme', 'classic'));
  const bounds = resolveBounds(props, 36, 36);
  const group = createAutoGroup(app, type, { ...props, width: bounds.width, height: bounds.height }, autoPart);
  const maxR = Math.min(bounds.innerWidth, bounds.innerHeight) / 2 - 3;
  const radius = Math.max(10, Math.min(maxR, 48));
  const fontSize = fluidFont(symbol.length > 3 ? 7 : 10, bounds, 6, 12);
  const center = centerInBounds(bounds, radius * 2, radius * 2);
  const symW = radius * 2;

  const lamp = app.circle({
    radius,
    x: center.x,
    y: center.y,
    fill: active ? theme.lampOn : theme.lampOff,
    stroke: active ? '#fde047' : '#555',
    strokeWidth: 1,
    shadow: active ? { color: 'rgba(251,191,36,0.5)', blur: 8, offsetX: 0, offsetY: 0 } : undefined,
    listening: false,
  });
  const sym = app.text({
    text: symbol,
    x: center.x + fitTextX(symbol, fontSize, symW),
    y: center.y + radius,
    fontSize,
    fill: active ? '#111' : '#666',
    textAlign: 'left',
    textBaseline: 'middle',
    listening: false,
  });
  group.add(lamp, sym);
  setParts(group, { lamp, sym });
  setBoolRefresh(group, (on) => {
    (lamp as { fill: string; stroke: string }).fill = on ? theme.lampOn : theme.lampOff;
    (lamp as { stroke: string }).stroke = on ? '#fde047' : '#555';
    (sym as TextNode).fill = on ? '#111' : '#666';
  });
  setState(group, { active, width: bounds.width, height: bounds.height });
  return group;
}

export function buildBadgeWidget(
  app: App,
  type: string,
  autoPart: string,
  props: Record<string, unknown>,
  title: string
): Node {
  const status = str(props, 'status', str(props, 'text', 'OFF'));
  const active = bool(props, 'active', status.toLowerCase() === 'on' || status.toLowerCase() === 'active');
  const theme = getTheme(str(props, 'theme', 'classic'));
  const bounds = resolveBounds(props, 168, 52);
  const group = createAutoGroup(app, type, { ...props, width: bounds.width, height: bounds.height }, autoPart);
  const w = bounds.innerWidth;
  const h = bounds.innerHeight;
  const badgeH = Math.max(22, Math.round(h * 0.36));
  const colors: Record<string, string> = {
    off: '#333',
    on: theme.ok,
    active: theme.ok,
    standby: theme.warning,
    fault: theme.warning,
    error: theme.warning,
    connected: theme.ok,
    disconnected: '#333',
  };
  const key = status.toLowerCase();
  const titleSize = fluidFont(9, bounds, 7, 10);
  const titleH = titleSize + 8;
  const stackH = titleH + 6 + badgeH;
  const stackY = bounds.pad + Math.max(0, (h - stackH) / 2);
  const badgeY = stackY + titleH + 4;

  group.add(
    app.roundedRect({
      width: w,
      height: h,
      cornerRadius: Math.min(8, h * 0.12),
      fill: '#111827',
      stroke: theme.dialStroke,
      strokeWidth: 1,
      listening: false,
    })
  );

  const bg = app.roundedRect({
    width: w,
    height: badgeH,
    y: badgeY,
    cornerRadius: 4,
    fill: active ? theme.ok : (colors[key] ?? '#333'),
    listening: false,
  });
  const label = autoCenteredText(app, status.toUpperCase(), w, badgeY + badgeH / 2, {
    fontSize: fluidFont(10, bounds, 8, 12),
    fontWeight: 'bold',
    fill: '#fff',
  });
  const cap = autoCenteredText(app, title.length > 18 ? title.slice(0, 17) + '…' : title, w, stackY + titleH / 2, {
    fontSize: titleSize,
    fill: theme.textMuted,
  });
  group.add(cap, bg, label);
  setParts(group, { bg, label });
  group.metadata.textRefresh = (t: string) => {
    (label as TextNode).text = t.toUpperCase();
    const k = t.toLowerCase();
    (bg as { fill: string }).fill = colors[k] ?? (t ? theme.ok : '#333');
  };
  group.metadata.boolRefresh = (on: boolean) => {
    (bg as { fill: string }).fill = on ? theme.ok : '#333';
    (label as TextNode).text = on ? 'ON' : 'OFF';
  };
  setState(group, { status, active, width: bounds.width, height: bounds.height });
  return group;
}

export function buildInfoPanel(
  app: App,
  type: string,
  autoPart: string,
  props: Record<string, unknown>,
  title: string,
  rows: string[] = []
): Node {
  const theme = getTheme(str(props, 'theme', 'classic'));
  const lines = (props.lines as string[]) ?? rows;
  const bounds = resolveBounds(props, 200, Math.max(72, lines.length * 18 + 32));
  const group = createAutoGroup(app, type, { ...props, width: bounds.width, height: bounds.height }, autoPart);
  const w = bounds.innerWidth;
  const h = bounds.innerHeight;
  const titleSize = fluidFont(9, bounds, 7, 11);
  const rowSize = fluidFont(10, bounds, 7, 11);
  const titleH = titleSize + 8;
  const maxRows = Math.max(1, Math.floor((h - titleH - 4) / 11));
  const visibleLines = lines.slice(0, maxRows);
  const rowH = Math.max(11, Math.floor((h - titleH - 4) / Math.max(visibleLines.length, 1)));

  group.add(
    app.roundedRect({
      width: w,
      height: h,
      cornerRadius: Math.min(10, h * 0.1),
      fill: '#111827',
      stroke: theme.dialStroke,
      strokeWidth: 1,
      listening: false,
    }),
    app.text({
      text: title.toUpperCase(),
      x: bounds.pad * 0.5,
      y: bounds.pad * 0.4,
      fontSize: titleSize,
      fontWeight: 'bold',
      fill: theme.textMuted,
      listening: false,
    })
  );
  const rowNodes: TextNode[] = [];
  visibleLines.forEach((line, i) => {
    const row = app.text({
      text: line.length > 22 ? line.slice(0, 21) + '…' : line,
      x: bounds.pad * 0.5,
      y: titleH + i * rowH,
      fontSize: rowSize,
      fill: theme.text,
      listening: false,
    });
    rowNodes.push(row);
    group.add(row);
  });
  group.metadata.linesRefresh = (next: string[]) => {
    next.forEach((line, i) => {
      if (rowNodes[i]) rowNodes[i].text = line;
    });
  };
  setState(group, { lines, width: bounds.width, height: bounds.height });
  return group;
}
