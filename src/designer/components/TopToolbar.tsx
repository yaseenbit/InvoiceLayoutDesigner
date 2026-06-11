import React, { useState, useRef } from 'react';
import { useDesigner } from '../context/DesignerContext';
import { localStorageTemplateRepository } from '../services/LocalStorageTemplateRepository';
import { exportTemplateJson, importTemplateJson, triggerPrint } from '../services/PrintService';
import { InvoiceTemplate } from '../types/template.types';
import { MM_TO_CSS_PX } from '../utils/unitConversion';

const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;

function Btn({ onClick, title, children, active, danger }: {
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        padding: '3px 7px',
        fontSize: 11,
        border: `1px solid ${active ? '#0d9488' : '#d1d5db'}`,
        borderRadius: 3,
        background: active ? '#ccfbf1' : '#fff',
        cursor: 'pointer',
        color: danger ? '#ef4444' : active ? '#0f766e' : '#374151',
        fontWeight: active ? 600 : 400,
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        whiteSpace: 'nowrap',
        lineHeight: 1,
        minHeight: 24,
      }}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div style={{ width: 1, height: 20, background: '#e2e8f0', margin: '0 2px', flexShrink: 0 }} />;
}

interface TemplateDialogProps {
  templates: InvoiceTemplate[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const TemplateDialog: React.FC<TemplateDialogProps> = ({ templates, onSelect, onDelete, onClose }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ background: '#fff', borderRadius: 4, padding: 16, width: 400, maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>Load Template</span>
        <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 16, cursor: 'pointer' }}>✕</button>
      </div>
      {templates.length === 0 && <p style={{ fontSize: 12, color: '#64748b' }}>No saved templates.</p>}
      <div style={{ overflowY: 'auto' }}>
        {templates.map((t) => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px', borderBottom: '1px solid #f1f5f9' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 500 }}>{t.name}</div>
              <div style={{ fontSize: 10, color: '#94a3b8' }}>{new Date(t.updatedAt).toLocaleString()}</div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <Btn onClick={() => onSelect(t.id)}>Load</Btn>
              <Btn onClick={() => onDelete(t.id)} danger>Del</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

interface TopToolbarProps {
  onNavigateToThermal?: () => void;
}

export const TopToolbar: React.FC<TopToolbarProps> = ({ onNavigateToThermal }) => {
  const {
    template, zoom, previewMode,
    canUndo, canRedo, isDirty,
    undo, redo,
    setZoom, setPreviewMode,
    setTemplate, newTemplate, markClean,
    updatePageSettings,
  } = useDesigner();

  const [showLoad, setShowLoad] = useState(false);
  const [loadTemplates, setLoadTemplates] = useState<InvoiceTemplate[]>([]);
  const nameRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    const name = nameRef.current?.value.trim();
    if (name) setTemplate({ ...template, name }, false);
    await localStorageTemplateRepository.save(template);
    markClean();
  };

  const handleLoad = async () => {
    const list = await localStorageTemplateRepository.list();
    setLoadTemplates(list);
    setShowLoad(true);
  };

  const handleSelectTemplate = async (id: string) => {
    const t = await localStorageTemplateRepository.get(id);
    if (t) { setTemplate(t, true); setShowLoad(false); }
  };

  const handleDeleteTemplate = async (id: string) => {
    await localStorageTemplateRepository.delete(id);
    setLoadTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const handleDuplicate = async () => {
    await localStorageTemplateRepository.save(template);
    const copy = await localStorageTemplateRepository.duplicate(template.id);
    setTemplate(copy, true);
  };

  const handleExport = () => exportTemplateJson(template);

  const handleImport = async () => {
    try {
      const json = await importTemplateJson();
      const imported = await localStorageTemplateRepository.import(json);
      setTemplate(imported, true);
    } catch (e: unknown) {
      alert(`Import failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleFitScreen = () => {
    const vw = window.innerWidth - 400;
    const vh = window.innerHeight - 80;
    const fitW = vw / (PAGE_WIDTH_MM * MM_TO_CSS_PX);
    const fitH = vh / (PAGE_HEIGHT_MM * MM_TO_CSS_PX);
    setZoom(Math.min(fitW, fitH) * 0.9);
  };

  const handlePrint = () => {
    setPreviewMode(true);
    setTimeout(() => {
      triggerPrint(template.page.multiPage ?? false);
      setTimeout(() => setPreviewMode(false), 500);
    }, 100);
  };

  return (
    <>
      <div
        style={{
          height: 38,
          borderBottom: '1px solid #d1d5db',
          backgroundColor: '#fff',
          display: 'flex',
          alignItems: 'center',
          padding: '0 8px',
          gap: 4,
          flexShrink: 0,
          overflowX: 'auto',
        }}
      >
        {/* Template name */}
        <input
          ref={nameRef}
          defaultValue={template.name}
          key={template.id}
          style={{
            padding: '2px 6px',
            fontSize: 12,
            border: '1px solid #d1d5db',
            borderRadius: 3,
            width: 160,
            fontWeight: 500,
            color: '#0f172a',
          }}
        />

        <Sep />

        <Btn onClick={newTemplate} title="New Template">New</Btn>
        <Btn onClick={handleSave} title="Save Template" active={isDirty}>
          {isDirty ? '● Save' : 'Save'}
        </Btn>
        <Btn onClick={handleLoad} title="Load Template">Load</Btn>
        <Btn onClick={handleDuplicate} title="Duplicate">Dupe</Btn>

        <Sep />

        <Btn onClick={() => { if (canUndo) undo(); }} title="Undo (Ctrl+Z)">↩ Undo</Btn>
        <Btn onClick={() => { if (canRedo) redo(); }} title="Redo (Ctrl+Shift+Z)">↪ Redo</Btn>

        <Sep />

        <Btn onClick={() => setZoom(zoom - 0.1)} title="Zoom Out">−</Btn>
        <span style={{ fontSize: 11, color: '#374151', minWidth: 38, textAlign: 'center' }}>
          {Math.round(zoom * 100)}%
        </span>
        <Btn onClick={() => setZoom(zoom + 0.1)} title="Zoom In">+</Btn>
        <Btn onClick={handleFitScreen} title="Fit to Screen">Fit</Btn>

        <Sep />

        <Btn
          onClick={() => updatePageSettings({ showGrid: !template.page.showGrid })}
          active={template.page.showGrid}
          title="Toggle Grid"
        >
          Grid
        </Btn>
        <Btn
          onClick={() => updatePageSettings({ snapToGrid: !template.page.snapToGrid })}
          active={template.page.snapToGrid}
          title="Toggle Snap"
        >
          Snap
        </Btn>
        <Btn
          onClick={() => updatePageSettings({ showRulers: !template.page.showRulers })}
          active={template.page.showRulers}
          title="Toggle Rulers"
        >
          Rulers
        </Btn>

        <Sep />

        <Btn onClick={() => setPreviewMode(!previewMode)} active={previewMode} title="Toggle Preview">
          {previewMode ? '✓ Preview' : 'Preview'}
        </Btn>
        <Btn onClick={handlePrint} title="Print">Print</Btn>
        <Btn onClick={handleExport} title="Export JSON">Export</Btn>
        <Btn onClick={handleImport} title="Import JSON">Import</Btn>

        {onNavigateToThermal && (
          <>
            <Sep />
            <Btn onClick={onNavigateToThermal} title="Switch to Thermal Designer">
              🖨 Thermal
            </Btn>
          </>
        )}
      </div>

      {showLoad && (
        <TemplateDialog
          templates={loadTemplates}
          onSelect={handleSelectTemplate}
          onDelete={handleDeleteTemplate}
          onClose={() => setShowLoad(false)}
        />
      )}
    </>
  );
};
