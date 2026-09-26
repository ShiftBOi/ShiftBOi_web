import { SiteHeader, Hero } from "@/components/web/hero";
import { IconVelocityMarquee } from "@/components/web/icon-marquee";
import { SiteBody } from "@/components/web/site-body";
import { SmoothScroll } from "@/components/web/smooth-scroll";
import { SiteShell } from "@/components/web/site-shell";
import {
  getFeaturedProjects,
  getPublishedProjectBySlug,
  getSiteContent,
} from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [projects, site, artillery] = await Promise.all([
    getFeaturedProjects(24),
    getSiteContent(),
    getPublishedProjectBySlug("artillery-fdc"),
  ]);

  return (
    <SmoothScroll>
      <SiteShell>
        <SiteHeader />
        <main className="flex-1 pt-12 md:pt-14">
          <div className="flex min-h-[calc(100dvh-3rem)] flex-col md:min-h-[calc(100dvh-3.5rem)]">
            <Hero content={site.hero} />
            <IconVelocityMarquee />
          </div>

          <SiteBody projects={projects} site={site} spotlight={artillery} />
        </main>
      </SiteShell>
    </SmoothScroll>
  );
}
