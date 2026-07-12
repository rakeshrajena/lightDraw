import { Arc } from '../shapes/index';
import { TextNode } from '../shapes/index';
import type { App } from '../App';
import type { Group } from '../shapes/Group';
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
import { addLegend } from './chartPrimitives';
import { buildDialGauge, updateDialNeedle } from '../primitives/dialGauge';
import { getActiveDashboard } from './theme';
import {
  hasCustomFontSize,
  hasCustomTextColor,
  resolveNodeTypography,
} from '../components/nodeTheme';
import { installChartRebuild } from './charts/core/refresh';
import { createDashboardFromJSON } from './registryCore';
import {
  normalizeDialZones,
  readColorStops,
  readDialZones,
  resolveValueColor,
} from './colorStops';

import './charts/registerAll';

export { animateLiveValue, setLiveValue, dashboardToJSON } from './helpers';
export { CHART_TYPES } from './charts/registerAll';

registerDashboard('gauge', (props, app) => {
  const size = num(props, 'size', 120);
  const max = num(props, 'max', 100);
  const value = clamp(num(props, 'value', 0), 0, max);
  const colorStops = readColorStops(props);
  const dialZones = normalizeDialZones(readDialZones(props), max);
  const group = createWidgetGroup(app, 'gauge', props, { width: size, height: size });
  const r = size / 2 - 14;
  const cx = size / 2;
  const dash = getActiveDashboard();
  const typo = resolveNodeTypography(app, props, {
    text: dash.text,
    textMuted: dash.textMuted,
    fontSize: dash.fontSizeTitle,
    fontSizeSm: dash.fontSizeSm,
    fontSizeLg: dash.fontSizeTitle,
  });
  const customFont = hasCustomFontSize(props);
  const needleColor = resolveValueColor(value, colorStops, dash.gaugeNeedle);
  const parts = buildDialGauge(
    app,
    group,
    {
      trackColor: dash.gaugeTrack,
      needleColor,
      accentColor: needleColor,
      textColor: typo.text,
      textMuted: typo.textMuted,
      faceColor: dash.face,
      bezelColor: dash.panelStroke,
    },
    {
      size,
      value,
      max,
      tickCount: 6,
      ariaLive: 'polite',
      ...(customFont ? { valueFontSize: typo.fontSize, titleFontSize: typo.fontSizeSm } : {}),
      ...(dialZones.length ? { colorZones: dialZones } : {}),
    }
  );
  setParts(group, { needle: parts.needle, valueText: parts.valueText, valueArc: parts.valueArc as never });
  setRefresh(group, (v) => {
    updateDialNeedle(parts.needle, cx, v, max, r, undefined, undefined, undefined, parts.valueArc);
    parts.valueText.text = String(Math.round(v));
    const next = resolveValueColor(v, colorStops, getActiveDashboard().gaugeNeedle);
    (parts.needle as { stroke: string }).stroke = next;
    if (parts.valueArc) {
      (parts.valueArc as { stroke: string }).stroke = next;
    }
  });
  setState(group, {
    size,
    value,
    max,
    colorStops,
    colorZones: readDialZones(props),
    uiTheme: props.uiTheme,
    textColor: props.textColor,
    color: props.color,
    textMuted: props.textMuted,
    fontSize: props.fontSize,
    demoId: props.demoId,
    hasCustomTextColor: hasCustomTextColor(props),
    hasCustomFontSize: customFont,
  });
  if (props.demoId != null) group.metadata.demoId = props.demoId;
  return group;
});

