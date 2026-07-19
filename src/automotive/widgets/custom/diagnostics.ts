/**
 * Automotive custom widgets — diagnostics.
 */
import { TextNode } from '../../../shapes/index';
import { registerAutomotive } from '../../registryCore';
import {
  createAutoGroup,
  num,
  setState,
} from '../../helpers';
import { themeFromProps } from '../../themes';
import { fitTextX, fluidFont, resolveBounds } from '../../layout';

registerAutomotive('tpms', (props, app) => {
  const theme = themeFromProps(props);
  const pressures = (props.pressures as number[]) ?? [32, 32, 32, 32];
  const lowThreshold = num(props, 'lowThreshold', 25);
  const bounds = resolveBounds(props, 168, 100);
  const group = createAutoGroup(app, 'tpms', { ...props, width: bounds.width, height: bounds.height }, 'tpms');
  const panelW = bounds.innerWidth;
  const panelH = bounds.innerHeight;
  const compact = panelH < 64 || panelW < 100;
  const title = compact ? 'TPMS' : 'TIRE PRESSURE';
  const titleSize = fluidFont(compact ? 8 : 9, bounds, 7, 11);
  const titleH = Math.max(compact ? 12 : 14, Math.min(20, panelH * 0.22));
  const gap = compact ? 3 : 5;
  // Row of four only when cells stay tall enough — otherwise 2×2 avoids a crushed strip.
  const rowCandidate = panelW >= panelH * 1.35 && panelH >= 56;
  const rowLayout = rowCandidate;
  const cellW = rowLayout
    ? (panelW - gap * 5) / 4
    : (panelW - gap * 3) / 2;
  const cellH = rowLayout
    ? Math.max(28, panelH - titleH - gap * 2)
    : Math.max(22, (panelH - titleH - gap * 3) / 2);
  const gridTop = titleH + gap;
  group.add(
    app.roundedRect({ width: panelW, height: panelH, cornerRadius: 8, fill: '#111827', stroke: theme.dialStroke, strokeWidth: 1.5, listening: false }),
    app.text({
      text: title,
      x: fitTextX(title, titleSize, panelW),
      y: Math.max(4, (titleH - titleSize) / 2),
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
  const labelSize = Math.max(7, Math.min(11, cellH * 0.26));
  const valueSize = Math.max(11, Math.min(22, cellH * 0.42));
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
      app.text({
        text: pos.label,
        x: pos.x + 4,
        y: pos.y + Math.max(2, cellH * 0.08),
        fontSize: labelSize,
        fontWeight: 'bold',
        fill: theme.textMuted,
        listening: false,
      })
    );
    const t = app.text({
      text: `${psi}`,
      x: pos.x + fitTextX(`${psi}`, valueSize, cellW),
      y: pos.y + cellH * 0.58,
      fontSize: valueSize,
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
