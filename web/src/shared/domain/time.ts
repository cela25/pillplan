/** Shared kernel: the small vocabulary every feature agrees on. */

/**
 * Doses are spread evenly over the day: "3 dd 1" means every 8 hours, not
 * morning, noon and evening. Only intervals that divide the day are allowed.
 */
export const INTERVALS = [24, 12, 8, 6] as const;
export type IntervalHours = (typeof INTERVALS)[number];

export function isInterval(value: number): value is IntervalHours {
  return (INTERVALS as readonly number[]).includes(value);
}

/** Doses per day for an interval: every 8 hours is 3 doses. */
export function intervalFor(dosesPerDay: number): IntervalHours | null {
  const hours = 24 / dosesPerDay;
  return isInterval(hours) ? hours : null;
}

/** A local wall-clock time, "HH:MM" in 24-hour form. Never a bare string. */
export type ClockTime = string & { readonly __brand: 'ClockTime' };

const CLOCK = /^([01]\d|2[0-3]):([0-5]\d)$/;
export const MINUTES_PER_DAY = 24 * 60;

export function isClockTime(value: string): value is ClockTime {
  return CLOCK.test(value);
}

export function parseClock(value: string): ClockTime | null {
  return isClockTime(value) ? value : null;
}

export function toMinutes(time: ClockTime): number {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

export function fromMinutes(total: number): ClockTime {
  const wrapped = ((Math.round(total) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(wrapped / 60))}:${pad(wrapped % 60)}` as ClockTime;
}

export const DEFAULT_FIRST_DOSE = '07:00' as ClockTime;

/** One dose in a day: its order from the first dose, and its clock time. */
export interface DoseTime {
  index: number;
  time: ClockTime;
  /** True when the dose falls after midnight, on the next calendar day. */
  nextDay: boolean;
}

/** Every 8 hours from 07:00 gives 07:00, 15:00 and 23:00. */
export function doseTimes(every: IntervalHours, firstDose: ClockTime): DoseTime[] {
  const start = toMinutes(firstDose);
  return Array.from({ length: 24 / every }, (_, index) => {
    const total = start + index * every * 60;
    return { index, time: fromMinutes(total), nextDay: total >= MINUTES_PER_DAY };
  });
}

/** "07:00" as the locale writes it: "07.00" in Indonesian. */
export function formatClock(time: ClockTime, locale = 'en-US'): string {
  return locale === 'id-ID' ? time.replace(':', '.') : time;
}

/** Rough part of the day, only to pick a sun or moon icon for a clock time. */
export type DayPart = 'morning' | 'noon' | 'evening' | 'bedtime';

export function dayPartOf(time: ClockTime): DayPart {
  const hour = Math.floor(toMinutes(time) / 60);
  if (hour >= 4 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 15) return 'noon';
  if (hour >= 15 && hour < 20) return 'evening';
  return 'bedtime';
}

/** Old catalog hints ("take at bedtime") as a clock time for the first dose. */
export const DAY_PART_CLOCK: Record<DayPart, ClockTime> = {
  morning: '07:00' as ClockTime,
  noon: '12:00' as ClockTime,
  evening: '19:00' as ClockTime,
  bedtime: '21:00' as ClockTime,
};
export const DAY_PARTS = ['morning', 'noon', 'evening', 'bedtime'] as const satisfies DayPart[];

export interface Interval {
  every: IntervalHours;
  firstDose: ClockTime;
}

/**
 * Old day-part schedules as an even interval: "morning and evening" becomes every 12 hours,
 * starting at the earliest named part. Null when the count does not divide the day.
 */
export function intervalFromDayParts(parts: readonly DayPart[]): Interval | null {
  const every = parts.length > 0 ? intervalFor(parts.length) : null;
  const first = DAY_PARTS.find((part) => parts.includes(part));
  return every && first ? { every, firstDose: DAY_PART_CLOCK[first] } : null;
}

export const FOOD_RULES = ['before', 'with_after', 'any'] as const;
export type FoodRule = (typeof FOOD_RULES)[number];

export const DOSE_FORMS = ['tablet', 'capsule', 'mL', 'puff', 'drop'] as const;
export type DoseForm = (typeof DOSE_FORMS)[number];

export const DOSE_UNITS = ['mg', 'mcg'] as const;
export type DoseUnit = (typeof DOSE_UNITS)[number];

/** Sediaan: the big-picture form the patient recognises on the shelf. */
export const PREPARATIONS = ['tablet', 'capsule', 'syrup', 'suspension'] as const;
export type Preparation = (typeof PREPARATIONS)[number];

export function isLiquid(preparation: Preparation): boolean {
  return preparation === 'syrup' || preparation === 'suspension';
}

/** A sensible sediaan for a dose form; liquids default to syrup. */
export function preparationFor(form: DoseForm): Preparation {
  if (form === 'capsule') return 'capsule';
  if (form === 'mL') return 'syrup';
  return 'tablet';
}

/** How far the amount stepper moves for each form. Capsules cannot be split. */
export function amountStep(form: DoseForm): number {
  return form === 'tablet' || form === 'mL' ? 0.5 : 1;
}
