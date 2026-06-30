"use client";

import { useEffect, useRef } from "react";
import { useYouTube } from "./youtube-context";

declare global {
  interface Window {
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

interface VideoPlayerProps {
  youtubeId: string;
}

export default function VideoPlayer({ youtubeId }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const { registerPlayer } = useYouTube();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    function createPlayer() {
      if (!containerRef.current || !window.YT?.Player) return;
      playerRef.current = new YT.Player(containerRef.current, {
        videoId: youtubeId,
        height: "100%",
        width: "100%",
        playerVars: {
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onReady: () => {
            if (playerRef.current) {
              registerPlayer({
                seekTo: (s, a) => playerRef.current?.seekTo(s, a),
                getCurrentTime: () => playerRef.current?.getCurrentTime() ?? 0,
                playVideo: () => playerRef.current?.playVideo(),
                pauseVideo: () => playerRef.current?.pauseVideo(),
              });
            }
          },
        },
      });
    }

    if (window.YT?.Player) {
      createPlayer();
      return;
    }

    window.onYouTubeIframeAPIReady = createPlayer;

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.head.appendChild(script);

    return () => {
      playerRef.current?.destroy();
    };
  }, [youtubeId, registerPlayer]);

  return (
    <div className="w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
