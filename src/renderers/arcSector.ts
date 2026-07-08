/** SVG/canvas path for a filled pie or donut sector. */
export function arcSectorPath(
  cx: number,
  cy: number,
  outerR: number,
  startAngle: number,
  endAngle: number,
  innerR = 0,
  counterClockwise = false
): string {
  const sweep = counterClockwise ? 0 : 1;
  const large = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;
  const ox1 = cx + outerR * Math.cos(startAngle);
  const oy1 = cy + outerR * Math.sin(startAngle);
  const ox2 = cx + outerR * Math.cos(endAngle);
  const oy2 = cy + outerR * Math.sin(endAngle);

  if (innerR > 0 && innerR < outerR) {
    const ix1 = cx + innerR * Math.cos(endAngle);
    const iy1 = cy + innerR * Math.sin(endAngle);
    const ix2 = cx + innerR * Math.cos(startAngle);
    const iy2 = cy + innerR * Math.sin(startAngle);
    const innerSweep = counterClockwise ? 1 : 0;
    return `M ${ox1} ${oy1} A ${outerR} ${outerR} 0 ${large} ${sweep} ${ox2} ${oy2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${large} ${innerSweep} ${ix2} ${iy2} Z`;
  }

  return `M ${cx} ${cy} L ${ox1} ${oy1} A ${outerR} ${outerR} 0 ${large} ${sweep} ${ox2} ${oy2} Z`;
}

/** Trace a pie or donut sector on a Canvas 2D context (local coords; center at cx,cy). */
export function traceArcSector(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerR: number,
  startAngle: number,
  endAngle: number,
  innerR = 0,
  counterClockwise = false
): void {
  ctx.beginPath();
  if (innerR > 0 && innerR < outerR) {
    ctx.arc(cx, cy, outerR, startAngle, endAngle, counterClockwise);
    ctx.arc(cx, cy, innerR, endAngle, startAngle, !counterClockwise);
    ctx.closePath();
  } else {
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, outerR, startAngle, endAngle, counterClockwise);
    ctx.closePath();
  }
}
