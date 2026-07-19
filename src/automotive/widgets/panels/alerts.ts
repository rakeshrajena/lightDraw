/**
 * Automotive panel widgets — alerts.
 */
import { registerAutomotive } from '../../registryCore';
import {
  addListRow,
  addPanelFrame,
  addPanelTitle,
  finishPanel,
  panelBounds,
  panelGroup,
  panelTheme,
} from '../panelPrimitives';
import { lines } from './shared';

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
