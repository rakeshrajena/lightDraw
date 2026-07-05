import { Arc } from '../shapes/index';
import { TextNode } from '../shapes/index';
import { syntheticEvent } from '../components/helpers';
import { registerDashboard } from './registryCore';
import {
  clamp,
  createWidgetGroup,
  getState,
  num,
  setLiveValue,
  setParts,
  setRefresh,
  setState,
  str,
  bool,
} from './helpers';
import {
  addAxes,
  addGridLines,
  addLegend,
  areaPathFromPoints,
  computeTicks,
  dataBounds,
  defaultLayout,
  seriesToPoints,
  wireChartInteraction,
} from './chartPrimitives';
import {
  buildDialGauge,
  updateDialNeedle,
} from '../primitives/dialGauge';
import { DASHBOARD } from './theme';

export { animateLiveValue, setLiveValue, dashboardToJSON } from './helpers';

function buildDataChart(
  group: ReturnType<typeof createWidgetGroup>,
  app: import('../App').App,
  props: Record<string, unknown>,
  filled: boolean
): void {
  const width = num(props, 'width', 300);
  const height = num(props, 'height', 150);
  const data = (props.data as number[]) ?? [10, 30, 20, 50, 40, 60];
  const layout = defaultLayout(width, height);
  const minY = props.minY;
  const maxY = props.maxY;
  const bounds = dataBounds(
    data,
    typeof minY === 'number' ? minY : undefined,
    typeof maxY === 'number' ? maxY : undefined
  );
  const yTicks = computeTicks(bounds.min, bounds.max, num(props, 'tickCount', 5));

  group.add(
    app.rect({ width, height, fill: DASHBOARD.chartBg, stroke: DASHBOARD.chartGrid, strokeWidth: 1, listening: true })
  );
  group.add(
    app.rect({
      x: layout.plotX,
      y: layout.plotY,
      width: layout.plotWidth,
      height: layout.plotHeight,
      fill: DASHBOARD.chartPlot,
      stroke: null,
      listening: false,
    })
  );
  addGridLines(app, group, layout, yTicks, bounds);
  addAxes(app, group, layout, bounds, yTicks);

  const points = seriesToPoints(data, layout, bounds);
  const baselineY = layout.plotY + layout.plotHeight;

  if (filled) {
    group.add(
      app.path({
        d: areaPathFromPoints(points, baselineY),
        fill: DASHBOARD.chartArea,
        stroke: null,
        listening: false,
      })
    );
  }

  group.add(
    app.polyline({
      points,
      fill: null,
      stroke: DASHBOARD.chartLine,
      strokeWidth: 2.5,
      lineCap: 'round',
      lineJoin: 'round',
      listening: false,
    })
  );

  data.forEach((_, i) => {
    if (i % Math.max(1, Math.floor(data.length / 6)) === 0 || data.length <= 8) {
      const px = points[i * 2];
      const py = points[i * 2 + 1];
      group.add(
        app.circle({
          x: px - 3,
          y: py - 3,
          radius: 3,
          fill: DASHBOARD.chartBg,
          stroke: DASHBOARD.chartLine,
          strokeWidth: 2,
          listening: false,
        })
      );
    }
  });

  if (props.showLegend !== false) {
    addLegend(
      app,
      group,
      [{ label: str(props, 'seriesLabel', 'Series'), color: DASHBOARD.chartLine }],
      width - 90,
      8
    );
  }

  const crosshair = app.line({
    x: layout.plotX,
    y: layout.plotY,
    x2: 0,
    y2: layout.plotHeight,
    stroke: DASHBOARD.chartCrosshair,
    strokeWidth: 1,
    dash: [4, 4],
    visible: false,
    listening: false,
  });
  const dot = app.circle({
    x: 0,
    y: 0,
    radius: 5,
    fill: DASHBOARD.chartDot,
    stroke: DASHBOARD.chartLine,
    strokeWidth: 2,
    visible: false,
    listening: false,
  });
  const tooltip = app.roundedRect({
    width: 52,
    height: 24,
    cornerRadius: 6,
    fill: DASHBOARD.chartTooltipBg,
    stroke: DASHBOARD.chartTooltipBorder,
    strokeWidth: 1,
    visible: false,
    listening: false,
  });
  const tooltipLabel = app.text({
    text: '',
    fontSize: 11,
    fontWeight: 'bold',
    fill: DASHBOARD.text,
    x: 8,
    y: 5,
    listening: false,
  });
  const hitArea = app.rect({
    x: layout.plotX,
    y: layout.plotY,
    width: layout.plotWidth,
    height: layout.plotHeight,
    fill: 'rgba(0,0,0,0.001)',
    listening: true,
  });

  group.add(crosshair, dot, tooltip, tooltipLabel, hitArea);

  if (props.interactive !== false) {
    wireChartInteraction(group, data, layout, bounds, {
      tooltip,
      tooltipLabel,
      crosshair,
      dot,
      hitArea,
    });
  }

  setParts(group, { crosshair, dot, tooltip, tooltipLabel, hitArea });

  setState(group, { width, height, data, filled, tickCount: num(props, 'tickCount', 5) });
}

