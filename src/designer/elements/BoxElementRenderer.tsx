import React from 'react';
import { BoxElement } from '../types/template.types';
import { buildElementStyle } from './elementStyleUtils';

interface Props {
  element: BoxElement;
}

export const BoxElementRenderer: React.FC<Props> = ({ element }) => {
  return <div style={buildElementStyle(element)} />;
};
