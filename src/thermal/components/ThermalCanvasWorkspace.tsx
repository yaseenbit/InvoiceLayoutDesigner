import React, { useRef, useEffect, useCallback } from 'react';
import { useThermal } from '../context/ThermalContext';
import { ThermalCanvas } from './ThermalCanvas';
import { ThermalResizeHandle } from '../elements/ThermalElementRenderer';
import { ThermalElementType } from '../types/thermal.types';
import { MM_TO_CSS_PX } from '../../designer/utils/unitConversion';
import { SAMPLE_RECEIPT_DATA, resolveThermalData } from '../services/ThermalDataResolver';

// ─── Drag hook ────────────────────────────────────────────────────────────────

function useThermalElementDrag(
  elementRefs: React.MutableRefObject<Map<string, HTMLDivElement>>,
  zoom: number,
  onCommit: (id: string, xMm: number, yMm: number) => void,
  snapToGrid: boolean,
  gridSizeMm: number,
) {
  const dragging = useRef<{
    id: string;
    startMouseX: number;
    startMouseY: number;
    startElXMm: number;
    startElYMm: number;
    rafId: number;
    pendingX: number;
    pendingY: number;
  } | null>(null);

  const startDrag = useCallback((
    e: React.MouseEvent,
    id: string,
    currentXMm: number,
    currentYMm: number,
  ) => {
    e.preventDefault();
    dragging.current = {
      id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startElXMm: currentXMm,
      startElYMm: currentYMm,
      rafId: 0,
      pendingX: currentXMm,
      pendingY: currentYMm,
    };
  }, []);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragging.current) return;
      const d = dragging.current;
      const dxPx = (e.clientX - d.startMouseX) / zoom;
      const dyPx = (e.clientY - d.startMouseY) / zoom;
      let xMm = d.startElXMm + dxPx / MM_TO_CSS_PX;
      let yMm = d.startElYMm + dyPx / MM_TO_CSS_PX;
      if (snapToGrid) {
        xMm = Math.round(xMm / gridSizeMm) * gridSizeMm;
        yMm = Math.round(yMm / gridSizeMm) * gridSizeMm;
      }
      xMm = Math.max(0, xMm);
      yMm = Math.max(0, yMm);
      d.pendingX = xMm;
      d.pendingY = yMm;

      cancelAnimationFrame(d.rafId);
      d.rafId = requestAnimationFrame(() => {
        const node = elementRefs.current.get(d.id);
        if (node) {
          node.style.left = `${d.pendingX}mm`;
          node.style.top  = `${d.pendingY}mm`;
        }
      });
    }

    function onMouseUp() {
      if (!dragging.current) return;
      cancelAnimationFrame(dragging.current.rafId);
      onCommit(dragging.current.id, dragging.current.pendingX, dragging.current.pendingY);
      dragging.current = null;
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [zoom, snapToGrid, gridSizeMm, elementRefs, onCommit]);

  return startDrag;
}

// ─── Resize hook ──────────────────────────────────────────────────────────────

function useThermalElementResize(
  elementRefs: React.MutableRefObject<Map<string, HTMLDivElement>>,
  zoom: number,
  snapToGrid: boolean,
  gridSizeMm: number,
  onCommit: (id: string, xMm: number, yMm: number, wMm: number, hMm: number) => void,
) {
  const resizing = useRef<(ThermalResizeHandle & { pendingX: number; pendingY: number; pendingW: number; pendingH: number; rafId: number }) | null>(null);

  const startResize = useCallback((handle: ThermalResizeHandle) => {
    resizing.current = { ...handle, pendingX: handle.startElX, pendingY: handle.startElY, pendingW: handle.startElW, pendingH: handle.startElH, rafId: 0 };
  }, []);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!resizing.current) return;
      const r = resizing.current;
      const dxPx = (e.clientX - r.startX) / zoom;
      const dyPx = (e.clientY - r.startY) / zoom;
      const dxMm = dxPx / MM_TO_CSS_PX;
      const dyMm = dyPx / MM_TO_CSS_PX;

      let { startElX: x, startElY: y, startElW: w, startElH: h } = r;

      if (r.edge.includes('e')) w = Math.max(5, w + dxMm);
      if (r.edge.includes('s')) h = Math.max(3, h + dyMm);
      if (r.edge.includes('w')) { x = x + dxMm; w = Math.max(5, w - dxMm); }
      if (r.edge.includes('n')) { y = y + dyMm; h = Math.max(3, h - dyMm); }

      if (snapToGrid) {
        x = Math.round(x / gridSizeMm) * gridSizeMm;
        y = Math.round(y / gridSizeMm) * gridSizeMm;
        w = Math.round(w / gridSizeMm) * gridSizeMm;
        h = Math.round(h / gridSizeMm) * gridSizeMm;
      }

      x = Math.max(0, x);
      y = Math.max(0, y);
      w = Math.max(2, w);
      h = Math.max(2, h);

      r.pendingX = x; r.pendingY = y; r.pendingW = w; r.pendingH = h;

      cancelAnimationFrame(r.rafId);
      r.rafId = requestAnimationFrame(() => {
        const node = elementRefs.current.get(r.elementId);
        if (node) {
          node.style.left   = `${r.pendingX}mm`;
          node.style.top    = `${r.pendingY}mm`;
          node.style.width  = `${r.pendingW}mm`;
          node.style.height = `${r.pendingH}mm`;
        }
      });
    }

    function onMouseUp() {
      if (!resizing.current) return;
      cancelAnimationFrame(resizing.current.rafId);
      const { elementId, pendingX, pendingY, pendingW, pendingH } = resizing.current;
      onCommit(elementId, pendingX, pendingY, pendingW, pendingH);
      resizing.current = null;
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [zoom, snapToGrid, gridSizeMm, elementRefs, onCommit]);

  return startResize;
}

