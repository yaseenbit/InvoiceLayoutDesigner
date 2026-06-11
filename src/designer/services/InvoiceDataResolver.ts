import { InvoiceData, ResolvedData } from '../types/invoice-data.types';

export const SAMPLE_INVOICE_DATA: InvoiceData = {
  company: {
    name: 'Acme Technologies Pvt. Ltd.',
    address: '42, Silicon Valley Road, Bengaluru, Karnataka 560001',
    phone: '+91 80 4567 8901',
    email: 'billing@acmetech.in',
    gstin: '29AABCA1234F1ZK',
    logoUrl: '',
    website: 'www.acmetech.in',
    bankName: 'HDFC Bank',
    bankAccount: '50200012345678',
    bankIfsc: 'HDFC0001234',
  },
  customer: {
    name: 'Pinnacle Solutions Ltd.',
    address: '17, Industrial Estate, Pune, Maharashtra 411001',
    phone: '+91 20 2345 6789',
    email: 'accounts@pinnaclesol.com',
    gstin: '27AACCP5678G1ZR',
    stateCode: '27',
  },
  invoice: {
    number: 'INV-2024-00145',
    date: '04 Jun 2024',
    dueDate: '04 Jul 2024',
    salesType: 'B2B',
    paymentMode: 'Bank Transfer',
    placeOfSupply: 'Maharashtra (27)',
    reverseCharge: false,
    notes: 'Payment due within 30 days. Thank you for your business.',
  },
  items: [
    {
      slNo: 1, name: 'Enterprise Software License', description: 'Annual subscription',
      hsnCode: '998313', qty: 2, unit: 'Nos', rate: 25000,
      discount: 5, discountAmount: 2500, taxableAmount: 47500,
      taxPercent: 18, taxAmount: 8550, lineTotal: 56050,
    },
    {
      slNo: 2, name: 'Implementation Services', description: 'Setup & configuration',
      hsnCode: '998314', qty: 10, unit: 'Hrs', rate: 3500,
      discount: 0, discountAmount: 0, taxableAmount: 35000,
      taxPercent: 18, taxAmount: 6300, lineTotal: 41300,
    },
    {
      slNo: 3, name: 'Annual Support Contract', description: '12-month support plan',
      hsnCode: '998315', qty: 1, unit: 'Nos', rate: 12000,
      discount: 10, discountAmount: 1200, taxableAmount: 10800,
      taxPercent: 18, taxAmount: 1944, lineTotal: 12744,
    },
  ],
  taxBreakdown: [
    { taxPercent: 18, taxableAmount: 93300, cgst: 8397, sgst: 0, igst: 8397, totalTax: 16794 },
  ],
  totals: {
    subtotal: 97000,
    discount: 3700,
    taxableAmount: 93300,
    cgst: 0,
    sgst: 0,
    igst: 16794,
    cess: 0,
    roundOff: -0.06,
    grandTotal: 110094,
    amountInWords: 'Rupees One Lakh Ten Thousand And Ninety Four Only',
  },
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

export function resolveInvoiceData(data: InvoiceData): ResolvedData {
  const { company, customer, invoice, totals } = data;
  return {
    'company.name':         company.name,
    'company.address':      company.address,
    'company.phone':        company.phone,
    'company.email':        company.email,
    'company.gstin':        company.gstin,
    'company.logoUrl':      company.logoUrl,
    'company.website':      company.website ?? '',
    'company.bankName':     company.bankName ?? '',
    'company.bankAccount':  company.bankAccount ?? '',
    'company.bankIfsc':     company.bankIfsc ?? '',
    'customer.name':        customer.name,
    'customer.address':     customer.address,
    'customer.phone':       customer.phone,
    'customer.email':       customer.email ?? '',
    'customer.gstin':       customer.gstin ?? '',
    'invoice.number':       invoice.number,
    'invoice.date':         invoice.date,
    'invoice.dueDate':      invoice.dueDate,
    'invoice.salesType':    invoice.salesType,
    'invoice.paymentMode':  invoice.paymentMode,
    'invoice.placeOfSupply':invoice.placeOfSupply ?? '',
    'invoice.notes':        invoice.notes ?? '',
    'totals.subtotal':      formatCurrency(totals.subtotal),
    'totals.discount':      formatCurrency(totals.discount),
    'totals.taxableAmount': formatCurrency(totals.taxableAmount),
    'totals.cgst':          formatCurrency(totals.cgst),
    'totals.sgst':          formatCurrency(totals.sgst),
    'totals.igst':          formatCurrency(totals.igst),
    'totals.cess':          formatCurrency(totals.cess),
    'totals.roundOff':      formatCurrency(totals.roundOff),
    'totals.grandTotal':    formatCurrency(totals.grandTotal),
    'totals.amountInWords': totals.amountInWords,
  };
}

export function resolveBinding(binding: string, data: ResolvedData, fallback = ''): string {
  return data[binding] ?? fallback;
}
