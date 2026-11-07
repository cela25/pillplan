/**
 * Two flat figures in the app's ink and amber, drawn from circles and rounded paths so they
 * stay friendly, culturally neutral and tiny to encode. 200 x 320 units each.
 */
interface PersonProps {
  /** 0 = arms down, 1 = arms raised (holding or typing). */
  arms?: number;
  x?: number;
  y?: number;
  scale?: number;
}

const line = {
  stroke: 'var(--ink)',
  strokeWidth: 5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

function Head({ hair }: { hair: string }) {
  return (
    <>
      <circle cx="100" cy="62" r="38" fill="#e9c4a0" {...line} />
      <path d="M62 58a38 38 0 0 1 76 0c-10-14-30-20-38-20s-28 6-38 20Z" fill={hair} {...line} />
      <circle cx="86" cy="66" r="4" fill="var(--ink)" />
      <circle cx="114" cy="66" r="4" fill="var(--ink)" />
    </>
  );
}

/** The patient: amber top, both hands come up to hold the medicine. */
export function Patient({ arms = 0, x = 0, y = 0, scale = 1 }: PersonProps) {
  const lift = 40 * arms;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M40 320v-140a60 60 0 0 1 120 0v140Z" fill="var(--amber)" {...line} />
      <path d={`M48 190q-10 50 ${10} ${90 - lift * 1.6}`} fill="none" {...line} />
      <path d={`M152 190q10 50 ${-10} ${90 - lift * 1.6}`} fill="none" {...line} />
      <Head hair="#3a2a20" />
      <path d="M88 84q12 8 24 0" fill="none" {...line} strokeWidth={4} />
    </g>
  );
}

/** The apoteker: white coat over an ink shirt, a small badge with a plus. */
export function Pharmacist({ arms = 0, x = 0, y = 0, scale = 1 }: PersonProps) {
  const reach = 30 * arms;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M40 320v-140a60 60 0 0 1 120 0v140Z" fill="var(--paper)" {...line} />
      <path d="M100 120v200" {...line} strokeWidth={3} />
      <path d="M84 124l16 30 16-30" fill="var(--ink)" {...line} strokeWidth={3} />
      <rect
        x="118"
        y="176"
        width="26"
        height="18"
        rx="3"
        fill="var(--amber-tint)"
        {...line}
        strokeWidth={3}
      />
      <path d="M131 180v10M126 185h10" {...line} strokeWidth={2.5} stroke="var(--amber)" />
      <path d={`M48 190q-6 50 ${16 + reach} ${70 - reach}`} fill="none" {...line} />
      <path d={`M152 190q6 50 ${-16 + reach} ${70 - reach}`} fill="none" {...line} />
      <Head hair="#1d1d1d" />
      <path d="M88 84q12 8 24 0" fill="none" {...line} strokeWidth={4} />
    </g>
  );
}
