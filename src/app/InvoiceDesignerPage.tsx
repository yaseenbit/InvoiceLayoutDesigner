import React from 'react';
import { DesignerProvider } from '../designer/context/DesignerContext';
import { DesignerLayout } from '../designer/components/DesignerLayout';

interface Props {
  onNavigateToThermal?: () => void;
}

export const InvoiceDesignerPage: React.FC<Props> = ({ onNavigateToThermal }) => {
  return (
    <DesignerProvider>
      <DesignerLayout onNavigateToThermal={onNavigateToThermal} />
    </DesignerProvider>
  );
};
