"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  src: string;
  poster?: string;
  className?: string;
  "aria-label"?: string;
  /** Above-the-fold hero — load ASAP but don't force the full file (`preload=auto`). */
  eager?: boolean;
};

/**
 * Muted looping case-study video. Below-fold clips stay `preload=none` until
 * near the viewport so the page doesn't download every video on open.
 */
export function CaseStudyVideo({
  src,
  poster,
  className,
  "aria-label": ariaLabel,
  eager = false,
}: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(eager);

  useEffect(() => {
    if (eager) return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px 0px", threshold: 0.01 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [eager]);

  useEffect(() => {
    if (!active) return;
    const node = ref.current;
    if (!node) return;
    void node.play().catch(() => {
      /* autoplay can be blocked; poster remains */
    });
  }, [active, src]);

  return (
    <video
      ref={ref}
      className={className}
      src={active ? src : undefined}
      poster={poster}
      muted
      loop
      playsInline
      autoPlay={active}
      preload={eager ? "metadata" : "none"}
      aria-label={ariaLabel}
    />
  );
}
