import { Composition } from 'remotion';
import { en } from '@/shared/i18n/en';
import { introText } from '@/features/welcome/ui/intro';
import { Intro, type IntroProps } from './Intro';
import { DEFAULT_SECONDS } from './script';
import { FPS, SIZE, timeline, totalFrames } from './timeline';

const defaults: IntroProps = {
  text: introText(en),
  seconds: DEFAULT_SECONDS,
  voiced: false,
  transparent: false,
};

/** One composition; the render script gives it each language's text and the voice timing. */
export function Root() {
  return (
    <Composition
      id="intro"
      component={Intro}
      fps={FPS}
      width={SIZE.width}
      height={SIZE.height}
      durationInFrames={totalFrames(timeline(DEFAULT_SECONDS))}
      defaultProps={defaults}
      calculateMetadata={({ props }) => ({
        durationInFrames: totalFrames(timeline(props.seconds)),
      })}
    />
  );
}
