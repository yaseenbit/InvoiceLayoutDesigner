import React, { useCallback } from 'react';
import { useDesigner } from '../context/DesignerContext';
import { ElementRenderer } from '../elements/ElementRenderer';
import { GridOverlay } from './GridOverlay';
import { resolveInvoiceData, SAMPLE_INVOICE_DATA } from '../services/InvoiceDataResolver';
import { createElement } from '../utils/elementFactory';
import { ElementType } from '../types/template.types';
import { snapPoint } from '../utils/snapToGrid';

import { ResizeHandle } from '../hooks/useElementResize';

interface Props {
  onMouseDown: (e: React.MouseEvent, elementId: string) => void;
  onStartResize?: (e: React.MouseEvent, elementId: string, handle: ResizeHandle) => void;
  printMode?: boolean;
}

const resolvedData = resolveInvoiceData(SAMPLE_INVOICE_DATA);

export const A4Canvas: React.FC<Props> = ({ onMouseDown, onStartResize, printMode = false }) => {
  const {
    template,
    selectedIds,
    previewMode,
    addElement,
    setSelectedIds,
  } = useDesigner();

  const { page } = template;

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).dataset.elementId) return;
      setSelectedIds([]);
    },
    [setSelectedIds],
  );

  const handleElementClick = useCallback(
    (e: React.MouseEvent, id: string) => {
      if (previewMode) return;
      if (e.shiftKey) {
        setSelectedIds(
          selectedIds.includes(id)
            ? selectedIds.filter((s) => s !== id)
            : [...selectedIds, id],
        );
      } else {
        setSelectedIds([id]);
      }
    },
    [previewMode, selectedIds, setSelectedIds],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (previewMode) return;
      const elementType = e.dataTransfer.getData('elementType') as ElementType;
      if (!elementType) return;

      const rect = e.currentTarget.getBoundingClientRect();
      // rect is in viewport pixels and already includes parent scale(zoom), so
      // dividing by rect.width gives correct mm regardless of zoom level.
      let xMm = ((e.clientX - rect.left) / rect.width) * page.widthMm;
      let yMm = ((e.clientY - rect.top) / rect.height) * page.heightMm;

      if (page.snapToGrid) {
        const snapped = snapPoint(xMm, yMm, page.gridSizeMm);
        xMm = snapped.xMm;
        yMm = snapped.yMm;
      }

      xMm = Math.max(0, Math.min(xMm, page.widthMm - 10));
      yMm = Math.max(0, Math.min(yMm, page.heightMm - 10));

      const newElement = createElement(elementType, xMm, yMm, template.elements, page);
      addElement(newElement);
      setSelectedIds([newElement.id]);
    },
    [page, template.elements, addElement, setSelectedIds],
  );

  const sortedElements = [...template.elements].sort((a, b) => a.zIndex - b.zIndex);

  const marginGuideStyle = (side: 'top' | 'right' | 'bottom' | 'left'): React.CSSProperties => {
    const w = page.widthMm;
    const h = page.heightMm;
    const color = 'rgba(59,130,246,0.25)';
    if (side === 'top')    return { position: 'absolute', left: 0, top: 0, width: '100%', height: `${page.marginTopMm}mm`, borderBottom: `0.4px dashed ${color}`, pointerEvents: 'none', zIndex: 1 };
    if (side === 'bottom') return { position: 'absolute', left: 0, bottom: 0, width: '100%', height: `${page.marginBottomMm}mm`, borderTop: `0.4px dashed ${color}`, pointerEvents: 'none', zIndex: 1 };
    if (side === 'left')   return { position: 'absolute', left: 0, top: 0, width: `${page.marginLeftMm}mm`, height: '100%', borderRight: `0.4px dashed ${color}`, pointerEvents: 'none', zIndex: 1 };
    return { position: 'absolute', right: 0, top: 0, width: `${page.marginRightMm}mm`, height: '100%', borderLeft: `0.4px dashed ${color}`, pointerEvents: 'none', zIndex: 1 };
  };

  return (
    <div
      id="invoice-print-root"
      style={{
        position: 'relative',
        width: `${page.widthMm}mm`,
        height: `${page.heightMm}mm`,
        backgroundColor: '#fff',
        boxShadow: printMode ? 'none' : '0 4px 24px rgba(0,0,0,0.18)',
        overflow: 'hidden',
        flexShrink: 0,
      }}
      onClick={handleCanvasClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Grid overlay */}
      {page.showGrid && !previewMode && !printMode && <GridOverlay page={page} />}

      {/* Margin guides */}
      {page.showMarginGuides && !previewMode && !printMode && (
        <>
          <div style={marginGuideStyle('top')} />
          <div style={marginGuideStyle('bottom')} />
          <div style={marginGuideStyle('left')} />
          <div style={marginGuideStyle('right')} />
        </>
      )}

      {/* Elements */}
      {sortedElements.map((el) => (
        <ElementRenderer
          key={el.id}
          element={el}
          isSelected={selectedIds.includes(el.id)}
          preview={previewMode || printMode}
          resolvedData={resolvedData}
          invoiceData={SAMPLE_INVOICE_DATA}
          onMouseDown={onMouseDown}
          onStartResize={onStartResize}
          onClick={handleElementClick}
        />
      ))}
    </div>
  );
};
