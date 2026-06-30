"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface YouTubePlayer {
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  playVideo(): void;
  pauseVideo(): void;
}

interface YouTubeContextValue {
  registerPlayer: (player: YouTubePlayer) => void;
  seekTo: (seconds: number) => void;
  isReady: boolean;
}

const YouTubeContext = createContext<YouTubeContextValue | null>(null);

export function YouTubeProvider({ children }: { children: ReactNode }) {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [isReady, setIsReady] = useState(false);

  const registerPlayer = useCallback((player: YouTubePlayer) => {
    playerRef.current = player;
    setIsReady(true);
  }, []);

  const seekTo = useCallback((seconds: number) => {
    playerRef.current?.seekTo(seconds, true);
    playerRef.current?.playVideo();
  }, []);

  return (
    <YouTubeContext.Provider value={{ registerPlayer, seekTo, isReady }}>
      {children}
    </YouTubeContext.Provider>
  );
}

export function useYouTube() {
  const ctx = useContext(YouTubeContext);
  if (!ctx) throw new Error("useYouTube must be used within YouTubeProvider");
  return ctx;
}
