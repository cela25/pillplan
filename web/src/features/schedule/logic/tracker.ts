import type { ClockTime } from '@/shared/domain/time';

export const TRACKER_DAYS = 7;

/** Tracker bubble for one dose time on one day of the week, like "d0-0700". */
export function doseKey(day: number, time: ClockTime): string {
  return `d${day}-${time.replace(':', '')}`;
}

/** Local calendar date as yyyy-mm-dd. */
export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export interface TrackerDay {
  index: number;
  label: string;
  longLabel: string;
}

export function trackerDays(startIso: string, locale = 'en-US'): TrackerDay[] {
  const [year, month, day] = startIso.split('-').map(Number);
  const start = new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
  return Array.from({ length: TRACKER_DAYS }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
    return {
      index,
      label: date.toLocaleDateString(locale, { weekday: 'short' }),
      longLabel: date.toLocaleDateString(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }),
    };
  });
}

export function formatChartDate(date: Date, locale = 'en-US'): string {
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
}
