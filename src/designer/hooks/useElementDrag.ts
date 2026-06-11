import { useRef, useCallback } from 'react';
import { useDesigner } from '../context/DesignerContext';
import { snapPoint } from '../utils/snapToGrid';
import { clampPosition } from '../utils/geometry';
import { MM_TO_CSS_PX } from '../utils/unitConversion';

interface DragState {
  elementIds: string[];
  startMouseXpx: number;
  startMouseYpx: number;
  startPositions: Map<string, { xMm: number; yMm: number }>;
  lastPositions: Map<string, { xMm: number; yMm: number }>;
}

export function useElementDrag(canvasRef: React.RefObject<HTMLDivElement | null>) {
  const { template, selectedIds, zoom, elementRefs, moveElements, setSelectedIds } = useDesigner();
  const dragStateRef = useRef<DragState | null>(null);
  const rafRef = useRef<number | null>(null);

  const startDrag = useCallback(
    (e: React.MouseEvent, elementId: string) => {
      const el = template.elements.find((el) => el.id === elementId);
      if (!el || el.locked) return;

      e.stopPropagation();
      e.preventDefault();

      // Update selection on mousedown if not already selected
      if (!selectedIds.includes(elementId)) {
        if (e.shiftKey) {
          setSelectedIds([...selectedIds, elementId]);
        } else {
          setSelectedIds([elementId]);
        }
      }

      const dragIds = selectedIds.includes(elementId)
        ? [...selectedIds].filter((id) => {
            const found = template.elements.find((e) => e.id === id);
            return found && !found.locked;
          })
        : [elementId];

      const startPositions = new Map<string, { xMm: number; yMm: number }>();
      for (const id of dragIds) {
        const found = template.elements.find((e) => e.id === id);
        if (found) startPositions.set(id, { xMm: found.xMm, yMm: found.yMm });
      }

      dragStateRef.current = {
        elementIds: dragIds,
        startMouseXpx: e.clientX,
        startMouseYpx: e.clientY,
        startPositions,
        lastPositions: new Map(startPositions),
      };
    },
    [template.elements, selectedIds, setSelectedIds],
  );

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      const drag = dragStateRef.current;
      if (!drag) return;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const drag = dragStateRef.current;
        if (!drag) return;

        const pxPerMm = MM_TO_CSS_PX * zoom;
        const dxMm = (e.clientX - drag.startMouseXpx) / pxPerMm;
        const dyMm = (e.clientY - drag.startMouseYpx) / pxPerMm;

        const { page } = template;
        const snap = page.snapToGrid;
        const grid = page.gridSizeMm;

        for (const id of drag.elementIds) {
          const start = drag.startPositions.get(id)!;
          const found = template.elements.find((el) => el.id === id);
          if (!found) continue;

          let newX = start.xMm + dxMm;
          let newY = start.yMm + dyMm;

          if (snap) {
            const snapped = snapPoint(newX, newY, grid);
            newX = snapped.xMm;
            newY = snapped.yMm;
          }

          const clamped = clampPosition(newX, newY, found.widthMm, found.heightMm, page.widthMm, page.heightMm);
          drag.lastPositions.set(id, clamped);

          // Direct DOM update for smooth drag
          const domEl = elementRefs.current.get(id);
          if (domEl) {
            domEl.style.left = `${clamped.xMm}mm`;
            domEl.style.top  = `${clamped.yMm}mm`;
          }
        }
      });
    },
    [template, zoom, elementRefs],
  );

  const onMouseUp = useCallback(() => {
    const drag = dragStateRef.current;
    if (!drag) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;

    const moves = Array.from(drag.lastPositions.entries()).map(([id, pos]) => ({ id, ...pos }));
    const hasMoved = moves.some((m) => {
      const start = drag.startPositions.get(m.id)!;
      return Math.abs(m.xMm - start.xMm) > 0.01 || Math.abs(m.yMm - start.yMm) > 0.01;
    });

    if (hasMoved) moveElements(moves);
    dragStateRef.current = null;
  }, [moveElements]);

  return { startDrag, onMouseMove, onMouseUp, isDragging: () => !!dragStateRef.current };
}
