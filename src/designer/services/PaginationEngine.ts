/**
 * PaginationEngine
 * ────────────────
 * Given a template and an item count, calculates:
 *  - how many A4 pages are required
 *  - which elements appear on each page
 *  - which slice of items each page should render
 *
 * This is pure data — no React, no DOM.
 */

import { InvoiceTemplate, InvoiceElement, ItemsTableElement, PageRole } from '../types/template.types';

export interface PagePlan {
  pageIndex: number;       // 0-based
  isFirst: boolean;
  isLast: boolean;
  elements: InvoiceElement[];
  /** Item slice to render in the body items table on this page */
  itemsSlice: { start: number; end: number };
  /** Y offset (mm) at which the items table should start on this page */
  bodyStartMm: number;
}

export interface PaginationResult {
  totalPages: number;
  pages: PagePlan[];
}

function effectiveRole(role: PageRole | undefined): PageRole {
  return role ?? 'all';
}

function elementAppearsOnPage(role: PageRole, isFirst: boolean, isLast: boolean): boolean {
  switch (role) {
    case 'all':          return true;
    case 'first':        return isFirst;
    case 'last':         return isLast;
    case 'firstLast':    return isFirst || isLast;
    case 'continuation': return !isFirst;
    case 'body':         return true;  // handled separately
    default:             return true;
  }
}

/**
 * Compute how many rows of the items table fit in the body region on a given
 * page.  The body region is tighter on the first page if header elements push
 * the table down, and tighter on the last page if closing elements push up.
 */
function rowsPerPage(
  bodyHeightMm: number,
  rowHeightMm: number,
  headerHeightMm: number,
): number {
  const usableHeight = bodyHeightMm - headerHeightMm;
  return Math.max(1, Math.floor(usableHeight / rowHeightMm));
}

export function paginate(
  template: InvoiceTemplate,
  totalItems: number,
): PaginationResult {
  const { page, elements } = template;

  // ── Single-page fast path ────────────────────────────────────────────────
  if (!page.multiPage) {
    return {
      totalPages: 1,
      pages: [{
        pageIndex: 0,
        isFirst: true,
        isLast: true,
        elements,
        itemsSlice: { start: 0, end: totalItems },
        bodyStartMm: page.bodyStartMm ?? page.marginTopMm,
      }],
    };
  }

  // ── Locate the items table element ───────────────────────────────────────
  const itemsTableEl = elements.find(
    (el): el is ItemsTableElement => el.type === 'itemsTable',
  );

  const bodyStart = page.bodyStartMm ?? page.marginTopMm;
  const bodyEnd   = page.bodyEndMm   ?? (page.heightMm - page.marginBottomMm);
  const bodyHeight = bodyEnd - bodyStart;

  // If there's no items table, everything fits on one page
  if (!itemsTableEl || totalItems === 0) {
    return {
      totalPages: 1,
      pages: [{ pageIndex: 0, isFirst: true, isLast: true, elements, itemsSlice: { start: 0, end: totalItems }, bodyStartMm: bodyStart }],
    };
  }

  const rowH   = itemsTableEl.rowHeightMm;
  const headerH = itemsTableEl.headerVisible
    ? itemsTableEl.rowHeightMm  // header row same height as body row (approximate)
    : 0;

  // Rows available on first page (may have taller header from 'first' elements above table)
  const firstBodyHeight = bodyEnd - itemsTableEl.yMm; // items table starts at its own yMm on page 1
  const firstPageRows   = Math.max(1, Math.floor((firstBodyHeight - headerH) / rowH));

  // Rows available on continuation pages (full body region, no items-table header on first row)
  const contPageRows    = rowsPerPage(bodyHeight, rowH, headerH);

  // Calculate total pages
  let remaining   = totalItems;
  let totalPages  = 0;
  let consumed    = 0;

  const slices: Array<{ start: number; end: number }> = [];

  while (remaining > 0 || totalPages === 0) {
    const isFirstPage = totalPages === 0;
    const limit = isFirstPage ? firstPageRows : contPageRows;
    const take  = Math.min(remaining, limit);
    slices.push({ start: consumed, end: consumed + take });
    consumed  += take;
    remaining -= take;
    totalPages++;
    if (remaining <= 0) break;
  }

  // ── Build per-page element lists ─────────────────────────────────────────
  const pages: PagePlan[] = slices.map((slice, idx) => {
    const isFirst = idx === 0;
    const isLast  = idx === slices.length - 1;

    const pageElements = elements
      .filter((el) => {
        const role = effectiveRole(el.pageRole);
        if (role === 'body') return true;  // always include; caller renders correct slice
        return elementAppearsOnPage(role, isFirst, isLast);
      })
      // On continuation pages, shift the items table to bodyStart
      .map((el): InvoiceElement => {
        if (el.type === 'itemsTable' && !isFirst) {
          return { ...el, yMm: bodyStart };
        }
        return el;
      });

    return {
      pageIndex: idx,
      isFirst,
      isLast,
      elements: pageElements,
      itemsSlice: slice,
      bodyStartMm: isFirst ? itemsTableEl.yMm : bodyStart,
    };
  });

  return { totalPages, pages };
}

// ── Binding for page-number dynamic fields ───────────────────────────────────
/** Well-known bindings injected at render time. */
export const PAGE_BINDINGS = {
  PAGE_NUMBER:  'page.number',    // current page (1-based)
  TOTAL_PAGES:  'page.totalPages',
} as const;
