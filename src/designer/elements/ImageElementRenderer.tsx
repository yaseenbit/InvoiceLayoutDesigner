import React from 'react';
import { ImageElement } from '../types/template.types';
import { ResolvedData } from '../types/invoice-data.types';
import { buildElementStyle } from './elementStyleUtils';

interface Props {
  element: ImageElement;
  preview: boolean;
  resolvedData?: ResolvedData;
}

export const ImageElementRenderer: React.FC<Props> = ({ element, preview, resolvedData }) => {
  const baseStyle = buildElementStyle(element);
  const src =
    element.src ||
    (element.binding && preview && resolvedData ? resolvedData[element.binding] : undefined);

  if (!src) {
    return (
      <div
        style={{
          ...baseStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f3f4f6',
          border: '1px dashed #9ca3af',
          color: '#6b7280',
          fontSize: '9px',
        }}
      >
        {element.binding ? `{{${element.binding}}}` : 'Image'}
      </div>
    );
  }

  return (
    <div style={{ ...baseStyle, overflow: 'hidden' }}>
      <img
        src={src}
        alt={element.alt || ''}
        style={{ width: '100%', height: '100%', objectFit: element.fit }}
      />
    </div>
  );
};
