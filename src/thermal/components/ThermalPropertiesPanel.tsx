import React, { useCallback } from 'react';
import { useThermal } from '../context/ThermalContext';
import {
  ThermalElement,
  ThermalPageSettings,
  THERMAL_PAPER_WIDTHS,
  ThermalPaperMm,
  ThermalElementStyle,
  ThermalItemsTableElement,
  ThermalTotalsElement,
  ThermalBarcodeElement,
  ThermalFieldElement,
  ThermalTextElement,
} from '../types/thermal.types';
import { THERMAL_BINDINGS } from '../services/ThermalDataResolver';

// ─── Reusable mini components ─────────────────────────────────────────────────

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
      <label style={{ fontSize: 11, color: '#64748b', width: 70, flexShrink: 0 }}>{label}</label>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{ width: '100%', fontSize: 11, padding: '3px 6px', border: '1px solid #d1d5db', borderRadius: 4, boxSizing: 'border-box', background: '#fff', ...props.style }}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{ width: '100%', fontSize: 11, padding: '3px 6px', border: '1px solid #d1d5db', borderRadius: 4, boxSizing: 'border-box', background: '#fff', ...props.style }}
    />
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#374151', cursor: 'pointer', marginBottom: 5 }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ margin: 0 }} />
      {label}
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 10, marginBottom: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

// ─── Style editor ─────────────────────────────────────────────────────────────

function StyleEditor({ style, onChange }: { style: ThermalElementStyle; onChange: (s: Partial<ThermalElementStyle>) => void }) {
  return (
    <Section title="Style">
      <Row label="Font size">
        <Input type="number" min={6} max={18} value={style.fontSizePt ?? 9} onChange={(e) => onChange({ fontSizePt: +e.target.value })} />
      </Row>
      <Row label="Align">
        <Select value={style.textAlign ?? 'left'} onChange={(e) => onChange({ textAlign: e.target.value as 'left' | 'center' | 'right' })}>
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </Select>
      </Row>
      <Row label="Color">
        <Input type="color" value={style.color ?? '#000000'} onChange={(e) => onChange({ color: e.target.value })} />
      </Row>
      <div style={{ display: 'flex', gap: 8 }}>
        <Checkbox label="Bold"      checked={!!style.bold}      onChange={(v) => onChange({ bold: v })} />
        <Checkbox label="Italic"    checked={!!style.italic}    onChange={(v) => onChange({ italic: v })} />
        <Checkbox label="Underline" checked={!!style.underline} onChange={(v) => onChange({ underline: v })} />
      </div>
    </Section>
  );
}

// ─── Per-element panels ───────────────────────────────────────────────────────

function TextPanel({ el, onChange }: { el: ThermalTextElement; onChange: (c: Partial<ThermalElement>) => void }) {
  return (
    <Section title="Text">
      <Row label="Content">
        <textarea
          value={el.content}
          onChange={(e) => onChange({ content: e.target.value })}
          rows={3}
          style={{ width: '100%', fontSize: 11, padding: '3px 6px', border: '1px solid #d1d5db', borderRadius: 4, boxSizing: 'border-box', resize: 'vertical' }}
        />
      </Row>
    </Section>
  );
}

function FieldPanel({ el, onChange }: { el: ThermalFieldElement; onChange: (c: Partial<ThermalElement>) => void }) {
  return (
    <Section title="Field">
      <Row label="Binding">
        <Select value={el.binding} onChange={(e) => onChange({ binding: e.target.value })}>
          {THERMAL_BINDINGS.map((b) => <option key={b} value={b}>{b}</option>)}
        </Select>
      </Row>
      <Row label="Fallback">
        <Input value={el.fallback ?? ''} onChange={(e) => onChange({ fallback: e.target.value })} placeholder="—" />
      </Row>
    </Section>
  );
}

function ItemsTablePanel({ el, onChange }: { el: ThermalItemsTableElement; onChange: (c: Partial<ThermalElement>) => void }) {
  return (
    <Section title="Items Table">
      <Row label="Preview rows">
        <Input type="number" min={1} max={20} value={el.previewRows} onChange={(e) => onChange({ previewRows: +e.target.value })} />
      </Row>
      <Row label="Row height mm">
        <Input type="number" min={3} max={12} step={0.5} value={el.rowHeightMm} onChange={(e) => onChange({ rowHeightMm: +e.target.value })} />
      </Row>
      <Row label="Header font">
        <Input type="number" min={6} max={14} value={el.headerFontSizePt} onChange={(e) => onChange({ headerFontSizePt: +e.target.value })} />
      </Row>
      <Row label="Row font">
        <Input type="number" min={6} max={14} value={el.rowFontSizePt} onChange={(e) => onChange({ rowFontSizePt: +e.target.value })} />
      </Row>
      <Checkbox label="Show header" checked={el.headerVisible} onChange={(v) => onChange({ headerVisible: v })} />
      <Checkbox label="Row separators" checked={el.separatorBetweenRows} onChange={(v) => onChange({ separatorBetweenRows: v })} />
    </Section>
  );
}

