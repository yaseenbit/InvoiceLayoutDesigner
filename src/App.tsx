import React, { useState } from 'react';
import { InvoiceDesignerPage } from './app/InvoiceDesignerPage';
import { ThermalDesignerLayout } from './thermal/components/ThermalDesignerLayout';

type AppMode = 'a4' | 'thermal';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('a4');

  if (mode === 'thermal') {
    return <ThermalDesignerLayout onNavigateToA4={() => setMode('a4')} />;
  }

  return <InvoiceDesignerPage onNavigateToThermal={() => setMode('thermal')} />;
};

export default App;
