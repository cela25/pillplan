import { useI18n } from '@/shared/i18n';
import { Button } from '@/shared/ui/Button';
import { useMyDrugs } from './CatalogProvider';
import styles from './MyDrugsList.module.css';

/** The drugs the apoteker typed in before. Removing one does not touch any chart. */
export function MyDrugsList() {
  const { myDrugs, forgetDrug } = useMyDrugs();
  const { t } = useI18n();
  return (
    <section className="no-print" aria-labelledby="my-drugs-heading">
      <h3 id="my-drugs-heading" className={styles.heading}>
        {t.myDrugs.heading} ({myDrugs.length})
      </h3>
      <p className={styles.hint}>{t.myDrugs.hint}</p>
      <ul className={styles.list}>
        {myDrugs.map((drug) => (
          <li key={drug.id} className={styles.item}>
            <span>
              <strong>{drug.name}</strong> {drug.strength}
            </span>
            <Button
              variant="quiet"
              icon="remove"
              aria-label={t.myDrugs.remove(drug.name)}
              onClick={() => forgetDrug(drug.id)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
