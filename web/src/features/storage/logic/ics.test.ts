import { describe, expect, it } from 'vitest';
import { buildExamplePlan, emptyPlan } from '@/features/medicines';
import { en, id } from '@/shared/i18n';
import { testCatalog } from '@/test/catalog';
import { isClockTime } from '@/shared/domain/time';
import { buildIcs } from './ics';

let n = 0;
const now = new Date('2026-11-02T10:00:00Z');
const plan = () => buildExamplePlan(testCatalog, '2026-11-02', () => `id${n++}`, en, 'en');

describe('buildIcs', () => {
  it('makes one daily event with an alarm per dose time in use', () => {
    const ics = buildIcs(plan(), en, now) ?? '';
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(5);
    expect(ics).toContain('DTSTART:20261102T070000');
    expect(ics).toContain('DTSTART:20261102T210000');
    expect(ics).toContain('DTSTART:20261102T230000');
    expect(ics).toContain('RRULE:FREQ=DAILY;COUNT=30');
    expect(ics).toContain('BEGIN:VALARM');
    expect(ics).toContain('SUMMARY:Medicines: 07:00');
    expect(ics.endsWith('\r\n')).toBe(true);
  });

  it('leaves out when-needed medicines', () => {
    expect(buildIcs(plan(), en, now)).not.toContain('Paracetamol');
  });

  it('writes Indonesian text and keeps lines short', () => {
    const ics = buildIcs(plan(), id, now) ?? '';
    expect(ics).toContain('SUMMARY:Obat: 07.00');
    for (const line of ics.split('\r\n')) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
  });

  it('escapes commas and semicolons', () => {
    const base = plan();
    const first = base.medicines[0];
    if (!first) throw new Error('example plan is empty');
    const tricky = { ...base, medicines: [{ ...first, name: 'A, B; C' }] };
    expect(buildIcs(tricky, en, now)).toContain('A\\, B\\; C');
  });

  it('returns null when there is nothing on a fixed time', () => {
    expect(buildIcs(emptyPlan('2026-11-02'), en, now)).toBeNull();
  });

  it('checks clock times', () => {
    expect(isClockTime('07:30')).toBe(true);
    expect(isClockTime('24:00')).toBe(false);
    expect(isClockTime('7:30')).toBe(false);
  });
});
