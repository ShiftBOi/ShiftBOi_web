/** Shared lead + worker lane definitions (safe for client + server). */
export const ORCH_WORKERS = [
  {
    id: "w1",
    name: "GPT-OSS 20B",
    model: "openai/gpt-oss-20b",
  },
  {
    id: "w2",
    name: "Qwen3.8 27B",
    model: "qwen/qwen3.8-27b",
  },
  {
    id: "w3",
    name: "GPT-OSS 120B",
    model: "openai/gpt-oss-120b",
  },
  {
    id: "w4",
    name: "GPT-OSS 20B Fast",
    model: "openai/gpt-oss-20b",
  },
] as const;

export const ORCH_LEAD = {
  id: "lead",
  name: "GPT-OSS 120B",
  model: "openai/gpt-oss-120b",
} as const;
