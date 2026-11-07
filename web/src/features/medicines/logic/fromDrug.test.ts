import { describe, expect, it } from 'vitest';
import { en } from '@/shared/i18n';
import { testCatalog } from '@/test/catalog';
import { medicineFromDrug, withStrength } from './fromDrug';
import { buildExamplePlan } from './example';
import { validateMedicine } from './validate';
import { medicineDoseTimes } from '../model';
import type { ClockTime } from '@/shared/domain/time';

const drug = (id: string) => {
  const found = testCatalog.drugById.get(id);
  if (!found) throw new Error(`missing ${id}`);
  return found;
};

describe('medicineFromDrug', () => {
  it('copies the catalog defaults', () => {
    const metformin = medicineFromDrug(drug('metformin'), 1, 'x', 'en');
    expect(metformin).toMatchObject({
      drugId: 'metformin',
      strength: '850 mg',
      ingredientAmounts: [850],
      every: 12,
      firstDose: '07:00',
      food: 'with_after',
      prn: false,
    });
  });

  it('sets a default limit for when-needed medicines', () => {
    const paracetamol = medicineFromDrug(drug('paracetamol'), 0, 'x', 'en');
    expect(paracetamol.prn).toBe(true);
    expect(paracetamol.prnMaxPerDay).toBe(4);
    expect(medicineDoseTimes(paracetamol)).toEqual([]);
  });

  it('labels combination strengths', () => {
    expect(medicineFromDrug(drug('paracetamol_caffeine'), 0, 'x', 'en').strength).toBe(
      '500 mg + 65 mg',
    );
  });

  it('can switch strength', () => {
    const base = medicineFromDrug(drug('levothyroxine'), 0, 'x', 'en');
    const changed = withStrength(base, drug('levothyroxine'), 3);
    expect(changed.strength).toBe('88 mcg');
    expect(changed.ingredientAmounts).toEqual([88]);
  });
});

describe('validateMedicine', () => {
  const valid = medicineFromDrug(drug('amlodipine'), 0, 'x', 'en');

  it('accepts catalog defaults', () => {
    expect(validateMedicine(valid, en)).toEqual({});
  });

  it('needs a valid first dose unless taken when needed', () => {
    const broken = { ...valid, firstDose: '7' as ClockTime };
    expect(validateMedicine(broken, en).firstDose).toBeDefined();
    expect(validateMedicine({ ...broken, prn: true, prnMaxPerDay: 3 }, en)).toEqual({});
  });

  it('needs a sensible max per day for when-needed medicines', () => {
    expect(validateMedicine({ ...valid, prn: true, prnMaxPerDay: 0 }, en).maxPerDay).toBeDefined();
    expect(
      validateMedicine({ ...valid, prn: true, prnMaxPerDay: 2.5 }, en).maxPerDay,
    ).toBeDefined();
  });

  it('needs a name and a positive amount', () => {
    expect(validateMedicine({ ...valid, name: '  ' }, en).name).toBeDefined();
    expect(validateMedicine({ ...valid, amount: 0 }, en).amount).toBeDefined();
    expect(validateMedicine({ ...valid, amount: Number.NaN }, en).amount).toBeDefined();
  });
});

describe('buildExamplePlan', () => {
  it('uses only drugs that exist in the catalog', () => {
    let next = 0;
    const plan = buildExamplePlan(testCatalog, '2026-11-02', () => `id${next++}`, en, 'en');
    expect(plan.medicines.map((m) => m.drugId)).toEqual([
      'metformin',
      'amlodipine',
      'amoxicillin',
      'simvastatin',
      'paracetamol',
    ]);
    expect(plan.medicines.every((m) => Object.keys(validateMedicine(m, en)).length === 0)).toBe(
      true,
    );
  });
});
