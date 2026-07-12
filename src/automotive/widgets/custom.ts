/**
 * Rich automotive widgets — override catalog defaults where bespoke UI is needed.
 */
import { TextNode } from '../../shapes/index';
import { registerAutomotive, createAutomotiveFromJSON } from '../registryCore';
import {
  bool,
  clamp,
  createAutoGroup,
  num,
  setParts,
  setRefresh,
  setState,
  str,
} from '../helpers';
import { autoThemeName, getTheme, themeFromProps, type ThemePalette } from '../themes';
import type { WidgetBounds } from '../layout';
import { buildDialWidget, buildLampWidget } from '../primitives/builders';
import { buildDialGauge, updateDialNeedle } from '../../primitives/dialGauge';
import {
  buildDigitalGauge,
  digitalGaugeStyle,
  updateDigitalGauge,
} from '../primitives/digitalGauge';
import { autoCenteredText, centerInBounds, fitFontSizeToWidth, fitTextX, fluidFont, isCompactBounds, resolveBounds, resolveDisplay, resolveClusterLayout, textYForBaseline } from '../layout';

function themedDial(
  app: import('../../App').App,
  type: string,
  props: Record<string, unknown>,
  max: number,
  format: 'int' | 'rpm',
  needleKey: 'needleSpeed' | 'needleTach',
  options: { redlineFrom?: number; tickCount?: number; unit?: string } = {}
) {
  const theme = themeFromProps(props);
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
  const theme = themeFromProps(props);
  return themedDial(app, 'speedometer', { ...props, needleColor: props.needleColor ?? theme.needleSpeed }, 240, 'int', 'needleSpeed', {
    redlineFrom: 0.82,
    tickCount: 12,
    unit: ' km/h',
  });
});

registerAutomotive('tachometer', (props, app) => {
  const theme = themeFromProps(props);
  return themedDial(app, 'tachometer', { ...props, needleColor: props.needleColor ?? theme.needleTach }, 8000, 'rpm', 'needleTach', {
    redlineFrom: 0.75,
    tickCount: 8,
  });
});

registerAutomotive('engineTemp', (props, app) => {
  const theme = themeFromProps(props);
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

  const size = Math.min(bounds.dialSize, Math.min(bounds.innerWidth, bounds.innerHeight) - 6);
  const group = createAutoGroup(app, 'engineTemp', { ...props, width: bounds.width, height: bounds.height, size, display: 'analog' }, 'engineTemp');
  const origin = centerInBounds(bounds, size, size);
  const inner = app.group({ x: origin.x, y: origin.y, listening: false });
  group.add(inner);
  const cx = size / 2;
  const inset = Math.max(4, Math.min(12, size * 0.1));
  const r = size / 2 - inset;

  const parts = buildDialGauge(
    app,
    inner,
    {
      trackColor: theme.dialStroke,
      needleColor: theme.text,
      accentColor: theme.ok,
      textColor: theme.text,
      textMuted: theme.textMuted,
      faceColor: '#0a0a0a',
      bezelColor: theme.dialStroke,
      tickColor: theme.textMuted,
    },
    {
      size,
      value,
      max,
      title: 'TEMP',
      unit: '°C',
      formatValue: (v) => String(Math.round(v)),
      tickCount: size < 100 ? 5 : 8,
      showTickLabels: size >= 96,
      colorZones: [
        { from: 0, to: 0.4, color: '#3b82f6' },
        { from: 0.4, to: 0.75, color: theme.ok },
        { from: 0.75, to: 1, color: theme.warning },
      ],
    }
  );

  setParts(group, { needle: parts.needle, label: parts.valueText, inner });
  setRefresh(group, (v) => {
    updateDialNeedle(parts.needle, cx, v, max, r, undefined, undefined, undefined, parts.valueArc);
    parts.valueText.text = `${Math.round(v)}`;
  });
  setState(group, { width: bounds.width, height: bounds.height, size, value, max, display: 'analog' });
  return group;
});

