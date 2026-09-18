import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
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
import {
  getPortfolioProject,
  getPortfolioSlugs,
  PORTFOLIO_PROJECTS,
} from "@/lib/portfolio-projects";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getPortfolioSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = getPortfolioProject(slug);
  if (!project) return { title: "Project" };
  return {
    title: project.title,
    description: project.summary,
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = getPortfolioProject(slug);
  if (!project) notFound();

  const others = PORTFOLIO_PROJECTS.filter((p) => p.slug !== project.slug).slice(0, 3);
  const revealColor =
    project.media?.colorSrc ??
    project.media?.poster ??
    (project.media?.type === "image" ? project.media.src : undefined);
  const revealBw = project.media?.bwSrc;
  const useReveal = Boolean(revealColor && revealBw);

  const heroCopy = (
    <ProjectHeroCopy
      crumbHref="/#features"
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
            <>
              <section className="project-intro">
                <div className="project-page-shell">{heroCopy}</div>
              </section>
              <section className="project-band project-band-hero">
                <div className="project-page-shell">
                  <div className="project-split project-split-hero">
                    <div className="project-media">
                      {project.media?.type === "video" ? (
                        <video
                          src={project.media.src}
                          poster={project.media.poster}
                          autoPlay
                          loop
                          muted
                          playsInline
                          preload="metadata"
                          aria-label={`${project.title} demo`}
                        />
                      ) : project.media?.type === "image" ? (
                        <Image
                          src={project.media.src}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="(max-width:900px) 100vw, 55vw"
                        />
                      ) : (
                        <div className="project-media-fallback" aria-hidden />
                      )}
                    </div>
                    <div className="project-hero-copy">
                      <h3 className="project-block-title">{project.heroTitle}</h3>
                      <p className="project-block-body">{project.heroBody}</p>
                      {project.download ? (
                        <a
                          href={project.download.href}
                          className="project-download"
                          rel="noopener"
                        >
                          {project.download.label}
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

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
