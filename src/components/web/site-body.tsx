"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import {
  HydraAccentSquare,
  HydraFrameCorners,
  HydraBandCornerSquares,
  HydraPointerIcon,
  HydraStatCorners,
  HydraTripleRule,
  HydraFooterRule,
  ShiftBoiMark,
} from "@/components/web/hydra-primitives";
import { useHydraScroll } from "@/components/web/use-hydra-scroll";
import { MatrixPortrait } from "@/components/web/matrix-portrait";
import { useSiteChat } from "@/components/web/site-chat";

type Project = {
  id: string;
  title: string;
  summary: string;
  year: string | null;
};

const STATS = [
  { value: "Web", label: "Next.js · React · TypeScript" },
  { value: "App", label: "Mobile · Cross-platform UI" },
  { value: "API", label: "Node · Postgres · Auth" },
  { value: "AI", label: "LLM features · Agents" },
];

const DATA_BAND_STATS = [
  { label: "Focus", value: "Full-stack", side: "left", slot: "top" },
  { label: "Surfaces", value: "Web + Mobile", side: "left", slot: "bottom" },
  { label: "Delivery", value: "End-to-end", side: "right", slot: "top" },
  { label: "Studio", value: "ShiftBOi", side: "right", slot: "bottom" },
] as const;

const USE_CASES = [
  {
    id: "01",
    label: "WEB APPS",
    teaser: "Production web products with clean UX and solid foundations.",
    title: "Ship modern web apps — fast UI, reliable APIs, deploy-ready.",
    points: [
      "Next.js / React interfaces with intentional motion and accessibility.",
      "Auth, data models, and admin flows that hold up in production.",
      "Performance-minded frontends that stay maintainable as features grow.",
    ],
  },
  {
    id: "02",
    label: "MOBILE",
    teaser: "Mobile experiences that feel native and ship with the web stack.",
    title: "Build mobile surfaces that share logic without fighting the platform.",
    points: [
      "Cross-platform UI patterns tuned for touch, offline, and speed.",
      "Shared API contracts between web and mobile clients.",
      "Release-ready builds with clear handoff for store or internal distro.",
    ],
  },
  {
    id: "03",
    label: "FULL-STACK",
    teaser: "One builder across UI, API, data, and deploy.",
    title: "End-to-end ownership — fewer handoffs, tighter product loops.",
    points: [
      "Schema, auth, and business logic designed with the UI in mind.",
      "CMS and owner tools when you need content control without visitor login.",
      "From prototype to production without rewriting the stack mid-flight.",
    ],
  },
  {
    id: "04",
    label: "AI FEATURES",
    teaser: "Practical AI inside real products — not demos that die.",
    title: "Add LLM and agent features that fit the product, not the hype.",
    points: [
      "Chat, assistive flows, and retrieval wired into your existing app.",
      "Clear UX for loading, failure, and human handoff.",
      "Prompt and tool boundaries that stay inspectable and safe.",
    ],
  },
  {
    id: "05",
    label: "PRODUCT UI",
    teaser: "Interfaces with presence — brand-first, not template-default.",
    title: "Design systems and screens that make the product feel finished.",
    points: [
      "Typography, motion, and layout that reinforce the brand.",
      "Component structure teams can extend without visual drift.",
      "Detail work on empty states, forms, and edge cases that users actually hit.",
    ],
  },
];

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

