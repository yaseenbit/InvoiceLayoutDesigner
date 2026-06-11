import { CSSProperties } from 'react';
import { BaseElement } from '../types/template.types';
import { ptToPx } from '../utils/unitConversion';

export function buildElementStyle(element: BaseElement): CSSProperties {
  const { style } = element;
  const css: CSSProperties = {
    width: '100%',
    height: '100%',
    fontFamily: style.fontFamily,
    fontSize: style.fontSizePt ? `${ptToPx(style.fontSizePt)}px` : undefined,
    fontWeight: style.bold ? 'bold' : 'normal',
    fontStyle: style.italic ? 'italic' : 'normal',
    textDecoration: style.underline ? 'underline' : 'none',
    color: style.color,
    backgroundColor: style.backgroundColor ?? 'transparent',
    textAlign: style.textAlign ?? 'left',
    padding: style.paddingMm ? `${style.paddingMm}mm` : undefined,
    opacity: style.opacity ?? 1,
    boxSizing: 'border-box',
  };

  if (style.verticalAlign === 'middle') {
    css.display = 'flex';
    css.alignItems = 'center';
  } else if (style.verticalAlign === 'bottom') {
    css.display = 'flex';
    css.alignItems = 'flex-end';
  }

  if (style.border) {
    css.border = `${style.borderWidthPx ?? 1}px ${style.borderStyle ?? 'solid'} ${style.borderColor ?? '#d1d5db'}`;
  }

  return css;
}
