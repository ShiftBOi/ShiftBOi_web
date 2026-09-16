"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DINO_HURT_FRAMES,
  DINO_JUMP_FRAMES,
  DINO_RUN_FRAMES,
  type DinoCell,
  type DinoTone,
} from "@/components/web/dino-frames";

type Pose = "run" | "jump" | "hurt";
type ObstacleKind = "cactus1" | "cactus2" | "cactus3";
type JumpPlan = "clear" | "late" | "none";

type Obstacle = {
  id: number;
  kind: ObstacleKind;
  x: number;
  width: number;
  hit: boolean;
  /** ~80% clear, ~12% late misjump, ~8% no-jump */
  plan: JumpPlan;
  reacted: boolean;
};

const DINO_SIZE = 220;
const PARTICLE_DIV = 2;
const GRID = 24 * PARTICLE_DIV;
const PIX_FONT = "Pix32, ui-monospace, monospace";
/** Chrome ratio: cactus shorter than dino */
const SCALE_CACTUS = 7;

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
  ],
};

const OBSTACLE_LANE_W: Record<ObstacleKind, number> = {
  cactus1: 0.05,
  cactus2: 0.09, // double cluster — wider hitbox
  cactus3: 0.04,
};

/** Extra lead distance so wide clusters get an earlier / farther jump */
const JUMP_LEAD: Record<ObstacleKind, number> = {
  cactus1: 1,
  cactus2: 1.45,
  cactus3: 0.92,
};

/** Jump power boost for clearing wide 2-asset clusters */
const JUMP_POWER: Record<ObstacleKind, number> = {
  cactus1: 1,
  cactus2: 1.22,
  cactus3: 0.95,
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
          key={`${cell.x}-${cell.y}`}
          x={cell.x + 0.5}
          y={cell.y + 0.78}
          textAnchor="middle"
          fill={TONE_FILL[cell.tone]}
          fontFamily={PIX_FONT}
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
  const [glyphs, setGlyphs] = useState<string[]>(() =>
    cells.map((c) => SETTLE_CHARS[c.tone]),
  );
  const cellsKeyRef = useRef("");

  useEffect(() => {
    const key = `${pose}:${frame}:${cells.length}`;
    if (key === cellsKeyRef.current) return;
    cellsKeyRef.current = key;
    setGlyphs(cells.map((c) => (reduced ? SETTLE_CHARS[c.tone] : randomChar())));
  }, [cells, frame, pose, reduced]);

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
    }, 40);
    return () => window.clearInterval(tick);
  }, [cells, reduced, scramble]);

  return (
    <svg
      viewBox={`0 0 ${GRID} ${GRID}`}
      width={DINO_SIZE}
      height={DINO_SIZE}
      aria-hidden
      className="block"
    >
      {cells.map((cell, i) => (
        <text
          key={`${cell.x}-${cell.y}`}
          x={cell.x + 0.5}
          y={cell.y + 0.78}
          textAnchor="middle"
          fill={TONE_FILL[cell.tone]}
          fontFamily={PIX_FONT}
          fontSize="0.9"
          style={{ userSelect: "none" }}
        >
          {glyphs[i] ?? SETTLE_CHARS[cell.tone]}
        </text>
      ))}
    </svg>
  );
}

const AsciiDinoView = memo(AsciiDino);

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

function spawnObstacle(id: number): Obstacle {
  const roll = Math.random();
  const kind: ObstacleKind =
    roll < 0.5 ? "cactus1" : roll < 0.78 ? "cactus3" : "cactus2";
  const r = Math.random();
  const plan: JumpPlan = r < 0.8 ? "clear" : r < 0.92 ? "late" : "none";

  return {
    id,
    kind,
    x: 1.15,
    width: OBSTACLE_LANE_W[kind],
    hit: false,
    plan,
    reacted: false,
  };
}

/**
 * Chrome-like auto runner with ASCII sprites.
 * Jump lift via DOM (smooth projectile, no SVG remount blink).
 * One locked air frame + ASCII scramble stays on during jump.
 */
