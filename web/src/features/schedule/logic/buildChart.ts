import { medicineDoseTimes, type Medicine } from '@/features/medicines';
import { toMinutes, type ClockTime } from '@/shared/domain/time';
import { formatAmount, formName } from '@/shared/format/dose';
import type { Strings } from '@/shared/i18n';

export interface ChartCell {
  amount: string;
  formName: string;
}

export interface ChartRow {
  medicine: Medicine;
  /** Dose at each chart column; a missing key means no dose at that time. */
  cells: Partial<Record<ClockTime, ChartCell>>;
}

export interface Chart {
  rows: ChartRow[];
  whenNeeded: Medicine[];
  /** Every clock time with at least one dose, earliest first. These are the columns. */
  times: ClockTime[];
  /** Medicines due at each clock time. */
  counts: Partial<Record<ClockTime, number>>;
}

/** One row per medicine, one column per clock time that any medicine is due. */
export function buildChart(medicines: readonly Medicine[], t: Strings): Chart {
  const counts: Partial<Record<ClockTime, number>> = {};
  const rows: ChartRow[] = [];
  const whenNeeded: Medicine[] = [];

  for (const medicine of medicines) {
    if (medicine.prn) {
      whenNeeded.push(medicine);
      continue;
    }
    const cell: ChartCell = {
      amount: formatAmount(medicine.amount, medicine.form, t.locale),
      formName: formName(medicine.amount, medicine.form, t),
    };
    const cells: ChartRow['cells'] = {};
    for (const { time } of medicineDoseTimes(medicine)) {
      cells[time] = cell;
      counts[time] = (counts[time] ?? 0) + 1;
    }
    rows.push({ medicine, cells });
  }

  const times = (Object.keys(counts) as ClockTime[]).sort((a, b) => toMinutes(a) - toMinutes(b));
  return { rows, whenNeeded, times, counts };
}
