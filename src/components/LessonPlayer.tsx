import { useEffect, useRef, useState } from 'react';
import { loadYouTubeApi, type YouTubePlayer } from '@/lib/youtubePlayer';

const SAVE_INTERVAL_MS = 15000;

type LessonPlayerProps = {
  videoId: string;
  startSeconds: number;
  onProgress: (durationSeconds: number, watchedSeconds: number, ended: boolean) => void;
};

export default function LessonPlayer({ videoId, startSeconds, onProgress }: LessonPlayerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const onProgressRef = useRef(onProgress);
  const startRef = useRef(startSeconds);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    onProgressRef.current = onProgress;
  });

  useEffect(() => {
    let cancelled = false;
    let player: YouTubePlayer | null = null;
    let timer: number | undefined;

    const stopTimer = () => {
      if (timer !== undefined) window.clearInterval(timer);
      timer = undefined;
    };

    const report = (ended = false) => {
      if (!player) return;
      const duration = player.getDuration();
      if (!duration) return;
      const current = ended ? duration : player.getCurrentTime();
      onProgressRef.current(Math.round(duration), Math.floor(current), ended);
    };

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled || !hostRef.current) return;
        player = new YT.Player(hostRef.current, {
          videoId,
          width: '100%',
          height: '100%',
          playerVars: {
            rel: 0,
            playsinline: 1,
            start: Math.floor(startRef.current),
            origin: window.location.origin,
          },
          events: {
            onStateChange: (event) => {
              if (event.data === YT.PlayerState.PLAYING) {
                if (timer === undefined) timer = window.setInterval(() => report(), SAVE_INTERVAL_MS);
              } else if (event.data === YT.PlayerState.PAUSED) {
                stopTimer();
                report();
              } else if (event.data === YT.PlayerState.ENDED) {
                stopTimer();
                report(true);
              }
            },
            onError: () => {
              if (!cancelled) setLoadError('This video cannot be played here.');
            },
          },
        });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'The video player could not load.');
        }
      });

    return () => {
      cancelled = true;
      stopTimer();
      report();
      player?.destroy();
      player = null;
    };
  }, [videoId]);

  return (
    <div className="relative h-full w-full bg-black">
      <div ref={hostRef} className="h-full w-full" />
      {loadError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
          <p role="alert" className="text-base font-semibold text-white">
            {loadError}
          </p>
          <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="border-2 border-white px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-primary-900"
          >
            Open on YouTube
          </a>
        </div>
      )}
    </div>
  );
}
