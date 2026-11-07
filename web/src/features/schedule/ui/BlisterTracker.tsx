import { usePlan } from '@/features/medicines';
import { dayPartOf, formatClock, type ClockTime } from '@/shared/domain/time';
import { useI18n } from '@/shared/i18n';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';
import { doseKey, trackerDays } from '../logic/tracker';
import styles from './BlisterTracker.module.css';

interface BlisterTrackerProps {
  times: readonly ClockTime[];
  today: string;
}

/** A week drawn like a blister pack: one bubble per dose time, popped when taken. */
export function BlisterTracker({ times, today }: BlisterTrackerProps) {
  const { t } = useI18n();
  const { plan, dispatch } = usePlan();
  if (times.length === 0) return null;
  const days = trackerDays(plan.tracker.start, t.locale);
  const popped = new Set(plan.tracker.popped);

  return (
    <section className={styles.tracker} aria-labelledby="tracker-heading">
      <div className={styles.head}>
        <h3 id="tracker-heading">{t.tracker.heading}</h3>
        <p className={styles.hint}>{t.tracker.hint}</p>
      </div>
      <table className={styles.pack} aria-labelledby="tracker-heading">
        <thead>
          <tr>
            <td />
            {days.map((day) => (
              <th key={day.index} scope="col" abbr={day.longLabel}>
                {day.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {times.map((time) => {
            const label = formatClock(time, t.locale);
            return (
              <tr key={time}>
                <th scope="row">
                  <span className={styles.rowLabel}>
                    <Icon name={dayPartOf(time)} size={16} />
                    <span className={styles.rowText}>{label}</span>
                  </span>
                </th>
                {days.map((day) => {
                  const key = doseKey(day.index, time);
                  const taken = popped.has(key);
                  return (
                    <td key={key}>
                      <button
                        type="button"
                        className={styles.bubble}
                        aria-pressed={taken}
                        aria-label={t.tracker.bubble(day.longLabel, label, taken)}
                        onClick={() => dispatch({ type: 'toggleDose', key })}
                      >
                        {taken && <Icon name="check" size={18} />}
                      </button>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className={`${styles.reset} no-print`}>
        <Button variant="quiet" onClick={() => dispatch({ type: 'resetTracker', start: today })}>
          {t.tracker.reset}
        </Button>
      </div>
    </section>
  );
}
