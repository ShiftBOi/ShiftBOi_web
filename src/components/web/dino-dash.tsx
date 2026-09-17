"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import gsap from "gsap";
import {
  DINO_HURT_FRAMES,
  DINO_JUMP_FRAMES,
  DINO_RUN_FRAMES,
  type DinoCell,
  type DinoTone,
} from "@/components/web/dino-frames";

type Pose = "run" | "jump" | "hurt";
type GamePhase = "demo" | "entering" | "playing" | "dead";
type ObstacleKind = "cactus1" | "cactus2" | "cactus3";
type JumpPlan = "clear" | "late" | "none";

type Obstacle = {
  id: number;
  kind: ObstacleKind;
  x: number;
  width: number;
  hit: boolean;
  plan?: JumpPlan;
  reacted?: boolean;
};

const DINO_SIZE = 220;
const PARTICLE_DIV = 2;
const GRID = 24 * PARTICLE_DIV;
const PIX_FONT = "Pix32, ui-monospace, monospace";
const SCALE_CACTUS = 7;
/** Hurt frame that is fully white — freeze here after player death anim */
const WHITE_HURT_FRAME = 2;

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
  cactus2: 0.09,
  cactus3: 0.04,
};

const JUMP_LEAD: Record<ObstacleKind, number> = {
  cactus1: 1,
  cactus2: 1.45,
  cactus3: 0.92,
};

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

function spawnObstacle(
  id: number,
  withPlan: boolean,
  x = 1.12,
): Obstacle {
  const roll = Math.random();
  const kind: ObstacleKind =
    roll < 0.5 ? "cactus1" : roll < 0.78 ? "cactus3" : "cactus2";

  if (!withPlan) {
    return {
      id,
      kind,
      x,
      width: OBSTACLE_LANE_W[kind],
      hit: false,
    };
  }

  const r = Math.random();
  const plan: JumpPlan = r < 0.8 ? "clear" : r < 0.92 ? "late" : "none";
  return {
    id,
    kind,
    x,
    width: OBSTACLE_LANE_W[kind],
    hit: false,
    plan,
    reacted: false,
  };
}

