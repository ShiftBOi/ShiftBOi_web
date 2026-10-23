import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { getSiteChatModel, usesSiteGroq } from "@/lib/cms-ai";
import { SITE_CHAT_SYSTEM_PROMPT } from "@/lib/site-chat-knowledge";
import {
  clientIp,
  pruneRateLimits,
  rateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_MESSAGES = 24;
const MAX_CHARS_PER_MSG = 4000;

/**
 * Public site chat — Groq via GROQ_SITE_API_KEY (or GROQ_API_KEY),
 * otherwise local Ollama.
 */
export async function POST(req: Request) {
  try {
    pruneRateLimits();
    const limited = rateLimit(`chat:${clientIp(req)}`, 20, 60_000);
    if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

    const body = (await req.json()) as { messages?: UIMessage[] };
    const messages = (body.messages ?? []).slice(-MAX_MESSAGES);
    if (!messages.length) {
      return Response.json({ error: "messages required" }, { status: 400 });
    }

    for (const msg of messages) {
      const parts = (msg as { parts?: { type?: string; text?: string }[] }).parts;
      if (!parts) continue;
      for (const part of parts) {
        if (part?.type === "text" && typeof part.text === "string") {
          if (part.text.length > MAX_CHARS_PER_MSG) {
            return Response.json(
              { error: "Message too long" },
              { status: 400 },
            );
          }
        }
      }
    }

    const result = streamText({
      model: getSiteChatModel(),
      system: SITE_CHAT_SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
      temperature: 0.4,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Chat failed";
    console.error("[api/chat]", message);

    if (usesSiteGroq()) {
      return Response.json(
        { error: "Groq request failed", detail: message },
        { status: 503 },
      );
    }

    return Response.json(
      {
        error:
          "Cannot reach the local AI. Start Ollama (ollama serve) and pull a model, e.g. `ollama pull llama3.2`. Or set GROQ_SITE_API_KEY in .env.",
        detail: message,
      },
      { status: 503 },
    );
  }
}
