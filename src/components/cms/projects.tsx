"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export type ProjectRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  published: boolean;
  year: string | null;
  visibility: "PUBLIC" | "CONFIDENTIAL";
};

export function ProjectCreateForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);

    startTransition(async () => {
      const res = await fetch("/api/cms/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.get("title"),
          slug: form.get("slug"),
          summary: form.get("summary"),
          description: form.get("description"),
          year: form.get("year") || null,
          published: form.get("published") === "on",
          visibility: form.get("visibility") || "PUBLIC",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to create project.");
        return;
      }

      event.currentTarget.reset();
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="cms-panel">
      <h2 className="cms-panel-title">New project</h2>
      <p className="cms-panel-lead">
        Choose Selected for the 2-column public grid, or Limited for a
        single-row teaser under the purple divider.
      </p>

      <div className="cms-form-grid is-2">
        {(
          [
            ["title", "Title", "text"],
            ["slug", "Slug", "text"],
            ["summary", "Summary", "text"],
            ["year", "Year", "text"],
          ] as const
        ).map(([name, label, type]) => (
          <label key={name} className="cms-field">
            <span>{label}</span>
            <input name={name} type={type} required={name !== "year"} />
          </label>
        ))}

        <label className="cms-field">
          <span>Homepage placement</span>
          <select name="visibility" defaultValue="PUBLIC">
            <option value="PUBLIC">Selected · 2-column grid + detail page</option>
            <option value="CONFIDENTIAL">Limited · 1 box per row (teaser)</option>
          </select>
        </label>

        <label className="cms-field" style={{ gridColumn: "1 / -1" }}>
          <span>Description</span>
          <textarea name="description" required rows={4} />
        </label>
      </div>

      <div className="cms-actions">
        <label className="cms-check">
          <input type="checkbox" name="published" />
          Publish now
        </label>
        <button type="submit" disabled={pending} className="cms-btn cms-btn-primary">
          {pending ? "Saving…" : "Create project"}
        </button>
      </div>

      {error ? (
        <p className="cms-error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}

export function ProjectList({ projects }: { projects: ProjectRow[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function togglePublished(project: ProjectRow) {
    setPendingId(project.id);
    await fetch(`/api/cms/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !project.published }),
    });
    setPendingId(null);
    router.refresh();
  }

  async function remove(project: ProjectRow) {
    if (!confirm(`Delete “${project.title}”?`)) return;
    setPendingId(project.id);
    await fetch(`/api/cms/projects/${project.id}`, { method: "DELETE" });
    setPendingId(null);
    router.refresh();
  }

  if (projects.length === 0) {
    return <p className="cms-empty">No projects yet — create the first one below.</p>;
  }

  return (
    <ul className="cms-project-list">
      {projects.map((project) => {
        const isPublic = project.visibility === "PUBLIC";
        return (
          <li
            key={project.id}
            className={`cms-project-card${isPublic ? " is-public" : " is-confidential"}`}
          >
            <div>
              <h3>{project.title}</h3>
              <p className="cms-project-meta">
                /{project.slug}
                {project.year ? ` · ${project.year}` : ""}
                {" · "}
                {isPublic ? "Selected · 2-col" : "Limited · 1-row"}
                {" · "}
                {project.published ? "published" : "draft"}
              </p>
            </div>
            <div className="cms-project-actions">
              <button
                type="button"
                disabled={pendingId === project.id}
                onClick={() => togglePublished(project)}
                className="cms-chip-btn"
              >
                {project.published ? "Unpublish" : "Publish"}
              </button>
              <button
                type="button"
                disabled={pendingId === project.id}
                onClick={() => remove(project)}
                className="cms-chip-btn is-danger"
              >
                Delete
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
