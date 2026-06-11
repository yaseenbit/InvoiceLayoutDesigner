import React from 'react';
import { ThermalProvider } from '../context/ThermalContext';
import { ThermalTopToolbar } from './ThermalTopToolbar';
import { ThermalToolboxPanel } from './ThermalToolboxPanel';
import { ThermalCanvasWorkspace } from './ThermalCanvasWorkspace';
import { ThermalPropertiesPanel } from './ThermalPropertiesPanel';
import { ThermalStatusBar } from './ThermalStatusBar';

interface Props {
  onNavigateToA4?: () => void;
}

function ThermalDesignerInner({ onNavigateToA4 }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <ThermalTopToolbar onNavigateToA4={onNavigateToA4} />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <ThermalToolboxPanel />
        <ThermalCanvasWorkspace />
        <ThermalPropertiesPanel />
      </div>
      <ThermalStatusBar />
    </div>
  );
}

export function ThermalDesignerLayout({ onNavigateToA4 }: Props) {
  return (
    <ThermalProvider>
      <ThermalDesignerInner onNavigateToA4={onNavigateToA4} />
    </ThermalProvider>
  );
}
