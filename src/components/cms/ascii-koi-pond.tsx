"use client";

/**
 * Matte ASCII koi pond — Stephen Zhang / ascii-animals inspired.
 * Small slender fish, large hi patches (not slime noise), smooth wander.
 */

import { useEffect, useRef } from "react";

type RGB = [number, number, number];

const WHITE: RGB = [250, 246, 238];
const RED: RGB = [220, 52, 40];
const RED_DEEP: RGB = [168, 32, 28];
const BLACK: RGB = [22, 22, 28];
const GOLD: RGB = [236, 186, 64];
const GOLD_DIM: RGB = [198, 148, 42];
const ORANGE: RGB = [232, 132, 52];
const FOOD: RGB = [214, 168, 96];
const FOOD_DIM: RGB = [168, 128, 72];
const EYE: RGB = [8, 8, 10];
const GLINT: RGB = [255, 252, 246];

const VARIETIES = ["kohaku", "kohaku", "kohaku", "sanke", "ogon", "chagoi"] as const;
const NODES = 11;
const CELL = 5;
const TAU = Math.PI * 2;

type Variety = (typeof VARIETIES)[number];

/** Large hi / sumi patch along the body (s = 0 head → 1 tail). */
type Patch = { s: number; half: number; across: number; radius: number };

type Koi = {
  id: number;
  variety: Variety;
  nodes: Float32Array;
  heading: number;
  speed: number;
  cruise: number;
  phase: number;
  depth: number;
  span: number;
  tx: number;
  ty: number;
  retarget: number;
  glide: number;
  /** Contiguous color blotches — real koi hi, not cell noise. */
  patches: Patch[];
  seed: number;
  /** Feeding frenzy — decays after food appears / is chased. */
  rush: number;
};

type Pellet = { x: number; y: number; vx: number; vy: number; born: number };

/** Expanding matte ring when food hits the water. */
type Ripple = {
  x: number;
  y: number;
  born: number;
  /** Seconds until fully faded. */
  life: number;
  /** Max radius in px. */
  maxR: number;
  /** Expansion speed. */
  speed: number;
};

