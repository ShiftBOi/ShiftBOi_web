"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  DINO_HURT_FRAMES,
  DINO_JUMP_FRAMES,
  DINO_RUN_FRAMES,
  type DinoCell,
  type DinoTone,
} from "@/components/web/dino-frames";

type Pose = "run" | "jump" | "hurt";
type ObstacleKind = "cactus1" | "cactus2" | "cactus3";

type Obstacle = {
  id: number;
  kind: ObstacleKind;
  /** lane x: 0 left → 1 right */
  x: number;
  width: number;
  hit: boolean;
  /** pre-rolled: ~70% true → auto jump clears this hazard */
  clearable: boolean;
  /** jump already triggered for this obstacle */
  jumped: boolean;
};

const DINO_SIZE = 168;
const PARTICLE_DIV = 2;
const GRID = 24 * PARTICLE_DIV;

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

const POSE_FRAMES = {
  run: DINO_RUN_FRAMES,
  jump: DINO_JUMP_FRAMES,
  hurt: DINO_HURT_FRAMES,
} as const;

/** Pixel masks for ASCII cacti (# = body) */
const CACTUS_MASKS: Record<ObstacleKind, string[]> = {
  cactus1: [
    "....##......",
    "....##......",
    "....##.#....",
    "....##.#....",
    "..#.##.#....",
    "..#.##......",
    "..####......",
    "....##......",
    "....##......",
    "....##......",
    "....##......",
    "....##......",
    "....##......",
    "....##......",
    "....##......",
    "....##......",
  ],
  cactus2: [
    "...##.....##...",
    "...##.....##...",
    "...##.#...##.#.",
    "...##.#...##.#.",
    ".#.##.#.#.##.#.",
    ".#.##...#.##...",
    ".####...####...",
    "...##.....##...",
    "...##.....##...",
    "...##.....##...",
    "...##.....##...",
    "...##.....##...",
    "...##.....##...",
    "...##.....##...",
  ],
  cactus3: [
    "..##....",
    "..##....",
    "..##.#..",
    ".###.#..",
    ".#.##...",
    "..##....",
    "..##....",
    "..##....",
    "..##....",
    "..##....",
  ],
};

const OBSTACLE_LANE_W: Record<ObstacleKind, number> = {
  cactus1: 0.055,
  cactus2: 0.08,
  cactus3: 0.045,
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

function maskToCells(mask: string[]): DinoCell[] {
  const cells: DinoCell[] = [];
  for (let y = 0; y < mask.length; y++) {
    const row = mask[y] ?? "";
    for (let x = 0; x < row.length; x++) {
      if (row[x] === "#") {
        cells.push({ x, y, tone: y < 2 ? "g1" : "g2" });
      }
    }
  }
  return cells;
}

function AsciiGlyphs({
  cells,
  scramble,
  reduced,
  cellSize = 5,
  opacity = 1,
}: {
  cells: DinoCell[];
  scramble: boolean;
  reduced: boolean;
  cellSize?: number;
  opacity?: number;
}) {
  const [glyphs, setGlyphs] = useState<string[]>(() =>
    cells.map((c) => SETTLE_CHARS[c.tone]),
  );

  const maxX = cells.reduce((m, c) => Math.max(m, c.x), 0) + 1;
  const maxY = cells.reduce((m, c) => Math.max(m, c.y), 0) + 1;

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
        cells.map((cell) =>
          Math.random() > 0.88 ? SETTLE_CHARS[cell.tone] : randomChar(),
        ),
      );
    }, 36);
    return () => window.clearInterval(tick);
  }, [cells, reduced, scramble]);

  return (
    <svg
      viewBox={`0 0 ${maxX} ${maxY}`}
      width={maxX * cellSize}
      height={maxY * cellSize}
      aria-hidden
      className="block"
      style={{ opacity }}
    >
      {cells.map((cell, i) => (
        <text
          key={`${cell.x}-${cell.y}-${i}`}
          x={cell.x + 0.5}
          y={cell.y + 0.78}
          textAnchor="middle"
          fill={TONE_FILL[cell.tone]}
          fontFamily="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
          fontSize="0.95"
          style={{ userSelect: "none" }}
        >
          {glyphs[i] ?? SETTLE_CHARS[cell.tone]}
        </text>
      ))}
    </svg>
  );
}

