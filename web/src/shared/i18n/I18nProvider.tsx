import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { en, type Strings } from './en';
import { id } from './id';
import { isLang, type Lang } from './lang';

const DICTIONARIES: Record<Lang, Strings> = { en, id };
export const LANG_KEY = 'pillplan:lang';

interface I18nValue {
  lang: Lang;
  t: Strings;
  setLang: (lang: Lang) => void;
}

const I18nContext = createContext<I18nValue | null>(null);

/** Saved choice first, then the browser language, then English. */
export function initialLang(storage: Storage | null, requested?: string | null): Lang {
  if (isLang(requested)) return requested;
  try {
    const saved = storage?.getItem(LANG_KEY);
    if (isLang(saved)) return saved;
  } catch {
    // Storage blocked: fall back to the browser language.
  }
  return navigator.language.toLowerCase().startsWith('id') ? 'id' : 'en';
}

interface I18nProviderProps {
  initial: Lang;
  storage: Storage | null;
  children: ReactNode;
}

export function I18nProvider({ initial, storage, children }: I18nProviderProps) {
  const [lang, setLang] = useState<Lang>(initial);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      storage?.setItem(LANG_KEY, lang);
    } catch {
      // The choice is simply not remembered.
    }
  }, [lang, storage]);

  const value = useMemo(() => ({ lang, t: DICTIONARIES[lang], setLang }), [lang]);
  return <I18nContext value={value}>{children}</I18nContext>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside I18nProvider');
  return value;
}

export function dictionary(lang: Lang): Strings {
  return DICTIONARIES[lang];
}
