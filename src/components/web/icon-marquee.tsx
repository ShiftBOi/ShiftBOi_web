"use client";

import { useEffect, useRef, useState } from "react";

/** Empty landscape cells — content added later */
const CELL_COUNT = 8;
const SEGMENT_COPIES = 3;

function MarqueeSegment({
  copies,
  keyPrefix,
}: {
  copies: number;
  keyPrefix: string;
}) {
  const cells = Array.from({ length: copies * CELL_COUNT }, (_, i) => i);

  return (
    <ul
      className="flex h-[110px] shrink-0 items-stretch"
      aria-hidden={keyPrefix !== "a"}
    >
      {cells.map((index) => (
        <li
          key={`${keyPrefix}-${index}`}
          className="w-[168px] shrink-0 border-r border-[#2a2a2a]"
        />
      ))}
    </ul>
  );
}

export function IconVelocityMarquee() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(48);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setPaused(prefersReduced);

    const measure = () => {
      // Track has 2 identical segments → animate -50%
      const half = track.scrollWidth / 2;
      if (!half) return;
      // ~40px/sec like the previous GSAP speed
      setDuration(Math.max(half / 40, 20));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    return () => ro.disconnect();
  }, []);

  return (
    <section aria-label="Featured strip" className="relative border-b border-[#2e2e2e] bg-black">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col gap-[6px]">
        <div className="h-px w-full bg-[var(--color-violet)]" />
        <div className="h-px w-full bg-[var(--color-violet)]" />
      </div>

      <div className="overflow-hidden pt-[14px]">
        <div
          ref={trackRef}
          className={`icon-marquee-track flex w-max ${paused ? "" : "is-scrolling"}`}
          style={{ ["--marquee-duration" as string]: `${duration}s` }}
        >
          <MarqueeSegment keyPrefix="a" copies={SEGMENT_COPIES} />
          <MarqueeSegment keyPrefix="b" copies={SEGMENT_COPIES} />
        </div>
      </div>
    </section>
  );
}
