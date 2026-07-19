/**
 * Automotive panel widgets — media.
 */
import { registerAutomotive } from '../../registryCore';
import { bool, num, setState, str } from '../../helpers';
import {
  addAlbumPlaceholder,
  addMediaArtAndMeta,
  addPanelFrame,
  addPanelTitle,
  addProgressBar,
  addTransportRow,
  finishPanel,
  panelBounds,
  panelGroup,
  panelTheme,
  textAt,
} from '../panelPrimitives';
import { fitFontSizeToWidth, fluidFont } from '../../layout';
import { lines } from './shared';

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