function AsciiDino({
  pose,
  frame,
  scramble,
  reduced,
}: {
  pose: Pose;
  frame: number;
  scramble: boolean;
  reduced: boolean;
}) {
  const sheet = POSE_FRAMES[pose];
  const source = sheet[frame % sheet.length] ?? sheet[0]!;
  const cells = useMemo(() => densify(source), [source]);

  return (
    <svg
      viewBox={`0 0 ${GRID} ${GRID}`}
      width={DINO_SIZE}
      height={DINO_SIZE}
      aria-hidden
      className="block"
    >
      <AsciiDinoInner cells={cells} scramble={scramble} reduced={reduced} />
    </svg>
  );
}

/** Inner text layer so densified dino keeps fixed 72 viewBox */
function AsciiDinoInner({
  cells,
  scramble,
  reduced,
}: {
  cells: DinoCell[];
  scramble: boolean;
  reduced: boolean;
}) {
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
        cells.map((cell) =>
          Math.random() > 0.88 ? SETTLE_CHARS[cell.tone] : randomChar(),
        ),
      );
    }, 32);
    return () => window.clearInterval(tick);
  }, [cells, reduced, scramble]);

  return (
    <>
      {cells.map((cell, i) => (
        <text
          key={`${cell.x}-${cell.y}-${i}`}
          x={cell.x + 0.5}
          y={cell.y + 0.78}
          textAnchor="middle"
          fill={TONE_FILL[cell.tone]}
          fontFamily="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
          fontSize="0.9"
          style={{ userSelect: "none" }}
        >
          {glyphs[i] ?? SETTLE_CHARS[cell.tone]}
        </text>
      ))}
    </>
  );
}

function AsciiCactus({
  kind,
  hit,
  scramble,
  reduced,
}: {
  kind: ObstacleKind;
  hit: boolean;
  scramble: boolean;
  reduced: boolean;
}) {
  const cells = useMemo(() => maskToCells(CACTUS_MASKS[kind]), [kind]);
  return (
    <AsciiGlyphs
      cells={cells}
      scramble={scramble && !hit}
      reduced={reduced}
      cellSize={SCALE_CACTUS}
      opacity={hit ? 0.35 : 1}
    />
  );
}

const SCALE_CACTUS = 6;

function spawnObstacle(id: number): Obstacle {
  const roll = Math.random();
  const kind: ObstacleKind =
    roll < 0.45 ? "cactus1" : roll < 0.75 ? "cactus3" : "cactus2";
  return {
    id,
    kind,
    x: 1.12,
    width: OBSTACLE_LANE_W[kind],
    hit: false,
    // 70% jump-pass, 30% hurt
    clearable: Math.random() < 0.7,
    jumped: false,
  };
}

