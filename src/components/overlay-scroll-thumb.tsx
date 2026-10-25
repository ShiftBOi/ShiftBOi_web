"use client";

import { cn } from "cn";
import { useEffect, useRef } from "react";

/**
 * Short 2px thumb with difference blend — same mark as SiteScrollbar /
 * CmsScrollbar — for any overflow element (textarea, pane, etc.).
 */
export function OverlayScrollThumb({
  scrollRef,
  className,
  pad = 16,
  minSize = 40,
}: {
  scrollRef: { current: HTMLElement | null };
  className?: string;
  pad?: number;
  minSize?: number;
}) {
  const thumbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const thumb = thumbRef.current;
    const scroller = scrollRef.current;
    if (!thumb || !scroller) return;

    let frame = 0;

    const update = () => {
      const max = scroller.scrollHeight - scroller.clientHeight;
      if (max <= 1) {
        thumb.style.opacity = "0";
        return;
      }
      const view = scroller.clientHeight;
      const track = Math.max(0, view - pad * 2);
      const size = Math.min(
        track,
        Math.max(minSize, (view / scroller.scrollHeight) * track)
      );
      const y = pad + (scroller.scrollTop / max) * (track - size);
      thumb.style.opacity = "1";
      thumb.style.height = `${size}px`;
      thumb.style.transform = `translate3d(0, ${y}px, 0)`;
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    update();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    scroller.addEventListener("input", onScroll);
    window.addEventListener("resize", onScroll);
    const observer = new ResizeObserver(onScroll);
    observer.observe(scroller);

    return () => {
      cancelAnimationFrame(frame);
      scroller.removeEventListener("scroll", onScroll);
      scroller.removeEventListener("input", onScroll);
      window.removeEventListener("resize", onScroll);
      observer.disconnect();
    };
  }, [scrollRef, pad, minSize]);

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-y-0 right-[3px] z-10 w-[2px] mix-blend-difference",
        className
      )}
    >
      <div
        ref={thumbRef}
        className="absolute inset-x-0 top-0 bg-white opacity-0"
      />
    </div>
  );
}
