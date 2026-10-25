// @ts-nocheck
import { getPrisma } from "@/lib/prisma";
import { ALL_TOOL_IDS } from "@/lib/assistant/tool-catalog";

export async function ensureAssistantSettings() {
  // Call getPrisma() directly — never go through the proxy for this hot path.
  const db = getPrisma();
  return db.assistantSettings.upsert({
    where: { id: "assistant" },
    create: { id: "assistant" },
    update: {},
  });
}

export function parseDisabledToolIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string");
}

export async function getEnabledToolIds(): Promise<string[]> {
  const settings = await ensureAssistantSettings();
  const disabled = new Set(parseDisabledToolIds(settings.disabledToolIds));
  return ALL_TOOL_IDS.filter((id) => !disabled.has(id));
}
