"use client";

import { useEffect, useRef, useState } from "react";
import { claimStreamingReward } from "@/lib/actions/streaming";
import { SpotifyReleasePlayer } from "./SpotifyReleasePlayer";

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement,
        options: {
          videoId: string;
          playerVars?: Record<string, string | number>;
          events?: { onStateChange?: (event: { data: number }) => void };
        }
      ) => { getCurrentTime: () => number; destroy: () => void };
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
      ready?: (callback: () => void) => void;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export function FeaturedReleasePlayer({ title, videoId, spotifyTrackId }: { title: string; videoId: string; spotifyTrackId?: string | null }) {
  const playerElement = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const minuteClaimed = useRef(false);
  const completeClaimed = useRef(false);
  const [rewardText, setRewardText] = useState("Watch for 1 minute to earn +10 points.");

  useEffect(() => {
    let player: { getCurrentTime: () => number; destroy: () => void } | null = null;
    let disposed = false;

    const clearTimer = () => {
      if (timer.current) clearInterval(timer.current);
      timer.current = null;
    };
    const claim = async (milestone: "ONE_MINUTE" | "COMPLETED") => {
      const result = await claimStreamingReward(videoId, milestone);
      if (result.awarded > 0) setRewardText(`+${result.awarded} points earned! ${milestone === "COMPLETED" ? "Thanks for streaming KAIA!" : "Finish the song for +50 more."}`);
    };
    const startTimer = () => {
      if (timer.current) return;
      timer.current = setInterval(() => {
        if (!minuteClaimed.current && (player?.getCurrentTime() ?? 0) >= 60) {
          minuteClaimed.current = true;
          void claim("ONE_MINUTE");
        }
      }, 1000);
    };
    const createPlayer = () => {
      if (disposed || !playerElement.current || !window.YT) return;
      player = new window.YT.Player(playerElement.current, {
        videoId,
        playerVars: { autoplay: 0, rel: 0, playsinline: 1 },
        events: {
          onStateChange: ({ data }) => {
            if (!window.YT) return;
            if (data === window.YT.PlayerState.PLAYING) startTimer();
            else if (data === window.YT.PlayerState.ENDED) {
              clearTimer();
              if (!completeClaimed.current) {
                completeClaimed.current = true;
                void claim("COMPLETED");
              }
            } else if (data === window.YT.PlayerState.PAUSED) clearTimer();
          },
        },
      });
    };

    if (window.YT?.Player) createPlayer();
    else {
      const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      window.onYouTubeIframeAPIReady = createPlayer;
      if (!existingScript) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(script);
      }
    }

    return () => {
      disposed = true;
      clearTimer();
      player?.destroy();
    };
  }, [videoId]);

  return (
    <section style={{ marginBottom: 24, background: "linear-gradient(135deg, rgba(236,72,153,0.13), rgba(139,92,246,0.13))", border: "1px solid rgba(236,72,153,0.28)", borderRadius: 18, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "start", marginBottom: 14 }}>
        <div>
          <p style={{ color: "#f9a8d4", fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", marginBottom: 4 }}>NOW STREAMING · KAIA LATEST RELEASE</p>
          <h2 style={{ color: "white", fontSize: 19, fontWeight: 800 }}>{title}</h2>
        </div>
        <span style={{ color: "#fde68a", fontSize: 12, fontWeight: 800, whiteSpace: "nowrap" }}>🎵 +10 / +50 PTS</span>
      </div>
      <div style={{ borderRadius: 12, overflow: "hidden", aspectRatio: "16 / 9", background: "#0a0a0f" }}>
        <div ref={playerElement} style={{ width: "100%", height: "100%" }} />
      </div>
      <p style={{ color: "#cbd5e1", fontSize: 12, marginTop: 12 }}>{rewardText}</p>
      {spotifyTrackId && <SpotifyReleasePlayer trackId={spotifyTrackId} />}
    </section>
  );
}
