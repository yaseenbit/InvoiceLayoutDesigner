import { useRef, useCallback } from 'react';
import { useDesigner } from '../context/DesignerContext';
import { snapBounds } from '../utils/snapToGrid';
import { clampPosition, clampSize } from '../utils/geometry';
import { MM_TO_CSS_PX } from '../utils/unitConversion';

export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface ResizeState {
  elementId: string;
  handle: ResizeHandle;
  startMouseXpx: number;
  startMouseYpx: number;
  startBounds: { xMm: number; yMm: number; widthMm: number; heightMm: number };
  lastBounds: { xMm: number; yMm: number; widthMm: number; heightMm: number };
}

export function useElementResize() {
  const { template, zoom, elementRefs, resizeElement } = useDesigner();
  const resizeStateRef = useRef<ResizeState | null>(null);
  const rafRef = useRef<number | null>(null);

  const startResize = useCallback(
    (e: React.MouseEvent, elementId: string, handle: ResizeHandle) => {
      const el = template.elements.find((el) => el.id === elementId);
      if (!el || el.locked) return;
      e.stopPropagation();
      e.preventDefault();

      const bounds = { xMm: el.xMm, yMm: el.yMm, widthMm: el.widthMm, heightMm: el.heightMm };
      resizeStateRef.current = {
        elementId,
        handle,
        startMouseXpx: e.clientX,
        startMouseYpx: e.clientY,
        startBounds: bounds,
        lastBounds: { ...bounds },
      };
    },
    [template.elements],
  );

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!resizeStateRef.current) return;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const rs = resizeStateRef.current;
        if (!rs) return;

        const pxPerMm = MM_TO_CSS_PX * zoom;
        const dxMm = (e.clientX - rs.startMouseXpx) / pxPerMm;
        const dyMm = (e.clientY - rs.startMouseYpx) / pxPerMm;
        const { startBounds: sb, handle } = rs;
        const { page } = template;

        let xMm = sb.xMm;
        let yMm = sb.yMm;
        let widthMm = sb.widthMm;
        let heightMm = sb.heightMm;

        if (handle.includes('e')) widthMm  = sb.widthMm  + dxMm;
        if (handle.includes('w')) { widthMm  = sb.widthMm  - dxMm; xMm = sb.xMm + dxMm; }
        if (handle.includes('s')) heightMm = sb.heightMm + dyMm;
        if (handle.includes('n')) { heightMm = sb.heightMm - dyMm; yMm = sb.yMm + dyMm; }

        const size = clampSize(widthMm, heightMm, 4, 4);
        let bounds = { xMm, yMm, widthMm: size.widthMm, heightMm: size.heightMm };

        if (page.snapToGrid) {
          bounds = snapBounds(bounds.xMm, bounds.yMm, bounds.widthMm, bounds.heightMm, page.gridSizeMm);
        }

        const clamped = clampPosition(bounds.xMm, bounds.yMm, bounds.widthMm, bounds.heightMm, page.widthMm, page.heightMm);
        const finalBounds = { xMm: clamped.xMm, yMm: clamped.yMm, widthMm: bounds.widthMm, heightMm: bounds.heightMm };
        rs.lastBounds = finalBounds;

        const domEl = elementRefs.current.get(rs.elementId);
        if (domEl) {
          domEl.style.left   = `${finalBounds.xMm}mm`;
          domEl.style.top    = `${finalBounds.yMm}mm`;
          domEl.style.width  = `${finalBounds.widthMm}mm`;
          domEl.style.height = `${finalBounds.heightMm}mm`;
        }
      });
    },
    [template, zoom, elementRefs],
  );

  const onMouseUp = useCallback(() => {
    const rs = resizeStateRef.current;
    if (!rs) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;

    const hasMoved =
      Math.abs(rs.lastBounds.xMm - rs.startBounds.xMm) > 0.01 ||
      Math.abs(rs.lastBounds.yMm - rs.startBounds.yMm) > 0.01 ||
      Math.abs(rs.lastBounds.widthMm - rs.startBounds.widthMm) > 0.01 ||
      Math.abs(rs.lastBounds.heightMm - rs.startBounds.heightMm) > 0.01;

    if (hasMoved) resizeElement(rs.elementId, rs.lastBounds);
    resizeStateRef.current = null;
  }, [resizeElement]);

  return {
    startResize,
    onMouseMove,
    onMouseUp,
    isResizing: () => !!resizeStateRef.current,
  };
}
