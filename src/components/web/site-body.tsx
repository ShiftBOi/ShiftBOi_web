"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  HydraAccentSquare,
  HydraFrameCorners,
  HydraBandCornerSquares,
  HydraPointerIcon,
  HydraStatCorners,
  HydraTripleRule,
} from "@/components/web/hydra-primitives";
import { useHydraScroll } from "@/components/web/use-hydra-scroll";

type Project = {
  id: string;
  title: string;
  summary: string;
  year: string | null;
};

const STATS = [
  { value: "90.79%", label: "LongMemEval-S Overall" },
  { value: "100%", label: "Single Session Recall" },
  { value: ">90%", label: "Accurate vs Full Context GPT-4" },
  { value: "115K", label: "Avg. Token / Stack" },
];

const USE_CASES = [
  {
    id: "01",
    label: "AGENT MEMORY",
    teaser: "Build in-house memory systems. With your ideas, for your AI.",
    title: "Own your memory layer. No third-party abstraction. No data leaving your stack.",
    points: [
      "Graphs work better for storing user preferences, past interactions, and agent traces.",
      "Git-style temporal versioning recalls what was true at any point in time.",
      "Entity resolution and preference checks across sessions prevent duplicate memory records.",
    ],
  },
  {
    id: "02",
    label: "ONTOLOGIES",
    teaser: "Model your domain with structured knowledge graphs.",
    title: "Define entities and relationships that compound over time.",
    points: [
      "Schema-first graph modeling for products, users, and workflows.",
      "Automatic entity linking across documents and sessions.",
      "Queryable ontologies that agents can traverse in real time.",
    ],
  },
  {
    id: "03",
    label: "COMPANY BRAIN",
    teaser: "One graph for institutional knowledge.",
    title: "Unify docs, tickets, CRM, and chat into a single recall layer.",
    points: [
      "Connectors ingest workspace apps into one graph namespace.",
      "Cross-team recall with permission-aware retrieval.",
      "Audit trails for every context assembly decision.",
    ],
  },
  {
    id: "04",
    label: "AGENTIC ACTIONS",
    teaser: "Agents that remember why they acted.",
    title: "Stateful agents with traceable decision paths.",
    points: [
      "Store tool calls, outcomes, and user feedback as graph edges.",
      "Replay agent sessions for debugging and evaluation.",
      "Personalize next actions from prior successful trajectories.",
    ],
  },
  {
    id: "05",
    label: "CONTEXT ENGINEERING",
    teaser: "Precision context, not just similar chunks.",
    title: "Engineer context windows with graph-native relevance.",
    points: [
      "Hybrid retrieval: vectors + graph traversal + temporal filters.",
      "Token budgets optimized per task and user preference.",
      "Observability into every token chosen for the prompt.",
    ],
  },
];

const WITHOUT_ROWS = [
  "Retrieve similar ≠ relevant data",
  "Missed relationships between concepts, entities, events",
  "Lost agent traces, interactions, user preferences across sessions",
  "Juggling with VectorDB, GraphDB, Postgres with Temporal & filesystems across pipelines",
];

const WITH_ROWS = [
  "Make AI stateful with relevant context. Built to compound intelligence.",
  "Get a complete structured view of your knowledge",
  "Personalize results powered by what your agents have learnt from your users",
  "One unified layer combining graphs with all primitives needed to deliver context to AI systems",
];

const FEATURE_CELLS = [
  {
    title: "High Recall Accuracy",
    body: "Learn how we lead on LongMemEval-S (90%+), BEAM, and FinanceBench.",
    visual: "accuracy" as const,
  },
  {
    title: "Scales With Your Systems",
    body: "Designed for high throughput using tiered storage: a hot in-memory cache, NVMe SSD for warm storage, and object storage for cold archival. Context moves fluidly between tiers.",
    visual: "tier" as const,
  },
  {
    title: "Recall Everything",
    body: "Assemble context from business data, workplace apps, chat sessions, documents. Remember user preferences while retrieving.",
    visual: "recall" as const,
  },
  {
    title: "Built For Low Latency Apps",
    body: "Built for low-latency apps — so you can build real-time applications with HydraDB.",
    visual: "latency" as const,
  },
];

const ARCH_FLOW = [
  { title: "User", sub: "" },
  { title: "Request Understanding", sub: "routing · entity extraction · query rewrite" },
  { title: "Retrieval Orchestrator", sub: "cypher reads / writes" },
];

const ARCH_PLUGINS = [
  { title: "Vectorstore (plugin)", sub: "semantic + bm25 + rerank" },
  { title: "Connectors (plugin)", sub: "100+ sources: workspace, email, crm" },
  { title: "DB Filters (plugin)", sub: "SQL / NoSQL" },
];

const ARCH_NODES = [
  { title: "Writer Node", sub: "Cypher writes → WAL + value log (S3 + disk cache)" },
  { title: "Indexer Node", sub: "reads WAL entries → builds index (GraphBLAS)" },
  { title: "Reader Node", sub: "Cypher queries → index + pending WAL = strongly consistent" },
];

