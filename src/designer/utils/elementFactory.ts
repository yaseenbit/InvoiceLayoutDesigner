import { v4 as uuidv4 } from 'uuid';
import {
  ElementType,
  InvoiceElement,
  ElementStyle,
  TableColumn,
  TotalsRow,
  A4PageSettings,
} from '../types/template.types';
import { getMaxZIndex } from './zIndex';

const DEFAULT_STYLE: ElementStyle = {
  fontFamily: 'Inter, sans-serif',
  fontSizePt: 10,
  color: '#111827',
  backgroundColor: 'transparent',
  textAlign: 'left',
  verticalAlign: 'top',
  border: false,
  borderWidthPx: 1,
  borderColor: '#d1d5db',
  borderStyle: 'solid',
  paddingMm: 1,
};

const DEFAULT_ITEMS_COLUMNS: TableColumn[] = [
  { id: 'slNo',    title: 'Sl No',      binding: 'slNo',       widthMm: 10, align: 'center' },
  { id: 'name',    title: 'Item Name',  binding: 'name',       widthMm: 55, align: 'left' },
  { id: 'hsn',     title: 'HSN',        binding: 'hsnCode',    widthMm: 18, align: 'center' },
  { id: 'qty',     title: 'Qty',        binding: 'qty',        widthMm: 12, align: 'right' },
  { id: 'rate',    title: 'Rate',       binding: 'rate',       widthMm: 18, align: 'right' },
  { id: 'disc',    title: 'Disc %',     binding: 'discount',   widthMm: 14, align: 'right' },
  { id: 'tax',     title: 'Tax %',      binding: 'taxPercent', widthMm: 12, align: 'right' },
  { id: 'taxAmt',  title: 'Tax Amt',    binding: 'taxAmount',  widthMm: 18, align: 'right' },
  { id: 'total',   title: 'Total',      binding: 'lineTotal',  widthMm: 22, align: 'right' },
];

const DEFAULT_TAX_COLUMNS: TableColumn[] = [
  { id: 'taxPct',    title: 'Tax %',          binding: 'taxPercent',    widthMm: 20, align: 'center' },
  { id: 'taxable',   title: 'Taxable Amt',    binding: 'taxableAmount', widthMm: 35, align: 'right' },
  { id: 'cgst',      title: 'CGST',           binding: 'cgst',          widthMm: 28, align: 'right' },
  { id: 'sgst',      title: 'SGST',           binding: 'sgst',          widthMm: 28, align: 'right' },
  { id: 'igst',      title: 'IGST',           binding: 'igst',          widthMm: 28, align: 'right' },
  { id: 'totalTax',  title: 'Total Tax',      binding: 'totalTax',      widthMm: 28, align: 'right' },
];

const DEFAULT_TOTALS_ROWS: TotalsRow[] = [
  { id: 'subtotal',     label: 'Subtotal',       binding: 'totals.subtotal',     visible: true },
  { id: 'discount',     label: 'Discount',       binding: 'totals.discount',     visible: true },
  { id: 'taxable',      label: 'Taxable Amount', binding: 'totals.taxableAmount',visible: true },
  { id: 'cgst',         label: 'CGST',           binding: 'totals.cgst',         visible: true },
  { id: 'sgst',         label: 'SGST',           binding: 'totals.sgst',         visible: true },
  { id: 'igst',         label: 'IGST',           binding: 'totals.igst',         visible: true },
  { id: 'roundOff',     label: 'Round Off',      binding: 'totals.roundOff',     visible: true },
  { id: 'grandTotal',   label: 'Grand Total',    binding: 'totals.grandTotal',   visible: true, bold: true },
];

