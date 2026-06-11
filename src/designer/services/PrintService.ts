import { InvoiceTemplate } from '../types/template.types';

const PRINT_STYLE_ID = 'invoice-print-style';

export function injectPrintStyles(multiPage = false): void {
  const existing = document.getElementById(PRINT_STYLE_ID);
  if (existing) existing.remove(); // always re-inject so multiPage flag is current

  const style = document.createElement('style');
  style.id = PRINT_STYLE_ID;
  style.textContent = `
    @media print {
      @page {
        size: A4 portrait;
        margin: 0;
      }
      body * { visibility: hidden !important; }
      #invoice-print-root,
      #invoice-print-root * { visibility: visible !important; }
      #invoice-print-root {
        position: ${multiPage ? 'absolute' : 'fixed'} !important;
        top: 0 !important;
        left: 0 !important;
        width: 210mm !important;
        ${multiPage ? '' : 'height: 297mm !important;'}
        overflow: visible !important;
        transform: none !important;
        visibility: visible !important;
      }
      /* Each A4 page div gets its own page break */
      #invoice-print-root > div {
        page-break-after: always;
        break-after: page;
        width: 210mm;
        height: 297mm;
        overflow: hidden;
        position: relative;
      }
      #invoice-print-root > div:last-child {
        page-break-after: avoid;
        break-after: avoid;
      }
    }
  `;
  document.head.appendChild(style);
}

export function triggerPrint(multiPage = false): void {
  injectPrintStyles(multiPage);
  window.print();
}

export function exportTemplateJson(template: InvoiceTemplate): void {
  const json = JSON.stringify(template, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${template.name.replace(/\s+/g, '_')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importTemplateJson(): Promise<string> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) { reject(new Error('No file selected')); return; }
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    };
    input.click();
  });
}
