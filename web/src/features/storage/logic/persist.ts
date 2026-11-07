import type { PlanState } from '@/features/medicines';
import { parsePlan, serializePlan } from './schema';

export const PLAN_KEY = 'pillplan:plan';
export const REMEMBER_KEY = 'pillplan:remember';

export type LoadResult =
  | { status: 'restored'; plan: PlanState }
  | { status: 'empty' }
  | { status: 'invalid' }
  | { status: 'unavailable' };

/** localStorage, or null when the browser blocks it (private mode, disabled storage). */
export function getStorage(): Storage | null {
  try {
    const storage = window.localStorage;
    const probe = '__pillplan_probe__';
    storage.setItem(probe, probe);
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

export function loadPlan(storage: Storage | null): LoadResult {
  if (!storage) return { status: 'unavailable' };
  const raw = storage.getItem(PLAN_KEY);
  if (raw === null) return { status: 'empty' };
  try {
    const plan = parsePlan(JSON.parse(raw));
    return plan ? { status: 'restored', plan } : { status: 'invalid' };
  } catch {
    return { status: 'invalid' };
  }
}

export function savePlan(storage: Storage | null, plan: PlanState, now: Date): boolean {
  if (!storage) return false;
  try {
    storage.setItem(PLAN_KEY, serializePlan(plan, now));
    return true;
  } catch {
    return false;
  }
}

export function clearSavedPlan(storage: Storage | null): void {
  try {
    storage?.removeItem(PLAN_KEY);
  } catch {
    // Nothing to clear when storage is blocked.
  }
}

export function readRemember(storage: Storage | null): boolean {
  try {
    return storage?.getItem(REMEMBER_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function writeRemember(storage: Storage | null, remember: boolean): void {
  try {
    storage?.setItem(REMEMBER_KEY, remember ? 'on' : 'off');
  } catch {
    // Preference simply is not kept.
  }
}
