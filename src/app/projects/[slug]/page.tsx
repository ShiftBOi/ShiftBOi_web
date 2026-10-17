import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/web/hero";
import { SiteFooter } from "@/components/web/site-footer";
import { SiteShell } from "@/components/web/site-shell";
import { SmoothScroll } from "@/components/web/smooth-scroll";
import { CaseStudyPage } from "@/components/web/case-study/case-study-page";
import { ProjectMoreList } from "@/components/web/project-more-list";
import {
  getOtherProjects,
  getPortfolioProjectBySlug,
  getPortfolioSlugsFromDb,
} from "@/lib/content";
import { resolveCaseStudy } from "@/lib/case-study";

type Props = { params: Promise<{ slug: string }> };

/** Fresh enough for CMS edits without blocking every request as fully dynamic. */
export const revalidate = 60;

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
  const [project, others] = await Promise.all([
    getPortfolioProjectBySlug(slug),
    getOtherProjects(slug, 3),
  ]);
  if (!project) notFound();

  const study = resolveCaseStudy(project);

  return (
    <SmoothScroll>
      <SiteShell>
        <SiteHeader />
        <main className="project-page is-case-study flex-1">
          <CaseStudyPage
            study={study}
            moreSlot={
              others.length > 0 ? (
                <section className="project-more" aria-label="More projects">
                  <div className="cs-shell">
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
              ) : null
            }
          />
        </main>
        <SiteFooter />
      </SiteShell>
    </SmoothScroll>
  );
}
