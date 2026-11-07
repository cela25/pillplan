import { useState, type CSSProperties } from 'react';
import { useCatalog, type Catalog } from '@/features/catalog';
import {
  displayAdvice,
  displayStrength,
  medicineWarnings,
  PreparationIcon,
  usePlan,
  type Medicine,
} from '@/features/medicines';
import { dayPartOf, formatClock, isLiquid, type ClockTime } from '@/shared/domain/time';
import { formatDose } from '@/shared/format/dose';
import { local, useI18n } from '@/shared/i18n';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';
import { Sticker } from '@/shared/ui/Sticker';
import { buildChart } from '../logic/buildChart';
import { formatChartDate, toIsoDate } from '../logic/tracker';
import { BlisterTracker } from './BlisterTracker';
import { SlotSpotlight } from './SlotSpotlight';
import styles from './ChartSheet.module.css';

interface ChartSheetProps {
  today: Date;
  onExample: () => void;
  /** Medicines a safety note is pointing at; they are outlined, the rest fade. */
  highlight?: readonly string[];
}

/** The patient's chart, styled as an A4 sheet. This is the only part that prints. */
export function ChartSheet({ today, onExample, highlight = [] }: ChartSheetProps) {
  const { plan } = usePlan();
  const catalog = useCatalog();
  const { t } = useI18n();
  const [spot, setSpot] = useState<ClockTime | null>(null);
  const chart = buildChart(plan.medicines, t);
  const isEmpty = plan.medicines.length === 0;
  const linked = (id: string) => (highlight.includes(id) ? '' : undefined);

  return (
    <article
      id="chart-sheet"
      className={styles.sheet}
      aria-labelledby="chart-heading"
      data-linking={highlight.length > 0 ? '' : undefined}
    >
      <header className={styles.header}>
        <h2 id="chart-heading">{t.chart.heading}</h2>
        <dl className={styles.meta}>
          <dt>{t.chart.patient}</dt>
          <dd>{plan.patientName || ' '}</dd>
          <dt>{t.chart.date}</dt>
          <dd>{formatChartDate(today, t.locale)}</dd>
        </dl>
      </header>

      {isEmpty ? (
        <div className={styles.blank}>
          <h3>{t.chart.emptyTitle}</h3>
          <p>{t.chart.emptyBody}</p>
          <Button className="no-print" icon="plus" onClick={onExample}>
            {t.app.example}
          </Button>
        </div>
      ) : (
        <>
          {chart.rows.length > 0 && (
            <>
              <SlotSpotlight
                times={chart.times}
                counts={chart.counts}
                selected={spot}
                onSelect={setSpot}
              />
              <div className={styles.tableWrap}>
                <table className={styles.chart} data-spot={spot ?? undefined}>
                  <caption className="visually-hidden">{t.chart.caption}</caption>
                  <thead>
                    <tr>
                      <th scope="col">{t.chart.medicine}</th>
                      {chart.times.map((time) => (
                        <th key={time} scope="col" data-on={spot === time ? '' : undefined}>
                          <span className={styles.slotHead}>
                            <Icon name={dayPartOf(time)} size={26} />
                            <span className={styles.slotLabel}>{formatClock(time, t.locale)}</span>
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {chart.rows.map(({ medicine, cells }, row) => (
                      <tr
                        key={medicine.id}
                        style={
                          {
                            viewTransitionName: `row-${medicine.id}`,
                            '--row': Math.min(row, 5),
                          } as CSSProperties
                        }
                        data-off={spot && !cells[spot] ? '' : undefined}
                        data-linked={linked(medicine.id)}
                      >
                        <th scope="row">
                          <MedicineCell medicine={medicine} catalog={catalog} />
                        </th>
                        {chart.times.map((time, column) => {
                          const cell = cells[time];
                          return (
                            <td key={time} data-on={spot === time ? '' : undefined}>
                              {cell ? (
                                <span
                                  className={styles.dose}
                                  style={{ '--column': column } as CSSProperties}
                                >
                                  <span className={styles.amount}>{cell.amount}</span>
                                  <span className={styles.formName}>{cell.formName}</span>
                                </span>
                              ) : (
                                <span className={styles.empty}>
                                  <span aria-hidden="true">{'·'}</span>
                                  <span className="visually-hidden">{t.chart.none}</span>
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {chart.whenNeeded.length > 0 && (
            <section className={styles.prn} aria-labelledby="prn-heading">
              <h3 id="prn-heading">
                <Icon name="prn" />
                {t.chart.whenNeededHeading}
              </h3>
              <ul>
                {chart.whenNeeded.map((medicine, row) => (
                  <li
                    key={medicine.id}
                    style={
                      {
                        viewTransitionName: `row-${medicine.id}`,
                        '--row': Math.min(chart.rows.length + row, 6),
                      } as CSSProperties
                    }
                    data-linked={linked(medicine.id)}
                  >
                    <MedicineCell medicine={medicine} catalog={catalog} />
                    <p className={styles.prnLine}>
                      {t.chart.prnLine(
                        formatDose(medicine.amount, medicine.form, t),
                        medicine.prnMaxPerDay,
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <BlisterTracker times={chart.times} today={toIsoDate(today)} />
        </>
      )}

      <footer className={styles.footer}>
        <p>{t.chart.footer}</p>
        <p>{t.app.disclaimer}</p>
      </footer>
    </article>
  );
}

function MedicineCell({ medicine, catalog }: { medicine: Medicine; catalog: Catalog | null }) {
  const { t, lang } = useI18n();
  const warnings = medicineWarnings(medicine, catalog);
  const advice = displayAdvice(medicine, catalog, lang);
  return (
    <div className={styles.medicine}>
      <PreparationIcon preparation={medicine.preparation} size={44} />
      <div>
        <p className={styles.name}>
          {medicine.name}{' '}
          <span className={styles.strength}>{displayStrength(medicine, t.locale)}</span>
        </p>
        {medicine.purpose && <p className={styles.purpose}>{medicine.purpose}</p>}
        <p className={styles.food}>
          <Icon name="food" size={16} />
          {t.food[medicine.food]}
        </p>
        {!medicine.prn && <p className={styles.every}>{t.interval.every(medicine.every)}</p>}
        {isLiquid(medicine.preparation) && (
          <p className={styles.advice}>{t.preparation.note[medicine.preparation]}</p>
        )}
        {advice && <p className={styles.advice}>{advice}</p>}
        {warnings.length > 0 && (
          <div className={styles.stickers}>
            {warnings.map((warning) => (
              <Sticker key={warning.id} tone={warning.sticker} icon={warning.icon}>
                {local(warning.short, lang)}
              </Sticker>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
