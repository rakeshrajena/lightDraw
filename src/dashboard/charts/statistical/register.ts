import { attachRegionsHover, attachNearestHover, attachIndexXHover, attachGridHover, attachBandYHover } from '../core/interaction';
import { registerDashboard } from '../../registryCore';
import { createWidgetGroup, num, setState } from '../../helpers';
import { DASHBOARD } from '../../theme';
import { installChartRebuild } from '../core/refresh';
import type { App } from '../../../App';
import type { Group } from '../../../shapes/Group';
import { defaultLayout, dataBounds, computeTicks, addAxes, addGridLines } from '../../chartPrimitives';
import { histogramBins, boxStats, kdeSamples, normalQuantiles, hexbinCenters } from '../core/stats';
import { linearScale } from '../core/scales';
import type { ScatterPoint } from '../types';

function plotChrome(app: import('../../../App').App, group: import('../../../shapes/Group').Group, width: number, height: number, bounds: { min: number; max: number }) {
  const layout = defaultLayout(width, height);
  const yTicks = computeTicks(bounds.min, bounds.max, 5);
  group.add(app.rect({ width, height, fill: DASHBOARD.chartBg, listening: true }));
  group.add(app.rect({ x: layout.plotX, y: layout.plotY, width: layout.plotWidth, height: layout.plotHeight, fill: DASHBOARD.chartPlot, listening: false }));
  addGridLines(app, group, layout, yTicks, bounds);
  addAxes(app, group, layout, bounds, yTicks);
  return layout;
}

registerDashboard('histogram', (props, app) => {
  const width = num(props, 'width', 300);
  const height = num(props, 'height', 150);
  const data = (props.data as number[]) ?? [2, 3, 3, 4, 5, 5, 5, 6, 7, 8, 9, 12];
  const bins = histogramBins(data, num(props, 'binCount', 8));
  const max = Math.max(...bins.map((b) => b.count), 1);
  const group = createWidgetGroup(app, 'histogram', props);
  const layout = plotChrome(app, group, width, height, { min: 0, max });
  const bw = layout.plotWidth / bins.length;
  bins.forEach((b, i) => {
    const h = (b.count / max) * layout.plotHeight;
    group.add(app.rect({ x: layout.plotX + i * bw, y: layout.plotY + layout.plotHeight - h, width: bw - 2, height: h, fill: DASHBOARD.barFill, listening: false }));
  });
  attachIndexXHover(
    app,
    group,
    props,
    layout,
    bins.length,
    (i) => `${bins[i].x0.toFixed(1)}–${bins[i].x1.toFixed(1)}: ${bins[i].count}`,
    (i) => {
      const h = (bins[i].count / max) * layout.plotHeight;
      return { x: layout.plotX + i * bw, y: layout.plotY + layout.plotHeight - h, width: bw - 2, height: h };
    }
  );
  setState(group, { width, height, data });
  return group;
});

