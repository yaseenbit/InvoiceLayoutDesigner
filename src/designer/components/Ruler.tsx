import React, { useMemo } from 'react';

interface Props {
  orientation: 'horizontal' | 'vertical';
  lengthMm: number;
  zoom: number;
  offsetPx?: number;
  thicknessPx?: number;
}

const RULER_BG = '#f3f4f6';
const RULER_TEXT = '#6b7280';
const RULER_TICK = '#9ca3af';
const MM_TO_CSS_PX = 96 / 25.4;

export const Ruler: React.FC<Props> = ({ orientation, lengthMm, zoom, offsetPx = 0, thicknessPx = 20 }) => {
  const isH = orientation === 'horizontal';
  const scaledPxPerMm = MM_TO_CSS_PX * zoom;
  const totalPx = lengthMm * scaledPxPerMm;

  const ticks = useMemo(() => {
    const result: Array<{ mm: number; major: boolean }> = [];
    const majorEvery = zoom >= 1.5 ? 5 : zoom >= 0.8 ? 10 : 20;
    const minorEvery = zoom >= 1.5 ? 1 : zoom >= 0.8 ? 2 : 5;
    for (let mm = 0; mm <= lengthMm; mm += minorEvery) {
      result.push({ mm, major: mm % majorEvery === 0 });
    }
    return result;
  }, [lengthMm, zoom]);

  return (
    <div
      style={{
        position: 'relative',
        backgroundColor: RULER_BG,
        borderBottom: isH ? '1px solid #d1d5db' : undefined,
        borderRight: !isH ? '1px solid #d1d5db' : undefined,
        overflow: 'hidden',
        flexShrink: 0,
        [isH ? 'width' : 'height']: `${totalPx}px`,
        [isH ? 'height' : 'width']: `${thicknessPx}px`,
      }}
    >
      <svg
        width={isH ? totalPx : thicknessPx}
        height={isH ? thicknessPx : totalPx}
        style={{ display: 'block', overflow: 'visible' }}
      >
        {ticks.map(({ mm, major }) => {
          const pos = mm * scaledPxPerMm;
          const tickLen = major ? thicknessPx * 0.6 : thicknessPx * 0.3;
          return (
            <g key={mm}>
              {isH ? (
                <line x1={pos} y1={thicknessPx} x2={pos} y2={thicknessPx - tickLen} stroke={RULER_TICK} strokeWidth={0.5} />
              ) : (
                <line x1={thicknessPx} y1={pos} x2={thicknessPx - tickLen} y2={pos} stroke={RULER_TICK} strokeWidth={0.5} />
              )}
              {major && mm > 0 && (
                isH ? (
                  <text x={pos + 1.5} y={thicknessPx - tickLen - 1} fontSize={7} fill={RULER_TEXT}>{mm}</text>
                ) : (
                  <text
                    x={thicknessPx - tickLen - 2}
                    y={pos + 1}
                    fontSize={7}
                    fill={RULER_TEXT}
                    textAnchor="end"
                    dominantBaseline="middle"
                    transform={`rotate(-90, ${thicknessPx - tickLen - 2}, ${pos + 1})`}
                  >
                    {mm}
                  </text>
                )
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
