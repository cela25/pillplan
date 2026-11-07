import type { DoseForm, DoseUnit } from '@/shared/domain/time';
import type { Strings } from '@/shared/i18n';

const FRACTIONS: Readonly<Record<string, string>> = { '0.25': '¼', '0.5': '½', '0.75': '¾' };

/**
 * ISMP style numbers: always a leading zero, never a trailing zero,
 * grouping from 1,000 up. en-US: 0.5, 4,000. id-ID: 0,5, 4.000.
 */
export function formatNumber(value: number, locale = 'en-US'): string {
  if (!Number.isFinite(value)) return '';
  return value.toLocaleString(locale, { maximumFractionDigits: 3 });
}

/** Solid doses read better as fractions: 0.5 -> "½", 1.5 -> "1½". */
export function formatAmount(amount: number, form: DoseForm, locale = 'en-US'): string {
  if (form === 'tablet' || form === 'capsule') {
    const whole = Math.floor(amount);
    const fraction = FRACTIONS[String(Math.round((amount - whole) * 100) / 100)];
    if (fraction) return whole === 0 ? fraction : `${whole}${fraction}`;
  }
  return formatNumber(amount, locale);
}

export function formName(amount: number, form: DoseForm, t: Strings): string {
  const [one, many] = t.formNames[form];
  return amount > 1 ? many : one;
}

/** "1 tablet", "½ tablet", "2 capsules", "5 mL"; Indonesian has no plural. */
export function formatDose(amount: number, form: DoseForm, t: Strings): string {
  return `${formatAmount(amount, form, t.locale)} ${formName(amount, form, t)}`;
}

/** "500 mg" or, for combinations, "500 mg + 65 mg". */
export function formatStrength(
  amounts: readonly number[],
  unit: DoseUnit,
  locale = 'en-US',
): string {
  return amounts.map((amount) => `${formatNumber(amount, locale)} ${unit}`).join(' + ');
}
