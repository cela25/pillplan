import type { Lang } from '@/shared/i18n';

/** The rendered film for one language: webm (with alpha, sits on the page grid), mp4, poster. */
export interface IntroAsset {
  webm: string;
  mp4: string;
  poster: string;
}

/** File names are fixed by scripts/render-intro.ts; both sides use this one function. */
export function introFileName(lang: Lang, kind: keyof IntroAsset): string {
  return kind === 'poster' ? `poster-${lang}.png` : `intro-${lang}.${kind}`;
}

export function introAsset(lang: Lang, base = import.meta.env.BASE_URL): IntroAsset {
  const at = (kind: keyof IntroAsset) => `${base}intro/${introFileName(lang, kind)}`;
  return { webm: at('webm'), mp4: at('mp4'), poster: at('poster') };
}
