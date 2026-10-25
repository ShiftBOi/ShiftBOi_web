import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCmsAdmin, unauthorized } from "@/lib/cms-admin-api";
import { getTrafficSummary } from "@/lib/analytics";
import { storageSummary } from "@/lib/cms-storage";
import { isR2Configured } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await requireCmsAdmin(request))) return unauthorized();

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 13);

  const [
    projects,
    published,
    draft,
    featured,
    inquiries,
    recentInquiries,
    aiAgg,
    traffic,
    storage,
    inquiryDays,
  ] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({ where: { published: true } }),
    prisma.project.count({ where: { published: false } }),
    prisma.project.count({ where: { featured: true } }),
    prisma.inquiry.count(),
    prisma.inquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        email: true,
        name: true,
        source: true,
        createdAt: true,
      },
    }),
    prisma.cmsAiUsageLog
      ? prisma.cmsAiUsageLog
          .aggregate({
            where: { createdAt: { gte: since } },
            _sum: { tokensIn: true, tokensOut: true },
            _count: true,
          })
          .catch(() => null)
      : Promise.resolve(null),
    getTrafficSummary().catch(() => null),
    storageSummary().catch(() => null),
    prisma.inquiry.findMany({
      where: { createdAt: { gte: weekStart } },
      select: { createdAt: true, source: true },
    }),
  ]);

  const dayMap = new Map<string, number>();
  const sourceMap = new Map<string, number>();
  for (const row of inquiryDays) {
    const key = row.createdAt.toISOString().slice(0, 10);
    dayMap.set(key, (dayMap.get(key) || 0) + 1);
    sourceMap.set(row.source, (sourceMap.get(row.source) || 0) + 1);
  }
  const inquirySeries = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - (13 - i));
    const key = d.toISOString().slice(0, 10);
    return {
      day: key.slice(5),
      date: key,
      visitors: dayMap.get(key) || 0,
    };
  });

  const trafficSeries =
    traffic?.last7.map((d) => ({
      day: d.day.slice(5),
      date: d.day,
      visitors: d.pageViews,
    })) ?? [];

  const peak =
    trafficSeries.length > 0
      ? trafficSeries.reduce((best, d) =>
          d.visitors > best.visitors ? d : best,
        )
      : null;

  const tokensIn = aiAgg?._sum?.tokensIn ?? 0;
  const tokensOut = aiAgg?._sum?.tokensOut ?? 0;

  return NextResponse.json({
    counts: {
      projects,
      skills: 0,
      education: 0,
      work: 0,
      inquiries,
      aboutLocales: 1,
      projectLocales: 1,
      published,
      draft,
      featured,
      news: 0,
    },
    recentInquiries: recentInquiries.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      source: r.source,
      createdAt: r.createdAt.toISOString(),
    })),
    inquiriesPulse: {
      series: inquirySeries,
      total: inquiries,
      bySource: Array.from(sourceMap.entries()).map(([source, count]) => ({
        source,
        count,
      })),
    },
    ai: {
      totalCalls: aiAgg?._count ?? 0,
      totalTokens: tokensIn + tokensOut,
      totalCost: 0,
      avgLatency: 0,
      periodLabel: "30 days",
      tokenLimit: null,
      usageByModel: [],
    },
    storage: storage
      ? {
          totalFiles: storage.totalFiles,
          totalSize: storage.totalSize,
          ready: isR2Configured() || storage.storage === "local",
          limitBytes: storage.limitBytes,
          limitLabel: storage.limitLabel,
        }
      : null,
    traffic: {
      series: trafficSeries,
      total: traffic?.totalViews ?? 0,
      changePct: null,
      paths: [
        { path: "/", label: "Home", count: traffic?.totalViews ?? 0 },
        { path: "/projects", label: "Projects", count: published },
      ],
      locales: [{ locale: "en", count: traffic?.totalViews ?? 0 }],
      peak: peak
        ? { date: peak.date, day: peak.day, visitors: peak.visitors }
        : null,
    },
  });
}
