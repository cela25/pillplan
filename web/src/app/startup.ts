import { emptyPlan, type PlanState } from '@/features/medicines';
import { toIsoDate } from '@/features/schedule';
import { getStorage, loadPlan } from '@/features/storage';
import { initialLang, type Lang } from '@/shared/i18n';
import { viewFromPath, type View } from './route';

export interface Startup {
  today: Date;
  storage: Storage | null;
  plan: PlanState;
  lang: Lang;
  /** Saved data was there but could not be read. */
  invalidSaved: boolean;
  /** ?example loads the made-up patient; ?counsel also opens counseling mode (for demos). */
  example: boolean;
  /** The screen to open: from the address, except demo links go straight into the app. */
  view: View;
}

/** Read everything the app needs once, before the first render. */
export function readStartup(
  now = new Date(),
  search = window.location.search,
  pathname = window.location.pathname,
): Startup {
  const storage = getStorage();
  const saved = loadPlan(storage);
  const params = new URLSearchParams(search);
  return {
    today: now,
    storage,
    plan: saved.status === 'restored' ? saved.plan : emptyPlan(toIsoDate(now)),
    lang: initialLang(storage, params.get('lang')),
    invalidSaved: saved.status === 'invalid',
    example: params.has('example') || params.has('counsel'),
    view: params.has('counsel')
      ? 'counsel'
      : params.has('example')
        ? 'plan'
        : params.has('welcome')
          ? 'welcome'
          : viewFromPath(pathname),
  };
}
