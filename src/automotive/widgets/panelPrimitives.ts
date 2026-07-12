import type { App } from '../../App';
import type { Group } from '../../shapes/Group';
import type { Node } from '../../Node';
import { TextNode } from '../../shapes/index';
import { createAutoGroup, setState, str } from '../helpers';
import { themeFromProps, type ThemePalette } from '../themes';
import type { WidgetBounds } from '../layout';
import {
  autoCenteredText,
  fitFontSizeToWidth,
  fluidFont,
  resolveBounds,
  textYForBaseline,
} from '../layout';

export type PanelApp = App;

export function panelTheme(props: Record<string, unknown>): ThemePalette {
  return themeFromProps(props);
}

export function panelBounds(props: Record<string, unknown>, dw = 220, dh = 130): WidgetBounds {
  return resolveBounds(props, dw, dh);
}

export function panelGroup(
  app: App,
  type: string,
  props: Record<string, unknown>,
  bounds: WidgetBounds
): Group {
  return createAutoGroup(app, type, { ...props, width: bounds.width, height: bounds.height }, type) as Group;
}

export function addPanelFrame(
  group: Group,
  app: App,
  bounds: WidgetBounds,
  theme: ThemePalette,
  compact = false
): void {
  const { pad, innerWidth: w, innerHeight: h } = bounds;
  group.add(
    app.roundedRect({
      x: pad,
      y: pad,
      width: w,
      height: h,
      cornerRadius: Math.min(10, h * 0.1),
      fill: '#111827',
      stroke: theme.dialStroke,
      strokeWidth: compact ? 1 : 1.5,
      listening: false,
    })
  );
}

/** Absolute Y for text anchor (middle baseline). */
export function textAt(anchorY: number, fontSize: number): number {
  return textYForBaseline(anchorY, fontSize);
}

export function addPanelTitle(
  group: Group,
  app: App,
  bounds: WidgetBounds,
  theme: ThemePalette,
  title: string
): number {
  const { pad } = bounds;
  const size = fluidFont(8, bounds, 6, 9);
  const ty = pad + (bounds.innerHeight < 72 ? 8 : 10);
  group.add(
    app.text({
      text: title.toUpperCase(),
      x: pad + 2,
      y: textAt(ty, size),
      fontSize: size,
      fontWeight: 'bold',
      fill: theme.textMuted,
      textAlign: 'left',
      listening: false,
    })
  );
  return ty + size + 6;
}

export function addProgressBar(
  group: Group,
  app: App,
  x: number,
  y: number,
  w: number,
  h: number,
  progress: number,
  theme: ThemePalette
): void {
  const p = Math.max(0, Math.min(1, progress));
  group.add(
    app.roundedRect({
      x,
      y,
      width: w,
      height: h,
      cornerRadius: h / 2,
      fill: '#1f2937',
      listening: false,
    }),
    app.roundedRect({
      x,
      y,
      width: Math.max(h, w * p),
      height: h,
      cornerRadius: h / 2,
      fill: theme.accent,
      listening: false,
    })
  );
}

export function addIconTile(
  group: Group,
  app: App,
  x: number,
  y: number,
  size: number,
  icon: string,
  active: boolean,
  theme: ThemePalette,
  label?: string
): void {
  group.add(
    app.roundedRect({
      x,
      y,
      width: size,
      height: size,
      cornerRadius: Math.min(8, size * 0.22),
      fill: active ? theme.accent : '#1f2937',
      stroke: active ? theme.accent : theme.dialStroke,
      strokeWidth: 1,
      listening: false,
    })
  );
  const iconSize = Math.max(7, Math.floor(size * (label ? 0.28 : 0.36)));
  const iconY = label ? size * 0.32 : size * 0.5;
  group.add(
    autoCenteredText(app, icon, size, iconY, {
      fontSize: iconSize,
      fontWeight: 'bold',
      fill: active ? '#fff' : theme.textMuted,
      insetX: x,
      insetY: y,
    })
  );
  if (label) {
    const labelSize = Math.max(5, Math.floor(size * 0.16));
    group.add(
      autoCenteredText(app, label, size, size * 0.76, {
        fontSize: labelSize,
        fill: active ? '#dbeafe' : theme.textMuted,
        insetX: x,
        insetY: y,
      })
    );
  }
}