registerDashboard('boxPlot', (props, app) => {
  const width = num(props, 'width', 300);
  const height = num(props, 'height', 150);
  const sets = Array.isArray((props.data as number[][])?.[0])
    ? (props.data as number[][])
    : (props.data as number[][]) ?? [[2, 3, 4, 5, 6, 7, 8], [3, 5, 7, 9, 11]];
  const group = createWidgetGroup(app, 'boxPlot', props);
  const layout = plotChrome(app, group, width, height, dataBounds(sets.flat()));
  const slot = layout.plotWidth / sets.length;
  sets.forEach((vals, i) => {
    const s = boxStats(vals);
    const cx = layout.plotX + slot * i + slot / 2;
    const scale = linearScale([s.min, s.max], [layout.plotY + layout.plotHeight, layout.plotY]);
    const yQ1 = scale(s.q1);
    const yQ3 = scale(s.q3);
    const yMed = scale(s.median);
    group.add(
      app.rect({ x: cx - 16, y: yQ3, width: 32, height: yQ1 - yQ3, fill: DASHBOARD.chartArea, stroke: DASHBOARD.chartLine, strokeWidth: 1, listening: false }),
      app.line({ x: cx - 16, y: yMed, x2: 32, y2: 0, stroke: DASHBOARD.chartLine, strokeWidth: 2, listening: false }),
      app.line({ x: cx, y: scale(s.min), x2: 0, y2: scale(s.max) - scale(s.min), stroke: DASHBOARD.textMuted, strokeWidth: 1, listening: false })
    );
  });
  attachIndexXHover(app, group, props, layout, sets.length, (i) => {
    const s = boxStats(sets[i]);
    return `med ${s.median} [${s.q1}, ${s.q3}]`;
  });
  setState(group, { width, height, data: sets });
  return group;
});
registerDashboard('boxAndWhiskerChart', (props, app) => {
  const width = num(props, 'width', 300);
  const height = num(props, 'height', 150);
  const sets = Array.isArray((props.data as number[][])?.[0])
    ? (props.data as number[][])
    : (props.data as number[][]) ?? [[2, 3, 4, 5, 6, 7, 8], [3, 5, 7, 9, 11]];
  const group = createWidgetGroup(app, 'boxAndWhiskerChart', props);
  const layout = plotChrome(app, group, width, height, dataBounds(sets.flat()));
  const slot = layout.plotWidth / sets.length;
  sets.forEach((vals, i) => {
    const s = boxStats(vals);
    const cx = layout.plotX + slot * i + slot / 2;
    const scale = linearScale([s.min, s.max], [layout.plotY + layout.plotHeight, layout.plotY]);
    const yQ1 = scale(s.q1);
    const yQ3 = scale(s.q3);
    const yMed = scale(s.median);
    group.add(
      app.rect({ x: cx - 16, y: yQ3, width: 32, height: yQ1 - yQ3, fill: DASHBOARD.chartArea, stroke: DASHBOARD.chartLine, strokeWidth: 1, listening: false }),
      app.line({ x: cx - 16, y: yMed, x2: 32, y2: 0, stroke: DASHBOARD.chartLine, strokeWidth: 2, listening: false }),
      app.line({ x: cx, y: scale(s.min), x2: 0, y2: scale(s.max) - scale(s.min), stroke: DASHBOARD.textMuted, strokeWidth: 1, listening: false })
    );
  });
  attachIndexXHover(app, group, props, layout, sets.length, (i) => {
    const s = boxStats(sets[i]);
    return `med ${s.median} [${s.q1}, ${s.q3}]`;
  });
  setState(group, { width, height, data: sets });
  return group;
});

registerDashboard('violinPlot', (props, app) => {
  const width = num(props, 'width', 300);
  const height = num(props, 'height', 150);
  const data = (props.data as number[]) ?? [2, 3, 3, 4, 5, 5, 6, 7, 8, 9];
  const group = createWidgetGroup(app, 'violinPlot', props);
  const layout = plotChrome(app, group, width, height, dataBounds(data));
  const samples = Array.from({ length: 20 }, (_, i) => layout.plotY + (layout.plotHeight / 19) * i);
  const dens = kdeSamples(data, samples.map((y) => layout.plotY + layout.plotHeight - (y - layout.plotY)));
  const maxD = Math.max(...dens, 0.001);
  const cx = layout.plotX + layout.plotWidth / 2;
  const pts: number[] = [];
  dens.forEach((d, i) => {
    const y = layout.plotY + (layout.plotHeight / dens.length) * i;
    pts.push(cx - (d / maxD) * 40, y, cx + (d / maxD) * 40, y);
  });
  group.add(app.polygon({ points: pts, fill: DASHBOARD.chartArea, stroke: DASHBOARD.chartLine, strokeWidth: 1, listening: false }));
  attachIndexXHover(app, group, props, layout, 20, (i) => {
    const y = layout.plotY + (layout.plotHeight / 19) * i;
    const v = layout.plotY + layout.plotHeight - (y - layout.plotY);
    return `density @ ${v.toFixed(1)}`;
  });
  setState(group, { width, height, data });
  return group;
});

