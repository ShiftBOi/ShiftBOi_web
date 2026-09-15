"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const nav = [
  { href: "#architecture", label: "Architecture" },
  { href: "#work", label: "Work" },
  { href: "#contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="relative z-20 flex items-center justify-between gap-6 px-5 py-5 md:px-10">
      <Link
        href="/"
        className="text-[length:var(--font-size-lg)] tracking-tight text-[var(--color-text-primary)]"
      >
        WebPort
      </Link>
      <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
        {nav.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="text-[length:var(--font-size-md)] text-[var(--color-text-inverse)] transition-colors duration-[var(--motion-fast)] hover:text-[var(--color-text-primary)]"
          >
            {item.label}
          </a>
        ))}
      </nav>
      <Link
        href="/cms"
        className="text-[length:var(--font-size-md)] text-[var(--color-text-tertiary)] transition-colors duration-[var(--motion-fast)] hover:text-[var(--color-text-primary)]"
      >
        CMS
      </Link>
    </header>
  );
}

export function Hero() {
  return (
    <section className="relative flex min-h-[calc(100vh-72px)] flex-col justify-end px-5 pb-16 pt-24 md:px-10 md:pb-24">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="absolute -right-24 top-16 h-[420px] w-[420px] rounded-full border border-white/5" />
        <div className="absolute -right-8 top-40 h-[280px] w-[280px] rounded-full border border-white/10" />
        <div className="absolute bottom-24 left-[12%] h-32 w-32 border border-white/10" />
      </motion.div>

      <motion.p
        className="mb-4 max-w-xl text-[length:var(--font-size-sm)] uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        HydraDB-inspired portfolio surface
      </motion.p>

      <motion.h1
        className="max-w-4xl text-[clamp(2.4rem,7vw,5.5rem)] font-medium leading-[0.95] tracking-[-0.04em] text-[var(--color-text-primary)]"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.05 }}
      >
        The Graph AI Runs On.
      </motion.h1>

      <motion.p
        className="mt-6 max-w-xl text-[length:var(--font-size-2xl)] leading-relaxed text-[var(--color-text-inverse)]"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.12 }}
      >
        Minimal marketing shell for WebPort v2 — Postgres, Prisma, Next.js web +
        CMS under <span className="text-[var(--color-text-primary)]">/cms</span>.
      </motion.p>

      <motion.div
        className="mt-10 flex flex-wrap items-center gap-4"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.2 }}
      >
        <a
          href="#work"
          className="inline-flex min-h-11 items-center justify-center border border-white bg-[var(--color-text-primary)] px-5 text-[length:var(--font-size-lg)] text-black transition-[transform,opacity] duration-[var(--motion-fast)] hover:opacity-90 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          View work
        </a>
        <a
          href="#contact"
          className="inline-flex min-h-11 items-center justify-center border border-[var(--color-border-default)] px-5 text-[length:var(--font-size-lg)] text-[var(--color-text-primary)] transition-colors duration-[var(--motion-fast)] hover:border-white"
        >
          Talk to us
        </a>
      </motion.div>
    </section>
  );
}
