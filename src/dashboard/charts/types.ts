export type ChartOrientation = 'vertical' | 'horizontal';

export type SeriesKind = 'line' | 'area' | 'bar' | 'step' | 'spline';

export interface ChartSeries {
  name?: string;
  label?: string;
  data: number[];
  type?: SeriesKind;
  color?: string;
  yAxis?: 'left' | 'right';
  errorY?: [number, number][];
  rangeMin?: number[];
  rangeMax?: number[];
}

export interface OhlcBar {
  time: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface HierarchyNode {
  name: string;
  value?: number;
  children?: HierarchyNode[];
}

export interface FlowNode {
  id: string;
  label?: string;
}

export interface FlowLink {
  source: string;
  target: string;
  value: number;
}

export interface ScatterPoint {
  x: number;
  y: number;
  size?: number;
  label?: string;
}

export interface WordItem {
  text: string;
  value: number;
}

export interface GanttTask {
  label: string;
  start: number;
  end: number;
  color?: string;
}

export interface TimelineEvent {
  label: string;
  time?: string;
  start?: number;
  end?: number;
}

export type CartesianVariant =
  | 'line'
  | 'area'
  | 'step'
  | 'spline'
  | 'bar'
  | 'horizontalBar'
  | 'stackedBar'
  | 'stackedColumn'
  | 'stackedArea'
  | 'errorBar'
  | 'lollipop'
  | 'dotPlot'
  | 'stripPlot'
  | 'sparkline'
  | 'range'
  | 'rangeArea'
  | 'band'
  | 'ribbon'
  | 'combination'
  | 'mixed'
  | 'waterfall'
  | 'pareto'
  | 'run'
  | 'control'
  | 'populationPyramid'
  | 'bump'
  | 'horizon';

export interface CartesianOptions {
  variant: CartesianVariant;
  orientation?: ChartOrientation;
  stacked?: boolean;
  minimalAxes?: boolean;
  showCumulativeLine?: boolean;
  controlLimits?: { mean: number; ucl: number; lcl: number };
  mirrorSeries?: ChartSeries[];
}
