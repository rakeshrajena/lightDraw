/**
 * Rich automotive widgets — override catalog defaults where bespoke UI is needed.
 */
import { Arc, Polygon, TextNode } from '../../shapes/index';
import type { Node } from '../../Node';
import { registerAutomotive, createAutomotiveFromJSON } from '../registryCore';
import {
  bool,
  clamp,
  createAutoGroup,
  needleAngle,
  num,
  setParts,
  setRefresh,
  setState,
  str,
} from '../helpers';
import { getTheme } from '../themes';
import { buildDialWidget, buildLampWidget } from '../primitives/builders';
import {
  buildDigitalGauge,
  digitalGaugeStyle,
  updateDigitalGauge,
} from '../primitives/digitalGauge';
import { centerInBounds, fluidFont, resolveBounds, resolveDisplay } from '../layout';

function themedDial(
  app: import('../../App').App,
  type: string,
  props: Record<string, unknown>,
  max: number,
  format: 'int' | 'rpm',
  needleKey: 'needleSpeed' | 'needleTach',
  options: { redlineFrom?: number; tickCount?: number; unit?: string } = {}
) {
  const theme = getTheme(str(props, 'theme', 'classic'));
  return buildDialWidget(app, type, type, { ...props, needleColor: props.needleColor ?? theme[needleKey] }, {
    max: num(props, 'max', max),
    format,
    unit: options.unit,
    tickCount: options.tickCount,
    redlineFrom: options.redlineFrom,
    needleColor: theme[needleKey],
  });
}

registerAutomotive('speedometer', (props, app) => {
  const theme = getTheme(str(props, 'theme', 'classic'));
  return themedDial(app, 'speedometer', { ...props, needleColor: props.needleColor ?? theme.needleSpeed }, 240, 'int', 'needleSpeed', {
    redlineFrom: 0.82,
    tickCount: 12,
    unit: ' km/h',
  });
});

registerAutomotive('tachometer', (props, app) => {
  const theme = getTheme(str(props, 'theme', 'classic'));
  return themedDial(app, 'tachometer', { ...props, needleColor: props.needleColor ?? theme.needleTach }, 8000, 'rpm', 'needleTach', {
    redlineFrom: 0.75,
    tickCount: 8,
  });
});

