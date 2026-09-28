import { SiteHeader, Hero } from "@/components/web/hero";
import { IconVelocityMarquee } from "@/components/web/icon-marquee";
import { SiteBody } from "@/components/web/site-body";
import { SmoothScroll } from "@/components/web/smooth-scroll";
import { SiteShell } from "@/components/web/site-shell";
import {
  getFeaturedProjects,
  getSecretProjects,
  getSiteContent,
} from "@/lib/content";
import { asMedia } from "@/lib/project-draft";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [projectRows, secrets, site] = await Promise.all([
    getFeaturedProjects(24),
    getSecretProjects(12),
    getSiteContent(),
  ]);

  const projects = projectRows.map((row) => ({
    ...row,
    media: asMedia(row.media),
  }));

  return (
    <SmoothScroll>
      <SiteShell>
        <SiteHeader />
        <main className="flex-1 pt-12 md:pt-14">
          {/* svh locks first screen on iOS — dvh grows when the URL bar hides and stretches the dino lane */}
          <div className="hero-lock flex h-[calc(100svh-3rem)] max-h-[calc(100svh-3rem)] flex-col overflow-hidden md:h-auto md:max-h-none md:min-h-[calc(100dvh-3.5rem)]">
            <Hero content={site.hero} />
          </div>
          <IconVelocityMarquee />

          <SiteBody projects={projects} site={site} secrets={secrets} />
        </main>
      </SiteShell>
    </SmoothScroll>
  );
}