function TotalsPanel({ el, onChange }: { el: ThermalTotalsElement; onChange: (c: Partial<ThermalElement>) => void }) {
  return (
    <Section title="Totals Block">
      <Row label="Font size">
        <Input type="number" min={6} max={14} value={el.fontSizePt} onChange={(e) => onChange({ fontSizePt: +e.target.value })} />
      </Row>
      <Row label="Row height mm">
        <Input type="number" min={3} max={10} step={0.5} value={el.rowHeightMm} onChange={(e) => onChange({ rowHeightMm: +e.target.value })} />
      </Row>
      <Row label="Label width %">
        <Input type="number" min={30} max={80} value={el.labelWidthPercent} onChange={(e) => onChange({ labelWidthPercent: +e.target.value })} />
      </Row>
      <div style={{ marginTop: 6, fontSize: 11, color: '#64748b' }}>Rows:</div>
      {el.rows.map((row, i) => (
        <div key={row.id} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3, padding: '2px 4px', background: '#f8fafc', borderRadius: 4 }}>
          <input type="checkbox" checked={row.visible} onChange={(e) => {
            const rows = [...el.rows];
            rows[i] = { ...row, visible: e.target.checked };
            onChange({ rows });
          }} style={{ margin: 0 }} />
          <span style={{ flex: 1, fontSize: 11 }}>{row.label}</span>
          <input type="checkbox" checked={!!row.bold} onChange={(e) => {
            const rows = [...el.rows];
            rows[i] = { ...row, bold: e.target.checked };
            onChange({ rows });
          }} style={{ margin: 0 }} title="Bold" />
        </div>
      ))}
    </Section>
  );
}

