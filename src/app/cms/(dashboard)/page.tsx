import { requireAdmin } from "@/lib/require-admin";
import { OverviewDashboardClient } from "@/components/management/overview-dashboard-client";
import type { OverviewData } from "@/components/management/overview-dashboard";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

const EMPTY: OverviewData = {
  counts: {
    projects: 0,
    skills: 0,
    education: 0,
    work: 0,
    inquiries: 0,
    aboutLocales: 1,
    projectLocales: 1,
    published: 0,
    draft: 0,
    featured: 0,
    news: 0,
  },
  services: [],
  recentInquiries: [],
  ai: {
    totalCalls: 0,
    totalTokens: 0,
    totalCost: 0,
    periodLabel: "30 days",
    tokenLimit: null,
    usageByModel: [],
  },
  storage: {
    totalFiles: 0,
    totalSize: 0,
    ready: false,
    limitBytes: null,
    limitLabel: null,
  },
  traffic: {
    series: [],
    total: 0,
    changePct: null,
    paths: [],
    locales: [],
    peak: null,
  },
  inquiriesPulse: { series: [], total: 0, bySource: [] },
};

export default async function CmsHomePage() {
  const user = await requireAdmin();
  return (
    <OverviewDashboardClient
      user={{ username: user.username, email: user.email }}
      initial={EMPTY}
    />
  );
}
