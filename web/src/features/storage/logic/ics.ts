import { displayStrength, medicineDoseTimes, type PlanState } from '@/features/medicines';
import { formatClock, toMinutes, type ClockTime } from '@/shared/domain/time';
import { formatDose } from '@/shared/format/dose';
import type { Strings } from '@/shared/i18n';

export const REMINDER_DAYS = 30;

/** RFC 5545 text escaping. */
function escape(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** RFC 5545 lines are at most 75 octets; longer lines continue with a leading space. */
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const parts: string[] = [];
  let current = '';
  for (const char of line) {
    if (new TextEncoder().encode(current + char).length > (parts.length === 0 ? 75 : 74)) {
      parts.push(current);
      current = char;
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts.join('\r\n ');
}

const stamp = (date: Date) =>
  date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');

/** Every clock time with a scheduled dose, earliest first. */
export function reminderTimes(plan: PlanState): ClockTime[] {
  const times = new Set(plan.medicines.flatMap((m) => medicineDoseTimes(m).map((d) => d.time)));
  return [...times].sort((a, b) => toMinutes(a) - toMinutes(b));
}

/**
 * One daily repeating event per dose time, each with an alarm. The times come straight from
 * each medicine's interval, so "every 8 hours" also rings at 23:00. Floating local time.
 */
export function buildIcs(plan: PlanState, t: Strings, now: Date): string | null {
  const day = plan.tracker.start.replace(/-/g, '');
  const events = reminderTimes(plan).flatMap((time) => {
    const due = plan.medicines.filter((m) =>
      medicineDoseTimes(m).some((dose) => dose.time === time),
    );
    const compact = time.replace(':', '');
    const title = t.calendar.eventTitle(formatClock(time, t.locale));
    const lines = due.map((m) =>
      t.calendar.eventLine(
        [m.name, displayStrength(m, t.locale)].filter(Boolean).join(' '),
        formatDose(m.amount, m.form, t),
      ),
    );
    const description = [...lines, t.calendar.repeats(REMINDER_DAYS)].join('\n');
    return [
      'BEGIN:VEVENT',
      `UID:pillplan-${day}-${compact}@pillplan`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART:${day}T${compact}00`,
      'DURATION:PT15M',
      `RRULE:FREQ=DAILY;COUNT=${REMINDER_DAYS}`,
      `SUMMARY:${escape(title)}`,
      `DESCRIPTION:${escape(description)}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'TRIGGER:PT0M',
      `DESCRIPTION:${escape(title)}`,
      'END:VALARM',
      'END:VEVENT',
    ];
  });
  if (events.length === 0) return null;
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PillPlan//Medicine schedule//EN',
    'CALSCALE:GREGORIAN',
    ...events,
    'END:VCALENDAR',
  ]
    .map(fold)
    .join('\r\n')
    .concat('\r\n');
}
