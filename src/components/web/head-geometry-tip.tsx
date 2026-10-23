"use client";

import {
  useCallback,
  useEffect,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type Pos = { x: number; y: number };

type Props = {
  children: ReactNode;
  className?: string;
};

const OFFSET_X = 16;
const OFFSET_Y = 18;

/**
 * Shows Lee Perry-Smith head scan attribution as a cursor-following tip.
 * Portaled to document.body so GSAP/pin transforms don't offset `position: fixed`.
 */
export function HeadGeometryTip({ children, className }: Props) {
  const [pos, setPos] = useState<Pos | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const onMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    setPos({ x: event.clientX, y: event.clientY });
  }, []);

  const onLeave = useCallback(() => setPos(null), []);

  useEffect(() => {
    if (!pos) return;
    const hide = () => setPos(null);
    window.addEventListener("blur", hide);
    document.addEventListener("scroll", hide, true);
    return () => {
      window.removeEventListener("blur", hide);
      document.removeEventListener("scroll", hide, true);
    };
  }, [pos]);

  const tip =
    mounted && pos
      ? createPortal(
          <div
            className="head-geo-tip"
            role="tooltip"
            style={{
              left: Math.min(pos.x + OFFSET_X, window.innerWidth - 280),
              top: Math.min(pos.y + OFFSET_Y, window.innerHeight - 64),
            }}
          >
            Head geometry adapted from{" "}
            <a
              href="https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf/LeePerrySmith"
              target="_blank"
              rel="noopener noreferrer"
            >
              Infinite, 3D Head Scan
            </a>{" "}
            by Lee Perry-Smith (
            <a
              href="https://creativecommons.org/licenses/by/3.0/"
              target="_blank"
              rel="noopener noreferrer"
            >
              CC BY 3.0
            </a>
            ).
          </div>,
          document.body,
        )
      : null;

  return (
    <div
      className={className}
      style={{ position: "relative", width: "100%", height: "100%" }}
      onPointerEnter={onMove}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      {children}
      {tip}
    </div>
  );
}
