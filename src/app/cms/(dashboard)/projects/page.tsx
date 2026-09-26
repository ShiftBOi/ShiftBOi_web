import { prisma } from "@/lib/prisma";
import { requireCmsSession } from "@/lib/session";
import { ProjectsManager } from "@/components/cms/projects-manager";
import { asMedia } from "@/lib/project-draft";

export const metadata = { title: "Projects" };
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ view?: string }>;
};

export default async function CmsProjectsPage({ searchParams }: Props) {
  await requireCmsSession();
  const { view } = await searchParams;

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
  // Same criteria as public homepage Selected grid
  const featured = projects
    .filter(
      (p) => p.featured && p.published && p.visibility === "PUBLIC",
    )
    .sort(
      (a, b) =>
        a.sortOrder - b.sortOrder ||
        b.createdAt.getTime() - a.createdAt.getTime(),
    );

  return (
    <ProjectsManager
      initialView={view === "selected" ? "selected" : "all"}
      stats={{
        total: stats.total,
        published: stats.published,
        drafts: Math.max(0, stats.total - stats.published),
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
      featured={featured.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        summary: p.summary,
        coverImage: p.coverImage,
        introSrc: p.introSrc,
        media: asMedia(p.media),
        featured: p.featured,
        published: p.published,
        visibility: p.visibility,
        sortOrder: p.sortOrder,
      }))}
      pickerItems={projects.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        featured: p.featured,
        published: p.published,
        visibility: p.visibility,
      }))}
    />
  );
}
