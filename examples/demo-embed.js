/** Marks compact layout when demo runs inside the playground iframe + shell theme sync. */
(function () {
  const params = new URLSearchParams(location.search);
  const embedded = params.get('embed') === '1' || window.self !== window.top;
  if (embedded) {
    document.documentElement.classList.add('demo-embed');
  }
  // Help page supplies its own type tabs — hide the in-iframe type picker
  if (params.get('picker') === '0' || params.get('host') === 'help') {
    document.documentElement.classList.add('demo-embed-no-picker');
  }

  const MSG = 'ld-site-theme';
  const KEY = 'ld-site-theme';

  function applyShell(mode) {
    const next = mode === 'day' ? 'day' : 'night';
    document.documentElement.dataset.siteTheme = next;
    document.documentElement.dataset.demoTheme = next === 'day' ? 'light' : 'dark';
  }

  function bootShell() {
    const fromQuery = params.get('shell');
    if (fromQuery === 'day' || fromQuery === 'night') {
      applyShell(fromQuery);
      return;
    }
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === 'day' || saved === 'night') {
        applyShell(saved);
        return;
      }
    } catch (_) {
      /* ignore */
    }
    // Default shell: night / dark
    applyShell('night');
  }

  bootShell();

    window.addEventListener('message', (ev) => {
      const data = ev.data;
      if (!data || data.type !== MSG) return;
      if (data.theme === 'day' || data.theme === 'night') applyShell(data.theme);
    });

    /** Parent (help / hub) can switch diagram or animation type without scrolling a sidebar. */
    window.addEventListener('message', (ev) => {
      const data = ev.data;
      if (!data || data.type !== 'ld-demo-pick') return;
      try {
        if (data.demo === 'diagram' && typeof window.showDiagram === 'function' && data.id) {
          const btn = document.querySelector(`[data-diagram="${data.id}"]`);
          if (btn) {
            document.querySelectorAll('[data-diagram]').forEach((b) => b.classList.remove('is-active'));
            btn.classList.add('is-active');
          }
          window.showDiagram(data.id);
        }
        if (data.demo === 'animation' && typeof window.pickAnimationScene === 'function' && data.id) {
          window.pickAnimationScene(data.id);
        }
      } catch (_) {
        /* ignore */
      }
    });
})();
