/**
 * Dashboard widget factories — calendar.
 */
import type { App } from '../../App';
import type { Group } from '../../shapes/Group';
import { registerDashboard } from '../registryCore';
import {
  createWidgetGroup,
  num,
  setState,
} from '../helpers';
import { getActiveDashboard } from '../theme';
import { installChartRebuild } from '../charts/core/refresh';

registerDashboard('calendar', (props, app) => {
  const group = createWidgetGroup(app, 'calendar', props);
  installChartRebuild(group, app, buildCalendar);
  return group;
});

function buildCalendar(group: Group, app: App, props: Record<string, unknown>): void {
  const width = num(props, 'width', 210);
  const height = num(props, 'height', 0);
  const year = num(props, 'year', new Date().getFullYear());
  const month = num(props, 'month', new Date().getMonth());
  const highlightDay = num(props, 'highlightDay', -1);
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = first.getDay();
  const numRows = Math.ceil((startDay + daysInMonth) / 7);
  const headerH = 36;
  const gridW = width - 8;
  const gridH = height > headerH ? height - headerH - 4 : numRows * 26;
  const cell = Math.max(14, Math.min(Math.floor(gridW / 7), Math.floor(gridH / numRows), 32));
  const contentH = headerH + numRows * cell;

  group.metadata.chartWidth = width;
  group.metadata.chartHeight = height > 0 ? height : contentH + 4;

  group.add(
    app.text({
      text: first.toLocaleString('default', { month: 'long', year: 'numeric' }),
      x: 4,
      y: 4,
      fontSize: Math.min(13, cell * 0.45),
      fontWeight: 'bold',
      fill: getActiveDashboard().text,
      listening: false,
    })
  );
  ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].forEach((d, i) => {
    group.add(
      app.text({
        text: d,
        x: i * cell + 4,
        y: 22,
        fontSize: Math.max(8, cell * 0.32),
        fill: getActiveDashboard().textDim,
        listening: false,
      })
    );
  });

  for (let day = 1; day <= daysInMonth; day++) {
    const cellIdx = startDay + day - 1;
    const col = cellIdx % 7;
    const row = Math.floor(cellIdx / 7);
    group.add(
      app.text({
        text: String(day),
        x: col * cell + Math.max(4, cell * 0.2),
        y: headerH + row * cell,
        fontSize: Math.max(9, cell * 0.38),
        fill: day === highlightDay ? getActiveDashboard().highlight : getActiveDashboard().text,
        listening: false,
      })
    );
  }
  setState(group, { width, height: height > 0 ? height : contentH + 4, year, month, highlightDay, cell });
}
