import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { getSiteChatModel, usesSiteGroq } from "@/lib/cms-ai";
import { SITE_CHAT_SYSTEM_PROMPT } from "@/lib/site-chat-knowledge";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Public site chat — Groq via GROQ_SITE_API_KEY (or GROQ_API_KEY),
 * otherwise local Ollama.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { messages?: UIMessage[] };
    const messages = body.messages ?? [];
    if (!messages.length) {
      return Response.json({ error: "messages required" }, { status: 400 });
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