registerDashboard('gauge', (props, app) => {
  const size = num(props, 'size', 120);
  const max = num(props, 'max', 100);
  const value = clamp(num(props, 'value', 0), 0, max);
  const group = createWidgetGroup(app, 'gauge', props, { width: size, height: size });
  const r = size / 2 - 14;
  const cx = size / 2;
  const parts = buildDialGauge(
    app,
    group,
    {
      trackColor: DASHBOARD.gaugeTrack,
      needleColor: DASHBOARD.gaugeNeedle,
      textColor: DASHBOARD.text,
      textMuted: DASHBOARD.textMuted,
      faceColor: '#0f172a',
      bezelColor: DASHBOARD.panelStroke,
    },
    { size, value, max, tickCount: 6, ariaLive: 'polite' }
  );
  setParts(group, { needle: parts.needle, valueText: parts.valueText });
  setRefresh(group, (v) => {
    updateDialNeedle(parts.needle, cx, v, max, r);
    parts.valueText.text = String(Math.round(v));
  });
  setState(group, { size, value, max });
  return group;
});

registerDashboard('speedometer', (props, app) => {
  const size = num(props, 'size', 200);
  const value = num(props, 'value', 0);
  const max = num(props, 'max', 180);
  const group = createWidgetGroup(app, 'speedometer', props);
  const r = size / 2 - 14;
  const cx = size / 2;
  const parts = buildDialGauge(
    app,
    group,
    {
      trackColor: DASHBOARD.gaugeTrack,
      needleColor: DASHBOARD.speedoNeedle,
      textColor: DASHBOARD.text,
      textMuted: DASHBOARD.textMuted,
      faceColor: '#0f172a',
      bezelColor: DASHBOARD.panelStroke,
      redlineColor: '#dc2626',
    },
    {
      size,
      value,
      max,
      unit: str(props, 'unit', 'km/h'),
      tickCount: 9,
      showTickLabels: true,
      redlineFrom: 0.78,
    }
  );
  setParts(group, { needle: parts.needle, valueText: parts.valueText });
  setRefresh(group, (v) => {
    updateDialNeedle(parts.needle, cx, v, max, r);
    parts.valueText.text = `${Math.round(v)}`;
  });
  setState(group, { size, value, max });
  return group;
});

registerDashboard('lineChart', (props, app) => {
  const group = createWidgetGroup(app, 'lineChart', props);
  buildDataChart(group, app, props, false);
  return group;
});

registerDashboard('areaChart', (props, app) => {
  const group = createWidgetGroup(app, 'areaChart', props);
  buildDataChart(group, app, props, true);
  return group;
});

registerDashboard('legend', (props, app) => {
  const group = createWidgetGroup(app, 'legend', props);
  const items = (props.items as { label: string; color: string }[]) ?? [
    { label: 'Series A', color: '#3b82f6' },
    { label: 'Series B', color: '#ef4444' },
  ];
  addLegend(app, group, items, 0, 0);
  setState(group, { items });
  return group;
});

registerDashboard('barChart', (props, app) => {
  const width = num(props, 'width', 300);
  const height = num(props, 'height', 150);
  const data = (props.data as number[]) ?? [30, 50, 40, 70, 60];
  const group = createWidgetGroup(app, 'barChart', props);
  const layout = defaultLayout(width, height);
  const bounds = dataBounds(data);
  const yTicks = computeTicks(bounds.min, bounds.max, 5);

  group.add(app.rect({ width, height, fill: DASHBOARD.chartBg, listening: true }));
  addGridLines(app, group, layout, yTicks, bounds);
  addAxes(app, group, layout, bounds, yTicks);

  const barWidth = layout.plotWidth / data.length - 8;
  data.forEach((val, i) => {
    const barHeight = ((val - bounds.min) / (bounds.max - bounds.min || 1)) * layout.plotHeight;
    group.add(
      app.rect({
        x: layout.plotX + i * (barWidth + 8),
        y: layout.plotY + layout.plotHeight - barHeight,
        width: barWidth,
        height: barHeight,
        fill: DASHBOARD.barFill,
        listening: false,
      })
    );
  });
  setState(group, { width, height, data });
  return group;
});

