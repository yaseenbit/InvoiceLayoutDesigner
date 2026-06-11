import React from 'react';
import { LineElement } from '../types/template.types';

interface Props {
  element: LineElement;
}

export const LineElementRenderer: React.FC<Props> = ({ element }) => {
  const isHorizontal = element.orientation === 'horizontal';
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          width: isHorizontal ? '100%' : `${element.lineWidthPx}px`,
          height: isHorizontal ? `${element.lineWidthPx}px` : '100%',
          backgroundColor: element.lineColor,
          borderStyle: element.lineStyle,
        }}
      />
    </div>
  );
};