registerDashboard('densityPlot', (props, app) => {
  const width = num(props, 'width', 300);
  const height = num(props, 'height', 150);
  const data = (props.data as number[]) ?? [2, 3, 3, 4, 5, 5, 6, 7, 8, 9];
  const group = createWidgetGroup(app, 'densityPlot', props);
  const bounds = dataBounds(data);
  const layout = plotChrome(app, group, width, height, bounds);
  const xs = Array.from({ length: 40 }, (_, i) => bounds.min + ((bounds.max - bounds.min) * i) / 39);
  const dens = kdeSamples(data, xs);
  const maxD = Math.max(...dens, 0.001);
  const pts: number[] = [];
  xs.forEach((_x, i) => {
    const px = layout.plotX + (layout.plotWidth * i) / 39;
    const py = layout.plotY + layout.plotHeight - (dens[i] / maxD) * layout.plotHeight;
    pts.push(px, py);
  });
  group.add(app.polyline({ points: pts, fill: null, stroke: DASHBOARD.chartLine, strokeWidth: 2, listening: false }));
  attachIndexXHover(app, group, props, layout, xs.length, (i) => `x=${xs[i].toFixed(1)} ρ=${dens[i].toFixed(3)}`);
  setState(group, { width, height, data });
  return group;
});

registerDashboard('heatmap', (props, app) => {
  const width = num(props, 'width', 240);
  const height = num(props, 'height', 160);
  const matrix = (props.matrix as number[][]) ?? [
    [1, 3, 5, 2],
    [4, 1, 6, 3],
    [2, 5, 1, 4],
  ];
  const group = createWidgetGroup(app, 'heatmap', props);
  const max = Math.max(...matrix.flat(), 1);
  const rows = matrix.length;
  const cols = matrix[0]?.length ?? 1;
  const cw = width / cols;
  const ch = height / rows;
  matrix.forEach((row, ri) => {
    row.forEach((v, ci) => {
      const t = v / max;
      const r = Math.round(59 + t * 100);
      const g = Math.round(130 - t * 80);
      const b = Math.round(246 - t * 100);
      group.add(app.rect({ x: ci * cw, y: ri * ch, width: cw - 1, height: ch - 1, fill: `rgb(${r},${g},${b})`, listening: false }));
    });
  });
  attachGridHover(app, group, props, width, height, rows, cols, (ri, ci) => String(matrix[ri][ci]));
  setState(group, { width, height, matrix });
  return group;
});

registerDashboard('hexbinChart', (props, app) => {
  const width = num(props, 'width', 300);
  const height = num(props, 'height', 150);
  const points = (props.points as ScatterPoint[]) ?? Array.from({ length: 40 }, () => ({ x: Math.random() * 280, y: Math.random() * 130 }));
  const group = createWidgetGroup(app, 'hexbinChart', props);
  group.add(app.rect({ width, height, fill: DASHBOARD.chartBg, listening: true }));
  const bins = hexbinCenters(points.map((p) => [p.x, p.y]), width, height, 12);
  const max = Math.max(...[...bins.values()].map((b) => b.count), 1);
  for (const b of bins.values()) {
    group.add(app.circle({ x: b.x - 10, y: b.y - 10, radius: 10, fill: DASHBOARD.primary, opacity: b.count / max, listening: false }));
  }
  attachNearestHover(
    app,
    group,
    props,
    { x: 0, y: 0, width, height },
    [...bins.values()].map((b) => ({ x: b.x, y: b.y, label: `count: ${b.count}` }))
  );
  setState(group, { width, height, points });
  return group;
});

registerDashboard('contourChart', (props, app) => {
  const width = num(props, 'width', 300);
  const height = num(props, 'height', 150);
  const group = createWidgetGroup(app, 'contourChart', props);
  group.add(app.rect({ width, height, fill: DASHBOARD.chartBg, listening: true }));
  for (let i = 1; i <= 5; i++) {
    const inset = i * 12;
    group.add(app.rect({ x: inset, y: inset, width: width - inset * 2, height: height - inset * 2, fill: null, stroke: DASHBOARD.chartLine, strokeWidth: 1, listening: false }));
  }
  attachGridHover(app, group, props, width, height, 5, 5, (_r, _c) => 'contour');
  setState(group, { width, height });
  return group;
});

