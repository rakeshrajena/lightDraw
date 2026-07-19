/**
 * Dashboard widget factories — indicators.
 */
import { registerDashboard } from '../registryCore';
import {
  clamp,
  createWidgetGroup,
  num,
  setParts,
  setRefresh,
  setState,
} from '../helpers';
import { addLegend } from '../chartPrimitives';
import { getActiveDashboard } from '../theme';
import {
  readColorStops,
  resolveValueColor,
} from '../colorStops';

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

registerDashboard('signalStrength', (props, app) => {
  const level = clamp(num(props, 'value', 3), 0, 5);
  const scale = num(props, 'scale', 1);
  const group = createWidgetGroup(app, 'signalStrength', props);
  const barW = Math.max(5, Math.round(7 * scale));
  const gap = Math.max(2, Math.round(3 * scale));
  const maxH = Math.round(28 * scale);
  const totalW = 5 * barW + 4 * gap;
  const bars: import('../../Node').Node[] = [];
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
  setParts(group, { bars: bars as unknown as import('../../Node').Node });
  setRefresh(group, (v) => {
    const lv = clamp(Math.round(v), 0, 5);
    bars.forEach((bar, i) => {
      (bar as { fill: string }).fill = i < lv ? getActiveDashboard().signalActive : getActiveDashboard().signalInactive;
    });
  });
  setState(group, { value: level, scale, width: totalW, height: maxH });
  return group;
});
