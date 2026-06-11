import React from 'react';
import { TextElement } from '../types/template.types';
import { buildElementStyle } from './elementStyleUtils';

interface Props {
  element: TextElement;
  preview: boolean;
}

export const TextElementRenderer: React.FC<Props> = ({ element }) => {
  const style = buildElementStyle(element);
  return (
    <div style={{ ...style, overflow: 'hidden', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      {element.content || ' '}
    </div>
  );
};
