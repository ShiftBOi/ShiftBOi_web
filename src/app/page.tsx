import { prisma } from "@/lib/prisma";
import { SiteHeader, Hero } from "@/components/web/hero";
import { IconVelocityMarquee } from "@/components/web/icon-marquee";
import { SiteBody } from "@/components/web/site-body";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const projects = await prisma.project.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: 6,
  });

  return (
    <main className="flex-1">
      {/* First viewport: navbar + hero + velocity strip */}
      <div className="flex min-h-dvh flex-col">
        <SiteHeader />
        <Hero />
        <IconVelocityMarquee />
      </div>

      <SiteBody projects={projects} />
    </main>
  );
}
