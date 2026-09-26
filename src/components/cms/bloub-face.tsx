"use client";

import { useEffect, useId, useRef } from "react";

type BloubFaceProps = {
  size?: number;
  active?: boolean;
  className?: string;
};

const BODY =
  "M97.56 -0.3C97.08 2.9 96.39 6.08 95.58 9.16C94.77 12.25 93.79 15.29 92.71 18.24C91.63 21.19 90.4 24.07 89.08 26.87C87.77 29.66 86.33 32.38 84.82 35.02C83.31 37.66 81.69 40.22 80.01 42.7C78.33 45.18 76.56 47.58 74.73 49.9C72.89 52.23 70.98 54.47 69 56.64C67.01 58.8 64.96 60.89 62.84 62.89C60.71 64.89 58.52 66.82 56.25 68.64C53.99 70.47 51.65 72.21 49.24 73.84C46.83 75.47 44.35 77.01 41.81 78.43C39.27 79.84 36.66 81.15 33.99 82.33C31.33 83.51 28.59 84.57 25.82 85.48C23.05 86.4 20.22 87.19 17.37 87.83C14.51 88.47 11.61 88.97 8.7 89.32C5.79 89.67 2.85 89.87 -0.09 89.93C-3.03 89.99 -5.98 89.9 -8.91 89.67C-11.85 89.44 -14.78 89.06 -17.69 88.55C-20.59 88.04 -23.49 87.39 -26.34 86.61C-29.2 85.84 -32.03 84.93 -34.82 83.9C-37.61 82.88 -40.37 81.72 -43.07 80.46C-45.78 79.19 -48.45 77.81 -51.06 76.31C-53.68 74.82 -56.25 73.21 -58.76 71.49C-61.26 69.77 -63.72 67.94 -66.11 66C-68.49 64.06 -70.82 62 -73.06 59.83C-75.29 57.67 -77.46 55.39 -79.52 53C-81.57 50.61 -83.55 48.1 -85.39 45.49C-87.23 42.88 -88.97 40.15 -90.54 37.32C-92.11 34.5 -93.56 31.57 -94.82 28.56C-96.08 25.55 -97.19 22.44 -98.09 19.28C-98.99 16.12 -99.71 12.87 -100.2 9.6C-100.69 6.34 -100.98 3.01 -101.04 -0.3C-101.09 -3.6 -100.92 -6.95 -100.52 -10.23C-100.13 -13.51 -99.49 -16.8 -98.64 -19.98C-97.79 -23.17 -96.7 -26.32 -95.43 -29.34C-94.15 -32.36 -92.64 -35.31 -90.97 -38.1C-89.3 -40.89 -87.42 -43.58 -85.42 -46.1C-83.42 -48.62 -81.23 -51 -78.96 -53.22C-76.69 -55.44 -74.28 -57.5 -71.81 -59.41C-69.35 -61.31 -66.77 -63.06 -64.18 -64.66C-61.59 -66.27 -58.93 -67.71 -56.27 -69.04C-53.61 -70.38 -50.92 -71.56 -48.24 -72.66C-45.55 -73.75 -42.86 -74.72 -40.19 -75.63C-37.51 -76.54 -34.84 -77.34 -32.18 -78.1C-29.52 -78.87 -26.88 -79.55 -24.23 -80.2C-21.58 -80.85 -18.94 -81.45 -16.28 -82.01C-13.61 -82.57 -10.95 -83.1 -8.26 -83.57C-5.56 -84.05 -2.85 -84.5 -0.09 -84.87C2.67 -85.25 5.46 -85.59 8.3 -85.84C11.14 -86.08 14.03 -86.27 16.95 -86.34C19.88 -86.4 22.86 -86.39 25.87 -86.22C28.87 -86.06 31.93 -85.78 34.98 -85.32C38.03 -84.86 41.13 -84.27 44.18 -83.47C47.23 -82.67 50.3 -81.7 53.29 -80.52C56.28 -79.34 59.25 -77.97 62.1 -76.4C64.95 -74.82 67.75 -73.04 70.39 -71.07C73.02 -69.1 75.57 -66.92 77.91 -64.58C80.26 -62.24 82.47 -59.7 84.46 -57.03C86.46 -54.37 88.28 -51.52 89.87 -48.58C91.46 -45.65 92.84 -42.56 94 -39.44C95.16 -36.31 96.09 -33.06 96.81 -29.82C97.52 -26.57 98.01 -23.24 98.29 -19.95C98.58 -16.66 98.63 -13.33 98.51 -10.05C98.39 -6.77 98.05 -3.5 97.56 -0.3Z";

const EYE =
  "M-20 -10A20 20 0 0 1 0 -30L0 -30A20 20 0 0 1 20 -10L20 10A20 20 0 0 1 0 30L0 30A20 20 0 0 1 -20 10Z";

const EYE_L = "matrix(0.93,0.1,0.01,0.95,-34.23,20.61)";
const EYE_R = "matrix(0.94,-0.11,0.01,0.95,30.21,18.67)";

/** Center between the two eyes in the neutral pose. */
const EYE_CX = -2;
const EYE_CY = 20;

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/**
 * Map pointer offset → unit look vector on a soft sphere,
 * so gaze stays round (not skewed to a corner).
 */
