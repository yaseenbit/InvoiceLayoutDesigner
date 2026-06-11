import React from 'react';
import { TotalsBoxElement } from '../types/template.types';
import { ResolvedData } from '../types/invoice-data.types';
import { ptToPx } from '../utils/unitConversion';

interface Props {
  element: TotalsBoxElement;
  preview: boolean;
  resolvedData?: ResolvedData;
}

const SAMPLE: Record<string, string> = {
  'totals.subtotal':     '97,000.00',
  'totals.discount':      '3,700.00',
  'totals.taxableAmount':'93,300.00',
  'totals.cgst':              '0.00',
  'totals.sgst':              '0.00',
  'totals.igst':         '16,794.00',
  'totals.roundOff':         '-0.06',
  'totals.grandTotal':  '1,10,094.00',
};

export const TotalsBoxRenderer: React.FC<Props> = ({ element, preview, resolvedData }) => {
  const data = preview ? (resolvedData ?? SAMPLE) : SAMPLE;
  const { rows, labelWidthPercent, rowHeightMm, fontSizePt, borderEnabled } = element;
  const fsPx = ptToPx(fontSizePt);
  const borderStr = borderEnabled ? '0.5px solid #d1d5db' : 'none';

  return (
    <div style={{ width: '100%', height: '100%', border: borderStr, boxSizing: 'border-box', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {rows.filter((r) => r.visible).map((row) => (
            <tr key={row.id} style={{ height: `${rowHeightMm}mm` }}>
              <td
                style={{
                  width: `${labelWidthPercent}%`,
                  padding: '0 2mm',
                  fontSize: `${fsPx}px`,
                  fontWeight: row.bold ? 'bold' : 'normal',
                  textAlign: row.labelAlign ?? 'left',
                  borderBottom: borderStr,
                  backgroundColor: row.bold ? '#f0fdfa' : 'transparent',
                }}
              >
                {row.label}
              </td>
              <td
                style={{
                  padding: '0 2mm',
                  fontSize: `${fsPx}px`,
                  fontWeight: row.bold ? 'bold' : 'normal',
                  textAlign: row.valueAlign ?? 'right',
                  borderBottom: borderStr,
                  borderLeft: borderStr,
                  backgroundColor: row.bold ? '#f0fdfa' : 'transparent',
                }}
              >
                {data[row.binding] ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