function useChromeDinoLoop(enabled: boolean) {
  const [pose, setPose] = useState<Pose>("run");
  const [frame, setFrame] = useState(0);
  const [jumpY, setJumpY] = useState(0);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);

  const poseRef = useRef<Pose>("run");
  const frameRef = useRef(0);
  const jumpTRef = useRef(0);
  const hurtTRef = useRef(0);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const speedRef = useRef(0.28);
  const nextSpawnRef = useRef(1.1);
  const idRef = useRef(1);
  const animAccRef = useRef(0);
  /** while jumping for a clearable obstacle, ignore hurt */
  const clearingRef = useRef(false);

  useEffect(() => {
    poseRef.current = pose;
  }, [pose]);

  useEffect(() => {
    if (!enabled) return;

    let raf = 0;
    let last = performance.now();

    const startJump = () => {
      poseRef.current = "jump";
      setPose("jump");
      jumpTRef.current = 0;
      frameRef.current = 0;
      setFrame(0);
    };

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      speedRef.current = Math.min(0.45, speedRef.current + dt * 0.004);

      let poseNow = poseRef.current;
      const frameCount = POSE_FRAMES[poseNow].length;

      if (poseNow === "jump") {
        jumpTRef.current += dt / 0.55;
        const t = Math.min(1, jumpTRef.current);
        setJumpY(4 * t * (1 - t));

        animAccRef.current += dt;
        if (animAccRef.current >= 0.08) {
          animAccRef.current = 0;
          frameRef.current = (frameRef.current + 1) % frameCount;
          setFrame(frameRef.current);
        }

        if (t >= 1) {
          poseNow = "run";
          poseRef.current = "run";
          setPose("run");
          setJumpY(0);
          jumpTRef.current = 0;
          clearingRef.current = false;
          frameRef.current = 0;
          setFrame(0);
        }
      } else if (poseNow === "hurt") {
        hurtTRef.current += dt;
        animAccRef.current += dt;
        if (animAccRef.current >= 0.1) {
          animAccRef.current = 0;
          frameRef.current = (frameRef.current + 1) % frameCount;
          setFrame(frameRef.current);
        }
        if (hurtTRef.current >= 0.85) {
          poseNow = "run";
          poseRef.current = "run";
          setPose("run");
          hurtTRef.current = 0;
          frameRef.current = 0;
          setFrame(0);
          obstaclesRef.current = obstaclesRef.current.filter((o) => !o.hit);
        }
      } else {
        animAccRef.current += dt;
        if (animAccRef.current >= 0.07) {
          animAccRef.current = 0;
          frameRef.current = (frameRef.current + 1) % frameCount;
          setFrame(frameRef.current);
        }
      }

      const scrollMul = poseNow === "hurt" ? 0.12 : 1;
      const moved = obstaclesRef.current
        .map((o) => ({
          ...o,
          x: o.x - speedRef.current * dt * scrollMul,
        }))
        .filter((o) => o.x > -0.2);

      nextSpawnRef.current -= dt;
      if (nextSpawnRef.current <= 0 && poseNow !== "hurt") {
        const lastX = moved.reduce((m, o) => Math.max(m, o.x), 0);
        if (lastX < 0.68) {
          moved.push(spawnObstacle(idRef.current++));
          nextSpawnRef.current = 1.0 + Math.random() * 1.5;
        } else {
          nextSpawnRef.current = 0.25;
        }
      }

      const DINO_X = 0.1;
      const DINO_W = 0.09;

      for (const o of moved) {
        const approaching = o.x < DINO_X + 0.32 && o.x > DINO_X + 0.04;
        const overlap =
          o.x < DINO_X + DINO_W && o.x + o.width > DINO_X - 0.01;

        // 70% clearable → jump early and never hurt on this cactus
        if (
          poseNow === "run" &&
          approaching &&
          o.clearable &&
          !o.jumped
        ) {
          o.jumped = true;
          clearingRef.current = true;
          startJump();
          poseNow = "jump";
          break;
        }

        // 30% fail → either miss jump or jump too late → hurt
        if (poseNow === "run" && approaching && !o.clearable && !o.jumped) {
          // sometimes attempt a late/bad jump (still hits), sometimes no jump
          o.jumped = true;
          if (Math.random() < 0.35) {
            clearingRef.current = false;
            startJump();
            poseNow = "jump";
          }
          break;
        }

        if (!overlap || poseNow === "hurt" || o.hit) continue;

        if (o.clearable || clearingRef.current) {
          // successful pass — no hurt
          continue;
        }

        // failed encounter
        o.hit = true;
        poseNow = "hurt";
        poseRef.current = "hurt";
        setPose("hurt");
        hurtTRef.current = 0;
        setJumpY(0);
        clearingRef.current = false;
        frameRef.current = 0;
        setFrame(0);
        break;
      }

      // rare idle hop only when lane is empty
      if (
        poseNow === "run" &&
        moved.length === 0 &&
        Math.random() < dt * 0.04
      ) {
        clearingRef.current = true;
        startJump();
        poseNow = "jump";
      }

      obstaclesRef.current = moved;
      setObstacles([...moved]);

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [enabled]);

  return { pose, frame, jumpY, obstacles };
}

export function DinoDashStage() {
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

  const enabled = ready && !reduced;
  const { pose, frame, jumpY, obstacles } = useChromeDinoLoop(enabled);

  const liftPx = jumpY * (DINO_SIZE * 0.55);
  const groundNudge = DINO_SIZE * 0.14;

  return (
    <div
      aria-label="Dino run"
      className="pointer-events-none absolute bottom-[14px] left-[36%] right-4 z-[1] hidden h-[200px] md:block"
    >
      <div className="absolute inset-0 overflow-hidden">
        {obstacles.map((o) => (
          <div
            key={o.id}
            className="absolute bottom-[2px]"
            style={{ left: `${o.x * 100}%` }}
          >
            <AsciiCactus
              kind={o.kind}
              hit={o.hit}
              scramble={enabled}
              reduced={reduced}
            />
          </div>
        ))}
      </div>

      <div
        className="absolute bottom-0 left-0 will-change-transform"
        style={{
          transform: `translateY(${groundNudge - liftPx}px)`,
        }}
      >
        <AsciiDino
          pose={pose}
          frame={frame}
          scramble={enabled}
          reduced={reduced}
        />
      </div>
    </div>
  );
}

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
