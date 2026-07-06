import { attachBandYHover, attachPolarSliceHover, attachValueHover } from '../core/interaction';
import { registerDashboard } from '../../registryCore';
import { createWidgetGroup, clamp, num, setState } from '../../helpers';
import { DASHBOARD } from '../../theme';
import { createPieWidget, buildRadarChart } from './polarBase';

registerDashboard('pieChart', (props, app) => createPieWidget(app, 'pieChart', props, 0));
registerDashboard('doughnutChart', (props, app) => createPieWidget(app, 'doughnutChart', props));

registerDashboard('radarChart', (props, app) => {
  const group = createWidgetGroup(app, 'radarChart', props);
  buildRadarChart(group, app, props);
  return group;
});
registerDashboard('spiderChart', (props, app) => {
  const group = createWidgetGroup(app, 'spiderChart', props);
  buildRadarChart(group, app, props);
  return group;
});

registerDashboard('polarAreaChart', (props, app) => {
  const size = num(props, 'size', 200);
  const data = (props.data as number[]) ?? [3, 5, 4, 6, 2];
  const group = createWidgetGroup(app, 'polarAreaChart', props);
  const cx = size / 2;
  const max = Math.max(...data, 1);
  const n = data.length;
  let start = -Math.PI / 2;
  data.forEach((v, i) => {
    const sweep = (Math.PI * 2) / n;
    const r = (v / max) * (size / 2 - 16);
    const end = start + sweep;
    group.add(
      app.arc({
        x: cx - r,
        y: cx - r,
        radius: r,
        startAngle: start,
        endAngle: end,
        fill: DASHBOARD.series[i % DASHBOARD.series.length],
        stroke: DASHBOARD.pieStroke,
        strokeWidth: 1,
        listening: false,
      })
    );
    start = end;
  });
  attachPolarSliceHover(
    app,
    group,
    props,
    size,
    data,
    data.map((v, i) => `Cat ${i + 1}: ${v}`)
  );
  setState(group, { size, data });
  return group;
});

registerDashboard('bulletChart', (props, app) => {
  const width = num(props, 'width', 260);
  const height = num(props, 'height', 48);
  const value = clamp(num(props, 'value', 65), 0, 100);
  const target = num(props, 'target', 80);
  const max = num(props, 'max', 100);
  const group = createWidgetGroup(app, 'bulletChart', props);
  group.add(app.rect({ width, height: height * 0.5, y: height * 0.25, fill: DASHBOARD.meterTrack, listening: false }));
  group.add(
    app.rect({
      x: 0,
      y: height * 0.25,
      width: (width * value) / max,
      height: height * 0.5,
      fill: DASHBOARD.primary,
      listening: false,
    })
  );
  const tx = (width * target) / max;
  group.add(
    app.line({
      x: tx,
      y: height * 0.15,
      x2: 0,
      y2: height * 0.7,
      stroke: DASHBOARD.danger,
      strokeWidth: 3,
      listening: false,
    })
  );
  attachValueHover(app, group, props, width, height, `Value: ${value} / Target: ${target}`);
  setState(group, { width, height, value, target, max });
  return group;
});

registerDashboard('funnelChart', (props, app) => {
  const width = num(props, 'width', 200);
  const height = num(props, 'height', 220);
  const data = (props.data as number[]) ?? [100, 72, 48, 28, 12];
  const group = createWidgetGroup(app, 'funnelChart', props);
  const max = Math.max(...data, 1);
  const step = height / data.length;
  data.forEach((v, i) => {
    const w = (v / max) * width;
    const x = (width - w) / 2;
    group.add(
      app.polygon({
        points: [x, i * step, x + w, i * step, x + w * 0.92, (i + 1) * step, x + w * 0.08, (i + 1) * step],
        fill: DASHBOARD.series[i % DASHBOARD.series.length],
        stroke: DASHBOARD.pieStroke,
        strokeWidth: 1,
        listening: false,
      }),
      app.text({
        text: String(v),
        x: width / 2 - 12,
        y: i * step + step / 2 - 6,
        fontSize: 11,
        fill: DASHBOARD.text,
        listening: false,
      })
    );
  });
  attachBandYHover(app, group, props, width, height, data.length, (i) => String(data[i]));
  setState(group, { width, height, data });
  return group;
});

registerDashboard('pyramidChart', (props, app) => {
  const width = num(props, 'width', 200);
  const height = num(props, 'height', 200);
  const data = (props.data as number[]) ?? [10, 20, 35, 55, 80];
  const group = createWidgetGroup(app, 'pyramidChart', props);
  const max = Math.max(...data, 1);
  const step = height / data.length;
  data.forEach((v, i) => {
    const w = (v / max) * width;
    const x = (width - w) / 2;
    group.add(
      app.rect({
        x,
        y: i * step,
        width: w,
        height: step - 2,
        fill: DASHBOARD.series[i % DASHBOARD.series.length],
        listening: false,
      })
    );
  });
  attachBandYHover(app, group, props, width, height, data.length, (i) => String(data[i]));
  setState(group, { width, height, data });
  return group;
});

registerDashboard('coneChart', (props, app) => {
  const width = num(props, 'width', 160);
  const height = num(props, 'height', 200);
  const group = createWidgetGroup(app, 'coneChart', props);
  group.add(
    app.polygon({
      points: [width / 2, 0, width, height, 0, height],
      fill: DASHBOARD.primary,
      stroke: DASHBOARD.panelStroke,
      strokeWidth: 1,
      listening: false,
    })
  );
  attachValueHover(app, group, props, width, height, 'Cone chart');
  setState(group, { width, height });
  return group;
});
