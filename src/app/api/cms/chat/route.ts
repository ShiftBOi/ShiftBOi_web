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
  getCmsChatModel,
  usesGroq,
} from "@/lib/cms-ai";

export const runtime = "nodejs";
export const maxDuration = 60;

async function requireAdmin(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user || !isAllowedAdminEmail(session.user.email)) {
    return null;
  }
  return session;
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const messages = (body?.messages ?? []) as UIMessage[];

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Missing messages" }, { status: 400 });
  }

  try {
    const result = streamText({
      model: getCmsChatModel(),
      system: CMS_CHAT_SYSTEM,
      messages: await convertToModelMessages(messages),
      tools: buildCmsProjectTools(),
      stopWhen: stepCountIs(6),
    });

    return result.toUIMessageStreamResponse({
      getErrorMessage: (error) => {
        if (error instanceof Error && error.message) return error.message;
        return "Chat failed";
      },
    });
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