function voltageFillLevel(value: number): number {
  return clamp((value - 11.0) / (14.2 - 11.0), 0, 1);
}

function buildAutomotiveCalendar(
  app: import('../../App').App,
  group: import('../../shapes/Group').Group,
  bounds: WidgetBounds,
  theme: ThemePalette,
  props: Record<string, unknown>
): void {
  const year = num(props, 'year', new Date().getFullYear());
  const month = num(props, 'month', new Date().getMonth());
  const now = new Date();
  const highlightDay =
    'highlightDay' in props
      ? num(props, 'highlightDay', -1)
      : year === now.getFullYear() && month === now.getMonth()
        ? now.getDate()
        : -1;
  const lines = (props.lines as string[]) ?? ['No events'];
  const eventLine = str(props, 'event', lines[0] ?? 'No events');

  const pad = bounds.pad;
  const panelW = bounds.innerWidth;
  const panelH = bounds.innerHeight;
  const compact = panelH < 120 || panelW < 160;
  const showEvents = panelH >= 72;
  const eventH = showEvents ? Math.max(compact ? 12 : 16, Math.round(panelH * 0.13)) : 0;
  const headerH = Math.max(compact ? 11 : 14, Math.round(panelH * 0.1));
  const weekdayH = Math.max(compact ? 9 : 11, Math.round(panelH * 0.07));
  const gridTop = headerH + weekdayH + 2;
  const gridH = Math.max(24, panelH - gridTop - (showEvents ? eventH + 4 : 0));

  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = first.getDay();
  const numRows = Math.ceil((startDay + daysInMonth) / 7);
  const cell = Math.max(compact ? 9 : 12, Math.min(Math.floor(panelW / 7), Math.floor(gridH / numRows)));
  const gridW = cell * 7;
  const gridX = pad + Math.max(0, (panelW - gridW) / 2);

  group.add(
    app.roundedRect({
      x: pad,
      y: pad,
      width: panelW,
      height: panelH,
      cornerRadius: Math.min(8, panelH * 0.08),
      fill: '#111827',
      stroke: theme.dialStroke,
      strokeWidth: compact ? 1 : 1.5,
      listening: false,
    })
  );

  const monthLabel = first.toLocaleString('default', {
    month: compact ? 'short' : 'long',
    year: 'numeric',
  });
  const headerSize = fluidFont(10, bounds, compact ? 7 : 8, 12);
  group.add(
    app.text({
      text: monthLabel,
      x: pad + fitTextX(monthLabel, headerSize, panelW),
      y: pad + textYForBaseline(headerH / 2, headerSize),
      fontSize: headerSize,
      fontWeight: 'bold',
      fill: theme.text,
      textAlign: 'left',
      listening: false,
    })
  );

  const weekdaySize = fluidFont(8, bounds, compact ? 6 : 7, 9);
  const weekdays = compact ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'] : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  weekdays.forEach((label, i) => {
    const cx = gridX + i * cell + cell / 2;
    group.add(
      app.text({
        text: label,
        x: cx,
        y: pad + headerH + textYForBaseline(weekdayH / 2, weekdaySize),
        fontSize: weekdaySize,
        fontWeight: '600',
        fill: theme.textMuted,
        textAlign: 'center',
        metadata: { textBoxWidth: cell, textBoxCenterY: pad + headerH + weekdayH / 2 },
        listening: false,
      })
    );
  });

  const daySize = Math.max(compact ? 7 : 8, Math.min(11, Math.floor(cell * 0.42)));
  for (let day = 1; day <= daysInMonth; day++) {
    const cellIdx = startDay + day - 1;
    const col = cellIdx % 7;
    const row = Math.floor(cellIdx / 7);
    const cellX = gridX + col * cell;
    const cellY = pad + gridTop + row * cell;
    const isToday = day === highlightDay;
    if (isToday) {
      group.add(
        app.roundedRect({
          x: cellX + Math.max(1, cell * 0.12),
          y: cellY + Math.max(1, cell * 0.1),
          width: Math.max(6, cell * 0.76),
          height: Math.max(6, cell * 0.8),
          cornerRadius: Math.max(2, cell * 0.18),
          fill: theme.accent,
          listening: false,
        })
      );
    }
    group.add(
      app.text({
        text: String(day),
        x: cellX + cell / 2,
        y: cellY + textYForBaseline(cell / 2, daySize),
        fontSize: daySize,
        fontWeight: isToday ? 'bold' : '500',
        fill: isToday ? '#fff' : theme.text,
        textAlign: 'center',
        metadata: { textBoxWidth: cell, textBoxCenterY: cellY + cell / 2 },
        listening: false,
      })
    );
  }

  if (showEvents) {
    const eventSize = fluidFont(9, bounds, compact ? 6 : 7, 10);
    const eventText = eventLine.length > 28 ? `${eventLine.slice(0, 27)}…` : eventLine;
    const eventY = pad + panelH - eventH / 2;
    group.add(
      app.text({
        text: eventText,
        x: pad + fitTextX(eventText, eventSize, panelW),
        y: textYForBaseline(eventY, eventSize),
        fontSize: eventSize,
        fill: theme.textMuted,
        textAlign: 'left',
        listening: false,
      })
    );
  }
}

