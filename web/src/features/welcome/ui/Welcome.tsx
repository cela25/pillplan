import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/shared/i18n';
import { Button } from '@/shared/ui/Button';
import { Icon, type IconName } from '@/shared/ui/Icon';
import { Wordmark } from '@/shared/ui/Wordmark';
import { introAsset } from './assets';
import styles from './Welcome.module.css';

interface WelcomeProps {
  /** Called when the viewer starts or skips; the app swaps in behind a view transition. */
  onDone: () => void;
}

/** What the film is doing; it never loops, so it ends on the brand frame. */
type FilmState = 'poster' | 'playing' | 'ended';

function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

const POINTS: readonly { key: 'interval' | 'forms' | 'reminder'; icon: IconName }[] = [
  { key: 'interval', icon: 'prn' },
  { key: 'forms', icon: 'counsel' },
  { key: 'reminder', icon: 'download' },
];

/**
 * First visit. Left: the name, the promise and the start button, ready at once. Right: a short
 * film pre-rendered with Remotion, played by a plain <video> so no video library is shipped.
 * It starts muted (browsers only autoplay silent video) and has a sound toggle.
 */
export function Welcome({ onDone }: WelcomeProps) {
  const { t, lang } = useI18n();
  const startRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [still] = useState(prefersReducedMotion);
  const [film, setFilm] = useState<FilmState>('poster');
  const [muted, setMuted] = useState(true);
  const asset = introAsset(lang);

  useEffect(() => {
    startRef.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onDone();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onDone]);

  // Free the decoder when the welcome screen goes away.
  useEffect(() => {
    const video = videoRef.current;
    return () => {
      video?.pause();
      video?.removeAttribute('src');
    };
  }, []);

  const toggleSound = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !muted;
    setMuted(!muted);
    if (video.paused) {
      if (film === 'ended') video.currentTime = 0;
      void video.play().catch(() => setFilm('poster'));
    }
  };

  return (
    <main className={styles.welcome} aria-labelledby="welcome-title">
      <section className={styles.copy}>
        <div className={styles.brand}>
          <Wordmark size={72} />
          <p className={styles.name}>{t.app.name}</p>
        </div>
        <h1 id="welcome-title" className={styles.title}>
          {t.welcome.title}
        </h1>
        <ul className={styles.points}>
          {POINTS.map(({ key, icon }) => (
            <li key={key}>
              <Icon name={icon} />
              {t.welcome.points[key]}
            </li>
          ))}
        </ul>
        <div className={styles.actions}>
          <Button ref={startRef} variant="primary" icon="next" onClick={onDone}>
            {t.welcome.start}
          </Button>
          <button type="button" className={styles.skip} onClick={onDone}>
            {t.welcome.skip}
          </button>
        </div>
      </section>

      <figure className={styles.stage} data-film={film}>
        <video
          ref={videoRef}
          className={styles.video}
          poster={asset.poster}
          autoPlay={!still}
          muted
          playsInline
          preload={still ? 'none' : 'auto'}
          aria-label={t.welcome.film}
          onPlay={() => setFilm('playing')}
          onEnded={() => setFilm('ended')}
          onError={() => setFilm('poster')}
        >
          <source src={asset.webm} type='video/webm; codecs="vp9, opus"' />
          <source src={asset.mp4} type="video/mp4" />
        </video>
        <figcaption className={styles.controls}>
          <button
            type="button"
            className={styles.sound}
            aria-pressed={!muted}
            onClick={toggleSound}
          >
            <Icon name={muted ? 'soundOff' : 'soundOn'} size={18} />
            {muted ? t.welcome.soundOn : t.welcome.soundOff}
          </button>
        </figcaption>
      </figure>
    </main>
  );
}
