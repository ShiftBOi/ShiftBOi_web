import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { SiteHeader } from "@/components/web/hero";
import { SiteFooter } from "@/components/web/site-footer";
import { SiteShell } from "@/components/web/site-shell";
import { SmoothScroll } from "@/components/web/smooth-scroll";
import { ProjectDocs } from "@/components/web/project-docs";
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

  return (
    <SmoothScroll>
      <SiteShell>
        <SiteHeader />
        <main className="project-page flex-1 pt-12 md:pt-14">
          <div className="project-page-vgrid" aria-hidden />

          <div className="project-page-top">
            <div className="project-page-shell">
              <p className="project-page-crumb">
                <Link href="/#features">Selected Projects</Link>
                <span aria-hidden> / </span>
                <span>{project.title}</span>
              </p>

              <header className="project-page-heading">
                <h1
                  className={`project-page-title${project.titleIcon ? " has-icon" : ""}`}
                >
                  {project.titleIcon ? (
                    <Image
                      src={project.titleIcon}
                      alt=""
                      width={88}
                      height={88}
                      unoptimized
                      className="project-page-title-icon"
                    />
                  ) : null}
                  <span className="project-page-title-text">{project.title}</span>
                </h1>
                <p className="project-page-role">{project.role}</p>
              </header>
            </div>
          </div>

          <section className="project-band project-band-thesis">
            <div className="project-page-shell">
              <p className="project-eyebrow">{"// The Overview //"}</p>
              <div className="project-split">
                <h2 className="project-thesis-lead">
                  {project.thesisLead}{" "}
                  <span className="project-thesis-accent">{project.thesisHighlight}</span>{" "}
                  {project.thesisRest}
                </h2>
                <p className="project-thesis-body">{project.thesisBody}</p>
              </div>
            </div>
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
                  <div className="project-hero-meta">
                    <div>
                      <p className="project-metric">{project.heroMetric}</p>
                      <p className="project-metric-label">{project.heroMetricLabel}</p>
                    </div>
                    <p className="project-year">{project.year}</p>
                  </div>
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

          <ProjectDocs project={project} />

          {others.length > 0 ? (
            <section className="project-more" aria-label="More projects">
              <div className="project-page-shell">
                <p className="project-docs-list-head">More projects</p>
                <ul className="project-docs-list project-more-list">
                  {others.map((p) => (
                    <li key={p.slug} className="project-docs-row">
                      <Link href={`/projects/${p.slug}`} className="project-docs-row-hit is-link">
                        <span className="project-docs-row-date">{p.year}</span>
                        <span className="project-docs-row-center">
                          <span className="project-docs-badges">
                            <span className="project-docs-badge is-fill">Project</span>
                            <span className="project-docs-badge is-outline">{p.role}</span>
                          </span>
                          <span className="project-docs-row-title">{p.title}</span>
                          <span className="project-docs-row-sub">{p.summary}</span>
                        </span>
                        <span className="project-docs-row-mins" aria-hidden>
                          →
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ) : null}
        </main>
        <SiteFooter />
      </SiteShell>
    </SmoothScroll>
  );
}
