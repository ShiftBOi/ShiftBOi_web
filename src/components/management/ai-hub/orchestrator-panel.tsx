"use client";

import {
  AgentOrchestrator,
  type OrchestratorEvent,
  type OrchestratorRun,
  type OrchestratorWorker,
} from "@/components/management/ai-hub/agent-orchestrator";
import { ORCH_LEAD, ORCH_WORKERS } from "@/lib/assistant/orch-workers";

const WORKERS: OrchestratorWorker[] = ORCH_WORKERS.map((w) => ({
  id: w.id,
  name: w.name,
}));

const CAPABILITIES = [
  {
    title: "Lead plans",
    body: "Splits your goal into 2–4 CMS subtasks with tools + args.",
  },
  {
    title: "Parallel lanes",
    body: "Each lane runs on its own Groq model up to concurrency 1–4.",
  },
  {
    title: "Real tools",
    body: "Workers call CMS tools (projects, about, inquiries, search…).",
  },
  {
    title: "Live progress",
    body: "Dispatch pulses, tool accents, streaming output, tokens + cost.",
  },
  {
    title: "Retry + queue",
    body: "Failed tool lanes retry once; extra work waits in a visible queue.",
  },
  {
    title: "Lead merge",
    body: "Streams a final summary of what each worker returned.",
  },
] as const;

const cmsOrchestrateRun: OrchestratorRun = async function* ({
  goal,
  concurrency,
  signal,
}) {
  const res = await fetch("/api/cms/assistant/orchestrate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      goal,
      concurrency: concurrency(),
      model: ORCH_LEAD.model,
    }),
  });

  if (!res.ok || !res.body) {
    yield { type: "error", message: `Run failed (${res.status})` };
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() || "";

    for (const raw of lines) {
      if (!raw.trim()) continue;
      let ev: Record<string, unknown>;
      try {
        ev = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        continue;
      }

      const type = String(ev.type || "");

      if (type === "plan" && ev.subtask && typeof ev.subtask === "object") {
        const sub = ev.subtask as {
          id: string;
          title: string;
          instruction?: string;
          workerId?: string;
        };
        yield {
          type: "plan",
          subtask: {
            id: sub.id,
            title: sub.title,
            instruction: sub.instruction || sub.title,
            workerId: sub.workerId,
          },
        } satisfies OrchestratorEvent;
      }

      if (type === "queued" && typeof ev.subtaskId === "string") {
        yield {
          type: "queued",
          subtaskId: ev.subtaskId,
          position: Number(ev.position) || 1,
        };
      }

      if (type === "dispatch" && typeof ev.subtaskId === "string") {
        yield {
          type: "dispatch",
          subtaskId: ev.subtaskId,
          workerId:
            typeof ev.workerId === "string" ? ev.workerId : undefined,
        };
      }

      if (type === "tool" && typeof ev.subtaskId === "string") {
        yield {
          type: "tool",
          subtaskId: ev.subtaskId,
          tool: String(ev.tool || "tool"),
          target: ev.target ? String(ev.target) : undefined,
          status: (ev.status as "running" | "done" | "error") || "running",
          summary: ev.summary ? String(ev.summary) : undefined,
        };
      }

      if (type === "output" && typeof ev.subtaskId === "string") {
        yield {
          type: "output",
          subtaskId: ev.subtaskId,
          delta: String(ev.delta || ""),
          newLine: Boolean(ev.newLine),
        };
      }

      if (type === "usage") {
        yield {
          type: "usage",
          subtaskId:
            typeof ev.subtaskId === "string" ? ev.subtaskId : undefined,
          tokens: Number(ev.tokens) || 0,
          cost: Number(ev.cost) || 0,
        };
      }

      if (type === "retry" && typeof ev.subtaskId === "string") {
        yield {
          type: "retry",
          subtaskId: ev.subtaskId,
          attempt: Number(ev.attempt) || 1,
        };
      }

      if (type === "result" && typeof ev.subtaskId === "string") {
        yield {
          type: "result",
          subtaskId: ev.subtaskId,
          text: String(ev.text || ""),
        };
      }

      if (type === "fail" && typeof ev.subtaskId === "string") {
        yield {
          type: "fail",
          subtaskId: ev.subtaskId,
          message: String(ev.message || "Failed"),
        };
      }

      if (type === "summary") {
        yield { type: "summary", delta: String(ev.delta || "") };
      }

      if (type === "error") {
        yield {
          type: "error",
          subtaskId:
            typeof ev.subtaskId === "string" ? ev.subtaskId : undefined,
          message: String(ev.message || "Error"),
          retryInMs:
            typeof ev.retryInMs === "number" ? ev.retryInMs : undefined,
        };
      }

      if (type === "done") yield { type: "done" };
    }
  }
};

export function OrchestratorPanel() {
  return (
    <div className="cms-ai-panel cms-ai-panel--orch">
      <header className="cms-ai-panel__head">
        <div>
          <p className="cms-eyebrow">Orchestrator</p>
          <h2 className="cms-title">Lead plans · workers execute · lead merges</h2>
          <p className="cms-subtitle">
            Same shape as Arc’s agent orchestrator — wired to Groq + your CMS
            tools, not a simulation.
          </p>
        </div>
      </header>

      <ul className="cms-ao-caps">
        {CAPABILITIES.map((c) => (
          <li key={c.title}>
            <strong>{c.title}</strong>
            <span>{c.body}</span>
          </li>
        ))}
      </ul>

      <AgentOrchestrator
        run={cmsOrchestrateRun}
        workers={WORKERS}
        lead={{ name: ORCH_LEAD.name }}
        defaultConcurrency={2}
        autoStart={false}
        goal="List recent inquiries and summarize themes for a short owner brief"
      />
    </div>
  );
}
