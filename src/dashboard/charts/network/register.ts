import { attachRegionsHover, attachNearestHover } from '../core/interaction';
import { registerDashboard } from '../../registryCore';
import { createWidgetGroup, num, setState } from '../../helpers';
import { getActiveDashboard } from '../../theme';
import { forceDirectedLayout } from '../../../diagram/layouts';
import type { GanttTask, TimelineEvent } from '../types';

registerDashboard('networkChart', (props, app) => {
  const width = num(props, 'width', 300);
  const height = num(props, 'height', 200);
  const nodes = (props.nodes as { id: string; label?: string }[]) ?? [
    { id: 'a', label: 'A' },
    { id: 'b', label: 'B' },
    { id: 'c', label: 'C' },
    { id: 'd', label: 'D' },
  ];
  const edges = (props.edges as { from: string; to: string }[]) ?? [
    { from: 'a', to: 'b' },
    { from: 'b', to: 'c' },
    { from: 'a', to: 'd' },
    { from: 'd', to: 'c' },
  ];
  const group = createWidgetGroup(app, 'networkChart', props);
  group.add(app.rect({ width, height, fill: getActiveDashboard().chartBg, listening: true }));
  const positions = forceDirectedLayout(nodes, edges, { width, height, iterations: 50, seed: 7 });
  edges.forEach((e) => {
    const a = positions.get(e.from);
    const b = positions.get(e.to);
    if (!a || !b) return;
    group.add(app.line({ x: a.x, y: a.y, x2: b.x - a.x, y2: b.y - a.y, stroke: getActiveDashboard().chartGrid, strokeWidth: 1, listening: false }));
  });
  nodes.forEach((n) => {
    const p = positions.get(n.id);
    if (!p) return;
    group.add(
      app.circle({ x: p.x - 10, y: p.y - 10, radius: 10, fill: getActiveDashboard().primary, listening: false }),
      app.text({ text: n.label ?? n.id, x: p.x - 8, y: p.y + 16, fontSize: 9, fill: getActiveDashboard().text, listening: false })
    );
  });
  attachNearestHover(
    app,
    group,
    props,
    { x: 0, y: 0, width, height },
    nodes
      .map((n) => {
        const p = positions.get(n.id);
        if (!p) return null;
        return { x: p.x, y: p.y, label: n.label ?? n.id };
      })
      .filter((p): p is { x: number; y: number; label: string } => p != null)
  );
  setState(group, { width, height, nodes, edges });
  return group;
});

registerDashboard('timeline', (props, app) => {
  const width = num(props, 'width', 320);
  const height = num(props, 'height', 120);
  const events = (props.events as TimelineEvent[]) ?? [
    { label: 'Kickoff', start: 0, end: 2 },
    { label: 'Build', start: 2, end: 8 },
    { label: 'Launch', start: 8, end: 10 },
  ];
  const group = createWidgetGroup(app, 'timeline', props);
  const max = Math.max(...events.map((e) => e.end ?? e.start ?? 0), 10);
  group.add(app.rect({ width, height, fill: getActiveDashboard().chartBg, listening: true }));
  group.add(app.line({ x: 20, y: height / 2, x2: width - 40, y2: 0, stroke: getActiveDashboard().timelineLine, strokeWidth: 2, listening: false }));
  events.forEach((ev, i) => {
    const start = ev.start ?? i * 2;
    const end = ev.end ?? start + 1;
    const x = 20 + ((start / max) * (width - 60));
    const w = ((end - start) / max) * (width - 60);
    group.add(
      app.roundedRect({ x, y: height / 2 - 14, width: Math.max(w, 20), height: 28, cornerRadius: 4, fill: getActiveDashboard().series[i % getActiveDashboard().series.length], listening: false }),
      app.text({ text: ev.label, x: x + 4, y: height / 2 - 6, fontSize: 10, fill: getActiveDashboard().text, listening: false })
    );
  });
  attachRegionsHover(
    app,
    group,
    props,
    width,
    height,
    events.map((ev, i) => {
      const start = ev.start ?? i * 2;
      const end = ev.end ?? start + 1;
      const x = 20 + (start / max) * (width - 60);
      const w = ((end - start) / max) * (width - 60);
      return { x, y: height / 2 - 14, width: Math.max(w, 20), height: 28, label: ev.label };
    })
  );
  setState(group, { width, height, events });
  return group;
});

registerDashboard('ganttChart', (props, app) => {
  const width = num(props, 'width', 360);
  const height = num(props, 'height', 200);
  const tasks = (props.tasks as GanttTask[]) ?? [
    { label: 'Design', start: 0, end: 3 },
    { label: 'Develop', start: 2, end: 8 },
    { label: 'Test', start: 7, end: 10 },
    { label: 'Ship', start: 10, end: 12 },
  ];
  const group = createWidgetGroup(app, 'ganttChart', props);
  const max = Math.max(...tasks.map((t) => t.end), 12);
  const rowH = height / tasks.length;
  group.add(app.rect({ width, height, fill: getActiveDashboard().chartBg, listening: true }));
  tasks.forEach((t, i) => {
    const y = i * rowH + 8;
    const x = 80 + (t.start / max) * (width - 100);
    const w = ((t.end - t.start) / max) * (width - 100);
    group.add(
      app.text({ text: t.label, x: 4, y: y + 4, fontSize: 11, fill: getActiveDashboard().text, listening: false }),
      app.roundedRect({ x, y, width: Math.max(w, 8), height: rowH - 16, cornerRadius: 3, fill: t.color ?? getActiveDashboard().series[i % getActiveDashboard().series.length], listening: false })
    );
  });
  attachRegionsHover(
    app,
    group,
    props,
    width,
    height,
    tasks.map((t, i) => {
      const y = i * rowH + 8;
      const x = 80 + (t.start / max) * (width - 100);
      const w = ((t.end - t.start) / max) * (width - 100);
      return { x, y, width: Math.max(w, 8), height: rowH - 16, label: `${t.label} (${t.start}-${t.end})` };
    })
  );
  setState(group, { width, height, tasks });
  return group;
});
