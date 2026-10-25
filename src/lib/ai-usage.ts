import { prisma } from "@/lib/prisma";

interface AIUsageLogData {
  provider: string;
  model: string;
  status: "success" | "error";
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  cost?: number;
  latency: number;
  errorMessage?: string;
  action?: string;
  route?: string;
  projectSlug?: string;
  contentFields?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
}

export async function logAIUsage(data: AIUsageLogData) {
  try {
    await prisma.cmsAiUsageLog.create({
      data: {
        provider: data.provider,
        model: data.model,
        tokensIn: data.promptTokens ?? 0,
        tokensOut: data.completionTokens ?? 0,
      },
    });
  } catch (error) {
    console.error("Failed to log AI usage:", error);
  }
}

export function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const pricing: Record<string, { input: number; output: number }> = {
    "gpt-4o": { input: 0.0025, output: 0.01 },
    "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
    "gemini-3-flash-preview": { input: 0.00035, output: 0.00105 },
    "openai/gpt-oss-20b": { input: 0.000075, output: 0.0003 },
    "openai/gpt-oss-120b": { input: 0.00015, output: 0.0006 },
  };
  const modelPricing = pricing[model] || { input: 0, output: 0 };
  const inputCost = (promptTokens / 1000) * modelPricing.input;
  const outputCost = (completionTokens / 1000) * modelPricing.output;
  return Number((inputCost + outputCost).toFixed(6));
}

function dayKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function pctChange(current: number, previous: number): number | null {
  if (!Number.isFinite(previous) || previous <= 0) {
    return current > 0 ? 100 : null;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export async function getAIUsageStats(startDate?: Date, endDate?: Date) {
  const end = endDate || new Date();
  const start =
    startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  const spanMs = Math.max(end.getTime() - start.getTime(), 24 * 60 * 60 * 1000);
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - spanMs);

  const where = { createdAt: { gte: start, lte: end } };
  const prevWhere = { createdAt: { gte: prevStart, lte: prevEnd } };
  const log = prisma.cmsAiUsageLog;

  const [totalCalls, totalIn, totalOut, prevIn, prevOut, prevCalls] =
    await Promise.all([
      log.count({ where }),
      log.aggregate({ where, _sum: { tokensIn: true } }),
      log.aggregate({ where, _sum: { tokensOut: true } }),
      log.aggregate({ where: prevWhere, _sum: { tokensIn: true } }),
      log.aggregate({ where: prevWhere, _sum: { tokensOut: true } }),
      log.count({ where: prevWhere }),
    ]);

  const tokensNow =
    (totalIn._sum.tokensIn || 0) + (totalOut._sum.tokensOut || 0);
  const tokensPrev =
    (prevIn._sum.tokensIn || 0) + (prevOut._sum.tokensOut || 0);

  const usageByModel = await log.groupBy({
    by: ["model"],
    where,
    _count: { id: true },
    _sum: { tokensIn: true, tokensOut: true },
  });

  const recentLogs = await log.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const weekEnd = new Date(end);
  weekEnd.setHours(23, 59, 59, 999);
  const weekStart = new Date(weekEnd);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - 6);

  const weekRows = await log.findMany({
    where: { createdAt: { gte: weekStart, lte: weekEnd } },
    select: { model: true, tokensIn: true, tokensOut: true, createdAt: true },
  });

  const dayBuckets = new Map<
    string,
    { date: string; day: string; total: number; byModel: Record<string, number> }
  >();
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const key = dayKey(d);
    dayBuckets.set(key, {
      date: key,
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
      total: 0,
      byModel: {},
    });
  }
  for (const row of weekRows) {
    const key = dayKey(row.createdAt);
    const bucket = dayBuckets.get(key);
    if (!bucket) continue;
    const tokens = (row.tokensIn || 0) + (row.tokensOut || 0);
    bucket.total += tokens;
    bucket.byModel[row.model] = (bucket.byModel[row.model] || 0) + tokens;
  }

  return {
    summary: {
      totalCalls,
      successfulCalls: totalCalls,
      failedCalls: 0,
      totalTokens: tokensNow,
      totalCost: 0,
      avgLatency: 0,
      change: {
        tokens: pctChange(tokensNow, tokensPrev),
        calls: pctChange(totalCalls, prevCalls),
        cost: null as number | null,
      },
      previous: {
        tokens: tokensPrev,
        calls: prevCalls,
        cost: 0,
      },
    },
    usageByModel: usageByModel.map((item) => ({
      model: item.model,
      calls: item._count.id,
      tokens: (item._sum.tokensIn || 0) + (item._sum.tokensOut || 0),
      cost: 0,
      avgLatency: 0,
    })),
    usageByDay: Array.from(dayBuckets.values()),
    recentLogs,
  };
}
