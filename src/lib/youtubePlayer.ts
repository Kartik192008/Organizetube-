export type YouTubePlayer = {
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
};

type PlayerStateEvent = { data: number };

export type YouTubeNamespace = {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      width?: string;
      height?: string;
      playerVars?: Record<string, string | number>;
      events?: { onStateChange?: (event: PlayerStateEvent) => void; onError?: () => void };
    },
  ) => YouTubePlayer;
  PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
};

declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const API_SRC = 'https://www.youtube.com/iframe_api';
let apiLoading: Promise<YouTubeNamespace> | null = null;

export function loadYouTubeApi(): Promise<YouTubeNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiLoading) return apiLoading;

  apiLoading = new Promise<YouTubeNamespace>((resolve, reject) => {
    window.onYouTubeIframeAPIReady = () => {
      if (window.YT) resolve(window.YT);
      else reject(new Error('The video player failed to start.'));
    };
    const script = document.createElement('script');
    script.src = API_SRC;
    script.async = true;
    script.onerror = () => {
      apiLoading = null;
      reject(new Error('The video player could not be loaded.'));
    };
    document.head.appendChild(script);
  });
  return apiLoading;
}
