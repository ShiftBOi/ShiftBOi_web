// @ts-nocheck
import {
  getGroq,
  isGroqConfigured,
  cleanJsonText,
  parseJsonLoose,
} from "@/lib/llm";
import { resolveTranslateModel } from "@/lib/llm-models";
import { calculateCost, logAIUsage } from "@/lib/ai-usage";
import { executeTool, type ToolExecContext } from "@/lib/assistant/tools";
import { getEnabledToolIds } from "@/lib/assistant/settings";
import { BUILTIN_TOOLS } from "@/lib/assistant/tool-catalog";
import { ORCH_LEAD, ORCH_WORKERS } from "@/lib/assistant/orch-workers";

export { ORCH_LEAD, ORCH_WORKERS } from "@/lib/assistant/orch-workers";

export type OrchEvent =
  | {
      type: "plan";
      subtask: {
        id: string;
        title: string;
        instruction: string;
        tool?: string;
        workerId: string;
        workerName: string;
      };
    }
  | { type: "queued"; subtaskId: string; position: number }
  | { type: "dispatch"; subtaskId: string; workerId: string }
  | {
      type: "tool";
      subtaskId: string;
      tool: string;
      target?: string;
      status: "running" | "done" | "error";
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
      cost: number;
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

function line(event: OrchEvent) {
  return `${JSON.stringify(event)}\n`;
}

type PlanItem = {
  id: string;
  title: string;
  instruction: string;
  tool?: string;
  args?: Record<string, unknown>;
  workerId: string;
  workerName: string;
  workerModel: string;
};

function usageFromCompletion(
  model: string,
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  } | null
) {
  const prompt = usage?.prompt_tokens ?? 0;
  const completion = usage?.completion_tokens ?? 0;
  const tokens = usage?.total_tokens ?? prompt + completion;
  const cost = calculateCost(model, prompt, completion);
  return { tokens, cost, prompt, completion };
}

async function planGoal(goal: string, model: string): Promise<PlanItem[]> {
  const client = await getGroq();
  const toolNames = BUILTIN_TOOLS.map((t) => `${t.id} (${t.access})`).join(", ");
  const completion = await client.chat.completions.create({
    model,
    temperature: 0.2,
    max_tokens: 1400,
    messages: [
      {
        role: "system",
        content: `You are the CMS lead agent. Split the user's goal into 2-4 independent subtasks that can run in parallel.

Return ONLY JSON:
{ "subtasks": [{ "id": "s1", "title": "short lane title", "instruction": "one clear sentence the worker executes", "tool": "optional_tool_id", "args": {} }] }

Rules:
- Prefer real CMS tools when the goal needs data or writes.
- Available tools: ${toolNames}
- Titles ≤ 40 chars. Instructions are actionable.
- If the goal is read-only, use get_* / list_* / search_* tools.
- To remove/delete a project: use delete_project with { "slug": "..." }.
- To unpublish (keep draft): use set_project_published with { "slug": "...", "published": false }.
- Never use update_project_copy for publish/delete/status — it only edits title/tagline/description.
- If creating or updating copy, include concrete args (slug, locale, title, …).
- Do not invent tools outside the list.
- When a later step needs a slug from an earlier step, still put the best-known slug in args (e.g. demo-orchestrator).`,
      },
      { role: "user", content: goal },
    ],
  });

  const text = completion.choices[0]?.message?.content || "{}";
  let list: Omit<PlanItem, "workerId" | "workerName" | "workerModel">[] = [];
  try {
    const parsed = parseJsonLoose<{ subtasks?: typeof list }>(
      cleanJsonText(text)
    );
    list = (Array.isArray(parsed.subtasks) ? parsed.subtasks : []).slice(0, 4);
  } catch {
    list = [];
  }

  if (list.length === 0) {
    list = [
      {
        id: "s1",
        title: "Inspect CMS state",
        instruction: `Search the CMS for context related to: ${goal}`,
        tool: "search_cms",
        args: { query: goal.slice(0, 120) },
      },
      {
        id: "s2",
        title: "Draft next steps",
        instruction: `Propose concrete CMS actions for: ${goal}`,
      },
    ];
  }

  return list.map((s, i) => {
    const worker = ORCH_WORKERS[i % ORCH_WORKERS.length];
    return {
      id: s.id || `s${i + 1}`,
      title: String(s.title || `Step ${i + 1}`).slice(0, 48),
      instruction: String(s.instruction || s.title || goal),
      tool: s.tool,
      args: s.args && typeof s.args === "object" ? s.args : {},
      workerId: worker.id,
      workerName: worker.name,
      workerModel: worker.model,
    };
  });
}

