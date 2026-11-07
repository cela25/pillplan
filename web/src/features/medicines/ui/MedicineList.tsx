import { lazy, Suspense } from 'react';
import { useI18n } from '@/shared/i18n';
import { MedicineRow, type MedicineListProps } from './MedicineRow';
import styles from './MedicineList.module.css';

/** The drag-and-drop library is loaded after the first paint to keep startup light. */
const SortableMedicineList = lazy(() => import('./SortableMedicineList'));

export function MedicineList(props: MedicineListProps) {
  const { t } = useI18n();
  const { medicines, onEdit, onRemove } = props;
  return (
    <section aria-labelledby="medicine-list-heading">
      <h2 id="medicine-list-heading" className={styles.heading}>
        {t.list.heading} ({medicines.length})
      </h2>
      {medicines.length === 0 ? (
        <p className={styles.empty}>{t.list.empty}</p>
      ) : (
        <Suspense
          fallback={
            <ol className={styles.list}>
              {medicines.map((medicine) => (
                <MedicineRow
                  key={medicine.id}
                  medicine={medicine}
                  onEdit={onEdit}
                  onRemove={onRemove}
                />
              ))}
            </ol>
          }
        >
          <SortableMedicineList {...props} />
        </Suspense>
      )}
    </section>
  );
}
