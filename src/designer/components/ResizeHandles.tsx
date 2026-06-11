import React from 'react';
import { ResizeHandle } from '../hooks/useElementResize';

interface Props {
  onStartResize: (e: React.MouseEvent, handle: ResizeHandle) => void;
}

const HANDLES: Array<{ id: ResizeHandle; style: React.CSSProperties }> = [
  { id: 'nw', style: { top: -4, left: -4, cursor: 'nw-resize' } },
  { id: 'n',  style: { top: -4, left: '50%', transform: 'translateX(-50%)', cursor: 'n-resize' } },
  { id: 'ne', style: { top: -4, right: -4, cursor: 'ne-resize' } },
  { id: 'e',  style: { top: '50%', right: -4, transform: 'translateY(-50%)', cursor: 'e-resize' } },
  { id: 'se', style: { bottom: -4, right: -4, cursor: 'se-resize' } },
  { id: 's',  style: { bottom: -4, left: '50%', transform: 'translateX(-50%)', cursor: 's-resize' } },
  { id: 'sw', style: { bottom: -4, left: -4, cursor: 'sw-resize' } },
  { id: 'w',  style: { top: '50%', left: -4, transform: 'translateY(-50%)', cursor: 'w-resize' } },
];

export const ResizeHandles: React.FC<Props> = ({ onStartResize }) => {
  return (
    <>
      {HANDLES.map((h) => (
        <div
          key={h.id}
          onMouseDown={(e) => { e.stopPropagation(); onStartResize(e, h.id); }}
          style={{
            position: 'absolute',
            width: 8,
            height: 8,
            backgroundColor: '#fff',
            border: '1.5px solid #0d9488',
            borderRadius: 2,
            zIndex: 10000,
            ...h.style,
          }}
        />
      ))}
    </>
  );
};