registerDashboard('pieChart', (props, app) => {
  const size = num(props, 'size', 150);
  const data = (props.data as number[]) ?? [30, 25, 20, 25];
  const colors = (props.colors as string[]) ?? ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b'];
  const group = createWidgetGroup(app, 'pieChart', props);
  const total = data.reduce((a, b) => a + b, 0) || 1;
  const cx = size / 2;
  let startAngle = -Math.PI / 2;

  data.forEach((val, i) => {
    const sweep = (val / total) * Math.PI * 2;
    group.add(
      new Arc({
        x: cx - size / 2 + 10,
        y: cx - size / 2 + 10,
        radius: size / 2 - 10,
        startAngle,
        endAngle: startAngle + sweep,
        fill: colors[i % colors.length],
        stroke: '#1f2937',
        strokeWidth: 1,
        listening: false,
      })
    );
    startAngle += sweep;
  });
  setState(group, { size, data, colors });
  return group;
});

registerDashboard('thermometer', (props, app) => {
  const height = num(props, 'height', 120);
  const width = num(props, 'width', 24);
  const value = clamp(num(props, 'value', 50), 0, 100);
  const group = createWidgetGroup(app, 'thermometer', props);
  const tubeH = height - 30;

  group.add(
    app.roundedRect({
      width,
      height: tubeH,
      cornerRadius: width / 2,
      fill: DASHBOARD.thermometerTube,
      stroke: DASHBOARD.thermometerBorder,
      strokeWidth: 1,
      listening: false,
    })
  );
  const fillH = (tubeH - 4) * (value / 100);
  const fill = app.roundedRect({
    x: 2,
    y: tubeH - fillH - 2,
    width: width - 4,
    height: fillH,
    cornerRadius: (width - 4) / 2,
    fill: value > 80 ? '#ef4444' : value > 50 ? '#f59e0b' : '#3b82f6',
    listening: false,
  });
  group.add(
    fill,
    app.circle({ x: width / 2 - 8, y: tubeH + 2, radius: 12, fill: '#ef4444', listening: false }),
    app.text({ text: `${Math.round(value)}°`, x: width + 8, y: tubeH / 2 - 8, fontSize: 12, fill: DASHBOARD.text, listening: false })
  );
  setParts(group, { fill });
  setRefresh(group, (v) => {
    const fh = (tubeH - 4) * (clamp(v, 0, 100) / 100);
    (fill as { y: number; height: number }).y = tubeH - fh - 2;
    (fill as { height: number }).height = fh;
  });
  setState(group, { height, width, value });
  return group;
});

registerDashboard('compass', (props, app) => {
  const size = num(props, 'size', 100);
  const heading = num(props, 'heading', 0);
  const group = createWidgetGroup(app, 'compass', props);
  const cx = size / 2;
  const r = size / 2 - 5;

  group.add(
    app.circle({ x: 0, y: 0, radius: r, fill: DASHBOARD.compassFace, stroke: DASHBOARD.compassRing, strokeWidth: 2, listening: false }),
    app.text({ text: 'N', x: cx - 4, y: 4, fontSize: 10, fill: DASHBOARD.textMuted, listening: false })
  );

  const rad = ((heading - 90) * Math.PI) / 180;
  const needle = app.line({
    x: cx,
    y: cx,
    x2: (r - 10) * Math.cos(rad),
    y2: (r - 10) * Math.sin(rad),
    stroke: DASHBOARD.speedoNeedle,
    strokeWidth: 3,
    listening: false,
  });
  group.add(
    needle,
    app.circle({ x: cx - 4, y: cx - 4, radius: 4, fill: '#334155', listening: false }),
    app.text({ text: `${Math.round(heading)}°`, x: cx - 12, y: size - 18, fontSize: 11, fill: DASHBOARD.text, listening: false })
  );
  setParts(group, { needle });
  setRefresh(group, (v) => {
    const h = ((v - 90) * Math.PI) / 180;
    (needle as { x2: number; y2: number }).x2 = (r - 10) * Math.cos(h);
    (needle as { y2: number }).y2 = (r - 10) * Math.sin(h);
  });
  setState(group, { size, heading });
  return group;
});

