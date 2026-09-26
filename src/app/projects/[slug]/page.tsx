import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/web/hero";
import { SiteFooter } from "@/components/web/site-footer";
import { SiteShell } from "@/components/web/site-shell";
import { SmoothScroll } from "@/components/web/smooth-scroll";
import {
  ProjectHeroCopy,
  ProjectHeroReveal,
} from "@/components/web/project-hero-reveal";
import { ProjectServices } from "@/components/web/project-services";
import { ProjectMoreList } from "@/components/web/project-more-list";
import { ProjectSplitBands } from "@/components/web/project-split-band";
import {
  getOtherProjects,
  getPortfolioProjectBySlug,
  getPortfolioSlugsFromDb,
} from "@/lib/content";
import { usesRevealHero } from "@/lib/project-draft";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const slugs = await getPortfolioSlugsFromDb();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPortfolioProjectBySlug(slug);
  if (!project) return { title: "Project" };
  return {
    title: project.title,
    description: project.summary,
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = await getPortfolioProjectBySlug(slug);
  if (!project) notFound();

  const others = await getOtherProjects(slug, 3);
  const useReveal = usesRevealHero(project.media ?? null);
  const revealColor =
    project.media?.colorSrc ??
    project.media?.poster ??
    (project.media?.type === "image" ? project.media.src : undefined);
  const revealBw = project.media?.bwSrc;
  const bands = project.bands ?? [];

  const heroCopy = (
    <ProjectHeroCopy
      crumbHref="/#work"
      crumbLabel={project.title}
      title={project.title}
      titleIcon={project.titleIcon}
      role={project.role}
      thesisLead={project.thesisLead}
      thesisHighlight={project.thesisHighlight}
      thesisRest={project.thesisRest}
      thesisBody={project.thesisBody}
      meta={`${project.heroMetric} ${project.heroMetricLabel} · ${project.year}`}
    />
  );

  return (
    <SmoothScroll>
      <SiteShell>
        <SiteHeader />
        <main className={`project-page flex-1${useReveal ? " is-reveal" : " pt-12 md:pt-14"}`}>
          <div className="project-page-vgrid" aria-hidden />

          {useReveal ? (
            <ProjectHeroReveal
              colorSrc={revealColor!}
              bwSrc={revealBw!}
              poster={project.media?.poster}
              alt={`${project.title} visual`}
            >
              {heroCopy}
            </ProjectHeroReveal>
          ) : (
            <section className="project-intro">
              <div className="project-page-shell">{heroCopy}</div>
            </section>
          )}

          <ProjectSplitBands
            bands={bands.map((b) => ({
              title: b.title,
              body: b.body,
              media: b.media ?? null,
            }))}
          />

          <ProjectServices project={project} />

          {others.length > 0 ? (
            <section className="project-more" aria-label="More projects">
              <div className="project-page-shell">
                <p className="project-docs-list-head">More projects</p>
                <ProjectMoreList
                  projects={others.map((p) => ({
                    slug: p.slug,
                    title: p.title,
                    summary: p.summary,
                    year: p.year,
                    introSrc: p.introSrc,
                  }))}
                />
              </div>
            </section>
          ) : null}
        </main>
        <SiteFooter />
      </SiteShell>
    </SmoothScroll>
  );
}
