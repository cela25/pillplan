/** Public API of the shared i18n module: English and Indonesian text. */
export { en, type Strings } from './en';
export { id } from './id';
export { isLang, local, LANGS, type Lang, type LocalText } from './lang';
export { dictionary, I18nProvider, initialLang, LANG_KEY, useI18n } from './I18nProvider';