function useChromeDinoLoop(
  enabled: boolean,
  onJumpLift?: (lift01: number) => void,
  onObstaclesPaint?: (obstacles: Obstacle[]) => void,
) {
  const [pose, setPose] = useState<Pose>("run");
  const [frame, setFrame] = useState(0);
  const [obstacleSnapshot, setObstacleSnapshot] = useState<Obstacle[]>([]);

  const poseRef = useRef<Pose>("run");
  const frameRef = useRef(0);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const speedRef = useRef(0.24);
  const nextSpawnRef = useRef(2.5);
  const idRef = useRef(1);
  const animAccRef = useRef(0);
  const runningTimeRef = useRef(0);
  const velYRef = useRef(0);
  const yRef = useRef(0);
  const clearingIdRef = useRef<number | null>(null);
  const jumpPowerRef = useRef<"full" | "weak">("full");
  const jumpKindRef = useRef<ObstacleKind>("cactus1");
  const lastObstacleKeyRef = useRef("");

  const JUMP_V = 3.2;
  const JUMP_V_WEAK = 1.05;
  const GRAVITY = 6.0;
  const CLEAR_Y = 0.3;
  const DINO_X = 0.12;
  const DINO_W = 0.065;
  const AIR_FRAME = 1;

  useEffect(() => {
    poseRef.current = pose;
  }, [pose]);

  useEffect(() => {
    if (!enabled) return;

    let raf = 0;
    let last = performance.now();
    let hurtUntil = 0;

    const setPoseNow = (next: Pose) => {
      poseRef.current = next;
      setPose(next);
      animAccRef.current = 0;
    };

    const paintLift = (lift01: number) => {
      onJumpLift?.(lift01);
    };

    const syncObstacles = (moved: Obstacle[], force = false) => {
      onObstaclesPaint?.(moved);
      const key = moved
        .map((o) => `${o.id}:${o.kind}:${o.hit ? 1 : 0}`)
        .join("|");
      if (force || key !== lastObstacleKeyRef.current) {
        lastObstacleKeyRef.current = key;
        setObstacleSnapshot(moved.map((o) => ({ ...o })));
      }
    };

    const startJump = (power: "full" | "weak", kind: ObstacleKind = "cactus1") => {
      if (poseRef.current !== "run") return false;
      jumpPowerRef.current = power;
      jumpKindRef.current = kind;
      const boost = power === "full" ? JUMP_POWER[kind] : 1;
      velYRef.current =
        (power === "full" ? JUMP_V : JUMP_V_WEAK) * boost;
      // slightly lower gravity on wide clears = longer / farther hang time
      yRef.current = 0.002;
      setPoseNow("jump");
      frameRef.current = AIR_FRAME;
      setFrame(AIR_FRAME);
      return true;
    };

    const triggerHurt = (o: Obstacle, nowMs: number) => {
      o.hit = true;
      clearingIdRef.current = null;
      velYRef.current = 0;
      yRef.current = 0;
      paintLift(0);
      setPoseNow("hurt");
      frameRef.current = 0;
      setFrame(0);
      hurtUntil = nowMs + 850;
    };

    const step = (now: number) => {
      const dt = Math.min(0.04, (now - last) / 1000);
      last = now;
      runningTimeRef.current += dt;

      speedRef.current = Math.min(0.4, speedRef.current + dt * 0.0032);

      let poseNow = poseRef.current;
      const frameCount = POSE_FRAMES[poseNow].length;
      const speed = speedRef.current;
      const timeToPeak = JUMP_V / GRAVITY;
      const baseDist = Math.min(0.26, Math.max(0.13, speed * timeToPeak * 0.98));
      // Wide double-cactus: lower gravity while clearing for farther hang
      const gravNow =
        poseNow === "jump" &&
        jumpPowerRef.current === "full" &&
        jumpKindRef.current === "cactus2"
          ? GRAVITY * 0.82
          : GRAVITY;

      if (poseNow === "hurt") {
        animAccRef.current += dt;
        if (animAccRef.current >= 0.1) {
          animAccRef.current = 0;
          frameRef.current = (frameRef.current + 1) % frameCount;
          setFrame(frameRef.current);
        }
        if (now >= hurtUntil) {
          obstaclesRef.current = obstaclesRef.current.filter((o) => !o.hit);
          syncObstacles(obstaclesRef.current, true);
          yRef.current = 0;
          velYRef.current = 0;
          paintLift(0);
          clearingIdRef.current = null;
          setPoseNow("run");
          frameRef.current = 0;
          setFrame(0);
          poseNow = "run";
        }
      } else if (poseNow === "jump") {
        velYRef.current -= gravNow * dt;
        yRef.current += velYRef.current * dt;

        const peakV =
          jumpPowerRef.current === "full"
            ? JUMP_V * JUMP_POWER[jumpKindRef.current]
            : JUMP_V_WEAK;
        const peak = (peakV * peakV) / (2 * gravNow);

        if (yRef.current <= 0) {
          yRef.current = 0;
          velYRef.current = 0;
          paintLift(0);
          setPoseNow("run");
          frameRef.current = 0;
          setFrame(0);
          poseNow = "run";
        } else {
          paintLift(Math.min(1, yRef.current / Math.max(0.35, peak)));
        }
      } else {
        animAccRef.current += dt;
        if (animAccRef.current >= 0.07) {
          animAccRef.current = 0;
          frameRef.current = (frameRef.current + 1) % frameCount;
          setFrame(frameRef.current);
        }
      }

      const scrollMul = poseNow === "hurt" ? 0.08 : 1;
      const moved = obstaclesRef.current
        .map((o) => ({
          ...o,
          x: o.x - speed * dt * scrollMul,
        }))
        .filter((o) => o.x > -0.2);

      nextSpawnRef.current -= dt;
      if (
        nextSpawnRef.current <= 0 &&
        poseNow !== "hurt" &&
        runningTimeRef.current > 2.2
      ) {
        const lastX = moved.reduce((m, o) => Math.max(m, o.x), 0);
        const minGap = 0.7 + speed * 0.65;
        if (lastX < 1.1 - minGap) {
          moved.push(spawnObstacle(idRef.current++));
          nextSpawnRef.current = 1.05 + Math.random() * 1.15;
        } else {
          nextSpawnRef.current = 0.12;
        }
      }

      for (const o of moved) {
        const dist = o.x - DINO_X;
        const overlap =
          o.x < DINO_X + DINO_W && o.x + o.width > DINO_X - 0.01;

        if (!o.reacted && poseNow === "run" && dist > 0) {
          const goodDist = Math.min(
            0.36,
            Math.max(0.13, baseDist * JUMP_LEAD[o.kind]),
          );

          if (o.plan === "clear" && dist <= goodDist && dist > goodDist * 0.55) {
            o.reacted = true;
            if (startJump("full", o.kind)) {
              clearingIdRef.current = o.id;
              poseNow = "jump";
            }
          } else if (o.plan === "late" && dist <= goodDist * 0.28) {
            o.reacted = true;
            if (startJump("weak", o.kind)) poseNow = "jump";
          } else if (o.plan === "none" && dist <= goodDist) {
            o.reacted = true;
          }
        }

        if (clearingIdRef.current === o.id) {
          if (o.x + o.width < DINO_X - 0.03) {
            clearingIdRef.current = null;
          }
          continue;
        }

        if (overlap && !o.hit && poseNow !== "hurt" && yRef.current < CLEAR_Y) {
          triggerHurt(o, now);
          poseNow = "hurt";
          break;
        }
      }

      obstaclesRef.current = moved;
      syncObstacles(moved);
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [enabled, onJumpLift, onObstaclesPaint]);

  return { pose, frame, obstacles: obstacleSnapshot };
}

export function DinoDashStage() {
  const [reduced, setReduced] = useState(false);
  const [ready, setReady] = useState(false);
  const liftRef = useRef<HTMLDivElement>(null);
  const obstacleLayerRef = useRef<HTMLDivElement>(null);
  const groundNudge = DINO_SIZE * 0.16;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    setReady(true);
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const onJumpLift = useCallback(
    (lift01: number) => {
      const el = liftRef.current;
      if (!el) return;
      const liftPx = lift01 * (DINO_SIZE * 0.62);
      el.style.transform = `translate3d(0, ${groundNudge - liftPx}px, 0)`;
    },
    [groundNudge],
  );

  const onObstaclesPaint = useCallback((list: Obstacle[]) => {
    const root = obstacleLayerRef.current;
    if (!root) return;
    for (const node of root.querySelectorAll<HTMLElement>("[data-oid]")) {
      const id = Number(node.dataset.oid);
      const o = list.find((item) => item.id === id);
      if (!o) continue;
      node.style.left = `${o.x * 100}%`;
      node.style.opacity = o.hit ? "0.35" : "1";
    }
  }, []);

  const enabled = ready && !reduced;
  const { pose, frame, obstacles } = useChromeDinoLoop(
    enabled,
    onJumpLift,
    onObstaclesPaint,
  );

  return (
    <div
      aria-label="Dino run"
      className="pointer-events-none absolute bottom-[14px] left-[44%] right-4 z-[1] hidden h-[280px] md:block"
    >
      <div ref={obstacleLayerRef} className="absolute inset-0 overflow-hidden">
        {obstacles.map((o) => (
          <div
            key={o.id}
            data-oid={o.id}
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
        ref={liftRef}
        className="absolute bottom-0 left-0 will-change-transform"
        style={{ transform: `translate3d(0, ${groundNudge}px, 0)` }}
      >
        <AsciiDinoView
          pose={pose}
          frame={frame}
          scramble={enabled}
          reduced={reduced}
        />
      </div>
    </div>
  );
}

/** Thin spacer — ground for the dino above the velocity strip */
export function DinoDashHorizon() {
  return (
    <div
      aria-hidden
      className="relative h-[14px] shrink-0 overflow-hidden bg-black"
    />
  );
}
