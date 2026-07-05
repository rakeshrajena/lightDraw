import { Arc } from '../shapes/index';
import { TextNode } from '../shapes/index';
import type { Node } from '../Node';
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
import {
  buildDialGauge,
  updateDialNeedle,
} from '../primitives/dialGauge';

function dialGauge(
  app: import('../App').App,
  props: Record<string, unknown>,
  autoPart: string,
  max: number,
  needleColor: string,
  format: (v: number) => string,
  options: { showTickLabels?: boolean; redlineFrom?: number; tickCount?: number } = {}
) {
  const size = num(props, 'size', 200);
  const value = num(props, 'value', 0);
  const needle = str(props, 'needleColor', needleColor);
  const dialStroke = str(props, 'dialStroke', '#333');
  const textColor = str(props, 'textColor', '#fff');
  const group = createAutoGroup(app, autoPart, props, autoPart);
  const cx = size / 2;
  const r = size / 2 - 14;

  const parts = buildDialGauge(
    app,
    group,
    {
      trackColor: dialStroke,
      needleColor: needle,
      textColor,
      textMuted: '#9ca3af',
      faceColor: '#0a0a0a',
      bezelColor: dialStroke,
      redlineColor: '#ef4444',
    },
    {
      size,
      value,
      max,
      formatValue: format,
      tickCount: options.tickCount ?? 10,
      showTickLabels: options.showTickLabels ?? true,
      redlineFrom: options.redlineFrom,
    }
  );

  setParts(group, { needle: parts.needle, label: parts.valueText });
  setRefresh(group, (v) => {
    updateDialNeedle(parts.needle, cx, v, max, r);
    parts.valueText.text = format(v);
  });
  setState(group, { size, value, max, needleColor: needle });
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
  const theme = getTheme(str(props, 'theme', 'classic'));
  const group = createAutoGroup(app, type, props, autoPart);
  const lamp = app.circle({
    radius: 12,
    x: 0,
    y: 0,
    fill: active ? theme.lampOn : theme.lampOff,
    stroke: active ? '#fde047' : '#555',
    strokeWidth: 1,
    shadow: active ? { color: 'rgba(251,191,36,0.5)', blur: 8, offsetX: 0, offsetY: 0 } : undefined,
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
    (lamp as { fill: string; stroke: string }).fill = on ? theme.lampOn : theme.lampOff;
    (lamp as { stroke: string }).stroke = on ? '#fde047' : '#555';
    (sym as TextNode).fill = on ? '#111' : '#666';
  });
  setState(group, { active });
  return group;
}

registerAutomotive('speedometer', (props, app) => {
  const theme = getTheme(str(props, 'theme', 'classic'));
  return dialGauge(
    app,
    { ...props, needleColor: props.needleColor ?? theme.needleSpeed, dialStroke: props.dialStroke ?? theme.dialStroke, textColor: props.textColor ?? theme.text },
    'speedometer',
    num(props, 'max', 240),
    theme.needleSpeed,
    (v) => String(Math.round(v)),
    { showTickLabels: true, redlineFrom: 0.82, tickCount: 12 }
  );
});

registerAutomotive('tachometer', (props, app) => {
  const theme = getTheme(str(props, 'theme', 'classic'));
  return dialGauge(
    app,
    { ...props, needleColor: props.needleColor ?? theme.needleTach, dialStroke: props.dialStroke ?? theme.dialStroke, textColor: props.textColor ?? theme.text },
    'tachometer',
    num(props, 'max', 8000),
    theme.needleTach,
    (v) => `${Math.round(v / 1000)}k`,
    { showTickLabels: true, redlineFrom: 0.75, tickCount: 8 }
  );
});