registerDashboard('calendar', (props, app) => {
  const width = num(props, 'width', 210);
  const cell = 28;
  const group = createWidgetGroup(app, 'calendar', props);
  const year = num(props, 'year', new Date().getFullYear());
  const month = num(props, 'month', new Date().getMonth());
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = first.getDay();

  group.add(
    app.text({
      text: first.toLocaleString('default', { month: 'long', year: 'numeric' }),
      x: 4,
      y: 4,
      fontSize: 13,
      fontWeight: 'bold',
      fill: DASHBOARD.text,
      listening: false,
    })
  );
  ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].forEach((d, i) => {
    group.add(app.text({ text: d, x: i * cell + 4, y: 24, fontSize: 10, fill: '#64748b', listening: false }));
  });

  for (let day = 1; day <= daysInMonth; day++) {
    const cellIdx = startDay + day - 1;
    const col = cellIdx % 7;
    const row = Math.floor(cellIdx / 7);
    group.add(
      app.text({
        text: String(day),
        x: col * cell + 6,
        y: 40 + row * cell,
        fontSize: 11,
        fill: day === num(props, 'highlightDay', -1) ? '#3b82f6' : DASHBOARD.text,
        listening: false,
      })
    );
  }
  setState(group, { width, year, month });
  return group;
});

registerDashboard('timeline', (props, app) => {
  const height = num(props, 'height', 160);
  const events = (props.events as { label: string; time?: string }[]) ?? [
    { label: 'Start', time: '09:00' },
    { label: 'Review', time: '12:00' },
    { label: 'Done', time: '17:00' },
  ];
  const group = createWidgetGroup(app, 'timeline', props);
  const step = height / Math.max(events.length, 1);

  group.add(app.line({ x: 12, y: 0, x2: 0, y2: height, stroke: '#475569', strokeWidth: 2, listening: false }));
  events.forEach((ev, i) => {
    const y = i * step + 10;
    group.add(
      app.circle({ x: 8, y, radius: 6, fill: '#2563eb', listening: false }),
      app.text({ text: ev.time ?? '', x: 24, y: y - 6, fontSize: 10, fill: '#64748b', listening: false }),
      app.text({ text: ev.label, x: 24, y: y + 8, fontSize: 12, fill: DASHBOARD.text, listening: false })
    );
  });
  setState(group, { height, events });
  return group;
});

registerDashboard('signalStrength', (props, app) => {
  const level = clamp(num(props, 'value', 3), 0, 5);
  const group = createWidgetGroup(app, 'signalStrength', props);
  const bars: import('../Node').Node[] = [];
  for (let i = 0; i < 5; i++) {
    const h = 8 + i * 5;
    const bar = app.rect({
      x: i * 10,
      y: 28 - h,
      width: 7,
      height: h,
      fill: i < level ? '#22c55e' : '#d1d5db',
      cornerRadius: 1,
      listening: false,
    });
    bars.push(bar);
    group.add(bar);
  }
  setParts(group, { bars: bars as unknown as import('../Node').Node });
  setRefresh(group, (v) => {
    const lv = clamp(Math.round(v), 0, 5);
    bars.forEach((bar, i) => {
      (bar as { fill: string }).fill = i < lv ? '#22c55e' : '#d1d5db';
    });
  });
  setState(group, { value: level });
  return group;
});

registerDashboard('knob', (props, app) => {
  const size = num(props, 'size', 80);
  const value = clamp(num(props, 'value', 50), 0, 100);
  const group = createWidgetGroup(app, 'knob', props, { focusable: true, listening: true });
  const cx = size / 2;
  const r = size / 2 - 8;
  const angle = Math.PI * 0.75 + (value / 100) * Math.PI * 1.5;

  group.add(
    app.circle({ x: 0, y: 0, radius: r, fill: '#374151', stroke: '#1f2937', strokeWidth: 2, listening: false })
  );
  const indicator = app.line({
    x: cx,
    y: cx,
    x2: (r - 12) * Math.cos(angle),
    y2: (r - 12) * Math.sin(angle),
    stroke: '#f59e0b',
    strokeWidth: 3,
    listening: false,
  });
  const valueLabel = app.text({
    text: String(Math.round(value)),
    x: cx - 10,
    y: cx + r - 10,
    fontSize: 12,
    fill: DASHBOARD.text,
    listening: false,
  });
  group.add(indicator, valueLabel);
  setParts(group, { indicator, valueLabel });
  setRefresh(group, (v) => {
    const a = Math.PI * 0.75 + (clamp(v, 0, 100) / 100) * Math.PI * 1.5;
    (indicator as { x2: number; y2: number }).x2 = (r - 12) * Math.cos(a);
    (indicator as { y2: number }).y2 = (r - 12) * Math.sin(a);
    (valueLabel as TextNode).text = String(Math.round(v));
  });
  group.on('click', () => {
    const next = (num(getState(group), 'value', 0) + 10) % 100;
    setLiveValue(group, 'value', next);
    group.emit('change', syntheticEvent('change', group, { value: next }));
  });
  setState(group, { size, value });
  return group;
});