registerAutomotive('calendar', (props, app) => {
  const theme = themeFromProps(props);
  const bounds = resolveBounds(props, 200, 140);
  const group = createAutoGroup(app, 'calendar', { ...props, width: bounds.width, height: bounds.height }, 'calendar');
  buildAutomotiveCalendar(app, group, bounds, theme, props);
  const year = num(props, 'year', new Date().getFullYear());
  const month = num(props, 'month', new Date().getMonth());
  const lines = (props.lines as string[]) ?? ['No events'];
  group.metadata.linesRefresh = (next: string[]) => {
    setState(group, { lines: next });
  };
  setState(group, {
    year,
    month,
    highlightDay: num(props, 'highlightDay', -1),
    lines,
    width: bounds.width,
    height: bounds.height,
  });
  return group;
});

function callerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  return (name.slice(0, 2) || '?').toUpperCase();
}

registerAutomotive('callScreen', (props, app) => {
  const theme = themeFromProps(props);
  const lines = (props.lines as string[]) ?? ['Incoming…', 'Swipe to answer'];
  const caller = str(props, 'caller', str(props, 'name', 'Alex Morgan'));
  const status = str(props, 'status', 'incoming').toLowerCase();
  const subtitle = str(props, 'subtitle', str(props, 'phone', 'Mobile'));
  const hint = str(props, 'hint', lines[1] ?? 'Swipe to answer');
  const bounds = resolveBounds(props, 220, 130);
  const group = createAutoGroup(app, 'callScreen', { ...props, width: bounds.width, height: bounds.height }, 'callScreen');
  const pad = bounds.pad;
  const panelW = bounds.innerWidth;
  const panelH = bounds.innerHeight;
  const compact = panelH < 88 || panelW < 140;
  const statusLabel =
    status === 'active' ? 'ON CALL' : status === 'ended' ? 'CALL ENDED' : 'INCOMING CALL';

  group.add(
    app.roundedRect({
      x: pad,
      y: pad,
      width: panelW,
      height: panelH,
      cornerRadius: Math.min(10, panelH * 0.1),
      fill: '#111827',
      stroke: theme.dialStroke,
      strokeWidth: compact ? 1 : 1.5,
      listening: false,
    })
  );

  const statusSize = fluidFont(8, bounds, 6, 9);
  group.add(
    app.text({
      text: statusLabel,
      x: pad + fitTextX(statusLabel, statusSize, panelW),
      y: pad + textYForBaseline((compact ? 10 : 12), statusSize),
      fontSize: statusSize,
      fontWeight: 'bold',
      fill: theme.textMuted,
      textAlign: 'left',
      listening: false,
    })
  );

  const avatarSize = Math.max(compact ? 26 : 34, Math.min(panelH * 0.36, panelW * 0.2));
  const avatarX = pad + Math.max(4, panelW * 0.03);
  const avatarY = pad + (compact ? 16 : 20);
  group.add(
    app.circle({
      x: avatarX,
      y: avatarY,
      radius: avatarSize / 2,
      fill: theme.accent,
      opacity: 0.85,
      listening: false,
    })
  );
  const initials = callerInitials(caller);
  const initialsSize = Math.max(compact ? 9 : 11, Math.floor(avatarSize * 0.3));
  group.add(
    autoCenteredText(app, initials, avatarSize, avatarSize / 2, {
      fontSize: initialsSize,
      fontWeight: 'bold',
      fill: '#fff',
      insetX: avatarX,
      insetY: avatarY,
    })
  );

  const textX0 = avatarX + avatarSize + Math.max(6, panelW * 0.03);
  const textW = Math.max(40, pad + panelW + pad - textX0 - 4);
  const callerMax = fluidFont(14, bounds, compact ? 10 : 11, 16);
  const callerFit = fitFontSizeToWidth(caller, textW, callerMax, 8);
  const nameY = avatarY + avatarSize * 0.22;
  const nameText = app.text({
    text: caller,
    x: textX0 + callerFit.x,
    y: textYForBaseline(nameY, callerFit.fontSize),
    fontSize: callerFit.fontSize,
    fontWeight: 'bold',
    fill: theme.text,
    textAlign: 'left',
    listening: false,
  });
  const subSize = fluidFont(9, bounds, 7, 10);
  const subText = app.text({
    text: subtitle,
    x: textX0 + fitTextX(subtitle, subSize, textW),
    y: textYForBaseline(nameY + callerFit.fontSize * 0.95, subSize),
    fontSize: subSize,
    fill: theme.textMuted,
    textAlign: 'left',
    listening: false,
  });
  group.add(nameText, subText);

  const btnH = Math.max(compact ? 18 : 22, Math.min(28, panelH * 0.16));
  const btnGap = Math.max(6, panelW * 0.04);
  const btnW = Math.max(compact ? 44 : 56, (panelW - btnGap) / 2);
  const btnY = pad + panelH - btnH - (compact ? 8 : 10);
  const declineX = pad + Math.max(0, (panelW - btnW * 2 - btnGap) / 2);
  const answerX = declineX + btnW + btnGap;

  group.add(
    app.roundedRect({
      x: declineX,
      y: btnY,
      width: btnW,
      height: btnH,
      cornerRadius: Math.min(8, btnH / 2),
      fill: theme.warning,
      listening: false,
    }),
    app.roundedRect({
      x: answerX,
      y: btnY,
      width: btnW,
      height: btnH,
      cornerRadius: Math.min(8, btnH / 2),
      fill: theme.ok,
      listening: false,
    })
  );
  const btnLabel = compact ? { decline: 'End', answer: 'Ans' } : { decline: 'Decline', answer: 'Answer' };
  const btnFont = fluidFont(9, bounds, compact ? 7 : 8, 10);
  group.add(
    autoCenteredText(app, btnLabel.decline, btnW, btnH / 2, {
      fontSize: btnFont,
      fontWeight: 'bold',
      fill: '#fff',
      insetX: declineX,
      insetY: btnY,
    }),
    autoCenteredText(app, btnLabel.answer, btnW, btnH / 2, {
      fontSize: btnFont,
      fontWeight: 'bold',
      fill: '#fff',
      insetX: answerX,
      insetY: btnY,
    })
  );

  const hintSize = fluidFont(8, bounds, 6, 9);
  const hintText = hint.length > 24 ? `${hint.slice(0, 23)}…` : hint;
  const hintY = Math.max(avatarY + avatarSize + 4, btnY - hintSize - (compact ? 4 : 6));
  const hintNode = app.text({
    text: hintText,
    x: pad + fitTextX(hintText, hintSize, panelW),
    y: textYForBaseline(hintY, hintSize),
    fontSize: hintSize,
    fill: theme.textMuted,
    textAlign: 'left',
    listening: false,
  });
  group.add(hintNode);

  setParts(group, { nameText, subText, hintNode });
  group.metadata.linesRefresh = (next: string[]) => {
    if (next[0]) (subText as TextNode).text = next[0];
    if (next[1]) {
      const nextHint = next[1].length > 24 ? `${next[1].slice(0, 23)}…` : next[1];
      (hintNode as TextNode).text = nextHint;
    }
  };
  group.metadata.refresh = (nextCaller: string, nextStatus?: string) => {
    const fit = fitFontSizeToWidth(nextCaller, textW, callerMax, 8);
    (nameText as TextNode).text = nextCaller;
    (nameText as TextNode).fontSize = fit.fontSize;
    (nameText as TextNode).x = textX0 + fit.x;
    if (nextStatus) setState(group, { status: nextStatus });
  };
  setState(group, { caller, status, subtitle, hint, lines, width: bounds.width, height: bounds.height });
  return group;
});

