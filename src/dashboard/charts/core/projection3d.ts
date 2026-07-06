/** Isometric projection for 3D surface charts */
export function project3d(
  x: number,
  y: number,
  z: number,
  cx: number,
  cy: number,
  scale = 1
): [number, number] {
  const isoX = (x - y) * Math.cos(Math.PI / 6) * scale;
  const isoY = (x + y) * Math.sin(Math.PI / 6) * scale - z * scale;
  return [cx + isoX, cy + isoY];
}

export function surfaceMeshPath(
  zGrid: number[][],
  cx: number,
  cy: number,
  cellSize = 8
): string[] {
  const paths: string[] = [];
  const rows = zGrid.length;
  const cols = zGrid[0]?.length ?? 0;
  for (let i = 0; i < rows - 1; i++) {
    for (let j = 0; j < cols - 1; j++) {
      const z00 = zGrid[i][j];
      const z10 = zGrid[i + 1][j];
      const z01 = zGrid[i][j + 1];
      const z11 = zGrid[i + 1][j + 1];
      const [x0, y0] = project3d(j, i, z00, cx, cy, cellSize);
      const [x1, y1] = project3d(j + 1, i, z01, cx, cy, cellSize);
      const [x2, y2] = project3d(j + 1, i + 1, z11, cx, cy, cellSize);
      const [x3, y3] = project3d(j, i + 1, z10, cx, cy, cellSize);
      paths.push(`M ${x0} ${y0} L ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3} Z`);
    }
  }
  return paths;
}

export function wireframePaths(
  zGrid: number[][],
  cx: number,
  cy: number,
  cellSize = 8
): string[] {
  const paths: string[] = [];
  const rows = zGrid.length;
  const cols = zGrid[0]?.length ?? 0;
  for (let i = 0; i < rows; i++) {
    let d = '';
    for (let j = 0; j < cols; j++) {
      const [x, y] = project3d(j, i, zGrid[i][j], cx, cy, cellSize);
      d += (j === 0 ? 'M' : 'L') + ` ${x} ${y}`;
    }
    paths.push(d);
  }
  for (let j = 0; j < cols; j++) {
    let d = '';
    for (let i = 0; i < rows; i++) {
      const [x, y] = project3d(j, i, zGrid[i][j], cx, cy, cellSize);
      d += (i === 0 ? 'M' : 'L') + ` ${x} ${y}`;
    }
    paths.push(d);
  }
  return paths;
}

export function sampleZGrid(size = 8): number[][] {
  return Array.from({ length: size }, (_, i) =>
    Array.from({ length: size }, (_, j) => Math.sin(i * 0.5) * Math.cos(j * 0.5) * 3 + 2)
  );
}
