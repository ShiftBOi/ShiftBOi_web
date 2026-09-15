"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { DinoDashHorizon } from "@/components/web/dino-dash";

const nav = [
  { href: "#architecture", label: "Architecture" },
  { href: "#work", label: "Work" },
  { href: "#contact", label: "Contact" },
  { href: "#architecture", label: "Resources" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-y border-[var(--color-border-default)] bg-black/90 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between gap-6 px-5 md:h-[84px] md:px-10">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-3 text-[22px] font-medium tracking-tight text-white md:text-[24px]"
        >
          <span aria-hidden className="grid size-8 grid-cols-2 gap-0.5 md:size-9 md:gap-1">
            <span className="bg-[var(--color-accent-purple)]" />
            <span className="bg-[var(--color-accent-purple-bright)]" />
            <span className="bg-[var(--color-accent-purple-bright)]" />
            <span className="bg-[var(--color-accent-purple)]" />
          </span>
          ShiftBOi
        </Link>

        <nav
          aria-label="Primary"
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 lg:flex"
        >
          {nav.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-[14px] leading-none text-[var(--color-nav-link)] transition-colors duration-[var(--motion-fast)] hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <Link
          href="/cms/login"
          className="shrink-0 text-[14px] leading-none text-white transition-opacity hover:opacity-80"
        >
          Log In
        </Link>
      </div>
    </header>
  );
}

function TalkToUsButton({ href = "#contact" }: { href?: string }) {
  const rootRef = useRef<HTMLAnchorElement>(null);
  const frameRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const frame = frameRef.current;
    const label = labelRef.current;
    if (!root || !frame || !label) return;

    gsap.set(frame, {
      opacity: 0,
      scaleX: 0.92,
      scaleY: 0.88,
      transformOrigin: "left center",
    });
    gsap.set(label, { x: 0, y: 0 });

    const enter = () => {
      gsap.killTweensOf([frame, label, root]);
      gsap.to(frame, {
        opacity: 1,
        scaleX: 1,
        scaleY: 1,
        duration: 0.28,
        ease: "power2.out",
      });
      gsap.to(label, {
        x: -0.5,
        y: -0.5,
        duration: 0.22,
        ease: "power2.out",
      });
      gsap.to(root, {
        scale: 1.02,
        duration: 0.22,
        ease: "power2.out",
      });
    };

    const leave = () => {
      gsap.killTweensOf([frame, label, root]);
      gsap.to(frame, {
        opacity: 0,
        scaleX: 0.92,
        scaleY: 0.88,
        duration: 0.2,
        ease: "power2.inOut",
      });
      gsap.to(label, {
        x: 0,
        y: 0,
        duration: 0.2,
        ease: "power2.inOut",
      });
      gsap.to(root, {
        scale: 1,
        duration: 0.2,
        ease: "power2.inOut",
      });
    };

    root.addEventListener("mouseenter", enter);
    root.addEventListener("mouseleave", leave);
    root.addEventListener("focus", enter);
    root.addEventListener("blur", leave);

    return () => {
      root.removeEventListener("mouseenter", enter);
      root.removeEventListener("mouseleave", leave);
      root.removeEventListener("focus", enter);
      root.removeEventListener("blur", leave);
      gsap.killTweensOf([frame, label, root]);
    };
  }, []);

  return (
    <a
      ref={rootRef}
      href={href}
      className="relative inline-flex min-h-11 items-center justify-center bg-white px-5 text-[15px] font-medium text-[#000000] outline-none will-change-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
    >
      <span
        ref={frameRef}
        aria-hidden
        className="pointer-events-none absolute -inset-y-px -left-px -right-[4px] z-0 bg-[var(--color-violet)]"
      />
      <span
        ref={labelRef}
        className="relative z-[1] bg-white px-5 py-[0.65rem] text-[#000000] will-change-transform"
      >
        Talk to us
      </span>
    </a>
  );
}

export function Hero() {
  return (
    <section className="relative flex min-h-[calc(100vh-68px-100px)] flex-col">
      <div className="relative flex flex-1 flex-col justify-start px-5 pb-16 pt-24 md:px-10 md:pb-20 md:pt-28">
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
          className="mb-4 max-w-2xl text-[14px] text-[var(--color-text-secondary)]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          Data connectors now live: Slack, Notion, GitHub, Gmail, and more →
        </motion.p>

        <motion.h1
          className="max-w-4xl text-[clamp(2.6rem,7vw,5.25rem)] font-medium leading-[0.95] tracking-[-0.04em] text-white"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.05 }}
        >
          The Graph AI Runs On.
        </motion.h1>

        <motion.div
          className="mt-5 max-w-xl space-y-3 text-[16px] leading-[1.45] text-[var(--color-text-secondary)]"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.12 }}
        >
          <p>
            GraphDB built on object storage: 10x cheaper, ultra fast, and
            purpose-built for modern AI workloads.
          </p>
          <p>Build ontologies, agent memory, company brains, and context graphs.</p>
        </motion.div>

        <motion.div
          className="mt-8 flex flex-wrap items-center gap-3"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.2 }}
        >
          <TalkToUsButton />
        </motion.div>
      </div>

      <DinoDashHorizon />
    </section>
  );
}
