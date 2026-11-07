import * as v from 'valibot';
import {
  DOSE_FORMS,
  FOOD_RULES,
  INTERVALS,
  isClockTime,
  PREPARATIONS,
  type ClockTime,
} from '@/shared/domain/time';
import type { MyDrug } from '../model';

export const MY_DRUGS_KEY = 'pillplan:mydrugs';
const MAX_DRUGS = 200;

const text = (max: number) => v.pipe(v.string(), v.maxLength(max));

const MyDrugSchema = v.object({
  id: v.pipe(v.string(), v.regex(/^[A-Za-z0-9_-]{1,64}$/)),
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
  strength: text(80),
  form: v.picklist(DOSE_FORMS),
  every: v.picklist(INTERVALS),
  firstDose: v.custom<ClockTime>((value) => typeof value === 'string' && isClockTime(value)),
  preparation: v.picklist(PREPARATIONS),
  prn: v.boolean(),
  prnMaxPerDay: v.nullable(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(24))),
  food: v.picklist(FOOD_RULES),
  warnings: v.pipe(v.array(text(40)), v.maxLength(20)),
  advice: text(400),
});

const MyDrugsSchema = v.pipe(v.array(MyDrugSchema), v.maxLength(MAX_DRUGS));

/** Reads the saved list. Broken or missing data gives an empty list instead of an error. */
export function loadMyDrugs(storage: Storage | null): MyDrug[] {
  try {
    const raw = storage?.getItem(MY_DRUGS_KEY);
    if (!raw) return [];
    const result = v.safeParse(MyDrugsSchema, JSON.parse(raw));
    return result.success ? result.output : [];
  } catch {
    return [];
  }
}

export function saveMyDrugs(storage: Storage | null, drugs: readonly MyDrug[]): void {
  try {
    storage?.setItem(MY_DRUGS_KEY, JSON.stringify(drugs.slice(0, MAX_DRUGS)));
  } catch {
    // Not remembered when storage is blocked.
  }
}

/** Same name (ignoring case) replaces the older entry, so the list never holds duplicates. */
export function upsertMyDrug(drugs: readonly MyDrug[], drug: MyDrug): MyDrug[] {
  const key = drug.name.trim().toLowerCase();
  return [drug, ...drugs.filter((item) => item.name.trim().toLowerCase() !== key)];
}