registerDashboard('qqPlot', (props, app) => {
  const width = num(props, 'width', 300);
  const height = num(props, 'height', 150);
  const data = (props.data as number[]) ?? [2, 3, 3, 4, 5, 5, 6, 7, 8, 9];
  const sorted = [...data].sort((a, b) => a - b);
  const theoretical = normalQuantiles(sorted.length);
  const group = createWidgetGroup(app, 'qqPlot', props);
  const bounds = dataBounds([...sorted, ...theoretical]);
  const layout = plotChrome(app, group, width, height, bounds);
  sorted.forEach((_v, i) => {
    const x = layout.plotX + (layout.plotWidth * i) / Math.max(sorted.length - 1, 1);
    const tx = theoretical[i];
    const range = bounds.max - bounds.min || 1;
    const py = layout.plotY + layout.plotHeight - ((tx - bounds.min) / range) * layout.plotHeight;
    group.add(app.circle({ x: x - 3, y: py - 3, radius: 3, fill: DASHBOARD.chartDot, listening: false }));
  });
  attachIndexXHover(app, group, props, layout, sorted.length, (i) => `obs ${sorted[i]} / q ${theoretical[i].toFixed(2)}`);
  setState(group, { width, height, data });
  return group;
});

registerDashboard('beeswarmChart', (props, app) => {
  const width = num(props, 'width', 300);
  const height = num(props, 'height', 150);
  const data = (props.data as number[]) ?? [2, 3, 3, 4, 5, 5, 6, 7, 8, 9];
  const group = createWidgetGroup(app, 'beeswarmChart', props);
  const layout = plotChrome(app, group, width, height, dataBounds(data));
  const cx = layout.plotX + layout.plotWidth / 2;
  const db = dataBounds(data);
  data.forEach((v, i) => {
    const y = layout.plotY + layout.plotHeight - ((v - db.min) / (db.max - db.min || 1)) * layout.plotHeight;
    const x = cx + ((i % 7) - 3) * 8;
    group.add(app.circle({ x: x - 3, y: y - 3, radius: 4, fill: DASHBOARD.chartDot, listening: false }));
  });
  attachNearestHover(
    app,
    group,
    props,
    { x: layout.plotX, y: layout.plotY, width: layout.plotWidth, height: layout.plotHeight },
    data.map((v, i) => {
      const y = layout.plotY + layout.plotHeight - ((v - db.min) / (db.max - db.min || 1)) * layout.plotHeight;
      const x = cx + ((i % 7) - 3) * 8;
      return { x, y, label: String(v) };
    })
  );
  setState(group, { width, height, data });
  return group;
});

registerDashboard('ridgelinePlot', (props, app) => {
  const width = num(props, 'width', 300);
  const height = num(props, 'height', 200);
  const series = (props.series as number[][]) ?? [[2, 3, 4, 5], [3, 5, 7, 9], [1, 2, 3, 8]];
  const group = createWidgetGroup(app, 'ridgelinePlot', props);
  group.add(app.rect({ width, height, fill: DASHBOARD.chartBg, listening: true }));
  const band = height / series.length;
  series.forEach((data, si) => {
    const bounds = dataBounds(data);
    const y0 = si * band + 10;
    const pts: number[] = [];
    data.forEach((v, i) => {
      pts.push(30 + (width - 60) * (i / Math.max(data.length - 1, 1)), y0 + band - 10 - ((v - bounds.min) / (bounds.max - bounds.min || 1)) * (band - 20));
    });
    group.add(app.polyline({ points: pts, fill: null, stroke: DASHBOARD.series[si % DASHBOARD.series.length], strokeWidth: 2, listening: false }));
  });
  attachBandYHover(app, group, props, width, height, series.length, (i) => `series ${i + 1}`);
  setState(group, { width, height, series });
  return group;
});

