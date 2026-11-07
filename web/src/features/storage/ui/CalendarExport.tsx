import { usePlan } from '@/features/medicines';
import { dayPartOf, formatClock } from '@/shared/domain/time';
import { useI18n } from '@/shared/i18n';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';
import { downloadBlob } from '../logic/file';
import { buildIcs, reminderTimes } from '../logic/ics';
import styles from './CalendarExport.module.css';

/**
 * Hands the schedule to the phone's own calendar, so no reminder app is needed.
 * The times are the dose times on the chart; change them on the medicine itself.
 */
export function CalendarExport() {
  const { plan } = usePlan();
  const { t } = useI18n();
  const times = reminderTimes(plan);

  const download = () => {
    const ics = buildIcs(plan, t, new Date());
    if (ics) downloadBlob(new Blob([ics], { type: 'text/calendar' }), 'pillplan-reminders.ics');
  };

  if (times.length === 0) return <p className={styles.hint}>{t.calendar.none}</p>;

  return (
    <div className={styles.calendar}>
      <p className={styles.hint}>{t.calendar.hint}</p>
      <ul className={styles.rows} aria-label={t.calendar.times}>
        {times.map((time) => (
          <li key={time} className={styles.row}>
            <span className={styles.summary}>
              <Icon name={dayPartOf(time)} />
              <span className={styles.time}>{formatClock(time, t.locale)}</span>
            </span>
          </li>
        ))}
      </ul>
      <Button variant="primary" icon="download" onClick={download}>
        {t.calendar.export}
      </Button>
    </div>
  );
}
