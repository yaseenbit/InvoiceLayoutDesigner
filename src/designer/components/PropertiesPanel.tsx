import React, { useCallback } from 'react';
import { useDesigner } from '../context/DesignerContext';
import {
  InvoiceElement,
  ElementStyle,
  A4PageSettings,
  PageRole,
  FieldElement,
  TextElement,
  LineElement,
  ItemsTableElement,
  TotalsBoxElement,
  SignatureBoxElement,
} from '../types/template.types';

// ─── Generic inputs ───────────────────────────────────────────────────────────

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
      <label style={{ fontSize: 10, color: '#475569', width: 70, flexShrink: 0, lineHeight: 1.2 }}>{label}</label>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '2px 4px',
  fontSize: 11,
  border: '1px solid #d1d5db',
  borderRadius: 2,
  boxSizing: 'border-box',
  outline: 'none',
  backgroundColor: '#fff',
};

const selectStyle: React.CSSProperties = { ...inputStyle };

function NumberInput({ value, onChange, min, max, step = 0.1 }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      style={inputStyle}
    />
  );
}

function TextInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <input type="text" value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle} />;
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
      <input type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)} style={{ width: 22, height: 22, padding: 1, border: '1px solid #d1d5db', borderRadius: 2, cursor: 'pointer' }} />
      <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="#000000" style={{ ...inputStyle, width: 70 }} />
    </div>
  );
}

function CheckInput({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, cursor: 'pointer' }}>
      <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} style={{ margin: 0 }} />
      {label && <span style={{ fontSize: 11 }}>{label}</span>}
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, paddingBottom: 2, borderBottom: '1px solid #e5e7eb' }}>{title}</div>
      {children}
    </div>
  );
}

// ─── Bindings list ────────────────────────────────────────────────────────────

const ALL_BINDINGS = [
  'company.name','company.address','company.phone','company.email','company.gstin','company.logoUrl','company.website',
  'invoice.number','invoice.date','invoice.dueDate','invoice.salesType','invoice.paymentMode','invoice.placeOfSupply','invoice.notes',
  'customer.name','customer.address','customer.phone','customer.email','customer.gstin',
  'totals.subtotal','totals.discount','totals.taxableAmount','totals.cgst','totals.sgst','totals.igst','totals.roundOff','totals.grandTotal','totals.amountInWords',
];

// ─── Page settings ────────────────────────────────────────────────────────────

const PageSettings: React.FC<{ page: A4PageSettings; update: (u: Partial<A4PageSettings>) => void }> = ({ page, update }) => (
  <div style={{ padding: '6px 8px', overflowY: 'auto', flex: 1 }}>
    <Section title="Page">
      <Row label="Template"><span style={{ fontSize: 11, color: '#64748b' }}>A4 (210 × 297mm)</span></Row>
    </Section>
    <Section title="Margins (mm)">
      <Row label="Top"><NumberInput value={page.marginTopMm} onChange={(v) => update({ marginTopMm: v })} min={0} max={50} /></Row>
      <Row label="Right"><NumberInput value={page.marginRightMm} onChange={(v) => update({ marginRightMm: v })} min={0} max={50} /></Row>
      <Row label="Bottom"><NumberInput value={page.marginBottomMm} onChange={(v) => update({ marginBottomMm: v })} min={0} max={50} /></Row>
      <Row label="Left"><NumberInput value={page.marginLeftMm} onChange={(v) => update({ marginLeftMm: v })} min={0} max={50} /></Row>
    </Section>
    <Section title="Font">
      <Row label="Family"><TextInput value={page.defaultFontFamily} onChange={(v) => update({ defaultFontFamily: v })} /></Row>
      <Row label="Size (pt)"><NumberInput value={page.defaultFontSizePt} onChange={(v) => update({ defaultFontSizePt: v })} min={6} max={72} step={1} /></Row>
    </Section>
    <Section title="Grid">
      <Row label="Grid size">
        <select value={page.gridSizeMm} onChange={(e) => update({ gridSizeMm: parseInt(e.target.value) })} style={selectStyle}>
          {[1, 2, 5, 10].map((v) => <option key={v} value={v}>{v}mm</option>)}
        </select>
      </Row>
      <Row label="Snap"><CheckInput value={page.snapToGrid} onChange={(v) => update({ snapToGrid: v })} label="Snap to grid" /></Row>
      <Row label="Show grid"><CheckInput value={page.showGrid} onChange={(v) => update({ showGrid: v })} label="Show grid" /></Row>
      <Row label="Rulers"><CheckInput value={page.showRulers} onChange={(v) => update({ showRulers: v })} label="Show rulers" /></Row>
      <Row label="Margins"><CheckInput value={page.showMarginGuides} onChange={(v) => update({ showMarginGuides: v })} label="Margin guides" /></Row>
    </Section>
    <Section title="Multi-page">
      <Row label="Enabled">
        <CheckInput value={!!page.multiPage} onChange={(v) => update({ multiPage: v })} label="Paginate items table" />
      </Row>
      {page.multiPage && (
        <>
          <Row label="Body start">
            <NumberInput value={page.bodyStartMm ?? page.marginTopMm} onChange={(v) => update({ bodyStartMm: v })} min={0} max={200} />
          </Row>
          <Row label="Body end">
            <NumberInput value={page.bodyEndMm ?? (page.heightMm - page.marginBottomMm)} onChange={(v) => update({ bodyEndMm: v })} min={50} max={297} />
          </Row>
          <p style={{ fontSize: 9, color: '#94a3b8', margin: '2px 0 0', lineHeight: 1.4 }}>
            Body region defines where items table rows are rendered on continuation pages.
          </p>
        </>
      )}
    </Section>
  </div>
);

