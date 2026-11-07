/**
 * Generates the English narration (Piper TTS, public-domain LJSpeech voice) and the sound
 * effects, then writes each line's length to video/public/timing.json so the scenes wait
 * for the voice.
 *
 *   PIPER_MODEL=/path/to/en_US-ljspeech-medium.onnx npm run video:voice
 *
 * Needs `uvx` (it runs `piper-tts` from PyPI). Sound effects alone need nothing:
 *   npm run video:voice -- --sfx-only
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { NARRATION, SCENE_IDS } from '../video/script';

const ROOT = join(import.meta.dirname, '..', 'video', 'public');
const RATE = 22050;

function wavSeconds(file: string): number {
  const bytes = readFileSync(file);
  return (bytes.length - 44) / bytes.readUInt32LE(28);
}

interface Note {
  hz: number;
  at: number;
  length: number;
}

/** Short sine notes with a soft attack and an exponential fade, as 16-bit mono WAV. */
function tone(file: string, notes: readonly Note[], gain: number): void {
  const total = Math.max(...notes.map((note) => note.at + note.length));
  const samples = new Float32Array(Math.ceil(total * RATE));
  for (const { hz, at, length } of notes) {
    const start = Math.floor(at * RATE);
    for (let i = 0; i < length * RATE; i++) {
      const t = i / RATE;
      const envelope = Math.min(1, t / 0.005) * Math.exp(-t / (length / 4));
      samples[start + i] =
        (samples[start + i] ?? 0) + Math.sin(2 * Math.PI * hz * t) * envelope * gain;
    }
  }
  const pcm = Buffer.alloc(samples.length * 2);
  samples.forEach((value, index) => {
    pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, value)) * 32767), index * 2);
  });
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  writeFileSync(file, Buffer.concat([header, pcm]));
}

function makeSfx(): void {
  mkdirSync(join(ROOT, 'sfx'), { recursive: true });
  tone(join(ROOT, 'sfx', 'tick.wav'), [{ hz: 1800, at: 0, length: 0.03 }], 0.1);
  tone(join(ROOT, 'sfx', 'pop.wav'), [{ hz: 660, at: 0, length: 0.18 }], 0.28);
  tone(
    join(ROOT, 'sfx', 'chime.wav'),
    [
      { hz: 784, at: 0, length: 0.5 },
      { hz: 1175, at: 0.14, length: 0.7 },
    ],
    0.22,
  );
}

function makeVoice(model: string): void {
  mkdirSync(join(ROOT, 'voice'), { recursive: true });
  const timing: Record<string, number> = {};
  for (const id of SCENE_IDS) {
    const file = join(ROOT, 'voice', `${id}.wav`);
    execFileSync('uvx', ['--from', 'piper-tts', 'piper', '-m', model, '-f', file], {
      input: NARRATION[id],
      stdio: ['pipe', 'ignore', 'inherit'],
    });
    timing[id] = Math.round(wavSeconds(file) * 100) / 100;
  }
  writeFileSync(join(ROOT, 'timing.json'), `${JSON.stringify(timing, null, 2)}\n`);
  console.log('narration seconds', timing);
}

makeSfx();
if (!process.argv.includes('--sfx-only')) {
  const model = process.env.PIPER_MODEL;
  if (!model) throw new Error('Set PIPER_MODEL to the en_US-ljspeech-medium.onnx path.');
  makeVoice(model);
}
