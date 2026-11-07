import {
  doseTimes,
  type ClockTime,
  type DoseForm,
  type DoseTime,
  type DoseUnit,
  type FoodRule,
  type IntervalHours,
  type Preparation,
} from '@/shared/domain/time';

export interface Medicine {
  id: string;
  /** Catalog drug id, or null for a custom medicine that PillPlan cannot check. */
  drugId: string | null;
  name: string;
  strength: string;
  /** Amount of each catalog ingredient in one unit (tablet, capsule). Empty when custom. */
  ingredientAmounts: number[];
  unit: DoseUnit | null;
  /** Units per dose, for example 0.5 tablet. */
  amount: number;
  form: DoseForm;
  /** Hours between doses: 24, 12, 8 or 6. Ignored when taken only when needed. */
  every: IntervalHours;
  /** Clock time of the first dose of the day; the rest follow every `every` hours. */
  firstDose: ClockTime;
  prn: boolean;
  /** Most doses a day when taken only when needed. */
  prnMaxPerDay: number | null;
  food: FoodRule;
  warnings: string[];
  purpose: string;
  advice: string;
  /** Sediaan: tablet, capsule, syrup or suspension. */
  preparation: Preparation;
  /** The prescription signa as typed, for example "3 dd 1 tab p.c.". */
  signa?: string | undefined;
}

export interface Tracker {
  /** First day of the week shown, as yyyy-mm-dd in local time. */
  start: string;
  /** Keys of doses ticked off, like "d0-0700" (day 0, the 07:00 dose). */
  popped: string[];
}

export interface PlanState {
  patientName: string;
  medicines: Medicine[];
  tracker: Tracker;
}

/** How many doses a day count towards daily totals. */
export function dosesPerDay(medicine: Medicine): number {
  return medicine.prn ? (medicine.prnMaxPerDay ?? 0) : 24 / medicine.every;
}

/** The clock times of a medicine's doses in one day; none when only taken when needed. */
export function medicineDoseTimes(medicine: Medicine): DoseTime[] {
  return medicine.prn ? [] : doseTimes(medicine.every, medicine.firstDose);
}
