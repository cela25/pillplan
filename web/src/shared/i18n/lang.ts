export const LANGS = ['en', 'id'] as const;
export type Lang = (typeof LANGS)[number];

/** Text that the catalog ships in both languages. */
export interface LocalText {
  en: string;
  id: string;
}

export function isLang(value: unknown): value is Lang {
  return value === 'en' || value === 'id';
}

export function local(text: LocalText, lang: Lang): string {
  return text[lang];
}
