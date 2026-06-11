import { InvoiceElement } from '../types/template.types';

export function getMaxZIndex(elements: InvoiceElement[]): number {
  return elements.reduce((max, el) => Math.max(max, el.zIndex), 0);
}

export function normalizeZIndexes(elements: InvoiceElement[]): InvoiceElement[] {
  const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);
  return sorted.map((el, i) => ({ ...el, zIndex: i + 1 }));
}

export function bringForward(elements: InvoiceElement[], id: string): InvoiceElement[] {
  const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);
  const idx = sorted.findIndex((el) => el.id === id);
  if (idx === -1 || idx === sorted.length - 1) return elements;
  const el = sorted[idx];
  const next = sorted[idx + 1];
  const newZ = next.zIndex;
  return elements.map((e) => {
    if (e.id === id) return { ...e, zIndex: newZ };
    if (e.id === next.id) return { ...e, zIndex: el.zIndex };
    return e;
  });
}

export function sendBackward(elements: InvoiceElement[], id: string): InvoiceElement[] {
  const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);
  const idx = sorted.findIndex((el) => el.id === id);
  if (idx <= 0) return elements;
  const el = sorted[idx];
  const prev = sorted[idx - 1];
  const newZ = prev.zIndex;
  return elements.map((e) => {
    if (e.id === id) return { ...e, zIndex: newZ };
    if (e.id === prev.id) return { ...e, zIndex: el.zIndex };
    return e;
  });
}

export function bringToFront(elements: InvoiceElement[], id: string): InvoiceElement[] {
  const max = getMaxZIndex(elements);
  return elements.map((el) => (el.id === id ? { ...el, zIndex: max + 1 } : el));
}

export function sendToBack(elements: InvoiceElement[], id: string): InvoiceElement[] {
  const min = elements.reduce((m, el) => Math.min(m, el.zIndex), Infinity);
  return elements.map((el) => (el.id === id ? { ...el, zIndex: min - 1 } : el));
}
