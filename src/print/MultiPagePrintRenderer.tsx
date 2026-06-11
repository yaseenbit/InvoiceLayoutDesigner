/**
 * MultiPagePrintRenderer
 * ──────────────────────
 * Renders N physical A4 pages for printing.
 * Each page is a separate 210×297mm div with `page-break-after: always`.
 *
 * Usage (from PrintService):
 *   1. Mount this component inside a hidden div (#invoice-print-root).
 *   2. Call window.print().
 *   3. The @media print CSS hides all other UI.
 *
 * TODO extension points:
 *   - Replace SAMPLE_INVOICE_DATA with real invoice data from an API.
 *   - Replace sampleItems with actual line items (pass via props or context).
 *   - Add support for watermarks (DRAFT / COPY) on each page.
 *   - Add support for custom page sizes (Letter, Legal) — currently hard-coded to A4.
 */

import React, { useMemo } from 'react';
import { InvoiceTemplate, InvoiceElement, ItemsTableElement } from '../designer/types/template.types';
import { InvoiceData } from '../designer/types/invoice-data.types';
import { paginate, PagePlan, PAGE_BINDINGS } from '../designer/services/PaginationEngine';
import { resolveInvoiceData } from '../designer/services/InvoiceDataResolver';
import { ElementRenderer } from '../designer/elements/ElementRenderer';
import { ResolvedData } from '../designer/types/invoice-data.types';
import { ItemsTableRenderer } from '../designer/elements/ItemsTableRenderer';
import { TaxSummaryTableRenderer } from '../designer/elements/TaxSummaryTableRenderer';
import { TotalsBoxRenderer } from '../designer/elements/TotalsBoxRenderer';

interface Props {
  template: InvoiceTemplate;
  invoiceData: InvoiceData;
}

// ── Page-level wrapper ────────────────────────────────────────────────────────

const PageFrame: React.FC<{
  plan: PagePlan;
  template: InvoiceTemplate;
  invoiceData: InvoiceData;
  resolvedData: ResolvedData;
  totalPages: number;
}> = ({ plan, template, invoiceData, resolvedData, totalPages }) => {
  const { page } = template;

  // Enrich resolved data with per-page bindings
  const pageResolvedData: ResolvedData = {
    ...resolvedData,
    [PAGE_BINDINGS.PAGE_NUMBER]: String(plan.pageIndex + 1),
    [PAGE_BINDINGS.TOTAL_PAGES]: String(totalPages),
  };

  return (
    <div
      style={{
        position: 'relative',
        width: `${page.widthMm}mm`,
        height: `${page.heightMm}mm`,
        backgroundColor: '#fff',
        overflow: 'hidden',
        // CSS print page break
        pageBreakAfter: plan.isLast ? 'avoid' : 'always',
        breakAfter: plan.isLast ? 'avoid' : 'page',
      }}
    >
      {plan.elements.map((el) => {
        // The items table is rendered separately below with the correct slice
        if (el.type === 'itemsTable') {
          return (
            <div
              key={el.id}
              style={{
                position: 'absolute',
                left: `${el.xMm}mm`,
                top: `${plan.isFirst ? el.yMm : (page.bodyStartMm ?? page.marginTopMm)}mm`,
                width: `${el.widthMm}mm`,
                // Height: fill from top of table to body end
                height: `${(page.bodyEndMm ?? page.heightMm - page.marginBottomMm) -
                  (plan.isFirst ? el.yMm : (page.bodyStartMm ?? page.marginTopMm))}mm`,
                zIndex: el.zIndex,
                overflow: 'hidden',
              }}
            >
              <ItemsTableRenderer
                element={el as ItemsTableElement}
                preview
                items={invoiceData.items.slice(plan.itemsSlice.start, plan.itemsSlice.end)}
              />
            </div>
          );
        }

        // Skip table-style elements on continuation pages if they have role='last'
        // (ElementRenderer checks `visible` but not pageRole — pageRole filtering
        // is already done by the paginator, so just render everything here)
        return (
          <ElementRenderer
            key={el.id}
            element={el}
            isSelected={false}
            preview
            resolvedData={pageResolvedData}
            invoiceData={invoiceData}
            onMouseDown={() => {}}
            onClick={() => {}}
          />
        );
      })}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

export const MultiPagePrintRenderer: React.FC<Props> = ({ template, invoiceData }) => {
  const resolvedData = useMemo(() => resolveInvoiceData(invoiceData), [invoiceData]);

  const { totalPages, pages } = useMemo(
    () => paginate(template, invoiceData.items.length),
    [template, invoiceData.items.length],
  );

  return (
    <>
      {pages.map((plan) => (
        <PageFrame
          key={plan.pageIndex}
          plan={plan}
          template={template}
          invoiceData={invoiceData}
          resolvedData={resolvedData}
          totalPages={totalPages}
        />
      ))}
    </>
  );
};
