import type { Lang } from '@/shared/i18n';

/** The six scenes, in order. */
export const SCENE_IDS = ['problem', 'counter', 'chart', 'forms', 'home', 'brand'] as const;
export type SceneId = (typeof SCENE_IDS)[number];

/**
 * English narration for the public-domain LJSpeech voice (Piper TTS, offline). The Indonesian
 * film keeps Indonesian captions and sound effects but no voice: no Indonesian voice with a
 * clear licence was available.
 */
export const NARRATION: Record<SceneId, string> = {
  problem: 'Morning, noon, or night? Many patients are not sure when to take their medicine.',
  counter: 'The pharmacist types the prescription into PillPlan.',
  chart:
    'Three times a day becomes every eight hours, so the medicine keeps working day and night.',
  forms: 'Tablet, capsule, syrup, or suspension. Clear at a glance.',
  home: 'At home, a reminder rings, and one tap marks the dose.',
  brand: 'PillPlan. A chart the patient can follow.',
};

export const VOICED: Record<Lang, boolean> = { en: true, id: false };

/**
 * Seconds per scene. `npm run video:voice` overwrites these with the measured length of each
 * narration line, so the pictures always wait for the voice. These are the silent defaults.
 */
export const DEFAULT_SECONDS: Record<SceneId, number> = {
  problem: 3.4,
  counter: 3,
  chart: 3.8,
  forms: 2.6,
  home: 2.8,
  brand: 2.2,
};

/** A breath after each line before the next scene starts. */
export const PAUSE_SECONDS = 0.45;
