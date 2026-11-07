import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { useCatalog } from '@/features/catalog';
import {
  amountStep,
  DOSE_FORMS,
  doseTimes,
  FOOD_RULES,
  formatClock,
  INTERVALS,
  isClockTime,
  isLiquid,
  PREPARATIONS,
  type IntervalHours,
  type Preparation,
} from '@/shared/domain/time';
import { formatDose, formatStrength, formName } from '@/shared/format/dose';
import { local, useI18n } from '@/shared/i18n';
import { Button } from '@/shared/ui/Button';
import { DoseClock } from '@/shared/ui/DoseClock';
import {
  ChoiceGroup,
  MultiChoiceGroup,
  Stepper,
  Switch,
  TextArea,
  TextField,
} from '@/shared/ui/Field';
import { Icon, isIconName } from '@/shared/ui/Icon';
import { applySigna } from '../logic/applySigna';
import { displayStrength } from '../logic/display';
import { DEFAULT_PRN_MAX, withStrength } from '../logic/fromDrug';
import { isEmptySigna, parseSigna } from '../logic/signa';
import { validateMedicine, type MedicineErrors } from '../logic/validate';
import type { Medicine } from '../model';
import { PreparationIcon } from './PreparationIcon';
import styles from './MedicineForm.module.css';

type When = `${IntervalHours}` | 'prn';

interface MedicineFormProps {
  initial: Medicine;
  mode: 'add' | 'edit';
  onSubmit: (medicine: Medicine, remember: boolean) => void;
  onCancel: () => void;
}

/**
 * Signa first: the apoteker types the prescription signa and the times, amount and food
 * fill in. Rarely changed fields sit in a "More details" section.
 */
