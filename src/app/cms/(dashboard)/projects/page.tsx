import { prisma } from "@/lib/prisma";
import { requireCmsSession } from "@/lib/session";
import { ProjectsManager } from "@/components/cms/projects-manager";

export const metadata = { title: "Projects" };
export const dynamic = "force-dynamic";

export default async function CmsProjectsPage() {
  await requireCmsSession();

  const [projects, counts] = await Promise.all([
    prisma.project.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    prisma.$queryRaw<{ total: number; published: number; featured: number }[]>`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE published)::int AS published,
        COUNT(*) FILTER (WHERE featured)::int AS featured
      FROM project
    `,
  ]);

  const stats = counts[0] ?? { total: 0, published: 0, featured: 0 };

  return (
    <ProjectsManager
      stats={{
        total: stats.total,
        published: stats.published,
        featured: stats.featured,
      }}
      projects={projects.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        summary: p.summary,
        description: p.description,
        year: p.year,
        coverImage: p.coverImage,
        introSrc: p.introSrc,
        visibility: p.visibility,
        featured: p.featured,
        published: p.published,
      }))}
    />
  );
}
