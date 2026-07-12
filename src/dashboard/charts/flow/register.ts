import { attachRegionsHover, attachIndexXHover, attachPolarSliceHover } from '../core/interaction';
import { registerDashboard } from '../../registryCore';
import { createWidgetGroup, num, setState } from '../../helpers';
import { getActiveDashboard } from '../../theme';
import { layoutSankey, layoutChord } from '../core/sankey';
import { arcSectorPath } from '../../../renderers/arcSector';
import { layoutStreamgraph, streamTooltipLabel } from '../core/streamLayout';
import type { FlowLink, FlowNode } from '../types';

const SAMPLE_FLOW_NODES: FlowNode[] = [
  { id: 'a', label: 'Source' },
  { id: 'b', label: 'Process' },
  { id: 'c', label: 'Sink' },
];
const SAMPLE_FLOW_LINKS: FlowLink[] = [
  { source: 'a', target: 'b', value: 40 },
  { source: 'b', target: 'c', value: 35 },
];

registerDashboard('sankeyChart', (props, app) => {
  const width = num(props, 'width', 400);
  const height = num(props, 'height', 220);
  const nodes = (props.nodes as FlowNode[]) ?? SAMPLE_FLOW_NODES;
  const links = (props.links as FlowLink[]) ?? SAMPLE_FLOW_LINKS;
  const group = createWidgetGroup(app, 'sankeyChart', props);
  group.add(app.rect({ width, height, fill: getActiveDashboard().chartBg, listening: true }));
  const layout = layoutSankey(nodes, links, width, height);
  layout.links.forEach((l) => {
    group.add(app.path({ d: l.path, fill: null, stroke: getActiveDashboard().flowLink, strokeWidth: Math.max(2, l.value / 10), listening: false }));
  });
  layout.nodes.forEach((n) => {
    group.add(
      app.rect({ x: n.x, y: n.y, width: n.width, height: n.height, fill: getActiveDashboard().primary, listening: false }),
      app.text({ text: n.label, x: n.x, y: n.y - 12, fontSize: 10, fill: getActiveDashboard().text, listening: false })
    );
  });
  attachRegionsHover(
    app,
    group,
    props,
    width,
    height,
    layout.nodes.map((n) => ({
      x: n.x - 10,
      y: n.y,
      width: n.width + 20,
      height: n.height,
      label: n.label,
      payload: { id: n.id, label: n.label },
    }))
  );
  setState(group, { width, height, nodes, links });
  return group;
});

registerDashboard('chordChart', (props, app) => {
  const size = num(props, 'size', 220);
  const labels = (props.labels as string[]) ?? [];
  const matrix = (props.matrix as number[][]) ?? [
    [0, 5, 3],
    [4, 0, 2],
    [1, 3, 0],
  ];
  const group = createWidgetGroup(app, 'chordChart', props);
  group.add(app.rect({ width: size, height: size, fill: getActiveDashboard().chartBg, listening: true }));
  const chord = layoutChord(matrix, size);

  chord.ribbons.forEach((ribbon) => {
    group.add(
      app.path({
        d: ribbon.path,
        fill: getActiveDashboard().flowLink,
        opacity: 0.35 + (ribbon.value / 10) * 0.15,
        stroke: null,
        listening: false,
      })
    );
  });

  chord.segments.forEach((seg) => {
    group.add(
      app.path({
        d: arcSectorPath(chord.cx, chord.cy, chord.outerR, seg.startAngle, seg.endAngle, chord.innerR),
        fill: getActiveDashboard().series[seg.index % getActiveDashboard().series.length],
        stroke: getActiveDashboard().pieStroke,
        strokeWidth: 1,
        listening: false,
      })
    );
    const mid = (seg.startAngle + seg.endAngle) / 2;
    const lr = (chord.outerR + chord.innerR) / 2;
    const lx = chord.cx + lr * Math.cos(mid);
    const ly = chord.cy + lr * Math.sin(mid);
    const name = labels[seg.index] ?? `N${seg.index + 1}`;
    group.add(
      app.text({
        text: name,
        x: lx - 10,
        y: ly - 6,
        fontSize: 9,
        fill: getActiveDashboard().text,
        listening: false,
      })
    );
  });

  attachPolarSliceHover(
    app,
    group,
    props,
    size,
    chord.segments.map((s) => s.value),
    chord.segments.map((s, i) => labels[i] ?? `node ${i + 1}: ${s.value}`)
  );
  setState(group, { size, matrix, labels });
  return group;
});

registerDashboard('alluvialChart', (props, app) => {
  const width = num(props, 'width', 400);
  const height = num(props, 'height', 200);
  const stages = (props.stages as string[][]) ?? [
    ['A1', 'A2'],
    ['B1', 'B2', 'B3'],
    ['C1', 'C2'],
  ];
  const group = createWidgetGroup(app, 'alluvialChart', props);
  group.add(app.rect({ width, height, fill: getActiveDashboard().chartBg, listening: true }));
  const colW = width / stages.length;
  const regions: { x: number; y: number; width: number; height: number; label: string }[] = [];
  stages.forEach((col, ci) => {
    const step = height / (col.length + 1);
    col.forEach((label, ri) => {
      const x = ci * colW + 10;
      const y = step * (ri + 1);
      regions.push({ x, y, width: colW - 20, height: 24, label });
      group.add(
        app.rect({ x, y, width: colW - 20, height: 24, fill: getActiveDashboard().series[ri % getActiveDashboard().series.length], cornerRadius: 4, listening: false }),
        app.text({ text: label, x: x + 6, y: y + 5, fontSize: 10, fill: getActiveDashboard().text, listening: false })
      );
      if (ci < stages.length - 1) {
        const nx = (ci + 1) * colW + 10;
        const ny = step * (ri + 1) + 12;
        group.add(app.path({ d: `M ${x + colW - 20} ${y + 12} C ${x + colW} ${y + 12} ${nx - 20} ${ny} ${nx} ${ny}`, fill: null, stroke: getActiveDashboard().flowLink, strokeWidth: 8, listening: false }));
      }
    });
  });
  attachRegionsHover(app, group, props, width, height, regions);
  setState(group, { width, height, stages });
  return group;
});

registerDashboard('streamgraph', (props, app) => {
  const width = num(props, 'width', 300);
  const height = num(props, 'height', 150);
  const series = (props.series as number[][]) ?? [
    [10, 12, 8, 14, 11],
    [8, 10, 12, 9, 13],
    [6, 7, 9, 11, 8],
  ];
  const names = (props.seriesNames as string[]) ?? series.map((_, i) => `S${i + 1}`);
  const group = createWidgetGroup(app, 'streamgraph', props);
  group.add(app.rect({ width, height, fill: getActiveDashboard().chartBg, listening: true }));
  const layers = layoutStreamgraph(series, width, height);
  const len = Math.max(...series.map((s) => s.length), 1);

  layers.forEach((layer) => {
    group.add(
      app.path({
        d: layer.path,
        fill: getActiveDashboard().series[layer.index % getActiveDashboard().series.length],
        opacity: 0.82,
        stroke: getActiveDashboard().chartBg,
        strokeWidth: 0.5,
        listening: false,
      })
    );
  });

  attachIndexXHover(
    app,
    group,
    props,
    { plotX: 24, plotY: 0, plotWidth: width - 48, plotHeight: height },
    len,
    (i) => streamTooltipLabel(series, i, names)
  );
  setState(group, { width, height, series, names });
  return group;
});
