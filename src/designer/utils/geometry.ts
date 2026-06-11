import { InvoiceElement } from '../types/template.types';

export interface Rect {
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
}

export function clampPosition(
  xMm: number,
  yMm: number,
  widthMm: number,
  heightMm: number,
  pageWidth: number,
  pageHeight: number,
): { xMm: number; yMm: number } {
  return {
    xMm: Math.max(0, Math.min(xMm, pageWidth - widthMm)),
    yMm: Math.max(0, Math.min(yMm, pageHeight - heightMm)),
  };
}

export function clampSize(
  widthMm: number,
  heightMm: number,
  minW = 2,
  minH = 2,
): { widthMm: number; heightMm: number } {
  return {
    widthMm: Math.max(minW, widthMm),
    heightMm: Math.max(minH, heightMm),
  };
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return (
    a.xMm < b.xMm + b.widthMm &&
    a.xMm + a.widthMm > b.xMm &&
    a.yMm < b.yMm + b.heightMm &&
    a.yMm + a.heightMm > b.yMm
  );
}

export function getBoundingBox(elements: InvoiceElement[]): Rect | null {
  if (elements.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const el of elements) {
    minX = Math.min(minX, el.xMm);
    minY = Math.min(minY, el.yMm);
    maxX = Math.max(maxX, el.xMm + el.widthMm);
    maxY = Math.max(maxY, el.yMm + el.heightMm);
  }
  return { xMm: minX, yMm: minY, widthMm: maxX - minX, heightMm: maxY - minY };
}

export function pointInRect(px: number, py: number, rect: Rect): boolean {
  return (
    px >= rect.xMm &&
    px <= rect.xMm + rect.widthMm &&
    py >= rect.yMm &&
    py <= rect.yMm + rect.heightMm
  );
}
