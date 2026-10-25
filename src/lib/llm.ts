/**
 * LLM providers used by the CMS (OpenAI · Groq · optional Gemini).
 * Clients prefer DB/env secrets via resolveRuntimeSecrets().
 * @see https://console.groq.com/docs/overview
 */

import OpenAI from "openai";
import { providerForModel, resolveTranslateModel } from "@/lib/llm-models";
import { resolveRuntimeSecrets } from "@/lib/runtime-secrets";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

/** Lazy OpenAI client — prefers DB secret, falls back to env. */
export async function getOpenAI() {
  const { secrets } = await resolveRuntimeSecrets();
  return new OpenAI({ apiKey: secrets.openaiApiKey || "" });
}

/** Groq OpenAI-compatible client — https://console.groq.com/keys */
export async function getGroq() {
  const { secrets } = await resolveRuntimeSecrets();
  return new OpenAI({
    apiKey: secrets.groqApiKey || "",
    baseURL: GROQ_BASE_URL,
  });
}

/** @deprecated Prefer getOpenAI() */
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export async function isOpenAIConfigured() {
  const { secrets } = await resolveRuntimeSecrets();
  return Boolean(secrets.openaiApiKey);
}

export async function isGeminiConfigured() {
  const { secrets } = await resolveRuntimeSecrets();
  return Boolean(secrets.geminiApiKey);
}

export async function getGeminiApiKey() {
  const { secrets } = await resolveRuntimeSecrets();
  return secrets.geminiApiKey;
}

export async function isGroqConfigured() {
  const { secrets } = await resolveRuntimeSecrets();
  return Boolean(secrets.groqApiKey);
}

export async function getGroqApiKey() {
  const { secrets } = await resolveRuntimeSecrets();
  return secrets.groqApiKey;
}

export function isGroqModel(model: string) {
  return providerForModel(model) === "groq";
}

export function isGeminiModel(model: string) {
  return providerForModel(model) === "gemini";
}

export type LlmChatResult = {
  text: string;
  provider: "groq" | "openai" | "gemini";
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  latencyMs: number;
};

/**
 * Chat completion that must return JSON text.
 * Groq path uses OpenAI-compatible API (docs overview).
 */
export async function completeJsonChat(opts: {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<LlmChatResult> {
  const model = resolveTranslateModel(opts.model);
  const temperature = opts.temperature ?? 0.2;
  const maxTokens = opts.maxTokens ?? 8192;
  const started = Date.now();
  const provider = providerForModel(model);

  if (provider === "groq") {
    if (!(await isGroqConfigured())) {
      throw new Error("Groq API key not configured (set GROQ_API_KEY)");
    }
    const client = await getGroq();
    const id = model.replace(/^groq\//, "");
    const messages = [
      { role: "system" as const, content: opts.systemPrompt },
      { role: "user" as const, content: opts.userPrompt },
    ];
    const base = {
      model: id,
      messages,
      temperature,
      max_tokens: maxTokens,
    };

    // gpt-oss-20b often rejects response_format=json_object on Groq;
    // larger OSS / Qwen accept it. Soft-prompt JSON when forced mode fails.
    const preferSoftJson =
      id === "openai/gpt-oss-20b" || id.endsWith("/gpt-oss-20b");

    let completion;
    try {
      completion = await client.chat.completions.create(
        preferSoftJson
          ? base
          : { ...base, response_format: { type: "json_object" as const } }
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!/json_validate_failed|response_format|Failed to validate JSON/i.test(msg)) {
        throw err;
      }
      completion = await client.chat.completions.create(base);
    }

    const usage = completion.usage;
    return {
      text: completion.choices[0]?.message?.content || "",
      provider: "groq",
      model: id,
      promptTokens: usage?.prompt_tokens,
      completionTokens: usage?.completion_tokens,
      totalTokens: usage?.total_tokens,
      latencyMs: Date.now() - started,
    };
  }

  if (provider === "gemini") {
    if (!(await isGeminiConfigured())) {
      throw new Error("Gemini API key not configured");
    }
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const gemini = new GoogleGenerativeAI(await getGeminiApiKey());
    const gm = gemini.getGenerativeModel({
      model,
      systemInstruction: opts.systemPrompt,
      generationConfig: { responseMimeType: "application/json" },
    });
    const result = await gm.generateContent(opts.userPrompt);
    return {
      text: result.response.text(),
      provider: "gemini",
      model,
      latencyMs: Date.now() - started,
    };
  }

  if (!(await isOpenAIConfigured())) {
    throw new Error("OpenAI API key not configured");
  }
  const client = await getOpenAI();
  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: opts.systemPrompt },
      { role: "user", content: opts.userPrompt },
    ],
    temperature,
    max_tokens: maxTokens,
    response_format: { type: "json_object" },
  });
  const usage = completion.usage;
  return {
    text: completion.choices[0]?.message?.content || "",
    provider: "openai",
    model,
    promptTokens: usage?.prompt_tokens,
    completionTokens: usage?.completion_tokens,
    totalTokens: usage?.total_tokens,
    latencyMs: Date.now() - started,
  };
}

export function cleanJsonText(text: string) {
  return text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/g, "")
    .trim();
}

export function parseJsonLoose<T = unknown>(text: string): T {
  return JSON.parse(cleanJsonText(text)) as T;
}
