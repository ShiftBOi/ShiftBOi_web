"use client";

import { cn } from "cn";
import {
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";

type RevealTag = "span" | "div" | "p" | "h1" | "h2" | "h3";

export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "span",
  style,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: RevealTag;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const quietMotion = window.matchMedia(
      "(max-width: 900px), (pointer: coarse)"
    ).matches;
    const show = () => node.classList.add("is-visible");

    // Phones / tablets: show immediately — IO + Lenis often leave text at opacity 0
    if (reduce || quietMotion) {
      show();
      return;
    }

    let timer = 0;
    let fallback = 0;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        timer = window.setTimeout(show, Math.max(0, delay));
        observer.disconnect();
      },
      {
        threshold: 0.01,
        rootMargin: "0px 0px 12% 0px",
      }
    );
    observer.observe(node);
    // Safety net if observer never fires (transformed ancestors, etc.)
    fallback = window.setTimeout(show, 1800 + Math.max(0, delay));

    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
      window.clearTimeout(fallback);
    };
  }, [delay]);

  return (
    <Tag
      ref={ref as never}
      className={cn("hq-reveal inline-block", className)}
      style={style}
    >
      {children}
    </Tag>
  );
}