registerDashboard('meter', (props, app) => {
  const width = num(props, 'width', 200);
  const height = num(props, 'height', 24);
  const value = clamp(num(props, 'value', 60), 0, 100);
  const vertical = bool(props, 'vertical', false);
  const group = createWidgetGroup(app, 'meter', props);

  if (vertical) {
    group.add(app.rect({ width: height, height: width, fill: '#e5e7eb', listening: false }));
    const fillBar = app.rect({
      x: 2,
      y: width - (width * value) / 100 - 2,
      width: height - 4,
      height: (width * value) / 100,
      fill: '#2563eb',
      listening: false,
    });
    group.add(fillBar);
    setRefresh(group, (v) => {
      const pct = clamp(v, 0, 100) / 100;
      (fillBar as { y: number; height: number }).y = width - width * pct - 2;
      (fillBar as { height: number }).height = width * pct;
    });
  } else {
    group.add(app.rect({ width, height, fill: '#e5e7eb', listening: false }));
    const fillBar = app.rect({
      x: 0,
      y: 0,
      width: (width * value) / 100,
      height,
      fill: '#2563eb',
      listening: false,
    });
    group.add(fillBar);
    setRefresh(group, (v) => {
      (fillBar as { width: number }).width = (width * clamp(v, 0, 100)) / 100;
    });
  }
  setState(group, { width, height, value, vertical });
  return group;
});

registerDashboard('battery', (props, app) => {
  const level = clamp(num(props, 'value', 75), 0, 100);
  const group = createWidgetGroup(app, 'battery', props);
  group.add(app.rect({ width: 40, height: 20, fill: null, stroke: '#333', strokeWidth: 2, listening: false }));
  group.add(app.rect({ x: 40, y: 6, width: 4, height: 8, fill: '#333', listening: false }));
  const fill = app.rect({
    x: 2,
    y: 2,
    width: (36 * level) / 100,
    height: 16,
    fill: level > 20 ? '#22c55e' : '#ef4444',
    listening: false,
  });
  group.add(fill);
  setRefresh(group, (v) => {
    const lv = clamp(v, 0, 100);
    (fill as { width: number }).width = (36 * lv) / 100;
    (fill as { fill: string }).fill = lv > 20 ? '#22c55e' : '#ef4444';
  });
  setState(group, { value: level });
  return group;
});

registerDashboard('clock', (props, app) => {
  const size = num(props, 'size', 120);
  const group = createWidgetGroup(app, 'clock', props);
  const cx = size / 2;
  const now = new Date();
  const hours = now.getHours() % 12;
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  group.add(
    app.circle({ x: cx - cx, y: cx - cx, radius: cx, fill: '#1f2937', stroke: '#374151', strokeWidth: 2, listening: false })
  );

  const hourAngle = ((hours + minutes / 60) / 12) * Math.PI * 2 - Math.PI / 2;
  const minAngle = ((minutes + seconds / 60) / 60) * Math.PI * 2 - Math.PI / 2;
  const secAngle = (seconds / 60) * Math.PI * 2 - Math.PI / 2;

  group.add(
    app.line({ x: cx, y: cx, x2: 30 * Math.cos(hourAngle), y2: 30 * Math.sin(hourAngle), stroke: '#fff', strokeWidth: 3, listening: false }),
    app.line({ x: cx, y: cx, x2: 40 * Math.cos(minAngle), y2: 40 * Math.sin(minAngle), stroke: '#fff', strokeWidth: 2, listening: false }),
    app.line({ x: cx, y: cx, x2: 45 * Math.cos(secAngle), y2: 45 * Math.sin(secAngle), stroke: '#ef4444', strokeWidth: 1, listening: false })
  );
  setState(group, { size });
  return group;
});
