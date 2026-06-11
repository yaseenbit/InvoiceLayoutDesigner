/**
 * ThermalHtmlRenderer
 * ───────────────────
 * Converts a ThermalTemplate + receipt data into a self-contained,
 * print-ready HTML document.
 *
 * Printing flow:
 *   renderToHtml(template, data)  →  full HTML string
 *   → open in new tab / iframe  →  Ctrl+P  →  select thermal printer
 *
 * Layout model:
 *   - All elements use `position: absolute` at their designed mm coordinates.
 *   - The items table grows dynamically: if actual items exceed previewRows,
 *     the container height and all elements below the table shift down by
 *     the height delta.
 *   - CSS `@page { size: Wmm Hmm; margin: 0; }` tells the browser the
 *     exact paper dimensions so the print dialog pre-selects the right size.
 */

import {
  ThermalTemplate,
  ThermalElement,
  ThermalItemsTableElement,
  ThermalTotalsElement,
  ThermalTextElement,
  ThermalFieldElement,
  ThermalLineElement,
  ThermalImageElement,
  ThermalBarcodeElement,
  ThermalElementStyle,
} from '../types/thermal.types';
import { ThermalReceiptData, ThermalResolvedData } from '../types/receipt-data.types';
import { resolveThermalData } from './ThermalDataResolver';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
}

function buildInlineStyle(
  style: ThermalElementStyle,
  extra: Record<string, string> = {},
): string {
  const rules: Record<string, string> = {
    'font-family': style.fontFamily ?? 'monospace',
    'font-size': style.fontSizePt ? `${style.fontSizePt}pt` : '9pt',
    'font-weight': style.bold ? 'bold' : 'normal',
    'font-style': style.italic ? 'italic' : 'normal',
    'text-decoration': style.underline ? 'underline' : 'none',
    'color': style.color ?? '#000',
    'background-color': style.backgroundColor && style.backgroundColor !== 'transparent' ? style.backgroundColor : '',
    'text-align': style.textAlign ?? 'left',
    'padding': style.paddingMm ? `${style.paddingMm}mm` : '0',
    'box-sizing': 'border-box',
    'overflow': 'hidden',
    'white-space': 'pre-wrap',
    'word-break': 'break-word',
    ...extra,
  };

  if (style.border) {
    rules['border'] = `${style.borderWidthPx ?? 1}px ${style.borderStyle ?? 'solid'} ${style.borderColor ?? '#000'}`;
  }

  if (style.verticalAlign === 'middle') {
    rules['display'] = 'flex';
    rules['align-items'] = 'center';
  }

  return Object.entries(rules)
    .filter(([, v]) => v !== '' && v !== undefined)
    .map(([k, v]) => `${k}:${v}`)
    .join(';');
}

function posStyle(
  el: ThermalElement,
  yOffset = 0,
  heightOverride?: number,
): string {
  return [
    `position:absolute`,
    `left:${el.xMm}mm`,
    `top:${el.yMm + yOffset}mm`,
    `width:${el.widthMm}mm`,
    `height:${heightOverride !== undefined ? heightOverride : el.heightMm}mm`,
    `z-index:${el.zIndex}`,
  ].join(';');
}

// ─── Per-element HTML renderers ───────────────────────────────────────────────

function renderText(el: ThermalTextElement, yOffset: number): string {
  return `<div style="${posStyle(el, yOffset)};${buildInlineStyle(el.style)}">${esc(el.content)}</div>`;
}

function renderField(el: ThermalFieldElement, resolved: ThermalResolvedData, yOffset: number): string {
  const value = resolved[el.binding] ?? el.fallback ?? '';
  return `<div style="${posStyle(el, yOffset)};${buildInlineStyle(el.style)}">${esc(value)}</div>`;
}

function renderLine(el: ThermalLineElement, yOffset: number): string {
  const borderSpec = el.dashed
    ? `border-top:1px dashed ${el.lineColor}`
    : `border-top:${el.lineWidthPx}px ${el.lineStyle} ${el.lineColor}`;
  return `<div style="${posStyle(el, yOffset)};display:flex;align-items:center;">
  <div style="width:100%;${borderSpec};"></div>
</div>`;
}

function renderImage(el: ThermalImageElement, resolved: ThermalResolvedData, yOffset: number): string {
  const src = el.src || (el.binding ? resolved[el.binding] : '') || '';
  if (!src) {
    return `<div style="${posStyle(el, yOffset)};display:flex;align-items:center;justify-content:center;border:1px dashed #aaa;font-size:7pt;color:#999;">[Logo]</div>`;
  }
  return `<div style="${posStyle(el, yOffset)};overflow:hidden;">
  <img src="${esc(src)}" alt="${esc(el.alt ?? '')}" style="width:100%;height:100%;object-fit:${el.fit};">
</div>`;
}

