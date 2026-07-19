/**
 * Automotive custom widgets — infotainment.
 */
import { TextNode } from '../../../shapes/index';
import { registerAutomotive } from '../../registryCore';
import {
  createAutoGroup,
  num,
  setParts,
  setState,
  str,
} from '../../helpers';
import { themeFromProps, type ThemePalette } from '../../themes';
import type { WidgetBounds } from '../../layout';
import { autoCenteredText, fitFontSizeToWidth, fitTextX, fluidFont, resolveBounds, textYForBaseline } from '../../layout';

function buildAutomotiveCalendar(
  app: import('../../../App').App,
  group: import('../../../shapes/Group').Group,
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
