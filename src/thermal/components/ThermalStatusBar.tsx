import React from 'react';
import { useThermal } from '../context/ThermalContext';

export function ThermalStatusBar() {
  const { template, selectedElements, zoom } = useThermal();
  const { page } = template;
  const el = selectedElements.length === 1 ? selectedElements[0] : null;

  return (
    <div style={{
      height: 26,
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '0 12px',
      borderTop: '1px solid #e2e8f0',
      background: '#f8fafc',
      fontSize: 11,
      color: '#64748b',
      flexShrink: 0,
    }}>
      <span>Paper: {page.widthMm}mm × {page.heightMm}mm</span>
      <span>Elements: {template.elements.length}</span>
      {selectedElements.length > 0 && (
        <span style={{ color: '#0f766e' }}>
          {selectedElements.length === 1
            ? `Selected: ${el!.name} (${el!.xMm.toFixed(1)}, ${el!.yMm.toFixed(1)}) ${el!.widthMm.toFixed(1)}×${el!.heightMm.toFixed(1)} mm`
            : `${selectedElements.length} elements selected`}
        </span>
      )}
      <span style={{ marginLeft: 'auto' }}>Zoom: {Math.round(zoom * 100)}%</span>
    </div>
  );
}
