import { describe, expect, it } from 'vitest';
import { isEmptySigna, parseSigna } from './signa';

describe('parseSigna: Latin signa', () => {
  it.each([
    ['S 3 dd 1 tab p.c.', [8, '07:00'], 1, 'with_after'],
    ['3 dd 1 pc', [8, '07:00'], 1, 'with_after'],
    ['S 2 dd I a.c.', [12, '07:00'], 1, 'before'],
    ['2 dd 1/2 tab', [12, '07:00'], 0.5, null],
    ['1 dd ½ tab', [24, '07:00'], 0.5, null],
    ['4 dd 1 caps', [6, '07:00'], 1, null],
    ['1 dd 1 h.s.', [24, '21:00'], 1, null],
    ['1 dd 1 o.m. a.c.', [24, '07:00'], 1, 'before'],
    ['1 dd 1 o.n.', [24, '19:00'], 1, null],
    ['2 dd II d.c.', [12, '07:00'], 2, 'with_after'],
    ['3dd1', [8, '07:00'], 1, null],
    ['t.i.d. 1 tab', [8, '07:00'], 1, null],
    ['b.i.d.', [12, '07:00'], null, null],
    ['q.i.d. 2 tab', [6, '07:00'], 2, null],
    ['q8h 1 caps p.c.', [8, '07:00'], 1, 'with_after'],
  ] as const)('%s', (signa, [every, firstDose], amount, food) => {
    const result = parseSigna(signa);
    expect(result.interval).toEqual({ every, firstDose });
    expect(result.amount).toBe(amount);
    expect(result.food).toBe(food);
    expect(result.prn).toBe(false);
    expect(result.unknown).toEqual([]);
  });
});

describe('parseSigna: Indonesian', () => {
  it.each([
    ['3 x 1 sesudah makan', [8, '07:00'], 1, 'with_after'],
    ['2x1 sebelum makan', [12, '07:00'], 1, 'before'],
    ['3 kali sehari 1 tablet setelah makan', [8, '07:00'], 1, 'with_after'],
    ['2 x sehari 1 tablet', [12, '07:00'], 1, null],
    ['tiap 8 jam 1 tab', [8, '07:00'], 1, null],
    ['tiap 12 jam 1 kapsul', [12, '07:00'], 1, null],
    ['1 x 1 malam', [24, '19:00'], 1, null],
    ['1x1 sebelum tidur', [24, '21:00'], 1, null],
    ['pagi dan malam 1 tablet', [12, '07:00'], 1, null],
  ] as const)('%s', (signa, [every, firstDose], amount, food) => {
    const result = parseSigna(signa);
    expect(result.interval).toEqual({ every, firstDose });
    expect(result.amount).toBe(amount);
    expect(result.food).toBe(food);
    expect(result.unknown).toEqual([]);
  });
});

describe('parseSigna: when needed', () => {
  it('reads p.r.n. with an amount', () => {
    expect(parseSigna('p.r.n. 1 tab')).toMatchObject({
      prn: true,
      amount: 1,
      maxPerDay: null,
    });
  });

  it('turns a frequency into the daily limit', () => {
    expect(parseSigna('3 dd 1 prn')).toMatchObject({
      prn: true,
      maxPerDay: 3,
      amount: 1,
    });
  });

  it('understands Indonesian and s.o.s.', () => {
    expect(parseSigna('bila perlu 2 tablet').prn).toBe(true);
    expect(parseSigna('k/p 1 tab').prn).toBe(true);
    expect(parseSigna('s.o.s. 1 tab')).toMatchObject({ prn: true, amount: 1 });
  });
});

describe('parseSigna: liquids and drops', () => {
  it('converts teaspoons and tablespoons to mL', () => {
    expect(parseSigna('3 dd 1 cth')).toMatchObject({ form: 'mL', amount: 5 });
    expect(parseSigna('2 dd 1 C')).toMatchObject({ form: 'mL', amount: 15 });
  });

  it('reads drops', () => {
    expect(parseSigna('3 dd 2 gtt')).toMatchObject({ form: 'drop', amount: 2 });
  });
});

describe('parseSigna: defaults and errors', () => {
  it('keeps the drug default first dose when the count matches', () => {
    expect(parseSigna('1 dd 1', ['bedtime']).interval).toEqual({ every: 24, firstDose: '21:00' });
    expect(parseSigna('2 dd 1', ['bedtime']).interval).toEqual({ every: 12, firstDose: '07:00' });
  });

  it('spreads doses evenly instead of by meal times', () => {
    expect(parseSigna('3x1').interval).toEqual({ every: 8, firstDose: '07:00' });
    expect(parseSigna('2 dd 1 malam').interval).toEqual({ every: 12, firstDose: '19:00' });
  });

  it('reports words it does not understand', () => {
    expect(parseSigna('3 dd 1 tab p.c. xyz').unknown).toEqual(['xyz']);
  });

  it('flags more than four doses a day instead of guessing', () => {
    const result = parseSigna('tiap 4 jam 1 tab');
    expect(result.count).toBe(6);
    expect(result.interval).toBeNull();
    expect(result.unknown).toEqual(['6 x']);
  });

  it('knows when nothing is understood yet', () => {
    expect(isEmptySigna(parseSigna(''))).toBe(true);
    expect(isEmptySigna(parseSigna('3'))).toBe(true);
    expect(isEmptySigna(parseSigna('3 dd'))).toBe(false);
  });

  it('accepts a decimal comma', () => {
    expect(parseSigna('1 dd 0,5 tab').amount).toBe(0.5);
  });
});
