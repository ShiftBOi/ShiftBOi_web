import { AiUsageReport } from "@/components/management/ai-usage-report";
import {
  ContentPulse,
  InquirySparkCard,
  LocaleDonut,
  PathLollipops,
  StatusHeatmap,
  StorageRingCard,
  TrafficRangeChart,
} from "@/components/management/dashboard-charts";
import Link from "next/link";

export type OverviewData = {
  counts: {
    projects: number;
    skills: number;
    education: number;
    work: number;
    inquiries: number;
    aboutLocales: number;
    projectLocales: number;
    published: number;
    draft: number;
    featured: number;
    news: number;
  };
  services: Array<{
    name: string;
    status: "online" | "offline" | "degraded";
    detail: string;
  }>;
  recentInquiries: Array<{
    id: number;
    email: string;
    name: string | null;
    source: string;
    createdAt: string;
  }>;
  ai?: {
    totalCalls: number;
    totalTokens: number;
    totalCost: number;
    avgLatency?: number;
    periodLabel: string;
    tokenLimit: number | null;
    usageByModel?: Array<{
      model: string;
      calls: number;
      tokens: number;
      cost: number;
    }>;
    change?: {
      tokens: number | null;
      calls: number | null;
      cost: number | null;
    };
    previous?: {
      tokens: number;
      calls: number;
      cost: number;
    };
  };
  storage?: {
    totalFiles: number;
    totalSize: number;
    ready: boolean;
    limitBytes: number | null;
    limitLabel: string | null;
  } | null;
  traffic?: {
    series: Array<{ day: string; date: string; visitors: number }>;
    total: number;
    changePct: number | null;
    paths: Array<{ path: string; label: string; count: number }>;
    locales: Array<{ locale: string; count: number }>;
    peak: { date: string; day: string; visitors: number } | null;
  } | null;
  inquiriesPulse?: {
    series: Array<{ day: string; date: string; visitors: number }>;
    total: number;
    bySource: Array<{ source: string; count: number }>;
  } | null;
};

export function OverviewDashboard({
  user,
  overview,
}: {
  user: { username: string; email: string };
  overview: OverviewData;
}) {
  const ai = overview.ai;
  const storage = overview.storage;
  const traffic = overview.traffic;
  const inquiries = overview.inquiriesPulse;
  const c = overview.counts;

  return (
    <div className="cms-dash">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="cms-eyebrow">Dashboard</p>
          <h1 className="cms-title">Welcome back, {user.username}</h1>
          <p className="cms-subtitle">
            Live metrics · signed in as {user.email}
          </p>
        </div>
        <Link href="/" className="cms-btn cms-btn--primary">
          Open public site
        </Link>
      </div>

      <section className="cms-panel cms-dash-hero mt-8">
        {traffic ? (
          <TrafficRangeChart
            series={traffic.series}
            total={traffic.total}
            changePct={traffic.changePct}
            peak={traffic.peak}
          />
        ) : (
          <div className="cms-dash-traffic cms-dash-traffic--loading">
            <h2 className="cms-dash-traffic__title">Website traffic</h2>
            <p className="cms-dash-traffic__desc">Loading visits…</p>
          </div>
        )}
      </section>

      <section className="cms-dash-bento mt-4">
        {ai ? (
          <AiUsageReport
            className="cms-dash-card cms-dash-ai-report"
            compact
            summary={{
              totalCalls: ai.totalCalls,
              totalTokens: ai.totalTokens,
              totalCost: ai.totalCost,
              avgLatency: ai.avgLatency,
              change: ai.change,
              previous: ai.previous,
            }}
            usageByModel={ai.usageByModel ?? []}
            tokenLimit={ai.tokenLimit}
            periodLabel={ai.periodLabel}
          />
        ) : (
          <div className="cms-dash-card">
            <h3 className="cms-dash-card__title">AI usage</h3>
            <p className="cms-dash-empty">Loading…</p>
          </div>
        )}

        {storage ? (
          <StorageRingCard
            totalSize={storage.totalSize}
            totalFiles={storage.totalFiles}
            limitBytes={storage.limitBytes}
            ready={storage.ready}
          />
        ) : (
          <div className="cms-dash-card">
            <h3 className="cms-dash-card__title">R2 storage</h3>
            <p className="cms-dash-empty">Loading…</p>
          </div>
        )}

        {inquiries ? (
          <InquirySparkCard
            series={inquiries.series}
            total={inquiries.total}
            bySource={inquiries.bySource}
          />
        ) : (
          <InquirySparkCard series={[]} total={c.inquiries} bySource={[]} />
        )}

        <PathLollipops
          paths={traffic?.paths ?? []}
          total={traffic?.total ?? 0}
        />

        <LocaleDonut locales={traffic?.locales ?? []} />

        <ContentPulse
          published={c.published}
          draft={c.draft}
          featured={c.featured}
          news={c.news}
          skills={c.skills}
        />

        <StatusHeatmap services={overview.services} />

        <div className="cms-dash-card cms-dash-inbox">
          <header className="cms-dash-card__head">
            <h3 className="cms-dash-card__title">Recent inquiries</h3>
            <Link href="/cms/inquiries" className="cms-dash-card__link">
              View all
            </Link>
          </header>
          {overview.recentInquiries.length === 0 ? (
            <p className="cms-dash-empty">No inquiries yet.</p>
          ) : (
            <ul className="cms-dash-inbox__list">
              {overview.recentInquiries.map((item) => (
                <li key={item.id}>
                  <p className="cms-dash-inbox__email">{item.email}</p>
                  <p className="cms-dash-inbox__meta">
                    {item.name || "Anonymous"} · {item.source} ·{" "}
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
