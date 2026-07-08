/**
 * Professional panel widgets — climate, media, navigation, alerts, and utilities.
 */
import { registerAutomotive } from '../registryCore';
import { bool, num, setState, str } from '../helpers';
import {
  addAlbumPlaceholder,
  addCompassRose,
  addIconTile,
  addListRow,
  addMediaArtAndMeta,
  addOsmMapLayer,
  addPanelFrame,
  addPanelTitle,
  addProgressBar,
  addTransportRow,
  addTurnArrow,
  finishPanel,
  fitLabel,
  panelBounds,
  panelGroup,
  panelTheme,
  textAt,
} from './panelPrimitives';
import { fitFontSizeToWidth, fluidFont } from '../layout';

function lines(props: Record<string, unknown>, fallback: string[]): string[] {
  return (props.lines as string[]) ?? fallback;
}

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

registerAutomotive('compass', (props, app) => {
  const theme = panelTheme(props);
  const bounds = panelBounds(props, 140, 140);
  const group = panelGroup(app, 'compass', props, bounds);
  const { pad, innerWidth: w, innerHeight: h } = bounds;
  addPanelFrame(group, app, bounds, theme);
  const heading = num(props, 'heading', num(props, 'value', 45));
  const radius = Math.max(22, Math.min(w, h) * 0.32);
  const cx = pad + w / 2;
  const cy = pad + h / 2 - 4;
  addCompassRose(group, app, cx, cy, radius, heading, theme);

  const label = `${['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(heading / 45) % 8]} ${String(Math.round(heading)).padStart(3, '0')}°`;
  const labelSize = fluidFont(11, bounds, 8, 13);
  group.add(
    app.text({
      text: label,
      x: pad + w / 2,
      y: textAt(pad + h - 10, labelSize),
      fontSize: labelSize,
      fontWeight: 'bold',
      fill: theme.text,
      textAlign: 'center',
      listening: false,
    })
  );

  group.metadata.refresh = (v: number) => setState(group, { heading: v, value: v });
  return finishPanel(group, props, bounds, { heading, value: heading });
});

registerAutomotive('gpsNavigationMap', (props, app) => {
  const theme = panelTheme(props);
  const bounds = panelBounds(props, 240, 160);
  const group = panelGroup(app, 'gpsNavigationMap', props, bounds);
  const { pad, innerWidth: w, innerHeight: h } = bounds;
  addPanelFrame(group, app, bounds, theme);
  const contentY = addPanelTitle(group, app, bounds, theme, 'Navigation');
  addOsmMapLayer(group, app, pad, contentY, w, h - (contentY - pad) - 4, theme, {
    lat: num(props, 'lat', 51.505),
    lon: num(props, 'lon', -0.09),
    zoom: num(props, 'zoom', 14),
    route: true,
    marker: true,
    useTile: bool(props, 'useOsmTiles', true),
  });
  return finishPanel(group, props, bounds);
});

registerAutomotive('navigationSearch', (props, app) => {
  const theme = panelTheme(props);
  const bounds = panelBounds(props, 220, 130);
  const group = panelGroup(app, 'navigationSearch', props, bounds);
  const { pad, innerWidth: w, innerHeight: h } = bounds;
  addPanelFrame(group, app, bounds, theme, true);
  const query = str(props, 'query', lines(props, ['Search…'])[0] ?? 'Search…');
  const fieldH = Math.max(22, h * 0.15);
  const fieldY = pad + 10;
  group.add(
    app.roundedRect({
      x: pad,
      y: fieldY,
      width: w,
      height: fieldH,
      cornerRadius: fieldH / 2,
      fill: '#1f2937',
      stroke: theme.dialStroke,
      strokeWidth: 1,
      listening: false,
    }),
    app.text({
      text: '⌕',
      x: pad + 10,
      y: textAt(fieldY + fieldH / 2, 12),
      fontSize: 12,
      fill: theme.textMuted,
      listening: false,
    })
  );
  group.add(fitLabel(app, query, pad + 28, fieldY + fieldH * 0.28, w - 36, fluidFont(10, bounds, 8, 11), theme));

  const mapY = fieldY + fieldH + 8;
  addOsmMapLayer(group, app, pad, mapY, w, pad + h - mapY - 4, theme, {
    lat: num(props, 'lat', 51.51),
    lon: num(props, 'lon', -0.12),
    zoom: 13,
    route: false,
    marker: false,
    useTile: bool(props, 'useOsmTiles', true),
  });
  return finishPanel(group, props, bounds, { query });
});

