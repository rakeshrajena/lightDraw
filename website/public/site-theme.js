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

  /** Public site base path (`/` locally, `/lightDraw/` on GitHub Pages). */
  function siteBase() {
    const path = location.pathname || '/';
    if (path.endsWith('/')) return path;
    const file = path.split('/').pop() || '';
    if (file.includes('.')) {
      const dir = path.slice(0, -file.length);
      return dir || '/';
    }
    return path.endsWith('/') ? path : path + '/';
  }

  function siteUrl(rel) {
    return new URL(String(rel || '').replace(/^\//, ''), location.origin + siteBase()).href;
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
    wireMarkdownGuideLinks();
  }

  /** Send docs/*.md links through doc.html viewer (rendered Markdown). */
  function wireMarkdownGuideLinks() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest && e.target.closest('a[href]');
      if (!a || a.target === '_blank') return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:')) return;
      if (!/\.md($|\?|#)/i.test(href)) return;
      if (/^https?:\/\//i.test(href) && href.indexOf(location.host) === -1) return;

      let path = href.split('#')[0].split('?')[0];
      try {
        const u = new URL(href, location.href);
        path = u.pathname.replace(/^\//, '');
        const base = siteBase().replace(/^\//, '').replace(/\/$/, '');
        if (base && path.startsWith(base + '/')) {
          path = path.slice(base.length + 1);
        }
      } catch (_) {
        /* keep */
      }

      const file = path.replace(/^.*\b(docs\/)/, 'docs/');
      if (!file.startsWith('docs/') || file.includes('..')) return;

      e.preventDefault();
      const hash = href.includes('#') ? '#' + href.split('#').slice(1).join('#') : '';
      const u = new URL('doc.html', location.origin + siteBase());
      u.searchParams.set('src', file);
      location.href = u.href + hash;
    });
  }

  global.SiteTheme = { apply, toggle, preferred, siteBase, siteUrl, KEY, MSG };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(typeof window !== 'undefined' ? window : globalThis);
