/**
 * Automotive panel widgets — camera.
 */
import { registerAutomotive } from '../../registryCore';
import { bool } from '../../helpers';
import {
  addPanelFrame,
  addPanelTitle,
  finishPanel,
  panelBounds,
  panelGroup,
  panelTheme,
  textAt,
} from '../panelPrimitives';

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
