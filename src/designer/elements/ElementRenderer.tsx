import React, { useRef, useEffect, useCallback } from 'react';
import { InvoiceElement } from '../types/template.types';
import { ResolvedData } from '../types/invoice-data.types';
import { InvoiceData } from '../types/invoice-data.types';
import { useDesigner } from '../context/DesignerContext';
import { ResizeHandles } from '../components/ResizeHandles';
import { ResizeHandle } from '../hooks/useElementResize';
import { TextElementRenderer } from './TextElementRenderer';
import { FieldElementRenderer } from './FieldElementRenderer';
import { LineElementRenderer } from './LineElementRenderer';
import { BoxElementRenderer } from './BoxElementRenderer';
import { ImageElementRenderer } from './ImageElementRenderer';
import { ItemsTableRenderer } from './ItemsTableRenderer';
import { TaxSummaryTableRenderer } from './TaxSummaryTableRenderer';
import { TotalsBoxRenderer } from './TotalsBoxRenderer';

interface Props {
  element: InvoiceElement;
  isSelected: boolean;
  preview: boolean;
  resolvedData?: ResolvedData;
  invoiceData?: InvoiceData;
  onMouseDown: (e: React.MouseEvent, id: string) => void;
  onStartResize?: (e: React.MouseEvent, id: string, handle: ResizeHandle) => void;
  onClick: (e: React.MouseEvent, id: string) => void;
}

export const ElementRenderer: React.FC<Props> = ({
  element,
  isSelected,
  preview,
  resolvedData,
  invoiceData,
  onMouseDown,
  onStartResize,
  onClick,
}) => {
  const { elementRefs } = useDesigner();
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = divRef.current;
    if (el) {
      elementRefs.current.set(element.id, el);
    }
    return () => { elementRefs.current.delete(element.id); };
  }, [element.id, elementRefs]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (preview || element.locked) return;
      e.stopPropagation();
      onMouseDown(e, element.id);
    },
    [preview, element.locked, element.id, onMouseDown],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (preview) return;
      e.stopPropagation();
      onClick(e, element.id);
    },
    [preview, element.id, onClick],
  );

  if (element.visible === false && preview) return null;

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${element.xMm}mm`,
    top: `${element.yMm}mm`,
    width: `${element.widthMm}mm`,
    height: `${element.heightMm}mm`,
    zIndex: element.zIndex,
    userSelect: 'none',
    cursor: element.locked ? 'default' : preview ? 'default' : 'move',
    outline: isSelected && !preview ? '1.5px solid #0d9488' : 'none',
    outlineOffset: '0px',
    ...(element.rotation ? { transform: `rotate(${element.rotation}deg)` } : {}),
  };

  function renderContent() {
    switch (element.type) {
      case 'text':         return <TextElementRenderer element={element} preview={preview} />;
      case 'field':        return <FieldElementRenderer element={element} preview={preview} resolvedData={resolvedData} />;
      case 'line':         return <LineElementRenderer element={element} />;
      case 'box':          return <BoxElementRenderer element={element} />;
      case 'image':        return <ImageElementRenderer element={element} preview={preview} resolvedData={resolvedData} />;
      case 'itemsTable':   return <ItemsTableRenderer element={element} preview={preview} items={invoiceData?.items} />;
      case 'taxSummaryTable': return <TaxSummaryTableRenderer element={element} preview={preview} taxBreakdown={invoiceData?.taxBreakdown} />;
      case 'totalsBox':    return <TotalsBoxRenderer element={element} preview={preview} resolvedData={resolvedData} />;
      case 'amountInWords':
        return (
          <div style={{ width: '100%', height: '100%', fontSize: '10px', padding: '1mm', wordBreak: 'break-word', overflow: 'hidden' }}>
            {element.prefix ?? ''}{preview && resolvedData ? resolvedData[element.binding] ?? `{{${element.binding}}}` : `{{${element.binding}}}`}{element.suffix ?? ''}
          </div>
        );
      case 'signatureBox':
        return (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', padding: '1mm', boxSizing: 'border-box' }}>
            {element.showLine && <div style={{ width: '100%', borderBottom: `1px solid ${element.lineColor}`, marginBottom: '1mm' }} />}
            <div style={{ fontSize: '9px', color: '#374151', textAlign: 'center' }}>{element.label}</div>
          </div>
        );
      case 'qrCode':
        return (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', border: '1px dashed #9ca3af' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px' }}>⬛</div>
              <div style={{ fontSize: '8px', color: '#6b7280' }}>QR: {element.binding}</div>
            </div>
          </div>
        );
      case 'separator':
        return (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '100%', borderTop: `${element.lineWidthPx}px ${element.lineStyle} ${element.lineColor}` }} />
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div
      ref={divRef}
      style={containerStyle}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      data-element-id={element.id}
    >
      {renderContent()}
      {isSelected && !preview && !element.locked && onStartResize && (
        <ResizeHandles onStartResize={(e, handle) => onStartResize(e, element.id, handle)} />
      )}
      {isSelected && !preview && element.locked && (
        <div style={{ position: 'absolute', inset: 0, outline: '1.5px dashed #f59e0b', outlineOffset: '0px', pointerEvents: 'none' }} />
      )}
    </div>
  );
};