// ─── Element style section ────────────────────────────────────────────────────

const StyleSection: React.FC<{
  style: ElementStyle;
  update: (u: Partial<ElementStyle>) => void;
}> = ({ style, update }) => (
  <Section title="Typography">
    <Row label="Font"><TextInput value={style.fontFamily ?? ''} onChange={(v) => update({ fontFamily: v })} /></Row>
    <Row label="Size (pt)"><NumberInput value={style.fontSizePt ?? 10} onChange={(v) => update({ fontSizePt: v })} min={4} max={144} step={0.5} /></Row>
    <Row label="Formatting">
      <div style={{ display: 'flex', gap: 4 }}>
        {(['bold','italic','underline'] as const).map((f) => (
          <label key={f} style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={!!(style as Record<string, unknown>)[f]} onChange={(e) => update({ [f]: e.target.checked })} style={{ margin: 0 }} />
            <span style={{ fontWeight: f === 'bold' ? 'bold' : 'normal', fontStyle: f === 'italic' ? 'italic' : 'normal', textDecoration: f === 'underline' ? 'underline' : 'none' }}>{f[0].toUpperCase()}</span>
          </label>
        ))}
      </div>
    </Row>
    <Row label="Color"><ColorInput value={style.color ?? '#000000'} onChange={(v) => update({ color: v })} /></Row>
    <Row label="Background"><ColorInput value={style.backgroundColor ?? 'transparent'} onChange={(v) => update({ backgroundColor: v })} /></Row>
    <Row label="Align">
      <select value={style.textAlign ?? 'left'} onChange={(e) => update({ textAlign: e.target.value as 'left' | 'center' | 'right' })} style={selectStyle}>
        <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
      </select>
    </Row>
    <Row label="V-Align">
      <select value={style.verticalAlign ?? 'top'} onChange={(e) => update({ verticalAlign: e.target.value as 'top' | 'middle' | 'bottom' })} style={selectStyle}>
        <option value="top">Top</option><option value="middle">Middle</option><option value="bottom">Bottom</option>
      </select>
    </Row>
    <Row label="Padding (mm)"><NumberInput value={style.paddingMm ?? 0} onChange={(v) => update({ paddingMm: v })} min={0} max={20} /></Row>
  </Section>
);

const BorderSection: React.FC<{ style: ElementStyle; update: (u: Partial<ElementStyle>) => void }> = ({ style, update }) => (
  <Section title="Border">
    <Row label="Enabled"><CheckInput value={!!style.border} onChange={(v) => update({ border: v })} label="Show border" /></Row>
    {style.border && (
      <>
        <Row label="Width (px)"><NumberInput value={style.borderWidthPx ?? 1} onChange={(v) => update({ borderWidthPx: v })} min={0.5} max={10} step={0.5} /></Row>
        <Row label="Color"><ColorInput value={style.borderColor ?? '#d1d5db'} onChange={(v) => update({ borderColor: v })} /></Row>
        <Row label="Style">
          <select value={style.borderStyle ?? 'solid'} onChange={(e) => update({ borderStyle: e.target.value as 'solid' | 'dashed' | 'dotted' })} style={selectStyle}>
            <option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option>
          </select>
        </Row>
      </>
    )}
  </Section>
);

