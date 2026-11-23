"use client";

/**
 * Aquarium ASCII jellyfish — upright bells, slow pulse-up / sink-down.
 * Whole-body ripple on each jet. No spin-to-face-velocity.
 */

import { useEffect, useRef } from "react";

type RGB = [number, number, number];

const WHITE: RGB = [248, 244, 252];
const PINK: RGB = [236, 120, 196];
const MAGENTA: RGB = [196, 72, 168];
const VIOLET: RGB = [148, 92, 220];
const DIM: RGB = [120, 96, 148];

const CELL = 6;
const TENTACLES = 5;
const TENT_NODES = 16;
const TAU = Math.PI * 2;

type Jelly = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Tiny lean from vertical — never a spin. */
  lean: number;
  /** 0→1 continuous pulse phase (not sin-wrapped chaos). */
  pulse: number;
  /** Seconds per full pulse cycle. */
  period: number;
  sway: number;
  size: number;
  depth: number;
  tent: Float32Array;
  hue: number;
  homeX: number;
  /** Path wander phase — slow curved lane through the tank. */
  path: number;
};

type Ripple = {
  x: number;
  y: number;
  born: number;
  life: number;
  maxR: number;
  speed: number;
};

function rand(a = 0, b = 1) {
  return a + Math.random() * (b - a);
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function smoothstep(e0: number, e1: number, x: number) {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
}

function createJelly(id: number, w: number, h: number, count: number): Jelly {
  const depth = rand(0.75, 1);
  const size = (38 + rand(0, 20)) * depth;
  const margin = size * 1.1;
  // Spread across the tank so they don't stack
  const lane = (id + 0.5) / Math.max(count, 1);
  const x = lerp(margin, Math.max(margin + 1, w - margin), lane * 0.65 + rand(0.05, 0.3));
  // Stagger heights like a real tank
  const y = lerp(h * 0.2, h * 0.62, (id % 3) / 2 + rand(-0.08, 0.08));
  const tent = new Float32Array(TENTACLES * TENT_NODES * 2);
  for (let t = 0; t < TENTACLES; t++) {
    for (let n = 0; n < TENT_NODES; n++) {
      const i = (t * TENT_NODES + n) * 2;
      tent[i] = x + (t - (TENTACLES - 1) / 2) * size * 0.12;
      tent[i + 1] = y + size * 0.35 + n * size * 0.16;
    }
  }
  return {
    id,
    x,
    y,
    vx: 0,
    vy: 0,
    lean: 0,
    pulse: rand(0, 1),
    period: rand(3.2, 4.8),
    sway: rand(0, TAU),
    size,
    depth,
    tent,
    hue: rand(0, 1),
    homeX: x,
    path: rand(0, TAU),
  };
}

function bellColor(hue: number, dens: number): RGB {
  const a = dens;
  if (hue < 0.45) {
    return [
      Math.round(lerp(MAGENTA[0], PINK[0], a)),
      Math.round(lerp(MAGENTA[1], PINK[1], a)),
      Math.round(lerp(MAGENTA[2], PINK[2], a)),
    ];
  }
  if (hue < 0.75) {
    return [
      Math.round(lerp(VIOLET[0], PINK[0], a * 0.7)),
      Math.round(lerp(VIOLET[1], PINK[1], a * 0.7)),
      Math.round(lerp(VIOLET[2], PINK[2], a * 0.7)),
    ];
  }
  return [
    Math.round(lerp(DIM[0], WHITE[0], a)),
    Math.round(lerp(DIM[1], WHITE[1], a)),
    Math.round(lerp(DIM[2], WHITE[2], a)),
  ];
}

/**
 * Pulse envelope: quiet coast → quick contraction → thrust → recover.
 * Returns { bell, jet, flow } in 0..1.
 */
function pulseShape(p: number) {
  // p in [0,1)
  if (p < 0.58) {
    // long coast / sink
    return { bell: 1, jet: 0, flow: 0.12 };
  }
  if (p < 0.74) {
    // gentle contract — keep the dome round, not flat
    const t = smoothstep(0.58, 0.74, p);
    return { bell: 1 - t * 0.1, jet: 0, flow: t * 0.45 };
  }
  if (p < 0.88) {
    // thrust / expand with upward jet
    const t = smoothstep(0.74, 0.88, p);
    return { bell: 0.9 + t * 0.1, jet: Math.sin(t * Math.PI), flow: 0.45 + t * 0.55 };
  }
  // recover
  const t = smoothstep(0.88, 1, p);
  return { bell: 1, jet: 0, flow: 1 - t * 0.65 };
}

type Props = {
  className?: string;
  count?: number;
};

export function AsciiJellyfish({ className, count = 4 }: Props) {
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
    const jellies: Jelly[] = [];
    const ripples: Ripple[] = [];
    let attract: { x: number; y: number; until: number } | null = null;

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
      if (jellies.length === 0) {
        for (let i = 0; i < count; i++) jellies.push(createJelly(i, w, h, count));
      }
    };

    const update = (dt: number) => {
      time += dt;
      for (let i = ripples.length - 1; i >= 0; i--) {
        if (time - ripples[i]!.born > ripples[i]!.life) ripples.splice(i, 1);
      }
      if (attract && time > attract.until) attract = null;

      for (const j of jellies) {
        j.pulse = (j.pulse + dt / j.period) % 1;
        j.sway += dt * 0.42;
        j.path += dt * (0.18 + j.depth * 0.04);

        const { bell: bellScale, jet, flow } = pulseShape(j.pulse);

        // Curved wander target (slow Lissajous) — never a straight vertical lane
        const ampX = Math.min(w * 0.22, 70);
        const ampY = Math.min(h * 0.2, 48);
        const midY = h * 0.42;
        let targetX =
          j.homeX +
          Math.sin(j.path * 0.9 + j.id) * ampX +
          Math.sin(j.path * 0.37 + j.id * 2.1) * ampX * 0.45;
        let targetY =
          midY +
          Math.cos(j.path * 0.55 + j.id * 0.8) * ampY +
          Math.sin(j.path * 0.23) * ampY * 0.35;

        if (attract) {
          targetX = lerp(targetX, attract.x, 0.55);
          targetY = lerp(targetY, attract.y, 0.45);
          if (Math.hypot(attract.x - j.x, attract.y - j.y) < 150) {
            j.pulse = Math.min(0.8, Math.max(j.pulse, 0.72));
          }
        }

        const toX = targetX - j.x;
        const toY = targetY - j.y;
        // Lean toward the path — still capped so the bell never spins
        const pathLean = Math.atan2(toX, Math.max(28, -toY + 10));
        const wantLean = clamp(pathLean * 0.55, -0.28, 0.28);
        j.lean = lerp(j.lean, wantLean, Math.min(1, dt * 1.2));

        // Jet along lean (curves the climb); soft steering while coasting
        const jetForce = jet * (40 + j.size * 0.32);
        const steer = 9 + jet * 14;
        j.vx += Math.sin(j.lean) * jetForce * dt + toX * steer * 0.02 * dt;
        j.vy += -Math.cos(j.lean) * jetForce * dt + 11 * dt + toY * 0.012 * dt;

        // Keep mid-water without yanking into a straight column
        if (j.y > h * 0.72) j.vy -= 14 * dt;
        if (j.y < h * 0.16) j.vy += 9 * dt;

        // Soft drag — keep sideways coast so arcs stay visible
        j.vx *= Math.exp(-dt * 0.7);
        j.vy *= Math.exp(-dt * 0.5);

        const spd = Math.hypot(j.vx, j.vy);
        if (spd > 48) {
          j.vx = (j.vx / spd) * 48;
          j.vy = (j.vy / spd) * 48;
        }

        j.x += j.vx * dt;
        j.y += j.vy * dt;

        // Soft tank walls — slide, don't flip
        const padX = j.size * 0.8;
        const padTop = j.size * 0.9;
        const padBot = j.size * 0.5;
        if (j.x < padX) {
          j.x = padX;
          j.vx = Math.max(0, j.vx) * 0.35;
          j.homeX = Math.min(w - padX, j.homeX + 28);
        } else if (j.x > w - padX) {
          j.x = w - padX;
          j.vx = Math.min(0, j.vx) * 0.35;
          j.homeX = Math.max(padX, j.homeX - 28);
        }
        if (j.y < padTop) {
          j.y = padTop;
          j.vy = Math.max(0, j.vy) * 0.25;
        } else if (j.y > h - padBot) {
          j.y = h - padBot;
          j.vy = Math.min(0, j.vy) * 0.4;
        }

        // ——— Tentacles: hang + trail with the curved swim ———
        const bellR = j.size * bellScale;
        const hang = Math.PI / 2 + j.lean;

        for (let t = 0; t < TENTACLES; t++) {
          const spread = (t - (TENTACLES - 1) / 2) / ((TENTACLES - 1) / 2 || 1);
          const side = hang - Math.PI / 2;
          const rootX = j.x + Math.cos(side) * spread * bellR * 0.5;
          const rootY = j.y + Math.sin(side) * spread * bellR * 0.15;
          let px = rootX + Math.cos(hang) * bellR * 0.3;
          let py = rootY + Math.sin(hang) * bellR * 0.3;
          const seg = j.size * (0.12 + Math.abs(spread) * 0.04);

          for (let n = 0; n < TENT_NODES; n++) {
            const i = (t * TENT_NODES + n) * 2;
            const cx = j.tent[i]!;
            const cy = j.tent[i + 1]!;
            const along = n / (TENT_NODES - 1);

            // Body wave + extra bend from sideways coast
            const wave =
              Math.sin(j.sway * 0.65 - along * 2.4 + t * 0.55 + flow * 2) *
                Math.pow(along, 1.2) *
                j.size *
                (0.11 + flow * 0.08) +
              Math.sin(j.sway * 0.3 - along * 1.2 + t * 1.1) *
                Math.pow(along, 1.55) *
                j.size *
                0.05;

            const trail =
              -j.vy * along * 0.014 * (0.4 + flow) +
              j.vx * along * 0.028;

            const nx = Math.cos(hang - Math.PI / 2);
            const ny = Math.sin(hang - Math.PI / 2);

            const tuck = (1 - bellScale) * along * j.size * 0.05;

            let tx = px + Math.cos(hang) * (seg - tuck) + nx * (wave + trail);
            let ty = py + Math.sin(hang) * (seg - tuck) + ny * wave * 0.22;

            // Tip lags more — whole ribbon follows the curve
            const follow = 0.04 + (1 - along) * 0.075 + jet * 0.03;
            tx = lerp(cx, tx, Math.min(1, follow));
            ty = lerp(cy, ty, Math.min(1, follow));

            const dx = tx - px;
            const dy = ty - py;
            const dist = Math.hypot(dx, dy) || 1;
            tx = px + (dx / dist) * seg;
            ty = py + (dy / dist) * seg;
            j.tent[i] = tx;
            j.tent[i + 1] = ty;
            px = tx;
            py = ty;
          }
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

    const paintGlyph = (
      x: number,
      y: number,
      ch: string,
      color: RGB,
      alpha: number,
      size: number,
    ) => {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
      ctx.font = `600 ${size}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(ch, x, y + 0.4);
    };

    const paint = () => {
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = "rgba(255,255,255,0.02)";
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

      const disc = CELL * 0.44;
      const sorted = [...jellies].sort((a, b) => a.depth - b.depth);

      for (const j of sorted) {
        const alpha = 0.58 + j.depth * 0.42;
        const { bell: bellScale } = pulseShape(j.pulse);
        const bellRx = j.size * bellScale;
        const bellRy = j.size * bellScale * 0.68;
        // Upright only — lean is a few degrees
        const lean = j.lean;

        const glyphs = ".:;-=+*#%@";
        for (let t = 0; t < TENTACLES; t++) {
          for (let n = 0; n < TENT_NODES; n++) {
            const i = (t * TENT_NODES + n) * 2;
            const tx = j.tent[i]!;
            const ty = j.tent[i + 1]!;
            const gx = Math.floor(tx / CELL) * CELL + CELL / 2;
            const gy = Math.floor(ty / CELL) * CELL + CELL / 2;
            const fade = 1 - n / (TENT_NODES - 1);
            const gi = Math.min(glyphs.length - 1, Math.floor(fade * (glyphs.length - 1)));
            const col: RGB =
              n < 4
                ? bellColor(j.hue, 0.4 + fade * 0.45)
                : [
                    Math.round(lerp(DIM[0], WHITE[0], fade * 0.85)),
                    Math.round(lerp(DIM[1], WHITE[1], fade * 0.85)),
                    Math.round(lerp(DIM[2], WHITE[2], fade * 0.85)),
                  ];
            paintDot(gx, gy, disc * (0.42 + fade * 0.4), col, alpha * (0.32 + fade * 0.55));
            paintGlyph(gx, gy, glyphs[gi]!, col, alpha * (0.38 + fade * 0.5), CELL * 0.95);
          }
        }

        const pad = bellRx * 1.25;
        const minC = Math.max(0, Math.floor((j.x - pad) / CELL));
        const maxC = Math.min(cols - 1, Math.ceil((j.x + pad) / CELL));
        const minR = Math.max(0, Math.floor((j.y - pad) / CELL));
        const maxR = Math.min(rows - 1, Math.ceil((j.y + pad) / CELL));

        for (let r = minR; r <= maxR; r++) {
          for (let c = minC; c <= maxC; c++) {
            const px = c * CELL + CELL / 2;
            const py = r * CELL + CELL / 2;
            // Rotate only by tiny lean — local +Y is down (mouth)
            const dx = px - j.x;
            const dy = py - j.y;
            const ca = Math.cos(-lean);
            const sa = Math.sin(-lean);
            const lx = dx * ca - dy * sa;
            const ly = dx * sa + dy * ca;
            const nx = lx / (bellRx || 1);
            const ny = ly / (bellRy || 1);
            // Dome above mouth: ly from -bellRy (top) to small positive (lip)
            const inside = nx * nx + ny * ny <= 1 && ly >= -bellRy && ly <= bellRy * 0.2;
            if (!inside) continue;

            const dens = clamp(1 - Math.sqrt(nx * nx + ny * ny * 0.85), 0, 1);
            if (dens < 0.06) continue;
            const col = bellColor(j.hue, dens);
            paintDot(px, py, disc * (0.78 + dens * 0.35), col, alpha);
            if (dens > 0.4) {
              const ch = dens > 0.78 ? "@" : dens > 0.58 ? "%" : dens > 0.45 ? "#" : "*";
              paintGlyph(px, py, ch, col, alpha * 0.92, CELL);
            }
          }
        }
      }

      for (const rip of ripples) {
        const age = time - rip.born;
        const t = clamp(age / rip.life, 0, 1);
        const radius = Math.min(rip.maxR, age * rip.speed);
        const a = (1 - t) * (1 - t) * 0.5;
        if (a < 0.02 || radius < 2) continue;
        const steps = Math.max(10, Math.floor((TAU * radius) / CELL));
        for (let i = 0; i < steps; i++) {
          const ang = (i / steps) * TAU + rip.born;
          const px = rip.x + Math.cos(ang) * radius;
          const py = rip.y + Math.sin(ang) * radius;
          const gx = Math.floor(px / CELL) * CELL + CELL / 2;
          const gy = Math.floor(py / CELL) * CELL + CELL / 2;
          paintDot(gx, gy, disc * 0.36, WHITE, a);
        }
      }

      ctx.globalAlpha = 1;
    };

    const loop = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      if (!reduced) update(dt);
      paint();
      raf = requestAnimationFrame(loop);
    };

    const onClick = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      attract = { x, y, until: time + 2.5 };
      for (const j of jellies) {
        // Shift home gently toward click — no spin
        j.homeX = lerp(j.homeX, x, 0.35);
      }
      const rings = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < rings; i++) {
        ripples.push({
          x: x + rand(-8, 8),
          y: y + rand(-8, 8),
          born: time + i * 0.07,
          life: rand(0.8, 1.4),
          maxR: rand(24, 48) + i * 10,
          speed: rand(36, 55),
        });
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
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}
