import { Arc } from '../shapes/index';
import { TextNode } from '../shapes/index';
import { registerAutomotive, createAutomotiveFromJSON } from './registryCore';
import {
  bool,
  clamp,
  createAutoGroup,
  needleAngle,
  num,
  setBoolRefresh,
  setParts,
  setRefresh,
  setState,
  str,
} from './helpers';
import { getTheme } from './themes';

function dialGauge(
  app: import('../App').App,
  props: Record<string, unknown>,
  autoPart: string,
  max: number,
  needleColor: string,
  format: (v: number) => string
) {
  const size = num(props, 'size', 200);
  const value = num(props, 'value', 0);
  const group = createAutoGroup(app, autoPart, props, autoPart);
  const cx = size / 2;
  const r = size / 2 - 15;

  const track = new Arc({
    x: 0,
    y: 0,
    radius: r,
    startAngle: Math.PI * 0.75,
    endAngle: Math.PI * 2.25,
    fill: null,
    stroke: str(props, 'dialStroke', '#333'),
    strokeWidth: 14,
    listening: false,
  });
  const angle = needleAngle(value, max);
  const needle = app.line({
    x: cx,
    y: cx,
    x2: cx + r * 0.82 * Math.cos(angle),
    y2: cx + r * 0.82 * Math.sin(angle),
    stroke: needleColor,
    strokeWidth: 4,
    listening: false,
  });
  const label = app.text({
    text: format(value),
    x: cx - 25,
    y: cx + 15,
    fontSize: 24,
    fontWeight: 'bold',
    fill: str(props, 'textColor', '#fff'),
    listening: false,
  });
  group.add(track, needle, app.circle({ x: cx - 6, y: cx - 6, radius: 6, fill: needleColor, listening: false }), label);
  setParts(group, { needle, label });
  setRefresh(group, (v) => {
    const a = needleAngle(v, max);
    (needle as { x2: number; y2: number }).x2 = cx + r * 0.82 * Math.cos(a);
    (needle as { y2: number }).y2 = cx + r * 0.82 * Math.sin(a);
    (label as TextNode).text = format(v);
  });
  setState(group, { size, value, max });
  return group;
}

function indicatorLamp(
  app: import('../App').App,
  type: string,
  autoPart: string,
  props: Record<string, unknown>,
  symbol: string
) {
  const active = bool(props, 'active', false);
  const group = createAutoGroup(app, type, props, autoPart);
  const lamp = app.circle({
    radius: 12,
    x: 0,
    y: 0,
    fill: active ? '#fbbf24' : '#333',
    stroke: active ? '#fde047' : '#555',
    strokeWidth: 1,
    listening: false,
  });
  const sym = app.text({
    text: symbol,
    x: symbol.length > 2 ? 2 : 6,
    y: 4,
    fontSize: 10,
    fill: active ? '#111' : '#666',
    listening: false,
  });
  group.add(lamp, sym);
  setParts(group, { lamp, sym });
  setBoolRefresh(group, (on) => {
    (lamp as { fill: string; stroke: string }).fill = on ? '#fbbf24' : '#333';
    (lamp as { stroke: string }).stroke = on ? '#fde047' : '#555';
    (sym as TextNode).fill = on ? '#111' : '#666';
  });
  setState(group, { active });
  return group;
}

registerAutomotive('speedometer', (props, app) =>
  dialGauge(app, props, 'speedometer', num(props, 'max', 240), '#ef4444', (v) => String(Math.round(v)))
);

registerAutomotive('tachometer', (props, app) =>
  dialGauge(app, props, 'tachometer', num(props, 'max', 8000), '#22c55e', (v) => `${Math.round(v / 1000)}k`)
);

