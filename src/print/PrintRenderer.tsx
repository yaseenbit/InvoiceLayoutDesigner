/**
 * PrintRenderer: renders the A4 page at exact mm dimensions without the
 * designer chrome. Mount this component (hidden) and call window.print().
 *
 * TODO: extend to multi-page invoices by rendering multiple A4Canvas instances
 * each offset by 297mm vertically, and adjusting the @page rule accordingly.
 */
import React from 'react';
import { InvoiceTemplate } from '../designer/types/template.types';
import { DesignerProvider } from '../designer/context/DesignerContext';
import { A4Canvas } from '../designer/components/A4Canvas';

interface Props {
  template: InvoiceTemplate;
}

function noop() {}

export const PrintRenderer: React.FC<Props> = () => {
  return (
    <DesignerProvider>
      <div
        id="invoice-print-root"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '210mm',
          height: '297mm',
          overflow: 'hidden',
          zIndex: -1,
          visibility: 'hidden',
        }}
      >
        {/* A4Canvas reads template from context; for print use, set the template
            in the provider before calling window.print(). */}
        <A4Canvas onMouseDown={() => noop()} printMode />
      </div>
    </DesignerProvider>
  );
};