registerDashboard('speedometer', (props, app) => {
  const size = num(props, 'size', 200);
  const value = num(props, 'value', 0);
  const max = num(props, 'max', 180);
  const colorStops = readColorStops(props);
  const dialZones = normalizeDialZones(readDialZones(props), max);
  const group = createWidgetGroup(app, 'speedometer', props);
  const r = size / 2 - 14;
  const cx = size / 2;
  const dash = getActiveDashboard();
  const typo = resolveNodeTypography(app, props, {
    text: dash.text,
    textMuted: dash.textMuted,
    fontSize: dash.fontSizeTitle,
    fontSizeSm: dash.fontSizeSm,
    fontSizeLg: dash.fontSizeTitle,
  });
  const customFont = hasCustomFontSize(props);
  const needleColor = resolveValueColor(value, colorStops, dash.speedoNeedle);
  const parts = buildDialGauge(
    app,
    group,
    {
      trackColor: dash.gaugeTrack,
      needleColor,
      accentColor: needleColor,
      textColor: typo.text,
      textMuted: typo.textMuted,
      faceColor: dash.face,
      bezelColor: dash.panelStroke,
      redlineColor: dash.dangerDark,
    },
    {
      size,
      value,
      max,
      unit: str(props, 'unit', 'km/h'),
      tickCount: 9,
      showTickLabels: true,
      ...(customFont
        ? { valueFontSize: typo.fontSize, unitFontSize: typo.fontSizeSm }
        : {}),
      ...(dialZones.length ? { colorZones: dialZones } : { redlineFrom: 0.78 }),
    }
  );
  setParts(group, { needle: parts.needle, valueText: parts.valueText, valueArc: parts.valueArc as never });
  setRefresh(group, (v) => {
    updateDialNeedle(parts.needle, cx, v, max, r, undefined, undefined, undefined, parts.valueArc);
    parts.valueText.text = `${Math.round(v)}`;
    const next = resolveValueColor(v, colorStops, getActiveDashboard().speedoNeedle);
    (parts.needle as { stroke: string }).stroke = next;
    if (parts.valueArc) {
      (parts.valueArc as { stroke: string }).stroke = next;
    }
  });
  setState(group, {
    size,
    value,
    max,
    unit: str(props, 'unit', 'km/h'),
    colorStops,
    colorZones: readDialZones(props),
    uiTheme: props.uiTheme,
    textColor: props.textColor,
    color: props.color,
    textMuted: props.textMuted,
    fontSize: props.fontSize,
    hasCustomTextColor: hasCustomTextColor(props),
    hasCustomFontSize: customFont,
  });
  return group;
});

registerDashboard('legend', (props, app) => {
  const group = createWidgetGroup(app, 'legend', props);
  const rawItems = props.items as { label: string; color: string }[] | undefined;
  const hasUserItems =
    props.hasUserLegendItems === true ||
    (!props._chartRebuild && Array.isArray(rawItems) && rawItems.length > 0);
  const items = hasUserItems && rawItems?.length
    ? rawItems
    : [
        { label: 'Series A', color: getActiveDashboard().primary },
        { label: 'Series B', color: getActiveDashboard().secondary },
      ];
  addLegend(app, group, items, 0, 0);
  setState(group, {
    ...(hasUserItems ? { items: rawItems } : { items: [] }),
    hasUserLegendItems: hasUserItems,
  });
  return group;
});