registerAutomotive('routeGuidance', (props, app) => {
  const theme = panelTheme(props);
  const bounds = panelBounds(props, 220, 130);
  const group = panelGroup(app, 'routeGuidance', props, bounds);
  const { pad, innerWidth: w, innerHeight: h } = bounds;
  const rowLines = lines(props, ['12.4 km', '18 min']);
  const distance = str(props, 'distance', rowLines[0] ?? '12.4 km');
  const eta = str(props, 'eta', rowLines[1] ?? '18 min');
  const instruction = str(props, 'instruction', 'Turn right onto Main St');
  addPanelFrame(group, app, bounds, theme);
  const mapH = Math.max(48, h * 0.4);
  addOsmMapLayer(group, app, pad, pad + 4, w, mapH, theme, {
    lat: num(props, 'lat', 51.505),
    lon: num(props, 'lon', -0.09),
    zoom: 15,
    route: true,
    marker: true,
    useTile: bool(props, 'useOsmTiles', true),
  });

  const infoY = pad + mapH + 12;
  const infoH = pad + h - infoY;
  const arrowSize = Math.min(infoH, w * 0.22);
  addTurnArrow(group, app, pad, infoY, arrowSize, theme);
  const textX = pad + arrowSize + 8;
  const textW = w - arrowSize - 12;
  group.add(
    fitLabel(app, instruction, textX, infoY + 4, textW, fluidFont(10, bounds, 8, 11), theme, true),
    app.text({
      text: `${distance} · ${eta}`,
      x: textX,
      y: textAt(infoY + infoH - 12, 9),
      fontSize: fluidFont(9, bounds, 7, 10),
      fill: theme.textMuted,
      listening: false,
    })
  );
  return finishPanel(group, props, bounds, { distance, eta, instruction });
});

registerAutomotive('warningAlertPanel', (props, app) => {
  const theme = panelTheme(props);
  const bounds = panelBounds(props, 220, 120);
  const group = panelGroup(app, 'warningAlertPanel', props, bounds);
  const { pad, innerWidth: w, innerHeight: h } = bounds;
  const alerts = (props.alerts as string[]) ?? lines(props, ['No warnings']);
  const hasAlert = alerts.length > 0 && alerts[0].toLowerCase() !== 'no warnings';
  addPanelFrame(group, app, bounds, theme);
  const startY = addPanelTitle(group, app, bounds, theme, 'Warnings');
  const rowH = Math.max(24, (pad + h - startY - 4) / Math.min(2, alerts.length));
  alerts.slice(0, 2).forEach((alert, i) => {
    addListRow(group, app, pad, startY + i * (rowH + 4), w, rowH, '⚠', alert, undefined, theme, hasAlert && i === 0);
  });
  return finishPanel(group, props, bounds, { alerts });
});

registerAutomotive('nowPlaying', (props, app) => {
  const theme = panelTheme(props);
  const bounds = panelBounds(props, 240, 130);
  const group = panelGroup(app, 'nowPlaying', props, bounds);
  const { pad, innerWidth: w, innerHeight: h } = bounds;
  const rowLines = lines(props, ['Song Title', 'Artist']);
  const title = str(props, 'title', rowLines[0] ?? 'Song Title');
  const artist = str(props, 'artist', rowLines[1] ?? 'Artist');
  const progress = num(props, 'progress', 0.42);
  addPanelFrame(group, app, bounds, theme);
  const top = addPanelTitle(group, app, bounds, theme, 'Now Playing');
  addMediaArtAndMeta(group, app, bounds, theme, top, title, artist, '#7c3aed');
  const barY = pad + h - 44;
  addProgressBar(group, app, pad, barY, w, 5, progress, theme);
  addTransportRow(group, app, pad + w / 2, barY + 10, w, pad + h - barY - 12, theme);
  return finishPanel(group, props, bounds, { title, artist, progress });
});

