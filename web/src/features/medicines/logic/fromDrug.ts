import type { Drug, MyDrug } from '@/features/catalog';
import { formatStrength } from '@/shared/format/dose';
import type { Lang } from '@/shared/i18n';
import {
  DEFAULT_FIRST_DOSE,
  intervalFromDayParts,
  preparationFor,
  type Interval,
} from '@/shared/domain/time';
import type { Medicine } from '../model';

export const DEFAULT_PRN_MAX = 4;
const ONCE_DAILY: Interval = { every: 24, firstDose: DEFAULT_FIRST_DOSE };

/** A new medicine pre-filled from the catalog, in the chosen language. Every field stays editable. */
export function medicineFromDrug(
  drug: Drug,
  strengthIndex: number,
  id: string,
  lang: Lang,
): Medicine {
  const amounts = drug.strengths[strengthIndex] ?? drug.strengths[0] ?? [];
  return {
    id,
    drugId: drug.id,
    name: drug.name,
    strength: formatStrength(amounts, drug.unit),
    ingredientAmounts: [...amounts],
    unit: drug.unit,
    amount: 1,
    form: drug.form,
    ...(intervalFromDayParts(drug.defaultTimes) ?? ONCE_DAILY),
    prn: drug.defaultPrn,
    prnMaxPerDay: drug.defaultPrn ? DEFAULT_PRN_MAX : null,
    food: drug.food,
    warnings: [...drug.warnings],
    purpose: '',
    advice: drug.advice[lang],
    preparation: preparationFor(drug.form),
  };
}

/** Switch a catalog medicine to another strength, keeping everything else. */
export function withStrength(medicine: Medicine, drug: Drug, strengthIndex: number): Medicine {
  const amounts = drug.strengths[strengthIndex] ?? medicine.ingredientAmounts;
  return {
    ...medicine,
    ingredientAmounts: [...amounts],
    strength: formatStrength(amounts, drug.unit),
  };
}

export function customMedicine(name: string, id: string): Medicine {
  return {
    id,
    drugId: null,
    name,
    strength: '',
    ingredientAmounts: [],
    unit: null,
    amount: 1,
    form: 'tablet',
    ...ONCE_DAILY,
    prn: false,
    prnMaxPerDay: null,
    food: 'any',
    warnings: [],
    purpose: '',
    advice: '',
    preparation: 'tablet',
  };
}

/** A medicine from one of the apoteker's own saved drugs. */
export function medicineFromMyDrug(drug: MyDrug, id: string): Medicine {
  return {
    ...customMedicine(drug.name, id),
    strength: drug.strength,
    form: drug.form,
    every: drug.every,
    firstDose: drug.firstDose,
    prn: drug.prn,
    prnMaxPerDay: drug.prnMaxPerDay,
    food: drug.food,
    warnings: [...drug.warnings],
    advice: drug.advice,
    preparation: drug.preparation,
  };
}

/** What gets remembered when a custom medicine is saved to "My drugs". */
export function toMyDrug(medicine: Medicine, id: string): MyDrug {
  return {
    id,
    name: medicine.name.trim(),
    strength: medicine.strength,
    form: medicine.form,
    every: medicine.every,
    firstDose: medicine.firstDose,
    preparation: medicine.preparation,
    prn: medicine.prn,
    prnMaxPerDay: medicine.prnMaxPerDay,
    food: medicine.food,
    warnings: [...medicine.warnings],
    advice: medicine.advice,
  };
}
