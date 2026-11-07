/**
 * The PillPlan mark: a capsule, half amber, lying on a ruled label line. It carries a
 * view-transition name, so the welcome screen's mark glides into the navbar.
 */
export function Wordmark({ size = 52 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={(size * 32) / 52}
      style={{ viewTransitionName: 'wordmark' }}
      viewBox="0 0 52 32"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M2 29h48" stroke="var(--ink)" strokeWidth="2" />
      <path
        d="M26 6H15a10 10 0 0 0 0 20h11Z"
        fill="var(--amber)"
        stroke="var(--ink)"
        strokeWidth="2"
      />
      <path
        d="M26 6h11a10 10 0 0 1 0 20H26Z"
        fill="var(--paper)"
        stroke="var(--ink)"
        strokeWidth="2"
      />
    </svg>
  );
}
