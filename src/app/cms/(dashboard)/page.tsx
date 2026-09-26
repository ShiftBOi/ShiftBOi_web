import { getTrafficSummary } from "@/lib/analytics";
import { prisma } from "@/lib/prisma";
import { requireCmsSession } from "@/lib/session";
import { CmsDashboard } from "@/components/cms/dashboard";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function CmsHomePage() {
  await requireCmsSession();

  const [traffic, counts] = await Promise.all([
    getTrafficSummary(),
    prisma.$queryRaw<{ total: number; published: number; featured: number }[]>`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE published)::int AS published,
        COUNT(*) FILTER (WHERE featured)::int AS featured
      FROM project
    `,
  ]);

  const projects = counts[0] ?? { total: 0, published: 0, featured: 0 };

  return <CmsDashboard traffic={traffic} projects={projects} />;
}
