import type { ReactNode } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { ramp } from '../theme';

/** Every scene fades in over 8 frames and out over its last 8, so cuts never jump. */
export function Scene({ children }: { children: ReactNode }) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const opacity = Math.min(
    ramp(frame, 0, 8),
    1 - ramp(frame, durationInFrames - 8, durationInFrames),
  );
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
}

/** The caption strip at the top of each scene. */
export function Caption({ children, at = 4 }: { children: ReactNode; at?: number }) {
  const frame = useCurrentFrame();
  const show = ramp(frame, at, at + 14);
  return (
    <div
      style={{
        position: 'absolute',
        top: 56,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontFamily: 'var(--font-sans)',
        fontWeight: 700,
        fontSize: 46,
        color: 'var(--ink)',
        opacity: show,
        transform: `translateY(${(1 - show) * 14}px)`,
      }}
    >
      {children}
    </div>
  );
}