async function runWorkerPass(
  sub: PlanItem,
  goal: string,
  ctx: ToolExecContext,
  emit: (e: OrchEvent) => void
): Promise<{ text: string; ok: boolean }> {
  const model = resolveTranslateModel(sub.workerModel).replace(/^groq\//, "");

  if (sub.tool && ctx.enabledToolIds.has(sub.tool)) {
    emit({
      type: "tool",
      subtaskId: sub.id,
      tool: sub.tool,
      target: Object.keys(sub.args || {}).slice(0, 2).join(", ") || undefined,
      status: "running",
    });

    const result = await executeTool(
      sub.tool,
      JSON.stringify(sub.args || {}),
      ctx
    );

    emit({
      type: "tool",
      subtaskId: sub.id,
      tool: sub.tool,
      status: result.ok ? "done" : "error",
      summary: result.summary,
    });

    const detail =
      result.data != null
        ? `${result.summary}\n${JSON.stringify(result.data, null, 0).slice(0, 500)}`
        : result.summary;

    emit({
      type: "output",
      subtaskId: sub.id,
      delta: detail,
      newLine: true,
    });

    // Lightweight usage estimate for tool lanes (no LLM tokens).
    emit({
      type: "usage",
      subtaskId: sub.id,
      tokens: 180,
      cost: calculateCost(model, 120, 60),
    });

    return {
      text: result.ok ? detail : `Failed: ${result.summary}`,
      ok: result.ok,
    };
  }

  const client = await getGroq();
  const completion = await client.chat.completions.create({
    model,
    temperature: 0.35,
    max_tokens: 600,
    messages: [
      {
        role: "system",
        content: `You are a CMS worker lane (${sub.workerName}). Complete the subtask. Be concrete about slugs, locales, and fields. 3-6 short sentences or bullets.`,
      },
      {
        role: "user",
        content: `Overall goal: ${goal}\nYour subtask: ${sub.instruction}`,
      },
    ],
  });

  const text =
    completion.choices[0]?.message?.content?.trim() || "Completed.";
  const usage = usageFromCompletion(model, completion.usage);

  emit({
    type: "usage",
    subtaskId: sub.id,
    tokens: usage.tokens || 200,
    cost: usage.cost,
  });

  // Stream output in chunks so the lane line animates.
  const parts = text.match(/\S+\s*/g) || [text];
  let first = true;
  for (const part of parts) {
    emit({
      type: "output",
      subtaskId: sub.id,
      delta: part,
      newLine: first,
    });
    first = false;
  }

  return { text, ok: true };
}

async function runSubtask(
  sub: PlanItem,
  goal: string,
  ctx: ToolExecContext,
  emit: (e: OrchEvent) => void,
  signal?: AbortSignal
) {
  if (signal?.aborted) return;

  emit({ type: "dispatch", subtaskId: sub.id, workerId: sub.workerId });

  try {
    let pass = await runWorkerPass(sub, goal, ctx, emit);
    if (!pass.ok && sub.tool) {
      emit({ type: "retry", subtaskId: sub.id, attempt: 1 });
      emit({
        type: "error",
        subtaskId: sub.id,
        message: pass.text,
        retryInMs: 1200,
      });
      await new Promise((r) => setTimeout(r, 1200));
      if (signal?.aborted) return;
      pass = await runWorkerPass(sub, goal, ctx, emit);
    }

    if (signal?.aborted) return;

    if (pass.ok) {
      emit({ type: "result", subtaskId: sub.id, text: pass.text });
    } else {
      emit({ type: "fail", subtaskId: sub.id, message: pass.text });
    }
  } catch (err) {
    emit({
      type: "fail",
      subtaskId: sub.id,
      message: err instanceof Error ? err.message : "Worker failed",
    });
  }
}

async function* streamLeadSummary(
  goal: string,
  results: { title: string; text: string; ok: boolean }[],
  model: string,
  signal?: AbortSignal
): AsyncGenerator<OrchEvent> {
  const client = await getGroq();
  const packed = results
    .map(
      (r, i) =>
        `${i + 1}. [${r.ok ? "ok" : "fail"}] ${r.title}\n${r.text.slice(0, 800)}`
    )
    .join("\n\n");

  try {
    const stream = await client.chat.completions.create({
      model,
      temperature: 0.3,
      max_tokens: 700,
      stream: true,
      messages: [
        {
          role: "system",
          content:
            "You are the CMS lead agent writing the final merge. Summarize what workers did, call out failures, and list clear next actions for the site owner. Use short markdown bullets.",
        },
        {
          role: "user",
          content: `Goal: ${goal}\n\nWorker results:\n${packed}`,
        },
      ],
    });

    for await (const chunk of stream) {
      if (signal?.aborted) break;
      const delta = chunk.choices[0]?.delta?.content || "";
      if (delta) yield { type: "summary", delta };
      if (chunk.usage) {
        const u = usageFromCompletion(model, chunk.usage);
        yield { type: "usage", tokens: u.tokens, cost: u.cost };
      }
    }
  } catch {
    const fallback = `Finished ${results.length} lanes for: ${goal}\n${results
      .map((r) => `• ${r.title}: ${r.text.slice(0, 160)}`)
      .join("\n")}`;
    for (const word of fallback.split(/(\s+)/)) {
      if (signal?.aborted) break;
      yield { type: "summary", delta: word };
    }
  }
}

/** Tiny async event bus so parallel workers can yield as they progress. */
function createEventBus(signal?: AbortSignal) {
  const queue: OrchEvent[] = [];
  let wake: (() => void) | null = null;
  let closed = false;

  const waiters = () => {
    if (wake) {
      const w = wake;
      wake = null;
      w();
    }
  };

  return {
    emit(e: OrchEvent) {
      if (closed || signal?.aborted) return;
      queue.push(e);
      waiters();
    },
    async *consume(): AsyncGenerator<OrchEvent> {
      while (!closed && !signal?.aborted) {
        while (queue.length) {
          yield queue.shift()!;
        }
        if (closed || signal?.aborted) break;
        await new Promise<void>((resolve) => {
          wake = resolve;
          // Safety poll so we never hang if a worker finishes without emit.
          setTimeout(resolve, 60);
        });
      }
      while (queue.length) yield queue.shift()!;
    },
    close() {
      closed = true;
      waiters();
    },
  };
}

export async function* runOrchestration(opts: {
  goal: string;
  model?: string;
  concurrency: number;
  actor: ToolExecContext["actor"];
  signal?: AbortSignal;
}): AsyncGenerator<string, void, unknown> {
  if (!(await isGroqConfigured())) {
    yield line({ type: "error", message: "Groq API key not configured" });
    return;
  }

  const started = Date.now();
  const leadModel = resolveTranslateModel(
    opts.model || ORCH_LEAD.model
  ).replace(/^groq\//, "");
  const enabled = new Set(await getEnabledToolIds());
  const ctx: ToolExecContext = { actor: opts.actor, enabledToolIds: enabled };
  const concurrency = Math.max(1, Math.min(4, opts.concurrency || 2));

  let totalPrompt = 0;
  let totalCompletion = 0;
  let totalCost = 0;

  try {
    const plan = await planGoal(opts.goal, leadModel);

    for (const sub of plan) {
      if (opts.signal?.aborted) break;
      yield line({
        type: "plan",
        subtask: {
          id: sub.id,
          title: sub.title,
          instruction: sub.instruction,
          tool: sub.tool,
          workerId: sub.workerId,
          workerName: sub.workerName,
        },
      });
    }

    // Mark overflow lanes as queued before dispatch.
    plan.forEach((sub, i) => {
      if (i >= concurrency) {
        // yielded after plan loop via bus below — emit now for UI
      }
    });
    for (let i = concurrency; i < plan.length; i++) {
      yield line({
        type: "queued",
        subtaskId: plan[i].id,
        position: i - concurrency + 1,
      });
    }

    const bus = createEventBus(opts.signal);
    const pending = [...plan];
    const active = new Set<Promise<void>>();
    const results: { title: string; text: string; ok: boolean }[] = [];
    const resultById = new Map<string, { text: string; ok: boolean }>();

    const pump = async () => {
      while (pending.length > 0 && !opts.signal?.aborted) {
        while (active.size < concurrency && pending.length > 0) {
          const sub = pending.shift()!;
          const job = runSubtask(sub, opts.goal, ctx, (e) => {
            if (e.type === "usage") {
              totalCost += e.cost;
              totalPrompt += Math.floor(e.tokens * 0.55);
              totalCompletion += Math.floor(e.tokens * 0.45);
            }
            if (e.type === "result") {
              resultById.set(e.subtaskId, { text: e.text, ok: true });
            }
            if (e.type === "fail") {
              resultById.set(e.subtaskId, { text: e.message, ok: false });
            }
            bus.emit(e);
          }, opts.signal).finally(() => {
            active.delete(job);
          });
          active.add(job);
        }
        if (active.size === 0) break;
        await Promise.race(active);
      }
      await Promise.allSettled([...active]);
      bus.close();
    };

    const pumping = pump();

    for await (const ev of bus.consume()) {
      yield line(ev);
    }
    await pumping;

    for (const sub of plan) {
      const r = resultById.get(sub.id);
      results.push({
        title: sub.title,
        text: r?.text || "No result",
        ok: r?.ok ?? false,
      });
    }

    if (!opts.signal?.aborted) {
      for await (const ev of streamLeadSummary(
        opts.goal,
        results,
        leadModel,
        opts.signal
      )) {
        if (ev.type === "usage") {
          totalCost += ev.cost;
          totalPrompt += Math.floor(ev.tokens * 0.55);
          totalCompletion += Math.floor(ev.tokens * 0.45);
        }
        yield line(ev);
      }
    }

    await logAIUsage({
      provider: "groq",
      model: leadModel,
      status: "success",
      latency: Date.now() - started,
      action: "orchestrator",
      route: "/api/management/assistant/orchestrate",
      cost: totalCost || calculateCost(leadModel, 800, 400),
      promptTokens: totalPrompt || 800,
      completionTokens: totalCompletion || 400,
      totalTokens: (totalPrompt || 800) + (totalCompletion || 400),
    });

    yield line({ type: "done" });
  } catch (err) {
    yield line({
      type: "error",
      message: err instanceof Error ? err.message : "Orchestration failed",
    });
  }
}
