import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { flushSync } from 'react-dom';
import { useCatalog } from '@/features/catalog';
import { displayAdvice, displayStrength, medicineWarnings, usePlan } from '@/features/medicines';
import { isLiquid } from '@/shared/domain/time';
import { formatDose } from '@/shared/format/dose';
import { local, useI18n } from '@/shared/i18n';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';
import { Sticker } from '@/shared/ui/Sticker';
import { DoseClock } from '@/shared/ui/DoseClock';
import { useModalDialog } from '@/shared/ui/useModalDialog';
import { FormModel } from './FormModel';
import styles from './CounselingMode.module.css';

interface CounselingModeProps {
  onClose: () => void;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/** Full screen, one medicine at a time, for explaining the plan to a patient. */
export function CounselingMode({ onClose }: CounselingModeProps) {
  const { plan } = usePlan();
  const catalog = useCatalog();
  const { t, lang } = useI18n();
  const ref = useModalDialog(true, onClose);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [index, setIndex] = useState(0);
  const total = plan.medicines.length;
  const medicine = plan.medicines[Math.min(index, total - 1)];

  useEffect(() => {
    headingRef.current?.focus();
  }, [index]);

  if (!medicine) return null;
  const isLast = index >= total - 1;

  /** Slide the page left or right; the browser animates it when it can. */
  const go = (step: number) => {
    const next = Math.min(total - 1, Math.max(0, index + step));
    if (next === index) return;
    const update = () => setIndex(next);
    if (typeof document.startViewTransition !== 'function' || prefersReducedMotion()) {
      update();
      return;
    }
    document.documentElement.dataset.counselDirection = step > 0 ? 'next' : 'back';
    document.startViewTransition(() => flushSync(update));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === 'ArrowRight') go(1);
    if (event.key === 'ArrowLeft') go(-1);
  };

  const dose = formatDose(medicine.amount, medicine.form, t);
  const warnings = medicineWarnings(medicine, catalog);
  const advice = displayAdvice(medicine, catalog, lang);

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-label={t.counsel.title}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.frame}>
        <div className={styles.top}>
          <p className={styles.progress} aria-live="polite">
            {t.counsel.progress(index + 1, total)}
          </p>
          <div className={styles.dots} aria-hidden="true">
            {plan.medicines.map((m, i) => (
              <span key={m.id} className={styles.dot} data-current={i === index ? '' : undefined} />
            ))}
          </div>
          <Button variant="quiet" icon="close" onClick={onClose}>
            {t.counsel.close}
          </Button>
        </div>

        <div className={styles.body} style={{ viewTransitionName: 'counsel-body' }}>
          <div className={styles.title}>
            <FormModel preparation={medicine.preparation} size={160} />
            <h2 ref={headingRef} tabIndex={-1}>
              {medicine.name}
              <span className={styles.strength}>{displayStrength(medicine, t.locale)}</span>
            </h2>
          </div>

          {medicine.purpose && (
            <div>
              <p className={styles.label}>{t.counsel.whatFor}</p>
              <p>{medicine.purpose}</p>
            </div>
          )}

          <div>
            <p className={styles.label}>{t.counsel.when}</p>
            {medicine.prn ? (
              <p className={styles.time}>
                <Icon name="prn" size={24} />
                {t.chart.prnLine(dose, medicine.prnMaxPerDay)}
              </p>
            ) : (
              <div className={styles.when}>
                <DoseClock every={medicine.every} firstDose={medicine.firstDose} size={220} />
                <p className={styles.time}>{dose}</p>
              </div>
            )}
          </div>

          <div>
            <p className={styles.label}>{t.counsel.how}</p>
            <p>{t.foodLong[medicine.food]}</p>
            {isLiquid(medicine.preparation) && <p>{t.preparation.note[medicine.preparation]}</p>}
          </div>

          {warnings.length > 0 && (
            <div>
              <p className={styles.label}>{t.counsel.warnings}</p>
              <ul className={styles.stickers}>
                {warnings.map((warning) => (
                  <li key={warning.id}>
                    <Sticker tone={warning.sticker} icon={warning.icon} large>
                      {local(warning.text, lang)}
                    </Sticker>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {advice && (
            <div>
              <p className={styles.label}>{t.counsel.note}</p>
              <p>{advice}</p>
            </div>
          )}
        </div>

        <div className={styles.nav}>
          <Button icon="back" disabled={index === 0} onClick={() => go(-1)}>
            {t.counsel.back}
          </Button>
          {isLast ? (
            <Button variant="primary" icon="check" onClick={onClose}>
              {t.counsel.done}
            </Button>
          ) : (
            <Button variant="primary" onClick={() => go(1)}>
              {t.counsel.next}
              <Icon name="next" />
            </Button>
          )}
        </div>
      </div>
    </dialog>
  );
}
