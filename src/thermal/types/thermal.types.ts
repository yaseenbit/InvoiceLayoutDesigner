// ─── Paper widths ─────────────────────────────────────────────────────────────

export const THERMAL_PAPER_WIDTHS = [
  { label: '58mm (2.28")',  mm: 58  },
  { label: '72mm (2.83")',  mm: 72  },
  { label: '80mm (3.15")',  mm: 80  },
  { label: '104mm (4.09")', mm: 104 },
  { label: '112mm (4.41")', mm: 112 },
  { label: '160mm (6.30")', mm: 160 },
] as const;

export type ThermalPaperMm = 58 | 72 | 80 | 104 | 112 | 160;

// ─── Element types ────────────────────────────────────────────────────────────

export type ThermalElementType =
  | 'text'
  | 'field'
  | 'line'
  | 'image'
  | 'thermalItemsTable'
  | 'thermalTotals'
  | 'barcode'
  | 'qrCode'
  | 'spacer';

export type TextAlign = 'left' | 'center' | 'right';
export type VerticalAlign = 'top' | 'middle' | 'bottom';
export type BorderStyle = 'solid' | 'dashed' | 'dotted';

export interface ThermalElementStyle {
  fontFamily?: string;
  fontSizePt?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  backgroundColor?: string;
  textAlign?: TextAlign;
  verticalAlign?: VerticalAlign;
  border?: boolean;
  borderWidthPx?: number;
  borderColor?: string;
  borderStyle?: BorderStyle;
  paddingMm?: number;
}

export interface BaseThermalElement {
  id: string;
  name: string;
  type: ThermalElementType;
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  zIndex: number;
  locked?: boolean;
  visible?: boolean;
  style: ThermalElementStyle;
}

// ─── Concrete element types ───────────────────────────────────────────────────

export interface ThermalTextElement extends BaseThermalElement {
  type: 'text';
  content: string;
}

export interface ThermalFieldElement extends BaseThermalElement {
  type: 'field';
  binding: string;
  fallback?: string;
}

export interface ThermalLineElement extends BaseThermalElement {
  type: 'line';
  lineWidthPx: number;
  lineColor: string;
  lineStyle: BorderStyle;
  dashed?: boolean;
}

export interface ThermalImageElement extends BaseThermalElement {
  type: 'image';
  src?: string;
  binding?: string;
  fit: 'contain' | 'cover' | 'fill';
  alt?: string;
}

export interface ThermalTableColumn {
  id: string;
  title: string;
  binding: string;
  /** Width as a fraction of total table width (0–1) */
  widthRatio: number;
  align: TextAlign;
}

export interface ThermalItemsTableElement extends BaseThermalElement {
  type: 'thermalItemsTable';
  headerVisible: boolean;
  headerFontSizePt: number;
  rowFontSizePt: number;
  rowHeightMm: number;
  separatorBetweenRows: boolean;
  separatorStyle: BorderStyle;
  columns: ThermalTableColumn[];
  /** Number of item rows visible in the designer canvas */
  previewRows: number;
}

export interface ThermalTotalsRow {
  id: string;
  label: string;
  binding: string;
  visible: boolean;
  bold?: boolean;
  separator?: boolean;
}

export interface ThermalTotalsElement extends BaseThermalElement {
  type: 'thermalTotals';
  rows: ThermalTotalsRow[];
  labelWidthPercent: number;
  rowHeightMm: number;
  fontSizePt: number;
  separatorBetweenRows: boolean;
}

export interface ThermalBarcodeElement extends BaseThermalElement {
  type: 'barcode';
  binding: string;
  value?: string;
  format: 'CODE128' | 'EAN13' | 'QR';
  showText: boolean;
}

export interface ThermalQrElement extends BaseThermalElement {
  type: 'qrCode';
  binding: string;
  value?: string;
}

export interface ThermalSpacerElement extends BaseThermalElement {
  type: 'spacer';
}

export type ThermalElement =
  | ThermalTextElement
  | ThermalFieldElement
  | ThermalLineElement
  | ThermalImageElement
  | ThermalItemsTableElement
  | ThermalTotalsElement
  | ThermalBarcodeElement
  | ThermalQrElement
  | ThermalSpacerElement;

// ─── Page settings ────────────────────────────────────────────────────────────

export interface ThermalPageSettings {
  widthMm: ThermalPaperMm;
  /** Design-time canvas height; HTML renderer uses content height */
  heightMm: number;
  autoHeight: boolean;
  dpi: 203 | 300;
  defaultFontFamily: string;
  defaultFontSizePt: number;
  gridSizeMm: number;
  snapToGrid: boolean;
  showGrid: boolean;
  showRulers: boolean;
}

// ─── Template ─────────────────────────────────────────────────────────────────

export interface ThermalTemplate {
  id: string;
  name: string;
  type: 'THERMAL';
  version: number;
  page: ThermalPageSettings;
  elements: ThermalElement[];
  createdAt: string;
  updatedAt: string;
}