registerDashboard('parallelCoordinatesPlot', (props, app) => {
  const width = num(props, 'width', 300);
  const height = num(props, 'height', 150);
  const dimensions = (props.dimensions as number[][]) ?? [[1, 5, 3], [2, 4, 6], [3, 2, 8]];
  const group = createWidgetGroup(app, 'parallelCoordinatesPlot', props);
  group.add(app.rect({ width, height, fill: DASHBOARD.chartBg, listening: true }));
  const cols = dimensions[0]?.length ?? 3;
  const step = (width - 40) / Math.max(cols - 1, 1);
  for (let c = 0; c < cols; c++) {
    const x = 20 + c * step;
    group.add(app.line({ x, y: 20, x2: 0, y2: height - 40, stroke: DASHBOARD.chartGrid, strokeWidth: 1, listening: false }));
  }
  dimensions.forEach((row, ri) => {
    const pts: number[] = [];
    const max = Math.max(...row, 1);
    row.forEach((v, ci) => {
      pts.push(20 + ci * step, height - 20 - (v / max) * (height - 40));
    });
    group.add(app.polyline({ points: pts, fill: null, stroke: DASHBOARD.series[ri % DASHBOARD.series.length], strokeWidth: 1.5, listening: false }));
  });
  attachIndexXHover(
    app,
    group,
    props,
    { plotX: 20, plotY: 20, plotWidth: width - 40, plotHeight: height - 40 },
    cols,
    (i) => `dim ${i + 1}`
  );
  setState(group, { width, height, dimensions });
  return group;
});

registerDashboard('mosaicChart', (props, app) => {
  const width = num(props, 'width', 300);
  const height = num(props, 'height', 150);
  const cells = (props.cells as { w: number; h: number; value: number }[]) ?? [
    { w: 0.5, h: 0.5, value: 1 },
    { w: 0.5, h: 0.5, value: 2 },
    { w: 0.3, h: 0.5, value: 3 },
    { w: 0.7, h: 0.5, value: 4 },
  ];
  const group = createWidgetGroup(app, 'mosaicChart', props);
  let x = 0;
  let y = 0;
  const regions: { x: number; y: number; width: number; height: number; label: string }[] = [];
  cells.forEach((c, i) => {
    const cw = c.w * width;
    const ch = c.h * height;
    regions.push({ x, y, width: cw - 1, height: ch - 1, label: String(c.value) });
    group.add(app.rect({ x, y, width: cw - 1, height: ch - 1, fill: DASHBOARD.series[i % DASHBOARD.series.length], listening: false }));
    x += cw;
    if (x >= width - 1) {
      x = 0;
      y += ch;
    }
  });
  attachRegionsHover(app, group, props, width, height, regions);
  setState(group, { width, height, cells });
  return group;
});

registerDashboard('marimekkoChart', (props, app) => {
  const width = num(props, 'width', 300);
  const height = num(props, 'height', 150);
  const segments = (props.segments as { widthFrac: number; heightFrac: number }[]) ?? [
    { widthFrac: 0.4, heightFrac: 0.6 },
    { widthFrac: 0.6, heightFrac: 0.4 },
    { widthFrac: 0.5, heightFrac: 0.5 },
  ];
  const group = createWidgetGroup(app, 'marimekkoChart', props);
  let x = 0;
  const regions: { x: number; y: number; width: number; height: number; label: string }[] = [];
  segments.forEach((s, i) => {
    const w = s.widthFrac * width;
    const h = s.heightFrac * height;
    regions.push({ x, y: height - h, width: w - 1, height: h, label: `${Math.round(s.widthFrac * 100)}%` });
    group.add(app.rect({ x, y: height - h, width: w - 1, height: h, fill: DASHBOARD.series[i % DASHBOARD.series.length], listening: false }));
    x += w;
  });
  attachRegionsHover(app, group, props, width, height, regions);
  setState(group, { width, height, segments });
  return group;
});
registerDashboard('mekkoChart', (props, app) => {
  const width = num(props, 'width', 300);
  const height = num(props, 'height', 150);
  const segments = (props.segments as { widthFrac: number; heightFrac: number }[]) ?? [
    { widthFrac: 0.4, heightFrac: 0.6 },
    { widthFrac: 0.6, heightFrac: 0.4 },
    { widthFrac: 0.5, heightFrac: 0.5 },
  ];
  const group = createWidgetGroup(app, 'mekkoChart', props);
  let x = 0;
  const regions: { x: number; y: number; width: number; height: number; label: string }[] = [];
  segments.forEach((s, i) => {
    const w = s.widthFrac * width;
    const h = s.heightFrac * height;
    regions.push({ x, y: height - h, width: w - 1, height: h, label: `${Math.round(s.widthFrac * 100)}%` });
    group.add(app.rect({ x, y: height - h, width: w - 1, height: h, fill: DASHBOARD.series[i % DASHBOARD.series.length], listening: false }));
    x += w;
  });
  attachRegionsHover(app, group, props, width, height, regions);
  setState(group, { width, height, segments });
  return group;
});

