import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import type { IntroText } from '@/features/welcome/ui/intro';
import { SCENE_IDS, type SceneId } from './script';
import { Brand } from './scenes/Brand';
import { Chart, DOSE_LANDINGS } from './scenes/Chart';
import { Counter, FRAMES_PER_CHAR, TYPE_START } from './scenes/Counter';
import { Forms } from './scenes/Forms';
import { Home, RING_AT, TAP_AT } from './scenes/Home';
import { Problem } from './scenes/Problem';
import { TOKENS } from './theme';
import { timeline } from './timeline';

export interface IntroProps extends Record<string, unknown> {
  text: IntroText;
  /** Seconds per scene: the measured narration lengths, or the silent defaults. */
  seconds: Record<SceneId, number>;
  voiced: boolean;
  /** webm keeps a transparent background so the page grid shows through; mp4 paints the desk. */
  transparent: boolean;
}

const SCENES: Record<SceneId, (props: { text: IntroText }) => React.JSX.Element> = {
  problem: Problem,
  counter: Counter,
  chart: Chart,
  forms: Forms,
  home: Home,
  brand: Brand,
};

/** The ruled cutting-mat desk of the app, for players that cannot show transparency. */
const DESK = {
  backgroundColor: '#ececea',
  backgroundImage:
    'linear-gradient(#d8d8d3 1px, transparent 1px), linear-gradient(90deg, #d8d8d3 1px, transparent 1px)',
  backgroundSize: '40px 40px',
};

/** Sound effects placed on the exact frames where things happen in the scenes. */
function Effects({ timing }: { timing: ReturnType<typeof timeline> }) {
  const typed = Array.from(
    { length: 16 },
    (_, i) => timing.counter.from + TYPE_START + i * FRAMES_PER_CHAR,
  );
  const pops = DOSE_LANDINGS.map((at) => timing.chart.from + at);
  return (
    <>
      {typed.map((at) => (
        <Sequence key={`t${at}`} from={at} durationInFrames={3} layout="none">
          <Audio src={staticFile('sfx/tick.wav')} volume={0.5} />
        </Sequence>
      ))}
      {pops.map((at) => (
        <Sequence key={`p${at}`} from={at} durationInFrames={8} layout="none">
          <Audio src={staticFile('sfx/pop.wav')} volume={0.6} />
        </Sequence>
      ))}
      <Sequence from={timing.home.from + RING_AT} durationInFrames={30} layout="none">
        <Audio src={staticFile('sfx/chime.wav')} volume={0.6} />
      </Sequence>
      <Sequence from={timing.home.from + TAP_AT} durationInFrames={8} layout="none">
        <Audio src={staticFile('sfx/pop.wav')} volume={0.6} />
      </Sequence>
    </>
  );
}

export function Intro({ text, seconds, voiced, transparent }: IntroProps) {
  const timing = timeline(seconds);
  return (
    <AbsoluteFill style={{ ...TOKENS, ...(transparent ? {} : DESK) }}>
      {SCENE_IDS.map((id) => {
        const Scene = SCENES[id];
        return (
          <Sequence
            key={id}
            from={timing[id].from}
            durationInFrames={timing[id].frames}
            layout="none"
          >
            <AbsoluteFill>
              <Scene text={text} />
            </AbsoluteFill>
            {voiced && <Audio src={staticFile(`voice/${id}.wav`)} />}
          </Sequence>
        );
      })}
      <Effects timing={timing} />
    </AbsoluteFill>
  );
}
