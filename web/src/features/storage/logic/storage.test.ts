import { beforeEach, describe, expect, it } from 'vitest';
import { buildExamplePlan, emptyPlan } from '@/features/medicines';
import { en } from '@/shared/i18n';
import { testCatalog } from '@/test/catalog';
import { exportFileName, importPlan } from './file';
import {
  clearSavedPlan,
  loadPlan,
  PLAN_KEY,
  readRemember,
  savePlan,
  writeRemember,
} from './persist';
import { serializePlan } from './schema';

let n = 0;
const example = () => buildExamplePlan(testCatalog, '2026-11-02', () => `id${n++}`, en, 'en');
const now = new Date('2026-11-02T10:00:00Z');

describe('browser storage', () => {
  beforeEach(() => window.localStorage.clear());

  it('reports empty storage', () => {
    expect(loadPlan(window.localStorage)).toEqual({ status: 'empty' });
  });

  it('round-trips a plan', () => {
    const plan = example();
    expect(savePlan(window.localStorage, plan, now)).toBe(true);
    expect(loadPlan(window.localStorage)).toEqual({ status: 'restored', plan });
  });

  it('rejects broken or tampered data instead of crashing', () => {
    window.localStorage.setItem(PLAN_KEY, '{not json');
    expect(loadPlan(window.localStorage).status).toBe('invalid');

    const tampered = JSON.parse(serializePlan(example(), now)) as {
      plan: { medicines: { firstDose: string }[] };
    };
    tampered.plan.medicines[0]!.firstDose = '25:00';
    window.localStorage.setItem(PLAN_KEY, JSON.stringify(tampered));
    expect(loadPlan(window.localStorage).status).toBe('invalid');
  });

  it('moves an old day-part plan onto even intervals', () => {
    const base = example().medicines[0]!;
    const rest: Record<string, unknown> = { ...base };
    delete rest.every;
    delete rest.firstDose;
    delete rest.preparation;
    const v1 = {
      app: 'pillplan',
      version: 1,
      savedAt: now.toISOString(),
      plan: {
        patientName: 'A',
        tracker: { start: '2026-11-02', popped: ['d0-morning'] },
        medicines: [
          {
            ...rest,
            times: ['morning', 'noon', 'evening'],
            pill: { shape: 'capsule', color: '#FFFFFF' },
          },
        ],
      },
    };
    window.localStorage.setItem(PLAN_KEY, JSON.stringify(v1));
    const result = loadPlan(window.localStorage);
    expect(result.status).toBe('restored');
    if (result.status !== 'restored') return;
    expect(result.plan.medicines[0]).toMatchObject({
      every: 8,
      firstDose: '07:00',
      preparation: 'capsule',
    });
    expect(result.plan.tracker.popped).toEqual([]);
  });

  it('works without storage', () => {
    expect(loadPlan(null).status).toBe('unavailable');
    expect(savePlan(null, emptyPlan('2026-11-02'), now)).toBe(false);
  });

  it('clears the saved plan', () => {
    savePlan(window.localStorage, example(), now);
    clearSavedPlan(window.localStorage);
    expect(loadPlan(window.localStorage).status).toBe('empty');
  });

  it('remembers by default and can be turned off', () => {
    expect(readRemember(window.localStorage)).toBe(true);
    writeRemember(window.localStorage, false);
    expect(readRemember(window.localStorage)).toBe(false);
  });
});

describe('files', () => {
  it('imports what it exports', () => {
    const plan = example();
    const result = importPlan(serializePlan(plan, now));
    expect(result).toEqual({ ok: true, plan });
  });

  it('refuses files that are not PillPlan charts', () => {
    expect(importPlan('hello')).toEqual({ ok: false });
    expect(importPlan(JSON.stringify({ app: 'other', version: 1 }))).toEqual({ ok: false });
  });

  it('drops unknown fields', () => {
    const data = JSON.parse(serializePlan(example(), now)) as Record<string, unknown>;
    data.extra = 'x';
    const result = importPlan(JSON.stringify(data));
    expect(result.ok).toBe(true);
  });

  it('keeps the patient name out of the file name', () => {
    expect(exportFileName(now)).toBe('pillplan-2026-11-02.json');
  });
});
