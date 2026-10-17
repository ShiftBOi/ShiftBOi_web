"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  src: string;
  poster?: string;
  className?: string;
  style?: React.CSSProperties;
  "aria-hidden"?: boolean;
  "aria-label"?: string;
};

/**
 * CMS preview video — does not autoplay or preload the full file.
 * Loads only when near the viewport; plays on hover (desktop) so editing
 * stays light while still letting authors check motion.
 */
export function CmsPreviewVideo({
  src,
  poster,
  className,
  style,
  "aria-hidden": ariaHidden,
  "aria-label": ariaLabel,
}: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "80px 0px", threshold: 0.01 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!near) return;
    const node = ref.current;
    if (!node) return;
    // Pause by default — hover/focus plays. Avoids N videos decoding at once.
    node.pause();
  }, [near, src]);

  return (
    <video
      ref={ref}
      className={className}
      src={near ? src : undefined}
      poster={poster}
      style={style}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden={ariaHidden}
      aria-label={ariaLabel}
      onMouseEnter={(e) => {
        void e.currentTarget.play().catch(() => undefined);
      }}
      onMouseLeave={(e) => {
        e.currentTarget.pause();
      }}
      onFocus={(e) => {
        void e.currentTarget.play().catch(() => undefined);
      }}
      onBlur={(e) => {
        e.currentTarget.pause();
      }}
    />
  );
}
