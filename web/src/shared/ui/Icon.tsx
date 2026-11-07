import type { ReactElement } from 'react';

/** A small custom icon set drawn for PillPlan: 24 x 24, 2px strokes, round ends. */
const PATHS = {
  morning: (
    <>
      <path d="M2 19h20" />
      <g className="icon-sunrise">
        <path d="M7 19a5 5 0 0 1 10 0" />
        <path className="icon-rays" d="M12 8.5v2M5.8 12.3l1.4 1.1M18.2 12.3l-1.4 1.1" />
      </g>
    </>
  ),
  noon: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path
        className="icon-rays"
        d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"
      />
    </>
  ),
  evening: (
    <>
      <path className="icon-moon" d="M15.5 3.5a8 8 0 1 0 5 13.4A7 7 0 0 1 15.5 3.5Z" />
      <path d="M19 3v3M17.5 4.5h3" />
    </>
  ),
  bedtime: (
    <>
      <path d="M2 20V9M2 16h20v4M22 16v-3a2 2 0 0 0-2-2h-8v5" />
      <circle cx="6.5" cy="13" r="1.8" />
      <path className="icon-z" d="M14 3h4l-4 4h4" />
    </>
  ),
  prn: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  food: (
    <>
      <circle cx="12" cy="12" r="6" />
      <path d="M2 5v5a1.5 1.5 0 0 0 3 0V5M3.5 10v9M21 19V5c-1.7 0-3 2-3 5s1.3 3 3 3" />
    </>
  ),
  drowsy: <path d="M4 5h6l-6 7h6M13 11h7l-7 8h7" />,
  alcohol: (
    <>
      <path d="M8 3h8l-.8 5.5a3.2 3.2 0 0 1-6.4 0Z M12 12v7M8.5 20h7" />
      <path d="M4 4l16 16" />
    </>
  ),
  water: <path d="M6 3h12l-1.6 17.1a1 1 0 0 1-1 .9H8.6a1 1 0 0 1-1-.9ZM6.8 11h10.4" />,
  whole: (
    <>
      <path d="M9 17.5 17.5 9a3.5 3.5 0 0 0-5-5L4 12.5a3.5 3.5 0 0 0 5 5ZM8.3 8.3l5 5" />
      <path d="M17 15l4 4M21 15l-4 4" />
    </>
  ),
  course: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4M9 15l2 2 4-4" />
    </>
  ),
  fridge: (
    <>
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <path d="M6 9h12M9 5v2M9 12v3" />
    </>
  ),
  shake: (
    <>
      <path d="M10 3h4v3l2 3v11a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V9l2-3Z" />
      <path d="M3.5 9l1.5 1M3.5 14H5M20.5 9 19 10M20.5 14H19" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4" />
      <path d="M3 21 21 3" />
    </>
  ),
  dont_stop: <path d="M3 6h5v4h5v4h5v4h3M3 6v15h18" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  edit: <path d="M4 20h4L19 9l-4-4L4 16Zm10-14 4 4" />,
  remove: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />,
  grip: (
    <g fill="currentColor" stroke="none">
      <circle cx="9" cy="6" r="1.6" />
      <circle cx="15" cy="6" r="1.6" />
      <circle cx="9" cy="12" r="1.6" />
      <circle cx="15" cy="12" r="1.6" />
      <circle cx="9" cy="18" r="1.6" />
      <circle cx="15" cy="18" r="1.6" />
    </g>
  ),
  print: (
    <>
      <path d="M7 9V3h10v6M7 18H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <path className="icon-paper" d="M7 14h10v7H7Z" />
    </>
  ),
  counsel: (
    <>
      <circle cx="8" cy="8" r="3" />
      <path d="M2.5 20a5.5 5.5 0 0 1 11 0" />
      <path className="icon-bubble" d="M14 3h7v6h-3l-2.5 2.5V9H14Z" />
    </>
  ),
  back: <path d="m15 18-6-6 6-6" />,
  chevron: <path d="m6 9 6 6 6-6" />,
  more: (
    <g fill="currentColor" stroke="none">
      <circle className="icon-dot-left" cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle className="icon-dot-right" cx="19" cy="12" r="1.8" />
    </g>
  ),
  check: <path className="icon-check" d="m5 12 5 5L20 7" />,
  next: <path d="m9 6 6 6-6 6" />,
  soundOn: (
    <>
      <path d="M4 9h4l5-4v14l-5-4H4Z" />
      <path className="icon-waves" d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />
    </>
  ),
  soundOff: (
    <>
      <path d="M4 9h4l5-4v14l-5-4H4Z" />
      <path d="m17 9 5 6M22 9l-5 6" />
    </>
  ),
  play: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path className="icon-play" d="m10 8.5 5 3.5-5 3.5Z" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  download: <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />,
  upload: <path d="M12 15V3M7 8l5-5 5 5M5 21h14" />,
  alert: <path d="M12 3 2 21h20ZM12 10v5M12 18h.01" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7.5h.01" />
    </>
  ),
} satisfies Record<string, ReactElement>;

export type IconName = keyof typeof PATHS;

export function isIconName(value: string): value is IconName {
  return value in PATHS;
}

interface IconProps {
  name: IconName;
  size?: number;
  /** Text for screen readers. Leave out when the icon sits next to visible text. */
  label?: string;
  className?: string;
}

export function Icon({ name, size = 20, label, className }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
