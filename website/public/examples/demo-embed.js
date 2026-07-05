/** Marks compact layout when demo runs inside the playground iframe. */
(function () {
  const params = new URLSearchParams(location.search);
  const embedded = params.get('embed') === '1' || window.self !== window.top;
  if (embedded) {
    document.documentElement.classList.add('demo-embed');
  }
})();