function renderItemsTable(
  el: ThermalItemsTableElement,
  items: ThermalReceiptData['items'],
  yOffset: number,
  actualHeight: number,
): string {
  const fs = `${el.rowFontSizePt}pt`;
  const hfs = `${el.headerFontSizePt}pt`;
  const rowH = `${el.rowHeightMm}mm`;
  const colWidths = el.columns.map((c) => `${(c.widthRatio * 100).toFixed(1)}%`);

  const headerRow = el.headerVisible
    ? `<tr style="height:${rowH};border-bottom:1px solid #000;">
    ${el.columns.map((col, i) => `<th style="width:${colWidths[i]};font-size:${hfs};font-weight:bold;text-align:${col.align};padding:0 1mm;">${esc(col.title)}</th>`).join('')}
  </tr>`
    : '';

  const sep = el.separatorBetweenRows
    ? `border-bottom:1px ${el.separatorStyle} #000;`
    : '';

  const rows = items.map((item) => {
    const map: Record<string, unknown> = item as unknown as Record<string, unknown>;
    return `<tr style="height:${rowH};${sep}">
    ${el.columns.map((col, i) => {
      const val = map[col.binding];
      const display = typeof val === 'number'
        ? val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : String(val ?? '');
      return `<td style="width:${colWidths[i]};font-size:${fs};text-align:${col.align};padding:0 1mm;overflow:hidden;white-space:nowrap;">${esc(display)}</td>`;
    }).join('')}
  </tr>`;
  }).join('\n');

  return `<div style="${posStyle(el, yOffset, actualHeight)};">
  <table style="width:100%;border-collapse:collapse;table-layout:fixed;">
    ${headerRow}
    ${rows}
  </table>
</div>`;
}

function renderTotals(
  el: ThermalTotalsElement,
  resolved: ThermalResolvedData,
  yOffset: number,
): string {
  const fs = `${el.fontSizePt}pt`;
  const rh = `${el.rowHeightMm}mm`;
  const lw = `${el.labelWidthPercent}%`;

  const rows = el.rows.filter((r) => r.visible).map((row) => {
    const val = resolved[row.binding] ?? '—';
    const fw = row.bold ? 'bold' : 'normal';
    const topBorder = row.separator ? 'border-top:1px solid #000;' : '';
    return `<tr style="height:${rh};${topBorder}">
  <td style="width:${lw};font-size:${fs};font-weight:${fw};padding:0 1mm;">${esc(row.label)}</td>
  <td style="font-size:${fs};font-weight:${fw};text-align:right;padding:0 1mm;">${esc(val)}</td>
</tr>`;
  }).join('\n');

  return `<div style="${posStyle(el, yOffset)};">
  <table style="width:100%;border-collapse:collapse;">
    ${rows}
  </table>
</div>`;
}

function renderBarcode(el: ThermalBarcodeElement, resolved: ThermalResolvedData, yOffset: number): string {
  const val = resolved[el.binding] ?? el.value ?? '';
  return `<div style="${posStyle(el, yOffset)};display:flex;flex-direction:column;align-items:center;justify-content:center;">
  <div style="font-family:monospace;font-size:14pt;letter-spacing:2px;font-weight:bold;">${'|'.repeat(30)}</div>
  ${el.showText ? `<div style="font-size:7pt;font-family:monospace;margin-top:1mm;">${esc(val)}</div>` : ''}
  <div style="font-size:6pt;color:#666;">[${el.format} placeholder]</div>
</div>`;
}

function renderQr(el: ThermalElement, resolved: ThermalResolvedData, yOffset: number): string {
  const qrEl = el as unknown as { binding: string; value?: string };
  const val = resolved[qrEl.binding] ?? qrEl.value ?? '';
  return `<div style="${posStyle(el, yOffset)};display:flex;flex-direction:column;align-items:center;justify-content:center;border:1px solid #000;">
  <div style="font-size:18pt;">⬛</div>
  <div style="font-size:6pt;color:#666;">${esc(val)}</div>
</div>`;
}

function renderSpacer(el: ThermalElement, yOffset: number): string {
  return `<div style="${posStyle(el, yOffset)};"></div>`;
}

// ─── Main render function ─────────────────────────────────────────────────────

interface RenderOptions {
  /** If true, render design-time placeholders instead of real values */
  designMode?: boolean;
}