registerAutomotive('mediaPlayer', (props, app) => {
  const theme = panelTheme(props);
  const bounds = panelBounds(props, 260, 168);
  const group = panelGroup(app, 'mediaPlayer', props, bounds);
  const { pad, innerWidth: w, innerHeight: h } = bounds;
  const rowLines = lines(props, ['Now playing', 'Track — Artist']);
  const title = str(props, 'title', rowLines[1]?.split('—')[0]?.trim() ?? 'Midnight Drive');
  const artist = str(props, 'artist', rowLines[1]?.split('—')[1]?.trim() ?? 'Neon Wave');
  const progress = num(props, 'progress', 0.36);
  addPanelFrame(group, app, bounds, theme);
  const top = addPanelTitle(group, app, bounds, theme, 'Media');
  const { bottom } = addMediaArtAndMeta(group, app, bounds, theme, top, title, artist, '#db2777');
  const barY = bottom + 10;
  addProgressBar(group, app, pad, barY, w, 6, progress, theme);
  group.add(
    app.text({ text: '1:24', x: pad, y: textAt(barY - 8, 8), fontSize: 8, fill: theme.textMuted, listening: false }),
    app.text({ text: '3:42', x: pad + w - 24, y: textAt(barY - 8, 8), fontSize: 8, fill: theme.textMuted, listening: false })
  );
  addTransportRow(group, app, pad + w / 2, barY + 12, w, pad + h - barY - 14, theme);
  return finishPanel(group, props, bounds, { title, artist, progress });
});

registerAutomotive('musicControls', (props, app) => {
  const theme = panelTheme(props);
  const bounds = panelBounds(props, 180, 72);
  const group = panelGroup(app, 'musicControls', props, bounds);
  const { pad, innerWidth: w, innerHeight: h } = bounds;
  addPanelFrame(group, app, bounds, theme, true);
  addTransportRow(group, app, pad + w / 2, pad + 10, w, h - 20, theme, bool(props, 'playing', true));
  return finishPanel(group, props, bounds, { playing: bool(props, 'playing', true) });
});

registerAutomotive('albumArt', (props, app) => {
  const theme = panelTheme(props);
  const bounds = panelBounds(props, 180, 180);
  const group = panelGroup(app, 'albumArt', props, bounds);
  const { pad, innerWidth: w, innerHeight: h } = bounds;
  const rowLines = lines(props, ['[ Artwork ]']);
  const album = str(props, 'album', rowLines[0] ?? 'Night Roads');
  const artist = str(props, 'artist', 'Neon Wave');
  addPanelFrame(group, app, bounds, theme);
  const art = Math.max(56, Math.min(w, h * 0.58));
  const artX = pad + (w - art) / 2;
  addAlbumPlaceholder(group, app, artX, pad + 8, art, '#4f46e5');
  const metaY = pad + 8 + art + 10;
  group.add(
    app.text({
      text: album,
      x: pad + w / 2,
      y: textAt(metaY, fluidFont(11, bounds, 9, 13)),
      fontSize: fluidFont(11, bounds, 9, 13),
      fontWeight: 'bold',
      fill: theme.text,
      textAlign: 'center',
      listening: false,
    }),
    app.text({
      text: artist,
      x: pad + w / 2,
      y: textAt(metaY + 16, 9),
      fontSize: fluidFont(9, bounds, 7, 10),
      fill: theme.textMuted,
      textAlign: 'center',
      listening: false,
    })
  );
  return finishPanel(group, props, bounds, { album, artist });
});

