"use client";

import { useEffect, useRef, useState } from "react";
import { SiteLoadingOverlay } from "@/components/web/site-loading-overlay";

import { INTRO_MIN_MS, INTRO_MAX_MS, INTRO_EXIT_MS } from "./site-loading-timing";

const BOOT_SEEN_KEY = "shiftboi-boot-seen";

export function SiteBootSplash() {
  // idle = wait for client check so returning visits never flash the overlay
  const [phase, setPhase] = useState<"idle" | "loading" | "leaving" | "done">("idle");
  const skipRef = useRef<() => void>(() => {});

  useEffect(() => {
    try {
      if (sessionStorage.getItem(BOOT_SEEN_KEY)) {
        setPhase("done");
        return;
      }
      sessionStorage.setItem(BOOT_SEEN_KEY, "1");
    } catch {
      // Private mode / blocked storage — still show once this mount
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const started = performance.now();
    const timers: ReturnType<typeof setTimeout>[] = [];
    let disposed = false;
    let dismissed = false;
    let loaded = document.readyState === "complete";
    let fontsReady = document.fonts.status === "loaded";

    setPhase("loading");
    document.documentElement.classList.add("hydra-booting");

    const leave = () => {
      if (disposed || dismissed) return;
      dismissed = true;
      setPhase("leaving");
      timers.push(
        setTimeout(() => {
          if (disposed) return;
          setPhase("done");
          document.documentElement.classList.remove("hydra-booting");
        }, reduced ? 150 : INTRO_EXIT_MS),
      );
    };
    const whenReady = () => {
      if (!loaded || !fontsReady || dismissed || disposed) return;
      timers.push(
        setTimeout(leave, Math.max(0, (reduced ? 0 : INTRO_MIN_MS) - (performance.now() - started))),
      );
    };
    const onLoad = () => {
      loaded = true;
      whenReady();
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") leave();
    };
    skipRef.current = leave;
    window.addEventListener("load", onLoad, { once: true });
    document.addEventListener("keydown", onEscape);
    void document.fonts.ready.then(() => {
      fontsReady = true;
      whenReady();
    });
    whenReady();
    timers.push(setTimeout(leave, reduced ? 1200 : INTRO_MAX_MS));

    return () => {
      disposed = true;
      skipRef.current = () => {};
      timers.forEach(clearTimeout);
      window.removeEventListener("load", onLoad);
      document.removeEventListener("keydown", onEscape);
      document.documentElement.classList.remove("hydra-booting");
    };
  }, []);

  if (phase === "idle" || phase === "done") return null;

  return (
    <SiteLoadingOverlay
      open
      leaving={phase === "leaving"}
      onSkip={() => skipRef.current()}
    />
  );
}
