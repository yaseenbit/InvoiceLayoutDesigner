import React, { useRef, useCallback } from 'react';
import { ThermalElement, ThermalElementType } from '../types/thermal.types';
import { ThermalReceiptData } from '../types/receipt-data.types';
import { ThermalResolvedData } from '../types/receipt-data.types';
import { ThermalElementRenderer, ThermalResizeHandle } from '../elements/ThermalElementRenderer';
import { MM_TO_CSS_PX } from '../../designer/utils/unitConversion';

interface Props {
  widthMm: number;
  heightMm: number;
  elements: ThermalElement[];
  selectedIds: string[];
  zoom: number;
  previewMode: boolean;
  showGrid: boolean;
  gridSizeMm: number;
  snapToGrid: boolean;
  resolved: ThermalResolvedData;
  receiptData: ThermalReceiptData;
  elementRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
  onSelectElement(id: string, multi: boolean): void;
  onClearSelection(): void;
  onDrop(type: ThermalElementType, xMm: number, yMm: number): void;
  onStartResize?(handle: ThermalResizeHandle): void;
}

export function ThermalCanvas({
  widthMm,
  heightMm,
  elements,
  selectedIds,
  zoom,
  previewMode,
  showGrid,
  gridSizeMm,
  snapToGrid,
  resolved,
  receiptData,
  elementRefs,
  onSelectElement,
  onClearSelection,
  onDrop,
  onStartResize,
}: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).dataset.elementId) return;
    onClearSelection();
  }, [onClearSelection]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (previewMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, [previewMode]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    if (previewMode) return;
    e.preventDefault();
    const elementType = e.dataTransfer.getData('application/thermal-element-type') as ThermalElementType;
    if (!elementType) return;

    const rect = canvasRef.current!.getBoundingClientRect();
    let xMm = ((e.clientX - rect.left) / rect.width) * widthMm;
    let yMm = ((e.clientY - rect.top) / rect.height) * heightMm;

    if (snapToGrid) {
      xMm = Math.round(xMm / gridSizeMm) * gridSizeMm;
      yMm = Math.round(yMm / gridSizeMm) * gridSizeMm;
    }

    xMm = Math.max(0, Math.min(xMm, widthMm - 5));
    yMm = Math.max(0, yMm);

    onDrop(elementType, xMm, yMm);
  }, [previewMode, widthMm, heightMm, snapToGrid, gridSizeMm, onDrop]);

  const registerRef = useCallback((node: HTMLDivElement | null, id: string) => {
    if (node) elementRefs.current.set(id, node);
    else elementRefs.current.delete(id);
  }, [elementRefs]);

  const widthPx  = widthMm  * MM_TO_CSS_PX;
  const heightPx = heightMm * MM_TO_CSS_PX;

  const gridStyle: React.CSSProperties = showGrid && !previewMode ? {
    backgroundImage: `
      linear-gradient(to right,  rgba(0,0,0,0.06) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px)
    `,
    backgroundSize: `${gridSizeMm * MM_TO_CSS_PX}px ${gridSizeMm * MM_TO_CSS_PX}px`,
  } : {};

  return (
    <div
      ref={canvasRef}
      style={{
        position: 'relative',
        width: widthPx,
        minHeight: heightPx,
        background: '#fff',
        boxShadow: '0 0 0 1px #d1d5db, 0 2px 12px rgba(0,0,0,0.12)',
        ...gridStyle,
      }}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Tape cut line (top) */}
      {!previewMode && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'repeating-linear-gradient(to right,#0d9488,#0d9488 4px,transparent 4px,transparent 8px)', opacity: 0.4, zIndex: 9999, pointerEvents: 'none' }} />
      )}

      {elements.map((el) => (
        <ThermalElementRenderer
          key={el.id}
          element={el}
          isSelected={selectedIds.includes(el.id)}
          previewMode={previewMode}
          zoom={zoom}
          resolved={resolved}
          receiptData={receiptData}
          domRef={registerRef}
          onSelect={onSelectElement}
          onStartResize={onStartResize}
        />
      ))}

      {/* Bottom padding indicator */}
      {!previewMode && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '5mm', borderTop: '1px dashed #ccc', background: 'rgba(0,0,0,0.02)', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 9, color: '#aaa', fontFamily: 'monospace' }}>— end of receipt —</span>
        </div>
      )}
    </div>
  );
}
