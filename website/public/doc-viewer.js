/**
 * Markdown guide viewer — fetches docs/*.md and renders with marked + DOMPurify (CDN).
 * URL: doc.html?src=docs/getting-started.md
 */
(function () {
  'use strict';

  const ALLOWED_PREFIX = 'docs/';
  const DEFAULT_SRC = 'docs/README.md';

  function siteBase() {
    const path = location.pathname || '/';
    if (path.endsWith('/doc.html')) return path.slice(0, -'doc.html'.length) || '/';
    if (path.endsWith('/')) return path;
    const i = path.lastIndexOf('/');
    return i >= 0 ? path.slice(0, i + 1) : '/';
  }

  function joinBase(rel) {
    const base = siteBase();
    const clean = String(rel || '').replace(/^\//, '');
    return base + clean;
  }

  function normalizeSrc(raw) {
    let src = (raw || '').trim();
    if (!src) return DEFAULT_SRC;
    try {
      if (/^https?:\/\//i.test(src)) {
        const u = new URL(src);
        src = u.pathname.replace(/^\//, '');
      }
    } catch (_) {
      /* keep */
    }
    src = src.replace(/^\.\//, '').replace(/^\/+/, '');
    // Allow docs/foo.md or foo.md under docs/
    if (!src.startsWith(ALLOWED_PREFIX)) {
      if (src.endsWith('.md') && !src.includes('/')) src = ALLOWED_PREFIX + src;
      else if (src.startsWith('public/docs/')) src = src.slice('public/'.length);
    }
    if (!src.startsWith(ALLOWED_PREFIX) || src.includes('..') || !/\.md$/i.test(src)) {
      return null;
    }
    return src;
  }

  function currentSrc() {
    const q = new URLSearchParams(location.search);
    return normalizeSrc(q.get('src') || q.get('path') || DEFAULT_SRC);
  }

  function viewerHref(mdPath) {
    const src = normalizeSrc(mdPath);
    if (!src) return joinBase(mdPath);
    return joinBase('doc.html') + '?src=' + encodeURIComponent(src);
  }

  function rewriteMarkdownHref(href, currentMd) {
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return href;
    }
    if (/^https?:\/\//i.test(href)) return href;

    const baseDir = currentMd.replace(/[^/]+$/, '');
    let resolved = href;
    if (href.startsWith('./') || href.startsWith('../')) {
      try {
        resolved = new URL(href, 'https://doc.local/' + baseDir).pathname.replace(/^\//, '');
      } catch (_) {
        resolved = baseDir + href.replace(/^\.\//, '');
      }
    } else if (!href.includes('/') && href.endsWith('.md')) {
      resolved = baseDir + href;
    } else if (href.startsWith('/')) {
      resolved = href.replace(/^\//, '');
    }

    if (/\.md($|#)/i.test(resolved)) {
      const [path, hash] = resolved.split('#');
      const norm = normalizeSrc(path);
      if (norm) return viewerHref(norm) + (hash ? '#' + hash : '');
    }

    // API HTML or examples under public
    if (resolved.startsWith('docs/') || resolved.startsWith('examples/')) {
      return joinBase(resolved);
    }
    if (resolved.startsWith('../examples/')) {
      return joinBase(resolved.replace(/^\.\.\//, ''));
    }
    return href;
  }

  function setActiveNav(src) {
    document.querySelectorAll('.doc-nav a[href*="doc.html"]').forEach((a) => {
      try {
        const u = new URL(a.getAttribute('href'), location.href);
        const aSrc = normalizeSrc(u.searchParams.get('src') || '');
        const on = aSrc === src;
        a.classList.toggle('is-active', on);
        if (on) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      } catch (_) {
        a.classList.remove('is-active');
      }
    });
  }

  function titleFromMarkdown(md, src) {
    const m = md.match(/^#\s+(.+)$/m);
    if (m) return m[1].replace(/[\[\]]/g, '').trim();
    return src.replace(/^docs\//, '').replace(/\.md$/i, '');
  }

  let activeMdPath = DEFAULT_SRC;
  let markedReady = false;

  function ensureMarked() {
    if (markedReady || typeof marked === 'undefined') return;
    marked.use({
      gfm: true,
      breaks: false,
      walkTokens(token) {
        if (token.type === 'link' && token.href) {
          token.href = rewriteMarkdownHref(token.href, activeMdPath);
        }
        if (token.type === 'image' && token.href) {
          const href = token.href;
          if (!/^https?:\/\//i.test(href) && !href.startsWith('data:')) {
            try {
              const baseDir = activeMdPath.replace(/[^/]+$/, '');
              const resolved = new URL(href, 'https://doc.local/' + baseDir).pathname.replace(
                /^\//,
                ''
              );
              token.href = joinBase(resolved);
            } catch (_) {
              /* keep */
            }
          }
        }
      },
    });
    markedReady = true;
  }

  function renderMarkdown(md, src) {
    ensureMarked();
    activeMdPath = src;
    const dirty = marked.parse(md);
    const clean =
      typeof DOMPurify !== 'undefined'
        ? DOMPurify.sanitize(dirty, { USE_PROFILES: { html: true } })
        : dirty;
    const host = document.getElementById('doc-content');
    host.innerHTML = clean;

    if (typeof hljs !== 'undefined') {
      host.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
      });
    }

    // In-page hash after render
    if (location.hash) {
      const id = decodeURIComponent(location.hash.slice(1));
      const el =
        document.getElementById(id) ||
        (window.CSS && CSS.escape
          ? host.querySelector(`[id="${CSS.escape(id)}"]`)
          : null);
      if (el) el.scrollIntoView();
    }
  }

  async function load() {
    const src = currentSrc();
    const host = document.getElementById('doc-content');
    const crumb = document.getElementById('doc-crumb');
    const raw = document.getElementById('doc-raw');

    if (!src) {
      host.innerHTML =
        '<p class="doc-error">Only Markdown under <code>docs/</code> can be opened here.</p>';
      return;
    }

    setActiveNav(src);
    if (raw) raw.href = joinBase(src);
    if (crumb) crumb.textContent = src.replace(/^docs\//, '');

    host.innerHTML = '<p class="doc-loading">Loading guide…</p>';

    try {
      const res = await fetch(joinBase(src), { cache: 'no-cache' });
      if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
      const md = await res.text();
      const title = titleFromMarkdown(md, src);
      document.title = title + ' — LightDraw Docs';
      if (crumb) crumb.textContent = title;
      renderMarkdown(md, src);
    } catch (err) {
      host.innerHTML =
        '<p class="doc-error">Could not load <code>' +
        src +
        '</code>. ' +
        (err && err.message ? err.message : '') +
        '</p>';
    }
  }

  /** Rewrite any remaining .md guide links on the current page to the viewer. */
  function interceptMarkdownLinks(root) {
    (root || document).addEventListener('click', (e) => {
      const a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || a.target === '_blank') return;
      if (!/\.md($|\?|#)/i.test(href)) return;
      if (/^https?:\/\//i.test(href) && href.indexOf(location.host) === -1) return;

      let path = href.split('#')[0].split('?')[0];
      try {
        path = new URL(href, location.href).pathname.replace(/^\//, '');
        // Strip site base (e.g. lightDraw/)
        const base = siteBase().replace(/^\//, '').replace(/\/$/, '');
        if (base && path.startsWith(base + '/')) path = path.slice(base.length + 1);
      } catch (_) {
        /* keep */
      }

      const norm = normalizeSrc(path.replace(/^.*\b(docs\/)/, 'docs/'));
      if (!norm && path.indexOf('docs/') === -1) {
        // try relative to docs/
        const alt = normalizeSrc('docs/' + path.split('/').pop());
        if (!alt) return;
        e.preventDefault();
        location.href = viewerHref(alt);
        return;
      }
      if (!norm) return;
      e.preventDefault();
      const hash = href.includes('#') ? '#' + href.split('#')[1] : '';
      location.href = viewerHref(norm) + hash;
    });
  }

  window.DocViewer = { load, viewerHref, normalizeSrc, interceptMarkdownLinks };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      interceptMarkdownLinks(document);
      load();
    });
  } else {
    interceptMarkdownLinks(document);
    load();
  }

  window.addEventListener('popstate', load);
})();
