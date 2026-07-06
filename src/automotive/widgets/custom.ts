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
import { autoCenteredText, centerInBounds, fluidFont, isCompactBounds, resolveBounds, resolveDisplay, resolveClusterLayout } from '../layout';

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
    x: Math.min(ox + iconW + 6, w - 4),
    y: h / 2,
    fontSize: fluidFont(14, bounds, 9, 14),
    fill: value < 11.5 ? '#ef4444' : '#22c55e',
    textAlign: 'right',
    textBaseline: 'middle',
    metadata: { textBoxWidth: Math.max(28, w - iconW - 12) },
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
  const titleH = Math.max(12, Math.min(18, panelH * 0.2));
  const gap = 4;
  const cellW = (panelW - gap * 3) / 2;
  const cellH = Math.max(12, (panelH - titleH - gap * 3) / 2);
  const gridTop = titleH + gap;
  group.add(
    app.roundedRect({ width: panelW, height: panelH, cornerRadius: 8, fill: '#111827', stroke: theme.dialStroke, strokeWidth: 1.5, listening: false }),
    app.text({ text: 'TIRE PRESSURE', x: 10, y: 6, fontSize: fluidFont(8, bounds, 7, 9), fontWeight: 'bold', fill: theme.textMuted, listening: false })
  );
  const positions = [
    { x: gap, y: gridTop, label: 'FL' },
    { x: gap * 2 + cellW, y: gridTop, label: 'FR' },
    { x: gap, y: gridTop + cellH + gap, label: 'RL' },
    { x: gap * 2 + cellW, y: gridTop + cellH + gap, label: 'RR' },
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
      app.text({ text: pos.label, x: pos.x + 4, y: pos.y + 3, fontSize: Math.max(7, cellH * 0.28), fontWeight: 'bold', fill: theme.textMuted, listening: false })
    );
    const t = app.text({
      text: `${psi}`,
      x: pos.x + cellW / 2,
      y: pos.y + cellH * 0.62,
      fontSize: Math.max(9, cellH * 0.38),
      fontWeight: 'bold',
      fill: low ? theme.warning : theme.text,
      textAlign: 'center',
      textBaseline: 'middle',
      metadata: { textBoxWidth: cellW },
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
  const label = autoCenteredText(app, gear, w, h / 2, {
    fontSize: fluidFont(36, bounds, 18, 40),
    fontWeight: 'bold',
    fill: theme.text,
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
  group.add(
    app.roundedRect({
      width: w,
      height: h,
      cornerRadius: Math.min(6, h * 0.2),
      fill: '#111827',
      stroke: '#374151',
      strokeWidth: 1,
      listening: false,
    })
  );
  const arrowW = Math.max(10, Math.min(w * 0.2, (w - 12) / 2));
  const arrowH = Math.max(8, h * 0.5);
  const gap = 4;
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
  const rightShape = arrow(w - gap - arrowW, right, true);
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
    update(rightShape, w - gap - arrowW, r, true);
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
  const label = autoCenteredText(app, active ? `SET ${Math.round(speed)}` : 'CRUISE', w, h / 2, {
    fontSize: fluidFont(11, bounds, 8, 12),
    fontWeight: 'bold',
    fill: '#fff',
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
  const rowH = Math.max(11, Math.floor(bounds.innerHeight / Math.max(entries.length, 1)));
  const maxRows = Math.max(1, Math.floor(bounds.innerHeight / rowH));
  const visible = entries.slice(0, maxRows);
  group.add(app.rect({ width: bounds.innerWidth, height: bounds.innerHeight, fill: '#111827', stroke: '#374151', strokeWidth: 1, listening: false }));
  const rows: TextNode[] = [];
  visible.forEach(([key, val], i) => {
    const row = app.text({
      text: `${key}: ${val}`.slice(0, Math.max(8, Math.floor(bounds.innerWidth / 6))),
      x: 4,
      y: 2 + i * rowH,
      fontSize: Math.max(8, Math.min(10, rowH - 2)),
      fill: '#d1d5db',
      listening: false,
    });
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
    app.text({
      text: labelText,
      x: center.x + radius,
      y: center.y + radius,
      fontSize: fluidFont(10, bounds, 8, 10),
      fill: active ? '#fff' : '#666',
      textAlign: 'center',
      textBaseline: 'middle',
      metadata: { textBoxWidth: radius * 2 },
      listening: false,
    })
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
    autoCenteredText(app, `ADAS ${status.toUpperCase()}`, w, h / 2, {
      fontSize: fluidFont(10, bounds, 7, 11),
      fill: '#fff',
    })
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
  group.add(
    app.rect({
      width: w,
      height: h,
      fill: theme.background,
      cornerRadius: Math.min(16, h * 0.04),
      stroke: theme.dialStroke,
      strokeWidth: 2,
      listening: false,
    })
  );
  const themeName = str(props, 'theme', 'classic');
  const isDigital = themeName === 'digital';
  const gaugeDisplay = isDigital ? 'digital' : 'analog';

  const valueByType: Record<string, Record<string, unknown>> = {
    speedometer: { value: props.speed ?? 0, display: gaugeDisplay },
    tachometer: { value: props.rpm ?? 0, display: gaugeDisplay },
    gearIndicator: { gear: props.gear ?? 'P' },
    engineTemp: { value: props.engineTemp ?? 90, display: gaugeDisplay },
    turnIndicators: { left: props.turnLeft ?? false, right: props.turnRight ?? false },
    fuelGauge: { value: props.fuel ?? 75 },
    batteryVoltage: { value: props.batteryVoltage ?? 12.4 },
    tpms: { pressures: props.tpms ?? [32, 32, 32, 32] },
    parkingBrake: { active: props.parkingBrake ?? false },
    headlights: { active: props.headlights ?? false },
    cruiseControl: { speed: props.cruiseSpeed ?? 0 },
    warningLamp: { label: 'ABS', active: props.absWarning ?? false },
    adasStatus: { status: props.adasStatus ?? 'off' },
  };

  for (const slot of resolveClusterLayout(w, h)) {
    const { type: wt, size, width: slotW, height: slotH, x: slotX, y: slotY } = slot;
    const slotDigital =
      gaugeDisplay === 'digital' || slotW < 128 || slotH < 80 || (size !== undefined && size < 96);
    const node = createAutomotiveFromJSON(
      wt,
      {
        x: 0,
        y: 0,
        width: slotW,
        height: slotH,
        ...(size !== undefined ? { size: Math.min(size, Math.min(slotW, slotH) - 4) } : {}),
        ...valueByType[wt],
        theme: themeName,
        display: wt === 'speedometer' || wt === 'tachometer' || wt === 'engineTemp'
          ? slotDigital ? 'digital' : gaugeDisplay
          : undefined,
      },
      app
    );
    if (node) {
      const slotWrap = app.group({
        x: slotX,
        y: slotY,
        clip: true,
        metadata: {
          autoSlot: wt,
          autoState: { width: slotW, height: slotH },
          autoWidth: slotW,
          autoHeight: slotH,
        },
      }) as import('../../shapes/Group').Group;
      slotWrap.add(node);
      group.add(slotWrap);
    }
  }
  setState(group, { width: w, height: h, theme: themeName, ...props });
  return group;
}

registerAutomotive('instrumentCluster', (props, app) => buildInstrumentCluster(props, app, 'instrumentCluster'));
registerAutomotive('digitalInstrumentCluster', (props, app) =>
  buildInstrumentCluster({ ...props, theme: props.theme ?? 'digital' }, app, 'digitalInstrumentCluster')
);
