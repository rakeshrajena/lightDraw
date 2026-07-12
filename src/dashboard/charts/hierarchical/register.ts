import { attachRegionsHover, attachPolarSliceHover, attachIndexXHover, attachNearestHover } from '../core/interaction';
import { registerDashboard } from '../../registryCore';
import { createWidgetGroup, num, setState } from '../../helpers';
import { getActiveDashboard } from '../../theme';
import { squarify, flattenHierarchy } from '../core/treemap';
import type { HierarchyNode } from '../types';
import { Arc } from '../../../shapes/index';

const SAMPLE_TREE: HierarchyNode = {
  name: 'root',
  children: [
    { name: 'A', value: 40 },
    { name: 'B', value: 30 },
    { name: 'C', value: 20 },
    { name: 'D', value: 10 },
  ],
};

registerDashboard('treemap', (props, app) => {
  const width = num(props, 'width', 300);
  const height = num(props, 'height', 200);
  const root = (props.data as HierarchyNode) ?? SAMPLE_TREE;
  const nodes = root.children ?? [root];
  const group = createWidgetGroup(app, 'treemap', props);
  const rects = squarify(nodes, 0, 0, width, height);
  const regions = rects.map((r) => ({
    x: r.x,
    y: r.y,
    width: r.width - 1,
    height: r.height - 1,
    label: `${r.name}: ${r.value ?? ''}`,
    payload: { name: r.name, value: r.value },
  }));
  rects.forEach((r, i) => {
    group.add(
      app.rect({
        x: r.x,
        y: r.y,
        width: r.width - 1,
        height: r.height - 1,
        fill: getActiveDashboard().series[i % getActiveDashboard().series.length],
        stroke: getActiveDashboard().pieStroke,
        strokeWidth: 1,
        listening: false,
      }),
      app.text({
        text: r.name,
        x: r.x + 4,
        y: r.y + 4,
        fontSize: 10,
        fill: getActiveDashboard().text,
        listening: false,
      })
    );
  });
  attachRegionsHover(app, group, props, width, height, regions);
  setState(group, { width, height, data: root });
  return group;
});

registerDashboard('sunburstChart', (props, app) => {
  const size = num(props, 'size', 200);
  const root = (props.data as HierarchyNode) ?? SAMPLE_TREE;
  const group = createWidgetGroup(app, 'sunburstChart', props);
  const cx = size / 2;
  const children = root.children ?? [root];
  const total = children.reduce((a, c) => a + (c.value ?? 1), 0);
  let angle = -Math.PI / 2;
  children.forEach((c, i) => {
    const sweep = ((c.value ?? 1) / total) * Math.PI * 2;
    group.add(
      new Arc({
        x: cx - size / 2 + 10,
        y: cx - size / 2 + 10,
        innerRadius: size * 0.2,
        radius: size / 2 - 10,
        startAngle: angle,
        endAngle: angle + sweep,
        fill: getActiveDashboard().series[i % getActiveDashboard().series.length],
        stroke: getActiveDashboard().pieStroke,
        strokeWidth: 1,
        listening: false,
      })
    );
    angle += sweep;
  });
  const sliceData = children.map((c) => c.value ?? 1);
  attachPolarSliceHover(
    app,
    group,
    props,
    size,
    sliceData,
    children.map((c) => `${c.name}: ${c.value ?? 1}`)
  );
  setState(group, { size, data: root });
  return group;
});

registerDashboard('treeChart', (props, app) => {
  const width = num(props, 'width', 300);
  const height = num(props, 'height', 200);
  const root = (props.data as HierarchyNode) ?? {
    name: 'root',
    children: [
      { name: 'A', children: [{ name: 'A1' }, { name: 'A2' }] },
      { name: 'B', children: [{ name: 'B1' }] },
    ],
  };
  const group = createWidgetGroup(app, 'treeChart', props);
  group.add(app.rect({ width, height, fill: getActiveDashboard().chartBg, listening: true }));
  const leaves = flattenHierarchy(root);
  leaves.forEach((n, i) => {
    const x = 20 + (i % 4) * 70;
    const y = 30 + Math.floor(i / 4) * 50;
    group.add(
      app.circle({ x: x - 8, y: y - 8, radius: 8, fill: getActiveDashboard().primary, listening: false }),
      app.text({ text: n.name, x: x + 12, y: y - 6, fontSize: 11, fill: getActiveDashboard().text, listening: false })
    );
  });
  attachNearestHover(
    app,
    group,
    props,
    { x: 0, y: 0, width, height },
    leaves.map((n, i) => {
      const x = 20 + (i % 4) * 70;
      const y = 30 + Math.floor(i / 4) * 50;
      return { x, y, label: n.name ?? 'node' };
    })
  );
  setState(group, { width, height, data: root });
  return group;
});

registerDashboard('dendrogramChart', (props, app) => {
  const width = num(props, 'width', 300);
  const height = num(props, 'height', 200);
  const group = createWidgetGroup(app, 'dendrogramChart', props);
  group.add(app.rect({ width, height, fill: getActiveDashboard().chartBg, listening: true }));
  const nodes = ['A', 'B', 'C', 'D', 'E'];
  const step = width / nodes.length;
  nodes.forEach((n, i) => {
    const x = step * i + step / 2;
    group.add(
      app.line({ x, y: height - 30, x2: 0, y2: -80, stroke: getActiveDashboard().chartGrid, strokeWidth: 1, listening: false }),
      app.text({ text: n, x: x - 6, y: height - 12, fontSize: 10, fill: getActiveDashboard().text, listening: false })
    );
  });
  group.add(app.line({ x: step / 2, y: height - 110, x2: width - step, y2: 0, stroke: getActiveDashboard().chartLine, strokeWidth: 2, listening: false }));
  attachIndexXHover(
    app,
    group,
    props,
    { plotX: 0, plotY: 0, plotWidth: width, plotHeight: height },
    nodes.length,
    (i) => nodes[i]
  );
  setState(group, { width, height });
  return group;
});
