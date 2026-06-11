import React from 'react';
import { TopToolbar } from './TopToolbar';
import { ToolboxPanel } from './ToolboxPanel';
import { CanvasWorkspace } from './CanvasWorkspace';
import { PropertiesPanel } from './PropertiesPanel';
import { StatusBar } from './StatusBar';

interface Props {
  onNavigateToThermal?: () => void;
}

export const DesignerLayout: React.FC<Props> = ({ onNavigateToThermal }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        fontSize: 12,
        overflow: 'hidden',
        backgroundColor: '#f1f5f9',
      }}
    >
      <TopToolbar onNavigateToThermal={onNavigateToThermal} />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <ToolboxPanel />
        <CanvasWorkspace />
        <PropertiesPanel />
      </div>

      <StatusBar />
    </div>
  );
};
