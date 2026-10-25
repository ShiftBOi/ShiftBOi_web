"use client";

import { Button } from "@/components/ui/button";
import { cn } from "cn";
import {
  ChevronDown,
  Circle,
  Copy,
  Globe,
  Loader2,
  Play,
  Square,
  Wrench,
} from "lucide-react";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

export type OrchestratorWorker = {
  id: string;
  name: string;
  mark?: ReactNode;
};

export type OrchestratorSubtask = {
  id: string;
  title: string;
  instruction?: string;
  workerId?: string;
};

export type OrchestratorEvent =
  | { type: "plan"; subtask: OrchestratorSubtask }
  | { type: "queued"; subtaskId: string; position: number }
  | { type: "dispatch"; subtaskId: string; workerId?: string }
  | {
      type: "tool";
      subtaskId: string;
      tool: string;
      target?: string;
      status?: "running" | "done" | "error";
      summary?: string;
    }
  | {
      type: "output";
      subtaskId: string;
      delta: string;
      newLine?: boolean;
    }
  | {
      type: "usage";
      subtaskId?: string;
      tokens: number;
      cost?: number;
    }
  | {
      type: "error";
      subtaskId?: string;
      message: string;
      retryInMs?: number;
    }
  | { type: "retry"; subtaskId: string; attempt: number }
  | { type: "result"; subtaskId: string; text: string }
  | { type: "fail"; subtaskId: string; message: string }
  | { type: "summary"; delta: string }
  | { type: "done" };

export type OrchestratorRunContext = {
  goal: string;
  plan: OrchestratorSubtask[];
  workers: OrchestratorWorker[];
  concurrency: () => number;
  signal: AbortSignal;
};

export type OrchestratorRun = (
  ctx: OrchestratorRunContext
) => AsyncIterable<OrchestratorEvent>;

export type OrchestratorResult = {
  summary: string;
  tokens: number;
  cost: number;
  wallMs: number;
  lanes: LaneState[];
};

type LaneStatus =
  | "waiting"
  | "planned"
  | "queued"
  | "starting"
  | "running"
  | "returned"
  | "failed"
  | "stopped";

type LaneState = {
  workerId: string;
  workerName: string;
  subtaskId: string | null;
  title: string;
  instruction: string;
  status: LaneStatus;
  tool: string | null;
  toolTarget: string | null;
  output: string;
  transcript: string[];
  tokens: number;
  cost: number;
  startedAt: number | null;
  endedAt: number | null;
  series: number;
  error: string | null;
};

const SERIES = ["blue", "purple", "orange", "green"] as const;

const DEFAULT_WORKERS: OrchestratorWorker[] = [
  { id: "w1", name: "GPT-OSS 20B" },
  { id: "w2", name: "Qwen3.8 27B" },
  { id: "w3", name: "GPT-OSS 120B" },
  { id: "w4", name: "GPT-OSS 20B Fast" },
];

function LeadMark() {
  return (
    <span className="cms-ao__mark" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3.2" fill="currentColor" />
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i * Math.PI) / 4;
          const x1 = 12 + Math.cos(a) * 6.2;
          const y1 = 12 + Math.sin(a) * 6.2;
          const x2 = 12 + Math.cos(a) * 9.4;
          const y2 = 12 + Math.sin(a) * 9.4;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          );
        })}
      </svg>
    </span>
  );
}

