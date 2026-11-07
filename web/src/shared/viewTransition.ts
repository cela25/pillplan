import { flushSync } from 'react-dom';

function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/**
 * Run a state update inside a View Transition when the browser supports it,
 * so rows slide instead of jumping. Falls back to a plain update.
 */
export function withViewTransition(update: () => void): void {
  if (typeof document.startViewTransition !== 'function' || prefersReducedMotion()) {
    update();
    return;
  }
  document.startViewTransition(() => {
    flushSync(update);
  });
}
