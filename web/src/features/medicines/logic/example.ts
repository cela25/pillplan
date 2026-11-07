import type { Catalog } from '@/features/catalog';
import type { Lang, Strings } from '@/shared/i18n';
import type { Preparation } from '@/shared/domain/time';
import type { PlanState } from '../model';
import { medicineFromDrug } from './fromDrug';

interface ExampleItem {
  drugId: string;
  strengthIndex: number;
  preparation: Preparation;
  amount?: number;
  prnMaxPerDay?: number;
  signa: string;
}

/** A made-up patient used for demos and screenshots. */
export const EXAMPLE_ITEMS: readonly ExampleItem[] = [
  {
    drugId: 'metformin',
    signa: '2 dd 1 tab p.c.',
    strengthIndex: 0,
    preparation: 'tablet',
  },
  {
    drugId: 'amlodipine',
    signa: '1 dd 1 tab',
    strengthIndex: 1,
    preparation: 'tablet',
  },
  {
    drugId: 'amoxicillin',
    signa: '3 dd 1 caps',
    strengthIndex: 0,
    preparation: 'capsule',
  },
  {
    drugId: 'simvastatin',
    signa: '1 dd 1 tab h.s.',
    strengthIndex: 1,
    preparation: 'tablet',
  },
  {
    drugId: 'paracetamol',
    signa: '4 dd 2 tab p.r.n.',
    strengthIndex: 0,
    preparation: 'tablet',
    amount: 2,
    prnMaxPerDay: 4,
  },
];

export function buildExamplePlan(
  catalog: Catalog,
  today: string,
  newId: () => string,
  t: Strings,
  lang: Lang,
): PlanState {
  const medicines = EXAMPLE_ITEMS.flatMap((item) => {
    const drug = catalog.drugById.get(item.drugId);
    if (!drug) return [];
    const base = medicineFromDrug(drug, item.strengthIndex, newId(), lang);
    return [
      {
        ...base,
        purpose: t.example.purposes[item.drugId] ?? '',
        preparation: item.preparation,
        amount: item.amount ?? base.amount,
        prnMaxPerDay: item.prnMaxPerDay ?? base.prnMaxPerDay,
        signa: item.signa,
      },
    ];
  });
  return {
    patientName: t.example.patient,
    medicines,
    tracker: { start: today, popped: ['d0-0700'] },
  };
}
