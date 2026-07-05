/** Playground core demo — polished showcase scene */
const app = LightDraw.createApp('#demo-core', {
  width: 1080,
  height: 260,
  background: '#0d1322',
  renderer: 'canvas',
});

const cx = 540;
const cy = 130;

// Ambient grid dots
for (let i = 0; i < 12; i++) {
  for (let j = 0; j < 5; j++) {
    app.add(
      app.circle({
        x: 40 + i * 88,
        y: 30 + j * 50,
        radius: 1.5,
        fill: 'rgba(59, 130, 246, 0.12)',
        listening: false,
      })
    );
  }
}

// Orbit ring
app.add(
  app.circle({
    x: cx - 60,
    y: cy,
    radius: 72,
    fill: null,
    stroke: 'rgba(59, 130, 246, 0.2)',
    strokeWidth: 1,
    listening: false,
  })
);

const orbitBall = app.circle({
  x: cx - 132,
  y: cy,
  radius: 10,
  fill: '#3b82f6',
  shadow: { color: 'rgba(59, 130, 246, 0.6)', blur: 12, offsetX: 0, offsetY: 0 },
});
app.add(orbitBall);

const heroCard = app.group({ x: cx - 20, y: cy - 55 });
heroCard.add(
  app.roundedRect({
    width: 280,
    height: 110,
    cornerRadius: 14,
    fill: '#1c2740',
    stroke: '#2a3654',
    strokeWidth: 1,
    shadow: { color: 'rgba(0,0,0,0.4)', blur: 24, offsetX: 0, offsetY: 8 },
  }),
  app.text({
    text: 'LightDraw.js',
    x: 24,
    y: 28,
    fontSize: 26,
    fontWeight: 'bold',
    fill: '#f1f5f9',
  }),
  app.text({
    text: 'Shapes · Animation · UI · Dashboards',
    x: 24,
    y: 62,
    fontSize: 13,
    fill: '#8b9cc0',
  }),
  app.roundedRect({
    x: 24,
    y: 82,
    width: 88,
    height: 6,
    cornerRadius: 3,
    fill: '#1e3a5f',
    listening: false,
  }),
  app.roundedRect({
    x: 24,
    y: 82,
    width: 62,
    height: 6,
    cornerRadius: 3,
    fill: '#3b82f6',
    listening: false,
  })
);
app.add(heroCard);

// Accent shapes
const accent = app.group({ x: 80, y: cy - 40 });
accent.add(
  app.roundedRect({ width: 64, height: 64, cornerRadius: 12, fill: '#2563eb', rotation: 12 }),
  app.star({
    x: 120,
    y: 100,
    numPoints: 5,
    innerRadius: 14,
    outerRadius: 28,
    fill: '#f59e0b',
  }),
  app.circle({ x: 200, y: 30, radius: 22, fill: '#ef4444' })
);
app.add(accent);

// Animate orbit
let angle = 0;
function tick() {
  angle += 0.018;
  orbitBall.x = cx - 60 + Math.cos(angle) * 72;
  orbitBall.y = cy + Math.sin(angle) * 72;
  accent.rotation = Math.sin(angle * 2) * 6;
  app.render();
  requestAnimationFrame(tick);
}

accent.animate({ y: cy - 44, duration: 2200, easing: 'easeInOutSine', loop: true, reverse: true });
tick();