/** Hero auto-runner — hurt then keep running (original behavior). */
function useDemoDinoLoop(
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
    if (!enabled) {
      obstaclesRef.current = [];
      lastObstacleKeyRef.current = "";
      setObstacleSnapshot([]);
      velYRef.current = 0;
      yRef.current = 0;
      onJumpLift?.(0);
      return;
    }

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

    const startJump = (
      power: "full" | "weak",
      kind: ObstacleKind = "cactus1",
    ) => {
      if (poseRef.current !== "run") return false;
      jumpPowerRef.current = power;
      jumpKindRef.current = kind;
      const boost = power === "full" ? JUMP_POWER[kind] : 1;
      velYRef.current = (power === "full" ? JUMP_V : JUMP_V_WEAK) * boost;
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
          // Keep obstacles scrolling — do not despawn on recover
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

      // World keeps moving at full speed while hurt (hero demo)
      const moved = obstaclesRef.current
        .map((o) => ({
          ...o,
          x: o.x - speed * dt,
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
          moved.push(spawnObstacle(idRef.current++, true));
          nextSpawnRef.current = 1.05 + Math.random() * 1.15;
        } else {
          nextSpawnRef.current = 0.12;
        }
      }

      for (const o of moved) {
        const dist = o.x - DINO_X;
        const overlap =
          o.x < DINO_X + DINO_W && o.x + o.width > DINO_X - 0.01;
        const plan = o.plan ?? "clear";

        if (!o.reacted && poseNow === "run" && dist > 0) {
          const goodDist = Math.min(
            0.36,
            Math.max(0.13, baseDist * JUMP_LEAD[o.kind]),
          );

          if (plan === "clear" && dist <= goodDist && dist > goodDist * 0.55) {
            o.reacted = true;
            if (startJump("full", o.kind)) {
              clearingIdRef.current = o.id;
              poseNow = "jump";
            }
          } else if (plan === "late" && dist <= goodDist * 0.28) {
            o.reacted = true;
            if (startJump("weak", o.kind)) poseNow = "jump";
          } else if (plan === "none" && dist <= goodDist) {
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

/** Player-controlled runner for /play */
function usePlayerDinoLoop(
  enabled: boolean,
  sessionId: number,
  onJumpLift?: (lift01: number) => void,
  onObstaclesPaint?: (obstacles: Obstacle[]) => void,
  onScore?: (score: number) => void,
  onDead?: (score: number) => void,
) {
  const [pose, setPose] = useState<Pose>("run");
  const [frame, setFrame] = useState(0);
  const [obstacleSnapshot, setObstacleSnapshot] = useState<Obstacle[]>([]);

  const poseRef = useRef<Pose>("run");
  const frameRef = useRef(0);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const speedRef = useRef(0.28);
  const nextSpawnRef = useRef(1.4);
  const idRef = useRef(1);
  const animAccRef = useRef(0);
  const runningTimeRef = useRef(0);
  const velYRef = useRef(0);
  const yRef = useRef(0);
  const scoreRef = useRef(0);
  const deadRef = useRef(false);
  const deathFrozenRef = useRef(false);
  const jumpQueuedRef = useRef(false);
  const lastObstacleKeyRef = useRef("");

  const JUMP_V = 3.35;
  const GRAVITY = 6.2;
  const CLEAR_Y = 0.28;
  const DINO_X = 0.12;
  const DINO_W = 0.065;
  const AIR_FRAME = 1;

  const requestJump = useCallback(() => {
    if (!enabled || deadRef.current) return;
    jumpQueuedRef.current = true;
  }, [enabled]);

  useEffect(() => {
    poseRef.current = pose;
  }, [pose]);

  useEffect(() => {
    if (!enabled) {
      deadRef.current = false;
      deathFrozenRef.current = false;
      scoreRef.current = 0;
      obstaclesRef.current = [];
      lastObstacleKeyRef.current = "";
      setObstacleSnapshot([]);
      velYRef.current = 0;
      yRef.current = 0;
      poseRef.current = "run";
      setPose("run");
      frameRef.current = 0;
      setFrame(0);
      onJumpLift?.(0);
      return;
    }

    let raf = 0;
    let last = performance.now();
    deadRef.current = false;
    deathFrozenRef.current = false;
    scoreRef.current = 0;
    // Seed 2 ahead so the lane already shows upcoming cacti
    idRef.current = 1;
    obstaclesRef.current = [
      spawnObstacle(idRef.current++, false, 0.58),
      spawnObstacle(idRef.current++, false, 0.88),
    ];
    lastObstacleKeyRef.current = "";
    speedRef.current = 0.28;
    nextSpawnRef.current = 0.55;
    runningTimeRef.current = 0;
    jumpQueuedRef.current = false;
    velYRef.current = 0;
    yRef.current = 0;
    poseRef.current = "run";
    setPose("run");
    frameRef.current = 0;
    setFrame(0);
    setObstacleSnapshot(obstaclesRef.current.map((o) => ({ ...o })));
    onObstaclesPaint?.(obstaclesRef.current);
    onJumpLift?.(0);

    const setPoseNow = (next: Pose) => {
      poseRef.current = next;
      setPose(next);
      animAccRef.current = 0;
    };

    const paintLift = (lift01: number) => onJumpLift?.(lift01);

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

    const startJump = () => {
      if (poseRef.current !== "run" || deadRef.current) return false;
      velYRef.current = JUMP_V;
      yRef.current = 0.002;
      setPoseNow("jump");
      frameRef.current = AIR_FRAME;
      setFrame(AIR_FRAME);
      return true;
    };

    const triggerHurt = (o: Obstacle) => {
      o.hit = true;
      deadRef.current = true;
      deathFrozenRef.current = false;
      velYRef.current = 0;
      paintLift(Math.max(0, yRef.current));
      setPoseNow("hurt");
      frameRef.current = 0;
      setFrame(0);
      onDead?.(Math.floor(scoreRef.current));
    };

    const step = (now: number) => {
      const dt = Math.min(0.04, (now - last) / 1000);
      last = now;

      if (deadRef.current) {
        if (!deathFrozenRef.current) {
          animAccRef.current += dt;
          if (animAccRef.current >= 0.09) {
            animAccRef.current = 0;
            if (frameRef.current < WHITE_HURT_FRAME) {
              frameRef.current += 1;
              setFrame(frameRef.current);
            }
            if (frameRef.current >= WHITE_HURT_FRAME) {
              frameRef.current = WHITE_HURT_FRAME;
              setFrame(WHITE_HURT_FRAME);
              deathFrozenRef.current = true;
            }
          }
        }
        raf = requestAnimationFrame(step);
        return;
      }

      runningTimeRef.current += dt;
      speedRef.current = Math.min(0.52, speedRef.current + dt * 0.004);
      scoreRef.current += dt * speedRef.current * 120;
      onScore?.(Math.floor(scoreRef.current));

      if (jumpQueuedRef.current) {
        jumpQueuedRef.current = false;
        startJump();
      }

      let poseNow = poseRef.current;
      const frameCount = POSE_FRAMES[poseNow].length;

      if (poseNow === "jump") {
        velYRef.current -= GRAVITY * dt;
        yRef.current += velYRef.current * dt;
        const peak = (JUMP_V * JUMP_V) / (2 * GRAVITY);
        if (yRef.current <= 0) {
          yRef.current = 0;
          velYRef.current = 0;
          paintLift(0);
          setPoseNow("run");
          frameRef.current = 0;
          setFrame(0);
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

      const speed = speedRef.current;
      const moved = obstaclesRef.current
        .map((o) => ({ ...o, x: o.x - speed * dt }))
        .filter((o) => o.x > -0.2);

      nextSpawnRef.current -= dt;
      if (nextSpawnRef.current <= 0 && runningTimeRef.current > 0.15) {
        const lastX = moved.reduce((m, o) => Math.max(m, o.x), 0);
        // Keep ~1–3 obstacles visible ahead on the long track
        const minGap = 0.26 + speed * 0.22;
        const onScreen = moved.filter((o) => o.x > 0.15 && o.x < 1.05).length;
        if (lastX < 1.05 - minGap && onScreen < 3) {
          moved.push(spawnObstacle(idRef.current++, false, 1.08));
          nextSpawnRef.current = 0.28 + Math.random() * 0.45;
        } else {
          nextSpawnRef.current = 0.08;
        }
      }

      for (const o of moved) {
        const overlap =
          o.x < DINO_X + DINO_W && o.x + o.width > DINO_X - 0.01;
        if (overlap && !o.hit && yRef.current < CLEAR_Y) {
          triggerHurt(o);
          break;
        }
      }

      obstaclesRef.current = moved;
      syncObstacles(moved);
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, sessionId]);

  return { pose, frame, obstacles: obstacleSnapshot, requestJump };
}

function DinoClouds() {
  return (
    <div className="dino-clouds" aria-hidden>
      <svg
        className="dino-cloud dino-cloud-a"
        viewBox="0 0 160 56"
        width="160"
        height="56"
        fill="none"
      >
        <path
          d="M28 40c-10 0-18-7-18-16S18 8 28 8c2-8 10-14 20-14 12 0 21 8 23 18 3-2 7-3 11-3 11 0 20 8 20 19 0 1 0 2-.2 3H148c7 0 12 5 12 11s-5 11-12 11H28c-9 0-16-5-16-12 0-6 5-11 12-12z"
          fill="rgba(172,103,255,0.14)"
          stroke="rgba(172,103,255,0.35)"
          strokeWidth="1.25"
        />
        <path
          d="M42 34c-5 0-9-3.5-9-8s4-8 9-8c1.2-4.5 5.5-8 10.5-8 6 0 11 4 12 9.5 1.5-1 3.5-1.5 5.5-1.5 6 0 10.5 4 10.5 9.5V34H42z"
          fill="rgba(255,255,255,0.06)"
        />
      </svg>

      <svg
        className="dino-cloud dino-cloud-b"
        viewBox="0 0 120 44"
        width="120"
        height="44"
        fill="none"
      >
        <path
          d="M22 32c-7.5 0-14-5.5-14-12.5S14.5 7 22 7c1.8-6 7.5-10.5 14.5-10.5 8.5 0 15.5 6 16.5 14 2-1.5 5-2.5 8-2.5 8 0 14.5 6 14.5 13.5 0 .7 0 1.3-.1 2H108c5 0 9 3.5 9 8s-4 8-9 8H22c-6.5 0-12-3.5-12-8.5S15.5 32 22 32z"
          fill="rgba(172,103,255,0.1)"
          stroke="rgba(172,103,255,0.28)"
          strokeWidth="1.1"
        />
      </svg>

      <svg
        className="dino-cloud dino-cloud-c"
        viewBox="0 0 96 36"
        width="96"
        height="36"
        fill="none"
      >
        <path
          d="M18 26c-6 0-11-4-11-9.5S12 7 18 7c1.5-4.5 6-8 11.5-8 6.5 0 12 4.5 13 10.5 1.5-1 3.5-1.5 5.5-1.5 6.5 0 11.5 4.5 11.5 10.5V26H18z"
          fill="rgba(255,255,255,0.05)"
          stroke="rgba(172,103,255,0.22)"
          strokeWidth="1"
        />
      </svg>

      <svg
        className="dino-cloud dino-cloud-d"
        viewBox="0 0 140 48"
        width="140"
        height="48"
        fill="none"
      >
        <path
          d="M26 36c-9 0-16-6-16-14S17 8 26 8c2-7 9-12 17-12 10 0 18 6.5 20 15.5 2.5-1.8 6-3 9.5-3 9.5 0 17 7 17 16 0 .8 0 1.5-.2 2.2H128c6 0 10.5 4 10.5 9.5S134 45 128 45H26c-7.5 0-14-4-14-10s6.5-9 14-9z"
          fill="rgba(172,103,255,0.12)"
          stroke="rgba(172,103,255,0.32)"
          strokeWidth="1.2"
        />
      </svg>
    </div>
  );
}

/** Hero demo + in-place transition into playable game */
export function DinoDashStage({
  onPhaseChange,
  playSignal = 0,
}: {
  onPhaseChange?: (phase: GamePhase) => void;
  /** Increment to request starting the game from outside (e.g. hero CTA). */
  playSignal?: number;
}) {
  const [reduced, setReduced] = useState(false);
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<GamePhase>("demo");
  const [score, setScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [sessionId, setSessionId] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const liftRef = useRef<HTMLDivElement>(null);
  const obstacleLayerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const cloudsRef = useRef<HTMLDivElement>(null);
  const groundNudge = DINO_SIZE * 0.16;

  const setPhaseBoth = useCallback(
    (next: GamePhase) => {
      setPhase(next);
      onPhaseChange?.(next);
    },
    [onPhaseChange],
  );

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
      if (phase === "entering") return;
      const liftPx = lift01 * (DINO_SIZE * 0.62);
      el.style.transform = `translate3d(0, ${groundNudge - liftPx}px, 0)`;
    },
    [groundNudge, phase],
  );

  const onObstaclesPaint = useCallback(
    (list: Obstacle[], dimHit: boolean) => {
      const root = obstacleLayerRef.current;
      if (!root) return;
      for (const node of root.querySelectorAll<HTMLElement>("[data-oid]")) {
        const id = Number(node.dataset.oid);
        const o = list.find((item) => item.id === id);
        if (!o) continue;
        node.style.left = `${o.x * 100}%`;
        node.style.opacity = dimHit && o.hit ? "0.35" : "1";
      }
    },
    [],
  );

  const onDemoPaint = useCallback(
    (list: Obstacle[]) => onObstaclesPaint(list, false),
    [onObstaclesPaint],
  );
  const onPlayPaint = useCallback(
    (list: Obstacle[]) => onObstaclesPaint(list, true),
    [onObstaclesPaint],
  );

  const demoOn = ready && !reduced && phase === "demo";
  const playOn =
    ready && !reduced && (phase === "playing" || phase === "dead");

  const demo = useDemoDinoLoop(demoOn, onJumpLift, onDemoPaint);
  const {
    pose: playPose,
    frame: playFrame,
    obstacles: playObstacles,
    requestJump,
  } = usePlayerDinoLoop(
    playOn,
    sessionId,
    onJumpLift,
    onPlayPaint,
    setScore,
    (s) => {
      setFinalScore(s);
      setPhaseBoth("dead");
    },
  );

  const inGame =
    phase === "entering" || phase === "playing" || phase === "dead";
  const showPose = phase === "demo" || phase === "entering" ? demo.pose : playPose;
  const showFrame =
    phase === "demo" || phase === "entering" ? demo.frame : playFrame;
  const showObstacles =
    phase === "playing" || phase === "dead" ? playObstacles : demo.obstacles;
  const scramble =
    !reduced &&
    ((demoOn && true) ||
      (phase === "playing" && playPose !== "hurt") ||
      (phase === "dead" &&
        playPose === "hurt" &&
        playFrame < WHITE_HURT_FRAME));

  const exitToDemo = useCallback(() => {
    const overlay = overlayRef.current;
    const root = rootRef.current;
    const clouds = cloudsRef.current;
    document.body.style.overflow = "";

    const finish = () => {
      setPhaseBoth("demo");
      setScore(0);
      onJumpLift(0);
      if (root) gsap.set(root, { clearProps: "all" });
      if (overlay) {
        gsap.set(overlay, { clearProps: "all", display: "none", opacity: 0 });
      }
      if (clouds) gsap.set(clouds, { opacity: 0 });
    };

    if (reduced) {
      finish();
      return;
    }

    gsap
      .timeline({ onComplete: finish })
      .to(clouds, { opacity: 0, duration: 0.25 }, 0)
      .to(overlay, { opacity: 0, duration: 0.4, ease: "power2.inOut" }, 0);
  }, [onJumpLift, reduced, setPhaseBoth]);

  const flipFromRef = useRef<DOMRect | null>(null);

  const startGame = useCallback(() => {
    if (phase !== "demo") return;
    const lift = liftRef.current;
    if (!lift) return;
    flipFromRef.current = lift.getBoundingClientRect();
    document.body.style.overflow = "hidden";
    setScore(0);
    setPhaseBoth("entering");
  }, [phase, setPhaseBoth]);

  const playSignalRef = useRef(playSignal);
  useEffect(() => {
    if (playSignal === playSignalRef.current) return;
    playSignalRef.current = playSignal;
    if (playSignal > 0) startGame();
  }, [playSignal, startGame]);

  useEffect(() => {
    if (phase !== "entering") return;
    const lift = liftRef.current;
    const overlay = overlayRef.current;
    const clouds = cloudsRef.current;
    const first = flipFromRef.current;
    if (!lift || !overlay || !first) {
      setSessionId((n) => n + 1);
      setPhaseBoth("playing");
      return;
    }

    overlay.style.display = "block";
    gsap.set(overlay, { opacity: 0 });
    gsap.set(clouds, { opacity: 0 });

    const finishEnter = () => {
      gsap.set(lift, { clearProps: "transform" });
      lift.style.transform = `translate3d(0, ${groundNudge}px, 0)`;
      setSessionId((n) => n + 1);
      setPhaseBoth("playing");
    };

    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const last = lift.getBoundingClientRect();
        const dx = first.left - last.left;
        const dy = first.top - last.top;
        const sx = first.width / Math.max(1, last.width);
        const sy = first.height / Math.max(1, last.height);

        gsap.set(lift, {
          x: dx,
          y: dy,
          scaleX: sx,
          scaleY: sy,
          transformOrigin: "left bottom",
        });

        if (reduced) {
          gsap.set(overlay, { opacity: 1 });
          gsap.set(clouds, { opacity: 1 });
          finishEnter();
          return;
        }

        gsap
          .timeline({ onComplete: finishEnter })
          .to(
            overlay,
            { opacity: 1, duration: 0.55, ease: "power2.inOut" },
            0,
          )
          .to(
            lift,
            {
              x: 0,
              y: 0,
              scaleX: 1,
              scaleY: 1,
              duration: 1.05,
              ease: "power3.inOut",
            },
            0.05,
          )
          .to(
            clouds,
            { opacity: 1, duration: 0.55, ease: "power2.out" },
            0.45,
          );
      });
    });

    return () => cancelAnimationFrame(id);
  }, [phase, groundNudge, reduced, setPhaseBoth]);

  useEffect(() => {
    if (phase !== "playing" && phase !== "dead") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        e.preventDefault();
        exitToDemo();
        return;
      }
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        if (phase === "dead") {
          setScore(0);
          setSessionId((n) => n + 1);
          setPhaseBoth("playing");
          return;
        }
        requestJump();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, requestJump, exitToDemo, setPhaseBoth]);

  return (
    <>
      <div
        ref={overlayRef}
        className="dino-game-overlay"
        aria-hidden={!inGame}
      />

      <div
        ref={rootRef}
        className={`dino-dash-root${inGame ? " is-playing" : ""}${phase === "entering" ? " is-entering" : ""}`}
      >
        <div ref={cloudsRef} className="dino-clouds-wrap">
          <DinoClouds />
        </div>

        <div
          ref={stageRef}
          className="dino-dash-stage"
          aria-label="Dino minigame"
        >
          {(phase === "playing" || phase === "dead") && (
            <div className="dino-hud">
              <span className="dino-hud-score">
                {phase === "dead" ? finalScore : score}
              </span>
              <span className="dino-hud-hint">
                {phase === "dead"
                  ? "crashed · space retry · esc exit"
                  : "space jump · esc exit"}
              </span>
            </div>
          )}

          <div ref={obstacleLayerRef} className="dino-obstacle-layer">
            {(phase === "demo" || phase === "playing" || phase === "dead") &&
              showObstacles.map((o) => (
                <div
                  key={o.id}
                  data-oid={o.id}
                  className="dino-obstacle"
                  style={{ left: `${o.x * 100}%` }}
                >
                  <AsciiCactus
                    kind={o.kind}
                    hit={phase !== "demo" && o.hit}
                    scramble={scramble && (phase === "demo" || !o.hit)}
                    reduced={reduced}
                  />
                </div>
              ))}
          </div>

          <div
            ref={liftRef}
            className={`dino-lift${inGame ? " dino-play-lift" : ""}`}
            style={{ transform: `translate3d(0, ${groundNudge}px, 0)` }}
          >
            <AsciiDinoView
              pose={showPose}
              frame={showFrame}
              scramble={scramble}
              reduced={
                reduced ||
                (phase === "dead" && playFrame >= WHITE_HURT_FRAME)
              }
            />
          </div>

          {phase === "playing" && (
            <button
              type="button"
              className="dino-tap-jump"
              aria-label="Jump"
              onClick={() => requestJump()}
            />
          )}

          {phase === "dead" && (
            <div className="dino-dead-panel">
              <p className="dino-dead-title">game over</p>
              <p className="dino-dead-score">score {finalScore}</p>
              <div className="dino-prompt-actions">
                <button
                  type="button"
                  className="dino-prompt-btn dino-prompt-btn-yes"
                  onClick={() => {
                    setScore(0);
                    setSessionId((n) => n + 1);
                    setPhaseBoth("playing");
                  }}
                >
                  retry
                </button>
                <button
                  type="button"
                  className="dino-prompt-btn dino-prompt-btn-no"
                  onClick={exitToDemo}
                >
                  exit
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function DinoDashHorizon() {
  return (
    <div
      aria-hidden
      className="relative h-[14px] shrink-0 overflow-hidden bg-black"
    />
  );
}
