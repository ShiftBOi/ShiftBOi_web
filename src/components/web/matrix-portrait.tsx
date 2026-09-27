"use client";

import { useEffect, useRef } from "react";
import styles from "./matrix-portrait.module.css";

/** Classic ASCII density ramp (dark → bright) */
const ASCII = " .'`^\",:;Il!i~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
const COLS = 72;
const ROWS = 72;

/** Soft light-purple scale — less white, more lilac */
const C_SHADOW = { r: 78, g: 48, b: 150 };
const C_DIM = { r: 135, g: 95, b: 215 };
const C_MID = { r: 175, g: 140, b: 245 };
const C_HOT = { r: 205, g: 175, b: 255 };
const C_HL = { r: 225, g: 205, b: 255 };
const C_SPARK = { r: 230, g: 210, b: 255 };

function luminance(r: number, g: number, b: number) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function mix(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
  t: number,
) {
  const u = Math.min(1, Math.max(0, t));
  return {
    r: Math.round(a.r + (b.r - a.r) * u),
    g: Math.round(a.g + (b.g - a.g) * u),
    b: Math.round(a.b + (b.b - a.b) * u),
  };
}

function rgb({ r, g, b }: { r: number; g: number; b: number }, a = 1) {
  return a >= 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${a})`;
}

/** Boost midtones toward white so face isn't muddy purple */
function toneMap(L: number) {
  const c = Math.min(1, Math.max(0, L));
  const lifted = Math.pow(c, 0.58);
  return Math.min(1, Math.max(0, (lifted - 0.04) / 0.9));
}

function sampleLum(lum: Float32Array, x: number, y: number) {
  const xx = Math.min(COLS - 1, Math.max(0, x));
  const yy = Math.min(ROWS - 1, Math.max(0, y));
  return lum[yy * COLS + xx] ?? 0;
}

/** Face stops — light purple highlights, soft violet recesses */
function surfaceColor(lit: number) {
  const t = Math.min(1, Math.max(0, lit));
  if (t < 0.2) return mix(C_SHADOW, C_DIM, t / 0.2);
  if (t < 0.45) return mix(C_DIM, C_MID, (t - 0.2) / 0.25);
  if (t < 0.72) return mix(C_MID, C_HOT, (t - 0.45) / 0.27);
  return mix(C_HOT, C_HL, (t - 0.72) / 0.28);
}

/** Video → normal ASCII + soft sparks, low glow */
export function MatrixPortrait() {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const glow = glowRef.current;
    if (!root || !video || !canvas || !glow) return;

    video.loop = true;
    video.muted = true;
    video.playsInline = true;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    let disposed = false;
    let raf = 0;
    let frame = 0;

    const sample = document.createElement("canvas");
    sample.width = COLS;
    sample.height = ROWS;
    const sctx = sample.getContext("2d", { willReadFrequently: true });
    const ctx = canvas.getContext("2d");
    const gctx = glow.getContext("2d");
    if (!sctx || !ctx || !gctx) return;

    const paint = () => {
      if (disposed || !ctx || !sctx || !gctx) return;
      const w = canvas.clientWidth || root.clientWidth;
      const h = canvas.clientHeight || root.clientHeight;
      if (!w || !h) return;

      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const pw = Math.floor(w * dpr);
      const ph = Math.floor(h * dpr);
      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw;
        canvas.height = ph;
        glow.width = Math.max(1, Math.floor(pw / 5));
        glow.height = Math.max(1, Math.floor(ph / 5));
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      if (video.readyState < 2) return;

      const vw = video.videoWidth || COLS;
      const vh = video.videoHeight || ROWS;
      const scale = Math.min(COLS / vw, ROWS / vh);
      const dw = vw * scale;
      const dh = vh * scale;
      const dx = (COLS - dw) / 2;
      const dy = ROWS - dh;
      sctx.fillStyle = "#000";
      sctx.fillRect(0, 0, COLS, ROWS);
      sctx.drawImage(video, dx, dy, dw, dh);

      let data: ImageData;
      try {
        data = sctx.getImageData(0, 0, COLS, ROWS);
      } catch {
        return;
      }

      const lum = new Float32Array(COLS * ROWS);
      const pixels = data.data;
      let lumMin = 1;
      let lumMax = 0;
      for (let i = 0; i < COLS * ROWS; i++) {
        const p = i * 4;
        if ((pixels[p + 3] ?? 0) < 10) {
          lum[i] = 0;
          continue;
        }
        const v = luminance(pixels[p]!, pixels[p + 1]!, pixels[p + 2]!) / 255;
        lum[i] = v;
        if (v > 0.02) {
          if (v < lumMin) lumMin = v;
          if (v > lumMax) lumMax = v;
        }
      }
      // Auto-stretch contrast so dark video still reads like the ref
      const range = Math.max(0.12, lumMax - lumMin);
      for (let i = 0; i < COLS * ROWS; i++) {
        const v = lum[i] ?? 0;
        if (v <= 0.02) continue;
        lum[i] = Math.min(1, Math.max(0, (v - lumMin) / range));
      }

      const cellW = w / COLS;
      const cellH = h / ROWS;
      const fontPx = Math.max(6, Math.floor(Math.min(cellW, cellH) * 1.08));
      ctx.font = `600 ${fontPx}px "Geist Pixel", ui-monospace, Menlo, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      frame = (frame + 1) % 24;

      // Soft silhouette bloom — scaled up for visibility, still light
      gctx.setTransform(1, 0, 0, 1, 0, 0);
      gctx.clearRect(0, 0, glow.width, glow.height);
      const gw = glow.width;
      const gh = glow.height;
      const gimg = gctx.createImageData(gw, gh);
      for (let gy = 0; gy < gh; gy++) {
        for (let gx = 0; gx < gw; gx++) {
          const sx = Math.min(COLS - 1, Math.floor((gx / gw) * COLS));
          const sy = Math.min(ROWS - 1, Math.floor((gy / gh) * ROWS));
          const L = lum[sy * COLS + sx] ?? 0;
          if (L < 0.08) continue;
          const c = mix(C_DIM, C_HOT, L);
          const o = (gy * gw + gx) * 4;
          gimg.data[o] = c.r;
          gimg.data[o + 1] = c.g;
          gimg.data[o + 2] = c.b;
          gimg.data[o + 3] = Math.floor((0.18 + L * 0.35) * 255);
        }
      }
      gctx.putImageData(gimg, 0, 0);

      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const i = y * COLS + x;
          const Lraw = lum[i] ?? 0;
          if (Lraw < 0.03) continue;
          const L = toneMap(Lraw);

          // Surface normals from luminance
          const tl = sampleLum(lum, x - 1, y - 1);
          const t = sampleLum(lum, x, y - 1);
          const tr = sampleLum(lum, x + 1, y - 1);
          const left = sampleLum(lum, x - 1, y);
          const right = sampleLum(lum, x + 1, y);
          const bl = sampleLum(lum, x - 1, y + 1);
          const bot = sampleLum(lum, x, y + 1);
          const br = sampleLum(lum, x + 1, y + 1);
          const nx = -tl - 2 * left - bl + tr + 2 * right + br;
          const ny = -tl - 2 * t - tr + bl + 2 * bot + br;

          // Studio key like the ref: upper-left front → forehead / nose / cheek lit
          const u = x / (COLS - 1);
          const v = y / (ROWS - 1);
          const key =
            0.55 +
            (1 - u) * 0.28 + // left side brighter
            (1 - v) * 0.22 + // top brighter
            -Math.abs(u - 0.48) * 0.15; // center face focus
          const ndot =
            (-nx * 0.7 + -ny * 0.9 + 0.55) / (1 + Math.abs(nx) * 0.8 + Math.abs(ny) * 0.8);
          const lambert = Math.min(1.35, Math.max(0.05, key * 0.55 + ndot * 0.9));

          const neigh = (tl + t + tr + left + right + bl + bot + br) / 8;
          const ao = Math.min(1.05, Math.max(0.3, 0.5 + (Lraw - neigh) * 2.8));

          // Stronger light/dark spread for readable 3D face volume
          let shade = L * 0.5 + lambert * 0.55;
          shade = shade * ao;
          shade = Math.min(1, Math.max(0.1, shade + 0.06));
          shade = Math.pow(shade, 0.78);

          let idx = Math.min(
            ASCII.length - 1,
            Math.floor(shade * (ASCII.length - 0.01)),
          );
          if (shade > 0.78 && ((x + y + frame) & 19) === 0) {
            idx = Math.max(0, idx - 2);
          }
          const ch = ASCII[idx] ?? " ";
          if (ch === " ") continue;

          const cx = (x + 0.5) * cellW;
          const cy = (y + 0.5) * cellH;

          const col = surfaceColor(shade);
          const alpha = 0.55 + shade * 0.45;
          ctx.fillStyle = rgb(col, alpha);
          ctx.fillText(ch, cx, cy);

          // Specular ridge on lit planes (nose / brow / cheek)
          if (shade > 0.58 && lambert > 0.72) {
            ctx.fillStyle = rgb(C_HL, 0.14 + (shade - 0.58) * 0.32);
            ctx.fillText(ch, cx, cy);
          }

          // Sparse edge sparks — soft, not busy
          const edge =
            Math.abs(Lraw - left) +
            Math.abs(Lraw - right) +
            Math.abs(Lraw - t) +
            Math.abs(Lraw - bot);
          const sparkSeed = (x * 31 + y * 17 + Math.floor(frame / 3)) % 37;
          const wantSpark =
            shade > 0.78 && edge > 0.42 && sparkSeed === 0;
          if (wantSpark) {
            const pulse = 0.65 + 0.35 * Math.abs(Math.sin((frame * 0.4 + x) * 0.5));
            const s = Math.max(1.1, Math.min(cellW, cellH) * 0.22 * pulse);
            ctx.save();
            ctx.shadowColor = rgb(C_SPARK, 0.45);
            ctx.shadowBlur = 4 + pulse * 3;
            ctx.fillStyle = rgb(C_SPARK, 0.5 + pulse * 0.25);
            ctx.fillRect(cx - s / 2, cy - s / 2, s, s);
            ctx.restore();
          }
        }
      }
    };

    const tick = () => {
      if (disposed) return;
      paint();
      if (visible && !document.hidden && !motion.matches) {
        raf = requestAnimationFrame(tick);
      }
    };

    const sync = () => {
      if (disposed) return;
      cancelAnimationFrame(raf);
      if (!visible || document.hidden || motion.matches) {
        video.pause();
        paint();
        return;
      }
      void video.play().catch((error: unknown) => {
        if (disposed) return;
        if (error instanceof DOMException && error.name === "AbortError") return;
      });
      raf = requestAnimationFrame(tick);
    };

    const restartLoop = () => {
      if (disposed || !visible || motion.matches) return;
      try {
        video.currentTime = 0;
      } catch {
        /* ignore */
      }
      void video.play().catch(() => {});
    };

    const onReady = () => {
      sync();
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { threshold: 0.05 },
    );
    observer.observe(root);
    motion.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    video.addEventListener("ended", restartLoop);
    video.addEventListener("loadeddata", onReady);
    video.addEventListener("play", sync);

    const ro = new ResizeObserver(() => paint());
    ro.observe(root);

    sync();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      ro.disconnect();
      motion.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
      video.removeEventListener("ended", restartLoop);
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("play", sync);
      video.pause();
    };
  }, []);

  return (
    <div ref={rootRef} className={styles.root}>
      <video
        ref={videoRef}
        className={styles.sourceVideo}
        src="/videos/ai-hologram-purple-cubic.mp4"
        poster="/videos/ai-hologram-purple-cubic-poster.jpg"
        aria-hidden
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      />
      <canvas ref={glowRef} className={styles.glow} aria-hidden />
      <canvas
        ref={canvasRef}
        className={styles.ascii}
        aria-label="ASCII neural portrait hologram"
        role="img"
      />
    </div>
  );
}
