export type ElementType =
  | 'text'
  | 'field'
  | 'line'
  | 'box'
  | 'image'
  | 'itemsTable'
  | 'taxSummaryTable'
  | 'totalsBox'
  | 'amountInWords'
  | 'signatureBox'
  | 'qrCode'
  | 'separator';

export type TextAlign = 'left' | 'center' | 'right';
export type VerticalAlign = 'top' | 'middle' | 'bottom';
export type BorderStyle = 'solid' | 'dashed' | 'dotted';

export interface ElementStyle {
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
  opacity?: number;
}

/**
 * Controls which pages an element appears on during multi-page rendering.
 *
 * - 'all'        – Repeats on every page (company header, page-number field, running footer).
 * - 'first'      – Appears only on page 1 (e.g. "Original Copy" banner, customer address block).
 * - 'last'       – Appears only on the final page (totals box, signature, terms).
 * - 'firstLast'  – Appears on page 1 AND the last page but NOT on continuation pages.
 * - 'continuation' – Appears only on overflow/continuation pages (e.g. "Continued…" label).
 * - 'body'       – This element is the content region; the renderer tiles items rows here
 *                  and creates new pages when space is exhausted.
 *
 * When undefined (legacy / single-page), the element is always rendered — equivalent to 'all'.
 */
export type PageRole =
  | 'all'
  | 'first'
  | 'last'
  | 'firstLast'
  | 'continuation'
  | 'body';

export interface BaseElement {
  id: string;
  name: string;
  type: ElementType;
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  zIndex: number;
  locked?: boolean;
  visible?: boolean;
  rotation?: number;
  /** Multi-page role. Omit for single-page templates (treated as 'all'). */
  pageRole?: PageRole;
  style: ElementStyle;
}

export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
}

export interface FieldElement extends BaseElement {
  type: 'field';
  binding: string;
  fallback?: string;
}

export interface LineElement extends BaseElement {
  type: 'line';
  orientation: 'horizontal' | 'vertical';
  lineWidthPx: number;
  lineColor: string;
  lineStyle: BorderStyle;
}

export interface BoxElement extends BaseElement {
  type: 'box';
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src?: string;
  binding?: string;
  fit: 'contain' | 'cover' | 'fill';
  alt?: string;
}

export interface TableColumn {
  id: string;
  title: string;
  binding: string;
  widthMm: number;
  align: TextAlign;
  fontSizePt?: number;
}

export interface ItemsTableElement extends BaseElement {
  type: 'itemsTable';
  headerVisible: boolean;
  headerBackgroundColor: string;
  headerFontSizePt: number;
  rowFontSizePt: number;
  rowHeightMm: number;
  borderEnabled: boolean;
  columnBordersEnabled: boolean;
  alternateRowBackground: boolean;
  alternateRowColor: string;
  showSerialNumber: boolean;
  columns: TableColumn[];
}

export interface TaxSummaryTableElement extends BaseElement {
  type: 'taxSummaryTable';
  headerVisible: boolean;
  headerBackgroundColor: string;
  headerFontSizePt: number;
  rowFontSizePt: number;
  rowHeightMm: number;
  borderEnabled: boolean;
  columns: TableColumn[];
}

export interface TotalsRow {
  id: string;
  label: string;
  binding: string;
  visible: boolean;
  bold?: boolean;
  labelAlign?: TextAlign;
  valueAlign?: TextAlign;
}

export interface TotalsBoxElement extends BaseElement {
  type: 'totalsBox';
  rows: TotalsRow[];
  labelWidthPercent: number;
  rowHeightMm: number;
  fontSizePt: number;
  borderEnabled: boolean;
}

export interface AmountInWordsElement extends BaseElement {
  type: 'amountInWords';
  binding: string;
  prefix?: string;
  suffix?: string;
}

export interface SignatureBoxElement extends BaseElement {
  type: 'signatureBox';
  label: string;
  lineColor: string;
  showLine: boolean;
}

export interface QrCodeElement extends BaseElement {
  type: 'qrCode';
  binding: string;
  value?: string;
}

export interface SeparatorElement extends BaseElement {
  type: 'separator';
  lineWidthPx: number;
  lineColor: string;
  lineStyle: BorderStyle;
}

export type InvoiceElement =
  | TextElement
  | FieldElement
  | LineElement
  | BoxElement
  | ImageElement
  | ItemsTableElement
  | TaxSummaryTableElement
  | TotalsBoxElement
  | AmountInWordsElement
  | SignatureBoxElement
  | QrCodeElement
  | SeparatorElement;

export interface A4PageSettings {
  widthMm: number;
  heightMm: number;
  marginTopMm: number;
  marginRightMm: number;
  marginBottomMm: number;
  marginLeftMm: number;
  defaultFontFamily: string;
  defaultFontSizePt: number;
  gridSizeMm: number;
  snapToGrid: boolean;
  showGrid: boolean;
  showRulers: boolean;
  showMarginGuides: boolean;

  // ── Multi-page settings ───────────────────────────────────────────────────
  /**
   * When true, the renderer will paginate the items table across multiple A4
   * pages.  Elements are assigned roles via `BaseElement.pageRole`.
   */
  multiPage: boolean;

  /**
   * Top Y boundary of the repeating body region (mm from top of page).
   * The items table starts here on every page.
   * Defaults to marginTopMm if undefined.
   */
  bodyStartMm?: number;

  /**
   * Bottom Y boundary of the body region (mm from top of page).
   * The items table is cropped at this line; a new page is started beyond it.
   * Defaults to (heightMm - marginBottomMm) if undefined.
   */
  bodyEndMm?: number;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  type: 'A4';
  version: number;
  page: A4PageSettings;
  elements: InvoiceElement[];
  createdAt: string;
  updatedAt: string;
}

export const PAGE_WIDTH_MM = 210;
export const PAGE_HEIGHT_MM = 297;
