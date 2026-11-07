import type { CSSProperties, ReactNode, Ref } from 'react';
import { useI18n, type Strings } from '@/shared/i18n';
import { Button } from '@/shared/ui/Button';
import { Tooltip } from '@/shared/ui/Tooltip';
import { displayStrength } from '../logic/display';
import { formatClock } from '@/shared/domain/time';
import { medicineDoseTimes, type Medicine } from '../model';
import { PreparationIcon } from './PreparationIcon';
import styles from './MedicineList.module.css';

export interface MedicineListProps {
  medicines: readonly Medicine[];
  onMove: (from: number, to: number) => void;
  onEdit: (medicine: Medicine) => void;
  onRemove: (medicine: Medicine) => void;
}

export function scheduleSummary(medicine: Medicine, t: Strings): string {
  return medicine.prn
    ? t.list.prnSummary(medicine.prnMaxPerDay)
    : `${t.interval.every(medicine.every)}: ${t.list.schedule(
        medicineDoseTimes(medicine).map(({ time }) => formatClock(time, t.locale)),
      )}`;
}

interface MedicineRowProps {
  medicine: Medicine;
  onEdit: (medicine: Medicine) => void;
  onRemove: (medicine: Medicine) => void;
  handle?: ReactNode;
  rowRef?: Ref<HTMLLIElement>;
  dragging?: boolean;
  style?: CSSProperties;
}

/** One medicine in the list: pill, name, schedule and the edit and remove buttons. */
export function MedicineRow({
  medicine,
  onEdit,
  onRemove,
  handle,
  rowRef,
  dragging,
  style,
}: MedicineRowProps) {
  const { t } = useI18n();
  return (
    <li ref={rowRef} className={`${styles.item} ${dragging ? styles.dragging : ''}`} style={style}>
      {handle ?? <span className={styles.handle} aria-hidden="true" />}
      <PreparationIcon preparation={medicine.preparation} size={36} />
      <div>
        <p className={styles.name}>
          {medicine.name} {displayStrength(medicine, t.locale)}
        </p>
        <p className={styles.summary}>{scheduleSummary(medicine, t)}</p>
        {medicine.signa && <p className={styles.signa}>{medicine.signa}</p>}
      </div>
      <div className={styles.actions}>
        <Tooltip text={t.list.editNamed(medicine.name)} role="label">
          <Button variant="quiet" icon="edit" onClick={() => onEdit(medicine)} />
        </Tooltip>
        <Tooltip text={t.list.removeNamed(medicine.name)} role="label">
          <Button variant="quiet" icon="remove" onClick={() => onRemove(medicine)} />
        </Tooltip>
      </div>
    </li>
  );
}
