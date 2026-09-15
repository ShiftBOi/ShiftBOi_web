"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type ProjectRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  published: boolean;
  year: string | null;
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
    <form onSubmit={onSubmit} className="mt-10 max-w-xl space-y-4 border border-[var(--color-border-default)] p-5">
      <h2 className="text-[length:var(--font-size-2xl)]">New project</h2>
      {(
        [
          ["title", "Title", "text"],
          ["slug", "Slug", "text"],
          ["summary", "Summary", "text"],
          ["year", "Year", "text"],
        ] as const
      ).map(([name, label, type]) => (
        <label key={name} className="block">
          <span className="mb-2 block text-[length:var(--font-size-sm)] text-[var(--color-text-tertiary)]">
            {label}
          </span>
          <input
            name={name}
            type={type}
            required={name !== "year"}
            className="min-h-11 w-full border border-[var(--color-border-default)] bg-black px-3 text-[length:var(--font-size-lg)]"
          />
        </label>
      ))}
      <label className="block">
        <span className="mb-2 block text-[length:var(--font-size-sm)] text-[var(--color-text-tertiary)]">
          Description
        </span>
        <textarea
          name="description"
          required
          rows={4}
          className="w-full border border-[var(--color-border-default)] bg-black px-3 py-2 text-[length:var(--font-size-lg)]"
        />
      </label>
      <label className="flex items-center gap-2 text-[length:var(--font-size-md)]">
        <input type="checkbox" name="published" />
        Published
      </label>
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 bg-white px-5 text-black disabled:opacity-40"
      >
        {pending ? "Saving…" : "Create project"}
      </button>
      {error ? (
        <p className="text-[length:var(--font-size-md)] text-red-300" role="alert">
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
    return (
      <p className="mt-8 text-[length:var(--font-size-lg)] text-[var(--color-text-inverse)]">
        No projects yet.
      </p>
    );
  }

  return (
    <ul className="mt-8 divide-y divide-[var(--color-border-subtle)] border-t border-[var(--color-border-subtle)]">
      {projects.map((project) => (
        <li key={project.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
          <div>
            <p className="text-[length:var(--font-size-xl)]">{project.title}</p>
            <p className="text-[length:var(--font-size-sm)] text-[var(--color-text-tertiary)]">
              /{project.slug}
              {project.year ? ` · ${project.year}` : ""}
              {project.published ? " · published" : " · draft"}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              disabled={pendingId === project.id}
              onClick={() => togglePublished(project)}
              className="text-[length:var(--font-size-md)] text-[var(--color-text-inverse)] hover:text-white"
            >
              {project.published ? "Unpublish" : "Publish"}
            </button>
            <button
              type="button"
              disabled={pendingId === project.id}
              onClick={() => remove(project)}
              className="text-[length:var(--font-size-md)] text-red-300 hover:text-red-200"
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