function rand(a = 0, b = 1) {
  return a + Math.random() * (b - a);
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function angleDiff(a: number, b: number) {
  let d = b - a;
  while (d > Math.PI) d -= TAU;
  while (d < -Math.PI) d += TAU;
  return d;
}

function smoothstep(e0: number, e1: number, x: number) {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
}

/** Slender koi — taper to a thin peduncle (no bulbous tip). */
function halfWidth(s: number) {
  if (s < 0.07) return 0.045 + 0.09 * Math.sin((s / 0.07) * (Math.PI / 2));
  if (s < 0.25) return 0.13 + 0.025 * Math.sin(((s - 0.07) / 0.18) * Math.PI);
  if (s < 0.82) return 0.14 - 0.075 * smoothstep(0.25, 0.82, s);
  // Thin out to the tip — caudal is painted as a flat fan, not a round blob
  return 0.065 * (1 - smoothstep(0.82, 1, s) * 0.55);
}

function makePatches(variety: Variety, seed: number): Patch[] {
  const n =
    variety === "ogon" || variety === "chagoi"
      ? 1 + Math.floor(rand(0, 2))
      : 2 + Math.floor(rand(0, 2));
  const patches: Patch[] = [];
  for (let i = 0; i < n; i++) {
    patches.push({
      s: 0.1 + (i + rand(0, 0.4)) * (0.72 / Math.max(n, 1)) + (seed % 1) * 0.03,
      // Bigger hi blotches so kohaku reads clearly
      half: rand(0.14, 0.26),
      across: rand(-0.2, 0.2),
      radius: rand(0.75, 1.25),
    });
  }
  return patches;
}

function inPatch(patches: Patch[], s: number, across: number) {
  for (const p of patches) {
    const ds = (s - p.s) / p.half;
    const da = (across - p.across) / p.radius;
    if (ds * ds + da * da < 1) return true;
  }
  return false;
}

function colorFor(
  variety: Variety,
  s: number,
  across: number,
  patches: Patch[],
  seed: number,
): RGB {
  const hi = inPatch(patches, s, across);
  // Soft edge noise so patches aren't perfect ellipses
  const edge =
    Math.sin(s * 14 + seed * 3) * Math.cos(across * 11 + seed) * 0.12;
  const marked = hi || (Math.abs(across) < 0.7 && edge > 0.1 && inPatch(patches, s + edge * 0.08, across));

  switch (variety) {
    case "kohaku":
      if (!marked) return WHITE;
      return edge > 0.05 ? RED_DEEP : RED;
    case "sanke": {
      const sumi =
        Math.sin(s * 5.5 + seed * 2.1) * Math.cos(across * 4 + seed) > 0.55 &&
        s > 0.2 &&
        s < 0.85;
      if (sumi) return BLACK;
      if (!marked) return WHITE;
      return RED;
    }
    case "ogon":
      return marked ? GOLD_DIM : GOLD;
    case "chagoi":
    default:
      return marked ? [198, 96, 34] : ORANGE;
  }
}

function pickTarget(w: number, h: number, margin: number, fromX: number, fromY: number) {
  for (let attempt = 0; attempt < 10; attempt++) {
    const x = rand(margin, Math.max(margin + 1, w - margin));
    const y = rand(margin, Math.max(margin + 1, h - margin));
    if (Math.hypot(x - fromX, y - fromY) > Math.min(w, h) * 0.3) {
      return { x, y };
    }
  }
  return {
    x: rand(margin, Math.max(margin + 1, w - margin)),
    y: rand(margin, Math.max(margin + 1, h - margin)),
  };
}

function createKoi(id: number, w: number, h: number): Koi {
  // Size tiers: small / medium / large — mixed pond, not one uniform scale
  const roll = Math.random();
  let base: number;
  let depth: number;
  if (roll < 0.34) {
    base = 38 + rand(0, 10); // small
    depth = rand(0.82, 0.92);
  } else if (roll < 0.72) {
    base = 52 + rand(0, 14); // medium
    depth = rand(0.88, 1);
  } else {
    base = 68 + rand(0, 16); // large
    depth = rand(0.94, 1);
  }
  const span = base * depth;
  const margin = span * 0.55;
  const x = rand(margin, Math.max(margin + 1, w - margin));
  const y = rand(margin, Math.max(margin + 1, h - margin));
  const target = pickTarget(w, h, margin, x, y);
  const heading = Math.atan2(target.y - y, target.x - x);
  const nodes = new Float32Array(NODES * 2);
  const seg = span / (NODES - 1);
  for (let k = 0; k < NODES; k++) {
    nodes[k * 2] = x - Math.cos(heading) * seg * k;
    nodes[k * 2 + 1] = y - Math.sin(heading) * seg * k;
  }
  const variety = VARIETIES[Math.floor(rand(0, VARIETIES.length))]!;
  const seed = id * 17.13 + rand(0, 40);
  return {
    id,
    variety,
    nodes,
    heading,
    speed: 0,
    cruise: (18 + span * 0.22) + rand(0, 10),
    phase: rand(0, TAU),
    depth,
    span,
    tx: target.x,
    ty: target.y,
    retarget: rand(8, 18),
    glide: rand(0, TAU),
    patches: makePatches(variety, seed),
    seed,
    rush: 0,
  };
}

function nearestOnSpine(fish: Koi, px: number, py: number) {
  let bestD = Infinity;
  let bestS = 0;
  let bestAcross = 0;
  const n = NODES - 1;
  for (let i = 0; i < n; i++) {
    const ax = fish.nodes[i * 2]!;
    const ay = fish.nodes[i * 2 + 1]!;
    const bx = fish.nodes[(i + 1) * 2]!;
    const by = fish.nodes[(i + 1) * 2 + 1]!;
    const abx = bx - ax;
    const aby = by - ay;
    const len2 = abx * abx + aby * aby || 1;
    let t = ((px - ax) * abx + (py - ay) * aby) / len2;
    t = clamp(t, 0, 1);
    const qx = ax + abx * t;
    const qy = ay + aby * t;
    const dx = px - qx;
    const dy = py - qy;
    const d = Math.hypot(dx, dy);
    if (d < bestD) {
      bestD = d;
      bestS = (i + t) / n;
      const len = Math.sqrt(len2);
      const nx = -aby / len;
      const ny = abx / len;
      const hw = fish.span * halfWidth(bestS) || 1;
      bestAcross = (dx * nx + dy * ny) / hw;
    }
  }
  return { d: bestD, s: bestS, across: bestAcross };
}

function bodyBounds(f: Koi) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let k = 0; k < NODES; k++) {
    const x = f.nodes[k * 2]!;
    const y = f.nodes[k * 2 + 1]!;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  const pad = f.span * 0.28;
  return { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad };
}

