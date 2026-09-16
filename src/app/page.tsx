import { prisma } from "@/lib/prisma";
import { SiteHeader, Hero } from "@/components/web/hero";
import { IconVelocityMarquee } from "@/components/web/icon-marquee";
import { SiteBody } from "@/components/web/site-body";
import { SmoothScroll } from "@/components/web/smooth-scroll";
import { SiteShell } from "@/components/web/site-shell";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const projects = await prisma.project.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: 6,
  });

  return (
    <SmoothScroll>
      <SiteShell>
        <SiteHeader />
        <main className="flex-1 pt-12 md:pt-14">
          <div className="flex min-h-[calc(100dvh-3rem)] flex-col md:min-h-[calc(100dvh-3.5rem)]">
            <Hero />
            <IconVelocityMarquee />
          </div>

          <SiteBody projects={projects} />
        </main>
      </SiteShell>
    </SmoothScroll>
  );
}