// ─── Main component ───────────────────────────────────────────────────────────

export const PropertiesPanel: React.FC = () => {
  const {
    template,
    selectedIds,
    updateElement,
    updatePageSettings,
    deleteElements,
    duplicateElements,
    reorder,
  } = useDesigner();

  const selectedElement: InvoiceElement | undefined =
    selectedIds.length === 1
      ? template.elements.find((el) => el.id === selectedIds[0])
      : undefined;

  const updateEl = useCallback(
    (field: string, value: unknown) => {
      if (!selectedElement) return;
      updateElement(selectedElement.id, (el) => ({ ...el, [field]: value } as InvoiceElement));
    },
    [selectedElement, updateElement],
  );

  const updateStyle = useCallback(
    (updates: Partial<ElementStyle>) => {
      if (!selectedElement) return;
      updateElement(selectedElement.id, (el) => ({
        ...el,
        style: { ...el.style, ...updates },
      } as InvoiceElement));
    },
    [selectedElement, updateElement],
  );

  if (!selectedElement) {
    return (
      <div style={{ width: 200, flexShrink: 0, borderLeft: '1px solid #d1d5db', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '6px 8px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f1f5f9' }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Page Settings</span>
        </div>
        <PageSettings page={template.page} update={updatePageSettings} />
      </div>
    );
  }

  const el = selectedElement;

  return (
    <div style={{ width: 200, flexShrink: 0, borderLeft: '1px solid #d1d5db', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <div style={{ padding: '6px 8px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {el.type}
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => duplicateElements([el.id])} title="Duplicate" style={btnStyle}>⧉</button>
          <button onClick={() => deleteElements([el.id])} title="Delete" style={{ ...btnStyle, color: '#ef4444' }}>✕</button>
        </div>
      </div>

      <div style={{ padding: '6px 8px', flex: 1, overflowY: 'auto' }}>
        <Section title="Identity">
          <Row label="Name"><TextInput value={el.name} onChange={(v) => updateEl('name', v)} /></Row>
          <Row label="ID"><span style={{ fontSize: 9, color: '#94a3b8', wordBreak: 'break-all' }}>{el.id.slice(0, 16)}…</span></Row>
        </Section>

        <Section title="Position & Size">
          <Row label="X (mm)"><NumberInput value={Math.round(el.xMm * 10) / 10} onChange={(v) => updateEl('xMm', v)} min={0} max={210} /></Row>
          <Row label="Y (mm)"><NumberInput value={Math.round(el.yMm * 10) / 10} onChange={(v) => updateEl('yMm', v)} min={0} max={297} /></Row>
          <Row label="W (mm)"><NumberInput value={Math.round(el.widthMm * 10) / 10} onChange={(v) => updateEl('widthMm', Math.max(2, v))} min={2} max={210} /></Row>
          <Row label="H (mm)"><NumberInput value={Math.round(el.heightMm * 10) / 10} onChange={(v) => updateEl('heightMm', Math.max(2, v))} min={2} max={297} /></Row>
          <Row label="Z-index"><NumberInput value={el.zIndex} onChange={(v) => updateEl('zIndex', Math.round(v))} min={1} max={9999} step={1} /></Row>
          <Row label="Rotation">
            <NumberInput value={el.rotation ?? 0} onChange={(v) => updateEl('rotation', v)} min={-360} max={360} step={1} />
          </Row>
        </Section>

        <Section title="Visibility">
          <Row label="Visible"><CheckInput value={el.visible !== false} onChange={(v) => updateEl('visible', v)} label="Visible" /></Row>
          <Row label="Locked"><CheckInput value={!!el.locked} onChange={(v) => updateEl('locked', v)} label="Locked" /></Row>
        </Section>

        {/* Multi-page role — only shown when template has multiPage enabled */}
        {template.page.multiPage && (
          <Section title="Multi-page Role">
            <Row label="Page role">
              <select
                value={el.pageRole ?? 'all'}
                onChange={(e) => updateEl('pageRole', e.target.value as PageRole)}
                style={selectStyle}
              >
                <option value="all">All pages</option>
                <option value="first">First page only</option>
                <option value="last">Last page only</option>
                <option value="firstLast">First &amp; last</option>
                <option value="continuation">Continuation pages</option>
                <option value="body">Body (items region)</option>
              </select>
            </Row>
            <p style={{ fontSize: 9, color: '#94a3b8', margin: '2px 0 0', lineHeight: 1.4 }}>
              Controls which pages this element appears on when the invoice spans multiple pages.
            </p>
          </Section>
        )}

        {/* Dynamic field binding */}
        {el.type === 'field' && (
          <Section title="Field Binding">
            <Row label="Binding">
              <select value={(el as FieldElement).binding} onChange={(e) => updateEl('binding', e.target.value)} style={selectStyle}>
                {ALL_BINDINGS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </Row>
            <Row label="Fallback"><TextInput value={(el as FieldElement).fallback ?? ''} onChange={(v) => updateEl('fallback', v)} /></Row>
          </Section>
        )}

        {/* Static text */}
        {el.type === 'text' && (
          <Section title="Content">
            <div style={{ marginBottom: 3 }}>
              <label style={{ fontSize: 10, color: '#475569' }}>Text</label>
              <textarea
                value={(el as TextElement).content}
                onChange={(e) => updateEl('content', e.target.value)}
                rows={3}
                style={{ ...inputStyle, resize: 'vertical', marginTop: 2 }}
              />
            </div>
          </Section>
        )}

        {/* Line element */}
        {el.type === 'line' && (
          <Section title="Line">
            <Row label="Orientation">
              <select value={(el as LineElement).orientation} onChange={(e) => updateEl('orientation', e.target.value)} style={selectStyle}>
                <option value="horizontal">Horizontal</option>
                <option value="vertical">Vertical</option>
              </select>
            </Row>
            <Row label="Width (px)"><NumberInput value={(el as LineElement).lineWidthPx} onChange={(v) => updateEl('lineWidthPx', v)} min={0.5} max={20} step={0.5} /></Row>
            <Row label="Color"><ColorInput value={(el as LineElement).lineColor} onChange={(v) => updateEl('lineColor', v)} /></Row>
          </Section>
        )}

        {/* Signature */}
        {el.type === 'signatureBox' && (
          <Section title="Signature">
            <Row label="Label"><TextInput value={(el as SignatureBoxElement).label} onChange={(v) => updateEl('label', v)} /></Row>
            <Row label="Show line"><CheckInput value={(el as SignatureBoxElement).showLine} onChange={(v) => updateEl('showLine', v)} label="Show line" /></Row>
          </Section>
        )}

        {/* Items table: column config */}
        {el.type === 'itemsTable' && (
          <Section title="Table Config">
            <Row label="Header BG">
              <ColorInput value={(el as ItemsTableElement).headerBackgroundColor} onChange={(v) => updateEl('headerBackgroundColor', v)} />
            </Row>
            <Row label="Row height">
              <NumberInput value={(el as ItemsTableElement).rowHeightMm} onChange={(v) => updateEl('rowHeightMm', v)} min={4} max={20} step={0.5} />
            </Row>
            <Row label="Alt rows">
              <CheckInput value={(el as ItemsTableElement).alternateRowBackground} onChange={(v) => updateEl('alternateRowBackground', v)} label="Alternate rows" />
            </Row>
          </Section>
        )}

        {/* Totals box */}
        {el.type === 'totalsBox' && (
          <Section title="Totals Config">
            <Row label="Label width">
              <NumberInput value={(el as TotalsBoxElement).labelWidthPercent} onChange={(v) => updateEl('labelWidthPercent', v)} min={20} max={80} step={5} />
            </Row>
            <Row label="Row height">
              <NumberInput value={(el as TotalsBoxElement).rowHeightMm} onChange={(v) => updateEl('rowHeightMm', v)} min={4} max={15} step={0.5} />
            </Row>
          </Section>
        )}

        <StyleSection style={el.style} update={updateStyle} />
        <BorderSection style={el.style} update={updateStyle} />

        <Section title="Layer">
          <div style={{ display: 'flex', gap: 3 }}>
            {(['back', 'backward', 'forward', 'front'] as const).map((dir) => (
              <button key={dir} onClick={() => reorder(el.id, dir)} title={dir} style={btnStyle}>{
                dir === 'back' ? '⇊' : dir === 'backward' ? '↓' : dir === 'forward' ? '↑' : '⇈'
              }</button>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
};

const btnStyle: React.CSSProperties = {
  padding: '2px 5px',
  fontSize: 11,
  border: '1px solid #e2e8f0',
  borderRadius: 2,
  background: '#fff',
  cursor: 'pointer',
  color: '#475569',
  lineHeight: 1,
};
