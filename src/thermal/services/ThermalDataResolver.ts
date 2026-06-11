import { ThermalReceiptData, ThermalResolvedData } from '../types/receipt-data.types';

export const SAMPLE_RECEIPT_DATA: ThermalReceiptData = {
  store: {
    name: 'QuickMart Retail Store',
    address: '12-A, Gandhi Nagar, Coimbatore\nTamil Nadu - 641001',
    phone: '+91 422 234 5678',
    email: 'billing@quickmart.in',
    gstin: '33AABCQ5678H1ZM',
    website: 'www.quickmart.in',
  },
  customer: {
    name: 'Walk-in Customer',
    phone: '',
    loyaltyId: '',
  },
  receipt: {
    number: 'RCP-2024-08347',
    date: '11 Jun 2024',
    time: '03:45 PM',
    cashier: 'Ravi Kumar',
    type: 'SALE',
    counter: 'POS-2',
  },
  items: [
    { slNo: 1, name: 'Tata Salt 1kg',       qty: 2, unit: 'Pcs', rate: 22.00,  discount: 0,    amount: 44.00  },
    { slNo: 2, name: 'Surf Excel 500g',      qty: 1, unit: 'Pcs', rate: 112.00, discount: 0,    amount: 112.00 },
    { slNo: 3, name: 'Aashirvaad Atta 5kg',  qty: 1, unit: 'Pcs', rate: 295.00, discount: 5,    amount: 280.25 },
    { slNo: 4, name: 'Parle-G 800g',         qty: 3, unit: 'Pcs', rate: 65.00,  discount: 0,    amount: 195.00 },
    { slNo: 5, name: 'Colgate Toothpaste',   qty: 1, unit: 'Pcs', rate: 89.00,  discount: 10,   amount: 80.10  },
  ],
  payment: {
    method: 'Cash',
    tendered: 800.00,
    amount: 711.35,
    change: 88.65,
  },
  totals: {
    subtotal: 731.00,
    discount: 19.65,
    taxableAmount: 711.35,
    tax: 0,
    roundOff: 0,
    total: 711.35,
    amountInWords: 'Rupees Seven Hundred Eleven and Thirty-Five Paise Only',
  },
};

function fmt(n: number): string {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function resolveThermalData(data: ThermalReceiptData): ThermalResolvedData {
  const { store, customer, receipt, payment, totals } = data;
  return {
    'store.name':         store.name,
    'store.address':      store.address,
    'store.phone':        store.phone,
    'store.email':        store.email ?? '',
    'store.gstin':        store.gstin ?? '',
    'store.website':      store.website ?? '',
    'store.logo':         store.logo ?? '',
    'customer.name':      customer.name ?? '',
    'customer.phone':     customer.phone ?? '',
    'customer.loyaltyId': customer.loyaltyId ?? '',
    'receipt.number':     receipt.number,
    'receipt.date':       receipt.date,
    'receipt.time':       receipt.time,
    'receipt.cashier':    receipt.cashier,
    'receipt.type':       receipt.type,
    'receipt.counter':    receipt.counter ?? '',
    'payment.method':     payment.method,
    'payment.tendered':   fmt(payment.tendered),
    'payment.amount':     fmt(payment.amount),
    'payment.change':     fmt(payment.change),
    'totals.subtotal':    fmt(totals.subtotal),
    'totals.discount':    fmt(totals.discount),
    'totals.taxableAmount': fmt(totals.taxableAmount),
    'totals.tax':         fmt(totals.tax),
    'totals.roundOff':    fmt(totals.roundOff),
    'totals.total':       fmt(totals.total),
    'totals.amountInWords': totals.amountInWords ?? '',
  };
}

export function resolveThermalBinding(
  binding: string,
  data: ThermalResolvedData,
  fallback = '',
): string {
  return data[binding] ?? fallback;
}

export const THERMAL_BINDINGS = [
  'store.name', 'store.address', 'store.phone', 'store.email', 'store.gstin', 'store.website',
  'customer.name', 'customer.phone', 'customer.loyaltyId',
  'receipt.number', 'receipt.date', 'receipt.time', 'receipt.cashier', 'receipt.type', 'receipt.counter',
  'payment.method', 'payment.tendered', 'payment.amount', 'payment.change',
  'totals.subtotal', 'totals.discount', 'totals.taxableAmount', 'totals.tax', 'totals.roundOff', 'totals.total',
  'totals.amountInWords',
];
