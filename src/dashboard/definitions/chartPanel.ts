/**
 * Dashboard widget factories — chartPanel.
 */
import { registerDashboard, createDashboardFromJSON } from '../registryCore';
import {
  createWidgetGroup,
  num,
  setParts,
  setState,
  str,
} from '../helpers';
import { getActiveDashboard } from '../theme';

/** Framed chart with title bar — embed any registered chart type. */
registerDashboard('chartPanel', (props, app) => {
  const chartType = str(props, 'chartType', 'lineChart');
  const title = str(props, 'title', chartType);
  const width = num(props, 'width', 320);
  const height = num(props, 'height', 200);
  const pad = 8;
  const headerH = 26;
  const innerW = Math.max(40, width - pad * 2);
  const innerH = Math.max(32, height - headerH - pad);

  const group = createWidgetGroup(app, 'chartPanel', props);

  group.add(
    app.rect({
      width,
      height,
      fill: getActiveDashboard().chartBg,
      stroke: getActiveDashboard().panelStroke,
      strokeWidth: 1,
      cornerRadius: 8,
      listening: false,
    }),
    app.text({
      text: title,
      x: pad,
      y: 6,
      fontSize: 12,
      fontWeight: 'bold',
      fill: getActiveDashboard().text,
      listening: false,
    })
  );

  if (props.maximizable !== false) {
    group.add(
      app.text({
        text: '⤢',
        x: width - 22,
        y: 5,
        fontSize: 14,
        fill: getActiveDashboard().textMuted,
        listening: true,
        metadata: { chartPanelAction: 'maximize' },
      })
    );
  }

  const chartProps = { ...props };
  delete chartProps.chartType;
  delete chartProps.title;
  delete chartProps.width;
  delete chartProps.height;
  delete chartProps.maximizable;
  const chart = createDashboardFromJSON(
    chartType,
    {
      ...chartProps,
      width: innerW,
      height: innerH,
      x: pad,
      y: headerH,
      responsive: props.responsive !== false,
      zoomEnabled: props.zoomEnabled !== false,
    },
    app
  );

  if (chart) {
    chart.x = pad;
    chart.y = headerH;
    group.add(chart);
    setParts(group, { chart });
  }

  setState(group, { chartType, title, width, height, innerW, innerH });
  return group;
});
