/**
 * Automotive panel widgets — climate.
 */
import { registerAutomotive } from '../../registryCore';
import { num, str } from '../../helpers';
import {
  addIconTile,
  addPanelFrame,
  addPanelTitle,
  addProgressBar,
  finishPanel,
  panelBounds,
  panelGroup,
  panelTheme,
  textAt,
} from '../panelPrimitives';
import { fitFontSizeToWidth, fluidFont } from '../../layout';
import { lines } from './shared';

registerAutomotive('climateControl', (props, app) => {
  const theme = panelTheme(props);
  const bounds = panelBounds(props, 220, 130);
  const group = panelGroup(app, 'climateControl', props, bounds);
  const { pad, innerWidth: w, innerHeight: h } = bounds;
  const compact = h < 88 || w < 140;
  addPanelFrame(group, app, bounds, theme, compact);
  const contentY = addPanelTitle(group, app, bounds, theme, 'Climate');

  const temp = str(props, 'temp', lines(props, ['Auto', '22°C', 'Fan 3'])[1] ?? '22°C');
  const fan = num(props, 'fan', 3);
  const autoOn = str(props, 'mode', lines(props, ['Auto', '22°C', 'Fan 3'])[0] ?? 'Auto').toLowerCase() === 'auto';

  const tempSize = fluidFont(compact ? 20 : 26, bounds, 14, 30);
  const tempFit = fitFontSizeToWidth(temp, w * 0.38, tempSize, 12);
  group.add(
    app.text({
      text: temp,
      x: pad + 2,
      y: textAt(contentY + 4, tempFit.fontSize),
      fontSize: tempFit.fontSize,
      fontWeight: 'bold',
      fill: theme.text,
      listening: false,
    })
  );

  const iconSize = Math.max(compact ? 24 : 30, Math.min(w * 0.12, 34));
  const gap = 5;
  const iconsX = pad + Math.max(w * 0.38, w - (iconSize * 3 + gap * 2));
  const iconY = contentY + 2;
  addIconTile(group, app, iconsX, iconY, iconSize, '❄', true, theme);
  addIconTile(group, app, iconsX + iconSize + gap, iconY, iconSize, '♨', false, theme);
  addIconTile(group, app, iconsX + (iconSize + gap) * 2, iconY, iconSize, 'A', autoOn, theme, autoOn ? 'AUTO' : '');

  const fanBarY = iconY + iconSize + 10;
  const fanLabel = `Fan ${fan}`;
  group.add(
    app.text({
      text: fanLabel,
      x: pad + 2,
      y: textAt(fanBarY, 9),
      fontSize: fluidFont(9, bounds, 7, 10),
      fill: theme.textMuted,
      listening: false,
    })
  );
  addProgressBar(group, app, pad, fanBarY + 12, w, compact ? 5 : 6, fan / 5, theme);

  return finishPanel(group, props, bounds, { temp, fan, mode: autoOn ? 'auto' : 'manual' });
});

registerAutomotive('quickSettingsPanel', (props, app) => {
  const theme = panelTheme(props);
  const bounds = panelBounds(props, 220, 120);
  const group = panelGroup(app, 'quickSettingsPanel', props, bounds);
  const { pad, innerWidth: w, innerHeight: h } = bounds;
  addPanelFrame(group, app, bounds, theme, true);
  const startY = addPanelTitle(group, app, bounds, theme, 'Quick Settings');

  const items = (props.items as Array<{ icon: string; label: string; on?: boolean }>) ?? [
    { icon: 'Wi', label: 'Wi-Fi', on: true },
    { icon: 'BT', label: 'BT', on: true },
    { icon: 'AC', label: 'HVAC', on: false },
    { icon: '☀', label: 'Dim', on: true },
    { icon: '♪', label: 'Vol', on: true },
    { icon: '⎋', label: 'Disp', on: false },
  ];
  const cols = 3;
  const rows = 2;
  const gap = 6;
  const availH = pad + h - startY;
  const tile = Math.min((w - gap * (cols - 1)) / cols, (availH - gap) / rows - 2);
  items.slice(0, 6).forEach((item, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    addIconTile(
      group,
      app,
      pad + col * (tile + gap),
      startY + row * (tile + gap),
      tile,
      item.icon,
      !!item.on,
      theme,
      tile >= 34 ? item.label : undefined
    );
  });

  return finishPanel(group, props, bounds, { items });
});
