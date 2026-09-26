"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import {
  HydraAccentSquare,
  HydraFrameCorners,
  HydraBandCornerSquares,
  HydraPointerIcon,
  HydraStatCorners,
  HydraTripleRule,
} from "@/components/web/hydra-primitives";
import { useHydraScroll } from "@/components/web/use-hydra-scroll";
import { MatrixPortrait } from "@/components/web/matrix-portrait";
import { useSiteChat } from "@/components/web/site-chat";
import { SiteFooter } from "@/components/web/site-footer";
import type { SiteContent } from "@/lib/content";

type Project = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  year: string | null;
  introSrc?: string | null;
  coverImage?: string | null;
};

const DATA_BAND_STATS = [
  { label: "Focus", value: "Full-stack", side: "left", slot: "top" },
  { label: "Surfaces", value: "Web + Mobile", side: "left", slot: "bottom" },
  { label: "Delivery", value: "End-to-end", side: "right", slot: "top" },
  { label: "Studio", value: "ShiftBOi", side: "right", slot: "bottom" },
] as const;

const WITHOUT_ROWS = [
  "Pretty screens that break when real data and auth arrive",
  "Separate web / mobile / backend owners who never align",
  "AI demos bolted on without product UX or failure paths",
  "Rewrites every time scope moves from MVP to production",
];

const WITH_ROWS = [
  "UI, API, and data designed as one system from day one",
  "A single full-stack partner across web and mobile surfaces",
  "AI features that ship inside the product loop — with clear handoff",
  "Architecture that grows from prototype to production without a reset",
];

const ARCH_FLOW = [
  { title: "You", sub: "" },
  { title: "Scope & UX", sub: "goals · flows · brand · constraints" },
  { title: "Build & Ship", sub: "UI · API · data · deploy" },
];

const ARCH_PLUGINS = [
  { title: "Design system", sub: "tokens · components · motion" },
  { title: "Integrations", sub: "auth · payments · third-party APIs" },
  { title: "Owner tools", sub: "CMS · content · project CRUD" },
];

const ARCH_NODES = [
  { title: "Frontend", sub: "Next.js / React · responsive · accessible" },
  { title: "Backend", sub: "APIs · auth · Postgres · Prisma" },
  { title: "Mobile", sub: "shared contracts · touch-first UI" },
];

function HydraArrow() {
  return (
    <div className="hydra-arrow hidden md:flex" aria-hidden>
      <span className="hydra-arrow-line" />
      <span className="hydra-arrow-head" />
    </div>
  );
}

