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
        const parts = location.pathname.split('/').filter(Boolean);
        // Strip project base (e.g. lightDraw/) when present
        if (parts.length > 1 && path.startsWith(parts[0] + '/')) {
          path = path.slice(parts[0].length + 1);
        }
      } catch (_) {
        /* keep */
      }

      const file = path.replace(/^.*\b(docs\/)/, 'docs/');
      if (!file.startsWith('docs/') || file.includes('..')) return;

      e.preventDefault();
      const hash = href.includes('#') ? '#' + href.split('#').slice(1).join('#') : '';
      const basePath = location.pathname.includes('/lightDraw/') ? '/lightDraw/' : '/';
      // Prefer relative doc.html next to current page
      let docUrl = 'doc.html';
      try {
        docUrl = new URL('doc.html', location.href).pathname;
      } catch (_) {
        docUrl = basePath + 'doc.html';
      }
      location.href = docUrl + '?src=' + encodeURIComponent(file) + hash;
    });
  }

  global.SiteTheme = { apply, toggle, preferred, KEY, MSG };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(typeof window !== 'undefined' ? window : globalThis);
