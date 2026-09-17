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
  const [firstSection, ...restSections] = project.sections;

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
                      width={64}
                      height={64}
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

          {firstSection ? (
            <section className="project-band">
              <div className="project-page-shell">
                <div className="project-split">
                  <div>
                    <p className="project-eyebrow">{firstSection.label}</p>
                    <h2 className="project-block-title is-lg">{firstSection.title}</h2>
                  </div>
                  <div>
                    {firstSection.paragraphs.map((p) => (
                      <p key={p.slice(0, 48)} className="project-block-body is-loose">
                        {p}
                      </p>
                    ))}
                    {firstSection.bullets?.length ? (
                      <ul className="project-bullets">
                        {firstSection.bullets.map((b) => (
                          <li key={b}>{b}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          <section className="project-band project-band-flush" aria-label="Highlights">
            <div className="project-cells">
              {project.highlights.map((item) => (
                <article key={item.title} className="project-cell">
                  <p className="project-metric">{item.metric}</p>
                  <p className="project-metric-label">{item.label}</p>
                  <h3 className="project-block-title">{item.title}</h3>
                  <p className="project-block-body">{item.body}</p>
                </article>
              ))}
            </div>
          </section>

          {restSections.map((section) => (
            <section key={section.title} className="project-band">
              <div className="project-page-shell">
                <div className="project-split">
                  <div>
                    <p className="project-eyebrow">{section.label}</p>
                    <h2 className="project-block-title is-lg">{section.title}</h2>
                  </div>
                  <div>
                    {section.paragraphs.map((p) => (
                      <p key={p.slice(0, 48)} className="project-block-body is-loose">
                        {p}
                      </p>
                    ))}
                    {section.bullets?.length ? (
                      <ul className="project-bullets">
                        {section.bullets.map((b) => (
                          <li key={b}>{b}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>
          ))}

          <section className="project-band" aria-label="Tech stack">
            <div className="project-page-shell">
              <div className="project-split">
                <div>
                  <p className="project-eyebrow">Stack</p>
                  <h2 className="project-block-title is-lg">Tools behind the build</h2>
                </div>
                <ul className="project-stack-line">
                  {project.stack.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {others.length > 0 ? (
            <section className="project-band project-band-flush" aria-label="More projects">
              <div className="project-page-shell project-more-head">
                <p className="project-eyebrow">More projects</p>
              </div>
              <div className="project-cells project-cells-more">
                {others.map((p) => (
                  <Link key={p.slug} href={`/projects/${p.slug}`} className="project-cell is-link">
                    <span className="project-block-title">{p.title}</span>
                    <span className="project-block-body">{p.summary}</span>
                    <span className="project-cell-go" aria-hidden>
                      →
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </main>
        <SiteFooter />
      </SiteShell>
    </SmoothScroll>
  );
}
