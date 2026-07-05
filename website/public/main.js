/** Playground core demo */
const app = LightDraw.createApp('#demo-core', {
  width: 700,
  height: 220,
  background: '#111827',
  renderer: 'canvas',
});

const ball = app.circle({ x: 120, y: 110, radius: 40, fill: '#2563eb' });
app.add(
  ball,
  app.rect({ x: 220, y: 70, width: 80, height: 80, fill: '#dc2626', rotation: 15 }),
  app.text({ text: 'LightDraw Playground', x: 340, y: 100, fontSize: 22, fill: '#e2e8f0' })
);

app.render();