function BarcodePanel({ el, onChange }: { el: ThermalBarcodeElement; onChange: (c: Partial<ThermalElement>) => void }) {
  return (
    <Section title="Barcode">
      <Row label="Binding">
        <Select value={el.binding} onChange={(e) => onChange({ binding: e.target.value })}>
          {THERMAL_BINDINGS.map((b) => <option key={b} value={b}>{b}</option>)}
        </Select>
      </Row>
      <Row label="Format">
        <Select value={el.format} onChange={(e) => onChange({ format: e.target.value as ThermalBarcodeElement['format'] })}>
          <option value="CODE128">CODE128</option>
          <option value="EAN13">EAN13</option>
          <option value="QR">QR</option>
        </Select>
      </Row>
      <Checkbox label="Show text" checked={el.showText} onChange={(v) => onChange({ showText: v })} />
    </Section>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function ThermalPropertiesPanel() {
  const ctx = useThermal();
  const { template, selectedElements } = ctx;
  const { page } = template;

  const el = selectedElements.length === 1 ? selectedElements[0] : null;

  const updateEl = useCallback((changes: Partial<ThermalElement>) => {
    if (!el) return;
    ctx.updateElement(el.id, changes);
  }, [ctx, el]);

  const updateStyle = useCallback((s: Partial<ThermalElementStyle>) => {
    if (!el) return;
    ctx.updateElement(el.id, { style: { ...el.style, ...s } });
  }, [ctx, el]);

  const updatePage = useCallback((changes: Partial<ThermalPageSettings>) => {
    ctx.updatePageSettings(changes);
  }, [ctx]);

  return (
    <div style={{ width: 220, borderLeft: '1px solid #e2e8f0', background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
      <div style={{ padding: '10px 12px 6px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {el ? el.name : 'Page Settings'}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '10px 12px' }}>
        {el ? (
          <>
            {/* Position / Size */}
            <Section title="Layout">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px', marginBottom: 4 }}>
                {[['X mm', 'xMm', el.xMm], ['Y mm', 'yMm', el.yMm], ['W mm', 'widthMm', el.widthMm], ['H mm', 'heightMm', el.heightMm]].map(([lbl, key, val]) => (
                  <div key={key as string}>
                    <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>{lbl as string}</div>
                    <Input
                      type="number"
                      min={0}
                      step={0.5}
                      value={val as number}
                      onChange={(e) => updateEl({ [key as string]: +e.target.value } as Partial<ThermalElement>)}
                    />
                  </div>
                ))}
              </div>
              <Checkbox label="Visible" checked={el.visible !== false} onChange={(v) => updateEl({ visible: v })} />
              <Checkbox label="Locked"  checked={!!el.locked}          onChange={(v) => updateEl({ locked: v })} />
            </Section>

            {/* Element-specific */}
            {el.type === 'text'              && <TextPanel        el={el} onChange={updateEl} />}
            {el.type === 'field'             && <FieldPanel       el={el} onChange={updateEl} />}
            {el.type === 'thermalItemsTable' && <ItemsTablePanel  el={el} onChange={updateEl} />}
            {el.type === 'thermalTotals'     && <TotalsPanel      el={el} onChange={updateEl} />}
            {el.type === 'barcode'           && <BarcodePanel     el={el} onChange={updateEl} />}

            {/* Style (all except spacer/line) */}
            {!['line', 'spacer'].includes(el.type) && (
              <StyleEditor style={el.style} onChange={updateStyle} />
            )}

            {/* Z-order */}
            <Section title="Arrange">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                {[
                  ['↑ Forward',  () => ctx.bringForward(el.id)],
                  ['↓ Backward', () => ctx.sendBackward(el.id)],
                  ['⇑ Front',    () => ctx.bringToFront(el.id)],
                  ['⇓ Back',     () => ctx.sendToBack(el.id)],
                ].map(([label, fn]) => (
                  <button key={label as string} onClick={fn as () => void} style={{ fontSize: 11, padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: 4, background: '#f8fafc', cursor: 'pointer' }}>{label as string}</button>
                ))}
              </div>
              <button
                onClick={() => ctx.duplicateElement(el.id)}
                style={{ width: '100%', marginTop: 6, fontSize: 11, padding: '4px', border: '1px solid #d1d5db', borderRadius: 4, background: '#f8fafc', cursor: 'pointer' }}
              >
                Duplicate (⌘D)
              </button>
              <button
                onClick={() => ctx.deleteElements([el.id])}
                style={{ width: '100%', marginTop: 4, fontSize: 11, padding: '4px', border: '1px solid #fca5a5', borderRadius: 4, background: '#fff5f5', color: '#dc2626', cursor: 'pointer' }}
              >
                Delete
              </button>
            </Section>
          </>
        ) : (
          <>
            <Section title="Paper">
              <Row label="Width">
                <Select
                  value={page.widthMm}
                  onChange={(e) => updatePage({ widthMm: +e.target.value as ThermalPaperMm })}
                >
                  {THERMAL_PAPER_WIDTHS.map((w) => (
                    <option key={w.mm} value={w.mm}>{w.label}</option>
                  ))}
                </Select>
              </Row>
              <Row label="Height mm">
                <Input
                  type="number" min={50} max={600} step={10}
                  value={page.heightMm}
                  onChange={(e) => updatePage({ heightMm: +e.target.value })}
                />
              </Row>
              <Row label="DPI">
                <Select value={page.dpi} onChange={(e) => updatePage({ dpi: +e.target.value as 203 | 300 })}>
                  <option value={203}>203 dpi (standard)</option>
                  <option value={300}>300 dpi (high)</option>
                </Select>
              </Row>
            </Section>

            <Section title="Font">
              <Row label="Family">
                <Select
                  value={page.defaultFontFamily}
                  onChange={(e) => updatePage({ defaultFontFamily: e.target.value })}
                >
                  <option value="monospace">Monospace</option>
                  <option value="'Courier New', monospace">Courier New</option>
                  <option value="Arial, sans-serif">Arial</option>
                </Select>
              </Row>
              <Row label="Size pt">
                <Input
                  type="number" min={6} max={14}
                  value={page.defaultFontSizePt}
                  onChange={(e) => updatePage({ defaultFontSizePt: +e.target.value })}
                />
              </Row>
            </Section>

            <Section title="Grid">
              <Row label="Grid mm">
                <Input
                  type="number" min={1} max={10} step={0.5}
                  value={page.gridSizeMm}
                  onChange={(e) => updatePage({ gridSizeMm: +e.target.value })}
                />
              </Row>
              <Checkbox label="Show grid"    checked={page.showGrid}    onChange={(v) => updatePage({ showGrid: v })} />
              <Checkbox label="Snap to grid" checked={page.snapToGrid}  onChange={(v) => updatePage({ snapToGrid: v })} />
              <Checkbox label="Show rulers"  checked={page.showRulers}  onChange={(v) => updatePage({ showRulers: v })} />
            </Section>
          </>
        )}
      </div>
    </div>
  );
}
