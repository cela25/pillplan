import { useCurrentFrame } from 'remotion';
import { PreparationIcon } from '@/features/medicines/ui/PreparationIcon';
import type { IntroText } from '@/features/welcome/ui/intro';
import { PREPARATIONS } from '@/shared/domain/time';
import { enter, ramp, rise } from '../theme';
import { Caption, Scene } from './Scene';

/** Tablet, capsule, syrup, suspension, one after another; the suspension says "shake well". */
export function Forms({ text }: { text: IntroText }) {
  const frame = useCurrentFrame();
  return (
    <Scene>
      <Caption>{text.formsTitle}</Caption>
      <div
        style={{
          position: 'absolute',
          inset: '200px 0 0',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          gap: 70,
          fontFamily: 'var(--font-sans)',
        }}
      >
        {PREPARATIONS.map((preparation, index) => {
          const show = ramp(frame, 8 + index * 7, 24 + index * 7, enter);
          return (
            <div
              key={preparation}
              style={{
                display: 'grid',
                justifyItems: 'center',
                alignContent: 'start',
                gap: 18,
                ...rise(show, 26),
              }}
            >
              <div
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  width: 200,
                  height: 200,
                  border: '3px solid var(--ink)',
                  borderRadius: 14,
                  background: 'var(--paper)',
                }}
              >
                <PreparationIcon preparation={preparation} size={150} />
              </div>
              <span style={{ fontSize: 32, fontWeight: 700 }}>{text.forms[preparation]}</span>
              {preparation === 'suspension' && (
                <span
                  style={{
                    padding: '4px 14px',
                    borderRadius: 6,
                    background: 'var(--amber)',
                    color: 'var(--paper)',
                    fontSize: 22,
                    fontWeight: 700,
                    opacity: ramp(frame, 40, 52),
                  }}
                >
                  {text.shakeTag}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Scene>
  );
}
