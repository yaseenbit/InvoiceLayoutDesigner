import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useThermal } from '../context/ThermalContext';
import { ThermalTemplate } from '../types/thermal.types';
import { openPrintPreview, downloadReceiptHtml } from '../services/ThermalHtmlRenderer';
import {
  downloadEscPosFile,
  sendViaWebSerial,
  sendViaWebUsb,
  hexDump,
  renderToEscPos,
} from '../services/EscPosRenderer';
import { SAMPLE_RECEIPT_DATA } from '../services/ThermalDataResolver';

interface Props {
  onNavigateToA4?: () => void;
}

export function ThermalTopToolbar({ onNavigateToA4 }: Props) {
  const ctx = useThermal();
  const { template, canUndo, canRedo, previewMode, zoom } = ctx;
  const importRef = useRef<HTMLInputElement>(null);
  const [escPosMenu, setEscPosMenu] = useState(false);
  const [hexModal, setHexModal] = useState<string | null>(null);
  const [escPosStatus, setEscPosStatus] = useState<string | null>(null);
  const [loadModal, setLoadModal] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState<ThermalTemplate[]>([]);
  const [saveFlash, setSaveFlash] = useState(false);

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

  const handleSave = useCallback(() => {
    ctx.saveTemplate();
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1500);
  }, [ctx]);

  const handleLoad = useCallback(() => {
    setSavedTemplates(ctx.listSavedTemplates());
    setLoadModal(true);
  }, [ctx]);

  const handleSelectSaved = useCallback((t: ThermalTemplate) => {
    ctx.loadTemplate(t);
    setLoadModal(false);
  }, [ctx]);

  const handleDeleteSaved = useCallback((id: string) => {
    ctx.deleteSavedTemplate(id);
    setSavedTemplates(ctx.listSavedTemplates());
  }, [ctx]);

  const handleEscPosDownload = useCallback(() => {
    downloadEscPosFile(template, SAMPLE_RECEIPT_DATA);
    setEscPosMenu(false);
  }, [template]);

  const handleEscPosHexDump = useCallback(() => {
    const bytes = renderToEscPos(template, SAMPLE_RECEIPT_DATA);
    setHexModal(hexDump(bytes));
    setEscPosMenu(false);
  }, [template]);

  const handleWebSerial = useCallback(async () => {
    setEscPosMenu(false);
    setEscPosStatus('Requesting serial port…');
    try {
      await sendViaWebSerial(template, SAMPLE_RECEIPT_DATA);
      setEscPosStatus('Sent via Web Serial ✓');
    } catch (e) {
      setEscPosStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
    setTimeout(() => setEscPosStatus(null), 4000);
  }, [template]);

  const handleWebUsb = useCallback(async () => {
    setEscPosMenu(false);
    setEscPosStatus('Requesting USB device…');
    try {
      await sendViaWebUsb(template, SAMPLE_RECEIPT_DATA);
      setEscPosStatus('Sent via WebUSB ✓');
    } catch (e) {
      setEscPosStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
    setTimeout(() => setEscPosStatus(null), 4000);
  }, [template]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); handleSave(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave]);

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

      {/* New / Save / Load */}
      <button onClick={ctx.newTemplate} style={btnStyle()} title="New template">New</button>
      <button
        onClick={handleSave}
        style={{ ...btnStyle(saveFlash), ...(saveFlash ? { background: '#f0fdfa', borderColor: '#0d9488', color: '#0f766e' } : {}) }}
        title="Save to library (⌘S)"
      >
        {saveFlash ? '✓ Saved' : 'Save'}
      </button>
      <button onClick={handleLoad} style={btnStyle()} title="Load from library">Load</button>

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

      {divider}

      {/* ESC/POS */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setEscPosMenu((v) => !v)}
          style={{ ...btnStyle(escPosMenu), background: escPosMenu ? '#f0fdfa' : '#fff' }}
          title="ESC/POS raw output"
        >
          ⎙ ESC/POS ▾
        </button>

        {escPosMenu && (
          <>
            {/* click-outside overlay */}
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 999 }}
              onClick={() => setEscPosMenu(false)}
            />
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 4,
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
              zIndex: 1000,
              minWidth: 210,
              overflow: 'hidden',
            }}>
              {[
                { label: '⬇  Download .bin',     sub: 'Raw ESC/POS binary file',    fn: handleEscPosDownload },
                { label: '🔍 Hex Dump',           sub: 'Inspect bytes in browser',    fn: handleEscPosHexDump  },
                { label: '⚡  Send via Web Serial', sub: 'Chrome + serial cable/USB',  fn: handleWebSerial      },
                { label: '🔌 Send via WebUSB',    sub: 'Chrome + USB-B cable',        fn: handleWebUsb         },
              ].map(({ label, sub, fn }) => (
                <button
                  key={label}
                  onClick={fn}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '9px 14px',
                    textAlign: 'left',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f1f5f9',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f0fdfa')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#0f172a' }}>{label}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>{sub}</div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Status toast */}
      {escPosStatus && (
        <div style={{
          position: 'fixed',
          bottom: 36,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#0f172a',
          color: '#fff',
          padding: '8px 16px',
          borderRadius: 6,
          fontSize: 12,
          zIndex: 9999,
          pointerEvents: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}>
          {escPosStatus}
        </div>
      )}

      {/* Load modal */}
      {loadModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 8, padding: 20, width: 420, maxHeight: '65vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Load Template</span>
              <button onClick={() => setLoadModal(false)} style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: '#64748b', lineHeight: 1 }}>✕</button>
            </div>
            {savedTemplates.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No saved templates yet.<br />Click Save to add the current template to the library.</div>
            ) : (
              <div style={{ flex: 1, overflow: 'auto' }}>
                {savedTemplates.map((t) => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{t.page.widthMm}mm · {t.elements.length} elements · {new Date(t.updatedAt).toLocaleString()}</div>
                    </div>
                    <button onClick={() => handleSelectSaved(t)} style={{ fontSize: 11, padding: '4px 10px', background: '#0d9488', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', flexShrink: 0 }}>Load</button>
                    <button onClick={() => handleDeleteSaved(t.id)} style={{ fontSize: 11, padding: '4px 8px', background: 'none', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: 4, cursor: 'pointer', flexShrink: 0 }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hex dump modal */}
      {hexModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#0f172a', borderRadius: 8, padding: 20, width: '70vw', maxHeight: '75vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#5eead4', fontFamily: 'monospace' }}>ESC/POS Hex Dump</span>
              <button onClick={() => setHexModal(null)} style={{ border: 'none', background: 'none', color: '#94a3b8', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>✕</button>
            </div>
            <pre style={{
              flex: 1,
              overflow: 'auto',
              fontFamily: 'monospace',
              fontSize: 11,
              color: '#e2e8f0',
              lineHeight: 1.6,
              margin: 0,
              padding: '8px 0',
            }}>
              {hexModal}
            </pre>
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
              <button
                onClick={handleEscPosDownload}
                style={{ fontSize: 11, padding: '5px 12px', background: '#0d9488', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
              >
                ⬇ Download .bin
              </button>
              <button
                onClick={() => { navigator.clipboard?.writeText(hexModal); }}
                style={{ fontSize: 11, padding: '5px 12px', background: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', borderRadius: 4, cursor: 'pointer' }}
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
