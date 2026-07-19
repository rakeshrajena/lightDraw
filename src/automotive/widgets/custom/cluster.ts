/**
 * Automotive custom widgets — cluster.
 */
import { registerAutomotive, createAutomotiveFromJSON } from '../../registryCore';
import {
  bool,
  createAutoGroup,
  num,
  setState,
  str,
} from '../../helpers';
import { autoThemeName, themeFromProps } from '../../themes';
import { resolveClusterLayout } from '../../layout';

function buildInstrumentCluster(props: Record<string, unknown>, app: import('../../../App').App, type: string) {
  const theme = themeFromProps(props);
  const w = num(props, 'width', 800);
  const h = num(props, 'height', 400);
  const incomingCall = bool(props, 'incomingCall', false) || bool(props, 'showCall', false);
  const group = createAutoGroup(app, type, props, type, { width: w, height: h });
  group.add(
    app.rect({
      width: w,
      height: h,
      fill: theme.background,
      cornerRadius: Math.min(16, h * 0.04),
      stroke: theme.dialStroke,
      strokeWidth: 2,
      listening: false,
    })
  );
  const themeName = autoThemeName(props);
  const isDigital = themeName === 'digital';
  const gaugeDisplay = isDigital ? 'digital' : 'analog';

  const valueByType: Record<string, Record<string, unknown>> = {
    speedometer: { value: props.speed ?? 0, display: gaugeDisplay },
    tachometer: { value: props.rpm ?? 0, display: gaugeDisplay },
    gearIndicator: { gear: props.gear ?? 'P' },
    engineTemp: { value: props.engineTemp ?? 90, display: gaugeDisplay },
    turnIndicators: { left: props.turnLeft ?? false, right: props.turnRight ?? false },
    fuelGauge: { value: props.fuel ?? 75 },
    batteryVoltage: { value: props.batteryVoltage ?? 12.4 },
    tpms: { pressures: props.tpms ?? [32, 32, 32, 32] },
    parkingBrake: { active: props.parkingBrake ?? false },
    headlights: { active: props.headlights ?? false },
    cruiseControl: { speed: props.cruiseSpeed ?? 0 },
    warningLamp: { label: 'ABS', active: props.absWarning ?? false },
    adasStatus: { status: props.adasStatus ?? 'off' },
    callScreen: {
      caller: str(props, 'caller', 'Alex Morgan'),
      subtitle: str(props, 'subtitle', str(props, 'phone', 'Mobile')),
      status: str(props, 'callStatus', str(props, 'status', 'incoming')),
      hint: str(props, 'callHint', str(props, 'hint', 'Swipe to answer')),
      lines: (props.lines as string[]) ?? ['Incoming…', 'Swipe to answer'],
    },
  };

  for (const slot of resolveClusterLayout(w, h, { callScreen: incomingCall })) {
    const { type: wt, size, width: slotW, height: slotH, x: slotX, y: slotY } = slot;
    const slotDigital =
      gaugeDisplay === 'digital' || slotW < 128 || slotH < 80 || (size !== undefined && size < 96);
    const node = createAutomotiveFromJSON(
      wt,
      {
        x: 0,
        y: 0,
        width: slotW,
        height: slotH,
        ...(size !== undefined ? { size: Math.min(size, Math.min(slotW, slotH) - 4) } : {}),
        ...valueByType[wt],
        theme: themeName,
        display: wt === 'speedometer' || wt === 'tachometer' || wt === 'engineTemp'
          ? slotDigital ? 'digital' : gaugeDisplay
          : undefined,
      },
      app
    );
    if (node) {
      const slotWrap = app.group({
        x: slotX,
        y: slotY,
        clip: true,
        metadata: {
          autoSlot: wt,
          autoState: { width: slotW, height: slotH },
          autoWidth: slotW,
          autoHeight: slotH,
        },
      }) as import('../../../shapes/Group').Group;
      slotWrap.add(node);
      group.add(slotWrap);
    }
  }
  setState(group, { width: w, height: h, theme: themeName, ...props });
  return group;
}


registerAutomotive('instrumentCluster', (props, app) => buildInstrumentCluster(props, app, 'instrumentCluster'));

registerAutomotive('digitalInstrumentCluster', (props, app) =>
  buildInstrumentCluster({ ...props, theme: props.theme ?? 'digital' }, app, 'digitalInstrumentCluster')
);
