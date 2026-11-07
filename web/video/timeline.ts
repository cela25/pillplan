import { PAUSE_SECONDS, SCENE_IDS, type SceneId } from './script';

export const FPS = 30;
export const SIZE = { width: 1280, height: 720 } as const;

export type SceneTiming = Record<SceneId, { from: number; frames: number }>;

/** One timeline for the whole film: each scene starts where the previous one ends. */
export function timeline(seconds: Record<SceneId, number>): SceneTiming {
  let from = 0;
  const result = {} as SceneTiming;
  for (const id of SCENE_IDS) {
    const frames = Math.round((seconds[id] + PAUSE_SECONDS) * FPS);
    result[id] = { from, frames };
    from += frames;
  }
  return result;
}

export function totalFrames(timing: SceneTiming): number {
  const last = timing[SCENE_IDS[SCENE_IDS.length - 1] ?? 'brand'];
  return last.from + last.frames;
}