registerDashboard('thermometer', (props, app) => {
  const height = num(props, 'height', 120);
  const width = num(props, 'width', 24);
  const value = clamp(num(props, 'value', 50), 0, 100);
  const colorStops =
    readColorStops(props) ??
    [
      { upTo: 50, color: 'primary' },
      { upTo: 80, color: 'warning' },
      { color: 'danger' },
    ];
  const group = createWidgetGroup(app, 'thermometer', props);
  const tubeH = height - Math.round(width * 1.1);
  const bulbR = Math.max(8, Math.round(width * 0.48));
  const fontSize = Math.max(10, Math.round(width * 0.5));
  const fillColor = resolveValueColor(value, colorStops, getActiveDashboard().primary);

  group.add(
    app.roundedRect({
      width,
      height: tubeH,
      cornerRadius: width / 2,
      fill: getActiveDashboard().thermometerTube,
      stroke: getActiveDashboard().thermometerBorder,
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
    fill: fillColor,
    listening: false,
  });
  const bulb = app.circle({
    x: width / 2 - bulbR,
    y: tubeH - 2,
    radius: bulbR,
    fill: fillColor,
    listening: false,
  });
  group.add(
    fill,
    bulb,
    app.text({
      text: `${Math.round(value)}°`,
      x: width + 8,
      y: tubeH / 2 - fontSize / 2,
      fontSize,
      fontWeight: '600',
      fill: getActiveDashboard().text,
      listening: false,
    })
  );
  setParts(group, { fill, bulb });
  setRefresh(group, (v) => {
    const clamped = clamp(v, 0, 100);
    const fh = (tubeH - 4) * (clamped / 100);
    (fill as { y: number; height: number }).y = tubeH - fh - 2;
    (fill as { height: number }).height = fh;
    const next = resolveValueColor(clamped, colorStops, getActiveDashboard().primary);
    (fill as { fill: string }).fill = next;
    (bulb as { fill: string }).fill = next;
  });
  setState(group, {
    height,
    width,
    value,
    colorStops: readColorStops(props),
  });
  return group;
});

registerDashboard('compass', (props, app) => {
  const size = num(props, 'size', 100);
  const heading = num(props, 'heading', 0);
  const group = createWidgetGroup(app, 'compass', props, { width: size, height: size });
  const cx = size / 2;
  const r = size / 2 - 4;
  const fontSize = Math.max(8, Math.round(size * 0.1));

  group.add(
    app.circle({
      x: cx - r,
      y: cx - r,
      radius: r,
      fill: getActiveDashboard().compassFace,
      stroke: getActiveDashboard().compassRing,
      strokeWidth: Math.max(1.5, size / 50),
      shadow: size >= 90 ? { color: 'rgba(0,0,0,0.3)', blur: 6, offsetX: 0, offsetY: 2 } : undefined,
      listening: false,
    })
  );

  ['N', 'E', 'S', 'W'].forEach((label, i) => {
    const a = (i / 4) * Math.PI * 2 - Math.PI / 2;
    const lr = r * 0.62;
    group.add(
      app.text({
        text: label,
        x: cx + lr * Math.cos(a) - fontSize / 2,
        y: cx + lr * Math.sin(a) - fontSize / 2,
        fontSize,
        fontWeight: label === 'N' ? '700' : '500',
        fill: label === 'N' ? getActiveDashboard().text : getActiveDashboard().textMuted,
        textAlign: 'center',
        textBaseline: 'middle',
        listening: false,
      })
    );
  });

  const rad = ((heading - 90) * Math.PI) / 180;
  const needleLen = r * 0.55;
  const needle = app.line({
    x: cx,
    y: cx,
    x2: needleLen * Math.cos(rad),
    y2: needleLen * Math.sin(rad),
    stroke: getActiveDashboard().speedoNeedle,
    strokeWidth: Math.max(2, size / 32),
    lineCap: 'round',
    listening: false,
  });
  group.add(
    needle,
    app.circle({
      x: cx - size * 0.05,
      y: cx - size * 0.05,
      radius: size * 0.05,
      fill: getActiveDashboard().compassHub,
      stroke: getActiveDashboard().compassRing,
      strokeWidth: 1,
      listening: false,
    }),
    app.text({
      text: `${Math.round(heading)}°`,
      x: cx,
      y: cx + r * 0.22,
      fontSize: Math.max(8, Math.round(size * 0.09)),
      fontWeight: '600',
      fill: getActiveDashboard().text,
      textAlign: 'center',
      textBaseline: 'middle',
      listening: false,
    })
  );
  setParts(group, { needle });
  setRefresh(group, (v) => {
    const h = ((v - 90) * Math.PI) / 180;
    const len = r * 0.55;
    (needle as { x2: number; y2: number }).x2 = len * Math.cos(h);
    (needle as { y2: number }).y2 = len * Math.sin(h);
  });
  setState(group, { size, heading });
  return group;
});

registerDashboard('calendar', (props, app) => {
  const group = createWidgetGroup(app, 'calendar', props);
  installChartRebuild(group, app, buildCalendar);
  return group;
});

function buildCalendar(group: Group, app: App, props: Record<string, unknown>): void {
  const width = num(props, 'width', 210);
  const height = num(props, 'height', 0);
  const year = num(props, 'year', new Date().getFullYear());
  const month = num(props, 'month', new Date().getMonth());
  const highlightDay = num(props, 'highlightDay', -1);
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = first.getDay();
  const numRows = Math.ceil((startDay + daysInMonth) / 7);
  const headerH = 36;
  const gridW = width - 8;
  const gridH = height > headerH ? height - headerH - 4 : numRows * 26;
  const cell = Math.max(14, Math.min(Math.floor(gridW / 7), Math.floor(gridH / numRows), 32));
  const contentH = headerH + numRows * cell;

  group.metadata.chartWidth = width;
  group.metadata.chartHeight = height > 0 ? height : contentH + 4;

  group.add(
    app.text({
      text: first.toLocaleString('default', { month: 'long', year: 'numeric' }),
      x: 4,
      y: 4,
      fontSize: Math.min(13, cell * 0.45),
      fontWeight: 'bold',
      fill: getActiveDashboard().text,
      listening: false,
    })
  );
  ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].forEach((d, i) => {
    group.add(
      app.text({
        text: d,
        x: i * cell + 4,
        y: 22,
        fontSize: Math.max(8, cell * 0.32),
        fill: getActiveDashboard().textDim,
        listening: false,
      })
    );
  });

  for (let day = 1; day <= daysInMonth; day++) {
    const cellIdx = startDay + day - 1;
    const col = cellIdx % 7;
    const row = Math.floor(cellIdx / 7);
    group.add(
      app.text({
        text: String(day),
        x: col * cell + Math.max(4, cell * 0.2),
        y: headerH + row * cell,
        fontSize: Math.max(9, cell * 0.38),
        fill: day === highlightDay ? getActiveDashboard().highlight : getActiveDashboard().text,
        listening: false,
      })
    );
  }
  setState(group, { width, height: height > 0 ? height : contentH + 4, year, month, highlightDay, cell });
}

