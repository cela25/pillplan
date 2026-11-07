import type { CSSProperties } from 'react';
import { Easing, interpolate } from 'remotion';

/**
 * The app's tokens as plain values: the render page has no app stylesheet, so they are set
 * as CSS custom properties on the root and the shared drawings (var(--ink)…) just work.
 */
export const TOKENS = {
  '--paper': '#ffffff',
  '--ink': '#111111',
  '--ink-muted': '#5a5a5a',
  '--rule': '#cfcfcf',
  '--amber': '#b45f06',
  '--amber-tint': '#fbeedf',
  '--desk': '#ececea',
  '--alert': '#c62828',
  '--ok': '#2e7d32',
  '--font-sans': "'Atkinson Hyperlegible Next', Verdana, sans-serif",
  '--font-mono': "'Atkinson Hyperlegible Mono', 'Courier New', monospace",
} as CSSProperties;

// The app's motion: standard and enter curves, never an overshoot.
export const standard = Easing.bezier(0.2, 0, 0, 1);
export const enter = Easing.bezier(0.05, 0.7, 0.1, 1);

/** 0 → 1 between two frames, clamped. */
export function ramp(frame: number, from: number, to: number, easing = standard): number {
  return interpolate(frame, [from, to], [0, 1], {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

export function rise(progress: number, distance = 18): CSSProperties {
  return { opacity: progress, transform: `translateY(${(1 - progress) * distance}px)` };
}

export const caption: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-sans)',
  fontWeight: 700,
  fontSize: 44,
  color: 'var(--ink)',
  textAlign: 'center',
};
