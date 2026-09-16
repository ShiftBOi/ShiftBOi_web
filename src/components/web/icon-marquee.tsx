"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/** Empty landscape cells — content added later */
const CELL_COUNT = 8;
const SEGMENT_COPIES = 3;

function MarqueeSegment({
  copies,
  keyPrefix,
  segmentRef,
}: {
  copies: number;
  keyPrefix: string;
  segmentRef?: React.RefObject<HTMLUListElement | null>;
}) {
  const cells = Array.from({ length: copies * CELL_COUNT }, (_, i) => i);

  return (
    <ul
      ref={segmentRef}
      className="flex h-[132px] shrink-0 items-stretch"
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
  const segmentRef = useRef<HTMLUListElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    const segment = segmentRef.current;
    if (!track || !segment) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) return;

    const start = () => {
      tweenRef.current?.kill();
      gsap.set(track, { x: 0 });

      const distance = segment.offsetWidth;
      if (!distance) return;

      const duration = Math.max(distance / 40, 20);

      tweenRef.current = gsap.to(track, {
        x: -distance,
        duration,
        ease: "none",
        repeat: -1,
      });
    };

    start();

    const onResize = () => start();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      tweenRef.current?.kill();
      tweenRef.current = null;
    };
  }, []);

  return (
    <section aria-label="Featured strip" className="relative bg-black">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col gap-[6px]">
        <div className="h-px w-full bg-[var(--color-violet)]" />
        <div className="h-px w-full bg-[var(--color-violet)]" />
      </div>

      <div className="overflow-hidden pt-[14px]">
        <div ref={trackRef} className="flex w-max will-change-transform">
          <MarqueeSegment
            keyPrefix="a"
            copies={SEGMENT_COPIES}
            segmentRef={segmentRef}
          />
          <MarqueeSegment keyPrefix="b" copies={SEGMENT_COPIES} />
        </div>
      </div>
    </section>
  );
}