registerAutomotive('engineTemp', (props, app) => {
  const size = num(props, 'size', 140);
  const value = num(props, 'value', 90);
  const max = num(props, 'max', 130);
  const group = createAutoGroup(app, 'engineTemp', props, 'engineTemp');
  const cx = size / 2;
  const r = size / 2 - 12;

  const zones = [
    { start: 0, end: 0.4, color: '#3b82f6' },
    { start: 0.4, end: 0.75, color: '#22c55e' },
    { start: 0.75, end: 1, color: '#ef4444' },
  ];
  const sweep = Math.PI * 1.5;
  const base = Math.PI * 0.75;
  zones.forEach((z) => {
    group.add(
      new Arc({
        x: 0,
        y: 0,
        radius: r,
        startAngle: base + z.start * sweep,
        endAngle: base + z.end * sweep,
        fill: null,
        stroke: z.color,
        strokeWidth: 8,
        listening: false,
      })
    );
  });

  const angle = needleAngle(value, max);
  const needle = app.line({
    x: cx,
    y: cx,
    x2: cx + r * 0.75 * Math.cos(angle),
    y2: cx + r * 0.75 * Math.sin(angle),
    stroke: '#fff',
    strokeWidth: 3,
    listening: false,
  });
  const label = app.text({ text: `${Math.round(value)}°C`, x: cx - 18, y: cx + 10, fontSize: 12, fill: '#fff', listening: false });
  group.add(needle, label);
  setParts(group, { needle, label });
  setRefresh(group, (v) => {
    const a = needleAngle(v, max);
    (needle as { x2: number; y2: number }).x2 = cx + r * 0.75 * Math.cos(a);
    (needle as { y2: number }).y2 = cx + r * 0.75 * Math.sin(a);
    (label as TextNode).text = `${Math.round(v)}°C`;
  });
  setState(group, { size, value, max });
  return group;
});

registerAutomotive('batteryVoltage', (props, app) => {
  const value = num(props, 'value', 12.4);
  const group = createAutoGroup(app, 'batteryVoltage', props, 'batteryVoltage');
  group.add(
    app.rect({ width: 36, height: 18, fill: null, stroke: '#fff', strokeWidth: 2, listening: false }),
    app.rect({ x: 36, y: 5, width: 4, height: 8, fill: '#fff', listening: false })
  );
  const label = app.text({
    text: `${value.toFixed(1)}V`,
    x: 44,
    y: 2,
    fontSize: 14,
    fill: value < 11.5 ? '#ef4444' : '#22c55e',
    listening: false,
  });
  group.add(label);
  setParts(group, { label });
  setRefresh(group, (v) => {
    (label as TextNode).text = `${v.toFixed(1)}V`;
    (label as TextNode).fill = v < 11.5 ? '#ef4444' : '#22c55e';
  });
  setState(group, { value });
  return group;
});

registerAutomotive('tpms', (props, app) => {
  const pressures = (props.pressures as number[]) ?? [32, 32, 32, 32];
  const lowThreshold = num(props, 'lowThreshold', 25);
  const group = createAutoGroup(app, 'tpms', props, 'tpms');
  const positions = [
    { x: 0, y: 0, label: 'FL' },
    { x: 60, y: 0, label: 'FR' },
    { x: 0, y: 40, label: 'RL' },
    { x: 60, y: 40, label: 'RR' },
  ];
  const texts: TextNode[] = [];
  positions.forEach((pos, i) => {
    const psi = pressures[i] ?? 32;
    const low = psi < lowThreshold;
    group.add(
      app.circle({ x: pos.x + 10, y: pos.y + 10, radius: 14, fill: low ? '#450a0a' : '#1f2937', stroke: low ? '#ef4444' : '#64748b', strokeWidth: 1, listening: false }),
      app.text({ text: pos.label, x: pos.x + 4, y: pos.y + 4, fontSize: 9, fill: '#9ca3af', listening: false })
    );
    const t = app.text({ text: `${psi}`, x: pos.x + 2, y: pos.y + 22, fontSize: 11, fill: low ? '#ef4444' : '#fff', listening: false });
    texts.push(t);
    group.add(t);
  });
  group.metadata.refresh = (next: number[]) => {
    next.forEach((psi, i) => {
      const low = psi < lowThreshold;
      if (texts[i]) {
        texts[i].text = `${psi}`;
        texts[i].fill = low ? '#ef4444' : '#fff';
      }
    });
  };
  setState(group, { pressures, lowThreshold });
  return group;
});

