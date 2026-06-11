import React, { useCallback, useRef } from 'react';
import { useThermal } from '../context/ThermalContext';
import { ThermalTemplate } from '../types/thermal.types';
import { openPrintPreview, downloadReceiptHtml } from '../services/ThermalHtmlRenderer';
import { SAMPLE_RECEIPT_DATA } from '../services/ThermalDataResolver';

interface Props {
  onNavigateToA4?: () => void;
}

export function ThermalTopToolbar({ onNavigateToA4 }: Props) {
  const ctx = useThermal();
  const { template, canUndo, canRedo, previewMode, zoom } = ctx;
  const importRef = useRef<HTMLInputElement>(null);

  const btnStyle = (active?: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '5px 10px',
    fontSize: 12,
    borderRadius: 5,
    border: `1px solid ${active ? '#0d9488' : '#d1d5db'}`,
    background: active ? '#f0fdfa' : '#fff',
    color: active ? '#0f766e' : '#374151',
    cursor: 'pointer',
    fontWeight: active ? 600 : 400,
    whiteSpace: 'nowrap',
  });

  const divider = <div style={{ width: 1, height: 24, background: '#e2e8f0' }} />;

  const exportTemplate = useCallback(() => {
    const json = JSON.stringify(template, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${template.name.replace(/\s+/g, '_')}.thermal.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [template]);

  const importTemplate = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const loaded = JSON.parse(ev.target?.result as string) as ThermalTemplate;
        if (loaded.type !== 'THERMAL') throw new Error('Not a thermal template');
        ctx.loadTemplate(loaded);
      } catch {
        alert('Invalid template file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [ctx]);

  const handlePrint = useCallback(() => {
    openPrintPreview(template, SAMPLE_RECEIPT_DATA);
  }, [template]);

  const handleDownload = useCallback(() => {
    downloadReceiptHtml(template, SAMPLE_RECEIPT_DATA);
  }, [template]);

  const setZoom = (delta: number) => {
    const next = Math.max(0.3, Math.min(3, zoom + delta));
    ctx.setZoom(Math.round(next * 10) / 10);
  };

  return (
    <div style={{
      height: 46,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '0 12px',
      borderBottom: '1px solid #e2e8f0',
      background: '#fff',
      flexShrink: 0,
    }}>
      {/* App breadcrumb */}
      {onNavigateToA4 && (
        <>
          <button onClick={onNavigateToA4} style={{ ...btnStyle(), fontSize: 11, padding: '4px 8px', color: '#64748b' }}>
            ← A4 Designer
          </button>
          {divider}
        </>
      )}

      {/* Template name */}
      <input
        value={template.name}
        onChange={(e) => ctx.setTemplateName(e.target.value)}
        style={{
          fontSize: 13,
          fontWeight: 600,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          color: '#0f172a',
          minWidth: 120,
          maxWidth: 200,
        }}
      />

      {divider}

      {/* Undo / Redo */}
      <button disabled={!canUndo} onClick={ctx.undo} style={{ ...btnStyle(), opacity: canUndo ? 1 : 0.4 }} title="Undo (⌘Z)">↩ Undo</button>
      <button disabled={!canRedo} onClick={ctx.redo} style={{ ...btnStyle(), opacity: canRedo ? 1 : 0.4 }} title="Redo (⌘⇧Z)">↪ Redo</button>

      {divider}

      {/* Zoom */}
      <button onClick={() => setZoom(-0.1)} style={btnStyle()}>−</button>
      <span style={{ fontSize: 12, minWidth: 36, textAlign: 'center', color: '#374151' }}>{Math.round(zoom * 100)}%</span>
      <button onClick={() => setZoom(+0.1)} style={btnStyle()}>+</button>
      <button onClick={() => ctx.setZoom(1)} style={btnStyle()}>Fit</button>

      {divider}

      {/* Preview */}
      <button onClick={ctx.togglePreview} style={btnStyle(previewMode)}>
        {previewMode ? '✕ Edit' : '👁 Preview'}
      </button>

      {divider}

      {/* Import / Export */}
      <button onClick={exportTemplate} style={btnStyle()} title="Export template JSON">⬇ Export</button>
      <button onClick={() => importRef.current?.click()} style={btnStyle()} title="Import template JSON">⬆ Import</button>
      <input ref={importRef} type="file" accept=".json" onChange={importTemplate} style={{ display: 'none' }} />

      {divider}

      {/* Print / Download */}
      <button onClick={handleDownload} style={btnStyle()} title="Download standalone HTML">⬇ HTML</button>
      <button
        onClick={handlePrint}
        style={{ ...btnStyle(), background: '#0d9488', color: '#fff', border: '1px solid #0d9488' }}
        title="Print to thermal printer"
      >
        🖨 Print
      </button>
    </div>
  );
}
