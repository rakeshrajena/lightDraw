import { Arc } from '../../../shapes/index';
import type { App } from '../../../App';
import type { Group } from '../../../shapes/Group';
import { createWidgetGroup, num, setState } from '../../helpers';
import { DASHBOARD } from '../../theme';
import { attachPolarSliceHover } from '../core/interaction';
import { polarToXY } from '../core/scales';

export interface PolarSliceOptions {
  innerRadius?: number;
  showLabels?: boolean;
}

export function buildPolarSlices(
  group: Group,
  app: App,
  data: number[],
  size: number,
  colors: string[],
  options: PolarSliceOptions = {}
): void {
  const innerR = options.innerRadius ?? 0;
  const outerR = size / 2 - 10;
  const cx = size / 2;
  const cy = size / 2;
  const total = data.reduce((a, b) => a + b, 0) || 1;
  let startAngle = -Math.PI / 2;

  data.forEach((val, i) => {
    const sweep = (val / total) * Math.PI * 2;
    const endAngle = startAngle + sweep;
    group.add(
      new Arc({
        x: cx - outerR,
        y: cy - outerR,
        innerRadius: innerR,
        radius: outerR,
        startAngle,
        endAngle,
        fill: colors[i % colors.length],
        stroke: DASHBOARD.pieStroke,
        strokeWidth: 1,
        listening: false,
      })
    );
    if (options.showLabels !== false && sweep > 0.15) {
      const mid = (startAngle + endAngle) / 2;
      const lr = (outerR + innerR) / 2;
      const [lx, ly] = polarToXY(cx, cy, lr, mid);
      const pct = Math.round((val / total) * 100);
      group.add(
        app.text({
          text: `${pct}%`,
          x: lx - 10,
          y: ly - 6,
          fontSize: 10,
          fill: DASHBOARD.text,
          listening: false,
        })
      );
    }
    startAngle = endAngle;
  });
}

export function buildRadarChart(
  group: Group,
  app: App,
  props: Record<string, unknown>
): void {
  const size = num(props, 'size', 200);
  const data = (props.data as number[]) ?? [4, 6, 3, 7, 5];
  const labels = (props.categories as string[]) ?? data.map((_, i) => `A${i + 1}`);
  const cx = size / 2;
  const cy = size / 2;
  const max = Math.max(...data, 1);
  const r = size / 2 - 24;
  const n = data.length;

  for (let ring = 1; ring <= 4; ring++) {
    const rr = (r * ring) / 4;
    const pts: number[] = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      pts.push(cx + rr * Math.cos(a), cy + rr * Math.sin(a));
    }
    group.add(app.polygon({ points: pts, fill: null, stroke: DASHBOARD.chartGrid, strokeWidth: 1, listening: false }));
  }

  const dataPts: number[] = [];
  data.forEach((v, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const dr = (v / max) * r;
    dataPts.push(cx + dr * Math.cos(a), cy + dr * Math.sin(a));
    group.add(
      app.text({
        text: labels[i],
        x: cx + (r + 12) * Math.cos(a) - 8,
        y: cy + (r + 12) * Math.sin(a) - 6,
        fontSize: 10,
        fill: DASHBOARD.textMuted,
        listening: false,
      })
    );
  });
  dataPts.push(dataPts[0], dataPts[1]);
  group.add(
    app.polygon({
      points: dataPts,
      fill: DASHBOARD.chartArea,
      stroke: DASHBOARD.chartLine,
      strokeWidth: 2,
      listening: false,
    })
  );
  attachPolarSliceHover(
    app,
    group,
    props,
    size,
    data.map(() => 1),
    labels.map((l, i) => `${l}: ${data[i]}`)
  );
  setState(group, { size, data, labels });
}

export function createPieWidget(
  app: App,
  type: string,
  props: Record<string, unknown>,
  innerRadius = 0
): Group {
  const size = num(props, 'size', 150);
  const data = (props.data as number[]) ?? [30, 25, 20, 25];
  const colors = (props.colors as string[]) ?? [...DASHBOARD.series];
  const resolvedInner =
    typeof props.innerRadius === 'number'
      ? (props.innerRadius as number)
      : innerRadius > 0
        ? innerRadius
        : type === 'doughnutChart'
          ? Math.round(size * 0.42)
          : 0;
  const group = createWidgetGroup(app, type, props);
  buildPolarSlices(group, app, data, size, colors, {
    innerRadius: resolvedInner,
    showLabels: props.showLabels !== false,
  });
  const labels = (props.labels as string[]) ?? data.map((_, i) => `Slice ${i + 1}`);
  attachPolarSliceHover(
    app,
    group,
    props,
    size,
    data,
    labels.map((l, i) => `${l}: ${data[i]}`),
    resolvedInner
  );
  setState(group, { size, data, colors, innerRadius: resolvedInner });
  return group;
}
