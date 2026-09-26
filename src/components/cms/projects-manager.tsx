"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CmsProjectCard, type CmsProjectCardData } from "@/components/cms/project-card";
import { slugify } from "@/lib/project-draft";

type Stats = {
  total: number;
  published: number;
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
      <div className="cms-stat-strip">
        <div className="cms-stat-cell">
          <p className="cms-stat-label">Projects</p>
          <p className="cms-stat-value">{stats.total}</p>
        </div>
        <div className="cms-stat-cell">
          <p className="cms-stat-label">Published</p>
          <p className="cms-stat-value">{stats.published}</p>
        </div>
        <div className="cms-stat-cell">
          <p className="cms-stat-label">Featured</p>
          <p className="cms-stat-value">{stats.featured}</p>
        </div>
      </div>

      <div className="cms-section-head">
        <h2>All projects</h2>
        <button
          type="button"
          className="cms-btn cms-btn-primary cms-add-project-btn"
          onClick={() => {
            setError(null);
            setModalOpen(true);
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          Add project
        </button>
      </div>

      <div className="cms-pcard-grid">
        {projects.map((p) => (
          <CmsProjectCard key={p.id} project={p} />
        ))}
      </div>

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
