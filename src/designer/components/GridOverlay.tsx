import React, { useMemo } from 'react';
import { A4PageSettings } from '../types/template.types';

interface Props {
  page: A4PageSettings;
}

export const GridOverlay: React.FC<Props> = ({ page }) => {
  const { widthMm, heightMm, gridSizeMm } = page;

  const lines = useMemo(() => {
    const verticals: number[] = [];
    const horizontals: number[] = [];
    for (let x = gridSizeMm; x < widthMm; x += gridSizeMm) verticals.push(x);
    for (let y = gridSizeMm; y < heightMm; y += gridSizeMm) horizontals.push(y);
    return { verticals, horizontals };
  }, [widthMm, heightMm, gridSizeMm]);

  return (
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {lines.verticals.map((x) => (
        <line
          key={`v${x}`}
          x1={`${x}mm`} y1="0"
          x2={`${x}mm`} y2="100%"
          stroke="#e5e7eb"
          strokeWidth="0.3"
        />
      ))}
      {lines.horizontals.map((y) => (
        <line
          key={`h${y}`}
          x1="0" y1={`${y}mm`}
          x2="100%" y2={`${y}mm`}
          stroke="#e5e7eb"
          strokeWidth="0.3"
        />
      ))}
    </svg>
  );
};
