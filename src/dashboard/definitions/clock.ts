/**
 * Dashboard widget factories — clock.
 */
import { registerDashboard } from '../registryCore';
import {
  createWidgetGroup,
  num,
  setParts,
  setRefresh,
  setState,
  bool,
} from '../helpers';
import { getActiveDashboard } from '../theme';

registerDashboard('clock', (props, app) => {
  const size = num(props, 'size', 120);
  const live = bool(props, 'live', true);
  const showSeconds = bool(props, 'showSeconds', size >= 44);
  const group = createWidgetGroup(app, 'clock', props, { width: size, height: size });
  const cx = size / 2;
  const r = size / 2 - 3;
  const pad = Math.max(2, size * 0.04);
  const hourLen = (r - pad) * 0.5;
  const minLen = (r - pad) * 0.72;
  const secLen = (r - pad) * 0.82;
  const hourW = Math.max(2, size * 0.035);
  const minW = Math.max(1.5, size * 0.025);
  const hubR = Math.max(3, size * 0.05);

  group.add(
    app.circle({
      x: cx - r,
      y: cx - r,
      radius: r,
      fill: getActiveDashboard().clockFace,
      stroke: getActiveDashboard().clockRing,
      strokeWidth: Math.max(1.5, size / 50),
      shadow: size >= 56 ? { color: 'rgba(0,0,0,0.35)', blur: 5, offsetX: 0, offsetY: 2 } : undefined,
      listening: false,
    })
  );

  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const major = i % 3 === 0;
    const tickLen = major ? size * 0.1 : size * 0.06;
    const inner = r - tickLen;
    const outer = r - size * 0.03;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    group.add(
      app.line({
        x: cx + inner * cos,
        y: cx + inner * sin,
        x2: (outer - inner) * cos,
        y2: (outer - inner) * sin,
        stroke: major ? getActiveDashboard().clockTickMajor : getActiveDashboard().clockTick,
        strokeWidth: major ? Math.max(1.5, size / 40) : 1,
        lineCap: 'round',
        listening: false,
      })
    );
  }

  const hourHand = app.line({
    x: cx,
    y: cx,
    x2: 0,
    y2: -hourLen,
    stroke: getActiveDashboard().clockHand,
    strokeWidth: hourW,
    lineCap: 'round',
    listening: false,
  });
  const minHand = app.line({
    x: cx,
    y: cx,
    x2: 0,
    y2: -minLen,
    stroke: getActiveDashboard().clockHand,
    strokeWidth: minW,
    lineCap: 'round',
    listening: false,
  });
  const secHand = app.line({
    x: cx,
    y: cx,
    x2: 0,
    y2: -secLen,
    stroke: getActiveDashboard().clockSecond,
    strokeWidth: Math.max(1, size * 0.015),
    lineCap: 'round',
    visible: showSeconds,
    listening: false,
  });
  group.add(hourHand, minHand, secHand);

  group.add(
    app.circle({
      x: cx - hubR,
      y: cx - hubR,
      radius: hubR,
      fill: getActiveDashboard().clockHub,
      stroke: getActiveDashboard().clockRing,
      strokeWidth: 1,
      listening: false,
    }),
    app.circle({
      x: cx - hubR * 0.45,
      y: cx - hubR * 0.45,
      radius: hubR * 0.45,
      fill: getActiveDashboard().clockHand,
      listening: false,
    })
  );

  const updateHands = () => {
    const now = new Date();
    const hours = now.getHours() % 12;
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const hourAngle = ((hours + minutes / 60) / 12) * Math.PI * 2 - Math.PI / 2;
    const minAngle = ((minutes + seconds / 60) / 60) * Math.PI * 2 - Math.PI / 2;
    const secAngle = (seconds / 60) * Math.PI * 2 - Math.PI / 2;
    (hourHand as { x2: number; y2: number }).x2 = hourLen * Math.cos(hourAngle);
    (hourHand as { y2: number }).y2 = hourLen * Math.sin(hourAngle);
    (minHand as { x2: number; y2: number }).x2 = minLen * Math.cos(minAngle);
    (minHand as { y2: number }).y2 = minLen * Math.sin(minAngle);
    if (showSeconds) {
      (secHand as { x2: number; y2: number }).x2 = secLen * Math.cos(secAngle);
      (secHand as { y2: number }).y2 = secLen * Math.sin(secAngle);
    }
  };

  updateHands();
  setParts(group, { hourHand, minHand, secHand });
  if (live) {
    setRefresh(group, () => updateHands());
  }
  setState(group, { size, live, showSeconds });
  return group;
});
