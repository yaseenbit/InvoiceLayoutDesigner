import React from 'react';
import { FieldElement } from '../types/template.types';
import { ResolvedData } from '../types/invoice-data.types';
import { buildElementStyle } from './elementStyleUtils';

interface Props {
  element: FieldElement;
  preview: boolean;
  resolvedData?: ResolvedData;
}

export const FieldElementRenderer: React.FC<Props> = ({ element, preview, resolvedData }) => {
  const style = buildElementStyle(element);
  const value = preview && resolvedData
    ? (resolvedData[element.binding] ?? element.fallback ?? `{{${element.binding}}}`)
    : `{{${element.binding}}}`;

  return (
    <div style={{ ...style, overflow: 'hidden', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      {value}
    </div>
  );
};
