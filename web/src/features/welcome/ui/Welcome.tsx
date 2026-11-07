import { useEffect, useRef } from 'react';
import { useI18n } from '@/shared/i18n';
import { Button } from '@/shared/ui/Button';
import { Icon, type IconName } from '@/shared/ui/Icon';
import { Wordmark } from '@/shared/ui/Wordmark';
import styles from './Welcome.module.css';

interface WelcomeProps {
  /** Called when the viewer starts or skips; the app swaps in behind a view transition. */
  onDone: () => void;
}

const POINTS: readonly { key: 'interval' | 'forms' | 'reminder'; icon: IconName }[] = [
  { key: 'interval', icon: 'prn' },
  { key: 'forms', icon: 'counsel' },
  { key: 'reminder', icon: 'download' },
];

/** First visit: the name, the promise and the start button, ready at once. */
export function Welcome({ onDone }: WelcomeProps) {
  const { t } = useI18n();
  const startRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    startRef.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onDone();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onDone]);

  return (
    <main className={styles.welcome} aria-labelledby="welcome-title">
      <section className={styles.copy}>
        <div className={styles.brand}>
          <Wordmark size={72} />
          <p className={styles.name}>{t.app.name}</p>
        </div>
        <h1 id="welcome-title" className={styles.title}>
          {t.welcome.title}
        </h1>
        <ul className={styles.points}>
          {POINTS.map(({ key, icon }) => (
            <li key={key}>
              <Icon name={icon} />
              {t.welcome.points[key]}
            </li>
          ))}
        </ul>
        <div className={styles.actions}>
          <Button ref={startRef} variant="primary" icon="next" onClick={onDone}>
            {t.welcome.start}
          </Button>
          <button type="button" className={styles.skip} onClick={onDone}>
            {t.welcome.skip}
          </button>
        </div>
      </section>
    </main>
  );
}
