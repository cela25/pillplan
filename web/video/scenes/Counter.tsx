import { useCurrentFrame } from 'remotion';
import type { IntroText } from '@/features/welcome/ui/intro';
import { Pharmacist } from '../people';
import { ramp } from '../theme';
import { Caption, Scene } from './Scene';

/** Frames per typed character, also used by the film to place the key ticks. */
export const TYPE_START = 16;
export const FRAMES_PER_CHAR = 2;

/** The apoteker at the counter types the signa into a PillPlan field, letter by letter. */
export function Counter({ text }: { text: IntroText }) {
  const frame = useCurrentFrame();
  const typed = Math.max(0, Math.floor((frame - TYPE_START) / FRAMES_PER_CHAR));
  const shown = text.typedSigna.slice(0, typed);
  const done = typed >= text.typedSigna.length;
  const check = ramp(
    frame,
    TYPE_START + text.typedSigna.length * FRAMES_PER_CHAR + 4,
    TYPE_START + text.typedSigna.length * FRAMES_PER_CHAR + 14,
  );
  return (
    <Scene>
      <Caption>{text.counter}</Caption>
      <svg width={1280} height={720} viewBox="0 0 1280 720">
        <Pharmacist x={170} y={250} scale={1.25} arms={ramp(frame, 4, 16)} />
        <rect x={80} y={560} width={1120} height={24} rx={4} fill="var(--ink)" />
        <rect x={110} y={584} width={1060} height={140} fill="#d8d8d3" />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: 520,
          top: 230,
          width: 620,
          padding: 28,
          border: '3px solid var(--ink)',
          borderRadius: 10,
          background: 'var(--paper)',
          fontFamily: 'var(--font-sans)',
          boxShadow: '0 6px 0 var(--ink)',
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink-muted)', marginBottom: 12 }}>
          Signa
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 48,
            fontWeight: 700,
            padding: '10px 16px',
            border: '2px solid var(--amber)',
            borderRadius: 6,
            minHeight: 64,
          }}
        >
          {shown}
          <span style={{ opacity: done ? 0 : Math.floor(frame / 8) % 2 ? 1 : 0.2 }}>|</span>
        </div>
        <div
          style={{
            marginTop: 16,
            fontSize: 28,
            fontWeight: 700,
            color: 'var(--ok)',
            opacity: check,
            transform: `translateY(${(1 - check) * 10}px)`,
          }}
        >
          {text.rule}
        </div>
      </div>
    </Scene>
  );
}