registerAutomotive('batteryVoltage', (props, app) => {
  const value = num(props, 'value', 12.4);
  const lowThreshold = num(props, 'lowThreshold', 11.5);
  const theme = themeFromProps(props);
  const bounds = resolveBounds(props, 100, 36);
  const group = createAutoGroup(app, 'batteryVoltage', { ...props, width: bounds.width, height: bounds.height }, 'batteryVoltage');
  const pad = bounds.pad;
  const panelW = bounds.innerWidth;
  const panelH = bounds.innerHeight;
  const compact = panelW < 56 || panelH < 22;
  const low = value < lowThreshold;
  const levelColor = low ? theme.warning : theme.ok;

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

  const bodyW = Math.max(compact ? 10 : 18, Math.min(panelW * 0.28, panelH * 0.65));
  const bodyH = Math.max(compact ? 7 : 11, Math.min(panelH * 0.5, bodyW * 0.48));
  const nubW = Math.max(2, bodyW * 0.12);
  const iconX = pad + Math.max(compact ? 3 : 6, panelW * 0.05);
  const iconY = pad + (panelH - bodyH) / 2;
  const inset = Math.max(1.5, bodyW * 0.1);
  const innerFillW = Math.max(0, bodyW - inset * 2);

  group.add(
    app.roundedRect({
      x: iconX,
      y: iconY,
      width: bodyW,
      height: bodyH,
      cornerRadius: Math.min(2, bodyH * 0.2),
      fill: null,
      stroke: theme.textMuted,
      strokeWidth: compact ? 1 : 1.5,
      listening: false,
    })
  );
  const fill = app.roundedRect({
    x: iconX + inset,
    y: iconY + inset,
    width: innerFillW * voltageFillLevel(value),
    height: bodyH - inset * 2,
    cornerRadius: 1,
    fill: levelColor,
    listening: false,
  });
  group.add(
    fill,
    app.rect({
      x: iconX + bodyW,
      y: iconY + bodyH * 0.22,
      width: nubW,
      height: bodyH * 0.56,
      fill: theme.textMuted,
      listening: false,
    })
  );

  const textGap = Math.max(3, panelW * 0.04);
  const textX0 = iconX + bodyW + nubW + textGap;
  const textW = Math.max(18, pad + panelW + pad - textX0 - (compact ? 2 : 4));
  const val = `${value.toFixed(1)}V`;
  const maxFs = fluidFont(14, bounds, compact ? 8 : 10, 16);
  const fitted = fitFontSizeToWidth(val, textW, maxFs, compact ? 7 : 8);
  const label = app.text({
    text: val,
    x: textX0 + fitted.x,
    y: pad + textYForBaseline(panelH / 2, fitted.fontSize),
    fontSize: fitted.fontSize,
    fontWeight: 'bold',
    fill: levelColor,
    textAlign: 'left',
    listening: false,
  });
  group.add(label);

  setParts(group, { label, fill });
  setRefresh(group, (v) => {
    const isLow = v < lowThreshold;
    const color = isLow ? theme.warning : theme.ok;
    const next = `${v.toFixed(1)}V`;
    const nextFit = fitFontSizeToWidth(next, textW, maxFs, compact ? 7 : 8);
    (label as TextNode).text = next;
    (label as TextNode).fontSize = nextFit.fontSize;
    (label as TextNode).x = textX0 + nextFit.x;
    (label as TextNode).y = pad + textYForBaseline(panelH / 2, nextFit.fontSize);
    (label as TextNode).fill = color;
    (fill as { width: number; fill: string }).width = innerFillW * voltageFillLevel(v);
    (fill as { fill: string }).fill = color;
  });
  setState(group, { value, lowThreshold, width: bounds.width, height: bounds.height });
  return group;
});