export function createElement(
  type: ElementType,
  xMm: number,
  yMm: number,
  existingElements: InvoiceElement[],
  page: A4PageSettings,
): InvoiceElement {
  const id = uuidv4();
  const zIndex = getMaxZIndex(existingElements) + 1;
  const fontFamily = page.defaultFontFamily;
  const fontSizePt = page.defaultFontSizePt;
  const base = { id, zIndex, xMm, yMm, visible: true, locked: false };
  const style = { ...DEFAULT_STYLE, fontFamily, fontSizePt };

  switch (type) {
    case 'text':
      return { ...base, type: 'text', name: 'Text', widthMm: 50, heightMm: 8, style, content: 'Text' };

    case 'field':
      return { ...base, type: 'field', name: 'Field', widthMm: 50, heightMm: 8, style, binding: 'company.name', fallback: '' };

    case 'line':
      return { ...base, type: 'line', name: 'Line', widthMm: 80, heightMm: 1, style: { ...style, border: false }, orientation: 'horizontal', lineWidthPx: 1, lineColor: '#9ca3af', lineStyle: 'solid' };

    case 'box':
      return { ...base, type: 'box', name: 'Box', widthMm: 50, heightMm: 30, style: { ...style, border: true, backgroundColor: '#f9fafb' } };

    case 'image':
      return { ...base, type: 'image', name: 'Image', widthMm: 30, heightMm: 20, style, fit: 'contain', binding: 'company.logoUrl' };

    case 'itemsTable':
      return {
        ...base, type: 'itemsTable', name: 'Items Table',
        widthMm: 190, heightMm: 80,
        style: { ...style, border: true },
        headerVisible: true,
        headerBackgroundColor: '#0d9488',
        headerFontSizePt: fontSizePt,
        rowFontSizePt: fontSizePt,
        rowHeightMm: 7,
        borderEnabled: true,
        columnBordersEnabled: true,
        alternateRowBackground: true,
        alternateRowColor: '#f0fdfa',
        showSerialNumber: true,
        columns: DEFAULT_ITEMS_COLUMNS,
      };

    case 'taxSummaryTable':
      return {
        ...base, type: 'taxSummaryTable', name: 'Tax Summary',
        widthMm: 160, heightMm: 30,
        style: { ...style, border: true },
        headerVisible: true,
        headerBackgroundColor: '#0d9488',
        headerFontSizePt: fontSizePt,
        rowFontSizePt: fontSizePt,
        rowHeightMm: 7,
        borderEnabled: true,
        columns: DEFAULT_TAX_COLUMNS,
      };

    case 'totalsBox':
      return {
        ...base, type: 'totalsBox', name: 'Totals Box',
        widthMm: 80, heightMm: 55,
        style: { ...style, border: true },
        rows: DEFAULT_TOTALS_ROWS,
        labelWidthPercent: 55,
        rowHeightMm: 6,
        fontSizePt,
        borderEnabled: true,
      };

    case 'amountInWords':
      return { ...base, type: 'amountInWords', name: 'Amount in Words', widthMm: 120, heightMm: 10, style, binding: 'totals.amountInWords', prefix: 'Rupees: ' };

    case 'signatureBox':
      return { ...base, type: 'signatureBox', name: 'Signature', widthMm: 50, heightMm: 25, style, label: 'Authorised Signatory', lineColor: '#374151', showLine: true };

    case 'qrCode':
      return { ...base, type: 'qrCode', name: 'QR Code', widthMm: 25, heightMm: 25, style, binding: 'invoice.number' };

    case 'separator':
      return { ...base, type: 'separator', name: 'Separator', widthMm: page.widthMm, heightMm: 2, style: { ...style, border: false }, lineWidthPx: 1, lineColor: '#d1d5db', lineStyle: 'solid' };

    default:
      throw new Error(`Unknown element type: ${type}`);
  }
}

export function duplicateElement(
  source: InvoiceElement,
  existingElements: InvoiceElement[],
  offsetMm = 5,
): InvoiceElement {
  const zIndex = getMaxZIndex(existingElements) + 1;
  return {
    ...source,
    id: uuidv4(),
    name: `${source.name} Copy`,
    xMm: source.xMm + offsetMm,
    yMm: source.yMm + offsetMm,
    zIndex,
  };
}
