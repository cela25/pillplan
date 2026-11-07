import { useCurrentFrame } from 'remotion';
import type { IntroText } from '@/features/welcome/ui/intro';
import { Patient } from '../people';
import { enter, ramp } from '../theme';
import { Caption, Scene } from './Scene';

/** Frames (from scene start) when the reminder rings and when the bubble is tapped. */
export const RING_AT = 12;
export const TAP_AT = 48;

/** At home: the phone rings at 23.00 and the patient pops today's blister bubble. */
export function Home({ text }: { text: IntroText }) {
  const frame = useCurrentFrame();
  const phone = ramp(frame, RING_AT - 6, RING_AT + 8, enter);
  const tapped = ramp(frame, TAP_AT, TAP_AT + 8, enter);
  const wiggle = frame > RING_AT && frame < RING_AT + 18 ? Math.sin(frame * 1.4) * 3 : 0;
  return (
    <Scene>
      <Caption>{text.home}</Caption>
      <svg width={1280} height={720} viewBox="0 0 1280 720">
        <Patient x={880} y={270} scale={1.2} />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: 170,
          top: 190,
          width: 300,
          height: 470,
          border: '6px solid var(--ink)',
          borderRadius: 36,
          background: 'var(--paper)',
          transform: `translateY(${(1 - phone) * 40}px) rotate(${wiggle}deg)`,
          opacity: phone,
          fontFamily: 'var(--font-sans)',
          display: 'grid',
          alignContent: 'start',
          padding: '48px 20px',
          gap: 14,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 64,
            fontWeight: 700,
            textAlign: 'center',
          }}
        >
          {text.locale === 'id-ID' ? '23.00' : '23:00'}
        </div>
        <div
          style={{
            padding: 16,
            borderRadius: 12,
            background: 'var(--amber-tint)',
            border: '2px solid var(--amber)',
            fontSize: 24,
            fontWeight: 700,
          }}
        >
          {text.reminder}
        </div>
      </div>
      <div style={{ position: 'absolute', left: 540, top: 330, display: 'flex', gap: 18 }}>
        {[0, 1, 2].map((index) => {
          const isToday = index === 2;
          const filled = index < 2 ? 1 : tapped;
          return (
            <div
              key={index}
              style={{
                width: 76,
                height: 76,
                borderRadius: '50%',
                border: '4px solid var(--ink)',
                background: filled > 0.5 ? 'var(--amber)' : 'var(--paper)',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--paper)',
                fontSize: 40,
                fontWeight: 700,
                transform: `scale(${isToday ? 1 + tapped * 0.12 - Math.max(0, tapped - 0.5) * 0.24 : 1})`,
              }}
            >
              {filled > 0.5 && (
                <svg width={40} height={40} viewBox="0 0 24 24" fill="none">
                  <path
                    d="m5 12 5 5L20 7"
                    stroke="var(--paper)"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          );
        })}
      </div>
    </Scene>
  );
}
