import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "CMS",
};

type ProjectStats = {
  total: number;
  published: number;
  selected: number;
  limited: number;
};

export default async function CmsHomePage() {
  const [statRows, passkeyCount] = await Promise.all([
    prisma.$queryRaw<ProjectStats[]>`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE published)::int AS published,
        COUNT(*) FILTER (WHERE visibility = 'PUBLIC')::int AS selected,
        COUNT(*) FILTER (WHERE visibility = 'CONFIDENTIAL')::int AS limited
      FROM project
    `,
    prisma.passkey.count(),
  ]);

  const stats = statRows[0] ?? {
    total: 0,
    published: 0,
    selected: 0,
    limited: 0,
  };

  return (
    <div>
      <h1 className="cms-page-title">Overview</h1>
      <p className="cms-page-lead">
        Manage portfolio projects for the public site. Selected projects fill the
        2-column grid with full case-study pages. Limited projects sit below the
        purple divider as one full-width row each.
      </p>

      <dl className="cms-stat-grid">
        <div className="cms-stat-card is-blue">
          <dt className="cms-stat-label">Projects</dt>
          <dd className="cms-stat-value">{stats.total}</dd>
          <p className="cms-stat-hint">{stats.published} published</p>
        </div>
        <div className="cms-stat-card is-violet">
          <dt className="cms-stat-label">Selected · 2-col</dt>
          <dd className="cms-stat-value">{stats.selected}</dd>
          <p className="cms-stat-hint">Public detail pages</p>
        </div>
        <div className="cms-stat-card is-pink">
          <dt className="cms-stat-label">Limited · 1-row</dt>
          <dd className="cms-stat-value">{stats.limited}</dd>
          <p className="cms-stat-hint">Teaser only · {passkeyCount} passkeys</p>
        </div>
      </dl>

      <div className="cms-panel">
        <h2 className="cms-panel-title">Homepage layout rules</h2>
        <p className="cms-panel-lead">
          Adding projects from CMS grows the homepage grids automatically.
        </p>
        <div className="cms-layout-legend">
          <div className="cms-legend-card">
            <h3>Selected Projects</h3>
            <p>
              Disclosable work with a readable case-study page. Cards pair into
              two columns — new projects append left→right, then wrap to the next
              row.
            </p>
            <div className="cms-legend-grid" aria-hidden>
              <div className="cms-legend-cell" />
              <div className="cms-legend-cell" />
              <div className="cms-legend-cell" />
              <div className="cms-legend-cell" />
            </div>
          </div>
          <div className="cms-legend-card">
            <h3>Limited / confidential</h3>
            <p>
              Below the triple purple rule (Artillery-style). One full-width box
              per horizontal row — no deep public write-up.
            </p>
            <div className="cms-legend-row" aria-hidden />
            <div className="cms-legend-row" aria-hidden />
          </div>
        </div>
      </div>

      <div className="cms-actions">
        <Link href="/cms/projects" className="cms-btn cms-btn-primary">
          Manage projects
        </Link>
        <Link href="/cms/settings" className="cms-btn cms-btn-ghost">
          Register passkey
        </Link>
      </div>
    </div>
  );
}
