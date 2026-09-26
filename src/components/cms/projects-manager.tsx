"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CmsProjectCard, type CmsProjectCardData } from "@/components/cms/project-card";
import { slugify } from "@/lib/project-draft";

type Stats = {
  total: number;
  published: number;
  drafts: number;
  featured: number;
};

export function ProjectsManager({
  projects,
  stats,
}: {
  projects: CmsProjectCardData[];
  stats: Stats;
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") || "");
    const slug = String(form.get("slug") || slugify(title));

    startTransition(async () => {
      const res = await fetch("/api/cms/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          summary: form.get("summary"),
          description: form.get("description") || form.get("summary"),
          year: form.get("year") || null,
          published: form.get("published") === "on",
          featured: form.get("featured") === "on",
          visibility: form.get("visibility") || "PUBLIC",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to create project.");
        return;
      }

      const data = await res.json().catch(() => ({}));
      setModalOpen(false);
      router.refresh();
      if (data.project?.id) {
        router.push(`/cms/projects/${data.project.id}`);
      }
    });
  }

  return (
    <div className="cms-projects-page">
      <section className="cms-dash-metrics" aria-label="Project snapshot">
        <div className="cms-dash-metric">
          <p className="cms-dash-metric-label">Projects</p>
          <p className="cms-dash-metric-value">{stats.total}</p>
          <p className="cms-dash-metric-meta">in library</p>
        </div>
        <div className="cms-dash-metric">
          <p className="cms-dash-metric-label">Published</p>
          <p className="cms-dash-metric-value">{stats.published}</p>
          <p className="cms-dash-metric-meta">live on site</p>
        </div>
        <div className="cms-dash-metric">
          <p className="cms-dash-metric-label">Drafts</p>
          <p className="cms-dash-metric-value">{stats.drafts}</p>
          <p className="cms-dash-metric-meta">not published</p>
        </div>
        <div className="cms-dash-metric">
          <p className="cms-dash-metric-label">Featured</p>
          <p className="cms-dash-metric-value">{stats.featured}</p>
          <p className="cms-dash-metric-meta">homepage</p>
        </div>
      </section>

      <section className="cms-dash-panel">
        <div className="cms-dash-panel-head">
          <div>
            <p className="cms-dash-kicker">Library</p>
            <h2 className="cms-dash-heading">All projects</h2>
          </div>
          <button
            type="button"
            className="cms-dash-action is-primary"
            onClick={() => {
              setError(null);
              setModalOpen(true);
            }}
          >
            + Add project
          </button>
        </div>

        {projects.length > 0 ? (
          <ul className="cms-plist">
            {projects.map((p) => (
              <CmsProjectCard key={p.id} project={p} />
            ))}
          </ul>
        ) : (
          <p className="cms-dash-empty">No projects yet — add one to get started.</p>
        )}
      </section>

      {modalOpen ? (
        <div className="cms-modal-backdrop" onClick={() => !pending && setModalOpen(false)}>
          <div
            className="cms-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cms-add-project-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cms-modal-head">
              <h2 id="cms-add-project-title">Add project</h2>
              <button
                type="button"
                className="cms-sidebar-icon-btn"
                onClick={() => setModalOpen(false)}
                disabled={pending}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <form onSubmit={onCreate} className="cms-create-form">
              <div className="cms-form-grid is-2">
                <label className="cms-field">
                  <span>Title</span>
                  <input name="title" required />
                </label>
                <label className="cms-field">
                  <span>Slug</span>
                  <input name="slug" placeholder="auto-from-title" />
                </label>
                <label className="cms-field" style={{ gridColumn: "1 / -1" }}>
                  <span>Intro summary</span>
                  <input name="summary" required />
                </label>
                <label className="cms-field" style={{ gridColumn: "1 / -1" }}>
                  <span>Description</span>
                  <textarea name="description" rows={3} />
                </label>
                <label className="cms-field">
                  <span>Year</span>
                  <input name="year" />
                </label>
                <label className="cms-field">
                  <span>Visibility</span>
                  <select name="visibility" defaultValue="PUBLIC">
                    <option value="PUBLIC">Selected · detail page</option>
                    <option value="CONFIDENTIAL">Limited · teaser</option>
                  </select>
                </label>
                <label className="cms-check">
                  <input type="checkbox" name="published" />
                  Published
                </label>
                <label className="cms-check">
                  <input type="checkbox" name="featured" />
                  Featured on homepage
                </label>
              </div>
              {error ? <p className="cms-error">{error}</p> : null}
              <div className="cms-modal-actions">
                <button
                  type="button"
                  className="cms-btn cms-btn-ghost"
                  disabled={pending}
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="cms-btn cms-btn-primary" disabled={pending}>
                  {pending ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