registerAutomotive('fmRadio', (props, app) => {
  const theme = panelTheme(props);
  const bounds = panelBounds(props, 220, 120);
  const group = panelGroup(app, 'fmRadio', props, bounds);
  const { pad, innerWidth: w, innerHeight: h } = bounds;
  const station = str(props, 'station', lines(props, ['FM 98.5'])[0] ?? 'FM 98.5');
  const band = str(props, 'band', station.startsWith('AM') ? 'AM' : 'FM');
  const freq = str(props, 'frequency', station.replace(/^(FM|AM)\s*/, '') || '98.5');
  const stationName = str(props, 'stationName', str(props, 'name', 'Classic Hits'));
  const rds = str(props, 'rds', str(props, 'subtitle', 'Neon Wave — Midnight Drive'));
  const stereo = bool(props, 'stereo', true);
  const presets = (props.presets as string[]) ?? ['88.1', '92.3', '98.5', '101.2'];
  const compact = h < 100;

  addPanelFrame(group, app, bounds, theme, compact);
  const top = addPanelTitle(group, app, bounds, theme, 'Radio');

  if (stereo) {
    group.add(
      app.text({
        text: 'ST',
        x: pad + w - 18,
        y: textAt(pad + 9, 7),
        fontSize: 7,
        fontWeight: 'bold',
        fill: theme.ok,
        listening: false,
      }),
      app.circle({
        x: pad + w - 24,
        y: pad + 9,
        radius: 2,
        fill: theme.ok,
        listening: false,
      })
    );
  }

  const displayY = top + 2;
  const presetH = Math.max(compact ? 18 : 22, Math.min(28, (pad + h - top) * 0.18));
  const presetY = pad + h - presetH;
  const rdsBand = 12;
  const displayH = Math.max(compact ? 58 : 68, presetY - displayY - rdsBand - 6);

  group.add(
    app.roundedRect({
      x: pad,
      y: displayY,
      width: w,
      height: displayH,
      cornerRadius: 8,
      fill: '#0b1220',
      stroke: theme.dialStroke,
      strokeWidth: 1,
      listening: false,
    })
  );

  const seek = Math.max(20, Math.min(26, displayH * 0.38));
  const seekY = displayY + (displayH - seek) / 2 - 4;
  const seekL = pad + 6;
  const seekR = pad + w - seek - 6;
  for (const [sx, path] of [
    [seekL, `M ${seekL + seek * 0.62} ${seekY + seek * 0.32} L ${seekL + seek * 0.28} ${seekY + seek / 2} L ${seekL + seek * 0.62} ${seekY + seek * 0.68}`],
    [seekR, `M ${seekR + seek * 0.38} ${seekY + seek * 0.32} L ${seekR + seek * 0.72} ${seekY + seek / 2} L ${seekR + seek * 0.38} ${seekY + seek * 0.68}`],
  ] as const) {
    group.add(
      app.roundedRect({
        x: sx,
        y: seekY,
        width: seek,
        height: seek,
        cornerRadius: 6,
        fill: '#1f2937',
        stroke: theme.dialStroke,
        strokeWidth: 1,
        listening: false,
      }),
      app.path({
        d: path,
        stroke: theme.textMuted,
        strokeWidth: 1.8,
        lineCap: 'round',
        lineJoin: 'round',
        listening: false,
      })
    );
  }

  const dialX = pad + w / 2;
  const freqSize = fluidFont(compact ? 22 : 28, bounds, 18, 32);
  const freqY = displayY + displayH * 0.24;
  group.add(
    app.text({
      text: freq,
      x: dialX,
      y: textAt(freqY, freqSize),
      fontSize: freqSize,
      fontWeight: 'bold',
      fill: theme.text,
      textAlign: 'center',
      listening: false,
    }),
    app.text({
      text: band,
      x: pad + w - 20,
      y: textAt(displayY + 10, 8),
      fontSize: 8,
      fontWeight: 'bold',
      fill: theme.accent,
      listening: false,
    })
  );

  const nameSize = fluidFont(9, bounds, 7, 10);
  const nameFit = fitFontSizeToWidth(stationName, w - seek * 2 - 24, nameSize, 7);
  group.add(
    app.text({
      text: stationName,
      x: dialX,
      y: textAt(displayY + displayH * 0.54, nameFit.fontSize),
      fontSize: nameFit.fontSize,
      fontWeight: 'bold',
      fill: theme.textMuted,
      textAlign: 'center',
      listening: false,
    })
  );

  const scaleY = displayY + displayH - 6;
  const scaleW = w - 24;
  const scaleX = pad + 12;
  group.add(
    app.line({
      x: scaleX,
      y: scaleY,
      x2: scaleW,
      y2: 0,
      stroke: '#334155',
      strokeWidth: 1,
      listening: false,
    })
  );
  for (let i = 0; i <= 10; i++) {
    const tx = scaleX + (scaleW * i) / 10;
    const tall = i % 5 === 0;
    group.add(
      app.line({
        x: tx,
        y: scaleY,
        x2: 0,
        y2: tall ? -4 : -2,
        stroke: i === 6 ? theme.accent : '#475569',
        strokeWidth: tall ? 1.2 : 0.8,
        listening: false,
      })
    );
  }

  const rdsSize = fluidFont(8, bounds, 6, 9);
  const rdsText = rds.length > 34 ? `${rds.slice(0, 33)}…` : rds;
  group.add(
    app.text({
      text: rdsText,
      x: pad + 4,
      y: textAt(displayY + displayH + 8, rdsSize),
      fontSize: rdsSize,
      fill: theme.textMuted,
      listening: false,
    })
  );

  const pGap = 4;
  const pW = (w - pGap * (presets.length - 1)) / presets.length;
  presets.forEach((p, i) => {
    const active = p === freq;
    const px = pad + i * (pW + pGap);
    group.add(
      app.roundedRect({
        x: px,
        y: presetY,
        width: pW,
        height: presetH,
        cornerRadius: 5,
        fill: active ? theme.accent : '#1f2937',
        stroke: active ? theme.accent : theme.dialStroke,
        strokeWidth: 1,
        listening: false,
      }),
      app.text({
        text: p,
        x: px + pW / 2,
        y: textAt(presetY + presetH / 2, Math.max(8, Math.min(10, pW * 0.28))),
        fontSize: Math.max(8, Math.min(10, pW * 0.28)),
        fontWeight: active ? 'bold' : 'normal',
        fill: active ? '#fff' : theme.textMuted,
        textAlign: 'center',
        listening: false,
      })
    );
  });

  group.metadata.refresh = (nextFreq: number | string) => {
    setState(group, { frequency: String(nextFreq) });
  };
  group.metadata.textRefresh = (name: string) => setState(group, { stationName: name });

  return finishPanel(group, props, bounds, {
    station,
    band,
    frequency: freq,
    stationName,
    rds,
    stereo,
    presets,
  });
});

