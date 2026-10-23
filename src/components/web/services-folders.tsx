"use client";

import { useCallback, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { HydraBandCornerSquares } from "@/components/web/hydra-primitives";
import type { ServiceItem } from "@/lib/content";

const FALLBACK_FIGS = [
  "/brand/services/01-brand.svg",
  "/brand/services/02-web.svg",
  "/brand/services/03-opt.svg",
  "/brand/services/04-seo.svg",
  "/brand/services/05-devops.svg",
  "/brand/services/06-maint.svg",
] as const;

const MOBILE_MQ = "(max-width: 700px)";

type Props = {
  services: ServiceItem[];
  eyebrow?: string;
  title?: string;
  lead?: string;
};

export function ServicesFolders({
  services,
  eyebrow = "ShiftBOi.web®",
  title = "Services",
  lead = "Design, build, ship, and keep it healthy — from brand to launch and beyond.",
}: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const activeRef = useRef(0);
  const scrubbingRef = useRef(false);
  const travelRef = useRef(0);
  const cardMidsRef = useRef<number[]>([]);
  const dragRef = useRef<{
    active: boolean;
    moved: boolean;
    startX: number;
    startScroll: number;
    lastX: number;
    lastT: number;
    velocity: number;
  } | null>(null);
  const inertiaRaf = useRef(0);

  /** DOM-only active highlight — no React re-render mid-scrub */
  const setActiveIndex = useCallback((index: number) => {
    if (index === activeRef.current) return;
    const track = trackRef.current;
    if (!track) return;
    const cards = track.querySelectorAll<HTMLElement>(".sb-svc__card");
    cards[activeRef.current]?.classList.remove("is-active");
    cards[index]?.classList.add("is-active");
    activeRef.current = index;
  }, []);

  const syncActiveFromOffset = useCallback(
    (offsetX: number) => {
      const stage = stageRef.current;
      const mids = cardMidsRef.current;
      if (!stage || mids.length <= 1) return;

      const stageMid = offsetX + stage.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      for (let i = 0; i < mids.length; i++) {
        const dist = Math.abs(mids[i]! - stageMid);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      }
      setActiveIndex(best);
    },
    [setActiveIndex],
  );

  const measureTravel = useCallback(() => {
    const stage = stageRef.current;
    const track = trackRef.current;
    if (!stage || !track) return 0;
    const cards = track.querySelectorAll<HTMLElement>(".sb-svc__card");
    cardMidsRef.current = Array.from(cards, (card) =>
      card.offsetLeft + card.offsetWidth / 2,
    );
    const travel = Math.max(0, track.scrollWidth - stage.clientWidth);
    travelRef.current = travel;
    return travel;
  }, []);

  const stopInertia = useCallback(() => {
    if (inertiaRaf.current) {
      cancelAnimationFrame(inertiaRaf.current);
      inertiaRaf.current = 0;
    }
  }, []);

  const runInertia = useCallback(
    (initialVelocity: number) => {
      const stage = stageRef.current;
      if (!stage) return;
      stopInertia();

      let v = initialVelocity;
      const tick = () => {
        if (Math.abs(v) < 0.15) {
          inertiaRaf.current = 0;
          syncActiveFromOffset(stage.scrollLeft);
          return;
        }
        const max = measureTravel();
        stage.scrollLeft = Math.max(0, Math.min(max, stage.scrollLeft + v));
        v *= 0.94;
        if (stage.scrollLeft <= 0 || stage.scrollLeft >= max) v = 0;
        syncActiveFromOffset(stage.scrollLeft);
        inertiaRaf.current = requestAnimationFrame(tick);
      };
      inertiaRaf.current = requestAnimationFrame(tick);
    },
    [measureTravel, stopInertia, syncActiveFromOffset],
  );

  /* Mobile / reduced-motion: native horizontal scroll */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !services.length) return;

    const isFreeScroll = () =>
      window.matchMedia(MOBILE_MQ).matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const onScroll = () => {
      if (scrubbingRef.current) return;
      syncActiveFromOffset(stage.scrollLeft);
    };
    stage.addEventListener("scroll", onScroll, { passive: true });

    let wheelTarget = stage.scrollLeft;
    let wheelRaf = 0;

    const flushWheel = () => {
      wheelRaf = 0;
      if (scrubbingRef.current || !isFreeScroll()) return;
      const max = measureTravel();
      const next = Math.max(0, Math.min(max, wheelTarget));
      gsap.to(stage, {
        scrollLeft: next,
        duration: 0.35,
        ease: "power3.out",
        overwrite: true,
        onUpdate: () => syncActiveFromOffset(stage.scrollLeft),
      });
    };

    const onWheel = (event: WheelEvent) => {
      if (scrubbingRef.current || !isFreeScroll()) return;
      if (stage.scrollWidth <= stage.clientWidth + 2) return;
      const delta =
        Math.abs(event.deltaY) >= Math.abs(event.deltaX)
          ? event.deltaY
          : event.deltaX;
      if (delta === 0) return;
      event.preventDefault();
      stopInertia();
      const max = measureTravel();
      wheelTarget = Math.max(0, Math.min(max, wheelTarget + delta * 1.25));
      if (!wheelRaf) wheelRaf = requestAnimationFrame(flushWheel);
    };
    stage.addEventListener("wheel", onWheel, { passive: false });

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      if (scrubbingRef.current || !isFreeScroll()) return;
      stopInertia();
      gsap.killTweensOf(stage);
      wheelTarget = stage.scrollLeft;
      dragRef.current = {
        active: true,
        moved: false,
        startX: event.clientX,
        startScroll: stage.scrollLeft,
        lastX: event.clientX,
        lastT: performance.now(),
        velocity: 0,
      };
      stage.classList.add("is-dragging");
      stage.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag?.active) return;
      const dx = event.clientX - drag.startX;
      if (Math.abs(dx) > 3) drag.moved = true;
      const now = performance.now();
      const dt = Math.max(1, now - drag.lastT);
      drag.velocity = ((event.clientX - drag.lastX) / dt) * 16.67;
      drag.lastX = event.clientX;
      drag.lastT = now;
      const max = measureTravel();
      stage.scrollLeft = Math.max(0, Math.min(max, drag.startScroll - dx));
      wheelTarget = stage.scrollLeft;
      syncActiveFromOffset(stage.scrollLeft);
    };

    const endDrag = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag?.active) return;
      drag.active = false;
      stage.classList.remove("is-dragging");
      try {
        stage.releasePointerCapture(event.pointerId);
      } catch {
        /* already released */
      }
      if (drag.moved) runInertia(-drag.velocity * 1.35);
    };

    stage.addEventListener("pointerdown", onPointerDown);
    stage.addEventListener("pointermove", onPointerMove);
    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);

    syncActiveFromOffset(stage.scrollLeft);

    return () => {
      stopInertia();
      if (wheelRaf) cancelAnimationFrame(wheelRaf);
      gsap.killTweensOf(stage);
      stage.removeEventListener("scroll", onScroll);
      stage.removeEventListener("wheel", onWheel);
      stage.removeEventListener("pointerdown", onPointerDown);
      stage.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerup", endDrag);
      stage.removeEventListener("pointercancel", endDrag);
    };
  }, [
    services.length,
    measureTravel,
    runInertia,
    stopInertia,
    syncActiveFromOffset,
  ]);

  /**
   * Desktop: pin + linear horizontal scrub.
   * - ease none (no mid-acceleration jank)
   * - scrub true (lock to Lenis scroll, no dual lag)
   * - cached travel (no layout reads every frame)
   * - no React state during scrub
   */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!services.length) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobileMq = window.matchMedia(MOBILE_MQ);
    if (reduced || mobileMq.matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const pin = pinRef.current;
    const stage = stageRef.current;
    const track = trackRef.current;
    if (!section || !pin || !stage || !track) return;

    stage.classList.add("is-pin-scrub");
    scrubbingRef.current = true;
    stage.scrollLeft = 0;

    /* xPercent:0 keeps Y locked — only translate on X */
    gsap.set(track, {
      x: 0,
      y: 0,
      force3D: true,
      immediateRender: true,
    });

    measureTravel();

    const ctx = gsap.context(() => {
      gsap.to(track, {
        x: () => -travelRef.current,
        y: 0,
        ease: "none",
        force3D: true,
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => {
            const travel = measureTravel();
            /* Slightly longer than travel so last card settles before unpin */
            return `+=${Math.max(travel + 80, window.innerHeight * 0.85)}`;
          },
          pin,
          pinSpacing: true,
          /* transform pairs with Lenis; avoid CSS transform on .sb-svc__pin */
          pinType: "transform",
          anticipatePin: 0,
          /* true = 1:1 with Lenis scroll — no second lag layer */
          scrub: true,
          invalidateOnRefresh: true,
          fastScrollEnd: false,
          preventOverlaps: true,
          onRefreshInit: () => {
            measureTravel();
            gsap.set(track, { x: 0, y: 0 });
            stage.scrollLeft = 0;
          },
          onUpdate: (self) => {
            syncActiveFromOffset(self.progress * travelRef.current);
          },
        },
      });
    }, section);

    const refresh = () => {
      measureTravel();
      ScrollTrigger.refresh();
    };

    track.querySelectorAll("img").forEach((img) => {
      if (!img.complete) img.addEventListener("load", refresh, { once: true });
    });

    const onMq = () => refresh();
    mobileMq.addEventListener?.("change", onMq);

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(refresh, 120);
    };
    window.addEventListener("resize", onResize);

    requestAnimationFrame(() => {
      requestAnimationFrame(refresh);
    });

    return () => {
      scrubbingRef.current = false;
      stage.classList.remove("is-pin-scrub");
      gsap.set(track, { clearProps: "transform" });
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      mobileMq.removeEventListener?.("change", onMq);
      ctx.revert();
    };
  }, [services.length, measureTravel, syncActiveFromOffset]);

  if (!services.length) return null;

  return (
    <section
      id="services"
      ref={sectionRef}
      className="hydra-section sb-svc"
      aria-label={title}
    >
      <div ref={pinRef} className="sb-svc__pin">
        <div className="sb-svc__inner">
          <header className="sb-svc__head">
            <p className="sb-svc__mark">{eyebrow}</p>
            <h2 className="sb-svc__title">{title}</h2>
            <p className="sb-svc__lead">{lead}</p>
          </header>
        </div>

        <div className="sb-svc__band">
          <HydraBandCornerSquares />
          <div
            ref={stageRef}
            className="sb-svc__stage"
            tabIndex={0}
            role="region"
            aria-label="Services carousel"
          >
            <ul ref={trackRef} className="sb-svc__track">
              {services.map((service, index) => {
                const fig =
                  service.figure?.trim() ||
                  FALLBACK_FIGS[index % FALLBACK_FIGS.length]!;
                return (
                  <li key={service.id}>
                    <article
                      className={`sb-svc__card${index === 0 ? " is-active" : ""}`}
                      onMouseEnter={() => {
                        if (scrubbingRef.current) return;
                        setActiveIndex(index);
                      }}
                      onFocus={() => setActiveIndex(index)}
                    >
                      <div className="sb-svc__fig">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`${fig}?v=isoglow3`}
                          alt=""
                          className="sb-svc__fig-img"
                          loading={index < 2 ? "eager" : "lazy"}
                          decoding="async"
                          draggable={false}
                        />
                      </div>
                      <div className="sb-svc__copy">
                        <h3 className="sb-svc__card-title">{service.title}</h3>
                        <p className="sb-svc__body">{service.summary}</p>
                        {service.tags.length > 0 ? (
                          <ul className="sb-svc__tags">
                            {service.tags.map((tag) => (
                              <li key={tag} className="sb-svc__tag">
                                {tag}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
