"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { DinoDashHorizon, DinoDashStage } from "@/components/web/dino-dash";

const nav = [
  { href: "#architecture", label: "Architecture" },
  { href: "#work", label: "Work" },
  { href: "#contact", label: "Contact" },
  { href: "#architecture", label: "Resources" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-y border-[var(--color-border-default)] bg-black/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-6 px-5 md:h-16 md:px-10">
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
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 lg:flex"
        >
          {nav.map((item) => (
            <a
              key={item.label}
              href={item.href}
              style={{ color: "#999999" }}
              className="site-nav-link text-[14px] leading-none transition-colors duration-[var(--motion-fast)]"
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

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const restShadow = "inset 0 0 0 0px transparent";
    const hoverShadow = "inset 0 0 0 1.5px #7c3aed";

    gsap.set(root, { boxShadow: restShadow, scale: 1 });

    const enter = () => {
      gsap.killTweensOf(root);
      gsap.to(root, {
        boxShadow: hoverShadow,
        scale: 1.01,
        duration: 0.2,
        ease: "power2.out",
      });
    };

    const leave = () => {
      gsap.killTweensOf(root);
      gsap.to(root, {
        boxShadow: restShadow,
        scale: 1,
        duration: 0.16,
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
      gsap.killTweensOf(root);
    };
  }, []);

  return (
    <a
      ref={rootRef}
      href={href}
      style={{ color: "#000000", backgroundColor: "#ffffff" }}
      className="inline-flex min-h-11 items-center justify-center px-5 text-[15px] font-medium outline-none will-change-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
    >
      Talk to us
    </a>
  );
}

export function Hero() {
  return (
    <section className="relative flex min-h-[calc(100dvh-4rem-146px)] flex-col">
      <div className="relative z-[1] mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-start px-5 pb-8 pt-16 md:px-10 md:pb-10 md:pt-20">
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
          Data connectors now live: Slack, Notion, GitHub, Gmail, and more →
        </motion.p>

        <motion.h1
          className="relative z-[2] max-w-4xl font-airmail text-[clamp(2.6rem,7vw,5.25rem)] font-normal leading-[1.05] tracking-normal text-white"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.05 }}
        >
          The Graph AI Runs On.
        </motion.h1>

        <motion.div
          className="relative z-[2] mt-10 max-w-xl space-y-3 text-[18px] leading-[1.5] text-[var(--color-text-secondary)] md:text-[20px]"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.12 }}
        >
          <p>
            GraphDB built on object storage: 10x cheaper, ultra fast, and
            purpose-built for modern AI workloads.
          </p>
          <p>
            Build ontologies, agent memory, company brains, and context graphs.
          </p>
        </motion.div>

        <motion.div
          className="relative z-[2] mt-6 flex flex-wrap items-center gap-3"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.2 }}
        >
          <TalkToUsButton />
        </motion.div>
      </div>

      <DinoDashStage />
      <DinoDashHorizon />
    </section>
  );
}