type Props = {
  className?: string;
  count?: number;
};

export function AsciiKoiPond({ className, count = 32 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let cols = 0;
    let rows = 0;
    let raf = 0;
    let time = 0;
    let last = performance.now();
    const fish: Koi[] = [];
    const food: Pellet[] = [];
    const ripples: Ripple[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / CELL);
      rows = Math.ceil(h / CELL);
      if (fish.length === 0) {
        for (let i = 0; i < count; i++) fish.push(createKoi(i, w, h));
      }
    };

    const updateFish = (dt: number) => {
      time += dt;
      for (const p of food) {
        p.vx *= Math.exp(-dt * 0.85);
        p.vy *= Math.exp(-dt * 0.85);
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
      for (let i = food.length - 1; i >= 0; i--) {
        if (time - food[i]!.born > 10) food.splice(i, 1);
      }
      for (let i = ripples.length - 1; i >= 0; i--) {
        if (time - ripples[i]!.born > ripples[i]!.life) ripples.splice(i, 1);
      }

      for (const f of fish) {
        const hx0 = f.nodes[0]!;
        const hy0 = f.nodes[1]!;
        const margin = f.span * 0.6;

        f.rush = Math.max(0, f.rush - dt * 0.55);

        // Notice food anywhere in the pond — scramble for pellets
        let meal: Pellet | null = null;
        let mealD = Infinity;
        for (const p of food) {
          const d = Math.hypot(p.x - hx0, p.y - hy0);
          if (d < mealD) {
            mealD = d;
            meal = p;
          }
        }
        if (meal) f.rush = Math.max(f.rush, 0.85);

        f.retarget -= dt;
        if (!meal && (f.retarget <= 0 || Math.hypot(f.tx - hx0, f.ty - hy0) < 36)) {
          const next = pickTarget(w, h, margin, hx0, hy0);
          f.tx = next.x;
          f.ty = next.y;
          f.retarget = rand(10, 22);
        }

        let wantX = meal ? meal.x : f.tx;
        let wantY = meal ? meal.y : f.ty;

        // Soft walls — don't override a feeding chase
        if (!meal) {
          if (hx0 < margin * 1.6) wantX = w * 0.55;
          if (hx0 > w - margin * 1.6) wantX = w * 0.45;
          if (hy0 < margin * 1.6) wantY = h * 0.55;
          if (hy0 > h - margin * 1.6) wantY = h * 0.45;
        }

        let sepX = 0;
        let sepY = 0;
        // Looser personal space while swarming food
        const sepScale = meal ? 0.28 : 0.55;
        const sepForce = meal ? 18 : 40;
        for (const o of fish) {
          if (o === f) continue;
          const dx = hx0 - o.nodes[0]!;
          const dy = hy0 - o.nodes[1]!;
          const d = Math.hypot(dx, dy);
          const minD = (f.span + o.span) * sepScale;
          if (d > 0 && d < minD) {
            const force = (1 - d / minD) ** 2;
            sepX += (dx / d) * force;
            sepY += (dy / d) * force;
          }
        }

        const toX = wantX - hx0 + sepX * sepForce;
        const toY = wantY - hy0 + sepY * sepForce;
        const want = Math.atan2(toY, toX);

        const hunger = meal ? clamp(1 - mealD / Math.max(w, h), 0.35, 1) : 0;
        const frenzy = Math.max(hunger, f.rush);
        // Snap toward food faster; stay graceful when cruising
        const turnRadius = f.span * (1.4 - frenzy * 0.85);
        const maxTurn =
          clamp(f.cruise / Math.max(turnRadius, 1), 0.12, 0.7) *
          (1 + frenzy * 2.8) *
          dt;
        f.heading += clamp(angleDiff(f.heading, want), -maxTurn, maxTurn);

        // Calm glide normally — sprint when food drops
        f.glide += dt * (0.4 + frenzy * 2.2);
        const beat = 0.55 + 0.45 * Math.max(0, Math.sin(f.glide));
        const targetSpeed =
          f.cruise * (0.55 + 0.45 * beat) * (1 + frenzy * 2.6);
        f.speed += (targetSpeed - f.speed) * Math.min(1, dt * (1.6 + frenzy * 4));

        // Wave locked to distance swam — tail beat follows swim direction/speed
        const distStep = f.speed * dt;
        f.phase += (distStep / Math.max(f.span, 1)) * TAU * 1.15;

        let hx = hx0 + Math.cos(f.heading) * distStep;
        let hy = hy0 + Math.sin(f.heading) * distStep;
        const loX = margin * 0.75;
        const hiX = w - margin * 0.75;
        const loY = margin * 0.75;
        const hiY = h - margin * 0.75;
        const pinned = hx < loX || hx > hiX || hy < loY || hy > hiY;
        hx = clamp(hx, loX, hiX);
        hy = clamp(hy, loY, hiY);
        if (pinned) {
          const next = pickTarget(w, h, margin, hx, hy);
          f.tx = next.x;
          f.ty = next.y;
          f.retarget = rand(10, 20);
        }
        f.nodes[0] = hx;
        f.nodes[1] = hy;

        // Rope trail follows the head's path; kick adds a small travelling
        // lateral sway (strongest at the tip, zero at the head).
        const seg = f.span / (NODES - 1);
        const kick = clamp(f.speed / Math.max(f.cruise, 1), 0.25, 1.6);
        for (let k = 1; k < NODES; k++) {
          const px = f.nodes[(k - 1) * 2]!;
          const py = f.nodes[(k - 1) * 2 + 1]!;
          const cx = f.nodes[k * 2]!;
          const cy = f.nodes[k * 2 + 1]!;
          // Pure follow-the-leader angle (path the head already swam)
          const ang = Math.atan2(cy - py, cx - px);
          const t = k / (NODES - 1);
          // Side-to-side only — amplitude grows toward the tail with the kick
          const sway =
            Math.sin(f.phase - t * 2.6) * t * t * kick * 0.065;
          const nx = -Math.sin(ang);
          const ny = Math.cos(ang);
          f.nodes[k * 2] = px + Math.cos(ang) * seg + nx * sway * seg;
          f.nodes[k * 2 + 1] = py + Math.sin(ang) * seg + ny * sway * seg;
        }

        if (meal && mealD < 14) {
          const idx = food.indexOf(meal);
          if (idx >= 0) food.splice(idx, 1);
          f.rush = Math.max(f.rush, 0.35);
          // Tiny victory wriggle
          f.glide += 0.8;
        }
      }
    };

    const paintDot = (x: number, y: number, r: number, color: RGB, alpha: number) => {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
    };

    const paint = () => {
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 0, w, h);

      // Quiet grid — reference style
      ctx.strokeStyle = "rgba(255,255,255,0.022)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= w; x += CELL) {
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, h);
      }
      for (let y = 0; y <= h; y += CELL) {
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(w, y + 0.5);
      }
      ctx.stroke();

      const sorted = [...fish].sort((a, b) => a.depth - b.depth);
      const disc = CELL * 0.46;

      for (const f of sorted) {
        const alpha = 0.72 + f.depth * 0.28;
        const hx = f.nodes[0]!;
        const hy = f.nodes[1]!;
        const b = bodyBounds(f);
        const minC = Math.max(0, Math.floor(b.minX / CELL));
        const maxC = Math.min(cols - 1, Math.ceil(b.maxX / CELL));
        const minR = Math.max(0, Math.floor(b.minY / CELL));
        const maxR = Math.min(rows - 1, Math.ceil(b.maxY / CELL));

        for (let r = minR; r <= maxR; r++) {
          for (let c = minC; c <= maxC; c++) {
            const px = c * CELL + CELL / 2;
            const py = r * CELL + CELL / 2;
            const { d, s, across } = nearestOnSpine(f, px, py);
            const hw = f.span * halfWidth(s);

            // Flat caudal fan at the tip (perpendicular, not a round bulb)
            if (
              s > 0.88 &&
              d > hw * 0.85 &&
              d < hw + CELL * 1.15 &&
              Math.abs(across) > 0.25
            ) {
              const finColor = colorFor(f.variety, s, across, f.patches, f.seed);
              const tip = smoothstep(0.88, 1, s);
              paintDot(px, py, disc * 0.5, finColor, alpha * (0.35 + tip * 0.35));
              continue;
            }

            // Sparse pectoral hint
            if (
              s > 0.2 &&
              s < 0.38 &&
              d > hw * 0.95 &&
              d < hw * 1.35 &&
              Math.abs(across) > 0.7
            ) {
              const finColor = colorFor(f.variety, s, across, f.patches, f.seed);
              paintDot(px, py, disc * 0.48, finColor, alpha * 0.45);
              continue;
            }

            if (d > hw) continue;

            const density = clamp(1 - d / (hw || 1), 0, 1);
            if (density < 0.12) continue;

            const color = colorFor(f.variety, s, across, f.patches, f.seed);
            const shade = 0.88 + density * 0.12;
            const shaded: RGB = [
              Math.round(color[0] * shade),
              Math.round(color[1] * shade),
              Math.round(color[2] * shade),
            ];
            // Smaller discs near the tip so it stays a point, not a knob
            const tipScale = 1 - smoothstep(0.8, 1, s) * 0.35;
            paintDot(
              px,
              py,
              disc * (0.75 + density * 0.3) * tipScale,
              shaded,
              alpha,
            );
          }
        }

        // Eyes
        const eyeOff = f.span * 0.06;
        const side = f.span * 0.055;
        const ex =
          hx + Math.cos(f.heading) * eyeOff + Math.cos(f.heading + Math.PI / 2) * side;
        const ey =
          hy + Math.sin(f.heading) * eyeOff + Math.sin(f.heading + Math.PI / 2) * side;
        paintDot(ex, ey, 1.6 * f.depth, EYE, alpha);
        paintDot(ex + 0.5, ey - 0.5, 0.55 * f.depth, GLINT, alpha);
      }

      // Matte ripple rings from feeding clicks — dotted circles, no glow
      for (const rip of ripples) {
        const age = time - rip.born;
        const t = clamp(age / rip.life, 0, 1);
        const radius = Math.min(rip.maxR, age * rip.speed);
        const alpha = (1 - t) * (1 - t) * 0.55;
        if (alpha < 0.02 || radius < 2) continue;
        const steps = Math.max(10, Math.floor((TAU * radius) / CELL));
        for (let i = 0; i < steps; i++) {
          const ang = (i / steps) * TAU + rip.born;
          const px = rip.x + Math.cos(ang) * radius;
          const py = rip.y + Math.sin(ang) * radius;
          const gx = Math.floor(px / CELL) * CELL + CELL / 2;
          const gy = Math.floor(py / CELL) * CELL + CELL / 2;
          paintDot(gx, gy, disc * 0.38, WHITE, alpha);
        }
      }

      // Food as matte ASCII cells — no glow halo
      for (const p of food) {
        const age = (time - p.born) / 10;
        const a = Math.max(0, 1 - age);
        if (a <= 0) continue;
        const cx = Math.floor(p.x / CELL) * CELL + CELL / 2;
        const cy = Math.floor(p.y / CELL) * CELL + CELL / 2;
        paintDot(cx, cy, disc * 0.85, FOOD, a * 0.92);
        ctx.globalAlpha = a * 0.85;
        ctx.fillStyle = `rgb(${FOOD_DIM[0]},${FOOD_DIM[1]},${FOOD_DIM[2]})`;
        ctx.font = `600 ${CELL * 0.95}px ui-monospace, SFMono-Regular, Menlo, monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("·", cx, cy + 0.5);
      }

      ctx.globalAlpha = 1;
    };

    const loop = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      if (!reduced) updateFish(dt);
      paint();
      raf = requestAnimationFrame(loop);
    };

    const onClick = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const n = 8 + Math.floor(Math.random() * 5);
      for (let i = 0; i < n; i++) {
        food.push({
          x: x + rand(-16, 16),
          y: y + rand(-16, 16),
          vx: rand(-22, 22),
          vy: rand(-22, 22),
          born: time,
        });
      }
      // Small random concentric ripples at the splash
      const rings = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < rings; i++) {
        ripples.push({
          x: x + rand(-10, 10),
          y: y + rand(-10, 10),
          born: time + i * 0.08,
          life: rand(0.9, 1.6),
          maxR: rand(28, 58) + i * rand(8, 16),
          speed: rand(38, 62) + i * 6,
        });
      }
      // Whole pond wakes up and races toward the splash
      for (const f of fish) {
        const d = Math.hypot(f.nodes[0]! - x, f.nodes[1]! - y);
        f.rush = Math.max(f.rush, clamp(1.35 - d / Math.max(w, h), 0.55, 1.35));
        f.speed = Math.max(f.speed, f.cruise * (1.4 + f.rush));
        f.tx = x;
        f.ty = y;
        f.retarget = 4;
      }
    };

    resize();
    window.addEventListener("resize", resize);
    canvas.addEventListener("pointerdown", onClick);
    last = performance.now();
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", onClick);
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden
      style={{ display: "block", width: "100%", height: "100%", cursor: "crosshair" }}
    />
  );
}
