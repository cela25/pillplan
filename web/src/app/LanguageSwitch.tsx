import { LANGS, useI18n } from '@/shared/i18n';
import { Tooltip } from '@/shared/ui/Tooltip';
import { withViewTransition } from '@/shared/viewTransition';
import styles from './LanguageSwitch.module.css';

/** EN / ID as text. An amber line slides under the chosen language. */
export function LanguageSwitch() {
  const { t, lang, setLang } = useI18n();
  return (
    <div className={styles.switch} role="group" aria-label={t.language.label} data-lang={lang}>
      {LANGS.map((option) => (
        <Tooltip key={option} text={t.language[option]}>
          <button
            type="button"
            lang={option}
            className={styles.option}
            aria-pressed={lang === option}
            onClick={() => withViewTransition(() => setLang(option))}
          >
            {option.toUpperCase()}
          </button>
        </Tooltip>
      ))}
      <span className={styles.indicator} aria-hidden="true" />
    </div>
  );
}
