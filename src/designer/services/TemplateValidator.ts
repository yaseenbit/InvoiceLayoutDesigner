import { InvoiceTemplate, InvoiceElement } from '../types/template.types';

const VALID_ELEMENT_TYPES = new Set([
  'text', 'field', 'line', 'box', 'image',
  'itemsTable', 'taxSummaryTable', 'totalsBox',
  'amountInWords', 'signatureBox', 'qrCode', 'separator',
]);

export function validateTemplate(data: unknown): string[] {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return ['Template must be an object'];
  }

  const t = data as Record<string, unknown>;

  if (!t.id || typeof t.id !== 'string') errors.push('Missing or invalid id');
  if (!t.name || typeof t.name !== 'string') errors.push('Missing or invalid name');
  if (t.type !== 'A4') errors.push('Template type must be "A4"');
  if (!t.page || typeof t.page !== 'object') {
    errors.push('Missing page settings');
  } else {
    errors.push(...validatePage(t.page as Record<string, unknown>));
  }

  if (!Array.isArray(t.elements)) {
    errors.push('Elements must be an array');
  } else {
    const ids = new Set<string>();
    (t.elements as unknown[]).forEach((el, i) => {
      const elErrors = validateElement(el, i);
      errors.push(...elErrors);
      if (typeof el === 'object' && el !== null && 'id' in el) {
        const id = (el as Record<string, unknown>).id as string;
        if (ids.has(id)) errors.push(`Duplicate element id: ${id}`);
        ids.add(id);
      }
    });
  }

  return errors;
}

function validatePage(p: Record<string, unknown>): string[] {
  const errors: string[] = [];
  const required = ['widthMm', 'heightMm', 'marginTopMm', 'marginRightMm', 'marginBottomMm', 'marginLeftMm'];
  for (const key of required) {
    if (typeof p[key] !== 'number') errors.push(`Page setting "${key}" must be a number`);
  }
  return errors;
}

function validateElement(el: unknown, index: number): string[] {
  const errors: string[] = [];
  if (!el || typeof el !== 'object') {
    return [`Element[${index}] must be an object`];
  }
  const e = el as Record<string, unknown>;
  if (!e.id || typeof e.id !== 'string') errors.push(`Element[${index}] missing id`);
  if (!e.type || !VALID_ELEMENT_TYPES.has(e.type as string)) {
    errors.push(`Element[${index}] has invalid type: ${e.type}`);
  }
  for (const field of ['xMm', 'yMm', 'widthMm', 'heightMm'] as const) {
    if (typeof e[field] !== 'number') errors.push(`Element[${index}].${field} must be a number`);
    else if (field === 'widthMm' || field === 'heightMm') {
      if ((e[field] as number) <= 0) errors.push(`Element[${index}].${field} must be positive`);
    }
  }
  return errors;
}

export function validateElementBounds(
  el: Pick<InvoiceElement, 'xMm' | 'yMm' | 'widthMm' | 'heightMm'>,
  pageWidth: number,
  pageHeight: number,
): string[] {
  const errors: string[] = [];
  if (el.xMm < 0) errors.push('X position cannot be negative');
  if (el.yMm < 0) errors.push('Y position cannot be negative');
  if (el.widthMm <= 0) errors.push('Width must be positive');
  if (el.heightMm <= 0) errors.push('Height must be positive');
  if (el.xMm + el.widthMm > pageWidth + 0.01) errors.push('Element extends beyond page right edge');
  if (el.yMm + el.heightMm > pageHeight + 0.01) errors.push('Element extends beyond page bottom edge');
  return errors;
}
