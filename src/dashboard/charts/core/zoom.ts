import type { Group } from '../../../shapes/Group';
import type { Node } from '../../../Node';
import type { LightDrawEvent } from '../../../types';
import { getState, setState } from '../../helpers';
import type { ChartBounds } from '../../chartPrimitives';

/** Wheel zoom on cartesian plot — adjusts minY/maxY in widget state and rebuilds. */
export function attachPlotWheelZoom(
  group: Group,
  hitArea: Node,
  bounds: ChartBounds,
  options: { minSpan?: number; factor?: number } = {}
): void {
  const minSpan = options.minSpan ?? 1;
  const factor = options.factor ?? 1.12;

  const applyZoom = (direction: number) => {
    const state = getState(group);
    const minY = typeof state.minY === 'number' ? state.minY : bounds.min;
    const maxY = typeof state.maxY === 'number' ? state.maxY : bounds.max;
    const mid = (minY + maxY) / 2;
    let half = ((maxY - minY) / 2) * (direction > 0 ? factor : 1 / factor);
    half = Math.max(minSpan / 2, half);
    setState(group, { minY: mid - half, maxY: mid + half });
    const rebuild = group.metadata?.chartRebuild as (() => void) | undefined;
    rebuild?.();
    group.getApp()?.requestRender();
  };

  const onWheel = (e: LightDrawEvent) => {
    const we = e.originalEvent as WheelEvent;
    const dy = we.deltaY ?? 0;
    if (dy === 0) return;
    e.preventDefault();
    e.stopPropagation();
    applyZoom(dy > 0 ? 1 : -1);
  };

  group.on('wheel', onWheel);
  hitArea.on('wheel', onWheel);
}
