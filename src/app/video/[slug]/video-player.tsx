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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function onReady() {
      if (playerRef.current) {
        console.log("[VideoPlayer] onReady fired, registering player interface");
        registerPlayer({
          seekTo: (s, a) => {
            console.log("[VideoPlayer] registered seekTo called", s, a, "player exists:", !!playerRef.current);
            playerRef.current?.seekTo(s, a);
          },
          getCurrentTime: () => playerRef.current?.getCurrentTime() ?? 0,
          playVideo: () => {
            console.log("[VideoPlayer] registered playVideo called, player exists:", !!playerRef.current);
            playerRef.current?.playVideo();
          },
          pauseVideo: () => playerRef.current?.pauseVideo(),
        });
      } else {
        console.warn("[VideoPlayer] onReady fired but playerRef.current is null!");
      }
    }

    function createPlayer() {
      if (!window.YT?.Player || !container) return;
      playerRef.current = new YT.Player(container, {
        videoId: youtubeId,
        height: "100%",
        width: "100%",
        playerVars: {
          rel: 0,
          modestbranding: 1,
        },
        events: { onReady },
      });
    }

    if (window.YT?.Player) {
      createPlayer();
    } else {
      window.onYouTubeIframeAPIReady = createPlayer;
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.head.appendChild(script);
    }

    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [youtubeId, registerPlayer]);

  return (
    <div className="w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
