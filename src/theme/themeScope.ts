/**
 * Per-App theme storage + build-time stack.
 *
 * Builders call `getActive*()` without an App argument. Wrapping each create/rebuild
 * in `runWith` makes the correct palette available on the stack (single-threaded JS),
 * while `WeakMap` keeps an App-scoped snapshot for lookups after build.
 */

export interface ThemeScope<T> {
  /** Push theme for the duration of a synchronous factory/rebuild. */
  runWithResult: <R>(theme: T, fn: () => R) => R;
  /** Active palette: stack top → App WeakMap → last sync → fallback. */
  getActive: (app?: object | null) => T;
  /** Store App-scoped snapshot and update last-sync fallback. */
  sync: (theme: T, app?: object | null) => T;
}

export function createThemeScope<T>(fallback: () => T): ThemeScope<T> {
  const byApp = new WeakMap<object, T>();
  const stack: T[] = [];
  let last: T = fallback();

  return {
    runWithResult<R>(theme: T, fn: () => R): R {
      stack.push(theme);
      try {
        return fn();
      } finally {
        stack.pop();
      }
    },
    getActive(app?: object | null): T {
      if (stack.length > 0) return stack[stack.length - 1]!;
      if (app && byApp.has(app)) return byApp.get(app)!;
      return last;
    },
    sync(theme: T, app?: object | null): T {
      last = theme;
      if (app) byApp.set(app, theme);
      return theme;
    },
  };
}
