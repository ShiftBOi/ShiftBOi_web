import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { SITE_CHAT_SYSTEM_PROMPT } from "@/lib/site-chat-knowledge";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Free local / LAN chatbot via Ollama (OpenAI-compatible API).
 * Defaults: http://127.0.0.1:11434/v1  model: llama3.2
 * On another machine: set OLLAMA_BASE_URL=http://THAT_IP:11434/v1
 * and run Ollama with OLLAMA_HOST=0.0.0.0:11434
 */
function getOllama() {
  const baseURL = (process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434/v1").replace(/\/$/, "");
  return createOpenAICompatible({
    name: "ollama",
    baseURL,
    apiKey: process.env.OLLAMA_API_KEY ?? "ollama",
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { messages?: UIMessage[] };
    const messages = body.messages ?? [];
    if (!messages.length) {
      return Response.json({ error: "messages required" }, { status: 400 });
    }

    const modelId = process.env.OLLAMA_MODEL ?? "llama3.2";
    const ollama = getOllama();

    const result = streamText({
      model: ollama.chatModel(modelId),
      system: SITE_CHAT_SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
      temperature: 0.4,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Chat failed";
    console.error("[api/chat]", message);
    return Response.json(
      {
        error:
          "Cannot reach the local AI. Start Ollama (ollama serve) and pull a model, e.g. `ollama pull llama3.2`.",
        detail: message,
      },
      { status: 503 },
    );
  }
}
