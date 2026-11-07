import type { ClockTime } from '@/shared/domain/time';
import { describe, expect, it } from 'vitest';
import { customMedicine, medicineFromDrug, type Medicine } from '@/features/medicines';
import { en, id } from '@/shared/i18n';
import { testCatalog } from '@/test/catalog';
import { runSafetyChecks } from './checks';

let next = 0;
function med(drugId: string, patch: Partial<Medicine> = {}, strengthIndex = 0): Medicine {
  const drug = testCatalog.drugById.get(drugId);
  if (!drug) throw new Error(`missing ${drugId}`);
  return { ...medicineFromDrug(drug, strengthIndex, `id${next++}`, 'en'), ...patch };
}
const kinds = (medicines: Medicine[]) =>
  runSafetyChecks(medicines, testCatalog, en, 'en').map((n) => n.kind);

describe('runSafetyChecks', () => {
  it('finds nothing for the example patient', () => {
    expect(
      kinds([
        med('metformin'),
        med('amlodipine', {}, 1),
        med('simvastatin', {}, 1),
        med('paracetamol', { amount: 2, prnMaxPerDay: 4 }),
      ]),
    ).toEqual([]);
  });

  it('adds paracetamol across products before comparing with the maximum', () => {
    const notes = runSafetyChecks(
      [
        med('paracetamol', { amount: 2, prnMaxPerDay: 4 }),
        med('paracetamol_caffeine', { amount: 2, prnMaxPerDay: 4 }),
      ],
      testCatalog,
      en,
      'en',
    );
    expect(notes[0]).toMatchObject({
      kind: 'max-daily',
      severity: 'alert',
      title: 'Paracetamol: 8,000 mg a day',
    });
    expect(notes.map((n) => n.kind)).toContain('duplicate-ingredient');
    expect(notes.map((n) => n.kind)).not.toContain('duplicate-class');
  });

  it('does not alert at exactly the maximum', () => {
    expect(kinds([med('paracetamol', { amount: 2, prnMaxPerDay: 4 })])).toEqual([]);
  });

  it('counts fixed doses by the number of times a day', () => {
    const notes = kinds([med('metformin', { amount: 2, every: 12 }, 2)]);
    expect(notes).toEqual(['max-daily']);
  });

  it('flags two drugs from the same specific class', () => {
    expect(kinds([med('simvastatin'), med('atorvastatin')])).toEqual(['duplicate-class']);
  });

  it('does not flag aspirin with clopidogrel, which are different classes', () => {
    expect(kinds([med('aspirin_low'), med('clopidogrel')])).toEqual([]);
  });

  it('gives a timing hint when a drug is set outside its best times', () => {
    const notes = runSafetyChecks(
      [med('simvastatin', { firstDose: '07:00' as ClockTime })],
      testCatalog,
      en,
      'en',
    );
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatchObject({ kind: 'timing', detail: 'Usually taken in the evening.' });
  });

  it('marks custom medicines as not checked', () => {
    expect(kinds([customMedicine('Herbal tea', 'c1')])).toEqual(['unchecked']);
  });

  it('writes notes in Indonesian with Indonesian numbers', () => {
    const notes = runSafetyChecks(
      [
        med('paracetamol', { amount: 2, prnMaxPerDay: 4 }),
        med('paracetamol_caffeine', { amount: 2, prnMaxPerDay: 4 }),
      ],
      testCatalog,
      id,
      'id',
    );
    expect(notes[0]?.title).toBe('Paracetamol: 8.000 mg sehari');
    expect(
      runSafetyChecks([med('simvastatin'), med('atorvastatin')], testCatalog, id, 'id')[0]?.title,
    ).toBe('Dua obat atau lebih dari satu golongan: Statin');
  });

  it('puts alerts before cautions and information', () => {
    const notes = runSafetyChecks(
      [
        med('simvastatin', { firstDose: '07:00' as ClockTime }),
        med('atorvastatin'),
        med('amlodipine', { amount: 3 }, 2),
      ],
      testCatalog,
      en,
      'en',
    );
    expect(notes.map((n) => n.severity)).toEqual(['alert', 'caution', 'info']);
  });
});
