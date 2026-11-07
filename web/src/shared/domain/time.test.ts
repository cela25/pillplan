import { describe, expect, it } from 'vitest';
import { dayPartOf, doseTimes, intervalFor, intervalFromDayParts, type ClockTime } from './time';

const at = (time: string) => time as ClockTime;

describe('doseTimes', () => {
  it('spreads doses evenly from the first dose', () => {
    expect(doseTimes(8, at('07:00')).map((d) => d.time)).toEqual(['07:00', '15:00', '23:00']);
    expect(doseTimes(6, at('06:00')).map((d) => d.time)).toEqual([
      '06:00',
      '12:00',
      '18:00',
      '00:00',
    ]);
    expect(doseTimes(24, at('21:00')).map((d) => d.time)).toEqual(['21:00']);
  });

  it('wraps past midnight and marks the next day', () => {
    const doses = doseTimes(12, at('20:30'));
    expect(doses.map((d) => d.time)).toEqual(['20:30', '08:30']);
    expect(doses.map((d) => d.nextDay)).toEqual([false, true]);
  });
});

describe('intervals', () => {
  it('only allows intervals that divide the day', () => {
    expect([1, 2, 3, 4, 5, 6].map(intervalFor)).toEqual([24, 12, 8, 6, null, null]);
  });

  it('turns old day parts into an interval', () => {
    expect(intervalFromDayParts(['evening', 'morning'])).toEqual({ every: 12, firstDose: '07:00' });
    expect(intervalFromDayParts(['bedtime'])).toEqual({ every: 24, firstDose: '21:00' });
    expect(intervalFromDayParts([])).toBeNull();
  });

  it('picks a sun or moon for a clock time', () => {
    expect(dayPartOf(at('07:00'))).toBe('morning');
    expect(dayPartOf(at('23:00'))).toBe('bedtime');
  });
});
