import type { Catalog, WarningLabel } from '@/features/catalog';
import { formatStrength } from '@/shared/format/dose';
import type { Lang } from '@/shared/i18n';
import type { Medicine } from '../model';

/** Catalog strengths are formatted for the current language; custom text stays as typed. */
export function displayStrength(medicine: Medicine, locale: string): string {
  return medicine.drugId && medicine.unit && medicine.ingredientAmounts.length > 0
    ? formatStrength(medicine.ingredientAmounts, medicine.unit, locale)
    : medicine.strength;
}

/** Untouched catalog advice follows the language switch. Edited advice stays as written. */
export function displayAdvice(medicine: Medicine, catalog: Catalog | null, lang: Lang): string {
  const drug = medicine.drugId ? catalog?.drugById.get(medicine.drugId) : undefined;
  if (drug && Object.values(drug.advice).includes(medicine.advice)) return drug.advice[lang];
  return medicine.advice;
}

export function medicineWarnings(medicine: Medicine, catalog: Catalog | null): WarningLabel[] {
  return medicine.warnings.flatMap((id) => {
    const warning = catalog?.warningById.get(id);
    return warning ? [warning] : [];
  });
}