registerAutomotive('engineTemp', (props, app) => {
  const theme = getTheme(str(props, 'theme', 'classic'));
  const size = num(props, 'size', 140);
  const value = num(props, 'value', 90);
  const max = num(props, 'max', 130);
  const group = createAutoGroup(app, 'engineTemp', props, 'engineTemp');
  const cx = size / 2;
  const r = size / 2 - 14;
  const sweep = Math.PI * 1.5;
  const base = Math.PI * 0.75;

  group.add(
    app.circle({
      x: cx - r - 4,
      y: cx - r - 4,
      radius: r + 4,
      fill: '#0a0a0a',
      stroke: theme.dialStroke,
      strokeWidth: 2,
      listening: false,
    })
  );
  group.add(
    app.text({ text: 'TEMP', x: cx - 16, y: 8, fontSize: 9, fontWeight: 'bold', fill: theme.textMuted, listening: false })
  );

  const zones = [
    { start: 0, end: 0.4, color: '#3b82f6' },
    { start: 0.4, end: 0.75, color: theme.ok },
    { start: 0.75, end: 1, color: theme.warning },
  ];
  zones.forEach((z) => {
    group.add(
      new Arc({
        x: cx - r,
        y: cx - r,
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

  group.add(
    app.text({ text: 'C', x: cx - r + 6, y: cx + r - 18, fontSize: 9, fontWeight: '600', fill: theme.textMuted, listening: false }),
    app.text({ text: 'H', x: cx + r - 14, y: cx + r - 18, fontSize: 9, fontWeight: '600', fill: theme.textMuted, listening: false })
  );

  const angle = needleAngle(value, max);
  const needle = app.line({
    x: cx,
    y: cx,
    x2: r * 0.72 * Math.cos(angle),
    y2: r * 0.72 * Math.sin(angle),
    stroke: theme.text,
    strokeWidth: 2.5,
    lineCap: 'round',
    listening: false,
  });
  const label = app.text({
    text: `${Math.round(value)}°`,
    x: cx,
    y: cx + r * 0.42,
    fontSize: 14,
    fontWeight: 'bold',
    fill: theme.text,
    textAlign: 'center',
    listening: false,
  });
  group.add(
    needle,
    app.circle({ x: cx - 5, y: cx - 5, radius: 5, fill: theme.dialStroke, listening: false }),
    app.circle({ x: cx - 2, y: cx - 2, radius: 2, fill: theme.text, listening: false }),
    label
  );
  setParts(group, { needle, label });
  setRefresh(group, (v) => {
    const a = needleAngle(v, max);
    (needle as { x2: number; y2: number }).x2 = r * 0.72 * Math.cos(a);
    (needle as { y2: number }).y2 = r * 0.72 * Math.sin(a);
    (label as TextNode).text = `${Math.round(v)}°`;
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
  const theme = getTheme(str(props, 'theme', 'classic'));
  const pressures = (props.pressures as number[]) ?? [32, 32, 32, 32];
  const lowThreshold = num(props, 'lowThreshold', 25);
  const group = createAutoGroup(app, 'tpms', props, 'tpms');
  const panelW = 148;
  const panelH = 92;

  group.add(
    app.roundedRect({
      width: panelW,
      height: panelH,
      cornerRadius: 8,
      fill: '#111827',
      stroke: theme.dialStroke,
      strokeWidth: 1.5,
      shadow: { color: 'rgba(0,0,0,0.35)', blur: 6, offsetX: 0, offsetY: 2 },
      listening: false,
    }),
    app.text({
      text: 'TIRE PRESSURE',
      x: 10,
      y: 6,
      fontSize: 8,
      fontWeight: 'bold',
      letterSpacing: 0.06,
      fill: theme.textMuted,
      listening: false,
    }),
    app.text({ text: 'PSI', x: panelW - 30, y: 6, fontSize: 8, fill: theme.textMuted, listening: false })
  );

  const positions = [
    { x: 10, y: 24, label: 'FL' },
    { x: panelW / 2 + 2, y: 24, label: 'FR' },
    { x: 10, y: 54, label: 'RL' },
    { x: panelW / 2 + 2, y: 54, label: 'RR' },
  ];
  const texts: TextNode[] = [];
  const cells: Node[] = [];

  positions.forEach((pos, i) => {
    const psi = pressures[i] ?? 32;
    const low = psi < lowThreshold;
    const cell = app.roundedRect({
      x: pos.x,
      y: pos.y,
      width: panelW / 2 - 16,
      height: 26,
      cornerRadius: 6,
      fill: low ? '#450a0a' : '#1f2937',
      stroke: low ? theme.warning : theme.dialStroke,
      strokeWidth: 1,
      listening: false,
    });
    group.add(
      cell,
      app.text({
        text: pos.label,
        x: pos.x + 6,
        y: pos.y + 4,
        fontSize: 9,
        fontWeight: 'bold',
        fill: theme.textMuted,
        listening: false,
      })
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
    cells.push(cell);
    group.add(t);
  });

  group.metadata.refresh = (next: number[]) => {
    next.forEach((psi, i) => {
      const low = psi < lowThreshold;
      if (texts[i]) {
        texts[i].text = `${psi}`;
        texts[i].fill = low ? theme.warning : theme.text;
      }
      if (cells[i]) {
        (cells[i] as { fill: string; stroke: string }).fill = low ? '#450a0a' : '#1f2937';
        (cells[i] as { stroke: string }).stroke = low ? theme.warning : theme.dialStroke;
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
  indicatorLamp(app, 'headlights', 'headlights', props, 'HL')
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
  const theme = getTheme(str(props, 'theme', 'classic'));
  const group = createAutoGroup(app, 'fuelGauge', props, 'fuelGauge');
  const w = 110;
  const h = 52;
  group.add(
    app.roundedRect({
      width: w,
      height: h,
      cornerRadius: 8,
      fill: '#111827',
      stroke: theme.dialStroke,
      strokeWidth: 1,
      listening: false,
    }),
    app.text({ text: 'FUEL', fontSize: 9, fontWeight: '600', fill: theme.textMuted, x: 8, y: 6, listening: false }),
    app.text({ text: 'E', fontSize: 9, fill: theme.textMuted, x: 8, y: 34, listening: false }),
    app.text({ text: 'F', fontSize: 9, fill: theme.textMuted, x: w - 14, y: 34, listening: false })
  );
  const track = app.roundedRect({ x: 18, y: 32, width: w - 36, height: 8, fill: theme.lampOff, cornerRadius: 4, listening: false });
  const fill = app.roundedRect({
    x: 18,
    y: 32,
    width: ((w - 36) * value) / 100,
    height: 8,
    fill: value < 15 ? theme.warning : theme.ok,
    cornerRadius: 4,
    listening: false,
  });
  const label = app.text({
    text: `${value}%`,
    x: w / 2 - 12,
    y: 16,
    fontSize: 14,
    fontWeight: 'bold',
    fill: theme.text,
    listening: false,
  });
  group.add(track, fill, label);
  setParts(group, { fill, label });
  setRefresh(group, (v) => {
    const lv = clamp(v, 0, 100);
    (fill as { width: number; fill: string }).width = ((w - 36) * lv) / 100;
    (fill as { fill: string }).fill = lv < 15 ? '#ef4444' : '#22c55e';
    (label as TextNode).text = `${Math.round(lv)}%`;
  });
  setState(group, { value });
  return group;
});

registerAutomotive('gearIndicator', (props, app) => {
  const gear = str(props, 'gear', 'P');
  const theme = getTheme(str(props, 'theme', 'classic'));
  const group = createAutoGroup(app, 'gearIndicator', props, 'gearIndicator');
  group.add(
    app.roundedRect({
      width: 52,
      height: 56,
      cornerRadius: 8,
      fill: '#111827',
      stroke: theme.dialStroke,
      strokeWidth: 2,
      shadow: { color: 'rgba(0,0,0,0.4)', blur: 6, offsetX: 0, offsetY: 2 },
      listening: false,
    })
  );
  const label = app.text({
    text: gear,
    x: 26,
    y: 28,
    fontSize: 36,
    fontWeight: 'bold',
    fill: theme.text,
    textAlign: 'center',
    textBaseline: 'middle',
    listening: false,
  });
  group.add(label);
  setParts(group, { label });
  setState(group, { gear });
  return group;
});

registerAutomotive('turnIndicators', (props, app) => {
  const left = bool(props, 'left', false);
  const right = bool(props, 'right', false);
  const group = createAutoGroup(app, 'turnIndicators', props, 'turnIndicators');
  const onColor = '#f59e0b';
  const offColor = '#1f2937';
  const arrow = (x: number, on: boolean) =>
    app.polygon({
      points: on ? [x + 14, 10, x, 4, x, 16] : [x + 12, 10, x + 2, 5, x + 2, 15],
      fill: on ? onColor : offColor,
      stroke: on ? '#fbbf24' : '#374151',
      strokeWidth: 1,
      listening: false,
    });
  const rightArrow = (x: number, on: boolean) =>
    app.polygon({
      points: on ? [x, 10, x + 14, 4, x + 14, 16] : [x + 2, 10, x + 12, 5, x + 12, 15],
      fill: on ? onColor : offColor,
      stroke: on ? '#fbbf24' : '#374151',
      strokeWidth: 1,
      listening: false,
    });
  const leftShape = arrow(0, left);
  const rightShape = rightArrow(28, right);
  group.add(leftShape, rightShape);
  group.metadata.refresh = (l: boolean, r: boolean) => {
    const update = (shape: ReturnType<typeof arrow>, x: number, on: boolean, flip: boolean) => {
      const pts = on
        ? flip
          ? [x, 10, x + 14, 4, x + 14, 16]
          : [x + 14, 10, x, 4, x, 16]
        : flip
          ? [x + 2, 10, x + 12, 5, x + 12, 15]
          : [x + 12, 10, x + 2, 5, x + 2, 15];
      (shape as { points: number[]; fill: string; stroke: string }).points = pts;
      (shape as { fill: string }).fill = on ? onColor : offColor;
      (shape as { stroke: string }).stroke = on ? '#fbbf24' : '#374151';
    };
    update(leftShape, 0, l, false);
    update(rightShape, 28, r, true);
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

  group.add(app.rect({
    width: w,
    height: h,
    fill: theme.background,
    cornerRadius: 16,
    stroke: theme.dialStroke,
    strokeWidth: 2,
    shadow: { color: 'rgba(0,0,0,0.5)', blur: 16, offsetX: 0, offsetY: 4 },
    listening: false,
  }));

  const themeName = str(props, 'theme', 'classic');
  const widgets: [string, Record<string, unknown>][] = [
    ['speedometer', { value: props.speed ?? 0, size: 200, x: 28, y: 28, theme: themeName, dialStroke: theme.dialStroke, textColor: theme.text, needleColor: theme.needleSpeed }],
    ['tachometer', { value: props.rpm ?? 0, size: 200, x: w - 228, y: 28, theme: themeName, dialStroke: theme.dialStroke, textColor: theme.text, needleColor: theme.needleTach }],
    ['gearIndicator', { gear: props.gear ?? 'P', x: w / 2 - 26, y: h / 2 - 36, theme: themeName }],
    ['engineTemp', { value: props.engineTemp ?? 90, size: 96, x: w / 2 - 48, y: 36 }],
    ['turnIndicators', { left: props.turnLeft ?? false, right: props.turnRight ?? false, x: w / 2 - 30, y: h / 2 + 40 }],
    ['fuelGauge', { value: props.fuel ?? 75, x: 28, y: h - 68, theme: themeName }],
    ['batteryVoltage', { value: props.batteryVoltage ?? 12.4, x: 148, y: h - 64 }],
    ['tpms', { pressures: props.tpms ?? [32, 32, 32, 32], x: w / 2 - 74, y: h - 100, theme: themeName }],
    ['parkingBrake', { active: props.parkingBrake ?? false, x: w - 310, y: h - 64, theme: themeName }],
    ['headlights', { active: props.headlights ?? false, x: w - 258, y: h - 64, theme: themeName }],
    ['cruiseControl', { speed: props.cruiseSpeed ?? 0, x: w - 188, y: h - 64 }],
    ['warningLamp', { label: 'ABS', active: props.absWarning ?? false, x: w - 118, y: h - 64 }],
    ['adasStatus', { status: props.adasStatus ?? 'off', x: w - 118, y: h - 34 }],
  ];

  for (const [type, wprops] of widgets) {
    const node = createAutomotiveFromJSON(type, wprops, app);
    if (node) group.add(node);
  }

  group.metadata.theme = theme;
  setState(group, { width: w, height: h, theme: str(props, 'theme', 'classic'), ...props });
  return group;
});
