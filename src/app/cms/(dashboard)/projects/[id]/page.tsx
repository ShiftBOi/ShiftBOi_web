import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCmsSession } from "@/lib/session";
import { ProjectDetailEditor } from "@/components/cms/project-detail-editor";
import {
  asMedia,
  resolveBands,
  resolveDetails,
  splitDetails,
} from "@/lib/project-draft";

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

  const media = asMedia(project.media);
  const details = resolveDetails({
    details: project.details,
    highlights: project.highlights,
    sections: project.sections,
  });
  const split = splitDetails(details);

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
        media,
        bands: resolveBands({
          bands: project.bands,
          media,
          heroTitle: project.heroTitle,
          heroBody: project.heroBody,
        }),
        details,
        techStack: project.techStack,
        visibility: project.visibility,
        featured: project.featured,
        published: project.published,
        highlights: split.highlights,
        sections: split.sections,
      }}
    />
  );
}
