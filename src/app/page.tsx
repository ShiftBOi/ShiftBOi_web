import { prisma } from "@/lib/prisma";
import { SiteHeader, Hero } from "@/components/web/hero";
import { IconVelocityMarquee } from "@/components/web/icon-marquee";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const projects = await prisma.project.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: 6,
  });

  return (
    <main className="flex-1">
      <SiteHeader />
      <Hero />
      <IconVelocityMarquee />

      <section
        id="architecture"
        className="border-t border-[var(--color-border-subtle)] px-5 py-20 md:px-10"
      >
        <p className="text-[length:var(--font-size-sm)] uppercase tracking-[0.16em] text-[var(--color-text-tertiary)]">
          Architecture
        </p>
        <h2 className="mt-3 max-w-2xl text-[length:var(--font-size-4xl)] tracking-tight text-white">
          One Next.js app. Web + CMS + API. Postgres via Prisma.
        </h2>
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            ["Web", "Public marketing surface at / with HydraDB design tokens."],
            ["CMS", "Admin console at /cms — OTP and passkey only."],
            ["Backend", "Route handlers + Prisma models for projects and auth."],
          ].map(([title, body]) => (
            <li key={title} className="border-t border-[var(--color-border-default)] pt-4">
              <h3 className="text-[length:var(--font-size-2xl)] text-white">{title}</h3>
              <p className="mt-2 text-[length:var(--font-size-lg)] leading-relaxed text-[var(--color-text-secondary)]">
                {body}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section
        id="work"
        className="border-t border-[var(--color-border-subtle)] px-5 py-20 md:px-10"
      >
        <p className="text-[length:var(--font-size-sm)] uppercase tracking-[0.16em] text-[var(--color-text-tertiary)]">
          Work
        </p>
        <h2 className="mt-3 text-[length:var(--font-size-4xl)] tracking-tight text-white">
          Published projects
        </h2>
        {projects.length === 0 ? (
          <p className="mt-8 max-w-lg text-[length:var(--font-size-xl)] text-[var(--color-text-secondary)]">
            No published projects yet. Sign in to the CMS to add the first one.
          </p>
        ) : (
          <ul className="mt-10 grid gap-8 md:grid-cols-2">
            {projects.map((project) => (
              <li
                key={project.id}
                className="border-t border-[var(--color-border-default)] pt-5"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-[length:var(--font-size-3xl)] tracking-tight text-white">
                    {project.title}
                  </h3>
                  {project.year ? (
                    <span className="text-[length:var(--font-size-md)] text-[var(--color-text-tertiary)]">
                      {project.year}
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 text-[length:var(--font-size-lg)] leading-relaxed text-[var(--color-text-secondary)]">
                  {project.summary}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        id="contact"
        className="border-t border-[var(--color-border-subtle)] px-5 py-20 md:px-10"
      >
        <h2 className="text-[length:var(--font-size-4xl)] tracking-tight text-white">
          Contact
        </h2>
        <p className="mt-4 max-w-lg text-[length:var(--font-size-xl)] text-[var(--color-text-secondary)]">
          CMS access is restricted to the allowlisted admin email via OTP or
          passkey — no password login.
        </p>
      </section>

      <footer className="border-t border-[var(--color-border-subtle)] px-5 py-8 text-[length:var(--font-size-sm)] text-[var(--color-text-tertiary)] md:px-10">
        WebPort v2 · design tokens from Design.md · reference hydradb.com
      </footer>
    </main>
  );
}
