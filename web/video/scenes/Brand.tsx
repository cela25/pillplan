import { useCurrentFrame } from 'remotion';
import type { IntroText } from '@/features/welcome/ui/intro';
import { Wordmark } from '@/shared/ui/Wordmark';
import { enter, ramp, rise } from '../theme';

/** The mark and the name, big. The last frame is also the poster. */
export function Brand({ text }: { text: IntroText }) {
  const frame = useCurrentFrame();
  const show = ramp(frame, 0, 18, enter);
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        alignContent: 'center',
        gap: 10,
        fontFamily: 'var(--font-sans)',
        ...rise(show, 24),
      }}
    >
      <Wordmark size={200} />
      <p
        style={{
          margin: 0,
          fontSize: 150,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        {text.name}
      </p>
      <p
        style={{ margin: 0, fontSize: 36, color: 'var(--ink-muted)', opacity: ramp(frame, 10, 24) }}
      >
        {text.tagline}
      </p>
    </div>
  );
}
