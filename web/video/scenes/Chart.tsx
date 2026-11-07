import { useCurrentFrame } from 'remotion';
import type { IntroText } from '@/features/welcome/ui/intro';
import { doseTimes, formatClock, toMinutes, type ClockTime } from '@/shared/domain/time';
import { arcPath, DIAL, pointAt } from '@/shared/ui/clockGeometry';
import { enter, ramp } from '../theme';
import { Caption, Scene } from './Scene';

/** Frames (from scene start) when each of the three doses lands; the film adds a pop there. */
export const DOSE_LANDINGS = [30, 40, 50] as const;

/** The same 24-hour dial as the app's DoseClock: the ring draws, three doses land 8 h apart. */
export function Chart({ text }: { text: IntroText }) {
  const frame = useCurrentFrame();
  const draw = ramp(frame, 4, 30);
  const doses = doseTimes(8, '07:00' as ClockTime);
  const circumference = 2 * Math.PI * DIAL.ring;
  const shape = ramp(frame, 52, 68);
  const points = doses.map(({ time }) => pointAt(toMinutes(time)));
  return (
    <Scene>
      <Caption>{text.rule}</Caption>
      <svg
        width={440}
        height={440}
        viewBox={`0 0 ${DIAL.size} ${DIAL.size}`}
        style={{ position: 'absolute', left: 190, top: 170 }}
      >
        <circle cx={DIAL.center} cy={DIAL.center} r={DIAL.ring} fill="var(--paper)" />
        <path
          d={arcPath(6 * 60, 18 * 60)}
          fill="none"
          stroke="var(--amber-tint)"
          strokeWidth={10}
          opacity={draw}
        />
        <path
          d={arcPath(18 * 60, 6 * 60)}
          fill="none"
          stroke="#d8d8d3"
          strokeWidth={10}
          opacity={draw}
        />
        <circle
          cx={DIAL.center}
          cy={DIAL.center}
          r={DIAL.ring}
          fill="none"
          stroke="var(--ink)"
          strokeWidth={1.5}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - draw)}
          transform={`rotate(-90 ${DIAL.center} ${DIAL.center})`}
        />
        <polygon
          points={points.map(({ x, y }) => `${x},${y}`).join(' ')}
          fill="var(--amber-tint)"
          stroke="var(--amber)"
          strokeWidth={2}
          opacity={shape}
        />
        {doses.map(({ time }, index) => {
          const land = ramp(
            frame,
            (DOSE_LANDINGS[index] ?? 30) - 8,
            DOSE_LANDINGS[index] ?? 30,
            enter,
          );
          const at = pointAt(toMinutes(time));
          return (
            <circle
              key={time}
              cx={at.x}
              cy={at.y}
              r={3 + land * 8}
              fill="var(--amber)"
              stroke="var(--paper)"
              strokeWidth={2.5}
              opacity={land}
            />
          );
        })}
        <text
          x={DIAL.center}
          y={DIAL.center}
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="var(--font-sans)"
          fontWeight={700}
          fontSize={17}
          fill="var(--ink)"
          opacity={shape}
        >
          {text.everyEight}
        </text>
      </svg>
      <div
        style={{
          position: 'absolute',
          left: 700,
          top: 230,
          display: 'grid',
          gap: 22,
          fontFamily: 'var(--font-sans)',
        }}
      >
        {doses.map(({ time }, index) => {
          const show = ramp(
            frame,
            DOSE_LANDINGS[index] ?? 30,
            (DOSE_LANDINGS[index] ?? 30) + 12,
            enter,
          );
          return (
            <div
              key={time}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                opacity: show,
                transform: `translateX(${(1 - show) * 24}px)`,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  fontSize: 56,
                  padding: '4px 18px',
                  border: '3px solid var(--amber)',
                  borderRadius: 8,
                  background: index === 0 ? 'var(--amber-tint)' : 'var(--paper)',
                }}
              >
                {formatClock(time, text.locale)}
              </span>
            </div>
          );
        })}
        <p
          style={{
            margin: 0,
            maxWidth: 440,
            fontSize: 26,
            color: 'var(--ink-muted)',
            opacity: shape,
          }}
        >
          {text.ruleSub}
        </p>
      </div>
    </Scene>
  );
}
