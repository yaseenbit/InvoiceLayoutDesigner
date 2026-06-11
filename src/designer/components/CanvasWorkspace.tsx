import React, { useRef, useEffect, useCallback } from 'react';
import { useDesigner } from '../context/DesignerContext';
import { A4Canvas } from './A4Canvas';
import { Ruler } from './Ruler';
import { useElementDrag } from '../hooks/useElementDrag';
import { useElementResize } from '../hooks/useElementResize';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { MM_TO_CSS_PX } from '../utils/unitConversion';

const RULER_SIZE = 20;
const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;

export const CanvasWorkspace: React.FC = () => {
  const { template, zoom, previewMode, setZoom } = useDesigner();
  const workspaceRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useKeyboardShortcuts(canvasRef);
  const drag   = useElementDrag(canvasRef);
  const resize = useElementResize();

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      drag.onMouseMove(e);
      resize.onMouseMove(e);
    },
    [drag, resize],
  );

  const handleMouseUp = useCallback(() => {
    drag.onMouseUp();
    resize.onMouseUp();
  }, [drag, resize]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Fit zoom on first mount
  useEffect(() => {
    const el = workspaceRef.current;
    if (!el) return;
    const w = el.clientWidth - RULER_SIZE - 40;
    const h = el.clientHeight - RULER_SIZE - 40;
    const fitW = w / (PAGE_WIDTH_MM * MM_TO_CSS_PX);
    const fitH = h / (PAGE_HEIGHT_MM * MM_TO_CSS_PX);
    setZoom(Math.min(fitW, fitH, 1));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canvasPxW = PAGE_WIDTH_MM  * MM_TO_CSS_PX * zoom;
  const canvasPxH = PAGE_HEIGHT_MM * MM_TO_CSS_PX * zoom;
  const showRulers = template.page.showRulers && !previewMode;

  return (
    <div
      ref={workspaceRef}
      style={{
        flex: 1,
        overflow: 'auto',
        background: '#cbd5e1',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        minWidth: 0,
      }}
    >
      {/* Corner */}
      {showRulers && (
        <div style={{ display: 'flex', flexShrink: 0 }}>
          <div style={{ width: RULER_SIZE, height: RULER_SIZE, backgroundColor: '#e5e7eb', borderRight: '1px solid #d1d5db', borderBottom: '1px solid #d1d5db', flexShrink: 0 }} />
          <div style={{ overflow: 'hidden', flexShrink: 0, width: canvasPxW }}>
            <Ruler orientation="horizontal" lengthMm={PAGE_WIDTH_MM} zoom={zoom} thicknessPx={RULER_SIZE} />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flex: 1 }}>
        {showRulers && (
          <div style={{ overflow: 'hidden', flexShrink: 0, height: canvasPxH }}>
            <Ruler orientation="vertical" lengthMm={PAGE_HEIGHT_MM} zoom={zoom} thicknessPx={RULER_SIZE} />
          </div>
        )}

        {/* Scrollable canvas area */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            padding: 20,
          }}
        >
          <div
            ref={canvasRef}
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: '0 0',
              flexShrink: 0,
            }}
          >
            <A4Canvas onMouseDown={drag.startDrag} onStartResize={resize.startResize} />
          </div>
        </div>
      </div>
    </div>
  );
};
