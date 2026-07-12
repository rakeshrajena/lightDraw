/**
 * Shared live code playground for LightDraw demos.
 * Tabs: Scene JSON · editable API snippet.
 * Put theme on the scene root (`{ theme, type, children }`) — no separate Theme tab.
 *
 *   LivePlayground.mount({
 *     app: () => app,
 *     getScene: () => lastAuthorScene,
 *     applyScene: (json) => { app.clear(); app.loadJSON(json); },
 *     getSnippet / applySnippet,  // optional
 *     panes: ['scene', 'snippet'], // default
 *   });
 *   LivePlayground.syncScene(true);
 */
(function (global) {
  'use strict';

  const DEFAULT_PANES = ['scene', 'snippet'];
  let state = null;

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function isLive() {
    const el = $('#pg-opt-live');
    return !el || el.checked;
  }

  function resolveApp() {
    if (!state || typeof state.opts.app !== 'function') return null;
    try {
      return state.opts.app();
    } catch (_) {
      return null;
    }
  }

  function defaultGetTheme() {
    const app = resolveApp();
    if (!app) return {};
    if (typeof app.getTheme === 'function') return app.getTheme() || {};
    if (typeof app.getUiTheme === 'function') return app.getUiTheme() || {};
    return {};
  }

  function defaultApplyTheme(pack) {
    const app = resolveApp();
    if (!app) throw new Error('No app');
    if (typeof app.applyTheme === 'function') app.applyTheme(pack);
    else if (typeof app.setUiTheme === 'function') app.setUiTheme(pack, { replace: true });
    else throw new Error('App has no applyTheme / setUiTheme');
  }

  function setStatus(msg, tone) {
    if (!state) return;
    const el = state.statusEl;
    if (el) {
      el.textContent = msg;
      el.dataset.tone = tone || 'ok';
    }
    const toggle = $('.pg-live-toggle', state.root);
    const label = $('#pg-live-pill-label', state.root);
    if (!toggle) return;
    if (tone === 'err') {
      toggle.dataset.state = 'err';
      if (label) label.textContent = 'Error';
    } else if (!isLive()) {
      toggle.dataset.state = 'off';
      if (label) label.textContent = 'Paused';
    } else {
      toggle.dataset.state = 'on';
      if (label) label.textContent = 'Live';
    }
  }

  function editorFocused(id) {
    return document.activeElement && document.activeElement.id === id;
  }

  function ensureHost(hostOpt) {
    if (hostOpt) {
      const el = typeof hostOpt === 'string' ? $(hostOpt) : hostOpt;
      if (el) return el;
    }
    let host = $('#live-dock-host');
    if (host) return host;
    host = document.createElement('div');
    host.id = 'live-dock-host';
    const main = $('.demo-main') || $('.pg-workspace') || document.body;
    main.appendChild(host);
    return host;
  }

  function paneLabels(panes) {
    const map = {
      scene: 'JSON',
      theme: 'Theme JSON',
      snippet: 'API code',
      config: 'JSON',
    };
    return panes.map((p) => ({ id: p, label: map[p] || p }));
  }

  function buildDockHtml(panes, startCollapsed) {
    const tabs = paneLabels(panes)
      .map(
        (p, i) =>
          `<button type="button" class="pg-code-tab${i === 0 ? ' is-active' : ''}" role="tab" aria-selected="${
            i === 0 ? 'true' : 'false'
          }" data-pane="${p.id}">${p.label}</button>`
      )
      .join('');
    const panesHtml = panes
      .map((id, i) => {
        const active = i === 0 ? ' is-active' : '';
        const hidden = i === 0 ? '' : ' hidden';
        return (
          `<div class="pg-code-pane${active}" id="pg-pane-${id}" role="tabpanel"${hidden}>` +
          `<textarea id="pg-editor-${id}" class="pg-code-editor" spellcheck="false" ` +
          `aria-label="${id} editor"></textarea></div>`
        );
      })
      .join('');

    return (
      `<section class="pg-code-dock${startCollapsed ? ' is-collapsed' : ''}" id="pg-code-dock" aria-label="Code editors">` +
      `<div class="pg-code-chrome">` +
      `<div class="pg-code-tabs" role="tablist">${tabs}</div>` +
      `<div class="pg-code-actions">` +
      `<label class="pg-live-toggle" title="Auto-apply JSON edits">` +
      `<input type="checkbox" id="pg-opt-live" checked>` +
      `<span class="pg-live-toggle-ui"><span class="pg-live-dot" aria-hidden="true"></span>` +
      `<span id="pg-live-pill-label">Live</span></span></label>` +
      `<button type="button" class="demo-btn" id="pg-btn-run">Run</button>` +
      `<button type="button" class="demo-btn secondary pg-btn-secondary" id="pg-btn-format">Format</button>` +
      `<button type="button" class="demo-btn secondary pg-btn-secondary" id="pg-btn-copy">Copy</button>` +
      `<button type="button" class="demo-btn secondary pg-btn-secondary" id="pg-btn-reset-snippet" title="Reset API from Scene JSON">Reset</button>` +
      `<button type="button" class="demo-btn secondary" id="pg-btn-toggle" aria-expanded="${
        startCollapsed ? 'false' : 'true'
      }" title="${startCollapsed ? 'Expand code' : 'Collapse code'}">${startCollapsed ? 'Code ▸' : 'Code ▾'}</button>` +
      `</div></div>` +
      `<div class="pg-code-body">${panesHtml}` +
      `<div class="pg-code-status" id="pg-code-status" data-tone="ok">Edit JSON · API</div>` +
      `</div></section>`
    );
  }

  function setPane(pane) {
    if (!state || !state.panes.includes(pane)) return;
    state.activePane = pane;
    state.root.querySelectorAll('.pg-code-tab').forEach((tab) => {
      const on = tab.dataset.pane === pane;
      tab.classList.toggle('is-active', on);
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    state.panes.forEach((id) => {
      const panel = $(`#pg-pane-${id}`, state.root);
      if (!panel) return;
      const on = id === pane;
      panel.classList.toggle('is-active', on);
      panel.hidden = !on;
    });
  }

  function indentBlock(json, spaces) {
    const pad = ' '.repeat(spaces);
    return JSON.stringify(json, null, 2)
      .split('\n')
      .map((line, i) => (i === 0 ? line : pad + line))
      .join('\n');
  }

  function defaultSnippet(scene, theme) {
    const themeObj = theme && typeof theme === 'object' ? theme : {};
    const base = scene && typeof scene === 'object' ? { ...scene } : { type: 'group', children: [] };
    // Prefer theme already on the scene; otherwise attach current app theme for the snippet.
    if (
      themeObj &&
      Object.keys(themeObj).length > 0 &&
      !(base.theme && typeof base.theme === 'object' && Object.keys(base.theme).length > 0)
    ) {
      base.theme = themeObj;
    }
    return (
      `// Editable API — click Run (or Ctrl/Cmd+Enter) to execute\n` +
      `const app = LightDraw.createApp('#app', {\n` +
      `  renderer: 'canvas',\n` +
      `  background: '#0d1322',\n` +
      `});\n\n` +
      `app.loadJSON(${indentBlock(base, 0)});\n\n` +
      `// Theme lives on the scene root: { theme: { preset: 'dark', primary: '#0ea5e9' }, … }\n` +
      `// Or at runtime: app.applyTheme({ primary: 'pink', fontSize: '16px' });\n`
    );
  }

  function readEditorScene() {
    if (!state) return state && state.lastScene;
    try {
      if (state.panes.includes('scene') || state.panes.includes('config')) {
        const key = state.panes.includes('scene') ? 'scene' : 'config';
        return JSON.parse($(`#pg-editor-${key}`, state.root).value || 'null');
      }
    } catch (_) {
      /* keep last */
    }
    return state.lastScene;
  }

  function readEditorTheme() {
    if (!state) return {};
    try {
      if (state.panes.includes('theme')) {
        return JSON.parse($('#pg-editor-theme', state.root).value || '{}');
      }
    } catch (_) {
      /* fall through */
    }
    const getTheme = state.opts.getTheme || defaultGetTheme;
    try {
      return getTheme() || {};
    } catch (_) {
      return {};
    }
  }

  function updateSnippet(force) {
    if (!state || !state.panes.includes('snippet')) return;
    const el = $('#pg-editor-snippet', state.root);
    if (!el) return;
    if (!force && (state.snippetDirty || editorFocused('pg-editor-snippet'))) return;
    const scene = readEditorScene();
    const theme = readEditorTheme();
    const fn = state.opts.getSnippet || defaultSnippet;
    state.syncing = true;
    el.value = fn(scene, theme);
    state.snippetDirty = false;
    state.syncing = false;
  }

  function syncScene(force) {
    if (!state) return;
    const key = state.panes.includes('scene') ? 'scene' : state.panes.includes('config') ? 'config' : null;
    if (!key || typeof state.opts.getScene !== 'function') return;
    if (!force && editorFocused(`pg-editor-${key}`)) return;
    const scene = state.opts.getScene();
    if (scene == null) return;
    state.lastScene = scene;
    const el = $(`#pg-editor-${key}`, state.root);
    if (!el) return;
    state.syncing = true;
    el.value = JSON.stringify(scene, null, 2);
    state.syncing = false;
    updateSnippet(false);
  }

  function syncTheme(force) {
    if (!state || !state.panes.includes('theme')) return;
    const getTheme = state.opts.getTheme || defaultGetTheme;
    if (!force && editorFocused('pg-editor-theme')) return;
    let theme = {};
    try {
      theme = getTheme() || {};
    } catch (_) {
      theme = {};
    }
    const el = $('#pg-editor-theme', state.root);
    if (!el) return;
    state.syncing = true;
    el.value = JSON.stringify(theme, null, 2);
    state.syncing = false;
    updateSnippet(false);
  }

  function formatEditorJsonError(raw, err, label) {
    const LD = global.LightDraw;
    if (LD && typeof LD.formatJsonParseError === 'function') {
      return (label ? label + ' — ' : '') + LD.formatJsonParseError(raw, err);
    }
    const msg = err && err.message ? err.message : String(err);
    return (label ? label + ': ' : '') + msg;
  }

  function parseSceneOrExplain(raw) {
    const LD = global.LightDraw;
    if (LD && typeof LD.parseAndValidateSceneJSON === 'function') {
      const { json, validation } = LD.parseAndValidateSceneJSON(raw);
      if (!validation.valid) {
        const text =
          typeof LD.formatValidationErrors === 'function'
            ? LD.formatValidationErrors(validation)
            : validation.errors.join('\n');
        return { ok: false, error: text, json: null };
      }
      return { ok: true, json: json, error: null };
    }
    try {
      return { ok: true, json: JSON.parse(raw), error: null };
    } catch (err) {
      return { ok: false, error: formatEditorJsonError(raw, err, 'JSON'), json: null };
    }
  }

  function applySceneFromEditor(opts) {
    if (!state) return false;
    const key = state.panes.includes('scene') ? 'scene' : state.panes.includes('config') ? 'config' : null;
    if (!key || typeof state.opts.applyScene !== 'function') return false;
    const el = $(`#pg-editor-${key}`, state.root);
    const label = key === 'config' ? 'Config' : 'Scene';
    const result = parseSceneOrExplain(el.value);
    if (!result.ok) {
      setStatus(result.error, 'err');
      return false;
    }
    try {
      state.opts.applyScene(result.json);
      state.lastScene = result.json;
      updateSnippet(false);
      setStatus(label + ' applied · live', 'ok');
      if (!(opts && opts.silent) && typeof state.opts.onApplied === 'function') {
        state.opts.onApplied('scene', result.json);
      }
      return true;
    } catch (err) {
      setStatus(label + ': ' + (err && err.message ? err.message : err), 'err');
      return false;
    }
  }

  function applyThemeFromEditor(opts) {
    if (!state || !state.panes.includes('theme')) return false;
    const applyTheme = state.opts.applyTheme || defaultApplyTheme;
    const el = $('#pg-editor-theme', state.root);
    let pack;
    try {
      pack = JSON.parse(el.value || '{}');
    } catch (err) {
      setStatus(formatEditorJsonError(el.value, err, 'Theme JSON'), 'err');
      return false;
    }
    try {
      if (pack === null || typeof pack !== 'object' || Array.isArray(pack)) {
        setStatus(
          'Theme JSON: root must be an object (theme pack), got ' +
            (pack === null ? 'null' : Array.isArray(pack) ? 'array' : typeof pack),
          'err'
        );
        return false;
      }
      const LD = global.LightDraw;
      if (LD && typeof LD.validateThemePack === 'function') {
        const validation = LD.validateThemePack(pack);
        if (!validation.valid) {
          const text =
            typeof LD.formatValidationErrors === 'function'
              ? LD.formatValidationErrors(validation)
              : validation.errors.join('\n');
          setStatus(text, 'err');
          return false;
        }
      }
      applyTheme(pack);
      updateSnippet(false);
      setStatus('Theme applied · live', 'ok');
      if (!(opts && opts.silent) && typeof state.opts.onApplied === 'function') {
        state.opts.onApplied('theme', pack);
      }
      return true;
    } catch (err) {
      setStatus('Theme: ' + (err && err.message ? err.message : err), 'err');
      return false;
    }
  }

  /**
   * Run editable API code. Prefer opts.applySnippet; otherwise execute with
   * LightDraw + current app in scope. Supports loadJSON / applyTheme shortcuts.
   */
  function applySnippetFromEditor(opts) {
    if (!state || !state.panes.includes('snippet')) return false;
    const el = $('#pg-editor-snippet', state.root);
    const code = el.value;
    try {
      if (typeof state.opts.applySnippet === 'function') {
        state.opts.applySnippet(code);
      } else {
        const app = resolveApp();
        const host = $('#app') || document.body;
        // Demo sandbox: intentional for local playground editing
        const runner = new Function(
          'LightDraw',
          'app',
          'host',
          `"use strict";\n${code}\n`
        );
        runner(global.LightDraw, app, host);
        // If snippet called loadJSON on the live app, refresh scene editor from app
        if (app && typeof state.opts.getScene === 'function') {
          try {
            const next = state.opts.getScene();
            if (next) {
              state.lastScene = next;
              if (!editorFocused('pg-editor-scene') && state.panes.includes('scene')) {
                const sceneEl = $('#pg-editor-scene', state.root);
                if (sceneEl) {
                  state.syncing = true;
                  sceneEl.value = JSON.stringify(next, null, 2);
                  state.syncing = false;
                }
              }
            }
          } catch (_) {
            /* ignore */
          }
        }
        syncTheme(true);
      }
      setStatus('API code executed', 'ok');
      if (!(opts && opts.silent) && typeof state.opts.onApplied === 'function') {
        state.opts.onApplied('snippet', code);
      }
      return true;
    } catch (err) {
      setStatus('API: ' + (err && err.message ? err.message : err), 'err');
      return false;
    }
  }

  function schedule(kind) {
    if (!state || state.syncing) return;
    const timerKey =
      kind === 'theme' ? 'themeTimer' : kind === 'snippet' ? 'snippetTimer' : 'sceneTimer';
    clearTimeout(state[timerKey]);
    if (!isLive()) {
      setStatus('Paused — click Run to apply', 'warn');
      return;
    }
    // Snippet auto-run only when explicitly enabled (can recreate apps)
    if (kind === 'snippet' && !state.opts.liveSnippet) {
      setStatus('API edited — click Run to execute', 'warn');
      return;
    }
    state[timerKey] = setTimeout(() => {
      if (kind === 'theme') applyThemeFromEditor({ silent: true });
      else if (kind === 'snippet') applySnippetFromEditor({ silent: true });
      else applySceneFromEditor({ silent: true });
    }, state.opts.debounceMs || 320);
  }

  function runActive() {
    if (!state) return;
    if (state.activePane === 'theme') applyThemeFromEditor();
    else if (state.activePane === 'snippet') applySnippetFromEditor();
    else applySceneFromEditor();
  }

  function formatActive() {
    if (!state) return;
    if (state.activePane === 'snippet') {
      setStatus('API code — use Format on JSON tabs', 'warn');
      return;
    }
    const el = $(`#pg-editor-${state.activePane}`, state.root);
    if (!el) return;
    try {
      el.value = JSON.stringify(JSON.parse(el.value), null, 2);
      setStatus('Formatted', 'ok');
    } catch (err) {
      setStatus(formatEditorJsonError(el.value, err, 'Format'), 'err');
    }
  }

  async function copyActive() {
    if (!state) return;
    const el = $(`#pg-editor-${state.activePane}`, state.root);
    if (!el) return;
    try {
      await navigator.clipboard.writeText(el.value);
      setStatus('Copied to clipboard', 'ok');
    } catch (_) {
      el.select();
      setStatus('Select-all ready — Ctrl/Cmd+C', 'warn');
    }
  }

  function bindEvents() {
    state.root.querySelectorAll('.pg-code-tab').forEach((tab) => {
      tab.addEventListener('click', () => setPane(tab.dataset.pane));
    });
    $('#pg-btn-run', state.root).addEventListener('click', runActive);
    $('#pg-btn-format', state.root).addEventListener('click', formatActive);
    $('#pg-btn-copy', state.root).addEventListener('click', () => {
      copyActive();
    });
    const resetBtn = $('#pg-btn-reset-snippet', state.root);
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        state.snippetDirty = false;
        updateSnippet(true);
        setStatus('API code reset from Scene JSON', 'ok');
      });
    }
    $('#pg-btn-toggle', state.root).addEventListener('click', () => {
      const dock = $('#pg-code-dock', state.root);
      const collapsed = dock.classList.toggle('is-collapsed');
      const btn = $('#pg-btn-toggle', state.root);
      btn.textContent = collapsed ? 'Code ▸' : 'Code ▾';
      btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      btn.title = collapsed ? 'Expand code' : 'Collapse code';
    });
    $('#pg-opt-live', state.root).addEventListener('change', () => {
      setStatus(isLive() ? 'Live auto-apply on' : 'Paused — click Run', isLive() ? 'ok' : 'warn');
      if (isLive() && state.activePane !== 'snippet') runActive();
    });

    ['scene', 'config'].forEach((id) => {
      const el = $(`#pg-editor-${id}`, state.root);
      if (!el) return;
      el.addEventListener('input', () => schedule('scene'));
      el.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
          e.preventDefault();
          applySceneFromEditor();
        }
      });
    });
    const themeEl = $('#pg-editor-theme', state.root);
    if (themeEl) {
      themeEl.addEventListener('input', () => schedule('theme'));
      themeEl.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
          e.preventDefault();
          applyThemeFromEditor();
        }
      });
    }
    const snipEl = $('#pg-editor-snippet', state.root);
    if (snipEl) {
      snipEl.addEventListener('input', () => {
        if (!state.syncing) state.snippetDirty = true;
        schedule('snippet');
      });
      snipEl.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
          e.preventDefault();
          applySnippetFromEditor();
        }
      });
    }
  }

  function normalizePanes(opts) {
    let panes = opts.panes && opts.panes.length ? opts.panes.slice() : DEFAULT_PANES.slice();
    // Drop legacy Theme tab — theme belongs on Scene JSON (`root.theme`)
    panes = panes.filter((p) => p !== 'theme');
    if (!panes.includes('snippet')) panes.push('snippet');
    if (!panes.includes('scene') && !panes.includes('config') && typeof opts.getScene === 'function') {
      panes.unshift('scene');
    }
    if (!panes.length) panes = DEFAULT_PANES.slice();
    return panes;
  }

  function mount(opts) {
    destroy();
    const panes = normalizePanes(opts || {});
    // Open by default so JSON is readable; caller can pass startCollapsed: true
    const startCollapsed = opts.startCollapsed != null ? opts.startCollapsed : false;
    const host = ensureHost(opts.host);
    host.innerHTML = buildDockHtml(panes, startCollapsed);

    const main = $('.demo-main');
    if (main && !main.classList.contains('pg-workspace')) {
      main.classList.add('pg-has-live-dock');
    }

    state = {
      opts: Object.assign(
        {
          getTheme: defaultGetTheme,
          applyTheme: defaultApplyTheme,
        },
        opts || {}
      ),
      panes,
      activePane: panes[0],
      root: host,
      statusEl: $('#pg-code-status', host),
      syncing: false,
      snippetDirty: false,
      sceneTimer: null,
      themeTimer: null,
      snippetTimer: null,
      lastScene: null,
    };
    bindEvents();
    syncScene(true);
    syncTheme(true);
    updateSnippet(true);
    setStatus('Live — edit JSON · API code', 'ok');
    return api;
  }

  function destroy() {
    if (!state) return;
    clearTimeout(state.sceneTimer);
    clearTimeout(state.themeTimer);
    clearTimeout(state.snippetTimer);
    if (state.root) state.root.innerHTML = '';
    state = null;
  }

  const api = {
    mount,
    destroy,
    syncScene,
    syncTheme,
    updateSnippet,
    setStatus,
    setPane,
    runActive,
    getState: () => state,
  };

  global.LivePlayground = api;
})(typeof window !== 'undefined' ? window : globalThis);
