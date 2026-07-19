/**
 * Shared helpers for rich automotive custom widgets.
 */
import { buildDialWidget } from '../../primitives/builders';
import { num } from '../../helpers';
import { themeFromProps } from '../../themes';

export function themedDial(
  app: import('../../../App').App,
  type: string,
  props: Record<string, unknown>,
  max: number,
  format: 'int' | 'rpm',
  needleKey: 'needleSpeed' | 'needleTach',
  options: { redlineFrom?: number; tickCount?: number; unit?: string } = {}
) {
  const theme = themeFromProps(props);
  return buildDialWidget(app, type, type, { ...props, needleColor: props.needleColor ?? theme[needleKey] }, {
    max: num(props, 'max', max),
    format,
    unit: options.unit,
    tickCount: options.tickCount,
    redlineFrom: options.redlineFrom,
    needleColor: theme[needleKey],
  });
}

