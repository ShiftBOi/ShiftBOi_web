import { prisma } from "@/lib/prisma";
import { ProjectCreateForm, ProjectList } from "@/components/cms/projects";

export const metadata = {
  title: "Projects",
};

export default async function CmsProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <h1 className="text-[length:var(--font-size-4xl)] tracking-tight">Projects</h1>
      <p className="mt-3 text-[length:var(--font-size-lg)] text-[var(--color-text-inverse)]">
        Create and publish portfolio entries shown on the marketing site.
      </p>
      <ProjectList projects={projects} />
      <ProjectCreateForm />
    </div>
  );
}
