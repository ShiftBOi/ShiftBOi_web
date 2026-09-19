import { prisma } from "@/lib/prisma";
import { ProjectCreateForm, ProjectList, type ProjectRow } from "@/components/cms/projects";

export const metadata = {
  title: "Projects",
};

export default async function CmsProjectsPage() {
  const projects = await prisma.$queryRaw<ProjectRow[]>`
    SELECT
      id,
      slug,
      title,
      summary,
      published,
      year,
      visibility::text AS visibility
    FROM project
    ORDER BY "sortOrder" ASC, "createdAt" DESC
  `;

  return (
    <div>
      <h1 className="cms-page-title">Projects</h1>
      <p className="cms-page-lead">
        Selected projects appear in the homepage 2-column grid and get a public
        case-study page. Limited projects appear as one full-width box per row
        under the purple divider.
      </p>

      <div className="cms-panel" style={{ marginBottom: "1rem" }}>
        <h2 className="cms-panel-title">All projects</h2>
        <p className="cms-panel-lead" style={{ marginBottom: "1rem" }}>
          Gradient cards: violet/cyan = Selected, pink/amber = Limited.
        </p>
        <ProjectList projects={projects} />
      </div>

      <ProjectCreateForm />
    </div>
  );
}