// ─── Keyboard shortcuts ───────────────────────────────────────────────────────

function useKeyboardShortcuts() {
  const ctx = useThermal();

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const tag = (document.activeElement as HTMLElement)?.tagName ?? '';
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;

      const meta = e.metaKey || e.ctrlKey;
      const { selectedIds } = ctx;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length) ctx.deleteElements(selectedIds);
      } else if (meta && e.key === 'z') {
        e.preventDefault();
        e.shiftKey ? ctx.redo() : ctx.undo();
      } else if (meta && e.key === 'd') {
        e.preventDefault();
        if (selectedIds.length === 1) ctx.duplicateElement(selectedIds[0]);
      } else if (meta && e.key === 'a') {
        e.preventDefault();
        ctx.selectElements(ctx.template.elements.map((el) => el.id));
      } else if (e.key === 'Escape') {
        ctx.selectElements([]);
      } else if (selectedIds.length) {
        const step = e.shiftKey ? 10 : 1;
        const dMm: Record<string, [number, number]> = {
          ArrowLeft:  [-step * 0.5, 0],
          ArrowRight: [ step * 0.5, 0],
          ArrowUp:    [0, -step * 0.5],
          ArrowDown:  [0,  step * 0.5],
        };
        const d = dMm[e.key];
        if (d) { e.preventDefault(); ctx.moveElements(selectedIds, d[0], d[1]); }
      }
    }

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [ctx]);
}

// ─── Canvas Workspace ─────────────────────────────────────────────────────────

export function ThermalCanvasWorkspace() {
  const ctx = useThermal();
  const { template, selectedIds, zoom, previewMode } = ctx;
  const { page } = template;

  const elementRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const resolved = resolveThermalData(SAMPLE_RECEIPT_DATA);

  useKeyboardShortcuts();

  const commitMove = useCallback((id: string, xMm: number, yMm: number) => {
    ctx.updateElement(id, { xMm, yMm });
  }, [ctx]);

  const commitResize = useCallback((id: string, xMm: number, yMm: number, widthMm: number, heightMm: number) => {
    ctx.updateElement(id, { xMm, yMm, widthMm, heightMm });
  }, [ctx]);

  const startDrag = useThermalElementDrag(elementRefs, zoom, commitMove, page.snapToGrid, page.gridSizeMm);
  const startResize = useThermalElementResize(elementRefs, zoom, page.snapToGrid, page.gridSizeMm, commitResize);

  const handleDrop = useCallback((type: ThermalElementType, xMm: number, yMm: number) => {
    ctx.dropElement(type, xMm, yMm);
  }, [ctx]);

  const handleSelectElement = useCallback((id: string, multi: boolean) => {
    if (multi) {
      ctx.selectElements(selectedIds.includes(id)
        ? selectedIds.filter((s) => s !== id)
        : [...selectedIds, id]);
    } else {
      ctx.selectElements([id]);
    }
  }, [ctx, selectedIds]);

  return (
    <div
      style={{
        flex: 1,
        overflow: 'auto',
        background: '#f1f5f9',
        display: 'flex',
        justifyContent: 'center',
        padding: '24px 16px',
        position: 'relative',
      }}
    >
      <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.1s' }}>
        <ThermalCanvas
          widthMm={page.widthMm}
          heightMm={page.heightMm}
          elements={template.elements}
          selectedIds={selectedIds}
          zoom={zoom}
          previewMode={previewMode}
          showGrid={page.showGrid}
          gridSizeMm={page.gridSizeMm}
          snapToGrid={page.snapToGrid}
          resolved={resolved}
          receiptData={SAMPLE_RECEIPT_DATA}
          elementRefs={elementRefs}
          onSelectElement={handleSelectElement}
          onClearSelection={() => ctx.selectElements([])}
          onDrop={handleDrop}
          onStartDrag={startDrag}
          onStartResize={startResize}
        />
      </div>
    </div>
  );
}
