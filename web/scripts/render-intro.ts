/**
 * Renders the welcome film for every language into public/intro/:
 *   intro-{lang}.webm  VP9 with alpha, so the page grid shows through (Chrome, Firefox, Edge)
 *   intro-{lang}.mp4   H.264 on the desk colour, for Safari
 *   poster-{lang}.png  the last frame, transparent, shown before play and under reduced motion
 *
 *   npm run video:render            GPU (ANGLE, then EGL), falling back to software
 *   GL=swangle npm run video:render force software rendering
 *   STILLS=40,140 OUT=/tmp/x npm run video:render   only write those frames as PNG, to check
 *   BROWSER=/path/to/chrome           use an installed Chrome (needed on NixOS, where the
 *                                     downloaded headless shell lacks system libraries)
 *
 * Graph: bundle ─▶ per lang [ select ─▶ webm ─▶ mp4 ─▶ poster ─▶ size gate ]. The happy path
 * lives in main(); every failure is reported once, at the bottom.
 */
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { bundle } from '@remotion/bundler';
import {
  ensureBrowser,
  openBrowser,
  renderMedia,
  renderStill,
  selectComposition,
  type ChromiumOptions,
} from '@remotion/renderer';
import { introFileName } from '../src/features/welcome/ui/assets';
import { introText } from '../src/features/welcome/ui/intro';
import { en } from '../src/shared/i18n/en';
import { id } from '../src/shared/i18n/id';
import type { Lang, Strings } from '../src/shared/i18n';
import type { IntroProps } from '../video/Intro';
import { DEFAULT_SECONDS, VOICED, type SceneId } from '../video/script';

const WEB = join(import.meta.dirname, '..');
const OUT = process.env.OUT ?? join(WEB, 'public', 'intro');
const STILLS = process.env.STILLS?.split(',').map(Number).filter(Number.isFinite) ?? [];
const PUBLIC_DIR = join(WEB, 'video', 'public');
const LIMIT_BYTES = 600 * 1024;
const LANGS: Record<Lang, Strings> = { id, en };

/** An installed Chrome, when given or found; otherwise Remotion's own headless shell. */
const SYSTEM_CHROME = ['/run/current-system/sw/bin/google-chrome-stable', '/usr/bin/google-chrome'];
const EXECUTABLE = process.env.BROWSER ?? SYSTEM_CHROME.find((path) => existsSync(path)) ?? null;
const BROWSER_OPTIONS = EXECUTABLE
  ? ({ browserExecutable: EXECUTABLE, chromeMode: 'chrome-for-testing' } as const)
  : ({ chromeMode: 'headless-shell' } as const);

class RenderError extends Error {
  readonly _tag = 'RenderError';
  constructor(
    readonly lang: Lang | 'all',
    readonly stage: 'bundle' | 'render' | 'still',
    readonly cause: unknown,
  ) {
    super(`${stage} failed for ${lang}: ${String(cause)}`);
  }
}

class AssetTooLarge extends Error {
  readonly _tag = 'AssetTooLarge';
  constructor(
    readonly file: string,
    readonly bytes: number,
  ) {
    super(`${file} is ${Math.round(bytes / 1024)} KB, over the ${LIMIT_BYTES / 1024} KB budget`);
  }
}

/** Narration lengths from `npm run video:voice`, or the silent defaults. */
function sceneSeconds(): Record<SceneId, number> {
  const file = join(PUBLIC_DIR, 'timing.json');
  if (!existsSync(file)) return DEFAULT_SECONDS;
  return {
    ...DEFAULT_SECONDS,
    ...(JSON.parse(readFileSync(file, 'utf8')) as Record<SceneId, number>),
  };
}

const hasVoice = () => existsSync(join(PUBLIC_DIR, 'voice', 'brand.wav'));

/** First GL backend whose browser opens; the GPU ones come first. */
async function pickGl(): Promise<ChromiumOptions['gl']> {
  const wanted = process.env.GL as ChromiumOptions['gl'] | undefined;
  const order: ChromiumOptions['gl'][] = wanted ? [wanted] : ['angle', 'egl', 'swangle'];
  for (const gl of order) {
    try {
      const browser = await openBrowser('chrome', { ...BROWSER_OPTIONS, chromiumOptions: { gl } });
      await browser.close({ silent: true });
      return gl;
    } catch {
      console.warn(`GL "${String(gl)}" not available, trying the next one`);
    }
  }
  return 'swangle';
}

