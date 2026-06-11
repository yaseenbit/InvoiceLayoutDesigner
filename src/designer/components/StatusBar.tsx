import React from 'react';
import { useDesigner } from '../context/DesignerContext';

export const StatusBar: React.FC = () => {
  const { template, selectedIds, zoom, previewMode, isDirty } = useDesigner();
  const selectedEl = selectedIds.length === 1
    ? template.elements.find((el) => el.id === selectedIds[0])
    : undefined;

  return (
    <div
      style={{
        height: 22,
        borderTop: '1px solid #d1d5db',
        backgroundColor: '#f1f5f9',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: 16,
        fontSize: 10,
        color: '#64748b',
        flexShrink: 0,
      }}
    >
      <span>{template.name}{isDirty ? ' •' : ''}</span>
      <span>|</span>
      <span>A4 210×297mm</span>
      {selectedEl && (
        <>
          <span>|</span>
          <span>
            <b>{selectedEl.name}</b>
            {' '}x={selectedEl.xMm.toFixed(1)} y={selectedEl.yMm.toFixed(1)} w={selectedEl.widthMm.toFixed(1)} h={selectedEl.heightMm.toFixed(1)}mm
          </span>
        </>
      )}
      {selectedIds.length > 1 && (
        <>
          <span>|</span>
          <span>{selectedIds.length} elements selected</span>
        </>
      )}
      <span style={{ marginLeft: 'auto' }}>
        {previewMode && <span style={{ marginRight: 8, color: '#0d9488', fontWeight: 600 }}>PREVIEW</span>}
        Zoom: {Math.round(zoom * 100)}%
        <span style={{ marginLeft: 8 }}>{template.elements.length} elements</span>
      </span>
    </div>
  );
};