function sphereLook(dx: number, dy: number, radiusPx: number) {
  const nx = clamp(dx / radiusPx, -1, 1);
  const ny = clamp(dy / radiusPx, -1, 1);
  // Keep direction inside unit circle so diagonals aren't stronger.
  const len = Math.hypot(nx, ny) || 1;
  const capped = Math.min(1, len);
  const ux = (nx / len) * capped;
  const uy = (ny / len) * capped;
  // Sphere foreshortening: outer look slightly softens.
  const depth = Math.sqrt(Math.max(0, 1 - capped * capped));
  return { ux, uy, capped, depth };
}

export function BloubFace({ size = 26, active = false, className = "" }: BloubFaceProps) {
  const reactId = useId().replace(/:/g, "");
  const maskId = `bloub-mask-${reactId}`;
  const rootRef = useRef<HTMLSpanElement>(null);
  const faceRef = useRef<SVGGElement>(null);
  const eyeRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const face = faceRef.current;
    const eyes = eyeRef.current;
    if (!root || !face || !eyes) return;

    let raf = 0;
    let alive = true;
    let blinkTimer = 0;
    let nextBreathAt = 0;
    let nextBlinkAt = performance.now() + rand(1600, 3800);

    let mouseX = window.innerWidth * 0.5;
    let mouseY = window.innerHeight * 0.4;

    let tx = 0;
    let ty = 0;
    let rot = 0;
    let sx = 1;
    let sy = 1;
    let targetTx = 0;
    let targetTy = 0;
    let targetRot = 0;
    let targetSx = 1;
    let targetSy = 1;

    let lookX = 0;
    let lookY = 0;
    let targetLookX = 0;
    let targetLookY = 0;
    let blink = 1;
    let targetBlink = 1;

    const onMove = (e: PointerEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    window.addEventListener("pointermove", onMove, { passive: true });

    const tick = (now: number) => {
      if (!alive) return;

      const rect = root.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const { ux, uy, capped, depth } = sphereLook(
        mouseX - cx,
        mouseY - cy,
        180,
      );
      const amp = active ? 1.15 : 1;

      // Eyes travel across the round face (stay centered pair).
      const eyeReach = (active ? 26 : 22) * amp;
      targetLookX = ux * eyeReach * (0.65 + 0.35 * depth);
      targetLookY = uy * eyeReach * (0.65 + 0.35 * depth);

      // Whole face turns like a soft ball — gentle yaw/pitch, no corner skew.
      targetRot = ux * 10 * amp;
      targetTx = ux * 10 * amp;
      targetTy = uy * 10 * amp;
      // Slight squash toward look direction (pseudo-3D sphere).
      targetSx = 1 - Math.abs(ux) * 0.06 * capped + Math.abs(uy) * 0.02;
      targetSy = 1 - Math.abs(uy) * 0.06 * capped + Math.abs(ux) * 0.02;

      if (now >= nextBreathAt) {
        const b = rand(0.985, active ? 1.03 : 1.02);
        targetSx *= b;
        targetSy *= b;
        nextBreathAt = now + rand(1000, 1900);
      }

      if (now >= nextBlinkAt) {
        targetBlink = 0.12;
        nextBlinkAt = now + rand(2200, 5200);
        window.clearTimeout(blinkTimer);
        blinkTimer = window.setTimeout(() => {
          targetBlink = 1;
        }, rand(90, 150));
      }

      const ease = 0.18;
      tx += (targetTx - tx) * ease;
      ty += (targetTy - ty) * ease;
      rot += (targetRot - rot) * ease;
      sx += (targetSx - sx) * 0.12;
      sy += (targetSy - sy) * 0.12;
      lookX += (targetLookX - lookX) * 0.22;
      lookY += (targetLookY - lookY) * 0.22;
      blink += (targetBlink - blink) * 0.38;

      face.setAttribute(
        "transform",
        `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) rotate(${rot.toFixed(2)}) scale(${sx.toFixed(3)} ${sy.toFixed(3)})`,
      );
      eyes.setAttribute(
        "transform",
        `translate(${lookX.toFixed(2)} ${lookY.toFixed(2)}) translate(${EYE_CX} ${EYE_CY}) scale(1 ${blink.toFixed(3)}) translate(${-EYE_CX} ${-EYE_CY})`,
      );

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.clearTimeout(blinkTimer);
      window.removeEventListener("pointermove", onMove);
    };
  }, [active]);

  return (
    <span
      ref={rootRef}
      className={`cms-bloub${active ? " is-active" : ""}${className ? ` ${className}` : ""}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        className="cms-bloub-svg"
        width={size}
        height={size}
        viewBox="-125 -125 250 250"
        xmlns="http://www.w3.org/2000/svg"
        overflow="visible"
      >
        <defs>
          <mask
            id={maskId}
            maskUnits="userSpaceOnUse"
            x="-158"
            y="-158"
            width="316"
            height="316"
          >
            <path d={BODY} fill="#fff" />
            <g ref={eyeRef}>
              <path d={EYE} transform={EYE_L} fill="#000" />
              <path d={EYE} transform={EYE_R} fill="#000" />
            </g>
          </mask>
        </defs>
        <g ref={faceRef}>
          <path d={BODY} className="cms-bloub-back" />
          <rect
            x="-158"
            y="-158"
            width="316"
            height="316"
            className="cms-bloub-fill"
            mask={`url(#${maskId})`}
          />
        </g>
      </svg>
    </span>
  );
}
