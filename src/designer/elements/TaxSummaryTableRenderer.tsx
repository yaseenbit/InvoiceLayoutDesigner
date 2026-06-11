import React from 'react';
import { TaxSummaryTableElement } from '../types/template.types';
import { TaxBreakdownRow } from '../types/invoice-data.types';
import { ptToPx } from '../utils/unitConversion';

interface Props {
  element: TaxSummaryTableElement;
  preview: boolean;
  taxBreakdown?: TaxBreakdownRow[];
}

const SAMPLE_ROWS: TaxBreakdownRow[] = [
  { taxPercent: 18, taxableAmount: 93300, cgst: 0, sgst: 0, igst: 16794, totalTax: 16794 },
];

function fmt(v: number) {
  return v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const TaxSummaryTableRenderer: React.FC<Props> = ({ element, preview, taxBreakdown }) => {
  const rows = preview ? (taxBreakdown ?? SAMPLE_ROWS) : SAMPLE_ROWS;
  const { columns, headerVisible, headerBackgroundColor, headerFontSizePt, rowFontSizePt, rowHeightMm, borderEnabled } = element;
  const borderStr = borderEnabled ? '0.5px solid #9ca3af' : 'none';
  const hFsPx = ptToPx(headerFontSizePt);
  const rFsPx = ptToPx(rowFontSizePt);

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', border: borderStr, boxSizing: 'border-box' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        {headerVisible && (
          <thead>
            <tr style={{ backgroundColor: headerBackgroundColor }}>
              {columns.map((col) => (
                <th key={col.id} style={{ width: `${col.widthMm}mm`, padding: '1mm 1.5mm', fontSize: `${hFsPx}px`, fontWeight: 'bold', color: '#fff', textAlign: col.align, borderRight: borderStr }}>
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((row, i) => {
            const map: Record<string, number> = {
              taxPercent: row.taxPercent,
              taxableAmount: row.taxableAmount,
              cgst: row.cgst,
              sgst: row.sgst,
              igst: row.igst,
              totalTax: row.totalTax,
            };
            return (
              <tr key={i} style={{ height: `${rowHeightMm}mm` }}>
                {columns.map((col) => (
                  <td key={col.id} style={{ padding: '0.5mm 1.5mm', fontSize: `${rFsPx}px`, textAlign: col.align, borderTop: borderStr, borderRight: borderStr }}>
                    {col.binding === 'taxPercent' ? `${map[col.binding]}%` : fmt(map[col.binding] ?? 0)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
