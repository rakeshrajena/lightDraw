/**
 * Automotive custom widgets — indicators.
 */
import { TextNode } from '../../../shapes/index';
import { registerAutomotive } from '../../registryCore';
import {
  bool,
  createAutoGroup,
  num,
  setParts,
  setRefresh,
  setState,
  str,
} from '../../helpers';
import { themeFromProps } from '../../themes';
import { autoCenteredText, centerInBounds, fitTextX, fluidFont, resolveBounds } from '../../layout';
import { buildLampWidget } from '../../primitives/builders';

registerAutomotive('gearIndicator', (props, app) => {
  const gear = str(props, 'gear', 'P');
  const theme = themeFromProps(props);
  const bounds = resolveBounds(props, 56, 60);
  const group = createAutoGroup(app, 'gearIndicator', { ...props, width: bounds.width, height: bounds.height }, 'gearIndicator');
  const w = bounds.innerWidth;
  const h = bounds.innerHeight;
  group.add(
    app.roundedRect({
      x: bounds.pad,
      y: bounds.pad,
      width: w,
      height: h,
      cornerRadius: 8,
      fill: '#111827',
      stroke: theme.dialStroke,
      strokeWidth: 2,
      listening: false,
    })
  );
  const label = autoCenteredText(app, gear, w, h / 2, {
    fontSize: fluidFont(36, bounds, 18, 40),
    fontWeight: 'bold',
    fill: theme.text,
    insetX: bounds.pad,
    insetY: bounds.pad,
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
  const theme = themeFromProps(props);
  const bounds = resolveBounds(props, 56, 28);
  const group = createAutoGroup(app, 'turnIndicators', { ...props, width: bounds.width, height: bounds.height }, 'turnIndicators');
  const pad = bounds.pad;
  const panelW = bounds.innerWidth;
  const panelH = bounds.innerHeight;
  const compact = panelH < 18 || panelW < 40;
  const innerPad = Math.max(compact ? 2 : 4, Math.round(Math.min(panelW, panelH) * 0.1));
  const availW = panelW - innerPad * 2;
  const gap = Math.max(compact ? 3 : 5, availW * 0.14);
  const arrowW = Math.max(compact ? 7 : 10, (availW - gap) / 2);
  const arrowH = Math.max(compact ? 5 : 8, Math.min(panelH - innerPad * 2, panelH * (compact ? 0.62 : 0.52)));
  const totalW = arrowW * 2 + gap;
  const startX = pad + innerPad + Math.max(0, (panelW - innerPad * 2 - totalW) / 2);
  const cy = pad + panelH / 2;
  const leftX = startX;
  const rightX = startX + arrowW + gap;
  const onColor = theme.lampOn;
  const offColor = theme.lampOff;
  const onStroke = '#fbbf24';
  const offStroke = theme.dialStroke;

  const arrowPoints = (x: number, flip: boolean): number[] =>
    flip
      ? [x, cy, x + arrowW, cy - arrowH / 2, x + arrowW, cy + arrowH / 2]
      : [x + arrowW, cy, x, cy - arrowH / 2, x, cy + arrowH / 2];

  const arrowStyle = (on: boolean) => ({
    fill: on ? onColor : offColor,
    stroke: on ? onStroke : offStroke,
    strokeWidth: 1,
    shadow: on ? { color: 'rgba(251,191,36,0.4)', blur: compact ? 4 : 6, offsetX: 0, offsetY: 0 } : undefined,
    listening: false,
  });

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
  const leftShape = app.polygon({ points: arrowPoints(leftX, false), ...arrowStyle(left) });
  const rightShape = app.polygon({ points: arrowPoints(rightX, true), ...arrowStyle(right) });
  group.add(leftShape, rightShape);

  const applyState = (l: boolean, r: boolean) => {
    leftShape.fill = l ? onColor : offColor;
    rightShape.fill = r ? onColor : offColor;
    leftShape.stroke = l ? onStroke : offStroke;
    rightShape.stroke = r ? onStroke : offStroke;
    leftShape.shadow = l ? { color: 'rgba(251,191,36,0.4)', blur: compact ? 4 : 6, offsetX: 0, offsetY: 0 } : null;
    rightShape.shadow = r ? { color: 'rgba(251,191,36,0.4)', blur: compact ? 4 : 6, offsetX: 0, offsetY: 0 } : null;
    leftShape.markDirty();
    rightShape.markDirty();
  };

  group.metadata.refresh = (l: boolean, r: boolean) => applyState(l, r);
  setParts(group, { leftShape, rightShape });
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

registerAutomotive('warningLamp', (props, app) => {
  const labelText = str(props, 'label', '!');
  const active = bool(props, 'active', false);
  const bounds = resolveBounds(props, 36, 36);
  const group = createAutoGroup(app, 'warningLamp', { ...props, width: bounds.width, height: bounds.height }, 'warningLamp');
  const radius = Math.min(bounds.innerWidth, bounds.innerHeight) / 2 - 3;
  const maxR = Math.max(12, Math.min(radius, 56));
  const center = centerInBounds(bounds, maxR * 2, maxR * 2);
  const symSize = fluidFont(10, bounds, 8, 12);
  group.add(
    app.circle({ radius: maxR, x: center.x, y: center.y, fill: active ? '#ef4444' : '#333', stroke: active ? '#fca5a5' : '#555', strokeWidth: 1, listening: false }),
    app.text({
      text: labelText,
      x: center.x + fitTextX(labelText, symSize, maxR * 2),
      y: center.y + maxR,
      fontSize: symSize,
      fill: active ? '#fff' : '#666',
      textAlign: 'left',
      textBaseline: 'middle',
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
  const compact = w < 56;
  const label = compact ? `ADAS ${status === 'off' ? '—' : status[0]?.toUpperCase() ?? '?'}` : `ADAS ${status.toUpperCase()}`;
  group.add(
    app.rect({ width: w, height: h, fill: colors[status] ?? '#333', cornerRadius: 4, listening: false }),
    autoCenteredText(app, label, w, h / 2, {
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
