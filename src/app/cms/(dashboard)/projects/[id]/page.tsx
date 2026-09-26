import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCmsSession } from "@/lib/session";
import { ProjectDetailEditor } from "@/components/cms/project-detail-editor";
import { asHighlights, asMedia, asSections } from "@/lib/project-draft";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    select: { title: true },
  });
  return { title: project ? `Edit · ${project.title}` : "Project" };
}

export default async function CmsProjectDetailPage({ params }: Props) {
  await requireCmsSession();
  const { id } = await params;

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) notFound();

  return (
    <ProjectDetailEditor
      project={{
        id: project.id,
        slug: project.slug,
        title: project.title,
        summary: project.summary,
        description: project.description,
        year: project.year,
        role: project.role,
        coverImage: project.coverImage,
        introSrc: project.introSrc,
        titleIcon: project.titleIcon,
        thesisLead: project.thesisLead,
        thesisHighlight: project.thesisHighlight,
        thesisRest: project.thesisRest,
        thesisBody: project.thesisBody,
        heroMetric: project.heroMetric,
        heroMetricLabel: project.heroMetricLabel,
        heroTitle: project.heroTitle,
        heroBody: project.heroBody,
        media: asMedia(project.media),
        techStack: project.techStack,
        visibility: project.visibility,
        featured: project.featured,
        published: project.published,
        highlights: asHighlights(project.highlights),
        sections: asSections(project.sections),
      }}
    />
  );
}