registerAutomotive('podcastPlayer', (props, app) => {
  const theme = panelTheme(props);
  const bounds = panelBounds(props, 240, 130);
  const group = panelGroup(app, 'podcastPlayer', props, bounds);
  const { pad, innerWidth: w, innerHeight: h } = bounds;
  const episode = str(props, 'episode', lines(props, ['Episode 12'])[0] ?? 'Episode 12');
  const show = str(props, 'show', 'Tech Drive Podcast');
  const progress = num(props, 'progress', 0.58);
  addPanelFrame(group, app, bounds, theme);
  const top = addPanelTitle(group, app, bounds, theme, 'Podcast');
  addMediaArtAndMeta(group, app, bounds, theme, top, show, episode, '#ea580c');
  group.add(
    app.text({
      text: '1.2×',
      x: pad + w - 28,
      y: textAt(top + 4, 9),
      fontSize: 9,
      fontWeight: 'bold',
      fill: theme.accent,
      listening: false,
    })
  );
  const barY = pad + h - 44;
  addProgressBar(group, app, pad, barY, w, 5, progress, theme);
  addTransportRow(group, app, pad + w / 2, barY + 10, w, pad + h - barY - 12, theme);
  return finishPanel(group, props, bounds, { episode, show, progress });
});

registerAutomotive('notificationCenter', (props, app) => {
  const theme = panelTheme(props);
  const bounds = panelBounds(props, 220, 140);
  const group = panelGroup(app, 'notificationCenter', props, bounds);
  const { pad, innerWidth: w, innerHeight: h } = bounds;
  const items = (props.notifications as Array<{ icon: string; text: string; time?: string }>) ?? [
    { icon: '⚠', text: 'Tire pressure low — FL', time: '2m' },
    { icon: '♪', text: 'Bluetooth connected', time: '8m' },
    { icon: '☁', text: 'Weather alert nearby', time: '15m' },
  ];
  addPanelFrame(group, app, bounds, theme);
  const startY = addPanelTitle(group, app, bounds, theme, `Notifications (${items.length})`);
  const rowH = Math.max(28, (pad + h - startY - 4) / Math.min(3, items.length) - 4);
  items.slice(0, 3).forEach((item, i) => {
    addListRow(group, app, pad, startY + i * (rowH + 4), w, rowH, item.icon, item.text, item.time, theme, i === 0);
  });
  return finishPanel(group, props, bounds, { notifications: items });
});

