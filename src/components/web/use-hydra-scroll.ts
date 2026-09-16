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
      gsap.set(root.querySelectorAll("[data-hydra-reveal], [data-hydra-reveal-x]"), {
        opacity: 1,
        x: 0,
        y: 0,
      });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(root.querySelectorAll("[data-hydra-reveal]")).forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "power2.out",
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              toggleActions: "play none none none",
            },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>(root.querySelectorAll("[data-hydra-reveal-x]")).forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, x: 20 },
          {
            opacity: 1,
            x: 0,
            duration: 0.85,
            ease: "power2.out",
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              toggleActions: "play none none none",
            },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>(root.querySelectorAll("[data-hydra-parallax]")).forEach((el) => {
        gsap.to(el, {
          y: () => (el.dataset.parallaxSpeed ? Number(el.dataset.parallaxSpeed) * 40 : 24),
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      });

      gsap.utils.toArray<SVGPathElement>(root.querySelectorAll(".hydra-corner-svg path")).forEach((path) => {
        const len = path.getTotalLength?.() ?? 48;
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
        gsap.to(path, {
          strokeDashoffset: 0,
          duration: 0.7,
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
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.65,
            stagger: 0.08,
            ease: "power2.out",
            scrollTrigger: {
              trigger: container,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          },
        );
      });
    }, root);

    return () => ctx.revert();
  }, [rootRef]);
}