registerDashboard('waffleChart', (props, app) => {
  const size = num(props, 'size', 160);
  const total = num(props, 'total', 100);
  const value = num(props, 'value', 42);
  const group = createWidgetGroup(app, 'waffleChart', props);
  const grid = 10;
  const cell = size / grid;
  const filled = Math.round((value / total) * grid * grid);
  for (let i = 0; i < grid * grid; i++) {
    const col = i % grid;
    const row = Math.floor(i / grid);
    group.add(
      app.rect({
        x: col * cell,
        y: row * cell,
        width: cell - 2,
        height: cell - 2,
        fill: i < filled ? DASHBOARD.primary : DASHBOARD.inactive,
        cornerRadius: 2,
        listening: false,
      })
    );
  }
  attachGridHover(app, group, props, size, size, grid, grid, (_r, c) => {
    const idx = _r * grid + c;
    return idx < filled ? 'filled' : 'empty';
  });
  setState(group, { size, total, value });
  return group;
});

registerDashboard('calendarHeatmap', (props, app) => {
  const group = createWidgetGroup(app, 'calendarHeatmap', props);
  installChartRebuild(group, app, buildCalendarHeatmap);
  return group;
});

function buildCalendarHeatmap(group: Group, app: App, props: Record<string, unknown>): void {
  const width = num(props, 'width', 280);
  const height = num(props, 'height', 120);
  const values = (props.values as number[]) ?? Array.from({ length: 35 }, (_, i) => (i % 7) + 1);
  const max = Math.max(...values, 1);
  const cols = 7;
  const rows = Math.ceil(values.length / cols);
  const gap = 2;
  const cellW = (width - gap * (cols - 1)) / cols;
  const cellH = (height - gap * (rows - 1)) / rows;
  const cell = Math.max(4, Math.floor(Math.min(cellW, cellH)));
  const gridW = cols * cell + gap * (cols - 1);
  const gridH = rows * cell + gap * (rows - 1);
  const offsetX = Math.max(0, (width - gridW) / 2);
  const offsetY = Math.max(0, (height - gridH) / 2);

  values.forEach((v, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const t = v / max;
    group.add(
      app.rect({
        x: offsetX + col * (cell + gap),
        y: offsetY + row * (cell + gap),
        width: cell,
        height: cell,
        fill: `rgba(59,130,246,${0.2 + t * 0.8})`,
        cornerRadius: Math.min(2, cell * 0.15),
        listening: false,
      })
    );
  });
  attachGridHover(app, group, props, width, height, rows, cols, (row, col) => {
    const v = values[row * cols + col];
    return v != null ? String(v) : '';
  });
  setState(group, { width, height, values });
}

