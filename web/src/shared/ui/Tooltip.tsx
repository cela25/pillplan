import {
  cloneElement,
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type ReactElement,
} from 'react';
import styles from './Tooltip.module.css';

const OPEN_DELAY_MS = 400;
const CLOSE_DELAY_MS = 120;

interface TriggerProps {
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

interface TooltipProps {
  /** Short text: what the control does. Never anything the user needs to finish the task. */
  text: string;
  /** One focusable element (a button). */
  children: ReactElement<TriggerProps>;
  /**
   * "label" when the trigger is icon-only and the tooltip is its name,
   * "description" when the trigger already has a visible label.
   */
  role?: 'label' | 'description';
  placement?: 'below' | 'above';
  /** Stretch to fill a grid or flex cell, for full-width triggers. */
  block?: boolean;
}

/**
 * WCAG 2.2 SC 1.4.13: dismissible (Esc), hoverable (the pointer can move onto it),
 * persistent (no timer hides it). Opens on hover after a delay and at once on
 * keyboard focus. Hidden on touch screens, where there is no hover.
 */
export function Tooltip({
  text,
  children,
  role = 'description',
  placement = 'below',
  block = false,
}: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const clear = () => window.clearTimeout(timer.current);
  const show = (delay: number) => {
    clear();
    timer.current = window.setTimeout(() => setOpen(true), delay);
  };
  const hide = (delay: number) => {
    clear();
    timer.current = window.setTimeout(() => setOpen(false), delay);
  };

  useEffect(() => clear, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const reference = role === 'label' ? { 'aria-labelledby': id } : { 'aria-describedby': id };

  return (
    <span
      className={block ? `${styles.anchor} ${styles.block}` : styles.anchor}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') show(OPEN_DELAY_MS);
      }}
      onPointerLeave={() => hide(CLOSE_DELAY_MS)}
      onFocus={(event: FocusEvent<HTMLSpanElement>) => {
        if (event.target.matches(':focus-visible')) show(0);
      }}
      onBlur={() => hide(0)}
      onKeyDown={(event: KeyboardEvent<HTMLSpanElement>) => {
        // Close the tooltip first; a second Escape can then close a surrounding dialog.
        if (event.key === 'Escape' && open) {
          event.stopPropagation();
          clear();
          setOpen(false);
        }
      }}
    >
      {cloneElement(children, reference)}
      <span
        id={id}
        role="tooltip"
        className={styles.tip}
        data-open={open || undefined}
        data-placement={placement}
      >
        {text}
      </span>
    </span>
  );
}
