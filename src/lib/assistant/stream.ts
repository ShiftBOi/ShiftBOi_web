// @ts-nocheck
import type OpenAI from "openai";
import { getGroq, isGroqConfigured } from "@/lib/llm";
import { resolveTranslateModel } from "@/lib/llm-models";
import { calculateCost, logAIUsage } from "@/lib/ai-usage";
import { buildSystemPrompt } from "@/lib/assistant/system-prompt";
import {
  executeTool,
  openaiToolsFor,
  type ToolExecContext,
} from "@/lib/assistant/tools";
import { ensureAssistantSettings } from "@/lib/assistant/settings";
import { getPrisma } from "@/lib/prisma";
import { retrieveKnowledge } from "@/lib/assistant/knowledge";
import { getEnabledToolIds } from "@/lib/assistant/settings";

export type ChatMention = {
  type: string;
  id?: string;
  label?: string;
};

export type IncomingMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type StreamEvent =
  | { type: "reasoning"; delta: string }
  | { type: "reasoning-end"; seconds?: number }
  | {
      type: "tool";
      tool: {
        id: string;
        name: string;
        status: "running" | "done" | "error";
        summary?: string;
        needConfirm?: {
          action: string;
          slug: string;
          published?: boolean;
        };
      };
    }
  | { type: "sources"; sources: Array<{ title: string; snippet: string }> }
  | { type: "text"; delta: string }
  | { type: "error"; message: string }
  | { type: "done"; threadId: string; title: string };

function ndjson(event: StreamEvent) {
  return `${JSON.stringify(event)}\n`;
}

