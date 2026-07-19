/**
 * Automotive panel widgets — navigation.
 */
import { registerAutomotive } from '../../registryCore';
import { bool, num, setState, str } from '../../helpers';
import {
  addCompassRose,
  addOsmMapLayer,
  addPanelFrame,
  addPanelTitle,
  addTurnArrow,
  finishPanel,
  fitLabel,
  panelBounds,
  panelGroup,
  panelTheme,
  textAt,
} from '../panelPrimitives';
import { fluidFont } from '../../layout';
import { lines } from './shared';

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
