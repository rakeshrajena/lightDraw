/**
 * Automotive panel widgets — ambient.
 */
import { registerAutomotive } from '../../registryCore';
import { str } from '../../helpers';
import {
  addPanelFrame,
  addPanelTitle,
  finishPanel,
  panelBounds,
  panelGroup,
  panelTheme,
  textAt,
} from '../panelPrimitives';
import { fluidFont } from '../../layout';
import { lines } from './shared';

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
