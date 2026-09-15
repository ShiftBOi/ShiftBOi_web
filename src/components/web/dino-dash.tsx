"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DINO_FRAMES,
  type DinoCell,
  type DinoTone,
} from "@/components/web/dino-frames";

/** Each source pixel → N×N smaller ASCII particles */
const PARTICLE_DIV = 3;
const GRID = 24 * PARTICLE_DIV; // 72
const DISPLAY_PX = 504;

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

function densify(frame: DinoCell[]): DinoCell[] {
  const out: DinoCell[] = [];
  for (const cell of frame) {
    for (let dy = 0; dy < PARTICLE_DIV; dy++) {
      for (let dx = 0; dx < PARTICLE_DIV; dx++) {
        out.push({
          x: cell.x * PARTICLE_DIV + dx,
          y: cell.y * PARTICLE_DIV + dy,
          tone: cell.tone,
        });
      }
    }
  }
  return out;
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
  const source = DINO_FRAMES[frameIndex] ?? DINO_FRAMES[0];
  const cells = useMemo(() => densify(source), [source]);
  const [glyphs, setGlyphs] = useState<string[]>(() =>
    cells.map((c) => SETTLE_CHARS[c.tone]),
  );

  useEffect(() => {
    setGlyphs(cells.map((c) => (reduced ? SETTLE_CHARS[c.tone] : randomChar())));
  }, [cells, reduced]);

  useEffect(() => {
    if (reduced || !scramble) {
      setGlyphs(cells.map((c) => SETTLE_CHARS[c.tone]));
      return;
    }

    const tick = window.setInterval(() => {
      setGlyphs(
        cells.map((cell) => {
          if (Math.random() > 0.88) return SETTLE_CHARS[cell.tone];
          return randomChar();
        }),
      );
    }, 32);

    return () => window.clearInterval(tick);
  }, [cells, reduced, scramble]);

  return (
    <svg
      className="dino-dash-sprite h-auto w-[min(504px,100%)]"
      viewBox={`0 0 ${GRID} ${GRID}`}
      width={DISPLAY_PX}
      height={DISPLAY_PX}
      aria-hidden
      role="img"
    >
      <title>ASCII dino</title>
      {cells.map((cell, i) => (
        <text
          key={`${cell.x}-${cell.y}-${i}`}
          x={cell.x + 0.5}
          y={cell.y + 0.78}
          textAnchor="middle"
          fill={TONE_FILL[cell.tone]}
          fontFamily="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
          fontSize="0.82"
          style={{ userSelect: "none" }}
        >
          {glyphs[i] ?? SETTLE_CHARS[cell.tone]}
        </text>
      ))}
    </svg>
  );
}

function useDinoRun() {
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
    }, 70);
    return () => window.clearInterval(run);
  }, [ready, reduced]);

  return { frame, reduced, ready };
}

/** Big ASCII dino — planted on the purple horizon, right zone */
export function DinoDashStage() {
  const { frame, reduced, ready } = useDinoRun();

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute bottom-[14px] left-[36%] right-4 z-[1] hidden items-end justify-start overflow-visible lg:flex"
    >
      {/* pull feet onto the purple ground line (sprite has empty bottom padding) */}
      <div className="translate-y-[18%]">
        <AsciiDino
          frameIndex={frame}
          scramble={ready && !reduced}
          reduced={reduced}
        />
      </div>
    </div>
  );
}

/** Thin purple horizon — no hero height gain */
export function DinoDashHorizon() {
  return (
    <div
      aria-hidden
      className="relative h-[14px] shrink-0 overflow-hidden bg-black"
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col gap-[6px]">
        <div className="h-px w-full bg-[var(--color-violet)]" />
        <div className="h-px w-full bg-[var(--color-violet)]" />
      </div>
    </div>
  );
}
