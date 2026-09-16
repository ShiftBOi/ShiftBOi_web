"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./matrix-portrait.module.css";

/** Cubic hologram with independent head motion; pauses offscreen and respects reduced motion. */
export function MatrixPortrait() {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    const video = videoRef.current;
    if (!root || !video) return;

    video.loop = true;
    video.muted = true;
    video.playsInline = true;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    let disposed = false;

    const sync = () => {
      if (disposed || paused || !visible || document.hidden || motion.matches) {
        video.pause();
        return;
      }
      void video.play().catch((error: unknown) => {
        // Scrolling offscreen may intentionally abort a pending play request.
        if (disposed) return;
        if (error instanceof DOMException && error.name === "AbortError") return;
        // Keep trying on next visibility tick; don't lock into paused forever.
      });
    };

    const restartLoop = () => {
      if (disposed || paused || !visible || motion.matches) return;
      try {
        video.currentTime = 0;
      } catch {
        /* ignore seek errors on incomplete media */
      }
      void video.play().catch(() => {});
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { threshold: 0.05 },
    );
    observer.observe(root);
    motion.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    video.addEventListener("ended", restartLoop);

    sync();

    return () => {
      disposed = true;
      observer.disconnect();
      motion.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
      video.removeEventListener("ended", restartLoop);
      video.pause();
    };
  }, [paused]);

  return (
    <div ref={rootRef} className={styles.root}>
      <video
        ref={videoRef}
        className={styles.video}
        src="/videos/ai-hologram-purple-cubic.mp4"
        poster="/videos/ai-hologram-purple-cubic-poster.jpg"
        aria-label="Violet cubic AI hologram with square fractures and floating cubes, looking left and right while its shoulders remain still"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        onError={() => setUnavailable(true)}
      />
      <span className={styles.caption} aria-hidden>
        NEURAL PORTRAIT / 001
      </span>
      {!unavailable && (
        <button
          type="button"
          className={styles.playback}
          onClick={() => setPaused((value) => !value)}
          aria-label={paused ? "Resume hologram animation" : "Pause hologram animation"}
          aria-pressed={paused}
        >
          {paused ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
              <path d="M3 1.5 10 6 3 10.5Z" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
              <path d="M2 1h3v10H2zm5 0h3v10H7z" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
