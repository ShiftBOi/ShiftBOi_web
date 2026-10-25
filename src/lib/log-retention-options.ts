export const LOG_RETENTION_OPTIONS = [
  { id: "off", label: "Keep forever", days: null as number | null },
  { id: "week", label: "Every week", days: 7 },
  { id: "2weeks", label: "Every 2 weeks", days: 14 },
  { id: "month", label: "Every month", days: 30 },
] as const;

export type LogRetentionId = (typeof LOG_RETENTION_OPTIONS)[number]["id"];

export function isLogRetentionId(value: string): value is LogRetentionId {
  return LOG_RETENTION_OPTIONS.some((o) => o.id === value);
}

export function retentionDays(id: string): number | null {
  return LOG_RETENTION_OPTIONS.find((o) => o.id === id)?.days ?? 30;
}

export function retentionLabel(id: string): string {
  return (
    LOG_RETENTION_OPTIONS.find((o) => o.id === id)?.label ?? "Every month"
  );
}

/** @deprecated use LOG_RETENTION_OPTIONS */
export const AI_LOG_RETENTION_OPTIONS = LOG_RETENTION_OPTIONS;
export type AiLogRetentionId = LogRetentionId;
export const isAiLogRetentionId = isLogRetentionId;