function addSkipPrev(group: Group, app: App, x: number, y: number, size: number, theme: ThemePalette): void {
  group.add(
    app.roundedRect({
      x,
      y,
      width: size,
      height: size,
      cornerRadius: Math.min(8, size * 0.22),
      fill: '#1f2937',
      stroke: theme.dialStroke,
      strokeWidth: 1,
      listening: false,
    }),
    app.path({
      d: `M ${x + size * 0.28} ${y + size * 0.35} L ${x + size * 0.18} ${y + size * 0.5} L ${x + size * 0.28} ${y + size * 0.65}`,
      stroke: theme.text,
      strokeWidth: 1.5,
      lineCap: 'round',
      lineJoin: 'round',
      listening: false,
    }),
    app.path({
      d: `M ${x + size * 0.42} ${y + size * 0.35} L ${x + size * 0.32} ${y + size * 0.5} L ${x + size * 0.42} ${y + size * 0.65}`,
      stroke: theme.text,
      strokeWidth: 1.5,
      lineCap: 'round',
      lineJoin: 'round',
      listening: false,
    })
  );
}

function addSkipNext(group: Group, app: App, x: number, y: number, size: number, theme: ThemePalette): void {
  group.add(
    app.roundedRect({
      x,
      y,
      width: size,
      height: size,
      cornerRadius: Math.min(8, size * 0.22),
      fill: '#1f2937',
      stroke: theme.dialStroke,
      strokeWidth: 1,
      listening: false,
    }),
    app.path({
      d: `M ${x + size * 0.58} ${y + size * 0.35} L ${x + size * 0.68} ${y + size * 0.5} L ${x + size * 0.58} ${y + size * 0.65}`,
      stroke: theme.text,
      strokeWidth: 1.5,
      lineCap: 'round',
      lineJoin: 'round',
      listening: false,
    }),
    app.path({
      d: `M ${x + size * 0.72} ${y + size * 0.35} L ${x + size * 0.82} ${y + size * 0.5} L ${x + size * 0.72} ${y + size * 0.65}`,
      stroke: theme.text,
      strokeWidth: 1.5,
      lineCap: 'round',
      lineJoin: 'round',
      listening: false,
    })
  );
}

export function addTransportRow(
  group: Group,
  app: App,
  cx: number,
  y: number,
  w: number,
  h: number,
  theme: ThemePalette,
  playing = true
): void {
  const btn = Math.max(22, Math.min(h - 2, w * 0.14));
  const gap = Math.max(10, w * 0.06);
  const playSize = Math.min(Math.max(btn, 28), h, w * 0.18);
  const left = cx - playSize / 2 - gap - btn;
  const btnY = y + (h - btn) / 2;
  const playX = cx - playSize / 2;
  const playY = y + (h - playSize) / 2;

  addSkipPrev(group, app, left, btnY, btn, theme);
  group.add(
    app.circle({
      x: playX,
      y: playY,
      radius: playSize / 2,
      fill: theme.accent,
      listening: false,
    })
  );
  if (playing) {
    const barW = Math.max(2, playSize * 0.1);
    const barH = playSize * 0.28;
    const mid = playX + playSize / 2;
    const midY = playY + playSize / 2;
    group.add(
      app.roundedRect({
        x: mid - barW - 2,
        y: midY - barH / 2,
        width: barW,
        height: barH,
        cornerRadius: 1,
        fill: '#fff',
        listening: false,
      }),
      app.roundedRect({
        x: mid + 2,
        y: midY - barH / 2,
        width: barW,
        height: barH,
        cornerRadius: 1,
        fill: '#fff',
        listening: false,
      })
    );
  } else {
    group.add(
      app.path({
        d: `M ${playX + playSize * 0.38} ${playY + playSize * 0.3} L ${playX + playSize * 0.38} ${playY + playSize * 0.7} L ${playX + playSize * 0.68} ${playY + playSize * 0.5} Z`,
        fill: '#fff',
        listening: false,
      })
    );
  }
  addSkipNext(group, app, cx + playSize / 2 + gap, btnY, btn, theme);
}

