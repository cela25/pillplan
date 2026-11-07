import type { ReactNode } from 'react';
import type { Preparation } from '@/shared/domain/time';

interface PreparationIconProps {
  preparation: Preparation;
  size?: number;
}

const stroke = { stroke: 'var(--ink)', strokeWidth: 1.5, strokeLinejoin: 'round' } as const;

/** A bottle shared by the two liquids; only what is inside differs. */
function Bottle({ children }: { children: ReactNode }) {
  return (
    <>
      <rect x="16" y="3" width="8" height="5" rx="1" fill="var(--ink)" />
      <path d="M17 8h6v3l4 4v19a3 3 0 0 1-3 3h-8a3 3 0 0 1-3-3V15l4-4Z" fill="#fff" {...stroke} />
      {children}
      <path d="M17 8h6v3l4 4v19a3 3 0 0 1-3 3h-8a3 3 0 0 1-3-3V15l4-4Z" fill="none" {...stroke} />
    </>
  );
}

/**
 * The big-picture sediaan, so the patient matches the chart to what is on the shelf:
 * a tablet, a capsule, a syrup bottle, or a suspension bottle that must be shaken.
 */
export function PreparationIcon({ preparation, size = 40 }: PreparationIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      {preparation === 'tablet' && (
        <>
          <ellipse cx="20" cy="24" rx="14" ry="5" fill="#d8d8d3" {...stroke} />
          <ellipse cx="20" cy="20" rx="14" ry="5" fill="#fff" {...stroke} />
          <path d="M20 21v3.2M20 15v2" stroke="var(--ink)" strokeOpacity="0.35" />
          <path d="M6 20v4M34 20v4" {...stroke} />
          <path d="M12 20h16" stroke="var(--ink)" strokeOpacity="0.35" />
        </>
      )}
      {preparation === 'capsule' && (
        <g transform="rotate(-30 20 20)">
          <path d="M20 13h-8a7 7 0 0 0 0 14h8Z" fill="var(--amber)" {...stroke} />
          <path d="M20 13h8a7 7 0 0 1 0 14h-8Z" fill="#fff" {...stroke} />
        </g>
      )}
      {preparation === 'syrup' && (
        <Bottle>
          <path
            d="M13.5 22h13v12a2.5 2.5 0 0 1-2.5 2.5h-8a2.5 2.5 0 0 1-2.5-2.5Z"
            fill="var(--amber)"
          />
          <path d="M15 27h10" stroke="#fff" strokeWidth="1.5" />
        </Bottle>
      )}
      {preparation === 'suspension' && (
        <>
          <Bottle>
            <path
              d="M13.5 20h13v14a2.5 2.5 0 0 1-2.5 2.5h-8a2.5 2.5 0 0 1-2.5-2.5Z"
              fill="var(--amber-tint)"
            />
            <path
              d="M13.5 31h13v3a2.5 2.5 0 0 1-2.5 2.5h-8a2.5 2.5 0 0 1-2.5-2.5Z"
              fill="var(--amber)"
            />
            <circle cx="17" cy="25" r="1" fill="var(--amber)" />
            <circle cx="22" cy="23.5" r="1" fill="var(--amber)" />
            <circle cx="20" cy="28" r="1" fill="var(--amber)" />
          </Bottle>
          <path
            d="M6 14c-2 3-2 7 0 10M34 14c2 3 2 7 0 10"
            fill="none"
            {...stroke}
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}
