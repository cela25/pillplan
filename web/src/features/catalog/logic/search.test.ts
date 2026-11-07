import type { ClockTime } from '@/shared/domain/time';
import { describe, expect, it } from 'vitest';
import { testCatalog } from '@/test/catalog';
import type { MyDrug } from '../model';
import { normalize, searchDrugs } from './search';

const ids = (query: string) => searchDrugs(testCatalog.drugs, query).map((hit) => hit.drug.id);

describe('searchDrugs', () => {
  it('finds a drug by the start of its generic name', () => {
    expect(ids('metf')).toEqual(['metformin']);
  });

  it('finds a drug by brand name and reports the brand', () => {
    const [hit] = searchDrugs(testCatalog.drugs, 'lipit');
    expect(hit?.drug.id).toBe('atorvastatin');
    expect(hit?.matched).toBe('Lipitor');
  });

  it('finds Indonesian spellings', () => {
    expect(ids('parasetamol')[0]).toBe('paracetamol');
    expect(ids('amoksisilin')).toEqual(['amoxicillin']);
    expect(ids('ctm')).toContain('chlorphenamine');
  });

  it('matches words inside the name, such as acetaminophen', () => {
    expect(ids('acetamin')).toContain('paracetamol');
  });

  it('ignores case, spaces and accents', () => {
    expect(normalize('  Paracétamol ')).toBe('paracetamol');
    expect(ids('SIMVA')).toEqual(['simvastatin']);
  });

  it('lists the apoteker own drugs first', () => {
    const mine: MyDrug = {
      id: 'my1',
      name: 'Metformin XR racikan',
      strength: '750 mg',
      form: 'tablet',
      every: 24,
      firstDose: '19:00' as ClockTime,
      preparation: 'tablet',
      prn: false,
      prnMaxPerDay: null,
      food: 'with_after',
      warnings: [],
      advice: '',
    };
    const hits = searchDrugs(testCatalog.drugs, 'metf', 8, [mine]);
    expect(hits.map((hit) => hit.kind)).toEqual(['mine', 'drug']);
  });

  it('returns nothing for an empty query', () => {
    expect(ids('   ')).toEqual([]);
  });
});
