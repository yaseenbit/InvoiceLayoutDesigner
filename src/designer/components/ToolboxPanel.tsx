import React from 'react';
import { ElementType } from '../types/template.types';

interface ToolItem {
  type: ElementType;
  label: string;
  icon: string;
  description: string;
}

const TOOL_GROUPS: Array<{ group: string; items: ToolItem[] }> = [
  {
    group: 'Basic',
    items: [
      { type: 'text',      label: 'Static Text',    icon: 'T',  description: 'Fixed text content' },
      { type: 'field',     label: 'Dynamic Field',  icon: '{}', description: 'Data-bound field' },
      { type: 'box',       label: 'Rectangle',      icon: '□',  description: 'Filled rectangle' },
      { type: 'line',      label: 'Line',           icon: '—',  description: 'Horizontal/vertical line' },
      { type: 'separator', label: 'Separator',      icon: '═',  description: 'Full-width divider' },
      { type: 'image',     label: 'Image / Logo',   icon: '🖼', description: 'Image or logo' },
    ],
  },
  {
    group: 'Tables',
    items: [
      { type: 'itemsTable',       label: 'Items Table',    icon: '⊞', description: 'Invoice line items' },
      { type: 'taxSummaryTable',  label: 'Tax Summary',    icon: '⊟', description: 'Tax breakdown table' },
      { type: 'totalsBox',        label: 'Totals Box',     icon: '∑', description: 'Subtotal / grand total' },
    ],
  },
  {
    group: 'Misc',
    items: [
      { type: 'amountInWords', label: 'Amount in Words', icon: 'ꟻ', description: 'Total as text' },
      { type: 'signatureBox',  label: 'Signature Box',   icon: '✍', description: 'Signature placeholder' },
      { type: 'qrCode',        label: 'QR Code',         icon: '⬛', description: 'QR code placeholder' },
    ],
  },
];

export const ToolboxPanel: React.FC = () => {
  const handleDragStart = (e: React.DragEvent, type: ElementType) => {
    e.dataTransfer.setData('elementType', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      style={{
        width: 148,
        flexShrink: 0,
        borderRight: '1px solid #d1d5db',
        backgroundColor: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      <div style={{ padding: '6px 8px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f1f5f9' }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Elements</span>
      </div>

      {TOOL_GROUPS.map(({ group, items }) => (
        <div key={group}>
          <div style={{ padding: '4px 8px 2px', fontSize: 9, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{group}</div>
          {items.map((item) => (
            <div
              key={item.type}
              draggable
              onDragStart={(e) => handleDragStart(e, item.type)}
              title={item.description}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 8px',
                cursor: 'grab',
                borderRadius: 3,
                margin: '1px 4px',
                fontSize: 11,
                color: '#1e293b',
                userSelect: 'none',
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#e0f2fe')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontSize: 13, width: 16, textAlign: 'center', color: '#0d9488', flexShrink: 0 }}>{item.icon}</span>
              <span style={{ fontSize: 11, lineHeight: 1.3 }}>{item.label}</span>
            </div>
          ))}
        </div>
      ))}

      <div style={{ padding: '8px', marginTop: 'auto', borderTop: '1px solid #e5e7eb' }}>
        <p style={{ fontSize: 9, color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
          Drag elements onto the canvas to add them.
        </p>
      </div>
    </div>
  );
};