const PRICING = [
  { name: "Developer", price: "Free", detail: "For prototyping and local development.", featured: false },
  { name: "Team", price: "Custom", detail: "Production workloads with dedicated support.", featured: true },
  { name: "Enterprise", price: "Custom", detail: "Multi-tenant isolation, SLAs, and on-prem options.", featured: false },
];

function AccuracyVisual() {
  return (
    <div className="hydra-accuracy-panel" data-hydra-reveal>
      <p className="hydra-accuracy-value">90.79%</p>
      <p className="hydra-accuracy-label">Accuracy</p>
    </div>
  );
}

function TierVisual() {
  return (
    <div className="hydra-tier-panel" data-hydra-reveal>
      <p className="hydra-tier-label">In Memory → SSD → Object Storage</p>
      <span className="hydra-tier-flow" aria-hidden />
      <span className="hydra-tier-cap is-left" aria-hidden />
      <span className="hydra-tier-cap is-right" aria-hidden />
      <div className="hydra-tier-nodes">
        <div className="hydra-tier-node">Graph</div>
        <div className="hydra-tier-node">Index</div>
        <div className="hydra-tier-node is-accent">State</div>
      </div>
    </div>
  );
}

function RecallVisual() {
  return (
    <div className="hydra-recall-panel" data-hydra-reveal data-hydra-parallax data-parallax-speed="0.2">
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
        Data
      </span>
      <span className="hydra-recall-tag" style={{ left: "42%", top: "18%" }}>
        Chat
      </span>
      <span className="hydra-recall-tag" style={{ right: "10%", top: "68%" }}>
        Preference
      </span>
    </div>
  );
}