export function addAlbumPlaceholder(
  group: Group,
  app: App,
  x: number,
  y: number,
  size: number,
  accent = '#6366f1'
): void {
  group.add(
    app.roundedRect({
      x,
      y,
      width: size,
      height: size,
      cornerRadius: Math.min(10, size * 0.1),
      fill: accent,
      stroke: 'rgba(255,255,255,0.12)',
      strokeWidth: 1,
      listening: false,
    })
  );
  const note = Math.max(10, size * 0.28);
  group.add(
    autoCenteredText(app, '♪', size, size / 2, {
      fontSize: note,
      fontWeight: 'bold',
      fill: 'rgba(255,255,255,0.9)',
      insetX: x,
      insetY: y,
    })
  );
}

export function addMediaArtAndMeta(
  group: Group,
  app: App,
  bounds: WidgetBounds,
  theme: ThemePalette,
  top: number,
  title: string,
  artist: string,
  accent: string
): { artSize: number; bottom: number } {
  const { pad, innerWidth: w, innerHeight: h } = bounds;
  const art = Math.max(40, Math.min(w * 0.32, h * 0.48, 72));
  addAlbumPlaceholder(group, app, pad, top, art, accent);
  const tx = pad + art + 10;
  const tw = w - art - 14;
  const titleSize = fluidFont(12, bounds, 9, 14);
  const titleFit = fitFontSizeToWidth(title, tw, titleSize, 8);
  group.add(
    app.text({
      text: title,
      x: tx,
      y: textAt(top + 4, titleFit.fontSize),
      fontSize: titleFit.fontSize,
      fontWeight: 'bold',
      fill: theme.text,
      textAlign: 'left',
      listening: false,
    })
  );
  const subSize = fluidFont(9, bounds, 7, 10);
  group.add(
    app.text({
      text: artist,
      x: tx,
      y: textAt(top + titleFit.fontSize + 8, subSize),
      fontSize: subSize,
      fill: theme.textMuted,
      textAlign: 'left',
      listening: false,
    })
  );
  return { artSize: art, bottom: top + art };
}

export function addListRow(
  group: Group,
  app: App,
  x: number,
  y: number,
  w: number,
  h: number,
  icon: string,
  text: string,
  meta: string | undefined,
  theme: ThemePalette,
  accent = false
): void {
  group.add(
    app.roundedRect({
      x,
      y,
      width: w,
      height: h,
      cornerRadius: 6,
      fill: '#1a2332',
      listening: false,
    })
  );
  const iconBox = Math.max(18, h - 8);
  addIconTile(group, app, x + 4, y + (h - iconBox) / 2, iconBox, icon, accent, theme);
  const textX = x + iconBox + 10;
  const textW = w - iconBox - (meta ? 30 : 14);
  const row = fitLabel(app, text, textX, y + h * 0.28, textW, 9, theme, accent);
  if (accent) row.fill = theme.warning;
  group.add(row);
  if (meta) {
    group.add(
      app.text({
        text: meta,
        x: x + w - 26,
        y: textAt(y + h * 0.62, 8),
        fontSize: 8,
        fill: theme.textMuted,
        textAlign: 'left',
        listening: false,
      })
    );
  }
}

