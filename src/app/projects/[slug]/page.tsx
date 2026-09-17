import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { SiteHeader } from "@/components/web/hero";
import { SiteFooter } from "@/components/web/site-footer";
import { SiteShell } from "@/components/web/site-shell";
import { SmoothScroll } from "@/components/web/smooth-scroll";
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
          <div className="project-page-rule" aria-hidden />

          <div className="hydra-container project-page-inner">
            <p className="project-page-crumb">
              <Link href="/#features">Selected Projects</Link>
              <span aria-hidden> / </span>
              <span>{project.title}</span>
            </p>

            <div className="project-page-heading">
              <h1 className="project-page-title">{project.title}</h1>
              <p className="project-page-role">{project.role}</p>
            </div>

            <section className="project-thesis" aria-labelledby="project-thesis-heading">
              <p id="project-thesis-heading" className="project-thesis-label">
                The Overview
              </p>
              <h2 className="project-thesis-lead">
                {project.thesisLead}{" "}
                <span className="project-thesis-accent">{project.thesisHighlight}</span>{" "}
                {project.thesisRest}
              </h2>
              <p className="project-thesis-body">{project.thesisBody}</p>
            </section>

            <article className="project-bench-card">
              <div className="project-bench-media">
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
                  <div className="project-bench-media-fallback" aria-hidden />
                )}
              </div>
              <div className="project-bench-copy">
                <div className="project-bench-meta">
                  <div>
                    <p className="project-bench-metric">{project.heroMetric}</p>
                    <p className="project-bench-metric-label">{project.heroMetricLabel}</p>
                  </div>
                  <p className="project-bench-date">{project.year}</p>
                </div>
                <h3 className="project-bench-title">{project.heroTitle}</h3>
                <p className="project-bench-body">{project.heroBody}</p>
              </div>
            </article>

            {project.highlights.map((item) => (
              <article key={item.title} className="project-bench-card is-compact">
                <div className="project-bench-stat">
                  <p className="project-bench-metric">{item.metric}</p>
                  <p className="project-bench-metric-label">{item.label}</p>
                </div>
                <div className="project-bench-copy">
                  <h3 className="project-bench-title">{item.title}</h3>
                  <p className="project-bench-body">{item.body}</p>
                </div>
              </article>
            ))}

            <div className="project-longform">
              {project.sections.map((section) => (
                <section key={section.title} className="project-section">
                  <p className="project-thesis-label">{section.label}</p>
                  <h2 className="project-section-title">{section.title}</h2>
                  {section.paragraphs.map((p) => (
                    <p key={p.slice(0, 48)} className="project-section-body">
                      {p}
                    </p>
                  ))}
                  {section.bullets && section.bullets.length > 0 ? (
                    <ul className="project-section-bullets">
                      {section.bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}
            </div>

            <section className="project-stack" aria-label="Tech stack">
              <p className="project-thesis-label">Stack</p>
              <ul className="project-stack-list">
                {project.stack.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            {others.length > 0 ? (
              <section className="project-more" aria-label="More projects">
                <p className="project-thesis-label">More projects</p>
                <ul className="project-more-list">
                  {others.map((p) => (
                    <li key={p.slug}>
                      <Link href={`/projects/${p.slug}`} className="project-more-link">
                        <span>{p.title}</span>
                        <span aria-hidden>→</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </main>
        <SiteFooter />
      </SiteShell>
    </SmoothScroll>
  );
}
