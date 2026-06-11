export function snapValue(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

export function snapPoint(
  xMm: number,
  yMm: number,
  gridSize: number,
): { xMm: number; yMm: number } {
  return {
    xMm: snapValue(xMm, gridSize),
    yMm: snapValue(yMm, gridSize),
  };
}

export function snapBounds(
  xMm: number,
  yMm: number,
  widthMm: number,
  heightMm: number,
  gridSize: number,
): { xMm: number; yMm: number; widthMm: number; heightMm: number } {
  const snappedX = snapValue(xMm, gridSize);
  const snappedY = snapValue(yMm, gridSize);
  const snappedW = Math.max(gridSize, snapValue(widthMm, gridSize));
  const snappedH = Math.max(gridSize, snapValue(heightMm, gridSize));
  return { xMm: snappedX, yMm: snappedY, widthMm: snappedW, heightMm: snappedH };
}