export function renderThermalToHtml(
  template: ThermalTemplate,
  data: ThermalReceiptData,
  opts: RenderOptions = {},
): string {
  const { page, elements } = template;
  const resolved = resolveThermalData(data);

  // ── Calculate dynamic height delta from items table ───────────────────────
  const itemsTableEl = elements.find(
    (el): el is ThermalItemsTableElement => el.type === 'thermalItemsTable',
  );

  let heightDelta = 0;
  let actualItemsTableHeight = 0;

  if (itemsTableEl) {
    const headerH = itemsTableEl.headerVisible ? itemsTableEl.rowHeightMm : 0;
    const designRowCount = itemsTableEl.previewRows;
    const actualRowCount = data.items.length;
    const designBodyH  = designRowCount * itemsTableEl.rowHeightMm;
    const actualBodyH  = actualRowCount * itemsTableEl.rowHeightMm;
    actualItemsTableHeight = headerH + actualBodyH;
    const designTotalH = headerH + designBodyH;
    heightDelta = actualItemsTableHeight - designTotalH;
  }

  // ── Calculate total canvas height ─────────────────────────────────────────
  const itemsTableBottom = itemsTableEl
    ? itemsTableEl.yMm + itemsTableEl.heightMm
    : -Infinity;

  const totalHeightMm = elements.reduce((max, el) => {
    const shiftY = el.yMm >= itemsTableBottom ? heightDelta : 0;
    return Math.max(max, el.yMm + el.heightMm + shiftY);
  }, page.heightMm) + 5; // 5mm bottom padding

  // ── Render each element ───────────────────────────────────────────────────
  const sortedEls = [...elements]
    .filter((el) => el.visible !== false)
    .sort((a, b) => a.zIndex - b.zIndex);

  const elementsHtml = sortedEls
    .map((el) => {
      const yOffset = el.yMm >= itemsTableBottom ? heightDelta : 0;

      if (opts.designMode) {
        // In design mode, items table shows previewRows, not actual data
        if (el.type === 'thermalItemsTable') {
          const previewItems = data.items.slice(0, el.previewRows);
          return renderItemsTable(el, previewItems, 0, el.heightMm);
        }
      }

      switch (el.type) {
        case 'text':            return renderText(el, yOffset);
        case 'field':           return renderField(el, resolved, yOffset);
        case 'line':            return renderLine(el, yOffset);
        case 'image':           return renderImage(el, resolved, yOffset);
        case 'thermalItemsTable': {
          const itemsToRender = opts.designMode
            ? data.items.slice(0, el.previewRows)
            : data.items;
          const itemH = opts.designMode ? el.heightMm : actualItemsTableHeight;
          return renderItemsTable(el, itemsToRender, yOffset, itemH);
        }
        case 'thermalTotals':   return renderTotals(el, resolved, yOffset);
        case 'barcode':         return renderBarcode(el, resolved, yOffset);
        case 'qrCode':          return renderQr(el, resolved, yOffset);
        case 'spacer':          return renderSpacer(el, yOffset);
        default:                return '';
      }
    })
    .join('\n');

  // ── Assemble final HTML document ──────────────────────────────────────────
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(template.name)} — ${esc(data.receipt.number)}</title>
  <style>
    @page {
      size: ${page.widthMm}mm ${totalHeightMm.toFixed(1)}mm;
      margin: 0;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: ${page.widthMm}mm;
      background: #fff;
      font-family: ${page.defaultFontFamily};
      font-size: ${page.defaultFontSizePt}pt;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .receipt-root {
      position: relative;
      width: ${page.widthMm}mm;
      height: ${totalHeightMm.toFixed(1)}mm;
      overflow: hidden;
      background: #fff;
    }
    * { box-sizing: border-box; }
  </style>
</head>
<body>
  <div class="receipt-root">
    ${elementsHtml}
  </div>
</body>
</html>`;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

export function openPrintPreview(
  template: ThermalTemplate,
  data: ThermalReceiptData,
): void {
  const html = renderThermalToHtml(template, data);
  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, '_blank');
  if (win) {
    win.addEventListener('load', () => {
      win.focus();
      win.print();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    });
  }
}

export function downloadReceiptHtml(
  template: ThermalTemplate,
  data: ThermalReceiptData,
): void {
  const html     = renderThermalToHtml(template, data);
  const blob     = new Blob([html], { type: 'text/html' });
  const url      = URL.createObjectURL(blob);
  const a        = document.createElement('a');
  a.href         = url;
  a.download     = `receipt_${data.receipt.number}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
