"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { DinoDashHorizon, DinoDashStage } from "@/components/web/dino-dash";

const nav = [
  { href: "#work", label: "Work" },
  { href: "#use-cases", label: "Focus" },
  { href: "#stack", label: "Stack" },
  { href: "#site-footer", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-white/[0.04] backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-white/[0.03]">
      <div className="mx-auto flex h-12 max-w-[1400px] items-center justify-between gap-6 px-5 md:h-14 md:px-10">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 text-[24px] font-semibold leading-none tracking-tight text-white md:text-[26px]"
        >
          <span
            aria-hidden
            className="grid h-[1em] w-[1.2em] shrink-0 grid-cols-2 gap-px self-center"
          >
            <span className="bg-[var(--color-accent-purple)]" />
            <span className="bg-[var(--color-accent-purple-bright)]" />
            <span className="bg-[var(--color-accent-purple-bright)]" />
            <span className="bg-[var(--color-accent-purple)]" />
          </span>
          ShiftBOi
        </Link>

        <nav
          aria-label="Primary"
          className="absolute left-1/2 top-0 bottom-0 hidden -translate-x-1/2 items-stretch gap-7 lg:flex"
        >
          {nav.map((item) => (
            <a
              key={item.label}
              href={item.href}
              style={{ color: "#999999" }}
              className="site-nav-link text-[14px] leading-none"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <Link
          href="#site-footer"
          className="shrink-0 text-[14px] leading-none text-white transition-opacity hover:opacity-80"
        >
          Contact
        </Link>
      </div>
    </header>
  );
}

function PlayWithDinoButton({
  onPlay,
  label = "Play with dino",
}: {
  onPlay: () => void;
  label?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLButtonElement>(null);
  const dustRef = useRef<HTMLSpanElement>(null);
  const hoveringRef = useRef(false);
  const emitTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const root = rootRef.current;
    const dust = dustRef.current;
    if (!wrap || !root || !dust) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const frame = { inset: 0 };
    const PURPLE = "#7c3aed";
    const INSET_MAX = 3;

    const paintFrame = () => {
      root.style.boxShadow = `inset 0 0 0 ${frame.inset}px ${PURPLE}`;
    };

    gsap.set(frame, { inset: 0 });
    paintFrame();

    const spawnDust = () => {
      if (!hoveringRef.current || reduced) return;

      const w = root.offsetWidth;
      const h = root.offsetHeight;
      if (!w || !h) return;

      const side = Math.floor(Math.random() * 4);
      let x = 0;
      let y = 0;
      if (side === 0) {
        x = Math.random() * w;
        y = 0;
      } else if (side === 1) {
        x = w;
        y = Math.random() * h;
      } else if (side === 2) {
        x = Math.random() * w;
        y = h;
      } else {
        x = 0;
        y = Math.random() * h;
      }

      const size = 2 + Math.random() * 3.5;
      const angle = Math.atan2(y - h / 2, x - w / 2) + (Math.random() - 0.5) * 0.9;
      const dist = 18 + Math.random() * 36;
      const colors = ["#8b5cf6", "#a78bfa", "#c4b5fd", "#ffffff"];

      const mote = document.createElement("span");
      mote.className = "talk-dust-mote";
      mote.style.width = `${size}px`;
      mote.style.height = `${size}px`;
      mote.style.background = colors[Math.floor(Math.random() * colors.length)]!;
      mote.style.left = "0";
      mote.style.top = "0";
      dust.appendChild(mote);

      gsap.fromTo(
        mote,
        {
          x: x - size / 2,
          y: y - size / 2,
          opacity: 0.85 + Math.random() * 0.15,
          scale: 0.6 + Math.random() * 0.5,
        },
        {
          x: x - size / 2 + Math.cos(angle) * dist,
          y: y - size / 2 + Math.sin(angle) * dist,
          opacity: 0,
          scale: 0.2 + Math.random() * 0.35,
          duration: 0.95 + Math.random() * 1.1,
          ease: "power1.out",
          onComplete: () => mote.remove(),
        },
      );
    };

    const startEmit = () => {
      if (emitTimerRef.current || reduced) return;
      for (let i = 0; i < 6; i++) spawnDust();
      emitTimerRef.current = setInterval(spawnDust, 70);
    };

    const stopEmit = () => {
      if (emitTimerRef.current) {
        clearInterval(emitTimerRef.current);
        emitTimerRef.current = null;
      }
    };

    const enter = () => {
      if (hoveringRef.current) return;
      hoveringRef.current = true;
      gsap.killTweensOf(frame);
      gsap.to(frame, {
        inset: INSET_MAX,
        duration: reduced ? 0.01 : 0.5,
        ease: "power2.out",
        overwrite: "auto",
        onUpdate: paintFrame,
      });
      startEmit();
    };

    const leave = () => {
      if (!hoveringRef.current) return;
      hoveringRef.current = false;
      stopEmit();
      gsap.killTweensOf(frame);
      gsap.to(frame, {
        inset: 0,
        duration: reduced ? 0.01 : 0.4,
        ease: "power2.out",
        overwrite: "auto",
        onUpdate: paintFrame,
      });
    };

    wrap.addEventListener("pointerenter", enter);
    wrap.addEventListener("pointerleave", leave);
    root.addEventListener("focus", enter);
    root.addEventListener("blur", leave);

    return () => {
      hoveringRef.current = false;
      stopEmit();
      wrap.removeEventListener("pointerenter", enter);
      wrap.removeEventListener("pointerleave", leave);
      root.removeEventListener("focus", enter);
      root.removeEventListener("blur", leave);
      gsap.killTweensOf(frame);
      dust.replaceChildren();
    };
  }, []);

  return (
    <div ref={wrapRef} className="talk-dust-wrap relative inline-flex">
      <span ref={dustRef} className="talk-dust-layer" aria-hidden />
      <button
        ref={rootRef}
        type="button"
        onClick={onPlay}
        style={{ color: "#000000", backgroundColor: "#ffffff" }}
        className="relative z-[1] inline-flex min-h-11 cursor-pointer items-center justify-center px-5 text-[15px] font-medium outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
      >
        {label}
      </button>
    </div>
  );
}

export function Hero({
  content,
}: {
  content?: {
    eyebrow: string;
    name: string;
    paragraphs: string[];
    ctaLabel: string;
  };
}) {
  const [dinoPhase, setDinoPhase] = useState<
    "demo" | "entering" | "playing" | "dead"
  >("demo");
  const [playSignal, setPlaySignal] = useState(0);
  const heroBusy = dinoPhase !== "demo";
  const eyebrow =
    content?.eyebrow ?? "Full-stack Web & Mobile Developer · ShiftBOi →";
  const name = content?.name ?? "Rapeepong Apichanakulchai";
  const paragraphs = content?.paragraphs ?? [
    "I design and ship production web & mobile products — from polished interfaces to APIs, data, and deploy.",
    "Building under ShiftBOi: fast iterations, clean systems, and AI-ready experiences.",
  ];
  const ctaLabel = content?.ctaLabel ?? "Play with dino";

  return (
    <section
      className={`relative flex min-h-0 flex-1 flex-col${heroBusy ? " hero-dino-game" : ""}`}
    >
      <div className="hero-copy relative z-[1] mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-start px-5 pb-8 pt-12 md:px-10 md:pb-10 md:pt-16">
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="absolute -right-16 top-10 h-[480px] w-[480px] rounded-full border border-white/5" />
          <div className="absolute -right-2 top-36 h-[300px] w-[300px] rounded-full border border-[var(--color-accent-purple)]/20" />
          <div className="absolute bottom-28 left-[10%] h-28 w-28 border border-white/10" />
        </motion.div>

        <motion.p
          className="relative z-[2] mb-4 max-w-2xl text-[14px] text-[var(--color-text-secondary)]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          {eyebrow}
        </motion.p>

        <motion.h1
          className="relative z-[2] max-w-4xl font-pixel text-[clamp(2.6rem,7vw,5.25rem)] font-normal leading-[1.05] tracking-[-0.01em] text-white"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.05 }}
        >
          {name}
        </motion.h1>

        <motion.div
          className="relative z-[2] mt-10 max-w-xl space-y-3 text-[18px] leading-[1.5] text-[var(--color-text-secondary)] md:text-[20px]"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.12 }}
        >
          {paragraphs.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </motion.div>

        <motion.div
          className="relative z-[2] mt-6 flex flex-wrap items-center gap-3"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.2 }}
        >
          <PlayWithDinoButton
            label={ctaLabel}
            onPlay={() => setPlaySignal((n) => n + 1)}
          />
        </motion.div>
      </div>

      <DinoDashStage onPhaseChange={setDinoPhase} playSignal={playSignal} />
      <DinoDashHorizon />
    </section>
  );
}
