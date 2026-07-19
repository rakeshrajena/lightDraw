/**
 * Dashboard widget factories — gauges.
 */
import { Arc } from '../../shapes/index';
import { TextNode } from '../../shapes/index';
import { syntheticEvent } from '../../components/helpers';
import { registerDashboard } from '../registryCore';
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
} from '../helpers';
import { buildDialGauge, updateDialNeedle } from '../../primitives/dialGauge';
import { getActiveDashboard } from '../theme';
import {
  hasCustomFontSize,
  hasCustomTextColor,
  resolveNodeTypography,
} from '../../components/nodeTheme';
import {
  normalizeDialZones,
  readColorStops,
  readDialZones,
  resolveValueColor,
} from '../colorStops';

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
