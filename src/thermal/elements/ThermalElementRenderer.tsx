import React, { useRef, useCallback, MouseEvent } from 'react';
import { ThermalElement, ThermalItemsTableElement, ThermalTotalsElement } from '../types/thermal.types';
import { ThermalReceiptData } from '../types/receipt-data.types';
import { ThermalResolvedData } from '../types/receipt-data.types';
import { MM_TO_CSS_PX } from '../../designer/utils/unitConversion';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ThermalResizeHandle {
  elementId: string;
  edge: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
  startX: number;
  startY: number;
  startElX: number;
  startElY: number;
  startElW: number;
  startElH: number;
}

interface Props {
  element: ThermalElement;
  isSelected: boolean;
  previewMode: boolean;
  zoom: number;
  resolved: ThermalResolvedData;
  receiptData: ThermalReceiptData;
  domRef?: (el: HTMLDivElement | null, id: string) => void;
  onSelect(id: string, multi: boolean): void;
  onStartResize?(handle: ThermalResizeHandle): void;
}

export type { ThermalResizeHandle };

// ─── Style helpers ────────────────────────────────────────────────────────────

function styleFromEl(el: ThermalElement): React.CSSProperties {
  const s = el.style;
  return {
    fontFamily: s.fontFamily ?? 'monospace',
    fontSize: s.fontSizePt ? `${s.fontSizePt}pt` : '9pt',
    fontWeight: s.bold ? 'bold' : 'normal',
    fontStyle: s.italic ? 'italic' : 'normal',
    textDecoration: s.underline ? 'underline' : 'none',
    color: s.color ?? '#000',
    backgroundColor: s.backgroundColor !== 'transparent' ? (s.backgroundColor ?? 'transparent') : 'transparent',
    textAlign: s.textAlign ?? 'left',
    padding: s.paddingMm ? `${s.paddingMm}mm` : 0,
    boxSizing: 'border-box',
    overflow: 'hidden',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    ...(s.border ? {
      border: `${s.borderWidthPx ?? 1}px ${s.borderStyle ?? 'solid'} ${s.borderColor ?? '#000'}`,
    } : {}),
    ...(s.verticalAlign === 'middle' ? { display: 'flex', alignItems: 'center' } : {}),
  };
}

// ─── Specific element renderers ───────────────────────────────────────────────

function RenderText({ el }: { el: Extract<ThermalElement, { type: 'text' }> }) {
  return <div style={{ ...styleFromEl(el), width: '100%', height: '100%' }}>{el.content}</div>;
}

function RenderField({ el, resolved }: { el: Extract<ThermalElement, { type: 'field' }>; resolved: ThermalResolvedData }) {
  const val = resolved[el.binding] ?? el.fallback ?? el.binding;
  return <div style={{ ...styleFromEl(el), width: '100%', height: '100%' }}>{val}</div>;
}

function RenderLine({ el }: { el: Extract<ThermalElement, { type: 'line' }> }) {
  const borderSpec = el.dashed
    ? `1px dashed ${el.lineColor}`
    : `${el.lineWidthPx}px ${el.lineStyle} ${el.lineColor}`;
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
      <div style={{ width: '100%', borderTop: borderSpec }} />
    </div>
  );
}

function RenderImage({ el, resolved }: { el: Extract<ThermalElement, { type: 'image' }>; resolved: ThermalResolvedData }) {
  const src = el.src || (el.binding ? resolved[el.binding] : '') || '';
  if (!src) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #aaa', fontSize: '7pt', color: '#999', backgroundColor: '#f8f8f8' }}>
        Logo
      </div>
    );
  }
  return <img src={src} alt={el.alt ?? ''} style={{ width: '100%', height: '100%', objectFit: el.fit }} />;
}

