import { prisma } from "@/lib/prisma";

export function utcDay(date = new Date()) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function daysAgo(n: number) {
  const d = utcDay();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

export async function getTrafficSummary() {
  const today = utcDay();
  const weekStart = daysAgo(6);

  const [todayRow, weekRows, totals] = await Promise.all([
    prisma.siteTrafficDay.findUnique({ where: { day: today } }),
    prisma.siteTrafficDay.findMany({
      where: { day: { gte: weekStart, lte: today } },
      orderBy: { day: "asc" },
    }),
    prisma.siteTrafficDay.aggregate({
      _sum: { pageViews: true, visitors: true },
    }),
  ]);

  const weekMap = new Map(
    weekRows.map((r) => [r.day.toISOString().slice(0, 10), r]),
  );

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = daysAgo(6 - i);
    const key = d.toISOString().slice(0, 10);
    const row = weekMap.get(key);
    return {
      day: key,
      pageViews: row?.pageViews ?? 0,
      visitors: row?.visitors ?? 0,
    };
  });

  return {
    todayViews: todayRow?.pageViews ?? 0,
    todayVisitors: todayRow?.visitors ?? 0,
    totalViews: totals._sum.pageViews ?? 0,
    totalVisitors: totals._sum.visitors ?? 0,
    last7,
  };
}

export async function recordPageHit(visitorId: string) {
  const day = utcDay();

  await prisma.siteTrafficDay.upsert({
    where: { day },
    create: { day, pageViews: 1, visitors: 0 },
    update: { pageViews: { increment: 1 } },
  });

  try {
    await prisma.siteVisitorDay.create({
      data: { day, visitorId },
    });
    await prisma.siteTrafficDay.update({
      where: { day },
      data: { visitors: { increment: 1 } },
    });
  } catch {
    // unique (day, visitorId) — already counted today
  }
}