const FEATURE_CELLS = [
  {
    title: "Production Frontend",
    body: "Pixel-aware React / Next.js work with motion, accessibility, and brand presence — not generic dashboard chrome.",
    visual: "accuracy" as const,
  },
  {
    title: "Systems That Scale With You",
    body: "Frontend → API → data → deploy as one path. Hot path for iteration, solid base for auth, Postgres, and owner CMS when you need it.",
    visual: "tier" as const,
  },
  {
    title: "Ship The Whole Surface",
    body: "Web, mobile, and AI assistive flows from one builder — so design, logic, and deploy stay aligned.",
    visual: "recall" as const,
  },
  {
    title: "Built For Fast Product Loops",
    body: "Tight feedback cycles — scope, build, ship, refine — without waiting on a chain of specialists.",
    visual: "latency" as const,
  },
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

const PRICING = [
  { name: "Sprint", price: "Project", detail: "Scoped builds — landing, MVP, feature slice, or rebuild.", featured: false },
  { name: "Retainer", price: "Ongoing", detail: "Continuous product work with a dedicated full-stack partner.", featured: true },
  { name: "Collab", price: "Partner", detail: "Join your team for a phase — architecture, UI, or AI features.", featured: false },
];

function AccuracyVisual() {
  return (
    <div className="hydra-accuracy-panel" data-hydra-reveal data-hydra-parallax data-parallax-speed="0.25">
      <p className="hydra-accuracy-value">E2E</p>
      <p className="hydra-accuracy-label">Ownership</p>
    </div>
  );
}

function TierVisual() {
  return (
    <div className="hydra-tier-panel" data-hydra-reveal data-hydra-parallax data-parallax-speed="0.3">
      <p className="hydra-tier-label">UI → API → Data → Deploy</p>
      <span className="hydra-tier-flow" aria-hidden />
      <span className="hydra-tier-cap is-left" aria-hidden />
      <span className="hydra-tier-cap is-right" aria-hidden />
      <div className="hydra-tier-nodes">
        <div className="hydra-tier-node">Web</div>
        <div className="hydra-tier-node">API</div>
        <div className="hydra-tier-node is-accent">Ship</div>
      </div>
    </div>
  );
}

function RecallVisual() {
  return (
    <div className="hydra-recall-panel" data-hydra-reveal data-hydra-parallax data-parallax-speed="0.45">
      <svg viewBox="0 0 400 250" fill="none" aria-hidden>
        <g stroke="rgba(255,255,255,0.35)" strokeWidth="0.6" strokeDasharray="3 3">
          <path d="M40 210 L200 40 L360 210" />
          <path d="M80 210 L200 70 L320 210" />
          <path d="M120 210 L200 110 L280 210" />
          <path d="M40 210 L120 150 L200 210 L280 150 L360 210" />
          <path d="M200 40 L200 210" />
        </g>
        {[
          [200, 40],
          [120, 100],
          [280, 95],
          [90, 160],
          [200, 140],
          [310, 155],
          [60, 200],
          [150, 195],
          [250, 190],
          [340, 200],
        ].map(([x, y], i) => (
          <rect
            key={i}
            x={x - 4}
            y={y - 4}
            width={i % 3 === 0 ? 10 : 7}
            height={i % 3 === 0 ? 10 : 7}
            fill={i % 2 === 0 ? "#8b5cf6" : "#ffffff"}
          />
        ))}
      </svg>
      <span className="hydra-recall-tag" style={{ left: "8%", top: "72%" }}>
        Design
      </span>
      <span className="hydra-recall-tag" style={{ left: "42%", top: "18%" }}>
        Build
      </span>
      <span className="hydra-recall-tag" style={{ right: "10%", top: "68%" }}>
        Ship
      </span>
    </div>
  );
}

function LatencyVisual() {
  return (
    <div data-hydra-reveal data-hydra-parallax data-parallax-speed="0.28">
      <p className="hydra-latency-metric">Ship</p>
      <div className="hydra-latency-bars">
        <div className="hydra-latency-row">
          <span className="hydra-latency-fill" style={{ width: "28%" }} />
        </div>
        <div className="hydra-latency-row">
          <span className="hydra-latency-fill is-accent" style={{ width: "14%" }} />
        </div>
        <div className="hydra-latency-row" />
        <div className="hydra-latency-row" />
        <div className="hydra-latency-row" />
      </div>
    </div>
  );
}

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

export function SiteBody({ projects }: { projects: Project[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [activeUseCase, setActiveUseCase] = useState(0);
  const activeCase = USE_CASES[activeUseCase];
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
            {STATS.map((stat, index) => (
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
                {USE_CASES.map((item, index) => (
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
                    {activeCase.title}
                  </h3>
                </div>
                <div data-hydra-stagger>
                  {activeCase.points.map((point) => (
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

      {/* Features — 2×2 grid; top H-line full viewport */}
      <section id="features" className="hydra-section">
        <div className="hydra-container py-[72px] md:py-[100px] lg:pb-0 lg:pt-[120px]">
          <div className="hydra-section-title-wrap" data-hydra-reveal data-hydra-drift data-drift-amount="28">
            <h3 className="hydra-h3-features text-center text-white">
              Everything You Need To Ship End-To-End
            </h3>
          </div>
        </div>

        <div className="hydra-features-band mt-8 md:mt-10">
          <div className="hydra-features-row-band" data-hydra-stagger>
            <div className="hydra-features-grid">
              {FEATURE_CELLS.slice(0, 2).map((cell) => (
                <article key={cell.title} className="hydra-feature-cell" data-hydra-stagger-item>
                  <h4 className="hydra-feature-title">{cell.title}</h4>
                  <p className="hydra-feature-body">{cell.body}</p>
                  <div className="hydra-feature-visual">
                    {cell.visual === "accuracy" ? <AccuracyVisual /> : null}
                    {cell.visual === "tier" ? <TierVisual /> : null}
                  </div>
                </article>
              ))}
            </div>
          </div>
          <div className="hydra-features-row-rule" aria-hidden />
          <div className="hydra-features-row-band hydra-features-row-band-bottom" data-hydra-stagger>
            <div className="hydra-features-grid">
              {FEATURE_CELLS.slice(2, 4).map((cell) => (
                <article key={cell.title} className="hydra-feature-cell" data-hydra-stagger-item>
                  <h4 className="hydra-feature-title">{cell.title}</h4>
                  <p className="hydra-feature-body">{cell.body}</p>
                  <div className="hydra-feature-visual">
                    {cell.visual === "recall" ? <RecallVisual /> : null}
                    {cell.visual === "latency" ? <LatencyVisual /> : null}
                  </div>
                </article>
              ))}
            </div>
          </div>
          <div className="hydra-features-row-rule" aria-hidden />
        </div>
      </section>

      {/* Purple double-line with equal gap above/below (features ↔ recall) */}
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
              <h2 className="hydra-h2-dark text-left text-white">
                Fragmented Builds As A Bottleneck
              </h2>
              <ul className="mt-8 space-y-5">
                {[
                  "UI, API, and mobile owners drift apart as scope grows",
                  "AI features get bolted on without real product UX",
                  "MVP stacks get rewritten the moment you need production auth, data, and deploy",
                ].map((line) => (
                  <li
                    key={line}
                    className="border-l-2 border-[var(--color-hydra-accent)] pl-4 text-[14px] leading-[1.4] tracking-[-0.01em] text-[rgb(153,153,153)]"
                  >
                    {line}
                  </li>
                ))}
              </ul>
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
              Full-Stack Builder For Product Teams
            </h2>
            <div className="hydra-graph-native-callout">
              <p>
                Purpose-Built To Ship Web, Mobile &amp; AI Experiences End To End.
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
            {PRICING.map((tier) => (
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
            <h2 className="hydra-h2-section text-left text-[clamp(28px,4vw,48px)]">Get In Touch</h2>
            <p className="hydra-body mt-4 max-w-xl">
              Have a product to ship — web, mobile, or AI-ready? Reach out and we&apos;ll scope it.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button type="button" className="hydra-cta" onClick={openChat}>
                Talk to me
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

      <footer className="site-footer">
        <HydraFooterRule />
        <div className="site-footer-grid" aria-hidden />

        <div className="site-footer-table" data-hydra-reveal>
          <div className="site-footer-row site-footer-row-top">
            <div className="site-footer-row-inner site-footer-row-inner-top">
              <div className="site-footer-brand">
                <a href="/" className="site-footer-logo">
                  <ShiftBoiMark className="site-footer-mark" />
                  <span>ShiftBOi</span>
                </a>
                <p className="site-footer-tagline">Full-stack Web &amp; Mobile · ShiftBOi</p>
              </div>
            </div>
          </div>

          <div className="site-footer-row site-footer-row-body">
            <div className="site-footer-row-inner site-footer-row-inner-body">
              <div className="site-footer-nav">
                {[
                  {
                    title: "Home",
                    links: [
                      ["Focus", "#use-cases"],
                      ["Skills", "#features"],
                      ["How I Work", "#architecture"],
                      ["Engagement", "#pricing"],
                      ["Work", "#work"],
                      ["Contact", "#contact"],
                    ],
                  },
                  {
                    title: "Focus",
                    links: [
                      ["Web Apps", "#use-cases"],
                      ["Mobile", "#use-cases"],
                      ["AI Features", "#use-cases"],
                    ],
                  },
                  {
                    title: "Connect",
                    links: [
                      ["GitHub", "https://github.com/ShiftBOi"],
                      ["X", "https://x.com/ShiftBOi_dev"],
                      ["Contact", "#contact"],
                    ],
                  },
                  {
                    title: "Studio",
                    links: [
                      ["ShiftBOi", "/"],
                      ["Projects", "#work"],
                      ["CMS", "/cms/login"],
                    ],
                  },
                  {
                    title: "Legal",
                    links: [
                      ["Privacy", "#"],
                      ["Terms", "#"],
                    ],
                  },
                ].map((col) => (
                  <div key={col.title} className="site-footer-col">
                    <p className="site-footer-col-title">{col.title}</p>
                    <ul>
                      {col.links.map(([label, href]) => (
                        <li key={label}>
                          <a
                            href={href}
                            className="site-footer-link"
                            {...(href.startsWith("http")
                              ? { target: "_blank", rel: "noopener noreferrer" }
                              : {})}
                          >
                            {label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="site-footer-aside">
                <div className="site-footer-media">
                  <div className="site-footer-media-socials" aria-label="Social links">
                    <span className="site-footer-media-rule" aria-hidden />
                    <div className="site-footer-media-socials-inner">
                      <a
                        href="https://x.com/ShiftBOi_dev"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="site-footer-social"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.71-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
                        </svg>
                        <span>X</span>
                      </a>
                      <a
                        href="https://github.com/ShiftBOi"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="site-footer-social"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                          <path d="M12 2C6.477 2 2 6.486 2 12.021c0 4.425 2.865 8.18 6.839 9.504.5.093.682-.217.682-.483 0-.237-.009-.866-.013-1.7-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.467-1.11-1.467-.908-.622.069-.609.069-.609 1.004.071 1.532 1.033 1.532 1.033.892 1.53 2.341 1.088 2.91.833.091-.647.35-1.088.636-1.339-2.22-.253-4.555-1.113-4.555-4.952 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.026 2.747-1.026.546 1.378.203 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.944.359.31.678.922.678 1.858 0 1.34-.012 2.42-.012 2.75 0 .268.18.58.688.481A10.02 10.02 0 0 0 22 12.021C22 6.486 17.523 2 12 2z" />
                        </svg>
                        <span>GitHub</span>
                      </a>
                      <a href="#contact" className="site-footer-social">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                        </svg>
                        <span>Discord</span>
                      </a>
                    </div>
                    <span className="site-footer-media-rule" aria-hidden />
                  </div>
                  <video
                    className="site-footer-media-video"
                    src="/videos/ai-hologram-purple-cubic.mp4"
                    poster="/videos/ai-hologram-purple-cubic-poster.jpg"
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    aria-hidden
                  />
                </div>
                <p className="site-footer-copy">
                  © {new Date().getFullYear()} ShiftBOi
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