export function lonLatToTile(lon: number, lat: number, zoom: number): { x: number; y: number } {
  const n = 2 ** zoom;
  const x = Math.floor(((lon + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return { x, y };
}

export function osmTileUrl(zoom: number, x: number, y: number): string {
  return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
}

export function addOsmMapLayer(
  group: Group,
  app: App,
  x: number,
  y: number,
  w: number,
  h: number,
  theme: ThemePalette,
  options: {
    lat?: number;
    lon?: number;
    zoom?: number;
    route?: boolean;
    marker?: boolean;
    useTile?: boolean;
  } = {}
): void {
  const lat = options.lat ?? 51.505;
  const lon = options.lon ?? -0.09;
  const zoom = options.zoom ?? 14;
  group.add(
    app.roundedRect({
      x,
      y,
      width: w,
      height: h,
      cornerRadius: Math.min(8, h * 0.12),
      fill: '#16231b',
      stroke: theme.dialStroke,
      strokeWidth: 1,
      listening: false,
    })
  );

  group.add(
    app.roundedRect({
      x: x + w * 0.06,
      y: y + h * 0.1,
      width: w * 0.24,
      height: h * 0.22,
      cornerRadius: 3,
      fill: '#1f3d2e',
      listening: false,
    }),
    app.roundedRect({
      x: x + w * 0.66,
      y: y + h * 0.55,
      width: w * 0.26,
      height: h * 0.2,
      cornerRadius: 3,
      fill: '#1a3350',
      listening: false,
    })
  );

  const roads: Array<{ d: string; w: number; c: string }> = [
    { d: `M ${x + 6} ${y + h * 0.52} L ${x + w - 6} ${y + h * 0.46}`, w: 3, c: '#5c6b7a' },
    { d: `M ${x + w * 0.22} ${y + 6} L ${x + w * 0.3} ${y + h - 6}`, w: 2, c: '#4a5568' },
    { d: `M ${x + w * 0.64} ${y + 6} L ${x + w * 0.56} ${y + h - 6}`, w: 2, c: '#4a5568' },
    { d: `M ${x + 6} ${y + h * 0.26} L ${x + w - 6} ${y + h * 0.3}`, w: 1.5, c: '#3d4a57' },
  ];
  for (const r of roads) {
    group.add(
      app.path({
        d: r.d,
        stroke: r.c,
        strokeWidth: r.w,
        lineCap: 'round',
        listening: false,
      })
    );
  }

  if (options.route !== false) {
    const routeD = `M ${x + w * 0.14} ${y + h * 0.76} Q ${x + w * 0.44} ${y + h * 0.34} ${x + w * 0.84} ${y + h * 0.2}`;
    group.add(
      app.path({
        d: routeD,
        stroke: 'rgba(37,99,235,0.35)',
        strokeWidth: Math.max(5, w * 0.028),
        lineCap: 'round',
        listening: false,
      }),
      app.path({
        d: routeD,
        stroke: theme.accent,
        strokeWidth: Math.max(2.5, w * 0.014),
        lineCap: 'round',
        listening: false,
      })
    );
  }

  if (options.marker !== false) {
    const mx = x + w * 0.74;
    const my = y + h * 0.24;
    group.add(
      app.circle({
        x: mx - 5,
        y: my - 5,
        radius: 5,
        fill: theme.accent,
        stroke: '#fff',
        strokeWidth: 1.5,
        listening: false,
      })
    );
  }

  if (options.useTile !== false && w >= 48 && h >= 36) {
    const tile = lonLatToTile(lon, lat, zoom);
    const img = app.image({
      x,
      y,
      width: w,
      height: h,
      src: osmTileUrl(zoom, tile.x, tile.y),
      opacity: 0.5,
      listening: false,
    });
    group.add(img);
    img.load().then(() => app.requestRender()).catch(() => undefined);
  }

  group.add(
    app.text({
      text: '© OSM',
      x: x + w - 28,
      y: y + h - 11,
      fontSize: 7,
      fill: 'rgba(255,255,255,0.5)',
      listening: false,
    })
  );
}

export function addCompassRose(
  group: Group,
  app: App,
  cx: number,
  cy: number,
  radius: number,
  heading: number,
  theme: ThemePalette
): void {
  group.add(
    app.circle({
      x: cx - radius,
      y: cy - radius,
      radius,
      fill: '#0f172a',
      stroke: theme.dialStroke,
      strokeWidth: 1.5,
      listening: false,
    })
  );

  for (let deg = 0; deg < 360; deg += 30) {
    const rad = ((deg - 90) * Math.PI) / 180;
    const inner = radius * (deg % 90 === 0 ? 0.78 : 0.86);
    const outer = radius * 0.94;
    const ix = Math.cos(rad) * inner;
    const iy = Math.sin(rad) * inner;
    const ox = Math.cos(rad) * outer;
    const oy = Math.sin(rad) * outer;
    group.add(
      app.line({
        x: cx + ix,
        y: cy + iy,
        x2: ox - ix,
        y2: oy - iy,
        stroke: '#334155',
        strokeWidth: deg % 90 === 0 ? 1.5 : 0.8,
        listening: false,
      })
    );
  }

  const labels = [
    { t: 'N', deg: 0, c: theme.warning },
    { t: 'E', deg: 90, c: theme.textMuted },
    { t: 'S', deg: 180, c: theme.textMuted },
    { t: 'W', deg: 270, c: theme.textMuted },
  ];
  const labelSize = Math.max(7, radius * 0.2);
  for (const { t, deg, c } of labels) {
    const rad = ((deg - 90) * Math.PI) / 180;
    const lx = cx + Math.cos(rad) * (radius * 0.68);
    const ly = cy + Math.sin(rad) * (radius * 0.68);
    group.add(
      app.text({
        text: t,
        x: lx,
        y: textAt(ly, labelSize),
        fontSize: labelSize,
        fontWeight: t === 'N' ? 'bold' : 'normal',
        fill: c,
        textAlign: 'center',
        listening: false,
      })
    );
  }

  const needleLen = radius * 0.58;
  const rad = ((heading - 90) * Math.PI) / 180;
  group.add(
    app.line({
      x: cx,
      y: cy,
      x2: Math.cos(rad) * needleLen,
      y2: Math.sin(rad) * needleLen,
      stroke: theme.accent,
      strokeWidth: Math.max(2.5, radius * 0.09),
      lineCap: 'round',
      listening: false,
    })
  );
  group.add(
    app.circle({
      x: cx - 3,
      y: cy - 3,
      radius: 3,
      fill: theme.text,
      listening: false,
    })
  );
}

export function finishPanel(
  group: Group,
  props: Record<string, unknown>,
  bounds: WidgetBounds,
  extra: Record<string, unknown> = {}
): Node {
  setState(group, { ...props, ...extra, width: bounds.width, height: bounds.height });
  return group;
}

export function fitLabel(
  app: App,
  text: string,
  x: number,
  y: number,
  maxW: number,
  maxSize: number,
  theme: ThemePalette,
  bold = false
): TextNode {
  const fit = fitFontSizeToWidth(text, maxW, maxSize, 7);
  return app.text({
    text,
    x: x + fit.x,
    y: textAt(y, fit.fontSize),
    fontSize: fit.fontSize,
    fontWeight: bold ? 'bold' : 'normal',
    fill: theme.text,
    textAlign: 'left',
    listening: false,
  });
}

export function addTurnArrow(
  group: Group,
  app: App,
  x: number,
  y: number,
  size: number,
  theme: ThemePalette
): void {
  group.add(
    app.roundedRect({
      x,
      y,
      width: size,
      height: size,
      cornerRadius: 8,
      fill: theme.accent,
      listening: false,
    }),
    app.path({
      d: `M ${x + size * 0.28} ${y + size * 0.32} L ${x + size * 0.62} ${y + size * 0.5} L ${x + size * 0.28} ${y + size * 0.68} M ${x + size * 0.62} ${y + size * 0.5} L ${x + size * 0.62} ${y + size * 0.32} L ${x + size * 0.78} ${y + size * 0.5} L ${x + size * 0.62} ${y + size * 0.68}`,
      stroke: '#fff',
      strokeWidth: 2.2,
      lineCap: 'round',
      lineJoin: 'round',
      listening: false,
    })
  );
}
