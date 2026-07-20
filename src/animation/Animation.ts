import type { AnimationOptions, EasingFn } from '../types';
import type { Path } from '../shapes/index';
import { getEasing } from './Easing';
import { lerp, interpolateColor, now, requestFrame, cancelFrame } from '../utils';
import { getPathLength, getPointAtLength, morphPath } from '../utils/pathGeometry';

export type AnimatableProps = Record<string, number | string>;

interface AnimationState {
  id: number;
  target: Record<string, unknown>;
  from: AnimatableProps;
  to: AnimatableProps;
  startTime: number;
  duration: number;
  delay: number;
  easing: EasingFn;
  repeat: number;
  reverse: boolean;
  loop: boolean;
  iteration: number;
  reversed: boolean;
  motionPathD: string | null;
  pathLength: number;
  morphFrom: string | null;
  morphTo: string | null;
  onStart?: () => void;
  onUpdate?: (progress: number) => void;
  onComplete?: () => void;
  frameId: number;
  active: boolean;
  /** Wall-clock ms since startTime when pause() was called; null when running. */
  pausedElapsed: number | null;
}

let nextId = 1;
const activeAnimations: AnimationState[] = [];
let rafScheduled = false;
let pendingFrameId = 0;

function isColorProp(key: string): boolean {
  return key === 'fill' || key === 'stroke' || key === 'color' || key === 'background';
}

function applyProps(target: Record<string, unknown>, props: AnimatableProps): void {
  for (const key in props) {
    target[key] = props[key];
  }
  if (typeof (target as { markDirty?: () => void }).markDirty === 'function') {
    (target as { markDirty: () => void }).markDirty();
  }
}

function interpolateProps(
  from: AnimatableProps,
  to: AnimatableProps,
  t: number
): AnimatableProps {
  const result: AnimatableProps = {};
  for (const key in to) {
    const a = from[key];
    const b = to[key];
    if (typeof a === 'number' && typeof b === 'number') {
      result[key] = lerp(a, b, t);
    } else if (typeof a === 'string' && typeof b === 'string' && isColorProp(key)) {
      result[key] = interpolateColor(a, b, t);
    } else {
      result[key] = t < 1 ? a : b;
    }
  }
  return result;
}

function resolveMotionPath(motionPath: unknown): string | null {
  if (typeof motionPath === 'string') return motionPath;
  if (motionPath && typeof motionPath === 'object' && 'd' in motionPath) {
    return (motionPath as Path).d;
  }
  return null;
}

function cancelPendingTick(): void {
  if (rafScheduled && pendingFrameId) {
    cancelFrame(pendingFrameId);
    rafScheduled = false;
    pendingFrameId = 0;
  }
}

function tick(): void {
  rafScheduled = false;
  pendingFrameId = 0;
  const currentTime = now();
  let needsRedraw = false;

  for (let i = activeAnimations.length - 1; i >= 0; i--) {
    const anim = activeAnimations[i];
    if (!anim.active) continue;

    const elapsed = currentTime - anim.startTime - anim.delay;
    if (elapsed < 0) continue;

    let progress = anim.duration > 0 ? elapsed / anim.duration : 1;
    if (progress >= 1) {
      if (anim.loop || anim.iteration < anim.repeat) {
        anim.iteration++;
        if (anim.reverse) anim.reversed = !anim.reversed;
        anim.startTime = currentTime;
        progress = 0;
      } else {
        progress = 1;
      }
    }

    const eased = anim.easing(clampProgress(progress, anim.reversed));
    const from = anim.reversed ? anim.to : anim.from;
    const to = anim.reversed ? anim.from : anim.to;
    const current = interpolateProps(from, to, eased);

    if (anim.motionPathD) {
      const pt = getPointAtLength(anim.motionPathD, eased * anim.pathLength);
      current.x = pt.x;
      current.y = pt.y;
      if ('rotation' in anim.to || 'rotation' in anim.from) {
        current.rotation = pt.angle;
      }
    }

    if (anim.morphFrom && anim.morphTo) {
      current.d = morphPath(anim.morphFrom, anim.morphTo, eased);
    }

    applyProps(anim.target, current);
    anim.onUpdate?.(eased);
    needsRedraw = true;

    if (progress >= 1 && anim.iteration >= anim.repeat && !anim.loop) {
      anim.onComplete?.();
      anim.active = false;
      activeAnimations.splice(i, 1);
    }
  }

  if (activeAnimations.some((a) => a.active)) {
    scheduleTick();
  } else {
    cancelPendingTick();
  }

  if (needsRedraw) {
    AnimationEngine.onFrame?.();
  }
}

