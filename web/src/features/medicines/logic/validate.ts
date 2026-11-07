import { isClockTime, isInterval } from '@/shared/domain/time';
import type { Strings } from '@/shared/i18n';
import type { Medicine } from '../model';

export type MedicineErrors = Partial<
  Record<'name' | 'amount' | 'times' | 'firstDose' | 'maxPerDay', string>
>;

export function validateMedicine(medicine: Medicine, t: Strings): MedicineErrors {
  const errors: MedicineErrors = {};
  if (!medicine.name.trim()) errors.name = t.form.errors.name;
  if (!Number.isFinite(medicine.amount) || medicine.amount <= 0) {
    errors.amount = t.form.errors.amount;
  }
  if (!medicine.prn && !isInterval(medicine.every)) errors.times = t.form.errors.times;
  if (!medicine.prn && !isClockTime(medicine.firstDose)) errors.firstDose = t.form.errors.firstDose;
  const max = medicine.prnMaxPerDay;
  if (medicine.prn && (max === null || !Number.isInteger(max) || max < 1 || max > 24)) {
    errors.maxPerDay = t.form.errors.maxPerDay;
  }
  return errors;
}
