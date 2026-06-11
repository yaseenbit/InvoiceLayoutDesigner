import React from 'react';
import { ThermalElementType } from '../types/thermal.types';

interface ToolboxItem {
  type: ThermalElementType;
  label: string;
  icon: string;
  description: string;
}

const TOOLBOX_ITEMS: ToolboxItem[] = [
  { type: 'text',              label: 'Text',        icon: 'T',  description: 'Static text label' },
  { type: 'field',             label: 'Field',       icon: '{}', description: 'Dynamic data field' },
  { type: 'line',              label: 'Line',        icon: '—',  description: 'Horizontal separator' },
  { type: 'image',             label: 'Logo/Image',  icon: '🖼',  description: 'Logo or image' },
  { type: 'thermalItemsTable', label: 'Items Table', icon: '☰',  description: 'Receipt line items' },
  { type: 'thermalTotals',     label: 'Totals',      icon: '∑',  description: 'Subtotal / tax / total' },
  { type: 'barcode',           label: 'Barcode',     icon: '▌▌', description: 'CODE128 / EAN13 barcode' },
  { type: 'qrCode',            label: 'QR Code',     icon: '⬛', description: 'QR code' },
  { type: 'spacer',            label: 'Spacer',      icon: '↕',  description: 'Vertical blank space' },
];

function ToolboxItem({ item }: { item: ToolboxItem }) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/thermal-element-type', item.type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="group"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 8px',
        borderRadius: 6,
        cursor: 'grab',
        userSelect: 'none',
        transition: 'background 0.12s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#f0fdfa')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{
        width: 32,
        height: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0fdfa',
        border: '1px solid #99f6e4',
        borderRadius: 5,
        fontSize: 13,
        fontFamily: 'monospace',
        fontWeight: 'bold',
        color: '#0f766e',
        flexShrink: 0,
      }}>
        {item.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', lineHeight: 1.3 }}>{item.label}</div>
        <div style={{ fontSize: 10, color: '#64748b', lineHeight: 1.2, marginTop: 1 }}>{item.description}</div>
      </div>
    </div>
  );
}

export function ThermalToolboxPanel() {
  return (
    <div style={{
      width: 180,
      borderRight: '1px solid #e2e8f0',
      background: '#fff',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      overflow: 'hidden',
    }}>
      <div style={{ padding: '10px 10px 6px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Elements
        </div>
        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Drag onto canvas</div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '4px 6px 8px' }}>
        {TOOLBOX_ITEMS.map((item) => (
          <ToolboxItem key={item.type} item={item} />
        ))}
      </div>
    </div>
  );
}
