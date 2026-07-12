import { attachGridHover, attachNearestHover, attachValueHover } from '../core/interaction';
import { registerDashboard } from '../../registryCore';
import { createWidgetGroup, num, setState, str } from '../../helpers';
import { getActiveDashboard } from '../../theme';
import { sampleZGrid, surfaceMeshPath, wireframePaths } from '../core/projection3d';
import { layoutWordCloud } from '../core/wordLayout';
import type { WordItem } from '../types';

registerDashboard('surfaceChart3d', (props, app) => {
  const width = num(props, 'width', 300);
  const height = num(props, 'height', 200);
  const zGrid = (props.zGrid as number[][]) ?? sampleZGrid(8);
  const group = createWidgetGroup(app, 'surfaceChart3d', props);
  group.add(app.rect({ width, height, fill: getActiveDashboard().chartBg, listening: true }));
  const paths = surfaceMeshPath(zGrid, width / 2, height / 2 + 20, 6);
  paths.forEach((d, i) => {
    group.add(app.path({ d, fill: getActiveDashboard().series[i % getActiveDashboard().series.length], opacity: 0.6, stroke: getActiveDashboard().chartGrid, strokeWidth: 0.5, listening: false }));
  });
  attachGridHover(app, group, props, width, height, zGrid.length, zGrid[0]?.length ?? 1, (r, c) => String(zGrid[r]?.[c] ?? ''));
  setState(group, { width, height, zGrid });
  return group;
});

registerDashboard('wireframeChart3d', (props, app) => {
  const width = num(props, 'width', 300);
  const height = num(props, 'height', 200);
  const zGrid = (props.zGrid as number[][]) ?? sampleZGrid(8);
  const group = createWidgetGroup(app, 'wireframeChart3d', props);
  group.add(app.rect({ width, height, fill: getActiveDashboard().chartBg, listening: true }));
  wireframePaths(zGrid, width / 2, height / 2 + 20, 6).forEach((d) => {
    group.add(app.path({ d, fill: null, stroke: getActiveDashboard().chartLine, strokeWidth: 1, listening: false }));
  });
  attachGridHover(app, group, props, width, height, zGrid.length, zGrid[0]?.length ?? 1, (r, c) => String(zGrid[r]?.[c] ?? ''));
  setState(group, { width, height, zGrid });
  return group;
});

registerDashboard('meshChart3d', (props, app) => {
  const width = num(props, 'width', 300);
  const height = num(props, 'height', 200);
  const zGrid = (props.zGrid as number[][]) ?? sampleZGrid(6);
  const group = createWidgetGroup(app, 'meshChart3d', props);
  group.add(app.rect({ width, height, fill: getActiveDashboard().chartBg, listening: true }));
  surfaceMeshPath(zGrid, width / 2, height / 2 + 20, 8).forEach((d) => {
    group.add(app.path({ d, fill: getActiveDashboard().chartArea, stroke: getActiveDashboard().primary, strokeWidth: 1, listening: false }));
  });
  attachGridHover(app, group, props, width, height, zGrid.length, zGrid[0]?.length ?? 1, (r, c) => String(zGrid[r]?.[c] ?? ''));
  setState(group, { width, height, zGrid });
  return group;
});

registerDashboard('vectorFieldChart', (props, app) => {
  const width = num(props, 'width', 300);
  const height = num(props, 'height', 200);
  const group = createWidgetGroup(app, 'vectorFieldChart', props);
  group.add(app.rect({ width, height, fill: getActiveDashboard().chartBg, listening: true }));
  const cols = 8;
  const rows = 6;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const x = 20 + (j / (cols - 1)) * (width - 40);
      const y = 20 + (i / (rows - 1)) * (height - 40);
      const angle = Math.sin(j * 0.5) * Math.cos(i * 0.5);
      const len = 12;
      group.add(
        app.line({
          x,
          y,
          x2: len * Math.cos(angle),
          y2: len * Math.sin(angle),
          stroke: getActiveDashboard().chartLine,
          strokeWidth: 1.5,
          lineCap: 'round',
          listening: false,
        })
      );
    }
  }
  attachGridHover(app, group, props, width, height, rows, cols, () => 'flow');
  setState(group, { width, height });
  return group;
});

registerDashboard('pictogramChart', (props, app) => {
  const width = num(props, 'width', 200);
  const height = num(props, 'height', 120);
  const value = num(props, 'value', 12);
  const icon = str(props, 'icon', '●');
  const group = createWidgetGroup(app, 'pictogramChart', props);
  const cols = 6;
  for (let i = 0; i < value; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    group.add(
      app.text({
        text: icon,
        x: col * 28 + 4,
        y: row * 28 + 4,
        fontSize: 18,
        fill: getActiveDashboard().primary,
        listening: false,
      })
    );
  }
  attachValueHover(app, group, props, width, height, `count: ${value}`);
  setState(group, { width, height, value });
  return group;
});

registerDashboard('wordCloudChart', (props, app) => {
  const width = num(props, 'width', 320);
  const height = num(props, 'height', 200);
  const words = (props.words as WordItem[]) ?? [
    { text: 'data', value: 90 },
    { text: 'chart', value: 70 },
    { text: 'visual', value: 55 },
    { text: 'lightdraw', value: 80 },
    { text: 'canvas', value: 45 },
    { text: 'dashboard', value: 60 },
  ];
  const group = createWidgetGroup(app, 'wordCloudChart', props);
  group.add(app.rect({ width, height, fill: getActiveDashboard().chartBg, listening: true }));
  const placed = layoutWordCloud(words, width, height);
  placed.forEach((w, i) => {
    group.add(
      app.text({
        text: w.text,
        x: w.x,
        y: w.y,
        fontSize: w.fontSize,
        fontWeight: i < 3 ? '700' : '400',
        fill: getActiveDashboard().series[i % getActiveDashboard().series.length],
        listening: false,
      })
    );
  });
  attachNearestHover(
    app,
    group,
    props,
    { x: 0, y: 0, width, height },
    placed.map((w) => ({
      x: w.x + w.fontSize / 2,
      y: w.y + w.fontSize / 2,
      label: `${w.text} (${w.value ?? ''})`,
    }))
  );
  setState(group, { width, height, words });
  return group;
});
