/**
 * Site chrome theme (day / night) + iframe sync.
 * Persist: localStorage key `ld-site-theme` = 'day' | 'night'
 */
(function (global) {
  'use strict';

  const KEY = 'ld-site-theme';
  const MSG = 'ld-site-theme';

  function preferred() {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === 'day' || saved === 'night') return saved;
    } catch (_) {
      /* ignore */
    }
    // Default chrome: night / dark (Day is opt-in via the toggle)
    return 'night';
  }

  function apply(mode, opts) {
    const next = mode === 'day' ? 'day' : 'night';
    document.documentElement.dataset.siteTheme = next;
    document.documentElement.dataset.demoTheme = next === 'day' ? 'light' : 'dark';
    try {
      localStorage.setItem(KEY, next);
    } catch (_) {
      /* ignore */
    }
    const btn = document.getElementById('btn-site-theme');
    if (btn) {
      btn.setAttribute('aria-pressed', next === 'day' ? 'true' : 'false');
      btn.title = next === 'day' ? 'Switch to night' : 'Switch to day';
      btn.dataset.theme = next;
      const label = btn.querySelector('[data-theme-label]');
      if (label) label.textContent = next === 'day' ? 'Day' : 'Night';
    }
    if (!(opts && opts.silent)) {
      document.querySelectorAll('iframe').forEach((frame) => {
        try {
          frame.contentWindow?.postMessage({ type: MSG, theme: next }, '*');
        } catch (_) {
          /* cross-origin */
        }
      });
    }
    return next;
  }

  function toggle() {
    const cur = document.documentElement.dataset.siteTheme || preferred();
    return apply(cur === 'day' ? 'night' : 'day');
  }

  function boot() {
    apply(preferred(), { silent: true });
    document.getElementById('btn-site-theme')?.addEventListener('click', () => toggle());
    // Re-broadcast when iframes load
    document.querySelectorAll('iframe').forEach((frame) => {
      frame.addEventListener('load', () => {
        const theme = document.documentElement.dataset.siteTheme || preferred();
        try {
          frame.contentWindow?.postMessage({ type: MSG, theme }, '*');
        } catch (_) {
          /* ignore */
        }
      });
    });
  }

  global.SiteTheme = { apply, toggle, preferred, KEY, MSG };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(typeof window !== 'undefined' ? window : globalThis);
