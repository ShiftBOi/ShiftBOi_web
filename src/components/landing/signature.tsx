"use client";

import { cn } from "cn";
import { useEffect, useRef } from "react";

/**
 * Handwriting mark over the pitch photo — write-on when motion is fine,
 * instant show on phones / reduced-motion (Safari clip-path is unreliable).
 */
export function Signature({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touchy = window.matchMedia(
      "(max-width: 900px), (pointer: coarse)"
    ).matches;

    if (reduce || touchy) {
      node.classList.add("is-drawn");
      return;
    }

    let started = false;
    let drawTimer = 0;

    const start = () => {
      if (started) return;
      started = true;
      node.classList.add("is-drawing");
      drawTimer = window.setTimeout(() => node.classList.add("is-drawn"), 1700);
    };

    const inView = () => {
      const nr = node.getBoundingClientRect();
      return nr.top < window.innerHeight && nr.bottom > 0;
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        start();
        observer.disconnect();
      },
      { threshold: 0.01, rootMargin: "80px 0px" }
    );
    observer.observe(node);

    if (inView()) start();
    const raf = requestAnimationFrame(() => {
      if (inView()) start();
    });
    const fallback = window.setTimeout(start, 800);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
      window.clearTimeout(fallback);
      window.clearTimeout(drawTimer);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "svg-sign pointer-events-none",
        className ?? "absolute -top-1/32 -left-1/12 w-3/4"
      )}
      aria-hidden
    >
      <div className="svg-sign__hand" role="img" aria-label="Tianqi" />
    </div>
  );
}