function clampProgress(t: number, reversed: boolean): number {
  return reversed ? 1 - t : t;
}

function scheduleTick(): void {
  if (!rafScheduled) {
    rafScheduled = true;
    pendingFrameId = requestFrame(tick);
  }
}

export class AnimationEngine {
  static onFrame: (() => void) | null = null;

  /** Test hook: whether a RAF callback is scheduled. */
  static isTickScheduled(): boolean {
    return rafScheduled;
  }

  static animate(
    target: Record<string, unknown>,
    options: AnimationOptions
  ): { stop: () => void; pause: () => void; resume: () => void } {
    const duration = (options.duration as number) ?? 300;
    const delay = (options.delay as number) ?? 0;
    const easing = getEasing((options.easing as string) ?? 'easeOut');
    const repeat = (options.repeat as number) ?? 0;
    const reverse = (options.reverse as boolean) ?? false;
    const loop = (options.loop as boolean) ?? false;

    const from: AnimatableProps = {};
    const to: AnimatableProps = {};
    const skipKeys = new Set([
      'duration',
      'delay',
      'easing',
      'repeat',
      'reverse',
      'loop',
      'onStart',
      'onUpdate',
      'onComplete',
      'motionPath',
      'morphTo',
    ]);

    for (const key in options) {
      if (skipKeys.has(key)) continue;
      const val = options[key];
      if (typeof val === 'number' || typeof val === 'string') {
        from[key] = target[key] as number | string;
        to[key] = val;
      }
    }

    const motionPathD = resolveMotionPath(options.motionPath);
    const pathLength = motionPathD ? getPathLength(motionPathD) : 0;
    const morphTo = options.morphTo as string | undefined;
    const morphFrom = morphTo && typeof target.d === 'string' ? target.d : null;

    const state: AnimationState = {
      id: nextId++,
      target,
      from,
      to,
      startTime: now(),
      duration,
      delay,
      easing,
      repeat,
      reverse,
      loop,
      iteration: 0,
      reversed: false,
      motionPathD,
      pathLength,
      morphFrom,
      morphTo: morphTo ?? null,
      onStart: options.onStart,
      onUpdate: options.onUpdate,
      onComplete: options.onComplete,
      frameId: 0,
      active: true,
      pausedElapsed: null,
    };

    options.onStart?.();
    activeAnimations.push(state);
    scheduleTick();

    return {
      stop: () => {
        state.active = false;
        state.pausedElapsed = null;
        const idx = activeAnimations.indexOf(state);
        if (idx >= 0) activeAnimations.splice(idx, 1);
        if (!activeAnimations.some((a) => a.active)) cancelPendingTick();
      },
      pause: () => {
        if (!state.active) return;
        state.pausedElapsed = Math.max(0, now() - state.startTime);
        state.active = false;
        if (!activeAnimations.some((a) => a.active)) cancelPendingTick();
      },
      resume: () => {
        if (state.active) return;
        const idx = activeAnimations.indexOf(state);
        if (idx < 0) return; // stopped
        const elapsed = state.pausedElapsed ?? 0;
        state.startTime = now() - elapsed;
        state.pausedElapsed = null;
        state.active = true;
        scheduleTick();
      },
    };
  }

  static stopAll(): void {
    activeAnimations.length = 0;
    cancelPendingTick();
  }
}

export function animate(
  target: Record<string, unknown>,
  options: AnimationOptions
): ReturnType<typeof AnimationEngine.animate> {
  return AnimationEngine.animate(target, options);
}
