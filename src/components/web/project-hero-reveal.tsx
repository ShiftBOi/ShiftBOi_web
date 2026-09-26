"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

type LenisLike = {
  on: (event: string, callback: (e?: { scroll: number }) => void) => void;
  off: (event: string, callback: (e?: { scroll: number }) => void) => void;
  scrollTo: (
    target: number | string | HTMLElement,
    options?: { immediate?: boolean; lock?: boolean },
  ) => void;
  scroll: number;
  limit: number;
};

type ProjectHeroRevealProps = {
  colorSrc: string;
  bwSrc: string;
  alt: string;
  poster?: string;
  objectPosition?: string;
  children?: ReactNode;
};

function isVideoSrc(src: string) {
  return /\.(mov|mp4|webm)(\?|$)/i.test(src);
}

/**
 * Sticky B&W → color reveal.
 * Scroll while locked only drives the color wipe.
 * Content below is unreachable until revealProgress === 1.
 * B&W is CSS grayscale on the back layer — same src works for CMS uploads.
 */
export function ProjectHeroReveal({
  colorSrc,
  bwSrc,
  alt,
  poster,
  objectPosition = "50% 50%",
  children,
}: ProjectHeroRevealProps) {
  const containerRef = useRef<HTMLElement>(null);
  const bwVideoRef = useRef<HTMLVideoElement>(null);
  const colorVideoRef = useRef<HTMLVideoElement>(null);
  const [revealProgress, setRevealProgress] = useState(0);
  const progressRef = useRef(0);
  const colorIsVideo = isVideoSrc(colorSrc);
  const bwIsVideo = isVideoSrc(bwSrc);
  const mediaPositionStyle = { objectPosition };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const getUnlockScrollY = () => {
      // Absolute document Y where sticky ends (= color is 100%)
      const top = container.getBoundingClientRect().top + window.scrollY;
      return top + container.offsetHeight - window.innerHeight;
    };

    const updateProgress = () => {
      const rect = container.getBoundingClientRect();
      const stickyDuration = container.offsetHeight - window.innerHeight;
      if (stickyDuration <= 0) {
        progressRef.current = 1;
        setRevealProgress(1);
        return 1;
      }
      // Progress from when sticky starts pinning (rect.top <= 0)
      const raw = -rect.top / stickyDuration;
      const progress = Math.max(0, Math.min(1, raw));
      progressRef.current = progress;
      setRevealProgress(progress);
      return progress;
    };

    const clampIfLocked = () => {
      const progress = updateProgress();
      if (progress >= 0.995) return;

      const unlockY = getUnlockScrollY();
      const lenis = (window as unknown as { lenis?: LenisLike }).lenis;
      const currentY = lenis?.scroll ?? window.scrollY;

      if (currentY > unlockY + 1) {
        if (lenis) {
          lenis.scrollTo(unlockY, { immediate: true });
        } else {
          window.scrollTo(0, unlockY);
        }
      }
    };

    const onScroll = () => clampIfLocked();

    const lenis = (window as unknown as { lenis?: LenisLike }).lenis;
    if (lenis) {
      lenis.on("scroll", onScroll);
      onScroll();
      return () => lenis.off("scroll", onScroll);
    }

    window.addEventListener("scroll", onScroll, { passive: false });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Keep dual hero videos in sync (B&W + color layers)
  useEffect(() => {
    if (!colorIsVideo || !bwIsVideo) return;
    const color = colorVideoRef.current;
    const bw = bwVideoRef.current;
    if (!color || !bw) return;

    const sync = () => {
      if (Math.abs(color.currentTime - bw.currentTime) > 0.12) {
        bw.currentTime = color.currentTime;
      }
    };

    const playBoth = () => {
      void color.play().catch(() => undefined);
      void bw.play().catch(() => undefined);
    };

    color.addEventListener("timeupdate", sync);
    color.addEventListener("play", playBoth);
    playBoth();

    return () => {
      color.removeEventListener("timeupdate", sync);
      color.removeEventListener("play", playBoth);
    };
  }, [colorIsVideo, bwIsVideo, colorSrc, bwSrc]);

  // Block wheel / touch from jumping past unlock while incomplete
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const getUnlockScrollY = () => {
      const top = container.getBoundingClientRect().top + window.scrollY;
      return top + container.offsetHeight - window.innerHeight;
    };

    const blockPastUnlock = (deltaY: number) => {
      if (progressRef.current >= 0.995) return false;
      if (deltaY <= 0) return false;
      const unlockY = getUnlockScrollY();
      const lenis = (window as unknown as { lenis?: LenisLike }).lenis;
      const currentY = lenis?.scroll ?? window.scrollY;
      if (currentY >= unlockY - 2) {
        if (lenis) lenis.scrollTo(unlockY, { immediate: true });
        else window.scrollTo(0, unlockY);
        return true;
      }
      return false;
    };

    const onWheel = (e: WheelEvent) => {
      if (blockPastUnlock(e.deltaY)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY ?? 0;
      const deltaY = touchStartY - y; // positive = scroll down
      if (blockPastUnlock(deltaY)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true, capture: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false, capture: true });

    return () => {
      window.removeEventListener("wheel", onWheel, true);
      window.removeEventListener("touchstart", onTouchStart, true);
      window.removeEventListener("touchmove", onTouchMove, true);
    };
  }, []);

  return (
    <section ref={containerRef} className="project-reveal" aria-label={`${alt} reveal`}>
      <div className="project-reveal-sticky">
        <div className="project-reveal-frame">
          <div className="project-reveal-layer is-bw">
            {bwIsVideo ? (
              <video
                ref={bwVideoRef}
                className="project-reveal-media is-bw-video"
                src={bwSrc}
                poster={poster}
                muted
                loop
                playsInline
                autoPlay
                preload="auto"
                aria-hidden
                style={mediaPositionStyle}
              />
            ) : (
              <Image
                src={bwSrc}
                alt=""
                fill
                priority
                className="object-cover"
                sizes="100vw"
                style={mediaPositionStyle}
              />
            )}
          </div>

          <div
            className="project-reveal-layer is-color"
            style={{ clipPath: `inset(${(1 - revealProgress) * 100}% 0 0 0)` }}
          >
            {colorIsVideo ? (
              <video
                ref={colorVideoRef}
                className="project-reveal-media"
                src={colorSrc}
                poster={poster}
                muted
                loop
                playsInline
                autoPlay
                preload="auto"
                aria-label={alt}
                style={mediaPositionStyle}
              />
            ) : (
              <Image
                src={colorSrc}
                alt={alt}
                fill
                priority
                className="object-cover"
                sizes="100vw"
                style={mediaPositionStyle}
              />
            )}
          </div>

          <div
            className="project-reveal-line"
            style={{ top: `${(1 - revealProgress) * 100}%` }}
            aria-hidden
          />

          <div className="project-reveal-scrim" aria-hidden />
        </div>

        {children ? (
          <div className="project-reveal-copy">
            {children}
          </div>
        ) : null}

        <div
          className="project-reveal-hint"
          style={{ opacity: Math.max(0, 1 - revealProgress * 2.5) }}
          aria-hidden
        >
          <span>Scroll to reveal</span>
          <i />
        </div>
      </div>
    </section>
  );
}

