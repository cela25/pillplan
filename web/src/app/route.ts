import { useCallback, useEffect, useRef, useState } from 'react';
import { withViewTransition } from '@/shared/viewTransition';

/** The screens the address bar knows, so Back, Forward, reload and bookmarks all work. */
export type View = 'welcome' | 'plan' | 'counsel';

const PATHS: Record<View, string> = { welcome: '/', plan: '/plan', counsel: '/plan/counsel' };

export function pathOf(view: View): string {
  return PATHS[view];
}

export function viewFromPath(pathname: string): View {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === PATHS.counsel) return 'counsel';
  if (path === PATHS.plan) return 'plan';
  return 'welcome';
}

/** What each history entry remembers: its screen and the screen it was opened from. */
interface Entry {
  view: View;
  from?: View;
}

/** Welcome and app swap behind a view transition; counseling mode has its own motion. */
function show(from: View, to: View, update: () => void): void {
  if (from === 'welcome' || to === 'welcome') withViewTransition(update);
  else update();
}

/**
 * The current screen, kept in step with the browser history. Going back to the screen this
 * one was opened from steps back instead of pushing, so Start after "Intro" or closing
 * counseling mode does not pile up entries.
 */
export function useView(initial: View): readonly [View, (next: View) => void] {
  const [view, setView] = useState(initial);
  const current = useRef(initial);

  useEffect(() => {
    current.current = view;
  }, [view]);

  useEffect(() => {
    // Label the entry the page opened on (a reload keeps where it came from); demo links keep
    // their query.
    const opened = window.history.state as Entry | null;
    const entry: Entry = opened?.view === initial ? opened : { view: initial };
    window.history.replaceState(entry, '', pathOf(initial) + window.location.search);
    const onPop = (event: PopStateEvent) => {
      const entry = event.state as Entry | null;
      const next = entry?.view ?? viewFromPath(window.location.pathname);
      if (next !== current.current) show(current.current, next, () => setView(next));
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [initial]);

  const go = useCallback(
    (next: View) => {
      if (next === view) return;
      const here = window.history.state as Entry | null;
      if (here?.from === next) {
        window.history.back();
        return;
      }
      window.history.pushState({ view: next, from: view } satisfies Entry, '', pathOf(next));
      show(view, next, () => setView(next));
    },
    [view],
  );

  return [view, go] as const;
}
