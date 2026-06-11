import { v4 as uuidv4 } from 'uuid';
import {
  ThermalElementType,
  ThermalElement,
  ThermalElementStyle,
  ThermalPageSettings,
  ThermalTableColumn,
  ThermalTotalsRow,
} from '../types/thermal.types';
import { getMaxZIndex } from '../../designer/utils/zIndex';

const DEFAULT_STYLE: ThermalElementStyle = {
  fontFamily: 'monospace',
  fontSizePt: 9,
  color: '#000000',
  backgroundColor: 'transparent',
  textAlign: 'left',
  border: false,
  paddingMm: 0.5,
};

const DEFAULT_ITEMS_COLUMNS: ThermalTableColumn[] = [
  { id: 'name',   title: 'Item',   binding: 'name',   widthRatio: 0.45, align: 'left'  },
  { id: 'qty',    title: 'Qty',    binding: 'qty',    widthRatio: 0.12, align: 'right' },
  { id: 'rate',   title: 'Rate',   binding: 'rate',   widthRatio: 0.20, align: 'right' },
  { id: 'amount', title: 'Amt',    binding: 'amount', widthRatio: 0.23, align: 'right' },
];

const DEFAULT_TOTALS_ROWS: ThermalTotalsRow[] = [
  { id: 'subtotal', label: 'Subtotal',  binding: 'totals.subtotal',  visible: true },
  { id: 'discount', label: 'Discount',  binding: 'totals.discount',  visible: true },
  { id: 'tax',      label: 'Tax',       binding: 'totals.tax',       visible: true },
  { id: 'total',    label: 'TOTAL',     binding: 'totals.total',     visible: true, bold: true, separator: true },
];

export function createThermalElement(
  type: ThermalElementType,
  xMm: number,
  yMm: number,
  existing: ThermalElement[],
  page: ThermalPageSettings,
): ThermalElement {
  const id = uuidv4();
  const zIndex = getMaxZIndex(existing as Parameters<typeof getMaxZIndex>[0]) + 1;
  const W = page.widthMm;
  const style = { ...DEFAULT_STYLE, fontFamily: page.defaultFontFamily, fontSizePt: page.defaultFontSizePt };
  const base = { id, zIndex, xMm, yMm, visible: true, locked: false };

  switch (type) {
    case 'text':
      return { ...base, type: 'text', name: 'Text', widthMm: W * 0.8, heightMm: 5, style, content: 'Text' };

    case 'field':
      return { ...base, type: 'field', name: 'Field', widthMm: W * 0.8, heightMm: 5, style, binding: 'store.name', fallback: '' };

    case 'line':
      return { ...base, type: 'line', name: 'Line', widthMm: W - xMm * 2, heightMm: 2, style, lineWidthPx: 1, lineColor: '#000000', lineStyle: 'dashed', dashed: true };

    case 'image':
      return { ...base, type: 'image', name: 'Logo', widthMm: 20, heightMm: 15, style, fit: 'contain', binding: 'store.logo' };

    case 'thermalItemsTable':
      return {
        ...base, type: 'thermalItemsTable', name: 'Items Table',
        widthMm: W, heightMm: 32,
        style: { ...style, border: false },
        headerVisible: true,
        headerFontSizePt: style.fontSizePt ?? 9,
        rowFontSizePt: style.fontSizePt ?? 9,
        rowHeightMm: 6,
        separatorBetweenRows: false,
        separatorStyle: 'dashed',
        columns: DEFAULT_ITEMS_COLUMNS,
        previewRows: 4,
      };

    case 'thermalTotals':
      return {
        ...base, type: 'thermalTotals', name: 'Totals',
        widthMm: W, heightMm: 22,
        style: { ...style },
        rows: DEFAULT_TOTALS_ROWS,
        labelWidthPercent: 60,
        rowHeightMm: 5,
        fontSizePt: style.fontSizePt ?? 9,
        separatorBetweenRows: false,
      };

    case 'barcode':
      return { ...base, type: 'barcode', name: 'Barcode', widthMm: W * 0.7, heightMm: 14, style, binding: 'receipt.number', format: 'CODE128', showText: true };

    case 'qrCode':
      return { ...base, type: 'qrCode', name: 'QR Code', widthMm: 20, heightMm: 20, style, binding: 'receipt.number' };

    case 'spacer':
      return { ...base, type: 'spacer', name: 'Spacer', widthMm: W, heightMm: 4, style };

    default:
      throw new Error(`Unknown thermal element type: ${type}`);
  }
}

export function duplicateThermalElement(
  src: ThermalElement,
  existing: ThermalElement[],
  offset = 3,
): ThermalElement {
  return {
    ...src,
    id: uuidv4(),
    name: `${src.name} Copy`,
    xMm: src.xMm + offset,
    yMm: src.yMm + offset,
    zIndex: getMaxZIndex(existing as Parameters<typeof getMaxZIndex>[0]) + 1,
  };
}
