import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAllowedAdminEmail } from "@/lib/constants";
import {
  CMS_CHAT_SYSTEM,
  buildCmsProjectTools,
  getCmsAiProviderInfo,
  getCmsChatModel,
  loadAssistantContextPrompt,
  usesGroq,
} from "@/lib/cms-ai";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const maxDuration = 60;

async function requireAdmin(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user || !isAllowedAdminEmail(session.user.email)) {
    return null;
  }
  return session;
}

function lastUserText(messages: UIMessage[]) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i];
    if (msg?.role !== "user") continue;
    if (Array.isArray(msg.parts)) {
      return msg.parts
        .filter((p): p is { type: "text"; text: string } => p.type === "text" && "text" in p)
        .map((p) => p.text)
        .join("");
    }
  }
  return "";
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const messages = (body?.messages ?? []) as UIMessage[];
  const threadId =
    typeof body?.threadId === "string" && body.threadId.trim()
      ? body.threadId.trim()
      : null;

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Missing messages" }, { status: 400 });
  }

  try {
    const context = await loadAssistantContextPrompt();
    const system = context
      ? `${CMS_CHAT_SYSTEM}\n\n${context}`
      : CMS_CHAT_SYSTEM;

    if (threadId) {
      const userText = lastUserText(messages).trim();
      if (userText) {
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
    }

    const result = streamText({
      model: getCmsChatModel(),
      system,
      messages: await convertToModelMessages(messages),
      tools: buildCmsProjectTools(),
      stopWhen: stepCountIs(6),
      async onFinish({ text, usage }) {
        const provider = getCmsAiProviderInfo();
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

        if (threadId && text?.trim()) {
          await prisma.cmsChatMessage
            .create({
              data: {
                threadId,
                role: "assistant",
                content: text.trim(),
              },
            })
            .catch(() => null);
          await prisma.cmsChatThread
            .update({
              where: { id: threadId },
              data: { updatedAt: new Date() },
            })
            .catch(() => null);
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Chat failed";
    console.error("[api/cms/chat]", detail);

    if (usesGroq()) {
      return NextResponse.json(
        { error: "Groq request failed", detail },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        error:
          "Cannot reach local AI. Start Ollama (`ollama serve`) and pull a model, e.g. `ollama pull llama3.2`. Or set GROQ_API_KEY in .env.",
        detail,
      },
      { status: 503 },
    );
  }
}
