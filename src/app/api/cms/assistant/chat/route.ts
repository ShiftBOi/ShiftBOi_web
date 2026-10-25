import { stepCountIs, streamText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { requireCmsAdmin, unauthorized } from "@/lib/cms-admin-api";
import {
  CMS_CHAT_SYSTEM,
  buildCmsProjectTools,
  getCmsAiProviderInfo,
  getCmsChatModel,
  loadAssistantContextPrompt,
  type WriteMode,
} from "@/lib/cms-ai";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

type IncomingMessage = { role: "user" | "assistant" | "system"; content: string };

function toolSummary(output: unknown): string {
  if (output == null) return "done";
  if (typeof output === "string") return output.slice(0, 160);
  try {
    const o = output as Record<string, unknown>;
    if (o.needConfirm) {
      return `Needs approval: ${String(o.action || "write")} ${String(o.slug || "")}`.trim();
    }
    if (typeof o.error === "string") return o.error;
    if (o.ok === false && typeof o.error === "string") return String(o.error);
    if (o.action && o.project && typeof o.project === "object") {
      const p = o.project as { title?: string; slug?: string };
      return `${String(o.action)} ${p.title || p.slug || ""}`.trim();
    }
    if (typeof o.count === "number") return `${o.count} results`;
    return JSON.stringify(output).slice(0, 140);
  } catch {
    return "done";
  }
}

function toolNeedConfirm(output: unknown) {
  if (!output || typeof output !== "object") return undefined;
  const o = output as Record<string, unknown>;
  if (!o.needConfirm) return undefined;
  return {
    action: String(o.action || "write"),
    slug: String(o.slug || ""),
    published: typeof o.published === "boolean" ? o.published : undefined,
  };
}

export async function POST(request: NextRequest) {
  if (!(await requireCmsAdmin(request))) return unauthorized();

  const body = (await request.json().catch(() => null)) as {
    messages?: IncomingMessage[];
    model?: string;
    threadId?: string | null;
    writeMode?: WriteMode;
  } | null;

  const writeMode: WriteMode =
    body?.writeMode === "approval" ? "approval" : "bypass";

  const messages = body?.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages required" }, { status: 400 });
  }

  let threadId =
    typeof body?.threadId === "string" && body.threadId.trim()
      ? body.threadId.trim()
      : null;

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const userText = lastUser?.content?.trim() || "";
  const canPersistThreads = Boolean(prisma.cmsChatThread && prisma.cmsChatMessage);

  if (canPersistThreads) {
    try {
      if (!threadId) {
        const thread = await prisma.cmsChatThread.create({
          data: { title: userText.slice(0, 72) || "New chat" },
        });
        threadId = thread.id;
      }

      if (userText && threadId) {
        await prisma.cmsChatMessage.create({
          data: { threadId, role: "user", content: userText },
        });
        const thread = await prisma.cmsChatThread.findUnique({
          where: { id: threadId },
          select: { title: true },
        });
        if (thread && (!thread.title || thread.title === "New chat")) {
          await prisma.cmsChatThread.update({
            where: { id: threadId },
            data: { title: userText.slice(0, 72) },
          });
        } else {
          await prisma.cmsChatThread.update({
            where: { id: threadId },
            data: { updatedAt: new Date() },
          });
        }
      }
    } catch {
      /* persistence optional — chat still streams */
      threadId = threadId || `ephemeral_${Date.now()}`;
    }
  } else {
    threadId = threadId || `ephemeral_${Date.now()}`;
  }

  const context = await loadAssistantContextPrompt();
  const modeLine =
    writeMode === "approval"
      ? "Current write mode: APPROVAL — call write tools without confirm first; Confirm card handles Approve/Deny."
      : "Current write mode: BYPASS — write tools run immediately.";
  const system = context
    ? `${CMS_CHAT_SYSTEM}\n\n${modeLine}\n\n${context}`
    : `${CMS_CHAT_SYSTEM}\n\n${modeLine}`;

  const encoder = new TextEncoder();
  const abort = new AbortController();
  request.signal.addEventListener("abort", () => abort.abort());

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(obj)}\n`));
      };

      let assistantText = "";

      try {
        const result = streamText({
          model: getCmsChatModel(),
          system,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          tools: buildCmsProjectTools({ writeMode }),
          stopWhen: stepCountIs(6),
          abortSignal: abort.signal,
          async onFinish({ text, usage }) {
            const provider = getCmsAiProviderInfo();
            if (prisma.cmsAiUsageLog) {
              await prisma.cmsAiUsageLog
                .create({
                  data: {
                    provider: provider.provider,
                    model: provider.model,
                    tokensIn: usage?.inputTokens ?? 0,
                    tokensOut: usage?.outputTokens ?? 0,
                  },
                })
                .catch(() => null);
            }

            const finalText = (text || assistantText).trim();
            if (
              canPersistThreads &&
              threadId &&
              !threadId.startsWith("ephemeral_") &&
              finalText
            ) {
              await prisma.cmsChatMessage
                .create({
                  data: {
                    threadId,
                    role: "assistant",
                    content: finalText,
                  },
                })
                .catch(() => null);
              await prisma.cmsChatThread
                .update({
                  where: { id: threadId! },
                  data: { updatedAt: new Date() },
                })
                .catch(() => null);
            }
          },
        });

        for await (const part of result.fullStream) {
          if (part.type === "text-delta") {
            const delta =
              "text" in part
                ? String((part as { text?: string }).text || "")
                : "delta" in part
                  ? String((part as { delta?: string }).delta || "")
                  : "";
            if (delta) {
              assistantText += delta;
              send({ type: "text", delta });
            }
          } else if (part.type === "reasoning-delta") {
            const delta =
              "text" in part
                ? String((part as { text?: string }).text || "")
                : "";
            if (delta) send({ type: "reasoning", delta });
          } else if (part.type === "reasoning-end") {
            send({ type: "reasoning-end", seconds: 1 });
          } else if (part.type === "tool-call") {
            const toolCallId = String(
              (part as { toolCallId?: string }).toolCallId ||
                (part as { id?: string }).id ||
                crypto.randomUUID(),
            );
            const name = String(
              (part as { toolName?: string }).toolName || "tool",
            );
            send({
              type: "tool",
              tool: {
                id: toolCallId,
                name,
                status: "running",
              },
            });
          } else if (part.type === "tool-result") {
            const toolCallId = String(
              (part as { toolCallId?: string }).toolCallId || "",
            );
            const name = String(
              (part as { toolName?: string }).toolName || "tool",
            );
            const output = (part as { output?: unknown }).output;
            const needConfirm = toolNeedConfirm(output);
            send({
              type: "tool",
              tool: {
                id: toolCallId || name,
                name,
                status: needConfirm ? "done" : "done",
                summary: toolSummary(output),
                ...(needConfirm ? { needConfirm } : {}),
              },
            });
          } else if (part.type === "tool-error") {
            const toolCallId = String(
              (part as { toolCallId?: string }).toolCallId || "",
            );
            const name = String(
              (part as { toolName?: string }).toolName || "tool",
            );
            const err = (part as { error?: unknown }).error;
            send({
              type: "tool",
              tool: {
                id: toolCallId || name,
                name,
                status: "error",
                summary:
                  err instanceof Error ? err.message : String(err || "failed"),
              },
            });
          } else if (part.type === "error") {
            const err = (part as { error?: unknown }).error;
            send({
              type: "error",
              message:
                err instanceof Error ? err.message : String(err || "failed"),
            });
          }
        }

        let title = userText.slice(0, 72) || "New chat";
        if (
          canPersistThreads &&
          threadId &&
          !threadId.startsWith("ephemeral_")
        ) {
          const thread = await prisma.cmsChatThread
            .findUnique({
              where: { id: threadId },
              select: { title: true },
            })
            .catch(() => null);
          if (thread?.title) title = thread.title;
        }
        send({
          type: "done",
          threadId,
          title,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Stream failed";
        send({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