/** HydraDB Data band (framer-10mxf4d) — purple accents + ShiftBOi center mark */
function DataBandSection() {
  const rootRef = useRef<HTMLElement>(null);
  // Dense slow rings — matches HydraDB canvas look
  const hexCount = 36;
  const cx = 500;
  const cy = 270;
  const baseR = 40;
  const waveDuration = 28;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      const rings = root.querySelectorAll<SVGGElement>(".hydra-data-hex-ring");
      rings.forEach((ring, i) => {
        gsap.set(ring, {
          svgOrigin: `${cx} ${cy}`,
          transformOrigin: `${cx}px ${cy}px`,
          force3D: false,
        });
        const delay = (i / Math.max(rings.length, 1)) * waveDuration;
        gsap.fromTo(
          ring,
          { scale: 0.1 },
          {
            scale: 13,
            duration: waveDuration,
            ease: "none",
            repeat: -1,
            delay,
          },
        );
        // Stay readable mid-field; dissolve late (edges also masked in CSS)
        gsap.fromTo(
          ring,
          { opacity: 0.7 },
          {
            opacity: 0,
            duration: waveDuration,
            ease: "power2.in",
            repeat: -1,
            delay,
          },
        );
      });

      const cards = root.querySelectorAll<HTMLElement>(".hydra-data-card-float");
      cards.forEach((card, i) => {
        const amp = 10 + (i % 2) * 5;
        gsap.fromTo(
          card,
          { y: -amp },
          {
            y: amp,
            duration: 3 + i * 0.4,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            delay: i * 0.5,
          },
        );
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} className="hydra-data-band" aria-label="Studio highlights">
      <div className="hydra-data-hex-wrap" aria-hidden>
        <svg
          className="hydra-data-hex"
          viewBox="0 0 1000 540"
          preserveAspectRatio="xMidYMid slice"
        >
          {Array.from({ length: hexCount }, (_, i) => {
            const pts = Array.from({ length: 6 }, (_, j) => {
              const a = (Math.PI / 3) * j - Math.PI / 2;
              return `${cx + baseR * Math.cos(a)},${cy + baseR * Math.sin(a)}`;
            }).join(" ");
            return (
              <g key={i} className="hydra-data-hex-ring">
                <polygon
                  points={pts}
                  fill="none"
                  stroke="var(--color-hydra-accent)"
                  strokeWidth="0.45"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          })}
        </svg>
      </div>

      <span className="hydra-data-edge hydra-data-edge-l" aria-hidden />
      <span className="hydra-data-edge hydra-data-edge-r" aria-hidden />

      <div className="hydra-data-center" data-hydra-reveal>
        <span className="hydra-data-logo" aria-hidden>
          <span />
          <span />
          <span />
          <span />
        </span>
      </div>

      {DATA_BAND_STATS.map((stat) => (
        <div
          key={stat.label}
          className={`hydra-data-card hydra-data-card-${stat.side}-${stat.slot}`}
          data-hydra-reveal
        >
          <div className="hydra-data-card-float">
            {stat.side === "left" ? (
              <span className="hydra-data-card-sq" aria-hidden />
            ) : null}
            <div className="hydra-data-card-stack">
              <div className="hydra-data-card-label">{stat.label}</div>
              <div className="hydra-data-card-value">{stat.value}</div>
            </div>
            {stat.side === "right" ? (
              <span className="hydra-data-card-sq" aria-hidden />
            ) : null}
          </div>
        </div>
      ))}
    </section>
  );
}

export function SiteBody({
  projects,
  site,
}: {
  projects: Project[];
  site: SiteContent;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [activeUseCase, setActiveUseCase] = useState(0);
  const useCases = site.focus;
  const activeCase = useCases[activeUseCase] ?? useCases[0];
  const stats = site.stats;
  const pricing = site.engagement;
  const contact = site.contact;
  const { openChat } = useSiteChat();

  useHydraScroll(rootRef);

  return (
    <div ref={rootRef} className="hydra-page">
      {/* Raised — ■ Full-stack Developer ■ (no outer frame) */}
      <section className="hydra-raised-band">
        <div className="hydra-container py-16 md:py-24 lg:py-[120px]">
          <div
            className="flex items-center justify-center gap-5 md:gap-6"
            data-hydra-reveal
          >
            <HydraAccentSquare />
            <h2 className="hydra-h2-band text-white">Full-stack Developer</h2>
            <HydraAccentSquare />
          </div>
          <div className="hydra-investor-row mt-6 md:mt-8" data-hydra-stagger>
            {["Web & Mobile", "APIs & Data", "AI Features", "ShiftBOi"].map(
              (label, index, arr) => (
                <div key={label} className="contents">
                  {index > 0 ? <span className="hydra-investor-sep" aria-hidden /> : null}
                  <p
                    data-hydra-stagger-item
                    className={`hydra-investor text-center ${index === arr.length - 1 ? "text-white/55" : "text-white"}`}
                  >
                    {label}
                  </p>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      {/* Stats — long 4-col rectangle; L-brackets left on first 2, right on last 2 */}
      <section className="hydra-stats-band">
        <div className="hydra-stats-container">
          <div className="hydra-stats-row" data-hydra-stagger>
            {stats.map((stat, index) => (
              <article
                key={stat.label}
                className="hydra-stat-cell"
                data-hydra-stagger-item
                data-hydra-reveal
              >
                <HydraStatCorners side={index < 2 ? "left" : "right"} />
                <p className="hydra-stat-num text-white">{stat.value}</p>
                <p className="hydra-stat-label text-white/60">{stat.label}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases — tabbed layout; gray H-line above from stats-band */}
      <section id="use-cases" className="hydra-section hydra-use-cases-band">
        <div className="hydra-container py-12 md:py-20">
          <p className="hydra-eyebrow" data-hydra-reveal-x>
            {"// Focus //"}
          </p>
          <h2 className="hydra-use-case-title mt-4 max-w-3xl text-white" data-hydra-reveal-x data-hydra-drift data-drift-amount="24">
            What I Build For Product Teams
          </h2>

          <div
            className="mt-10 overflow-hidden border border-[rgba(255,255,255,0.16)] bg-black"
            data-hydra-reveal
          >
            <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
              <div className="border-b border-[rgba(255,255,255,0.16)] lg:border-b-0 lg:border-r">
                {useCases.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`hydra-use-tab w-full text-left ${index === activeUseCase ? "is-active" : ""}`}
                    onClick={() => setActiveUseCase(index)}
                  >
                    <p className="hydra-use-tab-label text-white/70">
                      {item.id} {item.label}
                    </p>
                    {index === activeUseCase ? (
                      <p className="hydra-use-tab-desc text-white">{item.teaser}</p>
                    ) : null}
                  </button>
                ))}
              </div>
              <div className="min-h-[320px]">
                <div className="border-b border-[rgba(255,255,255,0.16)] bg-[rgba(255,255,255,0.06)] p-6 md:p-8">
                  <h3 className="font-[family-name:var(--font-family-pixel)] text-[26px] capitalize leading-[1.12] text-white">
                    {activeCase?.title}
                  </h3>
                </div>
                <div data-hydra-stagger>
                  {(activeCase?.points ?? []).map((point) => (
                    <div
                      key={point}
                      data-hydra-stagger-item
                      className="flex gap-4 border-b border-[rgba(255,255,255,0.16)] p-6 last:border-b-0 md:p-8"
                    >
                      <HydraPointerIcon />
                      <p className="text-[16px] font-medium leading-[120%] tracking-[-0.01em] text-white">
                        {point}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Similarity — white band: purple H-lines + corner squares (no vertical grid) */}
      <HydraTripleRule />
      <section className="hydra-similarity-section">
        <HydraBandCornerSquares />
        <div className="hydra-similarity-outer" data-hydra-reveal>
          <div className="hydra-similarity-inner">
            <div className="hydra-similarity-copy">
              <h2 className="hydra-similarity-title">
                Pretty Isn&apos;t Always Production.
              </h2>
              <div className="hydra-similarity-body-wrap">
                <p className="hydra-similarity-body">
                  Polished mockups and bolted-on APIs often look close — and still fail in real use.
                </p>
                <p className="hydra-similarity-body">
                  I connect design, frontend, backend, and deploy into one build path — so the
                  product ships as a system, not a collage of unfinished pieces.
                </p>
              </div>
            </div>
            <div className="hydra-similarity-cols">
              <div className="hydra-similarity-col hydra-similarity-col-without">
                <div className="hydra-similarity-col-head hydra-similarity-col-head-dark">
                  <h3>Without Full-stack</h3>
                </div>
                {WITHOUT_ROWS.map((row) => (
                  <div key={row} className="hydra-similarity-col-cell">
                    <p>{row}</p>
                  </div>
                ))}
              </div>
              <div className="hydra-similarity-col hydra-similarity-col-with">
                <div className="hydra-similarity-col-head hydra-similarity-col-head-accent">
                  <h3>With ShiftBOi</h3>
                </div>
                {WITH_ROWS.map((row) => (
                  <div key={row} className="hydra-similarity-col-cell">
                    <p>{row}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Purple double-line with equal gap above/below */}
      <div className="hydra-double-rule-gap">
        <HydraTripleRule />
      </div>

      {/* Recall degradation — full-bleed H-lines top + bottom */}
      <section className="hydra-recall-band">
        <div className="hydra-container">
          <div className="grid border-x border-[#353535] lg:grid-cols-2">
            <div
              className="border-b border-[#353535] p-8 md:p-10 lg:border-b-0 lg:border-r lg:p-12"
              data-hydra-reveal-x
            >
              <Link href="/projects/artillery-fdc" className="block no-underline">
                <h2 className="hydra-h2-dark text-left text-white transition-colors hover:text-[var(--color-hydra-accent)]">
                  Artillery-FDC
                </h2>
              </Link>
              <ul className="mt-8 space-y-5">
                {[
                  "Map-first mission workspace with terrain-aware context",
                  "Structured firing-data workflows instead of spreadsheet hopping",
                  "Cross-platform web + desktop packaging for demos and field use",
                ].map((line) => (
                  <li
                    key={line}
                    className="border-l-2 border-[var(--color-hydra-accent)] pl-4 text-[14px] leading-[1.4] tracking-[-0.01em] text-[rgb(153,153,153)]"
                  >
                    {line}
                  </li>
                ))}
              </ul>
              <Link
                href="/projects/artillery-fdc"
                className="mt-8 inline-flex items-center gap-2 text-[13px] text-white/70 transition-colors hover:text-[var(--color-hydra-accent)]"
              >
                Read more
                <span aria-hidden>→</span>
              </Link>
            </div>
            <div
              className="relative min-h-[280px] overflow-hidden p-6 md:min-h-[340px] md:p-8"
              data-hydra-reveal
              data-hydra-parallax
              data-parallax-speed="0.4"
            >
              <p className="hydra-accent-label-sm mb-4">Clarity vs Project Complexity</p>
              <svg viewBox="0 0 420 220" className="h-auto w-full" aria-hidden>
                <g stroke="#353535" strokeWidth="1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <line key={i} x1="40" y1={20 + i * 40} x2="400" y2={20 + i * 40} />
                  ))}
                </g>
                <path
                  d="M40 40 C120 42, 200 55, 280 95 C340 130, 380 165, 400 190"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                <path
                  d="M40 48 C120 55, 200 85, 280 140 C340 175, 380 195, 400 205"
                  fill="none"
                  stroke="#f9c425"
                  strokeWidth="1.5"
                />
                <path
                  d="M40 30 C140 32, 220 38, 300 55 C360 72, 390 88, 400 98"
                  fill="none"
                  stroke="var(--color-hydra-accent)"
                  strokeWidth="2"
                />
              </svg>
              <div className="mt-4 flex flex-wrap gap-4 text-[11px] text-[rgb(153,153,153)]">
                <span className="inline-flex items-center gap-2">
                  <i className="inline-block size-2.5 bg-[var(--color-hydra-accent)]" /> ShiftBOi
                </span>
                <span className="inline-flex items-center gap-2">
                  <i className="inline-block size-2.5 bg-white" /> Split teams
                </span>
                <span className="inline-flex items-center gap-2">
                  <i className="inline-block size-2.5 bg-[#f9c425]" /> Spec-only handoff
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Spacing — Recall ↔ Graph Native */}
      <div className="hydra-section-gap" aria-hidden />

      {/* Graph Native — HydraDB framer-amkbys */}
      <section className="hydra-graph-native" aria-labelledby="graph-native-heading">
        <div className="hydra-graph-native-inner">
          <div className="hydra-graph-native-visual" data-hydra-reveal>
            <MatrixPortrait />
          </div>
          <div className="hydra-graph-native-copy" data-hydra-reveal-x>
            <h2 id="graph-native-heading" className="hydra-graph-native-title">
              Building Things People Enjoy Opening.
            </h2>
            <div className="hydra-graph-native-callout">
              <p>
                Quiet craft for web, mobile &amp; AI — shipped with care, meant to feel alive.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Data / metrics band — HydraDB framer-10mxf4d */}
      <DataBandSection />

      {/* Spacing — Data ↔ Architecture */}
      <div className="hydra-section-gap" aria-hidden />

      {/* Architecture */}
      <section id="architecture" className="hydra-section">
        <div className="hydra-container py-12 md:py-16 lg:py-20">
          <h2 className="hydra-h2-section text-center" data-hydra-reveal>
            How I Work
          </h2>
          <div className="mt-10 border border-[var(--color-hydra-accent)]">
            <div className="border-b border-[var(--color-hydra-accent)] p-5 md:p-8" data-hydra-reveal>
              <p className="hydra-accent-label text-left">
                <strong>From Brief To Shipped Product</strong>
              </p>
              <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-stretch">
                <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center">
                  {ARCH_FLOW.map((node, i) => (
                    <div key={node.title} className="flex flex-1 items-center gap-3">
                      <div className="hydra-node flex-1 border-[rgba(255,255,255,0.35)]">
                        <p className="hydra-node-title text-white">{node.title}</p>
                        {node.sub ? <p className="hydra-node-sub">{node.sub}</p> : null}
                      </div>
                      {i < ARCH_FLOW.length - 1 ? <HydraArrow /> : null}
                    </div>
                  ))}
                </div>
                <div className="grid shrink-0 gap-2 lg:w-[220px]">
                  {ARCH_PLUGINS.map((plugin) => (
                    <div
                      key={plugin.title}
                      className="border border-dashed border-[rgba(255,255,255,0.35)] p-3"
                    >
                      <p className="hydra-accent-label-sm">{plugin.title}</p>
                      <p className="hydra-body-sm mt-1">{plugin.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 md:p-8" data-hydra-reveal>
              <p className="hydra-accent-label text-left">
                <strong>The Delivery Core</strong>
              </p>
              <p className="hydra-body-sm mt-2 text-white/80">
                One stack across frontend, backend, and mobile surfaces
              </p>
              <p className="hydra-body-sm mt-5 text-[var(--color-hydra-muted)]">
                SHIFTBOI — full-stack ownership, product-first
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {ARCH_NODES.map((node) => (
                  <div
                    key={node.title}
                    className="border border-[rgba(255,255,255,0.35)] bg-[#0a0a0a] p-4 md:p-5"
                  >
                    <p className="hydra-accent-label-sm text-center">{node.title}</p>
                    <p className="hydra-body-sm mt-2 text-center">{node.sub}</p>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-[12px] tracking-[0.04em] text-[rgb(153,153,153)]">
                PHASES — WORK GROWS WITH THE PRODUCT
              </p>
              <div className="mt-3 grid grid-cols-3 gap-3">
                {[
                  ["Prototype", "validate the idea"],
                  ["MVP", "ship the core loop"],
                  ["Production", "harden & scale"],
                ].map(([title, sub]) => (
                  <div
                    key={title}
                    className="border border-[var(--color-hydra-accent)]/50 p-3 text-center"
                  >
                    <p className="text-[13px] text-[var(--color-hydra-accent)]">{title}</p>
                    <p className="mt-1 text-[11px] text-[rgb(153,153,153)]">{sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {projects.length > 0 ? (
        <section id="work" className="hydra-section">
          <div className="hydra-container py-12 md:py-20">
            <p className="hydra-eyebrow" data-hydra-reveal-x>
              {"// Work //"}
            </p>
            <h2 className="hydra-h2-section mt-4 text-left" data-hydra-reveal-x>
              Published Projects
            </h2>
            <ul className="mt-10 space-y-px bg-[rgb(32,32,32)]" data-hydra-stagger>
              {projects.map((project) => (
                <li
                  key={project.id}
                  data-hydra-stagger-item
                  className="hydra-stat-cell grid gap-4 bg-black p-6 md:grid-cols-[1fr_auto] md:items-baseline md:p-8"
                >
                  <div>
                    <h3 className="hydra-h4-feature text-[20px]">{project.title}</h3>
                    <p className="hydra-body mt-3 max-w-2xl">{project.summary}</p>
                  </div>
                  {project.year ? (
                    <span className="hydra-pixel-label text-[var(--color-hydra-muted)]">
                      {project.year}
                    </span>
                  ) : null}
                  <HydraStatCorners />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section id="pricing" className="hydra-section">
        <div className="hydra-container py-12 md:py-20">
          <h3 className="hydra-h3-features" data-hydra-reveal-x>
            Engagement
          </h3>
          <div className="mt-10 grid gap-px bg-[rgb(32,32,32)] md:grid-cols-3" data-hydra-stagger>
            {pricing.map((tier) => (
              <div
                key={tier.name}
                data-hydra-stagger-item
                className={`hydra-pricing-card hydra-frame-corners-wrap relative ${tier.featured ? "featured" : ""}`}
              >
                {tier.featured ? <HydraFrameCorners /> : null}
                <p className="hydra-h4-feature text-[20px]">{tier.name}</p>
                <p className="hydra-stat-num mt-4 text-[var(--color-hydra-accent)]">{tier.price}</p>
                <p className="hydra-body mt-4">{tier.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="hydra-section">
        <div className="hydra-container py-12 md:py-20">
          <div className="hydra-cell hydra-frame-corners-wrap p-8 md:p-12" data-hydra-reveal>
            <HydraFrameCorners />
            <h2 className="hydra-h2-section text-left text-[clamp(28px,4vw,48px)]">
              {contact.title}
            </h2>
            <p className="hydra-body mt-4 max-w-xl">{contact.body}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button type="button" className="hydra-cta" onClick={openChat}>
                {contact.ctaLabel}
              </button>
              <a
                href="https://github.com/ShiftBOi"
                target="_blank"
                rel="noopener noreferrer"
                className="hydra-cta"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