export function ProjectHeroCopy({
  crumbHref,
  crumbLabel,
  title,
  titleIcon,
  role,
  thesisLead,
  thesisHighlight,
  thesisRest,
  thesisBody,
  meta,
}: {
  crumbHref: string;
  crumbLabel: string;
  title: string;
  titleIcon?: string;
  role: string;
  thesisLead: string;
  thesisHighlight: string;
  thesisRest: string;
  thesisBody: string;
  meta: string;
}) {
  return (
    <div className="project-intro-inner is-on-hero">
      <p className="project-page-crumb">
        <Link href={crumbHref}>Selected Projects</Link>
        <span aria-hidden> / </span>
        <span>{crumbLabel}</span>
      </p>

      <header className="project-intro-heading">
        <h1 className={`project-page-title project-intro-title${titleIcon ? " has-icon" : ""}`}>
          {titleIcon ? (
            <Image
              src={titleIcon}
              alt=""
              width={88}
              height={88}
              unoptimized
              className="project-page-title-icon"
            />
          ) : null}
          <span className="project-page-title-text">{title}</span>
        </h1>
        <p className="project-page-role">{role}</p>
      </header>

      <div className="project-intro-label">
        <span aria-hidden>◆</span>
        <span>The Overview</span>
      </div>

      <h2 className="project-intro-lead">
        {thesisLead} <span className="project-thesis-accent">{thesisHighlight}</span> {thesisRest}
      </h2>

      <p className="project-intro-body">{thesisBody}</p>
      <p className="project-thesis-meta">{meta}</p>
    </div>
  );
}
