"use client";

import { useEffect, useRef } from "react";

type SheetDef = {
  id: string;
  src: string;
  frames: number;
  fw: number;
  fh: number;
  /** Display height in CSS pixels */
  displayH: number;
  fps: number;
  speed: number;
  /** Vertical lane offset from ground (px up) */
  hop: number;
  startX: number;
  dir: 1 | -1;
  /** Flying dinos hover above the rail with a bigger bob */
  mode: "walk" | "fly";
};

const HERD: SheetDef[] = [
  {
    id: "kuro",
    src: "/dino/footer/kuro-move.png",
    frames: 6,
    fw: 24,
    fh: 24,
    displayH: 52,
    fps: 9,
    speed: 42,
    hop: 0,
    startX: 0.12,
    dir: 1,
    mode: "walk",
  },
  {
    id: "nami",
    src: "/dino/footer/nami-move.png",
    frames: 8,
    fw: 48,
    fh: 40,
    displayH: 58,
    fps: 10,
    speed: 58,
    hop: 2,
    startX: 0.48,
    dir: -1,
    mode: "walk",
  },
  {
    id: "cinder",
    src: "/dino/footer/cinder-fly.png",
    frames: 12,
    fw: 32,
    fh: 32,
    displayH: 64,
    fps: 8,
    speed: 48,
    hop: 38,
    startX: 0.72,
    dir: 1,
    mode: "fly",
  },
];

type Runner = SheetDef & {
  img: HTMLImageElement;
  ready: boolean;
  x: number;
  dir: 1 | -1;
  frame: number;
  frameAcc: number;
  bob: number;
  bobPhase: number;
};

/**
 * Three Vibesaur pets on the footer —
 * Kuro + Nami walk the rail, Cinder flies above.
 */
export function FooterDinos() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = false;
    let last = performance.now();
    let dpr = 1;
    let width = 0;
    let height = 0;

    const herd: Runner[] = HERD.map((def) => {
      const img = new Image();
      img.decoding = "async";
      const runner: Runner = {
        ...def,
        img,
        ready: false,
        x: 0,
        dir: def.dir,
        frame: Math.floor(Math.random() * def.frames),
        frameAcc: Math.random(),
        bob: 0,
        bobPhase: Math.random() * Math.PI * 2,
      };
      img.onload = () => {
        runner.ready = true;
      };
      img.src = def.src;
      return runner;
    });

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;

      for (const d of herd) {
        if (d.x <= 0) d.x = width * d.startX;
      }
    };

    const drawGround = () => {
      const gy = height - 10;
      /* Soft violet wash underfoot */
      const glow = ctx.createLinearGradient(0, gy - 28, 0, height);
      glow.addColorStop(0, "rgba(124, 58, 237, 0)");
      glow.addColorStop(0.55, "rgba(124, 58, 237, 0.12)");
      glow.addColorStop(1, "rgba(124, 58, 237, 0.28)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, gy - 28, width, height - (gy - 28));

      /* Pixel ground rail */
      ctx.fillStyle = "rgba(167, 139, 250, 0.85)";
      ctx.fillRect(0, gy, width, 2);
      ctx.fillStyle = "rgba(124, 58, 237, 0.45)";
      ctx.fillRect(0, gy + 2, width, 1);

      /* Sparse grit marks */
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      for (let i = 0; i < width; i += 37) {
        ctx.fillRect(i + ((i * 7) % 11), gy - 1, 2, 1);
      }
    };

    const drawDino = (d: Runner) => {
      if (!d.ready || !d.img.naturalWidth) return;
      const scale = d.displayH / d.fh;
      const dw = d.fw * scale;
      const dh = d.fh * scale;
      const sx = (Math.floor(d.frame) % d.frames) * d.fw;
      const railY = height - 12;
      const groundY = railY - d.hop;
      const dy = groundY - dh + d.bob;

      ctx.save();
      /* Soft contact / drop shadow — flyers cast a smaller shadow on the rail */
      if (d.mode === "fly") {
        ctx.fillStyle = "rgba(251, 146, 60, 0.28)";
        ctx.beginPath();
        ctx.ellipse(d.x, railY + 1, dw * 0.28, 2.8, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = "rgba(124, 58, 237, 0.22)";
        ctx.beginPath();
        ctx.ellipse(d.x, railY + 1, dw * 0.34, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      if (d.dir < 0) {
        ctx.translate(d.x, dy);
        ctx.scale(-1, 1);
        ctx.drawImage(d.img, sx, 0, d.fw, d.fh, -dw / 2, 0, dw, dh);
      } else {
        ctx.drawImage(d.img, sx, 0, d.fw, d.fh, d.x - dw / 2, dy, dw, dh);
      }
      ctx.restore();
    };

    const tick = (now: number) => {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      ctx.clearRect(0, 0, width, height);
      drawGround();

      /* Flyers behind walkers so ground dinos stay readable */
      const order = [...herd].sort((a, b) => {
        if (a.mode !== b.mode) return a.mode === "fly" ? -1 : 1;
        return b.displayH - a.displayH;
      });
      for (const d of order) {
        d.frameAcc += dt * d.fps;
        while (d.frameAcc >= 1) {
          d.frameAcc -= 1;
          d.frame = (d.frame + 1) % d.frames;
        }

        d.x += d.dir * d.speed * dt;
        if (d.mode === "fly") {
          d.bobPhase += dt * 3.2;
          d.bob = Math.sin(d.bobPhase) * 5.5;
        } else {
          d.bobPhase += dt * 7;
          d.bob = Math.sin(d.bobPhase) * 1.2;
        }

        const margin = 36;
        if (d.x > width - margin) {
          d.x = width - margin;
          d.dir = -1;
        } else if (d.x < margin) {
          d.x = margin;
          d.dir = 1;
        }

        drawDino(d);
      }

      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          if (!running) {
            running = true;
            last = performance.now();
            raf = requestAnimationFrame(tick);
          }
        } else {
          running = false;
          cancelAnimationFrame(raf);
        }
      },
      { rootMargin: "80px 0px", threshold: 0.05 },
    );
    io.observe(wrap);

    const ro = new ResizeObserver(() => resize());
    ro.observe(wrap);
    resize();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
    };
  }, []);

  return (
    <div ref={wrapRef} className="site-footer-dinos" aria-hidden>
      <canvas ref={canvasRef} className="site-footer-dinos__canvas" />
    </div>
  );
}
