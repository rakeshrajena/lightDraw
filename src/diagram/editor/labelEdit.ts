import type { App } from '../../App';
import type { Group } from '../../shapes/Group';

/** Show an HTML input overlay to edit a diagram node label (draw.io-style). */
export function showLabelEditor(
  app: App,
  node: Group,
  onCommit: (text: string) => void
): void {
  const el = app['renderer'].getElement() as HTMLElement;
  const rect = el.getBoundingClientRect();
  const b = node.getBounds();
  const parent = node.parent as Group | null;
  let wx = node.x + b.x;
  let wy = node.y + b.y;
  if (parent) {
    wx += parent.x;
    wy += parent.y;
  }
  const screen = app.camera.worldToScreen(wx, wy);

  const input = document.createElement('input');
  input.type = 'text';
  input.value = extractLabel(node);
  Object.assign(input.style, {
    position: 'fixed',
    left: `${rect.left + screen.x}px`,
    top: `${rect.top + screen.y}px`,
    minWidth: `${Math.max(80, b.width)}px`,
    padding: '4px 8px',
    fontSize: '12px',
    fontFamily: 'Inter, system-ui, sans-serif',
    border: '2px solid #38bdf8',
    borderRadius: '6px',
    background: '#1e293b',
    color: '#f1f5f9',
    zIndex: '10000',
    outline: 'none',
  });
  document.body.appendChild(input);
  input.focus();
  input.select();

  const commit = () => {
    const v = input.value.trim();
    if (v) onCommit(v);
    input.remove();
  };
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') input.remove();
  });
  input.addEventListener('blur', commit);
}

function extractLabel(node: Group): string {
  for (const child of node.children) {
    if (child.type === 'text' && 'text' in child) {
      return (child as { text: string }).text;
    }
  }
  return '';
}
