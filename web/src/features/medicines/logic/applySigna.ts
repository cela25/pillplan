import { isLiquid } from '@/shared/domain/time';
import type { Medicine } from '../model';
import { DEFAULT_PRN_MAX } from './fromDrug';
import type { SignaResult } from './signa';

/**
 * Copy what the signa says onto the medicine. Fields the signa does not mention stay as they
 * are. Catalog drugs keep their own form; only custom medicines take the form from the signa.
 */
export function applySigna(medicine: Medicine, signa: string, result: SignaResult): Medicine {
  const next: Medicine = { ...medicine, signa };
  if (result.prn) {
    next.prn = true;
    next.prnMaxPerDay = result.maxPerDay ?? medicine.prnMaxPerDay ?? DEFAULT_PRN_MAX;
  } else if (result.interval) {
    next.prn = false;
    next.every = result.interval.every;
    next.firstDose = result.interval.firstDose;
    next.prnMaxPerDay = null;
  }
  if (result.amount !== null) next.amount = result.amount;
  if (result.food) next.food = result.food;
  if (result.form && medicine.drugId === null) {
    next.form = result.form;
    if (result.form === 'mL' && !isLiquid(next.preparation)) next.preparation = 'syrup';
  }
  return next;
}