function formatSec(ms: number) {
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatTokens(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function formatCost(n: number) {
  if (n <= 0) return "$0.000";
  return `$${n.toFixed(3)}`;
}

function emptyLanes(workers: OrchestratorWorker[]): LaneState[] {
  return workers.slice(0, 4).map((w, i) => ({
    workerId: w.id,
    workerName: w.name,
    subtaskId: null,
    title: "Unassigned",
    instruction: "Waiting for the plan",
    status: "waiting",
    tool: null,
    toolTarget: null,
    output: "",
    transcript: [],
    tokens: 0,
    cost: 0,
    startedAt: null,
    endedAt: null,
    series: i,
    error: null,
  }));
}

function statusLabel(lane: LaneState): string {
  switch (lane.status) {
    case "waiting":
      return "Waiting for the plan";
    case "planned":
      return "Planned";
    case "queued":
      return "Queued";
    case "starting":
      return "Starting";
    case "running":
      if (lane.tool) {
        return lane.toolTarget
          ? `${lane.tool} · ${lane.toolTarget}`
          : lane.tool;
      }
      return "Working";
    case "returned":
      return "Returned";
    case "failed":
      return lane.error || "Failed";
    case "stopped":
      return "Stopped";
    default:
      return lane.status;
  }
}

export type AgentOrchestratorProps = {
  goal?: string;
  onGoalChange?: (goal: string) => void;
  workers?: OrchestratorWorker[];
  lead?: { name: string; mark?: ReactNode };
  run: OrchestratorRun;
  concurrency?: number;
  defaultConcurrency?: number;
  onConcurrencyChange?: (value: number) => void;
  autoStart?: boolean;
  onComplete?: (result: OrchestratorResult) => void;
  className?: string;
  /** Seed plan titles shown before a live run (optional). */
  plan?: OrchestratorSubtask[];
};

export function AgentOrchestrator({
  goal: goalProp,
  onGoalChange,
  workers = DEFAULT_WORKERS,
  lead = { name: "GPT-OSS 120B" },
  run,
  concurrency: concurrencyProp,
  defaultConcurrency,
  onConcurrencyChange,
  autoStart = false,
  onComplete,
  className,
  plan: seedPlan = [],
}: AgentOrchestratorProps) {
  const uid = useId();
  const [goal, setGoal] = useState(
    goalProp ??
      "List recent inquiries and summarize themes for a short owner brief"
  );
  const [concurrencyUncontrolled, setConcurrencyUncontrolled] = useState(
    Math.min(4, defaultConcurrency ?? (Math.min(4, workers.length) || 2))
  );
  const concurrency = concurrencyProp ?? concurrencyUncontrolled;

  const [running, setRunning] = useState(false);
  const [lanes, setLanes] = useState(() => emptyLanes(workers));
  const [planItems, setPlanItems] = useState<OrchestratorSubtask[]>(seedPlan);
  const [summary, setSummary] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [endedAt, setEndedAt] = useState<number | null>(null);
  const [announce, setAnnounce] = useState("");
  const [pulses, setPulses] = useState<
    { id: string; series: number; dir: "down" | "up" }[]
  >([]);

  const abortRef = useRef<AbortController | null>(null);
  const concurrencyRef = useRef(concurrency);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const summaryRef = useRef("");
  const lanesSnapshotRef = useRef<LaneState[]>([]);

  useEffect(() => {
    concurrencyRef.current = concurrency;
  }, [concurrency]);

  useEffect(() => {
    if (goalProp !== undefined) setGoal(goalProp);
  }, [goalProp]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    lanesSnapshotRef.current = lanes;
  }, [lanes]);

  useEffect(() => {
    summaryRef.current = summary;
  }, [summary]);

  const returnedCount = lanes.filter((l) => l.status === "returned").length;
  const workingCount = lanes.filter(
    (l) => l.status === "running" || l.status === "starting"
  ).length;
  const wallMs =
    startedAt != null ? (endedAt ?? now) - startedAt : 0;

  function setConcurrencyValue(n: number) {
    if (concurrencyProp === undefined) setConcurrencyUncontrolled(n);
    onConcurrencyChange?.(n);
  }

  function pulseLane(subtaskId: string, dir: "down" | "up") {
    const idx = lanesSnapshotRef.current.findIndex(
      (l) => l.subtaskId === subtaskId
    );
    if (idx < 0) return;
    const id = `${dir}-${subtaskId}-${Date.now()}`;
    setPulses((p) => [...p, { id, series: idx % 4, dir }]);
    window.setTimeout(() => {
      setPulses((p) => p.filter((x) => x.id !== id));
    }, 720);
  }

  async function startRun() {
    if (running) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setRunning(true);
    setError(null);
    setSummary("");
    setPlanItems([]);
    setLanes(emptyLanes(workers));
    setExpanded(null);
    const t0 = Date.now();
    startedAtRef.current = t0;
    setStartedAt(t0);
    setEndedAt(null);
    setNow(t0);
    setAnnounce("Planning…");

    const planAccum: OrchestratorSubtask[] = [];
    let totalTokens = 0;
    let totalCost = 0;
    let summaryText = "";

    try {
      const iterable = run({
        goal,
        plan: seedPlan,
        workers,
        concurrency: () => concurrencyRef.current,
        signal: ac.signal,
      });

      for await (const ev of iterable) {
        if (ac.signal.aborted) break;

        if (ev.type === "plan") {
          planAccum.push(ev.subtask);
          setPlanItems([...planAccum]);
          // One lane per plan item (Arc-style). Map by plan index → worker.
          setLanes(
            planAccum.map((sub, i) => {
              const w = workers[i % workers.length] || {
                id: `w${i + 1}`,
                name: `Worker ${i + 1}`,
              };
              return {
                workerId: w.id,
                workerName: w.name,
                subtaskId: sub.id,
                title: sub.title,
                instruction: sub.instruction || sub.title,
                status: "planned" as const,
                tool: null,
                toolTarget: null,
                output: "",
                transcript: [],
                tokens: 0,
                cost: 0,
                startedAt: null,
                endedAt: null,
                series: i % 4,
                error: null,
              };
            })
          );
          setAnnounce(`Planned: ${ev.subtask.title}`);
        }

        if (ev.type === "queued") {
          setLanes((prev) =>
            prev.map((l) =>
              l.subtaskId === ev.subtaskId
                ? { ...l, status: "queued" }
                : l
            )
          );
        }

        if (ev.type === "dispatch") {
          pulseLane(ev.subtaskId, "down");
          setLanes((prev) =>
            prev.map((l) =>
              l.subtaskId === ev.subtaskId
                ? {
                    ...l,
                    status: "running",
                    startedAt: l.startedAt ?? Date.now(),
                    error: null,
                  }
                : l
            )
          );
          setAnnounce("Dispatching workers");
        }

        if (ev.type === "tool") {
          setLanes((prev) =>
            prev.map((l) =>
              l.subtaskId === ev.subtaskId
                ? {
                    ...l,
                    status: "running",
                    tool: ev.tool,
                    toolTarget: ev.target || null,
                    transcript:
                      ev.status === "running"
                        ? [...l.transcript, `▸ ${ev.tool}`]
                        : ev.status === "done"
                          ? [...l.transcript, `✓ ${ev.tool}${ev.summary ? ` — ${ev.summary}` : ""}`]
                          : [...l.transcript, `✗ ${ev.tool}`],
                  }
                : l
            )
          );
        }

        if (ev.type === "retry") {
          setLanes((prev) =>
            prev.map((l) =>
              l.subtaskId === ev.subtaskId
                ? {
                    ...l,
                    status: "running",
                    error: null,
                    transcript: [
                      ...l.transcript,
                      `Retry #${ev.attempt}…`,
                    ],
                  }
                : l
            )
          );
        }

        if (ev.type === "output") {
          setLanes((prev) =>
            prev.map((l) => {
              if (l.subtaskId !== ev.subtaskId) return l;
              const output = ev.newLine
                ? ev.delta
                : `${l.output}${ev.delta}`;
              return {
                ...l,
                output,
                transcript: ev.newLine
                  ? [...l.transcript, ev.delta]
                  : l.transcript,
              };
            })
          );
        }

        if (ev.type === "usage") {
          totalTokens += ev.tokens;
          totalCost += ev.cost || 0;
          if (ev.subtaskId) {
            setLanes((prev) =>
              prev.map((l) =>
                l.subtaskId === ev.subtaskId
                  ? {
                      ...l,
                      tokens: l.tokens + ev.tokens,
                      cost: l.cost + (ev.cost || 0),
                    }
                  : l
              )
            );
          }
        }

        if (ev.type === "error") {
          if (ev.subtaskId) {
            // Soft error while retrying — keep lane alive with accent.
            setLanes((prev) =>
              prev.map((l) =>
                l.subtaskId === ev.subtaskId
                  ? {
                      ...l,
                      error: ev.message,
                      status: ev.retryInMs ? "running" : "failed",
                    }
                  : l
              )
            );
          } else {
            setError(ev.message);
          }
          setAnnounce(ev.message);
        }

        if (ev.type === "result") {
          pulseLane(ev.subtaskId, "up");
          setLanes((prev) =>
            prev.map((l) =>
              l.subtaskId === ev.subtaskId
                ? {
                    ...l,
                    status: "returned",
                    output: ev.text,
                    endedAt: Date.now(),
                    transcript: [...l.transcript, ev.text],
                    error: null,
                  }
                : l
            )
          );
          setAnnounce(`Returned: ${ev.subtaskId}`);
        }

        if (ev.type === "fail") {
          setLanes((prev) =>
            prev.map((l) =>
              l.subtaskId === ev.subtaskId
                ? {
                    ...l,
                    status: "failed",
                    error: ev.message,
                    endedAt: Date.now(),
                  }
                : l
            )
          );
        }

        if (ev.type === "summary") {
          summaryText += ev.delta;
          setSummary(summaryText);
        }

        if (ev.type === "done") {
          setAnnounce("Run complete");
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError(err instanceof Error ? err.message : "Run failed");
      }
    } finally {
      const end = Date.now();
      setEndedAt(end);
      setRunning(false);
      abortRef.current = null;
      setLanes((prev) =>
        prev.map((l) =>
          l.status === "running" || l.status === "starting"
            ? { ...l, status: "stopped", endedAt: end }
            : l
        )
      );

      onComplete?.({
        summary: summaryText,
        tokens: totalTokens,
        cost: totalCost,
        wallMs: startedAtRef.current != null ? end - startedAtRef.current : 0,
        lanes: lanesSnapshotRef.current,
      });
    }
  }

  function stopRun() {
    abortRef.current?.abort();
    setAnnounce("Stopped");
  }

  useEffect(() => {
    if (!autoStart) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
    if (reduced) return;
    const node = rootRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          void startRun();
          io.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(node);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- autoStart once
  }, [autoStart]);

  const leadElapsed =
    startedAt != null ? formatSec((endedAt ?? now) - startedAt) : "0.0s";

  const failedCount = lanes.filter((l) => l.status === "failed").length;
  const leadStatus = useMemo(() => {
    if (error && !planItems.length) return error;
    if (running && planItems.length === 0) return "Planning";
    if (running && workingCount > 0) return `${workingCount} working`;
    if (running && summary) return "Merging";
    if (running) return "Waiting on lanes";
    if (!running && returnedCount > 0)
      return failedCount
        ? `${returnedCount} returned · ${failedCount} failed`
        : `${returnedCount} returned`;
    if (planItems.length === 0) return "Ready";
    return `${returnedCount} of ${planItems.length} returned`;
  }, [
    error,
    running,
    workingCount,
    planItems.length,
    returnedCount,
    failedCount,
    summary,
  ]);

  async function copySummary() {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      ref={rootRef}
      className={cn("cms-ao", className)}
      data-running={running || undefined}
    >
      <header className="cms-ao__head">
        <label className="cms-ao__goal">
          <span className="sr-only">Goal</span>
          <textarea
            value={goal}
            rows={2}
            disabled={running}
            onChange={(e) => {
              setGoal(e.target.value);
              onGoalChange?.(e.target.value);
            }}
          />
        </label>
        <div className="cms-ao__controls">
          <div
            className="cms-ao__concurrency"
            role="group"
            aria-label="Concurrency"
          >
            <span className="cms-ao__concurrency-label">Concurrency</span>
            <div className="cms-ao__seg">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={cn(concurrency === n && "is-active")}
                  aria-pressed={concurrency === n}
                  disabled={n > workers.length}
                  onClick={() => setConcurrencyValue(n)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowRight") {
                      e.preventDefault();
                      setConcurrencyValue(Math.min(4, concurrency + 1));
                    }
                    if (e.key === "ArrowLeft") {
                      e.preventDefault();
                      setConcurrencyValue(Math.max(1, concurrency - 1));
                    }
                    if (e.key === "Home") {
                      e.preventDefault();
                      setConcurrencyValue(1);
                    }
                    if (e.key === "End") {
                      e.preventDefault();
                      setConcurrencyValue(Math.min(4, workers.length));
                    }
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          {running ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="cms-ao__run"
              onClick={stopRun}
            >
              <Square data-icon="inline-start" className="size-3.5" />
              Stop
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="cms-ao__run"
              onClick={() => void startRun()}
            >
              <Play data-icon="inline-start" className="size-3.5" />
              {planItems.length || summary ? "Run again" : "Run"}
            </Button>
          )}
        </div>
      </header>

      <section className="cms-ao__lead" aria-labelledby={`${uid}-lead`}>
        <div className="cms-ao__lead-row">
          <div className="cms-ao__identity">
            {lead.mark ?? <LeadMark />}
            <div>
              <h2 id={`${uid}-lead`} className="cms-ao__name">
                {lead.name}{" "}
                <span className="cms-ao__role">Lead</span>
              </h2>
            </div>
          </div>
          <div className="cms-ao__meta" aria-live="polite">
            {running ? (
              <Loader2 className="cms-ao__spin size-3.5" aria-hidden />
            ) : (
              <Circle className="size-3 opacity-40" aria-hidden />
            )}
            <span>{leadStatus}</span>
            <span className="cms-ao__time">{leadElapsed}</span>
          </div>
        </div>

        {planItems.length > 0 ? (
          <ol className="cms-ao__plan">
            {planItems.map((item, i) => (
              <li
                key={item.id}
                className={cn("cms-ao__plan-item", `is-${SERIES[i % 4]}`)}
              >
                <span className="cms-ao__dot" aria-hidden />
                <span>{item.instruction || item.title}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="cms-ao__hint">
            Writes a plan, then splits it across {Math.min(4, workers.length)}{" "}
            subagents.
          </p>
        )}
      </section>

      <div
        className="cms-ao__trunk"
        aria-hidden="true"
        style={{ ["--ao-n" as string]: Math.max(lanes.length, 1) } as CSSProperties}
      >
        <div className="cms-ao__spine" />
        <div className="cms-ao__bus cms-ao__bus--out">
          {lanes.map((lane, i) => (
            <span
              key={lane.workerId}
              className={cn(
                "cms-ao__branch",
                `is-${SERIES[i % 4]}`,
                (lane.status === "running" ||
                  lane.status === "returned" ||
                  lane.status === "planned" ||
                  lane.status === "starting") &&
                  "is-lit",
                (lane.status === "running" || lane.status === "starting") &&
                  "is-live",
                lane.status === "queued" && "is-queued"
              )}
              style={{ ["--ao-i" as string]: i } as CSSProperties}
            >
              {(lane.status === "running" || lane.status === "starting") && (
                <i className="cms-ao__packet" />
              )}
            </span>
          ))}
          {pulses
            .filter((p) => p.dir === "down")
            .map((p) => (
              <span
                key={p.id}
                className={cn(
                  "cms-ao__pulse cms-ao__pulse--down",
                  `is-${SERIES[p.series]}`
                )}
                style={{ ["--ao-i" as string]: p.series } as CSSProperties}
              />
            ))}
        </div>
      </div>

      <div
        className="cms-ao__lanes"
        style={{ ["--ao-n" as string]: lanes.length } as CSSProperties}
      >
        {lanes.map((lane, i) => {
          const elapsed =
            lane.startedAt != null
              ? formatSec((lane.endedAt ?? now) - lane.startedAt)
              : "0.0s";
          const open = expanded === lane.workerId;
          const active =
            lane.status === "running" ||
            lane.status === "returned" ||
            lane.status === "planned";
          return (
            <button
              key={lane.workerId}
              type="button"
              data-ao-lane
              data-active={active || undefined}
              className={cn(
                "cms-ao__lane",
                `is-${SERIES[i % 4]}`,
                `is-${lane.status}`,
                lane.tool && lane.status === "running" && "is-tooling",
                open && "is-open"
              )}
              aria-expanded={open}
              aria-controls={`${uid}-lane-${lane.workerId}`}
              onClick={() =>
                setExpanded((cur) =>
                  cur === lane.workerId ? null : lane.workerId
                )
              }
            >
              <div className="cms-ao__lane-top">
                <span className="cms-ao__lane-model">
                  <span className="cms-ao__lane-port" aria-hidden />
                  {lane.workerName}
                </span>
                <span className="cms-ao__time">{elapsed}</span>
              </div>
              <strong className="cms-ao__lane-title">{lane.title}</strong>
              <div className="cms-ao__lane-tool">
                {lane.tool ? (
                  <>
                    {/fetch|search|http|web|globe/i.test(lane.tool) ? (
                      <Globe className="size-3" aria-hidden />
                    ) : (
                      <Wrench className="size-3" aria-hidden />
                    )}
                    <span className={cn(lane.status === "running" && "cms-ao__shimmer")}>
                      {statusLabel(lane)}
                    </span>
                  </>
                ) : (
                  <span className="cms-ao__muted">{statusLabel(lane)}</span>
                )}
              </div>
              {lane.output && lane.status !== "waiting" ? (
                <p className="cms-ao__lane-out">{lane.output}</p>
              ) : null}
              <div className="cms-ao__lane-foot">
                <span>
                  {formatTokens(lane.tokens)} tokens · {formatCost(lane.cost)}
                </span>
                <ChevronDown
                  className={cn("size-3.5 cms-ao__chev", open && "is-open")}
                  aria-hidden
                />
              </div>
              <div
                id={`${uid}-lane-${lane.workerId}`}
                className="cms-ao__transcript"
                inert={open ? undefined : true}
                hidden={!open}
              >
                {lane.transcript.length === 0 ? (
                  <p className="cms-ao__muted">This lane has no transcript yet.</p>
                ) : (
                  lane.transcript.map((line, ti) => (
                    <p key={ti}>{line}</p>
                  ))
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div
        className="cms-ao__trunk cms-ao__trunk--in"
        aria-hidden="true"
        style={{ ["--ao-n" as string]: Math.max(lanes.length, 1) } as CSSProperties}
      >
        <div className="cms-ao__bus cms-ao__bus--in">
          {lanes.map((lane, i) => (
            <span
              key={`in-${lane.workerId}`}
              className={cn(
                "cms-ao__branch cms-ao__branch--up",
                `is-${SERIES[i % 4]}`,
                lane.status === "returned" && "is-lit",
                lane.status !== "returned" && "is-dashed"
              )}
              style={{ ["--ao-i" as string]: i } as CSSProperties}
            />
          ))}
          {pulses
            .filter((p) => p.dir === "up")
            .map((p) => (
              <span
                key={p.id}
                className={cn(
                  "cms-ao__pulse cms-ao__pulse--up",
                  `is-${SERIES[p.series]}`
                )}
                style={{ ["--ao-i" as string]: p.series } as CSSProperties}
              />
            ))}
        </div>
        <div className="cms-ao__spine cms-ao__spine--in" />
      </div>

      <section className="cms-ao__summary" aria-labelledby={`${uid}-summary`}>
        <div className="cms-ao__lead-row">
          <div className="cms-ao__identity">
            {lead.mark ?? <LeadMark />}
            <h3 id={`${uid}-summary`} className="cms-ao__name">
              Summary
            </h3>
          </div>
          <div className="cms-ao__meta">
            <Circle className="size-3 opacity-40" aria-hidden />
            <span>
              {returnedCount} of {planItems.length || lanes.length} returned
            </span>
            {summary ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="cms-ao__copy"
                onClick={() => void copySummary()}
                aria-label={copied ? "Copied" : "Copy summary"}
              >
                <Copy className="size-3.5" />
              </Button>
            ) : null}
          </div>
        </div>
        {summary ? (
          <pre className="cms-ao__summary-body">{summary}</pre>
        ) : (
          <p className="cms-ao__hint">
            The lead merges what the subagents return here.
          </p>
        )}
        {!running && endedAt != null && returnedCount > 0 ? (
          <p className="cms-ao__totals">
            Wall {formatSec(wallMs)}
            {lanes.some((l) => l.startedAt && l.endedAt)
              ? ` · ${formatTokens(
                  lanes.reduce((s, l) => s + l.tokens, 0)
                )} tokens`
              : null}
          </p>
        ) : null}
      </section>

      {error ? <p className="cms-ao__error">{error}</p> : null}
      <p className="sr-only" role="status" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}