export async function* runAssistantStream(opts: {
  messages: IncomingMessage[];
  model: string;
  mentions?: ChatMention[];
  threadId?: string | null;
  actor: ToolExecContext["actor"];
  signal?: AbortSignal;
}): AsyncGenerator<string, void, unknown> {
  if (!(await isGroqConfigured())) {
    yield ndjson({
      type: "error",
      message: "Groq API key not configured. Add GROQ_API_KEY in site secrets.",
    });
    return;
  }

  const started = Date.now();
  const model = resolveTranslateModel(opts.model).replace(/^groq\//, "");
  const settings = await ensureAssistantSettings();
  const enabledToolIds = new Set(await getEnabledToolIds());
  const ctx: ToolExecContext = {
    actor: opts.actor,
    enabledToolIds,
  };

  const memories = settings.savedMemoriesOn
    ? await getPrisma().agentMemory.findMany({
        orderBy: { createdAt: "desc" },
        take: 24,
      })
    : [];

  const lastUser =
    [...opts.messages].reverse().find((m) => m.role === "user")?.content || "";

  const knowledge =
    settings.knowledgeOn && lastUser
      ? await retrieveKnowledge(lastUser, settings.knowledgeTopK)
      : [];

  if (knowledge.length) {
    yield ndjson({
      type: "sources",
      sources: knowledge.map((k) => ({
        title: k.sourceName,
        snippet: k.text.slice(0, 160),
      })),
    });
  }

  const system = buildSystemPrompt({
    memories: memories.map((m) => ({ group: m.group, text: m.text })),
    knowledge: knowledge.map((k) => ({
      sourceName: k.sourceName,
      text: k.text,
      location: k.location,
    })),
    mentions: opts.mentions,
  });

  const client = await getGroq();
  const tools = openaiToolsFor(enabledToolIds);

  let threadId = opts.threadId || null;
  let title = "New chat";
  if (!threadId) {
    title = lastUser.slice(0, 60) || "New chat";
    const thread = await getPrisma().assistantThread.create({
      data: { title, model },
    });
    threadId = thread.id;
  } else {
    const existing = await getPrisma().assistantThread.findUnique({
      where: { id: threadId },
    });
    title = existing?.title || title;
    await getPrisma().assistantThread.update({
      where: { id: threadId },
      data: { model, updatedAt: new Date() },
    });
  }

  await getPrisma().assistantMessage.create({
    data: {
      threadId,
      role: "user",
      content: lastUser,
      status: "done",
    },
  });

  type Msg = OpenAI.Chat.Completions.ChatCompletionMessageParam;
  const prior = opts.messages.filter(
    (m) => m.role === "user" || m.role === "assistant"
  );
  const windowed = settings.chatHistoryOn
    ? prior.slice(-16)
    : prior.slice(-2); // current user (+ optional prior assistant) only
  const history: Msg[] = [
    { role: "system", content: system },
    ...windowed.map((m) => ({ role: m.role, content: m.content }) as Msg),
  ];

  let assistantText = "";
  let reasoning = "";
  const toolLog: Array<{
    id: string;
    name: string;
    status: string;
    summary?: string;
  }> = [];
  let promptTokens = 0;
  let completionTokens = 0;

  try {
    for (let round = 0; round < 6; round++) {
      if (opts.signal?.aborted) break;

      const stream = await client.chat.completions.create({
        model,
        messages: history,
        tools: tools.length ? tools : undefined,
        stream: true,
        temperature: 0.4,
        max_tokens: 4096,
      });

      let content = "";
      const toolCalls = new Map<
        number,
        { id: string; name: string; args: string }
      >();

      for await (const chunk of stream) {
        if (opts.signal?.aborted) break;
        const choice = chunk.choices[0];
        const delta = choice?.delta;
        if (!delta) continue;

        if (typeof delta.content === "string" && delta.content) {
          content += delta.content;
          assistantText += delta.content;
          yield ndjson({ type: "text", delta: delta.content });
        }

        // Some models stream reasoning in a proprietary field — ignore if absent
        const anyDelta = delta as { reasoning?: string };
        if (typeof anyDelta.reasoning === "string" && anyDelta.reasoning) {
          reasoning += anyDelta.reasoning;
          yield ndjson({ type: "reasoning", delta: anyDelta.reasoning });
        }

        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index ?? 0;
            const cur = toolCalls.get(idx) || {
              id: tc.id || `tool_${idx}`,
              name: "",
              args: "",
            };
            if (tc.id) cur.id = tc.id;
            if (tc.function?.name) cur.name = tc.function.name;
            if (tc.function?.arguments) cur.args += tc.function.arguments;
            toolCalls.set(idx, cur);
          }
        }

        if (chunk.usage) {
          promptTokens += chunk.usage.prompt_tokens || 0;
          completionTokens += chunk.usage.completion_tokens || 0;
        }
      }

      if (reasoning && round === 0) {
        yield ndjson({
          type: "reasoning-end",
          seconds: Math.max(1, Math.round((Date.now() - started) / 1000)),
        });
      }

      if (toolCalls.size === 0) break;

      const assistantToolMsg: OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam =
        {
          role: "assistant",
          content: content || null,
          tool_calls: [...toolCalls.values()].map((t) => ({
            id: t.id,
            type: "function" as const,
            function: { name: t.name, arguments: t.args },
          })),
        };
      history.push(assistantToolMsg);

      for (const t of toolCalls.values()) {
        yield ndjson({
          type: "tool",
          tool: { id: t.id, name: t.name, status: "running" },
        });
        const result = await executeTool(t.name, t.args, ctx);
        const needConfirm =
          result.data &&
          typeof result.data === "object" &&
          (result.data as { needConfirm?: unknown }).needConfirm
            ? (result.data as {
                needConfirm: true;
                action: string;
                slug: string;
                published?: boolean;
              })
            : null;
        toolLog.push({
          id: t.id,
          name: t.name,
          status: result.ok ? "done" : "error",
          summary: result.summary,
        });
        yield ndjson({
          type: "tool",
          tool: {
            id: t.id,
            name: t.name,
            status: result.ok ? "done" : "error",
            summary: result.summary,
            ...(needConfirm
              ? {
                  needConfirm: {
                    action: needConfirm.action,
                    slug: needConfirm.slug,
                    published: needConfirm.published,
                  },
                }
              : {}),
          },
        });
        history.push({
          role: "tool",
          tool_call_id: t.id,
          content: JSON.stringify(result),
        });
      }
    }

    await getPrisma().assistantMessage.create({
      data: {
        threadId,
        role: "assistant",
        content: assistantText || "(no reply)",
        reasoning: reasoning || null,
        tools: toolLog.length ? toolLog : undefined,
        status: opts.signal?.aborted ? "stopped" : "done",
      },
    });

    const latency = Date.now() - started;
    const total = promptTokens + completionTokens;
    await logAIUsage({
      provider: "groq",
      model,
      status: "success",
      promptTokens,
      completionTokens,
      totalTokens: total || undefined,
      cost: total
        ? calculateCost(model, promptTokens, completionTokens)
        : undefined,
      latency,
      action: "assistant",
      route: "/api/management/assistant/chat",
    });

    yield ndjson({ type: "done", threadId, title });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Assistant failed";
    yield ndjson({ type: "error", message });
    await logAIUsage({
      provider: "groq",
      model,
      status: "error",
      latency: Date.now() - started,
      errorMessage: message,
      action: "assistant",
      route: "/api/management/assistant/chat",
    });
    if (assistantText) {
      await getPrisma().assistantMessage.create({
        data: {
          threadId: threadId!,
          role: "assistant",
          content: assistantText,
          status: "error",
        },
      });
    }
  }
}
