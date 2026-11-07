import { useCurrentFrame } from 'remotion';
import { PreparationIcon } from '@/features/medicines/ui/PreparationIcon';
import type { IntroText } from '@/features/welcome/ui/intro';
import { Patient } from '../people';
import { enter, ramp } from '../theme';
import { Caption, Scene } from './Scene';

/** A patient holding three medicines, unsure: "Pagi? Siang? Malam?" with each word struck. */
export function Problem({ text }: { text: IntroText }) {
  const frame = useCurrentFrame();
  return (
    <Scene>
      <Caption>{text.problem}</Caption>
      <svg width={1280} height={720} viewBox="0 0 1280 720">
        <Patient x={300} y={300} scale={1.2} arms={0} />
        {(['tablet', 'capsule', 'syrup'] as const).map((form, index) => {
          const pop = ramp(frame, 14 + index * 7, 30 + index * 7, enter);
          return (
            <g
              key={form}
              transform={`translate(${200 + index * 150} ${250 - pop * 60 - (index === 1 ? 40 : 0)}) scale(${0.6 + pop * 0.5})`}
              opacity={pop}
            >
              <PreparationIcon preparation={form} size={80} />
            </g>
          );
        })}
      </svg>
      <div
        style={{
          position: 'absolute',
          right: 150,
          top: 230,
          display: 'grid',
          gap: 22,
          fontFamily: 'var(--font-sans)',
          fontSize: 54,
          fontWeight: 700,
        }}
      >
        {text.oldWay.map((word, index) => {
          const show = ramp(frame, 24 + index * 8, 36 + index * 8, enter);
          const strike = ramp(frame, 60 + index * 5, 72 + index * 5);
          return (
            <span
              key={word}
              style={{
                position: 'relative',
                opacity: show * (1 - strike * 0.55),
                transform: `translateX(${(1 - show) * 30}px)`,
                color: 'var(--ink)',
              }}
            >
              {word}?
              <span
                style={{
                  position: 'absolute',
                  left: -6,
                  right: -6,
                  top: '52%',
                  height: 6,
                  background: 'var(--alert)',
                  transformOrigin: 'left',
                  transform: `scaleX(${strike})`,
                }}
              />
            </span>
          );
        })}
      </div>
    </Scene>
  );
}