function gate(file: string): number {
  const { size } = statSync(file);
  if (size > LIMIT_BYTES) throw new AssetTooLarge(file, size);
  return size;
}

async function withTiming<T>(label: string, run: () => Promise<T>): Promise<T> {
  const start = performance.now();
  const result = await run();
  console.log(`${label} ${((performance.now() - start) / 1000).toFixed(1)}s`);
  return result;
}

async function main(): Promise<void> {
  mkdirSync(OUT, { recursive: true });
  if (!EXECUTABLE) await ensureBrowser();
  const gl = await pickGl();
  console.log(`rendering with gl=${String(gl)} in ${EXECUTABLE ?? 'headless shell'}`);

  const serveUrl = await withTiming('bundle', () =>
    bundle({
      entryPoint: join(WEB, 'video', 'index.ts'),
      publicDir: PUBLIC_DIR,
      webpackOverride: (config) => ({
        ...config,
        resolve: {
          ...config.resolve,
          alias: { ...(config.resolve?.alias ?? {}), '@': join(WEB, 'src') },
        },
      }),
    }).catch((cause: unknown) => {
      throw new RenderError('all', 'bundle', cause);
    }),
  );

  const browser = await openBrowser('chrome', { ...BROWSER_OPTIONS, chromiumOptions: { gl } });
  try {
    const seconds = sceneSeconds();
    for (const lang of Object.keys(LANGS) as Lang[]) {
      const base = {
        text: introText(LANGS[lang]),
        seconds,
        voiced: VOICED[lang] && hasVoice(),
      } satisfies Omit<IntroProps, 'transparent'>;
      const transparent: IntroProps = { ...base, transparent: true };
      const desk: IntroProps = { ...base, transparent: false };
      const common = {
        serveUrl,
        puppeteerInstance: browser,
        chromiumOptions: { gl },
        ...BROWSER_OPTIONS,
      };

      const composition = await selectComposition({
        ...common,
        id: 'intro',
        inputProps: transparent,
      });
      const file = (kind: 'webm' | 'mp4' | 'poster') => join(OUT, introFileName(lang, kind));

      if (STILLS.length > 0) {
        for (const frame of STILLS) {
          await renderStill({
            ...common,
            composition: { ...composition, props: desk },
            inputProps: desk,
            frame,
            output: join(OUT, `${lang}-${frame}.png`),
          });
        }
        continue;
      }

      await withTiming(`${lang} webm`, () =>
        renderMedia({
          ...common,
          composition,
          inputProps: transparent,
          codec: 'vp9',
          imageFormat: 'png',
          pixelFormat: 'yuva420p',
          crf: 40,
          audioCodec: 'opus',
          audioBitrate: '48k',
          outputLocation: file('webm'),
        }).catch((cause: unknown) => {
          throw new RenderError(lang, 'render', cause);
        }),
      );
      await withTiming(`${lang} mp4`, () =>
        renderMedia({
          ...common,
          composition: { ...composition, props: desk },
          inputProps: desk,
          codec: 'h264',
          crf: 30,
          audioBitrate: '48k',
          outputLocation: file('mp4'),
        }).catch((cause: unknown) => {
          throw new RenderError(lang, 'render', cause);
        }),
      );
      await withTiming(`${lang} poster`, () =>
        renderStill({
          ...common,
          composition,
          inputProps: transparent,
          frame: composition.durationInFrames - 1,
          imageFormat: 'png',
          output: file('poster'),
        }).catch((cause: unknown) => {
          throw new RenderError(lang, 'still', cause);
        }),
      );

      for (const kind of ['webm', 'mp4', 'poster'] as const) {
        console.log(`  ${introFileName(lang, kind)} ${Math.round(gate(file(kind)) / 1024)} KB`);
      }
    }
  } finally {
    await browser.close({ silent: false });
  }
}

main().catch((error: unknown) => {
  if (error instanceof AssetTooLarge)
    console.error(`${error.message}. Raise crf or shorten scenes.`);
  else if (error instanceof RenderError)
    console.error(`${error.message}\nTry: npx remotion browser ensure`);
  else console.error(error);
  process.exit(1);
});
