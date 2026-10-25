import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCmsAdmin, unauthorized } from "@/lib/cms-admin-api";
import { getCmsAiProviderInfo } from "@/lib/cms-ai";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!(await requireCmsAdmin(request))) return unauthorized();

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const logs = await prisma.cmsAiUsageLog.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const totals = logs.reduce(
    (acc, row) => {
      acc.tokensIn += row.tokensIn;
      acc.tokensOut += row.tokensOut;
      acc.calls += 1;
      return acc;
    },
    { tokensIn: 0, tokensOut: 0, calls: 0 },
  );

  return NextResponse.json({
    provider: getCmsAiProviderInfo(),
    totals,
    logs,
  });
}