registerAutomotive('tpms', (props, app) => {
  const theme = themeFromProps(props);
  const pressures = (props.pressures as number[]) ?? [32, 32, 32, 32];
  const lowThreshold = num(props, 'lowThreshold', 25);
  const bounds = resolveBounds(props, 148, 92);
  const group = createAutoGroup(app, 'tpms', { ...props, width: bounds.width, height: bounds.height }, 'tpms');
  const panelW = bounds.innerWidth;
  const panelH = bounds.innerHeight;
  const compact = panelH < 48 || panelW < 88;
  const title = compact ? 'TPMS' : 'TIRE PRESSURE';
  const titleSize = fluidFont(compact ? 7 : 8, bounds, 6, 9);
  const titleH = Math.max(compact ? 10 : 12, Math.min(18, panelH * 0.2));
  const gap = compact ? 2 : 4;
  const rowLayout = compact && panelW >= panelH * 1.4;
  const cellW = rowLayout
    ? (panelW - gap * 5) / 4
    : (panelW - gap * 3) / 2;
  const cellH = rowLayout
    ? Math.max(10, panelH - titleH - gap * 2)
    : Math.max(10, (panelH - titleH - gap * 3) / 2);
  const gridTop = titleH + gap;
  group.add(
    app.roundedRect({ width: panelW, height: panelH, cornerRadius: 8, fill: '#111827', stroke: theme.dialStroke, strokeWidth: 1.5, listening: false }),
    app.text({
      text: title,
      x: fitTextX(title, titleSize, panelW),
      y: compact ? 4 : 6,
      fontSize: titleSize,
      fontWeight: 'bold',
      fill: theme.textMuted,
      listening: false,
    })
  );
  const positions = rowLayout
    ? [
        { x: gap, y: gridTop, label: 'FL' },
        { x: gap * 2 + cellW, y: gridTop, label: 'FR' },
        { x: gap * 3 + cellW * 2, y: gridTop, label: 'RL' },
        { x: gap * 4 + cellW * 3, y: gridTop, label: 'RR' },
      ]
    : [
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
      x: pos.x + fitTextX(`${psi}`, Math.max(9, cellH * 0.38), cellW),
      y: pos.y + cellH * 0.62,
      fontSize: Math.max(9, cellH * 0.38),
      fontWeight: 'bold',
      fill: low ? theme.warning : theme.text,
      textAlign: 'left',
      textBaseline: 'middle',
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
  const theme = themeFromProps(props);
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

function buildInstrumentCluster(props: Record<string, unknown>, app: import('../../App').App, type: string) {
  const theme = themeFromProps(props);
  const w = num(props, 'width', 800);
  const h = num(props, 'height', 400);
  const incomingCall = bool(props, 'incomingCall', false) || bool(props, 'showCall', false);
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
  const themeName = autoThemeName(props);
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
    callScreen: {
      caller: str(props, 'caller', 'Alex Morgan'),
      subtitle: str(props, 'subtitle', str(props, 'phone', 'Mobile')),
      status: str(props, 'callStatus', str(props, 'status', 'incoming')),
      hint: str(props, 'callHint', str(props, 'hint', 'Swipe to answer')),
      lines: (props.lines as string[]) ?? ['Incoming…', 'Swipe to answer'],
    },
  };

  for (const slot of resolveClusterLayout(w, h, { callScreen: incomingCall })) {
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