registerDashboard('stemLeafPlot', (props, app) => {
  const width = num(props, 'width', 200);
  const height = num(props, 'height', 180);
  const data = (props.data as number[]) ?? [12, 23, 23, 34, 45, 56, 67, 78, 89];
  const group = createWidgetGroup(app, 'stemLeafPlot', props);
  const stems = new Map<number, number[]>();
  data.forEach((v) => {
    const stem = Math.floor(v / 10);
    const leaf = v % 10;
    if (!stems.has(stem)) stems.set(stem, []);
    stems.get(stem)!.push(leaf);
  });
  let y = 8;
  for (const [stem, leaves] of [...stems.entries()].sort((a, b) => a[0] - b[0])) {
    group.add(
      app.text({ text: `${stem} | ${leaves.join(' ')}`, x: 8, y, fontSize: 12, fill: DASHBOARD.text, listening: false })
    );
    y += 16;
  }
  const rowCount = stems.size;
  attachBandYHover(app, group, props, width, height, rowCount, (i) => {
    const entries = [...stems.entries()].sort((a, b) => a[0] - b[0]);
    const [stem, leaves] = entries[i] ?? [0, []];
    return `${stem} | ${leaves.join(' ')}`;
  });
  setState(group, { width, height, data });
  return group;
});

registerDashboard('scatterChart', (props, app) => {
  const width = num(props, 'width', 300);
  const height = num(props, 'height', 150);
  const points = (props.points as ScatterPoint[]) ?? [
    { x: 10, y: 20 },
    { x: 30, y: 45 },
    { x: 50, y: 35 },
    { x: 70, y: 80 },
    { x: 90, y: 60 },
  ];
  const group = createWidgetGroup(app, 'scatterChart', props);
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const layout = plotChrome(app, group, width, height, { min: Math.min(...ys, 0), max: Math.max(...ys, 1) });
  const xScale = linearScale([Math.min(...xs), Math.max(...xs)], [layout.plotX, layout.plotX + layout.plotWidth]);
  const yScale = linearScale([Math.min(...ys), Math.max(...ys)], [layout.plotY + layout.plotHeight, layout.plotY]);
  points.forEach((p) => {
    group.add(app.circle({ x: xScale(p.x) - 4, y: yScale(p.y) - 4, radius: 4, fill: DASHBOARD.chartDot, listening: false }));
  });
  attachNearestHover(
    app,
    group,
    props,
    { x: layout.plotX, y: layout.plotY, width: layout.plotWidth, height: layout.plotHeight },
    points.map((p) => ({
      x: xScale(p.x),
      y: yScale(p.y),
      label: `(${p.x}, ${p.y})`,
    }))
  );
  setState(group, { width, height, points });
  return group;
});

registerDashboard('bubbleChart', (props, app) => {
  const width = num(props, 'width', 300);
  const height = num(props, 'height', 150);
  const points = (props.points as ScatterPoint[]) ?? [
    { x: 20, y: 30, size: 10 },
    { x: 50, y: 60, size: 25 },
    { x: 80, y: 40, size: 15 },
  ];
  const group = createWidgetGroup(app, 'bubbleChart', props);
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const layout = plotChrome(app, group, width, height, { min: Math.min(...ys, 0), max: Math.max(...ys, 1) });
  const xScale = linearScale([Math.min(...xs), Math.max(...xs)], [layout.plotX, layout.plotX + layout.plotWidth]);
  const yScale = linearScale([Math.min(...ys), Math.max(...ys)], [layout.plotY + layout.plotHeight, layout.plotY]);
  points.forEach((p) => {
    const r = (p.size ?? 8) / 2;
    group.add(app.circle({ x: xScale(p.x) - r, y: yScale(p.y) - r, radius: r, fill: DASHBOARD.chartArea, stroke: DASHBOARD.chartLine, strokeWidth: 1, listening: false }));
  });
  attachNearestHover(
    app,
    group,
    props,
    { x: layout.plotX, y: layout.plotY, width: layout.plotWidth, height: layout.plotHeight },
    points.map((p) => ({
      x: xScale(p.x),
      y: yScale(p.y),
      label: `(${p.x}, ${p.y}) r=${p.size ?? 8}`,
    }))
  );
  setState(group, { width, height, points });
  return group;
});
