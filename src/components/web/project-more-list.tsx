"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";

const COLS = 10;
const ROWS = 7;
const CELL_COUNT = COLS * ROWS;
const PREVIEW_W = 360;
const PREVIEW_H = 250;
/** How many pixels paint per animation frame (Loop-like snappy fill) */
const CELLS_PER_FRAME = 2;

export type ProjectMoreItem = {
  slug: string;
  title: string;
  summary: string;
  year: string;
  introSrc?: string;
};

function shuffleIndices(seed: number) {
  const order = Array.from({ length: CELL_COUNT }, (_, i) => i);
  let s = seed || 1;
  for (let i = order.length - 1; i > 0; i--) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    const tmp = order[i]!;
    order[i] = order[j]!;
    order[j] = tmp;
  }
  return order;
}

function PixelReveal({
  src,
  active,
  x,
  y,
}: {
  src: string;
  active: boolean;
  x: number;
  y: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [ready, setReady] = useState(false);

  // Preload image
  useEffect(() => {
    setReady(false);
    const img = new window.Image();
    img.decoding = "async";
    img.src = src;
    const done = () => {
      imgRef.current = img;
      setReady(true);
    };
    if (img.complete && img.naturalWidth > 0) done();
    else img.onload = done;
    return () => {
      img.onload = null;
    };
  }, [src]);

  // Pixel dissolve in / clear out
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(PREVIEW_W * dpr);
    canvas.height = Math.round(PREVIEW_H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, PREVIEW_W, PREVIEW_H);
    ctx.imageSmoothingEnabled = false;

    if (!active || !ready || !imgRef.current) return;

    const img = imgRef.current;
    const order = shuffleIndices(Date.now() % 100000);
    const cellW = PREVIEW_W / COLS;
    const cellH = PREVIEW_H / ROWS;
    const srcCellW = img.naturalWidth / COLS;
    const srcCellH = img.naturalHeight / ROWS;

    let i = 0;
    const tick = () => {
      for (let n = 0; n < CELLS_PER_FRAME && i < order.length; n += 1, i += 1) {
        const idx = order[i]!;
        const c = idx % COLS;
        const r = Math.floor(idx / COLS);
        ctx.drawImage(
          img,
          c * srcCellW,
          r * srcCellH,
          srcCellW,
          srcCellH,
          c * cellW,
          r * cellH,
          cellW + 0.5,
          cellH + 0.5,
        );
      }
      if (i < order.length) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [active, ready, src]);

  return (
    <div
      className={`project-more-preview${active && ready ? " is-visible" : ""}`}
      style={{
        left: x,
        top: y,
        width: PREVIEW_W,
        height: PREVIEW_H,
      }}
      aria-hidden
    >
      <canvas ref={canvasRef} className="project-more-pixel-canvas" />
    </div>
  );
}

export function ProjectMoreList({ projects }: { projects: ProjectMoreItem[] }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [pos, setPos] = useState({ x: 40, y: 40 });

  const onMove = useCallback((e: MouseEvent) => {
    const root = stageRef.current;
    if (!root) return;
    const rect = root.getBoundingClientRect();
    let x = e.clientX - rect.left + 24;
    let y = e.clientY - rect.top - PREVIEW_H / 2;

    if (x + PREVIEW_W > rect.width - 12) {
      x = e.clientX - rect.left - PREVIEW_W - 24;
    }
    y = Math.max(0, Math.min(y, Math.max(0, rect.height - PREVIEW_H)));
    setPos({ x, y });
  }, []);

  const onEnter = useCallback((introSrc?: string) => {
    if (!introSrc) {
      setVisible(false);
      return;
    }
    setPreviewSrc(introSrc);
    setVisible(true);
  }, []);

  return (
    <div ref={stageRef} className="project-more-stage">
      <ul
        className="project-more-list"
        onMouseMove={onMove}
        onMouseLeave={() => setVisible(false)}
      >
        {projects.map((p) => (
          <li key={p.slug} className="project-docs-row">
            <Link
              href={`/projects/${p.slug}`}
              className="project-docs-row-hit is-link"
              onMouseEnter={() => onEnter(p.introSrc)}
            >
              <span className="project-docs-row-date">{p.year}</span>
              <span className="project-docs-row-center">
                <span className="project-docs-row-title">{p.title}</span>
                <span className="project-docs-row-sub">{p.summary}</span>
              </span>
              <span className="project-docs-row-mins" aria-hidden>
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {previewSrc ? (
        <PixelReveal src={previewSrc} active={visible} x={pos.x} y={pos.y} />
      ) : null}
    </div>
  );
}