function RenderItemsTable({ el, receiptData }: { el: ThermalItemsTableElement; receiptData: ThermalReceiptData }) {
  const rows = receiptData.items.slice(0, el.previewRows);
  const colWidths = el.columns.map((c) => `${(c.widthRatio * 100).toFixed(1)}%`);
  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: `${el.rowFontSizePt}pt`, fontFamily: el.style.fontFamily ?? 'monospace' }}>
        {el.headerVisible && (
          <thead>
            <tr style={{ height: `${el.rowHeightMm}mm`, borderBottom: '1px solid #000' }}>
              {el.columns.map((col, i) => (
                <th key={col.id} style={{ width: colWidths[i], fontSize: `${el.headerFontSizePt}pt`, fontWeight: 'bold', textAlign: col.align, padding: '0 1mm' }}>
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((item) => {
            const map = item as unknown as Record<string, unknown>;
            return (
              <tr key={item.slNo} style={{ height: `${el.rowHeightMm}mm`, ...(el.separatorBetweenRows ? { borderBottom: `1px ${el.separatorStyle} #000` } : {}) }}>
                {el.columns.map((col, i) => {
                  const val = map[col.binding];
                  const display = typeof val === 'number'
                    ? val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : String(val ?? '');
                  return <td key={col.id} style={{ width: colWidths[i], textAlign: col.align, padding: '0 1mm', overflow: 'hidden', whiteSpace: 'nowrap' }}>{display}</td>;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RenderTotals({ el, resolved }: { el: ThermalTotalsElement; resolved: ThermalResolvedData }) {
  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: `${el.fontSizePt}pt`, fontFamily: el.style.fontFamily ?? 'monospace' }}>
        <tbody>
          {el.rows.filter((r) => r.visible).map((row) => (
            <tr key={row.id} style={{ height: `${el.rowHeightMm}mm`, ...(row.separator ? { borderTop: '1px solid #000' } : {}) }}>
              <td style={{ width: `${el.labelWidthPercent}%`, fontWeight: row.bold ? 'bold' : 'normal', padding: '0 1mm' }}>{row.label}</td>
              <td style={{ textAlign: 'right', fontWeight: row.bold ? 'bold' : 'normal', padding: '0 1mm' }}>{resolved[row.binding] ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RenderBarcode({ el, resolved }: { el: Extract<ThermalElement, { type: 'barcode' }>; resolved: ThermalResolvedData }) {
  const val = resolved[el.binding] ?? el.value ?? '';
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'monospace', fontSize: '16pt', letterSpacing: '2px', fontWeight: 'bold' }}>{'|'.repeat(28)}</div>
      {el.showText && <div style={{ fontSize: '7pt', fontFamily: 'monospace', marginTop: '1mm' }}>{val}</div>}
      <div style={{ fontSize: '6pt', color: '#888' }}>[{el.format}]</div>
    </div>
  );
}

function RenderQr({ el, resolved }: { el: Extract<ThermalElement, { type: 'qrCode' }>; resolved: ThermalResolvedData }) {
  const val = resolved[el.binding] ?? (el as { value?: string }).value ?? '';
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid #000' }}>
      <div style={{ fontSize: '20pt' }}>⬛</div>
      <div style={{ fontSize: '6pt', color: '#888' }}>{val}</div>
    </div>
  );
}

function RenderSpacer() {
  return <div style={{ width: '100%', height: '100%', background: 'repeating-linear-gradient(45deg,#f0f0f0,#f0f0f0 2px,transparent 2px,transparent 8px)' }} />;
}

// ─── Resize handles ───────────────────────────────────────────────────────────

const HANDLE_EDGES: ThermalResizeHandle['edge'][] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

function edgeToPosition(edge: ThermalResizeHandle['edge']): React.CSSProperties {
  const hs = 8; // handle size px
  const hOffset = -hs / 2;
  const m: Record<string, React.CSSProperties> = {
    n:  { top: hOffset, left: '50%', transform: 'translateX(-50%)', cursor: 'n-resize' },
    s:  { bottom: hOffset, left: '50%', transform: 'translateX(-50%)', cursor: 's-resize' },
    e:  { right: hOffset, top: '50%', transform: 'translateY(-50%)', cursor: 'e-resize' },
    w:  { left: hOffset, top: '50%', transform: 'translateY(-50%)', cursor: 'w-resize' },
    ne: { top: hOffset, right: hOffset, cursor: 'ne-resize' },
    nw: { top: hOffset, left: hOffset, cursor: 'nw-resize' },
    se: { bottom: hOffset, right: hOffset, cursor: 'se-resize' },
    sw: { bottom: hOffset, left: hOffset, cursor: 'sw-resize' },
  };
  return m[edge] ?? {};
}

// ─── Main element renderer ────────────────────────────────────────────────────

export function ThermalElementRenderer({
  element: el,
  isSelected,
  previewMode,
  zoom,
  resolved,
  receiptData,
  domRef,
  onSelect,
  onStartResize,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const setRef = useCallback((node: HTMLDivElement | null) => {
    (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    domRef?.(node, el.id);
  }, [domRef, el.id]);

  const handleClick = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    if (!previewMode) onSelect(el.id, e.metaKey || e.ctrlKey || e.shiftKey);
  }, [previewMode, onSelect, el.id]);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleResizeMouseDown = useCallback((
    e: MouseEvent,
    edge: ThermalResizeHandle['edge'],
  ) => {
    e.stopPropagation();
    e.preventDefault();
    onStartResize?.({
      elementId: el.id,
      edge,
      startX: e.clientX,
      startY: e.clientY,
      startElX: el.xMm,
      startElY: el.yMm,
      startElW: el.widthMm,
      startElH: el.heightMm,
    });
  }, [onStartResize, el]);

  const selectionBorder = isSelected ? '2px solid #0d9488' : '1px solid transparent';
  const hoverBorder = '1px solid #5eead4';

  return (
    <div
      ref={setRef}
      data-element-id={el.id}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        left: `${el.xMm}mm`,
        top: `${el.yMm}mm`,
        width: `${el.widthMm}mm`,
        height: `${el.heightMm}mm`,
        zIndex: el.zIndex,
        outline: selectionBorder,
        outlineOffset: '-1px',
        cursor: previewMode ? 'default' : (el.locked ? 'not-allowed' : 'move'),
        userSelect: 'none',
        visibility: el.visible === false ? 'hidden' : 'visible',
      }}
      className={!previewMode && !isSelected ? 'group' : ''}
    >
      {/* Content */}
      {el.type === 'text'              && <RenderText el={el} />}
      {el.type === 'field'             && <RenderField el={el} resolved={resolved} />}
      {el.type === 'line'              && <RenderLine el={el} />}
      {el.type === 'image'             && <RenderImage el={el} resolved={resolved} />}
      {el.type === 'thermalItemsTable' && <RenderItemsTable el={el} receiptData={receiptData} />}
      {el.type === 'thermalTotals'     && <RenderTotals el={el} resolved={resolved} />}
      {el.type === 'barcode'           && <RenderBarcode el={el} resolved={resolved} />}
      {el.type === 'qrCode'            && <RenderQr el={el} resolved={resolved} />}
      {el.type === 'spacer'            && <RenderSpacer />}

      {/* Resize handles */}
      {isSelected && !previewMode && !el.locked && onStartResize && HANDLE_EDGES.map((edge) => (
        <div
          key={edge}
          style={{
            position: 'absolute',
            width: 8,
            height: 8,
            background: '#0d9488',
            border: '1px solid #fff',
            borderRadius: 2,
            zIndex: 1000,
            ...edgeToPosition(edge),
          }}
          onMouseDown={(e) => handleResizeMouseDown(e, edge)}
        />
      ))}
    </div>
  );
}