registerDashboard('signalStrength', (props, app) => {
  const level = clamp(num(props, 'value', 3), 0, 5);
  const scale = num(props, 'scale', 1);
  const group = createWidgetGroup(app, 'signalStrength', props);
  const barW = Math.max(5, Math.round(7 * scale));
  const gap = Math.max(2, Math.round(3 * scale));
  const maxH = Math.round(28 * scale);
  const totalW = 5 * barW + 4 * gap;
  const bars: import('../Node').Node[] = [];
  for (let i = 0; i < 5; i++) {
    const h = Math.round((8 + i * 5) * scale);
    const bar = app.rect({
      x: i * (barW + gap),
      y: maxH - h,
      width: barW,
      height: h,
      fill: i < level ? getActiveDashboard().signalActive : getActiveDashboard().signalInactive,
      cornerRadius: Math.max(1, scale),
      listening: false,
    });
    bars.push(bar);
    group.add(bar);
  }
  setParts(group, { bars: bars as unknown as import('../Node').Node });
  setRefresh(group, (v) => {
    const lv = clamp(Math.round(v), 0, 5);
    bars.forEach((bar, i) => {
      (bar as { fill: string }).fill = i < lv ? getActiveDashboard().signalActive : getActiveDashboard().signalInactive;
    });
  });
  setState(group, { value: level, scale, width: totalW, height: maxH });
  return group;
});