registerAutomotive('rearViewCamera', (props, app) => {
  const theme = panelTheme(props);
  const bounds = panelBounds(props, 220, 140);
  const group = panelGroup(app, 'rearViewCamera', props, bounds);
  const { pad, innerWidth: w, innerHeight: h } = bounds;
  addPanelFrame(group, app, bounds, theme);
  const viewY = addPanelTitle(group, app, bounds, theme, 'Rear Camera');
  const viewH = pad + h - viewY - 4;

  group.add(
    app.roundedRect({
      x: pad,
      y: viewY,
      width: w,
      height: viewH,
      cornerRadius: 8,
      fill: '#020617',
      stroke: theme.ok,
      strokeWidth: 1.5,
      listening: false,
    })
  );

  const cx = pad + w / 2;
  const cy = viewY + viewH / 2 - 6;
  const camR = Math.max(18, Math.min(w, viewH) * 0.14);
  group.add(
    app.circle({
      x: cx - camR,
      y: cy - camR,
      radius: camR,
      fill: '#1e293b',
      stroke: theme.textMuted,
      strokeWidth: 1.5,
      listening: false,
    }),
    app.roundedRect({
      x: cx - camR * 0.55,
      y: cy - camR * 0.35,
      width: camR * 1.1,
      height: camR * 0.7,
      cornerRadius: 4,
      fill: '#334155',
      listening: false,
    }),
    app.circle({
      x: cx - camR * 0.2,
      y: cy - camR * 0.05,
      radius: camR * 0.22,
      fill: theme.accent,
      opacity: 0.8,
      listening: false,
    })
  );

  const bx = pad + w * 0.18;
  const by = viewY + viewH * 0.72;
  group.add(
    app.path({
      d: `M ${bx} ${viewY + viewH - 8} L ${cx - 18} ${by} L ${cx + 18} ${by} L ${pad + w * 0.82} ${viewY + viewH - 8}`,
      stroke: theme.ok,
      strokeWidth: 2,
      listening: false,
    })
  );
  group.add(
    app.text({
      text: 'REVERSE',
      x: pad + w / 2,
      y: textAt(viewY + viewH - 10, 8),
      fontSize: 8,
      fontWeight: 'bold',
      fill: theme.ok,
      textAlign: 'center',
      listening: false,
    })
  );
  return finishPanel(group, props, bounds, { active: bool(props, 'active', true) });
});

registerAutomotive('sunriseSunset', (props, app) => {
  const theme = panelTheme(props);
  const bounds = panelBounds(props, 180, 100);
  const group = panelGroup(app, 'sunriseSunset', props, bounds);
  const { pad, innerWidth: w, innerHeight: h } = bounds;
  const rowLines = lines(props, ['Rise 06:12', 'Set 19:45']);
  const sunrise = str(props, 'sunrise', rowLines[0]?.replace(/^Rise\s*/, '') ?? '06:12');
  const sunset = str(props, 'sunset', rowLines[1]?.replace(/^Set\s*/, '') ?? '19:45');
  addPanelFrame(group, app, bounds, theme);
  const top = addPanelTitle(group, app, bounds, theme, 'Sun');

  const horizonY = top + (pad + h - top) * 0.42;
  group.add(
    app.line({
      x: pad + 6,
      y: horizonY,
      x2: w - 12,
      y2: 0,
      stroke: theme.dialStroke,
      strokeWidth: 1,
      listening: false,
    }),
    app.path({
      d: `M ${pad + 6} ${horizonY} Q ${pad + w / 2} ${top + 8} ${pad + w - 6} ${horizonY}`,
      stroke: 'rgba(251,191,36,0.25)',
      strokeWidth: 1,
      listening: false,
    })
  );
  const sunX = pad + w * 0.68;
  group.add(
    app.circle({
      x: sunX - 9,
      y: horizonY - 18,
      radius: 9,
      fill: '#fbbf24',
      opacity: 0.95,
      listening: false,
    })
  );
  group.add(
    app.text({
      text: `↑ ${sunrise}`,
      x: pad + 4,
      y: textAt(pad + h - 10, 10),
      fontSize: fluidFont(10, bounds, 8, 11),
      fill: theme.text,
      listening: false,
    }),
    app.text({
      text: `↓ ${sunset}`,
      x: pad + w - 48,
      y: textAt(pad + h - 10, 10),
      fontSize: fluidFont(10, bounds, 8, 11),
      fill: theme.textMuted,
      listening: false,
    })
  );
  return finishPanel(group, props, bounds, { sunrise, sunset });
});
