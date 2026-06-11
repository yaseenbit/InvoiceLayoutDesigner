/** CSS defines 1in = 96px, 1in = 25.4mm → 1mm = 96/25.4 px */
export const MM_TO_CSS_PX = 96 / 25.4;

export function mmToPx(mm: number): number {
  return mm * MM_TO_CSS_PX;
}

export function pxToMm(px: number): number {
  return px / MM_TO_CSS_PX;
}

export function ptToPx(pt: number): number {
  return (pt * 96) / 72;
}

export function pxToPt(px: number): number {
  return (px * 72) / 96;
}

/**
 * Convert screen coordinates (relative to the canvas element, in CSS pixels)
 * into mm coordinates on the A4 page, accounting for zoom.
 */
export function screenPxToMm(px: number, zoom: number): number {
  return pxToMm(px / zoom);
}

export function mmToScreenPx(mm: number, zoom: number): number {
  return mmToPx(mm) * zoom;
}

export function formatMm(mm: number, decimals = 1): string {
  return `${mm.toFixed(decimals)}mm`;
}