registerAutomotive('parkingBrake', (props, app) =>
  indicatorLamp(app, 'parkingBrake', 'parkingBrake', props, 'P')
);

registerAutomotive('headlights', (props, app) =>
  indicatorLamp(app, 'headlights', 'headlights', props, '💡')
);

registerAutomotive('cruiseControl', (props, app) => {
  const speed = num(props, 'speed', 0);
  const active = bool(props, 'active', speed > 0);
  const group = createAutoGroup(app, 'cruiseControl', props, 'cruiseControl');
  const bg = app.roundedRect({
    width: 72,
    height: 28,
    cornerRadius: 4,
    fill: active ? '#1d4ed8' : '#333',
    listening: false,
  });
  const label = app.text({
    text: active ? `SET ${Math.round(speed)}` : 'CRUISE',
    x: 6,
    y: 7,
    fontSize: 11,
    fill: '#fff',
    listening: false,
  });
  group.add(bg, label);
  setParts(group, { bg, label });
  setRefresh(group, (v) => {
    const on = v > 0;
    (bg as { fill: string }).fill = on ? '#1d4ed8' : '#333';
    (label as TextNode).text = on ? `SET ${Math.round(v)}` : 'CRUISE';
  });
  setState(group, { speed, active });
  return group;
});

registerAutomotive('canViewer', (props, app) => {
  const signals = (props.signals as Record<string, number | string>) ?? {
    'engine.rpm': 2500,
    'vehicle.speed': 60,
  };
  const group = createAutoGroup(app, 'canViewer', props, 'canViewer');
  const entries = Object.entries(signals).slice(0, num(props, 'maxRows', 20));
  const rowH = 16;
  group.add(
    app.rect({ width: num(props, 'width', 220), height: entries.length * rowH + 8, fill: '#111827', stroke: '#374151', strokeWidth: 1, listening: false })
  );
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
  setState(group, { signals });
  return group;
});

registerAutomotive('fuelGauge', (props, app) => {
  const value = clamp(num(props, 'value', 50), 0, 100);
  const group = createAutoGroup(app, 'fuelGauge', props, 'fuelGauge');
  group.add(app.text({ text: 'FUEL', fontSize: 10, fill: '#9ca3af', x: 0, y: 0, listening: false }));
  const track = app.rect({ y: 14, width: 100, height: 8, fill: '#333', cornerRadius: 4, listening: false });
  const fill = app.rect({ y: 14, width: value, height: 8, fill: value < 15 ? '#ef4444' : '#22c55e', cornerRadius: 4, listening: false });
  const label = app.text({ text: `${value}%`, x: 40, y: 28, fontSize: 12, fill: '#fff', listening: false });
  group.add(track, fill, label);
  setParts(group, { fill, label });
  setRefresh(group, (v) => {
    const lv = clamp(v, 0, 100);
    (fill as { width: number; fill: string }).width = lv;
    (fill as { fill: string }).fill = lv < 15 ? '#ef4444' : '#22c55e';
    (label as TextNode).text = `${Math.round(lv)}%`;
  });
  setState(group, { value });
  return group;
});

registerAutomotive('gearIndicator', (props, app) => {
  const gear = str(props, 'gear', 'P');
  const group = createAutoGroup(app, 'gearIndicator', props, 'gearIndicator');
  const label = app.text({ text: gear, fontSize: 48, fontWeight: 'bold', fill: '#fff', listening: false });
  group.add(label);
  setParts(group, { label });
  setState(group, { gear });
  return group;
});

registerAutomotive('turnIndicators', (props, app) => {
  const left = bool(props, 'left', false);
  const right = bool(props, 'right', false);
  const group = createAutoGroup(app, 'turnIndicators', props, 'turnIndicators');
  const leftText = app.text({ text: '◀', fontSize: 24, fill: left ? '#22c55e' : '#333', listening: false });
  const rightText = app.text({ text: '▶', fontSize: 24, fill: right ? '#22c55e' : '#333', x: 40, listening: false });
  group.add(leftText, rightText);
  group.metadata.refresh = (l: boolean, r: boolean) => {
    leftText.fill = l ? '#22c55e' : '#333';
    rightText.fill = r ? '#22c55e' : '#333';
  };
  setState(group, { left, right });
  return group;
});

