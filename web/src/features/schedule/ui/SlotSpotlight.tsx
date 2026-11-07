import { dayPartOf, formatClock, type ClockTime } from '@/shared/domain/time';
import { useI18n } from '@/shared/i18n';
import { Icon } from '@/shared/ui/Icon';
import { Tooltip } from '@/shared/ui/Tooltip';
import styles from './SlotSpotlight.module.css';

interface SlotSpotlightProps {
  times: readonly ClockTime[];
  counts: Partial<Record<ClockTime, number>>;
  selected: ClockTime | null;
  onSelect: (time: ClockTime | null) => void;
}

/** Day ribbon: how many medicines at each clock time, and a toggle to highlight that column. */
export function SlotSpotlight({ times, counts, selected, onSelect }: SlotSpotlightProps) {
  const { t } = useI18n();
  const most = Math.max(1, ...times.map((time) => counts[time] ?? 0));
  return (
    <div className={`${styles.ribbon} no-print`} role="group" aria-label={t.chart.spotlightLabel}>
      {times.map((time) => {
        const label = formatClock(time, t.locale);
        const count = counts[time] ?? 0;
        return (
          <Tooltip key={time} text={t.chart.spotlightHint(label)} block>
            <button
              type="button"
              className={styles.slot}
              aria-pressed={selected === time}
              onClick={() => onSelect(selected === time ? null : time)}
            >
              <span className={styles.top}>
                <Icon name={dayPartOf(time)} size={18} />
                <span className={styles.clock}>{label}</span>
                <span className={styles.count} aria-label={t.chart.medicinesAt(count)}>
                  {count}
                </span>
              </span>
              <svg
                className={styles.bar}
                viewBox="0 0 100 8"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <rect width="100" height="4" fill="#e6e6e4" />
                <rect
                  className={styles.fill}
                  width="100"
                  height="4"
                  fill="var(--amber)"
                  style={{ transform: `scaleX(${count / most})` }}
                />
              </svg>
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
}
