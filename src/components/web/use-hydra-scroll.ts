"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function useHydraScroll(rootRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    gsap.registerPlugin(ScrollTrigger);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      gsap.set(root.querySelectorAll("[data-hydra-reveal], [data-hydra-reveal-x], [data-hydra-parallax]"), {
        opacity: 1,
        x: 0,
        y: 0,
        clearProps: "transform",
      });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(root.querySelectorAll("[data-hydra-reveal]")).forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 28 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 90%",
              toggleActions: "play none none none",
            },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>(root.querySelectorAll("[data-hydra-reveal-x]")).forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, x: 24 },
          {
            opacity: 1,
            x: 0,
            duration: 0.95,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 90%",
              toggleActions: "play none none none",
            },
          },
        );
      });

      /* Scrubbed parallax — lag (scrub) eases motion so scroll feels smoother */
      gsap.utils.toArray<HTMLElement>(root.querySelectorAll("[data-hydra-parallax]")).forEach((el) => {
        const speed = el.dataset.parallaxSpeed ? Number(el.dataset.parallaxSpeed) : 0.35;
        const axis = el.dataset.parallaxAxis === "x" ? "x" : "y";
        const distance = Number.isFinite(speed) ? speed * 80 : 28;

        gsap.set(el, { willChange: "transform", force3D: true });

        gsap.fromTo(
          el,
          { [axis]: -distance * 0.5 },
          {
            [axis]: distance * 0.5,
            ease: "none",
            scrollTrigger: {
              trigger: el.parentElement ?? el,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.15,
              invalidateOnRefresh: true,
            },
          },
        );
      });

      /* Soft section drift — whole bands move slightly slower than scroll */
      gsap.utils.toArray<HTMLElement>(root.querySelectorAll("[data-hydra-drift]")).forEach((el) => {
        const amount = el.dataset.driftAmount ? Number(el.dataset.driftAmount) : 40;
        gsap.set(el, { willChange: "transform", force3D: true });
        gsap.fromTo(
          el,
          { y: amount * 0.35 },
          {
            y: -amount * 0.35,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.4,
              invalidateOnRefresh: true,
            },
          },
        );
      });

      gsap.utils.toArray<SVGPathElement>(root.querySelectorAll(".hydra-corner-svg path")).forEach((path) => {
        const len = path.getTotalLength?.() ?? 48;
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
        gsap.to(path, {
          strokeDashoffset: 0,
          duration: 0.75,
          ease: "power2.out",
          scrollTrigger: {
            trigger: path.closest(".hydra-stat-cell, .hydra-frame-corners-wrap") ?? path,
            start: "top 90%",
            toggleActions: "play none none none",
          },
        });
      });

      gsap.utils.toArray<HTMLElement>(root.querySelectorAll("[data-hydra-stagger]")).forEach((container) => {
        const items = container.querySelectorAll("[data-hydra-stagger-item]");
        gsap.fromTo(
          items,
          { opacity: 0, y: 22 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.09,
            ease: "power3.out",
            scrollTrigger: {
              trigger: container,
              start: "top 86%",
              toggleActions: "play none none none",
            },
          },
        );
      });

      requestAnimationFrame(() => ScrollTrigger.refresh());
    }, root);

    return () => ctx.revert();
  }, [rootRef]);
}