registerDashboard('knob', (props, app) => {
  const size = num(props, 'size', 80);
  const value = clamp(num(props, 'value', 50), 0, 100);
  const group = createWidgetGroup(app, 'knob', props, { width: size, height: size, focusable: true, listening: true });
  const cx = size / 2;
  const r = size / 2 - 5;
  const start = Math.PI * 0.75;
  const sweep = Math.PI * 1.5;
  const angle = start + (value / 100) * sweep;
  const arcW = Math.max(3, size * 0.07);
  const ptrR = r - arcW;

  group.add(
    app.circle({
      x: cx - r,
      y: cx - r,
      radius: r,
      fill: getActiveDashboard().knobTrack,
      stroke: getActiveDashboard().knobRing,
      strokeWidth: Math.max(1.5, size / 40),
      shadow: size >= 48 ? { color: 'rgba(0,0,0,0.35)', blur: 5, offsetX: 0, offsetY: 2 } : undefined,
      listening: false,
    })
  );

  group.add(
    new Arc({
      x: cx - r + arcW,
      y: cx - r + arcW,
      radius: r - arcW,
      startAngle: start,
      endAngle: start + sweep,
      fill: null,
      stroke: getActiveDashboard().inactive,
      strokeWidth: arcW * 0.65,
      listening: false,
    })
  );

  const valueArc = new Arc({
    x: cx - r + arcW,
    y: cx - r + arcW,
    radius: r - arcW,
    startAngle: start,
    endAngle: angle,
    fill: null,
    stroke: getActiveDashboard().knobIndicator,
    strokeWidth: arcW,
    listening: false,
  });
  group.add(valueArc);

  const ptrSize = Math.max(4, size * 0.09);
  const pointer = app.circle({
    x: cx + ptrR * Math.cos(angle) - ptrSize,
    y: cx + ptrR * Math.sin(angle) - ptrSize,
    radius: ptrSize,
    fill: getActiveDashboard().knobIndicator,
    stroke: '#fff',
    strokeWidth: 1,
    listening: false,
  });

  const valueLabel = app.text({
    text: String(Math.round(value)),
    x: cx,
    y: cx,
    fontSize: Math.max(10, size * 0.22),
    fontWeight: '600',
    fill: getActiveDashboard().text,
    textAlign: 'center',
    textBaseline: 'middle',
    listening: false,
  });
  group.add(pointer, valueLabel);
  setParts(group, { valueArc, pointer, valueLabel });

  setRefresh(group, (v) => {
    const pct = clamp(v, 0, 100) / 100;
    const a = start + pct * sweep;
    (valueArc as Arc).endAngle = a;
    (pointer as { x: number; y: number }).x = cx + ptrR * Math.cos(a) - ptrSize;
    (pointer as { y: number }).y = cx + ptrR * Math.sin(a) - ptrSize;
    (valueLabel as TextNode).text = String(Math.round(clamp(v, 0, 100)));
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
  const colorStops = readColorStops(props);
  const fillColor = resolveValueColor(value, colorStops, getActiveDashboard().meterFill);
  const group = createWidgetGroup(app, 'meter', props);

  if (vertical) {
    group.add(app.rect({ width: height, height: width, fill: getActiveDashboard().meterTrack, listening: false }));
    const fillBar = app.rect({
      x: 2,
      y: width - (width * value) / 100 - 2,
      width: height - 4,
      height: (width * value) / 100,
      fill: fillColor,
      listening: false,
    });
    group.add(fillBar);
    setRefresh(group, (v) => {
      const pct = clamp(v, 0, 100) / 100;
      (fillBar as { y: number; height: number }).y = width - width * pct - 2;
      (fillBar as { height: number }).height = width * pct;
      (fillBar as { fill: string }).fill = resolveValueColor(
        clamp(v, 0, 100),
        colorStops,
        getActiveDashboard().meterFill
      );
    });
  } else {
    const trackR = Math.min(4, height / 2);
    group.add(
      app.roundedRect({
        width,
        height,
        cornerRadius: trackR,
        fill: getActiveDashboard().meterTrack,
        listening: false,
      })
    );
    const fillBar = app.roundedRect({
      x: 0,
      y: 0,
      width: (width * value) / 100,
      height,
      cornerRadius: trackR,
      fill: fillColor,
      listening: false,
    });
    group.add(fillBar);
    setRefresh(group, (v) => {
      const clamped = clamp(v, 0, 100);
      (fillBar as { width: number }).width = (width * clamped) / 100;
      (fillBar as { fill: string }).fill = resolveValueColor(
        clamped,
        colorStops,
        getActiveDashboard().meterFill
      );
    });
  }
  setState(group, { width, height, value, vertical, colorStops });
  return group;
});

registerDashboard('battery', (props, app) => {
  const level = clamp(num(props, 'value', 75), 0, 100);
  const scale = num(props, 'scale', 1);
  const colorStops =
    readColorStops(props) ??
    [
      { upTo: 20, color: 'danger' },
      { color: 'success' },
    ];
  const bodyW = Math.round(40 * scale);
  const bodyH = Math.round(20 * scale);
  const group = createWidgetGroup(app, 'battery', props);
  group.add(
    app.roundedRect({
      width: bodyW,
      height: bodyH,
      cornerRadius: Math.max(2, 3 * scale),
      fill: null,
      stroke: getActiveDashboard().batteryOutline,
      strokeWidth: Math.max(1.5, 2 * scale),
      listening: false,
    })
  );
  group.add(
    app.roundedRect({
      x: bodyW,
      y: bodyH * 0.3,
      width: Math.max(3, 4 * scale),
      height: bodyH * 0.4,
      cornerRadius: 1,
      fill: getActiveDashboard().batteryTip,
      listening: false,
    })
  );
  const inset = Math.max(2, 2 * scale);
  const fill = app.roundedRect({
    x: inset,
    y: inset,
    width: ((bodyW - inset * 2) * level) / 100,
    height: bodyH - inset * 2,
    cornerRadius: Math.max(1, 2 * scale),
    fill: resolveValueColor(level, colorStops, getActiveDashboard().success),
    listening: false,
  });
  group.add(fill);
  setRefresh(group, (v) => {
    const lv = clamp(v, 0, 100);
    (fill as { width: number }).width = ((bodyW - inset * 2) * lv) / 100;
    (fill as { fill: string }).fill = resolveValueColor(
      lv,
      colorStops,
      getActiveDashboard().success
    );
  });
  setState(group, {
    value: level,
    scale,
    width: bodyW + Math.max(3, 4 * scale),
    height: bodyH,
    colorStops: readColorStops(props),
  });
  return group;
});

registerDashboard('clock', (props, app) => {
  const size = num(props, 'size', 120);
  const live = bool(props, 'live', true);
  const showSeconds = bool(props, 'showSeconds', size >= 44);
  const group = createWidgetGroup(app, 'clock', props, { width: size, height: size });
  const cx = size / 2;
  const r = size / 2 - 3;
  const pad = Math.max(2, size * 0.04);
  const hourLen = (r - pad) * 0.5;
  const minLen = (r - pad) * 0.72;
  const secLen = (r - pad) * 0.82;
  const hourW = Math.max(2, size * 0.035);
  const minW = Math.max(1.5, size * 0.025);
  const hubR = Math.max(3, size * 0.05);

  group.add(
    app.circle({
      x: cx - r,
      y: cx - r,
      radius: r,
      fill: getActiveDashboard().clockFace,
      stroke: getActiveDashboard().clockRing,
      strokeWidth: Math.max(1.5, size / 50),
      shadow: size >= 56 ? { color: 'rgba(0,0,0,0.35)', blur: 5, offsetX: 0, offsetY: 2 } : undefined,
      listening: false,
    })
  );

  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const major = i % 3 === 0;
    const tickLen = major ? size * 0.1 : size * 0.06;
    const inner = r - tickLen;
    const outer = r - size * 0.03;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    group.add(
      app.line({
        x: cx + inner * cos,
        y: cx + inner * sin,
        x2: (outer - inner) * cos,
        y2: (outer - inner) * sin,
        stroke: major ? getActiveDashboard().clockTickMajor : getActiveDashboard().clockTick,
        strokeWidth: major ? Math.max(1.5, size / 40) : 1,
        lineCap: 'round',
        listening: false,
      })
    );
  }

  const hourHand = app.line({
    x: cx,
    y: cx,
    x2: 0,
    y2: -hourLen,
    stroke: getActiveDashboard().clockHand,
    strokeWidth: hourW,
    lineCap: 'round',
    listening: false,
  });
  const minHand = app.line({
    x: cx,
    y: cx,
    x2: 0,
    y2: -minLen,
    stroke: getActiveDashboard().clockHand,
    strokeWidth: minW,
    lineCap: 'round',
    listening: false,
  });
  const secHand = app.line({
    x: cx,
    y: cx,
    x2: 0,
    y2: -secLen,
    stroke: getActiveDashboard().clockSecond,
    strokeWidth: Math.max(1, size * 0.015),
    lineCap: 'round',
    visible: showSeconds,
    listening: false,
  });
  group.add(hourHand, minHand, secHand);

  group.add(
    app.circle({
      x: cx - hubR,
      y: cx - hubR,
      radius: hubR,
      fill: getActiveDashboard().clockHub,
      stroke: getActiveDashboard().clockRing,
      strokeWidth: 1,
      listening: false,
    }),
    app.circle({
      x: cx - hubR * 0.45,
      y: cx - hubR * 0.45,
      radius: hubR * 0.45,
      fill: getActiveDashboard().clockHand,
      listening: false,
    })
  );

  const updateHands = () => {
    const now = new Date();
    const hours = now.getHours() % 12;
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const hourAngle = ((hours + minutes / 60) / 12) * Math.PI * 2 - Math.PI / 2;
    const minAngle = ((minutes + seconds / 60) / 60) * Math.PI * 2 - Math.PI / 2;
    const secAngle = (seconds / 60) * Math.PI * 2 - Math.PI / 2;
    (hourHand as { x2: number; y2: number }).x2 = hourLen * Math.cos(hourAngle);
    (hourHand as { y2: number }).y2 = hourLen * Math.sin(hourAngle);
    (minHand as { x2: number; y2: number }).x2 = minLen * Math.cos(minAngle);
    (minHand as { y2: number }).y2 = minLen * Math.sin(minAngle);
    if (showSeconds) {
      (secHand as { x2: number; y2: number }).x2 = secLen * Math.cos(secAngle);
      (secHand as { y2: number }).y2 = secLen * Math.sin(secAngle);
    }
  };

  updateHands();
  setParts(group, { hourHand, minHand, secHand });
  if (live) {
    setRefresh(group, () => updateHands());
  }
  setState(group, { size, live, showSeconds });
  return group;
});

/** Framed chart with title bar — embed any registered chart type. */
registerDashboard('chartPanel', (props, app) => {
  const chartType = str(props, 'chartType', 'lineChart');
  const title = str(props, 'title', chartType);
  const width = num(props, 'width', 320);
  const height = num(props, 'height', 200);
  const pad = 8;
  const headerH = 26;
  const innerW = Math.max(40, width - pad * 2);
  const innerH = Math.max(32, height - headerH - pad);

  const group = createWidgetGroup(app, 'chartPanel', props);

  group.add(
    app.rect({
      width,
      height,
      fill: getActiveDashboard().chartBg,
      stroke: getActiveDashboard().panelStroke,
      strokeWidth: 1,
      cornerRadius: 8,
      listening: false,
    }),
    app.text({
      text: title,
      x: pad,
      y: 6,
      fontSize: 12,
      fontWeight: 'bold',
      fill: getActiveDashboard().text,
      listening: false,
    })
  );

  if (props.maximizable !== false) {
    group.add(
      app.text({
        text: '⤢',
        x: width - 22,
        y: 5,
        fontSize: 14,
        fill: getActiveDashboard().textMuted,
        listening: true,
        metadata: { chartPanelAction: 'maximize' },
      })
    );
  }

  const chartProps = { ...props };
  delete chartProps.chartType;
  delete chartProps.title;
  delete chartProps.width;
  delete chartProps.height;
  delete chartProps.maximizable;
  const chart = createDashboardFromJSON(
    chartType,
    {
      ...chartProps,
      width: innerW,
      height: innerH,
      x: pad,
      y: headerH,
      responsive: props.responsive !== false,
      zoomEnabled: props.zoomEnabled !== false,
    },
    app
  );

  if (chart) {
    chart.x = pad;
    chart.y = headerH;
    group.add(chart);
    setParts(group, { chart });
  }

  setState(group, { chartType, title, width, height, innerW, innerH });
  return group;
});
