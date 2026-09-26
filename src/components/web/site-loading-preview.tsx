"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SiteLoadingOverlay } from "./site-loading-overlay";
import { INTRO_EXIT_MS } from "./site-loading-timing";

/** A development-only workbench: the intro stays visible until the overlay is clicked or Escape is pressed. */
export function SiteLoadingPreview() {
  const [phase, setPhase] = useState<"loading" | "leaving" | "done">("loading");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const finish = () => {
    if (phase !== "loading") return;
    setPhase("leaving");
    timer.current = setTimeout(() => setPhase("done"), INTRO_EXIT_MS);
  };

  return (
    <>
      <main className="grid min-h-dvh place-content-center gap-6 bg-[#08070c] px-6 text-center text-white">
        <p className="font-mono text-xs tracking-widest text-violet-400">SHIFT / MOTION STUDY</p>
        <h1 className="font-pixel text-5xl">You&apos;re in.</h1>
        <p className="max-w-md text-sm leading-6 text-white/60">Four panels. One wordmark. Replay the sequence to see the entrance, then click anywhere or press Escape to see the reveal.</p>
        <button type="button" className="mx-auto min-h-11 border border-violet-400 px-6 text-sm text-violet-200 hover:bg-violet-500/15 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white" onClick={() => setPhase("loading")}>Replay intro</button>
        <Link href="/" className="mx-auto inline-flex min-h-11 items-center text-sm text-white/60 underline underline-offset-4">Back to the website</Link>
      </main>
      <SiteLoadingOverlay open={phase !== "done"} leaving={phase === "leaving"} onSkip={finish} />
    </>
  );
}
