export interface CompanyData {
  name: string;
  address: string;
  phone: string;
  email: string;
  gstin: string;
  logoUrl: string;
  website?: string;
  bankName?: string;
  bankAccount?: string;
  bankIfsc?: string;
}

export interface CustomerData {
  name: string;
  address: string;
  phone: string;
  email?: string;
  gstin?: string;
  stateCode?: string;
}

export interface InvoiceMeta {
  number: string;
  date: string;
  dueDate: string;
  salesType: string;
  paymentMode: string;
  placeOfSupply?: string;
  reverseCharge?: boolean;
  notes?: string;
}

export interface InvoiceItem {
  slNo: number;
  name: string;
  description?: string;
  hsnCode: string;
  qty: number;
  unit: string;
  rate: number;
  discount: number;
  discountAmount: number;
  taxableAmount: number;
  taxPercent: number;
  taxAmount: number;
  lineTotal: number;
}

export interface TaxBreakdownRow {
  taxPercent: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
}

export interface TotalsData {
  subtotal: number;
  discount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  roundOff: number;
  grandTotal: number;
  amountInWords: string;
}

export interface InvoiceData {
  company: CompanyData;
  customer: CustomerData;
  invoice: InvoiceMeta;
  items: InvoiceItem[];
  taxBreakdown: TaxBreakdownRow[];
  totals: TotalsData;
}

/** Flat map of dot-notation bindings to string values */
export type ResolvedData = Record<string, string>;
