import { describe, expect, it } from 'vitest';
import { customMedicine, type Medicine } from '@/features/medicines';
import type { ClockTime } from '@/shared/domain/time';
import { en, id } from '@/shared/i18n';
import { buildChart } from './buildChart';
import { doseKey, toIsoDate, trackerDays } from './tracker';

const at = (time: string) => time as ClockTime;

const med = (id: string, patch: Partial<Medicine>): Medicine => ({
  ...customMedicine(id, id),
  ...patch,
});

describe('buildChart', () => {
  const chart = buildChart(
    [
      med('amoxicillin', { every: 8 }),
      med('simvastatin', { every: 24, firstDose: at('21:00'), amount: 0.5 }),
      med('paracetamol', { prn: true, prnMaxPerDay: 4 }),
    ],
    en,
  );

  it('puts each dose in its clock-time column, evenly spread', () => {
    const [amoxicillin, simvastatin] = chart.rows;
    expect(amoxicillin?.cells[at('07:00')]).toEqual({ amount: '1', formName: 'tablet' });
    expect(amoxicillin?.cells[at('15:00')]).toBeDefined();
    expect(amoxicillin?.cells[at('23:00')]).toBeDefined();
    expect(amoxicillin?.cells[at('21:00')]).toBeUndefined();
    expect(simvastatin?.cells[at('21:00')]).toEqual({ amount: '½', formName: 'tablet' });
  });

  it('keeps when-needed medicines out of the grid', () => {
    expect(chart.rows).toHaveLength(2);
    expect(chart.whenNeeded.map((m) => m.id)).toEqual(['paracetamol']);
  });

  it('uses the chosen language for form names', () => {
    const [row] = buildChart([med('a', { amount: 2, form: 'capsule' })], id).rows;
    expect(row?.cells[at('07:00')]).toEqual({ amount: '2', formName: 'kapsul' });
  });

  it('counts medicines per time and lists used times in day order', () => {
    expect(chart.times).toEqual(['07:00', '15:00', '21:00', '23:00']);
    expect(chart.counts[at('21:00')]).toBe(1);
  });
});

describe('tracker', () => {
  it('builds stable keys', () => {
    expect(doseKey(3, at('15:00'))).toBe('d3-1500');
  });

  it('lists seven days from the start date, across month ends', () => {
    const days = trackerDays('2026-11-29');
    expect(days).toHaveLength(7);
    expect(days[0]?.label).toBe('Sun');
    expect(days[2]?.longLabel).toBe('Tuesday, December 1');
    expect(trackerDays('2026-11-29', 'id-ID')[2]?.label).toBe('Sel');
  });

  it('formats local dates without time zone shifts', () => {
    expect(toIsoDate(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
  });
});
