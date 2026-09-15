"use client";

import { useEffect, useState } from "react";
import { DINO_FRAMES, type DinoTone } from "@/components/web/dino-frames";

const GEN_CHARS = Array.from("01<>{}[]/\\|#*+=.:;░▒▓█@%xoXO*!^~$");
const SETTLE_CHARS: Record<DinoTone, string> = {
  g1: "▒",
  g2: "▓",
  b1: "░",
  b2: "▒",
  p: "█",
  w: "●",
};

const TONE_FILL: Record<DinoTone, string> = {
  g1: "#9a9a9a",
  g2: "#6e6e6e",
  b1: "#f4c186",
  b2: "#bb9465",
  p: "#ac67ff",
  w: "#ffffff",
};

function randomChar() {
  return GEN_CHARS[Math.floor(Math.random() * GEN_CHARS.length)] ?? "#";
}

function AsciiDino({
  frameIndex,
  scramble,
  reduced,
}: {
  frameIndex: number;
  scramble: boolean;
  reduced: boolean;
}) {
  const cells = DINO_FRAMES[frameIndex] ?? DINO_FRAMES[0];
  const [glyphs, setGlyphs] = useState<string[]>(() =>
    cells.map((c) => SETTLE_CHARS[c.tone]),
  );

  useEffect(() => {
    setGlyphs(cells.map((c) => (reduced ? SETTLE_CHARS[c.tone] : randomChar())));
  }, [cells, frameIndex, reduced]);

  useEffect(() => {
    if (reduced || !scramble) {
      setGlyphs(cells.map((c) => SETTLE_CHARS[c.tone]));
      return;
    }

    const tick = window.setInterval(() => {
      setGlyphs(
        cells.map((cell) => {
          // rare settle flashes — mostly hard scramble
          if (Math.random() > 0.88) return SETTLE_CHARS[cell.tone];
          return randomChar();
        }),
      );
    }, 32);

    return () => window.clearInterval(tick);
  }, [cells, reduced, scramble]);

  return (
    <svg
      className="dino-dash-sprite"
      viewBox="0 0 24 24"
      width="96"
      height="96"
      aria-hidden
      role="img"
    >
      <title>ASCII dino</title>
      {cells.map((cell, i) => (
        <text
          key={`${cell.x}-${cell.y}-${i}`}
          x={cell.x + 0.5}
          y={cell.y + 0.82}
          textAnchor="middle"
          fill={TONE_FILL[cell.tone]}
          fontFamily="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
          fontSize="1.05"
          style={{ userSelect: "none" }}
        >
          {glyphs[i] ?? SETTLE_CHARS[cell.tone]}
        </text>
      ))}
    </svg>
  );
}

export function DinoDashHorizon() {
  const [frame, setFrame] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    setReady(true);
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!ready || reduced) return;
    const run = window.setInterval(() => {
      setFrame((f) => (f + 1) % DINO_FRAMES.length);
    }, 90);
    return () => window.clearInterval(run);
  }, [ready, reduced]);

  return (
    <section
      aria-label="Dino dash"
      className="relative overflow-hidden bg-black"
    >
      {/* clean purple horizon divider */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col gap-[6px]">
        <div className="h-px w-full bg-[var(--color-violet)]" />
        <div className="h-px w-full bg-[var(--color-violet)]" />
      </div>

      <div className="relative h-[156px] overflow-hidden">
        <div className="dino-dash-runner absolute bottom-[4px] flex items-end">
          <AsciiDino
            frameIndex={frame}
            scramble={ready && !reduced}
            reduced={reduced}
          />
        </div>
      </div>
    </section>
  );
}
