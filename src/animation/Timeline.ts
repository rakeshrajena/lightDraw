import type { AnimationOptions } from '../types';
import { AnimationEngine } from './Animation';
import type { Node } from '../Node';

type TimelineStep = {
  type: 'animate' | 'delay' | 'callback' | 'stagger';
  target?: Node | Record<string, unknown>;
  options?: AnimationOptions;
  delay?: number;
  fn?: () => void;
  nodes?: (Node | Record<string, unknown>)[];
  staggerMs?: number;
};

export class Timeline {
  private steps: TimelineStep[] = [];
  private _playing = false;
  private _paused = false;
  private currentIndex = 0;
  private currentControl: { stop: () => void } | null = null;

  move(target: Node | Record<string, unknown>, props: Record<string, unknown>): this {
    return this.animate(target, { ...props, duration: (props.duration as number) ?? 300 });
  }

  rotate(target: Node, degrees: number, duration = 300): this {
    return this.animate(target, { rotation: target.rotation + degrees, duration });
  }

  scale(target: Node, scale: number, duration = 300): this {
    return this.animate(target, { scaleX: scale, scaleY: scale, duration });
  }

  fade(target: Node, opacity: number, duration = 300): this {
    return this.animate(target, { opacity, duration });
  }

  animate(
    target: Node | Record<string, unknown>,
    options: AnimationOptions
  ): this {
    this.steps.push({ type: 'animate', target, options });
    return this;
  }

  wait(ms: number): this {
    this.steps.push({ type: 'delay', delay: ms });
    return this;
  }

  call(fn: () => void): this {
    this.steps.push({ type: 'callback', fn });
    return this;
  }

  /** Run the same animation on multiple nodes with staggered start delays. */
  stagger(
    nodes: (Node | Record<string, unknown>)[],
    options: AnimationOptions,
    staggerMs: number
  ): this {
    this.steps.push({ type: 'stagger', nodes, options, staggerMs });
    return this;
  }

  play(): this {
    if (this._playing && !this._paused) return this;
    this._playing = true;
    this._paused = false;
    this.runStep(this.currentIndex);
    return this;
  }

  pause(): this {
    this._paused = true;
    this.currentControl?.stop();
    this.currentControl = null;
    return this;
  }

  stop(): this {
    this._playing = false;
    this._paused = false;
    this.currentIndex = 0;
    this.currentControl?.stop();
    this.currentControl = null;
    return this;
  }

  private runStep(index: number): void {
    if (!this._playing || this._paused || index >= this.steps.length) {
      if (index >= this.steps.length) {
        this._playing = false;
        this.currentIndex = 0;
      }
      return;
    }

    this.currentIndex = index;
    const step = this.steps[index];

    if (step.type === 'delay') {
      setTimeout(() => this.runStep(index + 1), step.delay ?? 0);
      return;
    }

    if (step.type === 'callback') {
      step.fn?.();
      this.runStep(index + 1);
      return;
    }

    if (step.type === 'stagger' && step.nodes && step.options) {
      let remaining = step.nodes.length;
      if (remaining === 0) {
        this.runStep(index + 1);
        return;
      }
      for (let i = 0; i < step.nodes.length; i++) {
        const node = step.nodes[i];
        const opts = {
          ...step.options,
          delay: (step.options.delay ?? 0) + i * (step.staggerMs ?? 0),
          onComplete: () => {
            step.options?.onComplete?.();
            remaining--;
            if (remaining === 0) this.runStep(index + 1);
          },
        };
        AnimationEngine.animate(node as Record<string, unknown>, opts);
      }
      return;
    }

    if (step.type === 'animate' && step.target && step.options) {
      const opts = {
        ...step.options,
        onComplete: () => {
          step.options?.onComplete?.();
          this.runStep(index + 1);
        },
      };
      this.currentControl = AnimationEngine.animate(
        step.target as Record<string, unknown>,
        opts
      );
    }
  }
}

export function parallel(
  animations: Array<{ target: Record<string, unknown>; options: AnimationOptions }>
): Promise<void> {
  return new Promise((resolve) => {
    let remaining = animations.length;
    if (remaining === 0) {
      resolve();
      return;
    }
    for (const { target, options } of animations) {
      AnimationEngine.animate(target, {
        ...options,
        onComplete: () => {
          options.onComplete?.();
          remaining--;
          if (remaining === 0) resolve();
        },
      });
    }
  });
}
