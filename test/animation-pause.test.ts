import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AnimationEngine } from '../src/animation/Animation';
import * as utils from '../src/utils';

describe('AnimationEngine pause/resume progress', () => {
  let fakeNow = 0;

  beforeEach(() => {
    fakeNow = 0;
    vi.spyOn(utils, 'now').mockImplementation(() => fakeNow);
    vi.spyOn(utils, 'requestFrame').mockImplementation((cb) => {
      return setTimeout(() => cb(fakeNow), 0) as unknown as number;
    });
    vi.spyOn(utils, 'cancelFrame').mockImplementation((id) => {
      clearTimeout(id as unknown as ReturnType<typeof setTimeout>);
    });
  });

  afterEach(() => {
    AnimationEngine.stopAll();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('resume continues from paused progress (not from start)', async () => {
    vi.useFakeTimers();
    const target = { x: 0 };
    const control = AnimationEngine.animate(target as unknown as Record<string, unknown>, {
      x: 100,
      duration: 1000,
      easing: 'linear',
    });

    fakeNow = 400;
    await vi.advanceTimersByTimeAsync(1);
    expect(target.x).toBeCloseTo(40, 0);

    control.pause();
    const pausedX = target.x;

    fakeNow = 900; // wall clock advances while paused
    await vi.advanceTimersByTimeAsync(1);
    expect(target.x).toBe(pausedX);

    control.resume();
    fakeNow = 900 + 100; // 100ms more of animation → ~50% total
    await vi.advanceTimersByTimeAsync(1);
    expect(target.x).toBeCloseTo(50, 0);
  });
});