export function MedicineForm({ initial, mode, onSubmit, onCancel }: MedicineFormProps) {
  const catalog = useCatalog();
  const { t, lang } = useI18n();
  const formRef = useRef<HTMLFormElement>(null);
  const signaRef = useRef<HTMLInputElement>(null);
  const signaId = useId();
  const [medicine, setMedicine] = useState(initial);
  const [signa, setSigna] = useState(initial.signa ?? '');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<MedicineErrors>({});
  const drug = medicine.drugId ? catalog?.drugById.get(medicine.drugId) : undefined;
  const set = (patch: Partial<Medicine>) => setMedicine((current) => ({ ...current, ...patch }));

  useEffect(() => {
    if (initial.drugId !== null || initial.name) signaRef.current?.focus();
  }, [initial.drugId, initial.name]);

  const parsed = parseSigna(signa, drug?.defaultTimes ?? []);
  const understood = signa.trim() !== '' && !isEmptySigna(parsed);

  const changeSigna = (text: string) => {
    setSigna(text);
    const result = parseSigna(text, drug?.defaultTimes ?? []);
    setMedicine((current) =>
      isEmptySigna(result) ? { ...current, signa: text } : applySigna(current, text, result),
    );
  };

  const strengthIndex = drug
    ? Math.max(
        0,
        drug.strengths.findIndex(
          (s) =>
            s.length === medicine.ingredientAmounts.length &&
            s.every((a, i) => a === medicine.ingredientAmounts[i]),
        ),
      )
    : 0;

  const when: When = medicine.prn ? 'prn' : `${medicine.every}`;
  const changeWhen = (next: When) => {
    if (next === 'prn') {
      set({ prn: true, prnMaxPerDay: medicine.prnMaxPerDay ?? DEFAULT_PRN_MAX });
    } else {
      set({ prn: false, every: Number(next) as IntervalHours });
    }
  };

  // While a typed time is incomplete it lives in `clockDraft`; the clock dial keeps the last valid one.
  const [clockDraft, setClockDraft] = useState<string | null>(null);
  const changeClockText = (text: string) => {
    if (isClockTime(text)) {
      setClockDraft(null);
      set({ firstDose: text });
    } else {
      setClockDraft(text);
    }
  };

  /** Picking a liquid for a custom medicine switches the unit to mL, and back. */
  const changePreparation = (preparation: Preparation) => {
    if (medicine.drugId !== null) return set({ preparation });
    const form = isLiquid(preparation) ? 'mL' : preparation === 'capsule' ? 'capsule' : 'tablet';
    set({
      preparation,
      form,
      amount: form === 'mL' && medicine.form !== 'mL' ? 5 : medicine.amount,
    });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const found = validateMedicine(medicine, t);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      window.setTimeout(() => {
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      });
      return;
    }
    onSubmit(
      {
        ...medicine,
        name: medicine.name.trim(),
        purpose: medicine.purpose.trim(),
        signa: signa.trim() || undefined,
      },
      remember,
    );
  };

  const dose = formatDose(medicine.amount, medicine.form, t);
  const preview = medicine.prn
    ? t.signa.previewPrn(dose, medicine.prnMaxPerDay)
    : t.signa.preview(
        t.interval.every(medicine.every),
        doseTimes(medicine.every, medicine.firstDose)
          .map(({ time }) => formatClock(time, t.locale))
          .join(', '),
        dose,
        medicine.food === 'any' ? null : t.food[medicine.food],
      );
  const strength = displayStrength(medicine, t.locale);
  const heading =
    mode === 'edit'
      ? t.form.editHeading(medicine.name)
      : initial.name
        ? t.form.addHeading(medicine.name)
        : t.myDrugs.ownHeading;

  return (
    <form ref={formRef} className={styles.form} onSubmit={submit} noValidate aria-label={heading}>
      <h3 className={styles.title}>
        <PreparationIcon preparation={medicine.preparation} />
        <span>
          {heading}
          {strength && <span className={styles.strength}> {strength}</span>}
        </span>
      </h3>
      {!medicine.drugId && <p className={styles.unchecked}>{t.search.customNote}</p>}

      <div className={styles.signa}>
        <label className={styles.signaLabel} htmlFor={signaId}>
          {t.signa.label}
        </label>
        <input
          ref={signaRef}
          id={signaId}
          className={styles.signaInput}
          type="text"
          autoComplete="off"
          spellCheck={false}
          placeholder={t.signa.placeholder}
          aria-describedby={`${signaId}-preview`}
          value={signa}
          onChange={(event) => changeSigna(event.target.value)}
        />
        <p
          id={`${signaId}-preview`}
          className={styles.preview}
          aria-live="polite"
          data-ok={understood || undefined}
        >
          {understood || !signa.trim() ? (
            <>
              {understood && <Icon name="check" size={16} />}
              {signa.trim() ? preview : t.signa.hint}
            </>
          ) : (
            t.signa.hint
          )}
        </p>
        {parsed.unknown.length > 0 && (
          <p className={styles.check} role="status">
            <Icon name="alert" size={16} />
            {t.signa.check(parsed.unknown)}
          </p>
        )}
      </div>

      {!medicine.drugId && (
        <div className={styles.row}>
          <TextField
            label={t.form.name}
            autoFocus={!initial.name}
            value={medicine.name}
            error={errors.name}
            onChange={(event) => set({ name: event.target.value })}
          />
          <TextField
            label={t.form.strength}
            hint={t.form.strengthCustomHint}
            value={medicine.strength}
            onChange={(event) => set({ strength: event.target.value })}
          />
        </div>
      )}

      {drug && drug.strengths.length > 1 && (
        <ChoiceGroup
          legend={t.form.strength}
          value={String(strengthIndex)}
          choices={drug.strengths.map((s, index) => ({
            value: String(index),
            label: formatStrength(s, drug.unit, t.locale),
          }))}
          onChange={(value) => setMedicine((current) => withStrength(current, drug, Number(value)))}
        />
      )}

      {!medicine.drugId && (
        <ChoiceGroup
          legend={t.preparation.legend}
          value={medicine.preparation}
          choices={PREPARATIONS.map((preparation) => ({
            value: preparation,
            label: t.preparation.names[preparation],
            icon: <PreparationIcon preparation={preparation} size={22} />,
          }))}
          onChange={changePreparation}
        />
      )}

      {!medicine.drugId && (
        <ChoiceGroup
          legend={t.form.form}
          value={medicine.form}
          choices={DOSE_FORMS.map((form) => ({ value: form, label: t.form.forms[form] }))}
          onChange={(form) => set({ form })}
        />
      )}

      <ChoiceGroup
        legend={t.form.when}
        hint={medicine.prn ? t.form.whenNeededHint : undefined}
        error={errors.times}
        value={when}
        choices={[
          ...INTERVALS.map((hours) => ({
            value: `${hours}` as const,
            label: t.interval.choice(hours),
          })),
          { value: 'prn' as const, label: t.whenNeeded, icon: <Icon name="prn" /> },
        ]}
        onChange={changeWhen}
      />

      {!medicine.prn && (
        <div className={styles.schedule}>
          <DoseClock
            every={medicine.every}
            firstDose={medicine.firstDose}
            onChange={(firstDose) => {
              setClockDraft(null);
              set({ firstDose });
            }}
            size={200}
          />
          <TextField
            label={t.form.firstDose}
            hint={t.form.firstDoseHint}
            type="time"
            step={900}
            value={clockDraft ?? medicine.firstDose}
            error={errors.firstDose}
            onChange={(event) => changeClockText(event.target.value)}
          />
        </div>
      )}

      <div className={styles.row}>
        <Stepper
          label={t.form.amount}
          value={medicine.amount}
          step={amountStep(medicine.form)}
          min={amountStep(medicine.form)}
          max={20}
          lessLabel={t.form.less}
          moreLabel={t.form.more}
          unit={formName(medicine.amount, medicine.form, t)}
          error={errors.amount}
          onChange={(amount) => set({ amount })}
        />
        {medicine.prn && (
          <Stepper
            label={t.form.maxPerDay}
            value={medicine.prnMaxPerDay ?? DEFAULT_PRN_MAX}
            step={1}
            min={1}
            max={24}
            lessLabel={t.form.less}
            moreLabel={t.form.more}
            unit={t.form.timesUnit}
            error={errors.maxPerDay}
            onChange={(prnMaxPerDay) => set({ prnMaxPerDay })}
          />
        )}
      </div>

      <ChoiceGroup
        legend={t.form.food}
        value={medicine.food}
        choices={FOOD_RULES.map((rule) => ({ value: rule, label: t.food[rule] }))}
        onChange={(food) => set({ food })}
      />

      <details className={styles.more}>
        <summary>
          <Icon name="chevron" size={18} className={styles.moreChevron} />
          <span className={styles.moreTitle}>{t.form.moreDetails}</span>
          <span className={styles.moreHint}>{t.form.moreDetailsHint}</span>
        </summary>
        <div className={styles.moreBody}>
          {catalog && (
            <MultiChoiceGroup
              legend={t.form.warnings}
              value={medicine.warnings}
              choices={catalog.warnings.map((warning) => ({
                value: warning.id,
                label: local(warning.short, lang),
                icon: isIconName(warning.icon) ? <Icon name={warning.icon} /> : undefined,
              }))}
              onChange={(warnings) => set({ warnings })}
            />
          )}
          <TextField
            label={t.form.purpose}
            hint={t.form.purposeHint}
            value={medicine.purpose}
            maxLength={120}
            onChange={(event) => set({ purpose: event.target.value })}
          />
          <TextArea
            label={t.form.advice}
            value={medicine.advice}
            maxLength={400}
            rows={2}
            onChange={(event) => set({ advice: event.target.value })}
          />
        </div>
      </details>

      {!medicine.drugId && mode === 'add' && (
        <Switch label={t.myDrugs.remember} checked={remember} onChange={setRemember} />
      )}

      <div className={styles.actions}>
        <Button type="submit" variant="primary" icon={mode === 'add' ? 'plus' : 'check'}>
          {mode === 'add' ? t.form.add : t.form.save}
        </Button>
        <Button onClick={onCancel}>{t.form.cancel}</Button>
      </div>
    </form>
  );
}
