import { useMemo, useState } from 'react';
import { useCatalog } from '@/features/catalog';
import { usePlan } from '@/features/medicines';
import { useI18n } from '@/shared/i18n';
import { Icon, type IconName } from '@/shared/ui/Icon';
import { Tooltip } from '@/shared/ui/Tooltip';
import { runSafetyChecks } from '../logic/checks';
import type { Severity } from '../model';
import styles from './SafetyNotes.module.css';

const ICON: Record<Severity, IconName> = { alert: 'alert', caution: 'alert', info: 'info' };

interface SafetyNotesProps {
  /** Tell the chart which medicines a note is about while it is hovered or focused. */
  onHighlight?: (medicineIds: readonly string[]) => void;
}

/**
 * A slim strip above the chart: one line when collapsed, the notes when opened.
 * Notes are for the apoteker; they are never printed on the patient's chart.
 */
export function SafetyNotes({ onHighlight }: SafetyNotesProps) {
  const { plan } = usePlan();
  const catalog = useCatalog();
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const notes = useMemo(
    () => (catalog ? runSafetyChecks(plan.medicines, catalog, t, lang) : []),
    [catalog, plan.medicines, t, lang],
  );
  if (plan.medicines.length === 0) return null;

  if (notes.length === 0) {
    return (
      <div className={`${styles.strip} ${styles.ok} no-print`}>
        <Icon name="check" size={18} />
        <Tooltip text={t.safety.noneDetail} placement="below">
          <button type="button" className={styles.okButton}>
            {t.safety.okShort}
          </button>
        </Tooltip>
      </div>
    );
  }

  const worst = notes[0]?.severity ?? 'info';
  return (
    <section className={`${styles.strip} ${styles[worst]} no-print`} aria-label={t.safety.heading}>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name={ICON[worst]} size={20} />
        <span key={notes.length} className={styles.count}>
          {t.safety.count(notes.length)}
        </span>
        <Icon name="chevron" size={18} className={styles.chevron} />
      </button>
      {open && (
        <ul className={styles.list}>
          {notes.map((note) => (
            <li
              key={note.id}
              className={`${styles.note} ${styles[note.severity]}`}
              tabIndex={0}
              onMouseEnter={() => onHighlight?.(note.medicineIds)}
              onMouseLeave={() => onHighlight?.([])}
              onFocus={() => onHighlight?.(note.medicineIds)}
              onBlur={() => onHighlight?.([])}
            >
              <Icon name={ICON[note.severity]} size={18} />
              <p className={styles.title}>{note.title}</p>
              <p className={styles.detail}>{note.detail}</p>
            </li>
          ))}
          <li className={styles.footnote}>{t.safety.noneDetail}</li>
        </ul>
      )}
    </section>
  );
}