registerAutomotive('engineTemp', (props, app) => {
  const theme = getTheme(str(props, 'theme', 'classic'));
  const bounds = resolveBounds(props, 140, 140);
  const value = num(props, 'value', 90);
  const max = num(props, 'max', 130);
  const display = resolveDisplay(props, 'analog');

  if (display === 'digital') {
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

  const size = bounds.dialSize;
  const group = createAutoGroup(app, 'engineTemp', { ...props, width: bounds.width, height: bounds.height, size, display: 'analog' }, 'engineTemp');
  const origin = centerInBounds(bounds, size, size);
  const inner = app.group({ x: origin.x, y: origin.y, listening: false });
  group.add(inner);
  const cx = size / 2;
  const r = size / 2 - Math.max(10, size * 0.07);
  const sweep = Math.PI * 1.5;
  const base = Math.PI * 0.75;

  inner.add(
    app.circle({ x: cx - r - 4, y: cx - r - 4, radius: r + 4, fill: '#0a0a0a', stroke: theme.dialStroke, strokeWidth: 2, listening: false }),
    app.text({ text: 'TEMP', x: cx - 16, y: 8, fontSize: fluidFont(9, bounds, 7, 10), fontWeight: 'bold', fill: theme.textMuted, listening: false })
  );
  [
    { start: 0, end: 0.4, color: '#3b82f6' },
    { start: 0.4, end: 0.75, color: theme.ok },
    { start: 0.75, end: 1, color: theme.warning },
  ].forEach((z) => {
    inner.add(
      new Arc({
        x: cx - r,
        y: cx - r,
        radius: r,
        startAngle: base + z.start * sweep,
        endAngle: base + z.end * sweep,
        fill: null,
        stroke: z.color,
        strokeWidth: Math.max(6, size * 0.06),
        listening: false,
      })
    );
  });
  const angle = needleAngle(value, max);
  const needle = app.line({
    x: cx,
    y: cx,
    x2: r * 0.72 * Math.cos(angle),
    y2: r * 0.72 * Math.sin(angle),
    stroke: theme.text,
    strokeWidth: Math.max(2, size * 0.018),
    lineCap: 'round',
    listening: false,
  });
  const label = app.text({
    text: `${Math.round(value)}°`,
    x: cx,
    y: cx + r * 0.42,
    fontSize: fluidFont(14, bounds, 11, 16),
    fontWeight: 'bold',
    fill: theme.text,
    textAlign: 'center',
    listening: false,
  });
  inner.add(needle, label);
  setParts(group, { needle, label });
  setRefresh(group, (v) => {
    const a = needleAngle(v, max);
    (needle as { x2: number; y2: number }).x2 = r * 0.72 * Math.cos(a);
    (needle as { y2: number }).y2 = r * 0.72 * Math.sin(a);
    (label as TextNode).text = `${Math.round(v)}°`;
  });
  setState(group, { width: bounds.width, height: bounds.height, size, value, max, display: 'analog' });
  return group;
});

registerAutomotive('batteryVoltage', (props, app) => {
  const value = num(props, 'value', 12.4);
  const bounds = resolveBounds(props, 100, 36);
  const group = createAutoGroup(app, 'batteryVoltage', { ...props, width: bounds.width, height: bounds.height }, 'batteryVoltage');
  const w = bounds.innerWidth;
  const h = bounds.innerHeight;
  const iconW = Math.min(32, w * 0.35);
  const iconH = Math.min(16, h * 0.5);
  const ox = bounds.pad;
  const oy = (h - iconH) / 2;
  group.add(
    app.rect({ x: ox, y: oy, width: iconW, height: iconH, fill: null, stroke: '#fff', strokeWidth: 2, listening: false }),
    app.rect({ x: ox + iconW, y: oy + iconH * 0.28, width: Math.max(3, iconW * 0.12), height: iconH * 0.45, fill: '#fff', listening: false })
  );
  const label = app.text({
    text: `${value.toFixed(1)}V`,
    x: ox + iconW + 8,
    y: h / 2,
    fontSize: fluidFont(14, bounds, 11, 16),
    fill: value < 11.5 ? '#ef4444' : '#22c55e',
    textBaseline: 'middle',
    listening: false,
  });
  group.add(label);
  setParts(group, { label });
  setRefresh(group, (v) => {
    (label as TextNode).text = `${v.toFixed(1)}V`;
    (label as TextNode).fill = v < 11.5 ? '#ef4444' : '#22c55e';
  });
  setState(group, { value, width: bounds.width, height: bounds.height });
  return group;
});

registerAutomotive('tpms', (props, app) => {
  const theme = getTheme(str(props, 'theme', 'classic'));
  const pressures = (props.pressures as number[]) ?? [32, 32, 32, 32];
  const lowThreshold = num(props, 'lowThreshold', 25);
  const bounds = resolveBounds(props, 148, 92);
  const group = createAutoGroup(app, 'tpms', { ...props, width: bounds.width, height: bounds.height }, 'tpms');
  const panelW = bounds.innerWidth;
  const panelH = bounds.innerHeight;
  const cellW = panelW / 2 - 12;
  const cellH = Math.max(24, (panelH - 28) / 2 - 4);
  group.add(
    app.roundedRect({ width: panelW, height: panelH, cornerRadius: 8, fill: '#111827', stroke: theme.dialStroke, strokeWidth: 1.5, listening: false }),
    app.text({ text: 'TIRE PRESSURE', x: 10, y: 6, fontSize: fluidFont(8, bounds, 7, 9), fontWeight: 'bold', fill: theme.textMuted, listening: false })
  );
  const positions = [
    { x: 8, y: 22, label: 'FL' },
    { x: panelW / 2 + 2, y: 22, label: 'FR' },
    { x: 8, y: 22 + cellH + 8, label: 'RL' },
    { x: panelW / 2 + 2, y: 22 + cellH + 8, label: 'RR' },
  ];
  const texts: TextNode[] = [];
  positions.forEach((pos, i) => {
    const psi = pressures[i] ?? 32;
    const low = psi < lowThreshold;
    group.add(
      app.roundedRect({
        x: pos.x,
        y: pos.y,
        width: cellW,
        height: cellH,
        cornerRadius: 6,
        fill: low ? '#450a0a' : '#1f2937',
        stroke: low ? theme.warning : theme.dialStroke,
        strokeWidth: 1,
        listening: false,
      }),
      app.text({ text: pos.label, x: pos.x + 6, y: pos.y + 4, fontSize: 9, fontWeight: 'bold', fill: theme.textMuted, listening: false })
    );
    const t = app.text({
      text: `${psi}`,
      x: pos.x + 6,
      y: pos.y + 14,
      fontSize: 13,
      fontWeight: 'bold',
      fill: low ? theme.warning : theme.text,
      listening: false,
    });
    texts.push(t);
    group.add(t);
  });
  group.metadata.refresh = (next: number[]) => {
    next.forEach((psi, i) => {
      const low = psi < lowThreshold;
      if (texts[i]) {
        texts[i].text = `${psi}`;
        texts[i].fill = low ? theme.warning : theme.text;
      }
    });
  };
  setState(group, { pressures, lowThreshold, width: bounds.width, height: bounds.height });
  return group;
});

registerAutomotive('fuelGauge', (props, app) => {
  const value = clamp(num(props, 'value', 50), 0, 100);
  const theme = getTheme(str(props, 'theme', 'classic'));
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
  const label = app.text({
    text: `${value}%`,
    x: w / 2,
    y: h * 0.4,
    fontSize: fluidFont(14, bounds, 11, 16),
    fontWeight: 'bold',
    fill: theme.text,
    textAlign: 'center',
    textBaseline: 'middle',
    listening: false,
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

registerAutomotive('gearIndicator', (props, app) => {
  const gear = str(props, 'gear', 'P');
  const theme = getTheme(str(props, 'theme', 'classic'));
  const bounds = resolveBounds(props, 56, 60);
  const group = createAutoGroup(app, 'gearIndicator', { ...props, width: bounds.width, height: bounds.height }, 'gearIndicator');
  const w = bounds.innerWidth;
  const h = bounds.innerHeight;
  group.add(
    app.roundedRect({ width: w, height: h, cornerRadius: 8, fill: '#111827', stroke: theme.dialStroke, strokeWidth: 2, listening: false })
  );
  const label = app.text({
    text: gear,
    x: w / 2,
    y: h / 2,
    fontSize: fluidFont(36, bounds, 22, 40),
    fontWeight: 'bold',
    fill: theme.text,
    textAlign: 'center',
    textBaseline: 'middle',
    listening: false,
  });
  group.add(label);
  setParts(group, { label });
  group.metadata.textRefresh = (t: string) => {
    (label as TextNode).text = t;
  };
  setState(group, { gear, width: bounds.width, height: bounds.height });
  return group;
});

registerAutomotive('turnIndicators', (props, app) => {
  const left = bool(props, 'left', false);
  const right = bool(props, 'right', false);
  const bounds = resolveBounds(props, 56, 28);
  const group = createAutoGroup(app, 'turnIndicators', { ...props, width: bounds.width, height: bounds.height }, 'turnIndicators');
  const w = bounds.innerWidth;
  const h = bounds.innerHeight;
  const arrowW = Math.max(12, w * 0.22);
  const arrowH = Math.max(10, h * 0.55);
  const onColor = '#f59e0b';
  const offColor = '#1f2937';
  const cy = h / 2;
  const arrow = (x: number, on: boolean, flip: boolean) =>
    app.polygon({
      points: on
        ? flip
          ? [x, cy, x + arrowW, cy - arrowH / 2, x + arrowW, cy + arrowH / 2]
          : [x + arrowW, cy, x, cy - arrowH / 2, x, cy + arrowH / 2]
        : flip
          ? [x + arrowW * 0.15, cy, x + arrowW * 0.85, cy - arrowH * 0.4, x + arrowW * 0.85, cy + arrowH * 0.4]
          : [x + arrowW * 0.85, cy, x + arrowW * 0.15, cy - arrowH * 0.4, x + arrowW * 0.15, cy + arrowH * 0.4],
      fill: on ? onColor : offColor,
      stroke: on ? '#fbbf24' : '#374151',
      strokeWidth: 1,
      listening: false,
    });
  const leftShape = arrow(0, left, false);
  const rightShape = arrow(w / 2 + 4, right, true);
  group.add(leftShape, rightShape);
  group.metadata.refresh = (l: boolean, r: boolean) => {
    const update = (shape: Node, x: number, on: boolean, flip: boolean) => {
      const pts = on
        ? flip
          ? [x, cy, x + arrowW, cy - arrowH / 2, x + arrowW, cy + arrowH / 2]
          : [x + arrowW, cy, x, cy - arrowH / 2, x, cy + arrowH / 2]
        : flip
          ? [x + arrowW * 0.15, cy, x + arrowW * 0.85, cy - arrowH * 0.4, x + arrowW * 0.85, cy + arrowH * 0.4]
          : [x + arrowW * 0.85, cy, x + arrowW * 0.15, cy - arrowH * 0.4, x + arrowW * 0.15, cy + arrowH * 0.4];
      (shape as Polygon).points = pts;
      shape.fill = on ? onColor : offColor;
      shape.stroke = on ? '#fbbf24' : '#374151';
    };
    update(leftShape, 0, l, false);
    update(rightShape, w / 2 + 4, r, true);
  };
  setState(group, { left, right, width: bounds.width, height: bounds.height });
  return group;
});

registerAutomotive('parkingBrake', (props, app) => buildLampWidget(app, 'parkingBrake', 'parkingBrake', props, 'P'));
registerAutomotive('headlights', (props, app) => buildLampWidget(app, 'headlights', 'headlights', props, 'HL'));

registerAutomotive('cruiseControl', (props, app) => {
  const speed = num(props, 'speed', 0);
  const active = bool(props, 'active', speed > 0);
  const bounds = resolveBounds(props, 80, 32);
  const group = createAutoGroup(app, 'cruiseControl', { ...props, width: bounds.width, height: bounds.height }, 'cruiseControl');
  const w = bounds.innerWidth;
  const h = bounds.innerHeight;
  const bg = app.roundedRect({ width: w, height: h, cornerRadius: 4, fill: active ? '#1d4ed8' : '#333', listening: false });
  const label = app.text({
    text: active ? `SET ${Math.round(speed)}` : 'CRUISE',
    x: w / 2,
    y: h / 2,
    fontSize: fluidFont(11, bounds, 9, 12),
    fill: '#fff',
    textAlign: 'center',
    textBaseline: 'middle',
    listening: false,
  });
  group.add(bg, label);
  setParts(group, { bg, label });
  setRefresh(group, (v) => {
    const on = v > 0;
    (bg as { fill: string }).fill = on ? '#1d4ed8' : '#333';
    (label as TextNode).text = on ? `SET ${Math.round(v)}` : 'CRUISE';
  });
  setState(group, { speed, active, width: bounds.width, height: bounds.height });
  return group;
});

registerAutomotive('canViewer', (props, app) => {
  const signals = (props.signals as Record<string, number | string>) ?? { 'engine.rpm': 2500, 'vehicle.speed': 60 };
  const bounds = resolveBounds(props, 220, 88);
  const group = createAutoGroup(app, 'canViewer', { ...props, width: bounds.width, height: bounds.height }, 'canViewer');
  const entries = Object.entries(signals).slice(0, num(props, 'maxRows', 20));
  const rowH = Math.max(14, Math.floor((bounds.innerHeight - 8) / Math.max(entries.length, 1)));
  group.add(app.rect({ width: bounds.innerWidth, height: bounds.innerHeight, fill: '#111827', stroke: '#374151', strokeWidth: 1, listening: false }));
  const rows: TextNode[] = [];
  entries.forEach(([key, val], i) => {
    const row = app.text({ text: `${key}: ${val}`, x: 6, y: 4 + i * rowH, fontSize: 10, fill: '#d1d5db', listening: false });
    rows.push(row);
    group.add(row);
  });
  group.metadata.refresh = (next: Record<string, number | string>) => {
    Object.entries(next)
      .slice(0, rows.length)
      .forEach(([key, val], i) => {
        if (rows[i]) rows[i].text = `${key}: ${val}`;
      });
  };
  setState(group, { signals, width: bounds.width, height: bounds.height });
  return group;
});

registerAutomotive('warningLamp', (props, app) => {
  const labelText = str(props, 'label', '!');
  const active = bool(props, 'active', false);
  const bounds = resolveBounds(props, 36, 36);
  const group = createAutoGroup(app, 'warningLamp', { ...props, width: bounds.width, height: bounds.height }, 'warningLamp');
  const radius = Math.min(bounds.innerWidth, bounds.innerHeight) / 2 - 2;
  const center = centerInBounds(bounds, radius * 2, radius * 2);
  group.add(
    app.circle({ radius, x: center.x, y: center.y, fill: active ? '#ef4444' : '#333', stroke: active ? '#fca5a5' : '#555', strokeWidth: 1, listening: false }),
    app.text({ text: labelText, x: center.x + radius - fluidFont(10, bounds, 8, 10), y: center.y + radius - fluidFont(10, bounds, 8, 10) * 0.5, fontSize: fluidFont(10, bounds, 8, 10), fill: active ? '#fff' : '#666', listening: false })
  );
  setState(group, { label: labelText, active, width: bounds.width, height: bounds.height });
  return group;
});

registerAutomotive('adasStatus', (props, app) => {
  const status = str(props, 'status', 'off');
  const colors: Record<string, string> = { off: '#333', standby: '#f59e0b', active: '#22c55e', fault: '#ef4444' };
  const bounds = resolveBounds(props, 96, 28);
  const group = createAutoGroup(app, 'adasStatus', { ...props, width: bounds.width, height: bounds.height }, 'adasStatus');
  const w = bounds.innerWidth;
  const h = bounds.innerHeight;
  group.add(
    app.rect({ width: w, height: h, fill: colors[status] ?? '#333', cornerRadius: 4, listening: false }),
    app.text({ text: `ADAS ${status.toUpperCase()}`, x: w / 2, y: h / 2, fontSize: fluidFont(10, bounds, 8, 11), fill: '#fff', textAlign: 'center', textBaseline: 'middle', listening: false })
  );
  group.metadata.textRefresh = (t: string) => {
    const bg = group.children[0] as { fill?: string };
    if (bg) bg.fill = colors[t.toLowerCase()] ?? '#333';
  };
  setState(group, { status, width: bounds.width, height: bounds.height });
  return group;
});

function buildInstrumentCluster(props: Record<string, unknown>, app: import('../../App').App, type: string) {
  const theme = getTheme(str(props, 'theme', 'classic'));
  const w = num(props, 'width', 800);
  const h = num(props, 'height', 400);
  const group = createAutoGroup(app, type, props, type, { width: w, height: h });
  const dialSize = Math.min(w * 0.22, h * 0.48, 200);
  const smallDial = Math.min(w * 0.12, h * 0.24, 96);
  const margin = Math.max(16, w * 0.028);
  const bottomY = h - Math.max(56, h * 0.16);
  group.add(
    app.rect({
      width: w,
      height: h,
      fill: theme.background,
      cornerRadius: 16,
      stroke: theme.dialStroke,
      strokeWidth: 2,
      listening: false,
    })
  );
  const themeName = str(props, 'theme', 'classic');
  const isDigital = themeName === 'digital';
  const gaugeDisplay = isDigital ? 'digital' : 'analog';
  const widgets: [string, Record<string, unknown>][] = [
    ['speedometer', { value: props.speed ?? 0, width: dialSize + 16, height: dialSize + 16, size: dialSize, display: gaugeDisplay, x: margin, y: margin, theme: themeName }],
    ['tachometer', { value: props.rpm ?? 0, width: dialSize + 16, height: dialSize + 16, size: dialSize, display: gaugeDisplay, x: w - dialSize - margin - 16, y: margin, theme: themeName }],
    ['gearIndicator', { gear: props.gear ?? 'P', width: 56, height: 60, x: w / 2 - 28, y: h / 2 - 36, theme: themeName }],
    ['engineTemp', { value: props.engineTemp ?? 90, width: smallDial + 12, height: smallDial + 12, size: smallDial, display: gaugeDisplay, x: w / 2 - (smallDial + 12) / 2, y: margin + 8 }],
    ['turnIndicators', { left: props.turnLeft ?? false, right: props.turnRight ?? false, width: 56, height: 28, x: w / 2 - 28, y: h / 2 + 36 }],
    ['fuelGauge', { value: props.fuel ?? 75, width: 120, height: 56, x: margin, y: bottomY, theme: themeName }],
    ['batteryVoltage', { value: props.batteryVoltage ?? 12.4, width: 100, height: 36, x: margin + 128, y: bottomY + 8 }],
    ['tpms', { pressures: props.tpms ?? [32, 32, 32, 32], width: 148, height: 92, x: w / 2 - 74, y: bottomY - 36, theme: themeName }],
    ['parkingBrake', { active: props.parkingBrake ?? false, width: 36, height: 36, x: w - margin - 280, y: bottomY + 8, theme: themeName }],
    ['headlights', { active: props.headlights ?? false, width: 36, height: 36, x: w - margin - 228, y: bottomY + 8, theme: themeName }],
    ['cruiseControl', { speed: props.cruiseSpeed ?? 0, width: 80, height: 32, x: w - margin - 158, y: bottomY + 10 }],
    ['warningLamp', { label: 'ABS', active: props.absWarning ?? false, width: 36, height: 36, x: w - margin - 88, y: bottomY + 8 }],
    ['adasStatus', { status: props.adasStatus ?? 'off', width: 96, height: 28, x: w - margin - 88, y: bottomY + 38 }],
  ];
  for (const [wt, wprops] of widgets) {
    const node = createAutomotiveFromJSON(wt, wprops, app);
    if (node) group.add(node);
  }
  setState(group, { width: w, height: h, theme: themeName, ...props });
  return group;
}

registerAutomotive('instrumentCluster', (props, app) => buildInstrumentCluster(props, app, 'instrumentCluster'));
registerAutomotive('digitalInstrumentCluster', (props, app) =>
  buildInstrumentCluster({ ...props, theme: props.theme ?? 'digital' }, app, 'digitalInstrumentCluster')
);
