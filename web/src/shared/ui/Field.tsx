import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';
import styles from './Field.module.css';

interface FieldFrameProps {
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  children: (ids: { inputId: string; describedBy: string | undefined }) => ReactNode;
}

function FieldFrame({ label, hint, error, children }: FieldFrameProps) {
  const inputId = useId();
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy =
    [hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ') || undefined;
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>
      {children({ inputId, describedBy })}
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
}

export function TextField({ label, hint, error, ...input }: TextFieldProps) {
  return (
    <FieldFrame label={label} hint={hint} error={error}>
      {({ inputId, describedBy }) => (
        <input
          id={inputId}
          className={styles.input}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          {...input}
        />
      )}
    </FieldFrame>
  );
}

interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string;
  hint?: string | undefined;
}

export function TextArea({ label, hint, ...textarea }: TextAreaProps) {
  return (
    <FieldFrame label={label} hint={hint}>
      {({ inputId, describedBy }) => (
        <textarea
          id={inputId}
          className={styles.input}
          aria-describedby={describedBy}
          {...textarea}
        />
      )}
    </FieldFrame>
  );
}

export interface Choice<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

interface ChoiceFieldsetProps<T extends string> {
  legend: string;
  hint?: string | undefined;
  error?: string | undefined;
  choices: readonly Choice<T>[];
  type: 'radio' | 'checkbox';
  isChecked: (value: T) => boolean;
  onToggle: (value: T) => void;
}

/** Radio or checkbox chips inside a fieldset, so screen readers hear the group name. */
function ChoiceFieldset<T extends string>(props: ChoiceFieldsetProps<T>) {
  const name = useId();
  const hintId = `${name}-hint`;
  const errorId = `${name}-error`;
  const describedBy = [props.hint ? hintId : '', props.error ? errorId : '']
    .filter(Boolean)
    .join(' ');
  return (
    <fieldset className={styles.group} aria-describedby={describedBy || undefined}>
      <legend className={styles.legend}>{props.legend}</legend>
      <div className={styles.chips}>
        {props.choices.map((choice) => (
          <label key={choice.value} className={styles.chip}>
            <input
              className={styles.chipInput}
              type={props.type}
              name={name}
              value={choice.value}
              checked={props.isChecked(choice.value)}
              disabled={choice.disabled}
              aria-invalid={props.error ? true : undefined}
              onChange={() => props.onToggle(choice.value)}
            />
            {choice.icon}
            {choice.label}
          </label>
        ))}
      </div>
      {props.hint && (
        <p id={hintId} className={styles.hint}>
          {props.hint}
        </p>
      )}
      {props.error && (
        <p id={errorId} className={styles.error}>
          {props.error}
        </p>
      )}
    </fieldset>
  );
}

interface ChoiceGroupProps<T extends string> {
  legend: string;
  hint?: string | undefined;
  error?: string | undefined;
  choices: readonly Choice<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** Pick one (radio chips). */
export function ChoiceGroup<T extends string>({ value, onChange, ...rest }: ChoiceGroupProps<T>) {
  return (
    <ChoiceFieldset
      {...rest}
      type="radio"
      isChecked={(item) => item === value}
      onToggle={onChange}
    />
  );
}

interface MultiChoiceGroupProps<T extends string> {
  legend: string;
  hint?: string | undefined;
  error?: string | undefined;
  choices: readonly Choice<T>[];
  value: readonly T[];
  onChange: (value: T[]) => void;
}

/** Pick any number (checkbox chips). */
export function MultiChoiceGroup<T extends string>({
  value,
  onChange,
  ...rest
}: MultiChoiceGroupProps<T>) {
  return (
    <ChoiceFieldset
      {...rest}
      type="checkbox"
      isChecked={(item) => value.includes(item)}
      onToggle={(item) =>
        onChange(value.includes(item) ? value.filter((v) => v !== item) : [...value, item])
      }
    />
  );
}

interface StepperProps {
  label: string;
  value: number;
  step: number;
  min: number;
  max: number;
  lessLabel: string;
  moreLabel: string;
  /** Unit shown inside the control, for example "tablet". */
  unit?: string | undefined;
  error?: string | undefined;
  onChange: (value: number) => void;
}

/** Number with minus and plus buttons; the unit sits inside so rows of steppers line up. */
export function Stepper({
  label,
  value,
  step,
  min,
  max,
  lessLabel,
  moreLabel,
  unit,
  error,
  onChange,
}: StepperProps) {
  const clamp = (next: number) => Math.min(max, Math.max(min, Math.round(next / step) * step));
  return (
    <FieldFrame label={label} error={error}>
      {({ inputId, describedBy }) => (
        <div className={styles.stepper} data-invalid={error ? '' : undefined}>
          <button
            type="button"
            className={styles.stepButton}
            aria-label={`${lessLabel}: ${label}`}
            disabled={value <= min}
            onClick={() => onChange(clamp(value - step))}
          >
            {'\u2212'}
          </button>
          <span className={styles.stepValue}>
            <input
              id={inputId}
              type="number"
              inputMode="decimal"
              min={min}
              max={max}
              step={step}
              value={Number.isFinite(value) ? value : ''}
              aria-describedby={describedBy}
              aria-invalid={error ? true : undefined}
              onChange={(event) => onChange(event.target.valueAsNumber)}
            />
            {unit && <span className={styles.unit}>{unit}</span>}
          </span>
          <button
            type="button"
            className={styles.stepButton}
            aria-label={`${moreLabel}: ${label}`}
            disabled={value >= max}
            onClick={() => onChange(clamp(value + step))}
          >
            +
          </button>
        </div>
      )}
    </FieldFrame>
  );
}

interface SwitchProps {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

export function Switch({ label, checked, disabled, onChange }: SwitchProps) {
  return (
    <label className={styles.switch}>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}
