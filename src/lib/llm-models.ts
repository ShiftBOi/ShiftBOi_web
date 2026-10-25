/**
 * CMS translate / AI model catalog.
 *
 * Source of truth for *your* key (free / developer):
 *   GET https://api.groq.com/openai/v1/models  +  Authorization: Bearer $GROQ_API_KEY
 * Docs list every hosted ID; the Models API returns only what this plan can call.
 * @see https://console.groq.com/docs/models
 *
 * Developer (non-Enterprise) chat models we use:
 *   openai/gpt-oss-120b · openai/gpt-oss-20b · qwen/qwen3.8-27b
 * Enterprise-only (404 on free keys — do not offer):
 *   llama-3.1-8b-instant · llama-3.3-70b-versatile · minimax · muse-spark
 * Not for translate (speech / TTS / guards): whisper · orpheus · prompt-guard · safeguard
 */

export type LlmProvider = "groq" | "openai";

export type OrbVariant = "sun" | "ocean" | "emerald" | "violet";

/** 1–5 segment scores for model picker (higher cost = more expensive). */
export type LlmModelMetrics = {
  speed: number;
  quality: number;
  cost: number;
};

export type LlmModelOption = {
  id: string;
  name: string;
  desc: string;
  provider: LlmProvider;
  /** Orb / UI accent — matches SiriOrb metaball in project edit */
  variant: OrbVariant;
  /** Brand mark in model menus: openai | qwen | groq */
  icon: "openai" | "qwen" | "groq";
  /** Speed / quality / cost bars (1–5) */
  metrics: LlmModelMetrics;
  /** Default pick for translate */
  recommended?: boolean;
};

/** Solid accents for bars / legends — same family as SiriOrb palettes */
export const ORB_VARIANT_HEX: Record<OrbVariant, string> = {
  violet: "#a78bfa",
  ocean: "#38bdf8",
  emerald: "#34d399",
  sun: "#fbbf24",
};

const FALLBACK_ACCENTS = [
  ORB_VARIANT_HEX.violet,
  ORB_VARIANT_HEX.ocean,
  ORB_VARIANT_HEX.emerald,
  ORB_VARIANT_HEX.sun,
  "#f472b6",
  "#94a3b8",
] as const;

/**
 * Models shown in CMS translate pickers.
 * Groq entries = developer-plan production / preview chat models.
 */
export const TRANSLATE_MODELS: LlmModelOption[] = [
  {
    id: "openai/gpt-oss-120b",
    name: "GPT-OSS 120B",
    desc: "Best overall",
    provider: "groq",
    variant: "violet",
    icon: "openai",
    metrics: { speed: 3, quality: 5, cost: 4 },
    recommended: true,
  },
  {
    id: "openai/gpt-oss-20b",
    name: "GPT-OSS 20B",
    desc: "Quick and light",
    provider: "groq",
    variant: "ocean",
    icon: "openai",
    metrics: { speed: 5, quality: 3, cost: 2 },
  },
  {
    id: "qwen/qwen3.8-27b",
    name: "Qwen3.8 27B",
    desc: "Balanced preview",
    provider: "groq",
    variant: "emerald",
    icon: "qwen",
    metrics: { speed: 4, quality: 4, cost: 3 },
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o mini",
    desc: "Everyday work",
    provider: "openai",
    variant: "sun",
    icon: "openai",
    metrics: { speed: 4, quality: 3, cost: 2 },
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    desc: "Hardest problems",
    provider: "openai",
    variant: "sun",
    icon: "openai",
    metrics: { speed: 3, quality: 5, cost: 5 },
  },
];

export function clampMetric(n: number) {
  return Math.max(1, Math.min(5, Math.round(n)));
}

export const DEFAULT_TRANSLATE_MODEL =
  TRANSLATE_MODELS.find((m) => m.recommended)?.id ?? "openai/gpt-oss-120b";

/** Map legacy / enterprise IDs to something the current key can call. */
const MODEL_ALIASES: Record<string, string> = {
  "llama-3.3-70b-versatile": "openai/gpt-oss-120b",
  "llama-3.1-70b-versatile": "openai/gpt-oss-120b",
  "llama-3.1-8b-instant": "openai/gpt-oss-20b",
  "llama-3.1-8b": "openai/gpt-oss-20b",
  "groq/llama-3.3-70b-versatile": "openai/gpt-oss-120b",
  "groq/llama-3.1-8b-instant": "openai/gpt-oss-20b",
};

export function resolveTranslateModel(id: string | null | undefined): string {
  const raw = (id || DEFAULT_TRANSLATE_MODEL).trim();
  return MODEL_ALIASES[raw] ?? MODEL_ALIASES[raw.toLowerCase()] ?? raw;
}

export function getTranslateModel(id: string) {
  const resolved = resolveTranslateModel(id);
  return (
    TRANSLATE_MODELS.find((m) => m.id === resolved) ??
    TRANSLATE_MODELS.find((m) => m.id === id)
  );
}

export function providerForModel(
  model: string
): LlmProvider | "gemini" | "unknown" {
  const m = resolveTranslateModel(model).toLowerCase();
  if (
    m.startsWith("openai/gpt-oss") ||
    m.includes("gpt-oss") ||
    m.startsWith("llama") ||
    m.startsWith("meta-llama/") ||
    m.startsWith("mixtral") ||
    m.startsWith("gemma") ||
    m.startsWith("qwen/") ||
    m.startsWith("qwen") ||
    m.startsWith("deepseek") ||
    m.startsWith("allam") ||
    m.startsWith("minimax") ||
    m.startsWith("groq/") ||
    m.includes("groq")
  ) {
    return "groq";
  }
  if (m.startsWith("gemini")) return "gemini";
  if (
    m.startsWith("gpt-") ||
    m.startsWith("o1") ||
    m.startsWith("o3") ||
    m.startsWith("chatgpt")
  ) {
    return "openai";
  }
  return "unknown";
}

/** Resolve SiriOrb variant for any logged model id (incl. aliases / unknown). */
export function variantForModel(model: string): OrbVariant {
  const known = getTranslateModel(model);
  if (known) return known.variant;
  const provider = providerForModel(model);
  if (provider === "openai") return "sun";
  if (provider === "gemini") return "emerald";
  if (provider === "groq") return "violet";
  return "ocean";
}

export function accentForModel(model: string, index = 0): string {
  const known = getTranslateModel(model);
  if (known) return ORB_VARIANT_HEX[known.variant];
  return FALLBACK_ACCENTS[index % FALLBACK_ACCENTS.length];
}

export function shortModelName(model: string) {
  const known = getTranslateModel(model);
  if (known) return known.name;
  const parts = model.split("/");
  return parts[parts.length - 1] || model;
}
