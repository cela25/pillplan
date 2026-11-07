import { useEffect, useState } from 'react';
import type { PlanState } from '@/features/medicines';
import { clearSavedPlan, readRemember, savePlan, writeRemember } from '../logic/persist';

/** Autosaves the plan while "Remember on this device" is on, and removes it when turned off. */
export function usePersistence(plan: PlanState, storage: Storage | null) {
  const [remember, setRemember] = useState(() => readRemember(storage));

  useEffect(() => {
    writeRemember(storage, remember);
    if (remember) savePlan(storage, plan, new Date());
    else clearSavedPlan(storage);
  }, [plan, remember, storage]);

  return { remember, setRemember, available: storage !== null };
}