function LatencyVisual() {
  return (
    <div data-hydra-reveal>
      <p className="hydra-latency-metric">&lt; 200ms</p>
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

export function SiteBody({ projects }: { projects: Project[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [activeUseCase, setActiveUseCase] = useState(0);
  const activeCase = USE_CASES[activeUseCase];

  useHydraScroll(rootRef);

  return (
    <div ref={rootRef} className="hydra-page">
      {/* Raised band — ■ $6.5M Raised ■ */}
      <section className="hydra-section">
        <div className="hydra-container py-10 md:py-12">
          <div className="hydra-cell hydra-frame-corners-wrap" data-hydra-reveal>
            <HydraFrameCorners />
            <div className="flex items-center justify-center gap-6 px-6 py-10 md:gap-8 md:py-12">
              <HydraAccentSquare />
              <h2 className="hydra-h2-band">$6.5M Raised</h2>
              <HydraAccentSquare />
            </div>
            <div
              className="grid grid-cols-1 divide-y divide-[rgb(32,32,32)] border-t border-[rgb(32,32,32)] md:grid-cols-4 md:divide-x md:divide-y-0"
              data-hydra-stagger
            >
              {["Jeff Dean", "Researchers from OpenAI and DeepMind", "Sky9 Capital", "and more"].map(
                (label) => (
                  <p
                    key={label}
                    data-hydra-stagger-item
                    className="hydra-investor px-6 py-5 text-center text-white md:py-6"
                  >
                    {label}
                  </p>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats — 4 columns with corner brackets */}
      <section className="hydra-section">
        <div className="hydra-container">
          <div className="grid grid-cols-1 gap-px bg-[rgb(32,32,32)] sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="hydra-stat-cell hydra-cell flex flex-col justify-between bg-black p-6 md:p-8"
                data-hydra-reveal
              >
                <p className="hydra-stat-num">{stat.value}</p>
                <div className="relative mt-8 pr-8">
                  <p className="hydra-stat-label text-white">{stat.label}</p>
                  <HydraStatCorners />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases — tabbed layout */}
      <section id="use-cases" className="hydra-section">
        <div className="hydra-container py-12 md:py-20">
          <p className="hydra-eyebrow" data-hydra-reveal-x>
            // Use Cases //
          </p>
          <h2 className="hydra-use-case-title mt-4 max-w-3xl text-white" data-hydra-reveal-x>
            What Engineers Are Building With HydraDB
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
                Similarity Isn&apos;t Always Relevance.
              </h2>
              <div className="hydra-similarity-body-wrap">
                <p className="hydra-similarity-body">
                  Similarity search often returns what&apos;s close and not what&apos;s related.
                </p>
                <p className="hydra-similarity-body">
                  HydraDB connects your context, builds a structured graph, and delivers the exact
                  context agents need. Relational-first, preference-aware, temporally versioned,
                  precision recall.
                </p>
              </div>
            </div>
            <div className="hydra-similarity-cols">
              <div className="hydra-similarity-col hydra-similarity-col-without">
                <div className="hydra-similarity-col-head hydra-similarity-col-head-dark">
                  <h3>Without Graphs</h3>
                </div>
                {WITHOUT_ROWS.map((row) => (
                  <div key={row} className="hydra-similarity-col-cell">
                    <p>{row}</p>
                  </div>
                ))}
              </div>
              <div className="hydra-similarity-col hydra-similarity-col-with">
                <div className="hydra-similarity-col-head hydra-similarity-col-head-accent">
                  <h3>With HydraDB</h3>
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
          <div className="hydra-section-title-wrap" data-hydra-reveal>
            <h3 className="hydra-h3-features text-center text-white">
              Everything You Need To Compound Intelligence
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

      {/* Recall degradation — bottom H-line full viewport */}
      <section className="hydra-recall-band">
        <div className="hydra-container">
          <div className="grid border border-[#353535] lg:grid-cols-2">
            <div
              className="border-b border-[#353535] p-8 md:p-10 lg:border-b-0 lg:border-r lg:p-12"
              data-hydra-reveal-x
            >
              <h2 className="hydra-h2-dark text-left text-white">
                Recall Degradation As A Bottleneck
              </h2>
              <ul className="mt-8 space-y-5">
                {[
                  "Embeddings hit a hard geometric ceiling as context scales",
                  "VectorDBs are stateless by design, cannot personalize results",
                  "Current systems are stitched implementations between vectorDBs, graphs, relational data stores; difficult to maintain, hard to scale",
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
              className="relative min-h-[280px] p-6 md:min-h-[340px] md:p-8"
              data-hydra-reveal
              data-hydra-parallax
              data-parallax-speed="0.2"
            >
              <p className="hydra-accent-label-sm mb-4">Accuracy vs Context Length</p>
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
                  <i className="inline-block size-2.5 bg-[var(--color-hydra-accent)]" /> HydraDB
                </span>
                <span className="inline-flex items-center gap-2">
                  <i className="inline-block size-2.5 bg-white" /> VectorDB
                </span>
                <span className="inline-flex items-center gap-2">
                  <i className="inline-block size-2.5 bg-[#f9c425]" /> Full Context: GPT-4o
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section id="architecture" className="hydra-section">
        <div className="hydra-container py-12 md:py-16 lg:py-20">
          <h2 className="hydra-h2-section text-center" data-hydra-reveal>
            Architecture Overview
          </h2>
          <div className="mt-10 border border-[var(--color-hydra-accent)]">
            <div className="border-b border-[var(--color-hydra-accent)] p-5 md:p-8" data-hydra-reveal>
              <p className="hydra-accent-label text-left">
                <strong>Orchestration Around The Graph Database</strong>
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
                <strong>The Graph Database Core</strong>
              </p>
              <p className="hydra-body-sm mt-2 text-white/80">
                Extremely fast, multi tenant, and built on object storage
              </p>
              <p className="hydra-body-sm mt-5 text-[var(--color-hydra-muted)]">
                NAMESPACE — multi-tenant isolation, auto-scalable
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
                TIERED — CONTEXT FLOWS ACROSS TIERS ON DEMAND
              </p>
              <div className="mt-3 grid grid-cols-3 gap-3">
                {[
                  ["Hot", "in-memory cache"],
                  ["Warm", "NVMe SSD"],
                  ["Cold", "object storage"],
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
              // Work //
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
            Pricing
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
            <h2 className="hydra-h2-section text-left text-[clamp(28px,4vw,48px)]">Get Started</h2>
            <p className="hydra-body mt-4 max-w-xl">
              Sign up for HydraDB cloud or run the open-source stack locally.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="https://hydradb.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hydra-cta"
              >
                Try HydraDB
              </a>
              <Link href="/cms/login" className="hydra-cta">
                CMS Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="hydra-section">
        <div className="hydra-container py-12 md:py-16">
          <div className="grid gap-10 md:grid-cols-4" data-hydra-stagger>
            {[
              {
                title: "HydraDB",
                body: "The Graph AI Runs On.",
                links: null,
              },
              {
                title: "Product",
                links: [
                  ["Architecture", "#architecture"],
                  ["Features", "#features"],
                  ["Pricing", "#pricing"],
                  ["Use Cases", "#use-cases"],
                ],
              },
              {
                title: "Resources",
                links: [
                  ["Docs", "https://hydradb.com"],
                  ["GitHub", "https://github.com"],
                  ["Contact", "#contact"],
                ],
              },
              {
                title: "Company",
                links: [
                  ["About", "#"],
                  ["Blog", "#"],
                  ["Careers", "#"],
                ],
              },
            ].map((col) => (
              <div key={col.title} data-hydra-stagger-item>
                <p className="hydra-footer-title">{col.title}</p>
                {col.body ? <p className="hydra-body-sm mt-3">{col.body}</p> : null}
                {col.links ? (
                  <ul className="mt-4 space-y-2">
                    {col.links.map(([label, href]) => (
                      <li key={label}>
                        <a href={href} className="hydra-footer-link">
                          {label}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
          <p className="mt-12 text-[12px] text-[rgb(117,117,117)]">
            © {new Date().getFullYear()} ShiftBOi · HydraDB layout · Violet accent
          </p>
        </div>
      </footer>
    </div>
  );
}
