import React from 'react';
import { ItemsTableElement } from '../types/template.types';
import { InvoiceItem } from '../types/invoice-data.types';
import { ptToPx } from '../utils/unitConversion';

interface Props {
  element: ItemsTableElement;
  preview: boolean;
  items?: InvoiceItem[];
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number') return val.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  return String(val);
}

const SAMPLE_ITEMS: InvoiceItem[] = [
  { slNo: 1, name: 'Software License', hsnCode: '998313', qty: 2, unit: 'Nos', rate: 25000, discount: 5, discountAmount: 2500, taxableAmount: 47500, taxPercent: 18, taxAmount: 8550, lineTotal: 56050 },
  { slNo: 2, name: 'Implementation Services', hsnCode: '998314', qty: 10, unit: 'Hrs', rate: 3500, discount: 0, discountAmount: 0, taxableAmount: 35000, taxPercent: 18, taxAmount: 6300, lineTotal: 41300 },
];

export const ItemsTableRenderer: React.FC<Props> = ({ element, preview, items }) => {
  const displayItems = preview ? (items ?? SAMPLE_ITEMS) : SAMPLE_ITEMS.slice(0, 2);
  const { columns, headerVisible, headerBackgroundColor, headerFontSizePt, rowFontSizePt, rowHeightMm, borderEnabled, columnBordersEnabled, alternateRowBackground, alternateRowColor } = element;

  const borderStr = borderEnabled ? '0.5px solid #9ca3af' : 'none';
  const colBorder = columnBordersEnabled ? '0.5px solid #9ca3af' : 'none';
  const headerFsPx = ptToPx(headerFontSizePt);
  const rowFsPx = ptToPx(rowFontSizePt);

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', border: borderStr, boxSizing: 'border-box' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        {headerVisible && (
          <thead>
            <tr style={{ backgroundColor: headerBackgroundColor }}>
              {columns.map((col) => (
                <th
                  key={col.id}
                  style={{
                    width: `${col.widthMm}mm`,
                    padding: '1mm 1.5mm',
                    fontSize: `${headerFsPx}px`,
                    fontWeight: 'bold',
                    color: '#fff',
                    textAlign: col.align,
                    borderRight: colBorder,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                  }}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {displayItems.map((item, rowIdx) => {
            const bg = alternateRowBackground && rowIdx % 2 === 1 ? alternateRowColor : 'transparent';
            return (
              <tr key={rowIdx} style={{ height: `${rowHeightMm}mm`, backgroundColor: bg }}>
                {columns.map((col) => {
                  const raw = (item as unknown as Record<string, unknown>)[col.binding];
                  return (
                    <td
                      key={col.id}
                      style={{
                        padding: '0.5mm 1.5mm',
                        fontSize: `${rowFsPx}px`,
                        textAlign: col.align,
                        borderTop: borderStr,
                        borderRight: colBorder,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {formatValue(raw)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
          {!preview && (
            <tr>
              <td
                colSpan={columns.length}
                style={{ padding: '1mm 2mm', fontSize: `${rowFsPx * 0.9}px`, color: '#9ca3af', borderTop: borderStr, fontStyle: 'italic' }}
              >
                {`[${displayItems.length} sample row(s) shown — live data in preview]`}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