registerAutomotive('warningLamp', (props, app) => {
  const label = str(props, 'label', '!');
  const active = bool(props, 'active', false);
  const group = createAutoGroup(app, 'warningLamp', props, 'warningLamp');
  group.add(
    app.circle({ radius: 14, x: 0, y: 0, fill: active ? '#ef4444' : '#333', stroke: active ? '#fca5a5' : '#555', strokeWidth: 1, listening: false }),
    app.text({ text: label, x: label.length > 2 ? 2 : 8, y: 5, fontSize: 10, fill: active ? '#fff' : '#666', listening: false })
  );
  setState(group, { label, active });
  return group;
});

registerAutomotive('adasStatus', (props, app) => {
  const status = str(props, 'status', 'off');
  const colors: Record<string, string> = { off: '#333', standby: '#f59e0b', active: '#22c55e', fault: '#ef4444' };
  const group = createAutoGroup(app, 'adasStatus', props, 'adasStatus');
  group.add(
    app.rect({ width: 80, height: 24, fill: colors[status] ?? '#333', cornerRadius: 4, listening: false }),
    app.text({ text: `ADAS ${status.toUpperCase()}`, x: 8, y: 5, fontSize: 10, fill: '#fff', listening: false })
  );
  setState(group, { status });
  return group;
});

registerAutomotive('instrumentCluster', (props, app) => {
  const theme = getTheme(str(props, 'theme', 'classic'));
  const w = num(props, 'width', 800);
  const h = num(props, 'height', 400);
  const group = createAutoGroup(app, 'instrumentCluster', props, 'instrumentCluster', { width: w, height: h });

  group.add(app.rect({ width: w, height: h, fill: theme.background, listening: false }));

  const widgets: [string, Record<string, unknown>][] = [
    ['speedometer', { value: props.speed ?? 0, size: 220, x: 60, y: 50, dialStroke: theme.dialStroke, textColor: theme.text }],
    ['tachometer', { value: props.rpm ?? 0, size: 220, x: 480, y: 50, dialStroke: theme.dialStroke, textColor: theme.text }],
    ['engineTemp', { value: props.engineTemp ?? 90, size: 120, x: 320, y: 60 }],
    ['fuelGauge', { value: props.fuel ?? 75, x: 60, y: 320 }],
    ['batteryVoltage', { value: props.batteryVoltage ?? 12.4, x: 180, y: 320 }],
    ['tpms', { pressures: props.tpms ?? [32, 32, 32, 32], x: 300, y: 300 }],
    ['gearIndicator', { gear: props.gear ?? 'D', x: 380, y: 280 }],
    ['turnIndicators', { left: props.turnLeft ?? false, right: props.turnRight ?? false, x: 340, y: 240 }],
    ['parkingBrake', { active: props.parkingBrake ?? false, x: 520, y: 320 }],
    ['headlights', { active: props.headlights ?? false, x: 560, y: 320 }],
    ['cruiseControl', { speed: props.cruiseSpeed ?? 0, x: 620, y: 320 }],
    ['canViewer', { signals: props.signals ?? { 'engine.rpm': 0, 'vehicle.speed': 0 }, width: 200, x: 580, y: 50, maxRows: 8 }],
    ['warningLamp', { label: 'ABS', active: props.absWarning ?? false, x: 480, y: 320 }],
    ['adasStatus', { status: props.adasStatus ?? 'off', x: 680, y: 320 }],
  ];

  for (const [type, wprops] of widgets) {
    const node = createAutomotiveFromJSON(type, wprops, app);
    if (node) group.add(node);
  }

  group.metadata.theme = theme;
  setState(group, { width: w, height: h, theme: str(props, 'theme', 'classic'), ...props });
  return group;
});
