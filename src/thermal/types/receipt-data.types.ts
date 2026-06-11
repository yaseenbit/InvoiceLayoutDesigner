export interface ThermalStoreData {
  name: string;
  address: string;
  phone: string;
  email?: string;
  gstin?: string;
  logo?: string;
  website?: string;
}

export interface ThermalCustomerData {
  name?: string;
  phone?: string;
  loyaltyId?: string;
}

export interface ThermalReceiptMeta {
  number: string;
  date: string;
  time: string;
  cashier: string;
  type: 'SALE' | 'RETURN' | 'EXCHANGE';
  counter?: string;
}

export interface ThermalReceiptItem {
  slNo: number;
  name: string;
  qty: number;
  unit: string;
  rate: number;
  discount: number;
  amount: number;
  taxPercent?: number;
  hsnCode?: string;
}

export interface ThermalPaymentData {
  method: string;
  tendered: number;
  amount: number;
  change: number;
}

export interface ThermalTotalsData {
  subtotal: number;
  discount: number;
  taxableAmount: number;
  tax: number;
  roundOff: number;
  total: number;
  amountInWords?: string;
}

export interface ThermalReceiptData {
  store: ThermalStoreData;
  customer: ThermalCustomerData;
  receipt: ThermalReceiptMeta;
  items: ThermalReceiptItem[];
  payment: ThermalPaymentData;
  totals: ThermalTotalsData;
}

export type ThermalResolvedData = Record<string, string>;
